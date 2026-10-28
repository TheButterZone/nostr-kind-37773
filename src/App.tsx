import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { TopBar, ActiveTab } from './components/TopBar';
import { VerifierView } from './components/VerifierView';
import { ClaimBuilderView } from './components/ClaimBuilderView';
import { ClientUXGuideView } from './components/ClientUXGuideView';
import { RelayManagerView } from './components/RelayManagerView';
import { SpecRationaleView } from './components/SpecRationaleView';
import { THEBUTTERZONE_POC_EVENT, SAMPLE_BTC_POC_EVENT } from './lib/constants';
import { NostrEvent } from './types/nostr';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('verifier');
  const [currentEvent, setCurrentEvent] = useState<NostrEvent>(THEBUTTERZONE_POC_EVENT);

  const handleLoadTheButterZonePoc = () => {
    setCurrentEvent(THEBUTTERZONE_POC_EVENT);
    setActiveTab('verifier');
  };

  const handleLoadBtcPoc = () => {
    setCurrentEvent(SAMPLE_BTC_POC_EVENT);
    setActiveTab('verifier');
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans selection:bg-purple-900/60 selection:text-purple-200">
      {/* Top Navigation Bar adhering to Top Bar Contract */}
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLoadTheButterZonePoc={handleLoadTheButterZonePoc}
        onLoadBtcPoc={handleLoadBtcPoc}
      />

      {/* Main Viewport Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'verifier' && (
          <VerifierView
            currentEvent={currentEvent}
            onUpdateEvent={setCurrentEvent}
          />
        )}

        {activeTab === 'builder' && (
          <ClaimBuilderView
            onEventCreated={(ev) => setCurrentEvent(ev)}
            onNavigateToVerifier={() => setActiveTab('verifier')}
          />
        )}

        {activeTab === 'guide' && <ClientUXGuideView />}

        {activeTab === 'relays' && (
          <RelayManagerView
            onLoadEvent={(ev) => setCurrentEvent(ev)}
            onNavigateToVerifier={() => setActiveTab('verifier')}
          />
        )}

        {activeTab === 'spec' && <SpecRationaleView />}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0A0D14] py-6 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Kind 37773</span>
            <span aria-hidden="true">·</span>
            <span>Bitcoin-OTC Identity Linkage Proof</span>
            <span aria-hidden="true">·</span>
            <span>nsite-ready (Client-Side Standalone)</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <a
              href="https://github.com/thebutterzone/nostr-kind-37773"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-400 transition-colors flex items-center gap-1.5"
            >
              <span>Source Code (GitHub)</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
            <button
              onClick={() => setActiveTab('spec')}
              className="hover:text-purple-400 transition-colors cursor-pointer"
            >
              Specification
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className="hover:text-purple-400 transition-colors cursor-pointer"
            >
              UX Rules
            </button>
            <button
              onClick={() => setActiveTab('relays')}
              className="hover:text-purple-400 transition-colors cursor-pointer"
            >
              Relays
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
