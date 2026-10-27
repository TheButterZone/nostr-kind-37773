import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info,
  Code,
  Sparkles,
} from 'lucide-react';

export const ClientUXGuideView: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<'compliant' | 'violating' | 'minimal'>('compliant');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 p-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-purple-400" />
          <span>Client Implementation &amp; UX Compliance Sandbox</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Specification rules governing how Nostr clients (web &amp; mobile) MUST, SHOULD, and MAY present Kind 37773 Bitcoin-OTC Identity Linkage Proofs to prevent social-engineering deception.
        </p>
      </div>

      {/* Mode Selector */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Simulate Nostr Client Presentation Mode:
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedMode('compliant')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedMode === 'compliant'
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Compliant Client UX (Recommended)</span>
            </button>

            <button
              onClick={() => setSelectedMode('violating')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedMode === 'violating'
                  ? 'bg-red-950/60 text-red-300 border-red-600'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Misleading Client UX (Violation)</span>
            </button>

            <button
              onClick={() => setSelectedMode('minimal')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedMode === 'minimal'
                  ? 'bg-purple-950/60 text-purple-300 border-purple-600'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Minimal Inline UX</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Profile Card Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Mock Profile Card */}
        <div className="bg-[#111827] rounded-xl border border-slate-800 p-6 space-y-5">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800">
            <span>Simulated Nostr Client Profile Card</span>
            <span className="font-mono text-[11px] text-purple-400">Ditto / Damus / Coracle / Primal view</span>
          </div>

          {/* User Profile Header */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md">
              TB
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">TheButterZone</span>
                <span className="text-xs text-slate-400 font-mono">@thebutterzone</span>
              </div>
              <div className="text-xs text-purple-400 font-mono mt-0.5 truncate">
                npub19ctmsmtf9jtehddhctwmnacwqtnkh0p43tafttrgzdgy0wlppcpq50zf83
              </div>
              <p className="text-xs text-slate-300 mt-2">
                Bitcoin OTC trader and decentralization enthusiast. Kind 37773 Bitcoin-OTC proof holder.
              </p>
            </div>
          </div>

          {/* Identity Claims Presentation Area */}
          <div className="p-4 rounded-xl bg-[#0B0F17] border border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Linked Bitcoin-OTC Identity Proof (Kind 37773):
            </div>

            {selectedMode === 'compliant' && (
              <div className="space-y-2.5">
                {/* Compliant Row */}
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">bitcoin-otc</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-xs text-purple-300 font-mono">thebutterzone</span>
                    </div>

                    <a
                      href="https://bitcoin-otc.com/viewratingdetail.php?nick=thebutterzone"
                      target="_blank"
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      <span>Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Dual Badges complying with SHOULD & MUST NOT */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Badge 1: Cryptographic check */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-xs font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cryptographically Verified (PGP)</span>
                    </span>

                    {/* Badge 2: Registry distinction */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/60 text-amber-300 border border-amber-800/50 text-xs">
                      <span>Self-Attested (Registry Unverified)</span>
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono pt-1">
                    Key Fingerprint: C0A62F7AD5C16FB75A14A20D750A6640C5E4961B
                  </div>
                </div>
              </div>
            )}

            {selectedMode === 'violating' && (
              <div className="p-3 rounded-lg border border-red-800/80 bg-red-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">bitcoin-otc</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-bold">
                      <CheckCircle2 className="w-3 h-3 fill-current" />
                      <span>Official Bitcoin-OTC Verified Member</span>
                    </span>
                  </div>
                </div>
                <div className="text-xs text-red-300 bg-red-950/50 p-2.5 rounded border border-red-800/60 leading-relaxed">
                  <strong>Protocol Violation:</strong> This badge misleads users into believing bitcoin-otc.com issued or confirmed this badge. A cryptographic PGP signature only proves possession of the private key—it does not prove registry endorsement unless an oracle or 2-way handshake guarantees it.
                </div>
              </div>
            )}

            {selectedMode === 'minimal' && (
              <div className="text-xs text-slate-300 space-y-1 font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Proof:</span>
                  <span>bitcoin-otc: thebutterzone</span>
                  <span className="text-emerald-400">(PGP sig valid)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <span>Ref:</span>
                  <a
                    href="https://bitcoin-otc.com/viewratingdetail.php?nick=thebutterzone"
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="text-purple-400 hover:underline flex items-center gap-1 break-all"
                  >
                    <span>https://bitcoin-otc.com/viewratingdetail.php?nick=thebutterzone</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Spec Rules Breakdown */}
        <div className="bg-[#111827] rounded-xl border border-slate-800 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-400" />
            <span>Specification Mandates</span>
          </h2>

          <div className="space-y-4">
            {/* Rule 1: MAY */}
            <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">Clients MAY</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li>Indicate that the cryptographic signature was successfully verified.</li>
                <li>Display the claimed external identity.</li>
                <li>Display the proof method (PGP or BTC).</li>
                <li>Link to the external reference specified by the <code className="text-purple-300">uri</code> tag.</li>
                <li>Allow filtering or searching by external identity.</li>
              </ul>
            </div>

            {/* Rule 2: SHOULD */}
            <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-800">Clients SHOULD</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Distinguish between successful cryptographic verification and validation of an external identity.
              </p>
            </div>

            {/* Rule 3: MUST NOT */}
            <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-red-400">
                <span className="px-2 py-0.5 rounded bg-red-950 border border-red-800">Clients MUST NOT</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Present the external identity as verified by an external registry unless another protocol layer provides that guarantee.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* External Registry Verification */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          External Registry Verification
        </h2>
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            Kind 37773 cryptographically links a Nostr public key to an external key or address, but does not inherently attest that the external registry has associated that key with the claimed identifier.
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-400">
            <li>
              Clients <strong className="text-red-400">MUST NOT</strong> query external HTTP endpoints during feed or profile rendering, preventing user IP address leakage and unauthenticated network dependencies.
            </li>
            <li>
              External registry validation <strong className="text-amber-400">SHOULD</strong> be performed out-of-band by independent indexers or attestation layers (e.g., NIP-32) publishing on-relay events.
            </li>
            <li>
              For oracles, indexers, and archival verification, Bitcoin-OTC publishes machine-readable registration records (Key ID, PGP fingerprint, Bitcoin address, and registration timestamp) at:
              <div className="mt-1.5 pl-5 font-mono text-[11px] text-purple-300 break-all select-all bg-[#0B0F17] p-2.5 rounded border border-slate-800">
                https://bitcoin-otc.com/viewgpg.php?nick=&lt;nick&gt;&amp;outformat=json
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
