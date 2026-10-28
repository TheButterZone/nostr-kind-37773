import React from 'react';
import { BookOpen, Layers, CheckCircle2, ShieldAlert, Cpu, ExternalLink } from 'lucide-react';
import { THEBUTTERZONE_POC_EVENT } from '../lib/constants';

export const SpecRationaleView: React.FC = () => {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Pink Box Header */}
      <div className="otc-pink-box">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-[#2e3436] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#204a87]" />
            <span>Kind 37773: Bitcoin-OTC Identity Linkage Proof</span>
          </h1>
          <a
            href="https://github.com/thebutterzone/nostr-kind-37773"
            target="_blank"
            rel="noopener noreferrer"
            className="otc-btn-gray"
          >
            <span>GitHub Repository</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#edd400]" />
          </a>
        </div>
        <p className="text-xs sm:text-sm text-[#555753] mt-2 leading-relaxed">
          The reference implementation for Bitcoin-OTC Identity Linkage Proofs, decoupling external Bitcoin-OTC Web-of-Trust credentials and cryptographic proofs (PGP clearsign &amp; Bitcoin signed message) from Kind 0 user metadata.
        </p>
        <div className="mt-3 p-2.5 bg-white/70 rounded border border-[#f6bed1] text-xs text-[#2e3436] leading-relaxed">
          <strong className="text-[#204a87] font-bold">Kind 37773 Dedicated Scope:</strong> This NIP draft specifies the reference implementation for <strong>Bitcoin-OTC Identity Linkage Proofs only</strong>. Kind 37773 is strictly reserved for linking Bitcoin-OTC identities (nick, PGP key, and Bitcoin address) to Nostr public keys. Any other identity claims (e.g. GitHub, Keybase, or social platforms) must fork to their own dedicated kind numbers.
        </div>
      </div>

      {/* Why Kind 37773 vs Kind 0 */}
      <div className="bg-white rounded border border-[#cccccc] p-4 space-y-3 shadow-xs">
        <h2 className="text-xs font-bold text-[#2e3436] uppercase tracking-wider flex items-center gap-2 font-mono">
          <Layers className="w-4 h-4 text-[#204a87]" />
          <span>Rationale: Why Not Kind 0 (Legacy NIP-39)?</span>
        </h2>

        <p className="text-xs text-[#555753] leading-relaxed">
          NIP-39 originally proposed storing external identity claims inside Kind 0 (<code className="text-[#204a87] font-mono">"i"</code> tags on the user profile). However, Nostr developers have pushed back strongly against stuffing cryptographic proofs into Kind 0 for several critical architectural reasons:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 rounded bg-red-50/60 border border-red-200 space-y-2">
            <div className="text-xs font-bold text-red-900 flex items-center gap-1.5 font-mono">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Problems with Kind 0</span>
            </div>
            <ul className="text-xs text-[#555753] space-y-1.5 list-disc list-inside">
              <li><strong>Profile Bloat:</strong> Armored PGP signatures and cryptographic messages balloon the payload of every profile fetch across all clients.</li>
              <li><strong>Monolithic Updates:</strong> Modifying or adding one external identity requires overwriting the entire Kind 0 metadata event.</li>
              <li><strong>No Atomic Revocation:</strong> Cannot delete a single compromised identity proof without re-publishing the profile.</li>
              <li><strong>Relay Query Inefficiency:</strong> Clients cannot query for a specific Bitcoin-OTC proof without loading the entire profile.</li>
            </ul>
          </div>

          <div className="p-3.5 rounded bg-emerald-50/60 border border-emerald-200 space-y-2">
            <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Advantages of Kind 37773</span>
            </div>
            <ul className="text-xs text-[#555753] space-y-1.5 list-disc list-inside">
              <li><strong>Modular &amp; Replaceable:</strong> Uses the 30000–39999 range with <code className="text-[#204a87] font-mono">d: ext:bitcoin-otc:&lt;nick&gt;</code>. Each proof is independent.</li>
              <li><strong>Atomic Control:</strong> A user can add, update, or revoke a single proof without touching their profile or other proofs.</li>
              <li><strong>Dedicated Proof Body:</strong> The <code className="text-[#204a87] font-mono">content</code> field houses the full armored signature cleanly.</li>
              <li><strong>On-Demand Fetching:</strong> Clients only fetch external proofs when a user inspects identities, saving bandwidth.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tag Specification formatted in authentic .otc-table */}
      <div className="bg-white rounded border border-[#cccccc] p-4 space-y-3 shadow-xs">
        <h2 className="text-xs font-bold text-[#2e3436] uppercase tracking-wider flex items-center gap-2 font-mono">
          <Cpu className="w-4 h-4 text-[#204a87]" />
          <span>Tag Schema Specification</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="otc-table">
            <thead>
              <tr>
                <th className="w-36">Tag Name</th>
                <th className="w-56">Value Format</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-mono text-[#204a87] font-bold">["d", ...]</td>
                <td className="font-mono">ext:bitcoin-otc:&lt;nick&gt;</td>
                <td>Unique identifier for parameterization. E.g. <code className="text-[#204a87] font-mono">ext:bitcoin-otc:thebutterzone</code></td>
              </tr>
              <tr>
                <td className="font-mono text-[#204a87] font-bold">["proof-type", ...]</td>
                <td className="font-mono">"pgp" | "btc"</td>
                <td>Specifies the verification algorithm to apply to the content payload.</td>
              </tr>
              <tr>
                <td className="font-mono text-[#204a87] font-bold">["uri", ...]</td>
                <td className="font-mono text-[11px]">https://bitcoin-otc.com/viewratingdetail.php?nick=&lt;nick&gt;</td>
                <td>(Optional) Canonical reference link to author's Bitcoin-OTC profile. Must strictly point to <code className="text-[#204a87] font-mono">bitcoin-otc.com</code> with matching <code className="text-[#204a87] font-mono">?nick=</code>.</td>
              </tr>
              <tr>
                <td className="font-mono text-[#204a87] font-bold">["key", ...]</td>
                <td className="font-mono">40-char Fingerprint or Legacy P2PKH Address (1...)</td>
                <td>The 40-character PGP fingerprint or legacy P2PKH Bitcoin address against which the signature is verified.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Implementation Mandates */}
      <div className="bg-white rounded border border-[#cccccc] p-4 space-y-3 shadow-xs">
        <h2 className="text-xs font-bold text-[#2e3436] uppercase tracking-wider font-mono">
          Client Verification Protocol
        </h2>

        <div className="space-y-2.5 text-xs text-[#2e3436] leading-relaxed">
          <p>
            When a Nostr client encounters a Kind 37773 event, it follows a 4-step verification pipeline:
          </p>

          <ol className="list-decimal list-inside space-y-2 text-[#555753]">
            <li>
              <strong className="text-[#2e3436]">Step 1 (Nostr Integrity):</strong> Verify event ID is <code className="text-[#204a87] font-mono">sha256(serialize(event))</code> and Schnorr signature is valid for <code className="text-[#204a87] font-mono">pubkey</code>.
            </li>
            <li>
              <strong className="text-[#2e3436]">Step 2 (Cryptographic Proof):</strong>
              <ul className="list-disc list-inside pl-5 mt-1 space-y-1">
                <li>If <code className="text-[#204a87] font-mono">proof-type: "pgp"</code>: Parse OpenPGP cleartext message, extract Issuer Key ID/Fingerprint from signature packet, verify match with <code className="text-[#204a87] font-mono">key</code> tag, check that message asserts author's <code className="text-[#204a87] font-mono">npub</code>.</li>
                <li>If <code className="text-[#204a87] font-mono">proof-type: "btc"</code>: Recover secp256k1 public key point from compact 65-byte Bitcoin signature, compute legacy P2PKH Bitcoin address (<code className="text-[#204a87] font-mono">1...</code>), verify match with <code className="text-[#204a87] font-mono">key</code> tag, check assertion text.</li>
              </ul>
            </li>
            <li>
              <strong className="text-[#2e3436]">Step 3 (URI Anti-Phishing &amp; Integrity):</strong> If a <code className="text-[#204a87] font-mono">uri</code> tag is present, verify that it points strictly to <code className="text-[#204a87] font-mono">bitcoin-otc.com</code> with a <code className="text-[#204a87] font-mono">?nick=</code> query parameter matching the claimed <code className="text-[#204a87] font-mono">d</code> tag identifier. Reject or flag third-party domains and mismatched nicks as spoof risks.
            </li>
            <li>
              <strong className="text-[#2e3436]">Step 4 (UX Badging):</strong> Apply the mandate rules:
              <ul className="list-disc list-inside pl-5 mt-1 space-y-1">
                <li>Clients <strong className="text-emerald-800 font-semibold">MAY</strong> indicate that the cryptographic signature was successfully verified.</li>
                <li>Clients <strong className="text-amber-800 font-semibold">SHOULD</strong> distinguish between successful cryptographic verification and validation of an external identity.</li>
                <li>Clients <strong className="text-red-700 font-semibold">MUST NOT</strong> present the external identity as verified by an external registry unless another protocol layer provides that guarantee.</li>
              </ul>
            </li>
          </ol>
        </div>
      </div>

      {/* Published POC Event */}
      <div className="bg-white rounded border border-[#cccccc] p-4 space-y-3 shadow-xs">
        <h2 className="text-xs font-bold text-[#2e3436] uppercase tracking-wider font-mono">
          Canonical POC Event (TheButterZone)
        </h2>
        <pre className="p-3 bg-[#fafafa] rounded border border-[#cccccc] text-xs font-mono text-[#2e3436] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-80">
          {JSON.stringify(THEBUTTERZONE_POC_EVENT, null, 2)}
        </pre>
      </div>
    </div>
  );
};
