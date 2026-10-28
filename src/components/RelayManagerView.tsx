import React, { useState } from 'react';
import {
  Radio,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { relayPool } from '../lib/relayPool';
import { NostrEvent, RelayStatus } from '../types/nostr';

interface RelayManagerViewProps {
  onLoadEvent: (event: NostrEvent) => void;
  onNavigateToVerifier: () => void;
}

export const RelayManagerView: React.FC<RelayManagerViewProps> = ({
  onLoadEvent,
  onNavigateToVerifier,
}) => {
  const [relays, setRelays] = useState<RelayStatus[]>(relayPool.getRelays());
  const [newRelayUrl, setNewRelayUrl] = useState('');
  const [testingRelay, setTestingRelay] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { connected: boolean; latencyMs?: number; error?: string }>>({});
  
  // Relay Query State
  const [searchPubkey, setSearchPubkey] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queriedEvents, setQueriedEvents] = useState<NostrEvent[]>([]);
  const [queryStatus, setQueryStatus] = useState<string | null>(null);

  const refreshList = () => {
    setRelays([...relayPool.getRelays()]);
  };

  const handleAddRelay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRelayUrl.trim()) return;
    const added = relayPool.addRelay(newRelayUrl.trim());
    if (added) {
      setNewRelayUrl('');
      refreshList();
    }
  };

  const handleRemoveRelay = (url: string) => {
    relayPool.removeRelay(url);
    refreshList();
  };

  const handleToggleRelay = (url: string, enabled: boolean) => {
    relayPool.toggleRelay(url, enabled);
    refreshList();
  };

  const handleTestRelay = async (url: string) => {
    setTestingRelay(url);
    const res = await relayPool.testRelay(url);
    setTestResults((prev) => ({ ...prev, [url]: res }));
    setTestingRelay(null);
  };

  const handleTestAll = async () => {
    for (const r of relays) {
      handleTestRelay(r.url);
    }
  };

  const handleQueryRelays = async () => {
    setIsQuerying(true);
    setQueryStatus('Querying connected relays for Kind 37773 events...');
    setQueriedEvents([]);

    try {
      const filters: any = { kinds: [37773], limit: 20 };
      if (searchPubkey.trim()) {
        filters.authors = [searchPubkey.trim().toLowerCase()];
      }

      const events = await relayPool.queryEvents(filters, (ev) => {
        setQueriedEvents((prev) => [...prev.filter((p) => p.id !== ev.id), ev]);
      });

      setQueryStatus(`Found ${events.length} Kind 37773 Bitcoin-OTC proof(s).`);
    } catch (err) {
      setQueryStatus(`Query failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Pink Box Header */}
      <div className="otc-pink-box">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#2e3436] flex items-center gap-2">
              <Radio className="w-5 h-5 text-[#204a87]" />
              <span>Nostr Relay Pool &amp; Network Explorer</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#555753] mt-1">
              Active WebSocket endpoints used for broadcasting Kind 37773 Bitcoin-OTC Identity Linkage Proofs and querying proofs across the decentralized network.
            </p>
          </div>

          <button
            onClick={handleTestAll}
            className="otc-btn-gold text-xs shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#edd400]" />
            <span>Test All Relays</span>
          </button>
        </div>
      </div>

      {/* Add Custom Relay Form */}
      <div className="bg-white rounded border border-[#cccccc] p-4 shadow-xs">
        <h2 className="text-xs font-bold text-[#2e3436] uppercase tracking-wider mb-2 font-mono">
          Add Custom Relay
        </h2>
        <form onSubmit={handleAddRelay} className="flex gap-2">
          <input
            type="text"
            value={newRelayUrl}
            onChange={(e) => setNewRelayUrl(e.target.value)}
            placeholder="wss://relay.example.com"
            className="flex-1 px-3 py-1.5 bg-[#fafafa] border border-[#cccccc] rounded text-xs font-mono text-[#2e3436] focus:outline-none focus:border-[#204a87]"
          />
          <button
            type="submit"
            className="otc-btn-gold text-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-[#edd400]" />
            <span>Add Relay</span>
          </button>
        </form>
      </div>

      {/* Relays Table */}
      <div className="bg-white rounded border border-[#cccccc] overflow-hidden shadow-xs">
        <div className="px-4 py-2 border-b border-[#3e403c] bg-[#555753] flex items-center justify-between text-xs font-mono text-[#d3d7cf]">
          <span>Active Relay Roster ({relays.filter((r) => r.enabled).length} Enabled)</span>
          <span>Status &amp; Latency</span>
        </div>

        <div className="overflow-x-auto">
          <table className="otc-table">
            <thead>
              <tr>
                <th className="w-12 text-center">Use</th>
                <th>Relay WebSocket URL</th>
                <th className="w-32">Type</th>
                <th className="w-32 text-center">Latency / Status</th>
                <th className="w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {relays.map((relay) => {
                const test = testResults[relay.url];
                const isTesting = testingRelay === relay.url;

                return (
                  <tr key={relay.url}>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={relay.enabled}
                        onChange={(e) => handleToggleRelay(relay.url, e.target.checked)}
                        className="w-4 h-4 rounded border-[#cccccc] text-[#204a87] cursor-pointer"
                      />
                    </td>
                    <td className="font-mono font-semibold">{relay.url}</td>
                    <td className="text-[11px] text-[#555753]">
                      {relay.isDefault ? 'Default Protocol Relay' : 'Custom Added'}
                    </td>
                    <td className="text-center font-mono">
                      {test ? (
                        test.connected ? (
                          <span className="text-emerald-700 font-bold flex items-center justify-center gap-1 tabular-nums">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{test.latencyMs}ms</span>
                          </span>
                        ) : (
                          <span className="text-red-700 font-bold flex items-center justify-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            <span>Offline</span>
                          </span>
                        )
                      ) : (
                        <span className="text-[#888a85]">Untested</span>
                      )}
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleTestRelay(relay.url)}
                          disabled={isTesting}
                          className="otc-btn-gray p-1"
                          title="Test Handshake"
                        >
                          <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                        </button>

                        {!relay.isDefault && (
                          <button
                            onClick={() => handleRemoveRelay(relay.url)}
                            className="otc-btn-gray p-1 hover:bg-red-700 hover:text-white"
                            title="Remove Relay"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Query Kind 37773 from Relays */}
      <div className="bg-white rounded border border-[#cccccc] p-4 space-y-3 shadow-xs">
        <h2 className="text-xs font-bold text-[#2e3436] uppercase tracking-wider flex items-center gap-2 font-mono">
          <Search className="w-4 h-4 text-[#204a87]" />
          <span>Query Kind 37773 Events from Connected Relays</span>
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchPubkey}
            onChange={(e) => setSearchPubkey(e.target.value)}
            placeholder="Optional Author hex pubkey or leave blank to query recent claims"
            className="flex-1 px-3 py-1.5 bg-[#fafafa] border border-[#cccccc] rounded text-xs font-mono text-[#2e3436] focus:outline-none focus:border-[#204a87]"
          />
          <button
            onClick={handleQueryRelays}
            disabled={isQuerying}
            className="otc-btn-gold text-xs shrink-0"
          >
            <Search className={`w-3.5 h-3.5 ${isQuerying ? 'animate-spin' : ''}`} />
            <span>{isQuerying ? 'Querying...' : 'Fetch Claims'}</span>
          </button>
        </div>

        {queryStatus && (
          <div className="text-xs text-[#555753] font-mono">
            {queryStatus}
          </div>
        )}

        {queriedEvents.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-[#2e3436] font-mono">
              Fetched Events:
            </div>
            {queriedEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-3 bg-[#eeeeec] rounded border border-[#d3d7cf] flex items-center justify-between text-xs"
              >
                <div className="min-w-0">
                  <div className="font-mono text-[#204a87] font-bold truncate">
                    {ev.tags.find((t) => t[0] === 'd')?.[1] || 'No d tag'}
                  </div>
                  <div className="text-[11px] text-[#555753] font-mono truncate">
                    Author: {ev.pubkey.slice(0, 16)}... · ID: {ev.id.slice(0, 16)}...
                  </div>
                </div>

                <button
                  onClick={() => {
                    onLoadEvent(ev);
                    onNavigateToVerifier();
                  }}
                  className="otc-btn-gold text-xs shrink-0"
                >
                  Load in Verifier
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
