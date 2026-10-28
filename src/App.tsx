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

  const getBreadcrumbLabel = () => {
    switch (activeTab) {
      case 'verifier':
        return 'Proof Verifier';
      case 'builder':
        return 'Claim Builder';
      case 'guide':
        return 'Client UX Compliance Guide';
      case 'relays':
        return 'Relay Manager';
      case 'spec':
        return 'Specification Rationale';
      default:
        return 'Proof Verifier';
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#2e3436] flex flex-col font-sans">
      {/* Top Header matching bitcoin-otc.com #header with #555753 charcoal & #edd400 gold font */}
      <div className="w-full bg-[#555753] border-b border-[#3e403c]">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <TopBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLoadTheButterZonePoc={handleLoadTheButterZonePoc}
            onLoadBtcPoc={handleLoadBtcPoc}
          />
        </div>
      </div>

      {/* Breadcrumbs Ribbon directly beneath top bar matching bitcoin-otc.com layout */}
      <div className="w-full bg-white border-b border-[#cccccc]">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center gap-1.5 text-[11px] text-[#777777]">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('verifier');
            }}
            className="hover:underline text-[#0000ee]"
          >
            Home
          </a>
          <span className="text-[#888a85]">&gt;</span>
          <span className="text-[#888a85]">Web of Trust</span>
          <span className="text-[#888a85]">&gt;</span>
          <span className="font-semibold text-[#2e3436]">{getBreadcrumbLabel()}</span>
        </div>
      </div>

      {/* Main Viewport Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 sm:py-6">
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

      {/* Authentic Utilitarian Footer matching bitcoin-otc.com */}
      <footer className="otc-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-[#777777]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-[#2e3436]">Kind 37773</span>
            <span>·</span>
            <span>#bitcoin-otc Web of Trust Identity Linkage Proof</span>
            <span>·</span>
            <span className="font-mono">nsite verifier</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span>Theme: <a href="https://bitcoin-otc.com/" target="_blank" rel="noopener noreferrer">bitcoin-otc.com</a></span>
            <span className="text-[#cccccc]">|</span>
            <a
              href="https://github.com/thebutterzone/nostr-kind-37773"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:underline"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 text-[#888a85]" />
            </a>
            <span className="text-[#cccccc]">|</span>
            <span className="font-mono">Donations: 1F1dPZxdxVVigpGdsafnZ3cFBdMGDADFDe</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
