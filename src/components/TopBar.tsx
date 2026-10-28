import React from 'react';
import { ShieldCheck, Radio, BookOpen, Code2, Layers, RefreshCw, ExternalLink } from 'lucide-react';

export type ActiveTab = 'verifier' | 'builder' | 'guide' | 'relays' | 'spec';

interface TopBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onLoadTheButterZonePoc: () => void;
  onLoadBtcPoc: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  onLoadTheButterZonePoc,
  onLoadBtcPoc,
}) => {
  return (
    <header className="otc-header-bg px-4 py-2 rounded-t-sm shadow-xs border-b border-[#3e403c]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Pink Bitcoin logo & #bitcoin-otc title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onTabChange('verifier');
            }}
            className="flex items-center gap-2 text-white hover:text-[#edd400] transition-colors"
          >
            {/* Iconic Pink Bitcoin Logo */}
            <svg className="w-8 h-8 shrink-0 drop-shadow-xs" viewBox="0 0 36 36" fill="none" aria-label="Pink Bitcoin Logo">
              <circle cx="18" cy="18" r="18" fill="#FF5EAA" />
              <path
                d="M22.5 16.2c.4-.7.6-1.6.6-2.6 0-2.3-1.6-3.8-4.2-4.1V7h-1.8v2.4h-1.5V7h-1.8v2.5H10v2h1.8c.4 0 .7.3.7.7v11.6c0 .4-.3.7-.7.7H10v2h3.8V28h1.8v-2.1h1.5V28h1.8v-2.2c3.1-.3 5-2.1 5-4.8 0-2-.9-3.7-2.6-4.4v-.4zm-6.7-4.8h2.6c1.5 0 2.4.9 2.4 2.2 0 1.4-.9 2.3-2.4 2.3h-2.6v-4.5zm3.1 12.3h-3.1v-4.9h3.1c1.8 0 2.8 1 2.8 2.5s-1 2.4-2.8 2.4z"
                fill="#FFFFFF"
              />
            </svg>
            <span className="text-xl font-bold tracking-tight text-[#d3d7cf]">#bitcoin-otc</span>
          </a>
          <span className="text-[11px] text-[#babdb6] font-mono hidden sm:inline pl-1">
            wot · Kind 37773 Verifier
          </span>
        </div>

        {/* Right: Authentic yellow/gold links (#edd400) on gray button pills (#888a85) */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#d3d7cf]">
          <button
            onClick={() => onTabChange('verifier')}
            className={`otc-nav-btn ${activeTab === 'verifier' ? 'otc-nav-btn-active' : ''} cursor-pointer`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Proof Verifier</span>
          </button>

          <span className="text-[#888a85] select-none">|</span>

          <button
            onClick={() => onTabChange('builder')}
            className={`otc-nav-btn ${activeTab === 'builder' ? 'otc-nav-btn-active' : ''} cursor-pointer`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Builder</span>
          </button>

          <span className="text-[#888a85] select-none">|</span>

          <button
            onClick={() => onTabChange('guide')}
            className={`otc-nav-btn ${activeTab === 'guide' ? 'otc-nav-btn-active' : ''} cursor-pointer`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>UX Guide</span>
          </button>

          <span className="text-[#888a85] select-none">|</span>

          <button
            onClick={() => onTabChange('relays')}
            className={`otc-nav-btn ${activeTab === 'relays' ? 'otc-nav-btn-active' : ''} cursor-pointer`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Relays</span>
          </button>

          <span className="text-[#888a85] select-none">|</span>

          <button
            onClick={() => onTabChange('spec')}
            className={`otc-nav-btn ${activeTab === 'spec' ? 'otc-nav-btn-active' : ''} cursor-pointer`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Specification</span>
          </button>

          <span className="text-[#888a85] select-none">|</span>

          <a
            href="https://github.com/thebutterzone/nostr-kind-37773"
            target="_blank"
            rel="noopener noreferrer"
            title="View source code on GitHub"
            className="otc-nav-btn cursor-pointer"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3 text-[#edd400]" />
          </a>

          <div className="flex items-center gap-1 pl-2">
            <button
              onClick={onLoadTheButterZonePoc}
              title="Load TheButterZone PGP POC event"
              className="text-[11px] font-mono px-2 py-1 rounded bg-[#2e3436] hover:bg-[#1e2224] text-[#edd400] border border-[#555753] cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3 text-[#edd400]" />
              <span>PGP POC</span>
            </button>
            <button
              onClick={onLoadBtcPoc}
              title="Load sample Bitcoin signed message event"
              className="text-[11px] font-mono px-2 py-1 rounded bg-[#2e3436] hover:bg-[#1e2224] text-[#fce94f] border border-[#555753] cursor-pointer"
            >
              <span>BTC POC</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
