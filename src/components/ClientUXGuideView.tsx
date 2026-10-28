import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info,
} from 'lucide-react';

export const ClientUXGuideView: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<'compliant' | 'violating' | 'minimal'>('compliant');

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header in authentic bitcoin-otc.com pink box style */}
      <div className="otc-pink-box">
        <h1 className="text-xl font-bold text-[#2e3436] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#204a87]" />
          <span>Client Implementation &amp; UX Compliance Sandbox</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#555753] mt-1.5 max-w-3xl leading-relaxed">
          Specification rules governing how Nostr clients (web &amp; mobile) MUST, SHOULD, and MAY present Kind 37773 Bitcoin-OTC Identity Linkage Proofs to prevent social-engineering deception.
        </p>
      </div>

      {/* Mode Selector */}
      <div className="bg-white rounded border border-[#cccccc] p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-bold text-[#2e3436] uppercase tracking-wider font-mono">
            Simulate Nostr Client Presentation Mode:
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedMode('compliant')}
              className={`px-3 py-1 text-xs font-semibold rounded border transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedMode === 'compliant'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold'
                  : 'otc-btn-light'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Compliant Client UX (Recommended)</span>
            </button>

            <button
              onClick={() => setSelectedMode('violating')}
              className={`px-3 py-1 text-xs font-semibold rounded border transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedMode === 'violating'
                  ? 'bg-red-100 text-red-900 border-red-400 font-bold'
                  : 'otc-btn-light'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-red-700" />
              <span>Misleading Client UX (Violation)</span>
            </button>

            <button
              onClick={() => setSelectedMode('minimal')}
              className={`px-3 py-1 text-xs font-semibold rounded border transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedMode === 'minimal'
                  ? 'bg-[#204a87] text-white border-[#163663] font-bold'
                  : 'otc-btn-light'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Minimal Inline UX</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Profile Card Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Visual Mock Profile Card */}
        <div className="bg-white rounded border border-[#cccccc] p-4 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#777777] pb-2 border-b border-[#eeeeec]">
            <span>Simulated Nostr Client Profile Card</span>
            <span className="font-mono text-[11px] text-[#204a87]">Ditto / Damus / Coracle / Primal view</span>
          </div>

          {/* User Profile Header */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded bg-[#555753] flex items-center justify-center text-[#edd400] font-bold text-base shrink-0 font-mono border border-[#3e403c]">
              TB
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[#2e3436]">TheButterZone</span>
                <span className="text-xs text-[#777777] font-mono">@thebutterzone</span>
              </div>
              <div className="text-xs text-[#204a87] font-mono mt-0.5 truncate font-semibold">
                npub19ctmsmtf9jtehddhctwmnacwqtnkh0p43tafttrgzdgy0wlppcpq50zf83
              </div>
              <p className="text-xs text-[#555753] mt-1 leading-relaxed">
                Bitcoin OTC trader and decentralization enthusiast. Kind 37773 Bitcoin-OTC proof holder.
              </p>
            </div>
          </div>

          {/* Identity Claims Presentation Area */}
          <div className="p-3.5 rounded bg-[#eeeeec] border border-[#d3d7cf] space-y-2.5">
            <div className="text-xs font-bold text-[#2e3436] uppercase tracking-wider font-mono">
              Linked Bitcoin-OTC Identity Proof (Kind 37773):
            </div>

            {selectedMode === 'compliant' && (
              <div className="space-y-2">
                {/* Compliant Row */}
                <div className="p-3 rounded border border-[#cccccc] bg-white space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#2e3436]">bitcoin-otc</span>
                      <span className="text-[#888a85]">·</span>
                      <span className="text-xs text-[#204a87] font-mono font-bold">thebutterzone</span>
                    </div>

                    <a
                      href="https://bitcoin-otc.com/viewratingdetail.php?nick=thebutterzone"
                      target="_blank"
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                      className="text-xs text-[#0000ee] hover:underline flex items-center gap-1"
                    >
                      <span>Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Dual Badges complying with SHOULD & MUST NOT */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Badge 1: Cryptographic check */}
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-400 text-xs font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Cryptographically Verified (PGP)</span>
                    </span>

                    {/* Badge 2: Registry distinction */}
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-xs">
                      <span>Self-Attested (Registry Unverified)</span>
                    </span>
                  </div>

                  <div className="text-[11px] text-[#555753] font-mono pt-1">
                    Key Fingerprint: C0A62F7AD5C16FB75A14A20D750A6640C5E4961B
                  </div>
                </div>
              </div>
            )}

            {selectedMode === 'violating' && (
              <div className="p-3 rounded border border-red-300 bg-red-50 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#2e3436]">bitcoin-otc</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#204a87] text-white text-[11px] font-bold">
                      <CheckCircle2 className="w-3 h-3 fill-current" />
                      <span>Official Bitcoin-OTC Verified Member</span>
                    </span>
                  </div>
                </div>
                <div className="text-xs text-red-900 bg-white p-2.5 rounded border border-red-300 leading-relaxed">
                  <strong>Protocol Violation:</strong> This badge misleads users into believing bitcoin-otc.com issued or confirmed this badge. A cryptographic PGP signature only proves possession of the private key—it does not prove registry endorsement unless an oracle or 2-way handshake guarantees it.
                </div>
              </div>
            )}

            {selectedMode === 'minimal' && (
              <div className="text-xs text-[#2e3436] space-y-1 font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-[#777777]">Proof:</span>
                  <span>bitcoin-otc: thebutterzone</span>
                  <span className="text-emerald-700 font-semibold">(PGP sig valid)</span>
                </div>
                <div className="flex items-center gap-2 text-[#777777]">
                  <span>Ref:</span>
                  <a
                    href="https://bitcoin-otc.com/viewratingdetail.php?nick=thebutterzone"
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="text-[#0000ee] hover:underline flex items-center gap-1 break-all"
                  >
                    <span>https://bitcoin-otc.com/viewratingdetail.php?nick=thebutterzone</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Spec Rules Breakdown in Pink Box */}
        <div className="otc-pink-box space-y-3">
          <h2 className="text-xs font-bold text-[#2e3436] uppercase tracking-wider flex items-center gap-2 font-mono">
            <Info className="w-4 h-4 text-[#204a87]" />
            <span>Specification Mandates</span>
          </h2>

          <div className="space-y-2.5">
            {/* Rule 1: MAY */}
            <div className="p-3 rounded bg-white border border-[#f6bed1] space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                <span className="px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 font-bold">Clients MAY</span>
              </div>
              <ul className="text-xs text-[#555753] space-y-1 list-disc list-inside">
                <li>Indicate that the cryptographic signature was successfully verified.</li>
                <li>Display the claimed external identity.</li>
                <li>Display the proof method (PGP or BTC).</li>
                <li>Link to the external reference specified by the <code className="text-[#204a87] font-mono">uri</code> tag.</li>
                <li>Allow filtering or searching by external identity.</li>
              </ul>
            </div>

            {/* Rule 2: SHOULD */}
            <div className="p-3 rounded bg-white border border-[#f6bed1] space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-300 font-bold">Clients SHOULD</span>
              </div>
              <p className="text-xs text-[#555753] leading-relaxed">
                Distinguish between successful cryptographic verification and validation of an external identity.
              </p>
            </div>

            {/* Rule 3: MUST NOT */}
            <div className="p-3 rounded bg-white border border-[#f6bed1] space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-red-900">
                <span className="px-2 py-0.5 rounded bg-red-100 border border-red-300 font-bold">Clients MUST NOT</span>
              </div>
              <p className="text-xs text-[#555753] leading-relaxed">
                Present the external identity as verified by an external registry unless another protocol layer provides that guarantee.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* External Registry Verification */}
      <div className="bg-white rounded border border-[#cccccc] p-4 space-y-2.5 shadow-xs">
        <h2 className="text-xs font-bold text-[#2e3436] uppercase tracking-wider font-mono">
          External Registry Verification
        </h2>
        <div className="space-y-2 text-xs text-[#2e3436] leading-relaxed">
          <p>
            Kind 37773 cryptographically links a Nostr public key to an external key or address, but does not inherently attest that the external registry has associated that key with the claimed identifier.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-[#555753]">
            <li>
              Clients <strong className="text-red-700">MUST NOT</strong> query external HTTP endpoints during feed or profile rendering, preventing user IP address leakage and unauthenticated network dependencies.
            </li>
            <li>
              External registry validation <strong className="text-amber-800">SHOULD</strong> be performed out-of-band by independent indexers or attestation layers (e.g., NIP-32) publishing on-relay events.
            </li>
            <li>
              For oracles, indexers, and archival verification, Bitcoin-OTC publishes machine-readable registration records (Key ID, PGP fingerprint, Bitcoin address, and registration timestamp) at:
              <div className="mt-1 pl-4 font-mono text-[11px] text-[#204a87] break-all select-all bg-[#fafafa] p-2 rounded border border-[#d3d7cf]">
                https://bitcoin-otc.com/viewgpg.php?nick=&lt;nick&gt;&amp;outformat=json
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
