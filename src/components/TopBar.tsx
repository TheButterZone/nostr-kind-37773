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
      <div className="flex items-center gap-2.5 shrink-0">
        <a
          href="https://github.com/thebutterzone/nostr-kind-37773"
          target="_blank"
          rel="noopener noreferrer"
          title="View source code on GitHub (thebutterzone/nostr-kind-37773)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          <span className="hidden sm:inline">Source Code</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>

        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
          <button
            onClick={onLoadTheButterZonePoc}
            title="Load TheButterZone Bitcoin-OTC PGP POC event"
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
