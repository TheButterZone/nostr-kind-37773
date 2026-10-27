import React, { useState, useEffect } from 'react';
import {
  Radio,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-purple-400" />
              <span>Nostr Relay Pool &amp; Explorer</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Active WebSocket endpoints used for broadcasting Kind 37773 Bitcoin-OTC Identity Linkage Proofs and querying proofs across the decentralized network.
            </p>
          </div>

          <button
            onClick={handleTestAll}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
            <span>Test All Relays</span>
          </button>
        </div>
      </div>

      {/* Add Custom Relay Form */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 p-6">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">
          Add Custom Relay
        </h2>
        <form onSubmit={handleAddRelay} className="flex gap-3">
          <input
            type="text"
            value={newRelayUrl}
            onChange={(e) => setNewRelayUrl(e.target.value)}
            placeholder="wss://relay.example.com"
            className="flex-1 px-4 py-2 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Relay</span>
          </button>
        </form>
      </div>

      {/* Relays List */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-800 bg-[#0E1524] flex items-center justify-between text-xs text-slate-400">
          <span>Active Relay Roster ({relays.filter((r) => r.enabled).length} Enabled)</span>
          <span>Status &amp; Latency</span>
        </div>

        <div className="divide-y divide-slate-800">
          {relays.map((relay) => {
            const test = testResults[relay.url];
            const isTesting = testingRelay === relay.url;

            return (
              <div
                key={relay.url}
                className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={relay.enabled}
                    onChange={(e) => handleToggleRelay(relay.url, e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-0 cursor-pointer"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-medium text-slate-200 truncate">
                      {relay.url}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {relay.isDefault ? 'Default Protocol Relay' : 'Custom Added'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {test && (
                    <div className="text-xs font-mono">
                      {test.connected ? (
                        <span className="text-emerald-400 flex items-center gap-1 tabular-nums">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{test.latencyMs}ms</span>
                        </span>
                      ) : (
                        <span className="text-red-400 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Offline</span>
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => handleTestRelay(relay.url)}
                    disabled={isTesting}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    title="Test Handshake"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  </button>

                  {!relay.isDefault && (
                    <button
                      onClick={() => handleRemoveRelay(relay.url)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      title="Remove Relay"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Query Kind 37773 from Relays */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Search className="w-4 h-4 text-purple-400" />
          <span>Query Kind 37773 Events from Connected Relays</span>
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={searchPubkey}
            onChange={(e) => setSearchPubkey(e.target.value)}
            placeholder="Optional Author hex pubkey or leave blank to query recent claims"
            className="flex-1 px-4 py-2 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleQueryRelays}
            disabled={isQuerying}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Search className={`w-4 h-4 ${isQuerying ? 'animate-spin' : ''}`} />
            <span>{isQuerying ? 'Querying...' : 'Fetch Claims'}</span>
          </button>
        </div>

        {queryStatus && (
          <div className="text-xs text-slate-400 font-mono">
            {queryStatus}
          </div>
        )}

        {queriedEvents.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold text-slate-300">
              Fetched Events:
            </div>
            {queriedEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-3 bg-[#0B0F17] rounded-lg border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="min-w-0">
                  <div className="font-mono text-purple-300 truncate">
                    {ev.tags.find((t) => t[0] === 'd')?.[1] || 'No d tag'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">
                    Author: {ev.pubkey.slice(0, 16)}... · ID: {ev.id.slice(0, 16)}...
                  </div>
                </div>

                <button
                  onClick={() => {
                    onLoadEvent(ev);
                    onNavigateToVerifier();
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium transition-colors cursor-pointer shrink-0"
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
