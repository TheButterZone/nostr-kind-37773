import React from 'react';
import { ShieldCheck, Radio, BookOpen, Code2, Layers, RefreshCw } from 'lucide-react';

export type ActiveTab = 'verifier' | 'builder' | 'guide' | 'relays' | 'spec';

interface TopBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onLoadButterzonePoc: () => void;
  onLoadBtcPoc: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  onLoadButterzonePoc,
  onLoadBtcPoc,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0D131F]/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40">
      {/* Zone 1: Brand wordmark (single element) */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onTabChange('verifier');
          }}
          className="text-lg font-bold tracking-tight text-white hover:text-purple-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block shadow-sm shadow-purple-500/50" />
          <span>Kind 37773 · nsite</span>
        </a>
        <span className="text-xs text-slate-400 font-mono hidden sm:inline px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/60">
          Bitcoin-OTC Identity Linkage Proof
        </span>
      </div>

      {/* Zone 2: Single-line navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => onTabChange('verifier')}
          className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
            activeTab === 'verifier'
              ? 'text-purple-400 border-b-2 border-purple-400 font-semibold'
              : 'hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Proof Verifier
        </button>

        <button
          onClick={() => onTabChange('builder')}
          className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
            activeTab === 'builder'
              ? 'text-purple-400 border-b-2 border-purple-400 font-semibold'
              : 'hover:text-white'
          }`}
        >
          <Code2 className="w-4 h-4" />
          Proof Builder &amp; Publisher
        </button>

        <button
          onClick={() => onTabChange('guide')}
          className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
            activeTab === 'guide'
              ? 'text-purple-400 border-b-2 border-purple-400 font-semibold'
              : 'hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          Client UX Guidelines
        </button>

        <button
          onClick={() => onTabChange('relays')}
          className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
            activeTab === 'relays'
              ? 'text-purple-400 border-b-2 border-purple-400 font-semibold'
              : 'hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4" />
          Relay Network
        </button>

        <button
          onClick={() => onTabChange('spec')}
          className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
            activeTab === 'spec'
              ? 'text-purple-400 border-b-2 border-purple-400 font-semibold'
              : 'hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Specification
        </button>
      </nav>

      {/* Zone 3: Primary action button & POC quick-loaders */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
          <button
            onClick={onLoadButterzonePoc}
            title="Load ButterZone Bitcoin-OTC PGP POC event"
            className="px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-700/60 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-purple-400" />
            <span>Load PGP POC</span>
          </button>
          <button
            onClick={onLoadBtcPoc}
            title="Load sample Bitcoin signed message proof event"
            className="px-2.5 py-1.5 text-xs font-medium text-amber-300 hover:text-amber-200 hover:bg-slate-700/60 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <span>BTC POC</span>
          </button>
        </div>
      </div>
    </header>
  );
};
