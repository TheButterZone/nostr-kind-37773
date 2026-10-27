import { NostrEvent, RelayPublishResult, RelayStatus } from '../types/nostr';
import { DEFAULT_RELAYS } from './constants';

export class RelayPoolManager {
  private relays: Map<string, RelayStatus> = new Map();

  constructor(initialRelays: string[] = DEFAULT_RELAYS) {
    initialRelays.forEach((url) => {
      this.relays.set(url, {
        url,
        isDefault: DEFAULT_RELAYS.includes(url),
        enabled: true,
        connected: false,
        connecting: false,
      });
    });
  }

  public getRelays(): RelayStatus[] {
    return Array.from(this.relays.values());
  }

  public addRelay(url: string): boolean {
    const trimmed = url.trim();
    if (!trimmed.startsWith('wss://') && !trimmed.startsWith('ws://')) {
      return false;
    }
    if (this.relays.has(trimmed)) {
      return false;
    }
    this.relays.set(trimmed, {
      url: trimmed,
      isDefault: DEFAULT_RELAYS.includes(trimmed),
      enabled: true,
      connected: false,
      connecting: false,
    });
    return true;
  }

  public removeRelay(url: string): void {
    this.relays.delete(url);
  }

  public toggleRelay(url: string, enabled: boolean): void {
    const existing = this.relays.get(url);
    if (existing) {
      existing.enabled = enabled;
    }
  }

  public async testRelay(url: string): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
    const startTime = Date.now();
    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(url);
        const timer = setTimeout(() => {
          try {
            ws.close();
          } catch {}
          resolve({ connected: false, error: 'Connection timeout (5s)' });
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timer);
          const latencyMs = Date.now() - startTime;
          try {
            ws.close();
          } catch {}
          resolve({ connected: true, latencyMs });
        };

        ws.onerror = () => {
          clearTimeout(timer);
          resolve({ connected: false, error: 'WebSocket handshake failed' });
        };
      } catch (err) {
        resolve({ connected: false, error: err instanceof Error ? err.message : String(err) });
      }
    });
  }

  public async publishEvent(
    event: NostrEvent,
    onProgress?: (result: RelayPublishResult) => void
  ): Promise<RelayPublishResult[]> {
    const activeRelays = Array.from(this.relays.values()).filter((r) => r.enabled);
    const results: RelayPublishResult[] = [];

    const publishToSingleRelay = (relayUrl: string): Promise<RelayPublishResult> => {
      return new Promise((resolve) => {
        let ws: WebSocket | null = null;
        let finished = false;

        const complete = (res: RelayPublishResult) => {
          if (finished) return;
          finished = true;
          if (ws) {
            try {
              ws.close();
            } catch {}
          }
          if (onProgress) onProgress(res);
          resolve(res);
        };

        const timer = setTimeout(() => {
          complete({
            relay: relayUrl,
            success: false,
            accepted: false,
            reason: 'Relay response timed out (8s)',
            timestamp: Date.now(),
          });
        }, 8000);

        try {
          ws = new WebSocket(relayUrl);

          ws.onopen = () => {
            const msg = JSON.stringify(['EVENT', event]);
            ws!.send(msg);
          };

          ws.onmessage = (msgEvent) => {
            try {
              const data = JSON.parse(msgEvent.data);
              if (Array.isArray(data) && data[0] === 'OK' && data[1] === event.id) {
                clearTimeout(timer);
                const accepted = Boolean(data[2]);
                const reason = typeof data[3] === 'string' ? data[3] : '';
                complete({
                  relay: relayUrl,
                  success: true,
                  accepted,
                  reason: accepted ? 'Event accepted by relay' : (reason || 'Rejected by relay policy'),
                  timestamp: Date.now(),
                });
              } else if (Array.isArray(data) && data[0] === 'NOTICE') {
                // Keep listening for OK, but note notice
              }
            } catch {
              // Ignore non-json or unparsed frames
            }
          };

          ws.onerror = () => {
            clearTimeout(timer);
            complete({
              relay: relayUrl,
              success: false,
              accepted: false,
              reason: 'Connection error during publish',
              timestamp: Date.now(),
            });
          };

          ws.onclose = (e) => {
            if (!finished) {
              clearTimeout(timer);
              complete({
                relay: relayUrl,
                success: false,
                accepted: false,
                reason: e.reason || 'Relay connection closed prematurely',
                timestamp: Date.now(),
              });
            }
          };
        } catch (err) {
          clearTimeout(timer);
          complete({
            relay: relayUrl,
            success: false,
            accepted: false,
            reason: err instanceof Error ? err.message : String(err),
            timestamp: Date.now(),
          });
        }
      });
    };

    const promises = activeRelays.map((r) => publishToSingleRelay(r.url));
    const allResults = await Promise.all(promises);
    return allResults;
  }

  public async queryEvents(
    filters: { kinds?: number[]; authors?: string[]; '#d'?: string[]; limit?: number },
    onEvent?: (event: NostrEvent) => void
  ): Promise<NostrEvent[]> {
    const activeRelays = Array.from(this.relays.values()).filter((r) => r.enabled);
    const seenEvents = new Map<string, NostrEvent>();
    const subId = `sub_${Math.random().toString(36).slice(2, 9)}`;

    const querySingle = (relayUrl: string): Promise<void> => {
      return new Promise((resolve) => {
        let ws: WebSocket | null = null;
        const timer = setTimeout(() => {
          try {
            ws?.close();
          } catch {}
          resolve();
        }, 6000);

        try {
          ws = new WebSocket(relayUrl);
          ws.onopen = () => {
            ws!.send(JSON.stringify(['REQ', subId, filters]));
          };

          ws.onmessage = (msgEvent) => {
            try {
              const data = JSON.parse(msgEvent.data);
              if (Array.isArray(data)) {
                if (data[0] === 'EVENT' && data[1] === subId && data[2]?.id) {
                  const ev = data[2] as NostrEvent;
                  if (!seenEvents.has(ev.id)) {
                    seenEvents.set(ev.id, ev);
                    if (onEvent) onEvent(ev);
                  }
                } else if (data[0] === 'EOSE' && data[1] === subId) {
                  clearTimeout(timer);
                  try {
                    ws?.close();
                  } catch {}
                  resolve();
                }
              }
            } catch {}
          };

          ws.onerror = () => {
            clearTimeout(timer);
            resolve();
          };

          ws.onclose = () => {
            clearTimeout(timer);
            resolve();
          };
        } catch {
          clearTimeout(timer);
          resolve();
        }
      });
    };

    await Promise.all(activeRelays.map((r) => querySingle(r.url)));
    return Array.from(seenEvents.values());
  }
}

export const relayPool = new RelayPoolManager();
