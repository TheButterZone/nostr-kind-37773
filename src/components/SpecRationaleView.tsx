import React from 'react';
import { BookOpen, Layers, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';
import { THEBUTTERZONE_POC_EVENT } from '../lib/constants';

export const SpecRationaleView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 p-6 space-y-3">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-400" />
          <span>Kind 37773: Bitcoin-OTC Identity Linkage Proof</span>
        </h1>
        <p className="text-sm text-slate-400">
          The reference implementation for Bitcoin-OTC Identity Linkage Proofs, decoupling external Bitcoin-OTC Web-of-Trust credentials and cryptographic proofs (PGP clearsign &amp; Bitcoin signed message) from Kind 0 user metadata.
        </p>
        <div className="p-3.5 bg-purple-950/40 rounded-lg border border-purple-800/60 text-xs text-purple-200 leading-relaxed">
          <strong className="text-white">Kind 37773 Dedicated Scope:</strong> This NIP draft specifies the reference implementation for <strong>Bitcoin-OTC Identity Linkage Proofs only</strong>. Kind 37773 is strictly reserved for linking Bitcoin-OTC identities (nick, PGP key, and Bitcoin address) to Nostr public keys. Any other identity claims (e.g. GitHub, Keybase, or social platforms) must fork to their own dedicated kind numbers.
        </div>
      </div>

      {/* Why Kind 37773 vs Kind 0 */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Rationale: Why Not Kind 0 (Legacy NIP-39)?</span>
        </h2>

        <p className="text-xs text-slate-300 leading-relaxed">
          NIP-39 originally proposed storing external identity claims inside Kind 0 (<code className="text-purple-300">"i"</code> tags on the user profile). However, Nostr developers have pushed back strongly against stuffing cryptographic proofs into Kind 0 for several critical architectural reasons:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>Problems with Kind 0</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li><strong>Profile Bloat:</strong> Armored PGP signatures and cryptographic messages balloon the payload of every profile fetch across all clients.</li>
              <li><strong>Monolithic Updates:</strong> Modifying or adding one external identity requires overwriting the entire Kind 0 metadata event.</li>
              <li><strong>No Atomic Revocation:</strong> Cannot delete a single compromised identity proof without re-publishing the profile.</li>
              <li><strong>Relay Query Inefficiency:</strong> Clients cannot query for a specific Bitcoin-OTC proof without loading the entire profile.</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Advantages of Kind 37773</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li><strong>Modular &amp; Replaceable:</strong> Uses the 30000–39999 range with <code className="text-purple-300">d: ext:bitcoin-otc:&lt;nick&gt;</code>. Each proof is independent.</li>
              <li><strong>Atomic Control:</strong> A user can add, update, or revoke a single proof without touching their profile or other proofs.</li>
              <li><strong>Dedicated Proof Body:</strong> The <code className="text-purple-300">content</code> field houses the full armored signature (PGP clearsign or Bitcoin signed message) cleanly.</li>
              <li><strong>On-Demand Fetching:</strong> Clients only fetch external proofs when a user inspects identities, saving bandwidth.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tag Specification */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-400" />
          <span>Tag Schema Specification</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 border-b border-slate-800 font-mono">
              <tr>
                <th className="py-2.5 px-3">Tag Name</th>
                <th className="py-2.5 px-3">Value Format</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              <tr>
                <td className="py-2.5 px-3 text-purple-400 font-bold">["d", ...]</td>
                <td className="py-2.5 px-3">ext:bitcoin-otc:&lt;nick&gt;</td>
                <td className="py-2.5 px-3 font-sans text-slate-400">Unique identifier for parameterization. E.g. <code className="text-purple-300">ext:bitcoin-otc:thebutterzone</code></td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-purple-400 font-bold">["proof-type", ...]</td>
                <td className="py-2.5 px-3">"pgp" | "btc"</td>
                <td className="py-2.5 px-3 font-sans text-slate-400">Specifies the verification algorithm to apply to the content payload.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-purple-400 font-bold">["uri", ...]</td>
                <td className="py-2.5 px-3">https://bitcoin-otc.com/viewratingdetail.php?nick=&lt;nick&gt;</td>
                <td className="py-2.5 px-3 font-sans text-slate-400">(Optional) Canonical reference link to the author's Bitcoin-OTC profile. Must strictly point to <code className="text-purple-300">bitcoin-otc.com</code> with <code className="text-purple-300">?nick=</code> matching the <code className="text-purple-300">d</code> tag identifier to prevent phishing.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-purple-400 font-bold">["key", ...]</td>
                <td className="py-2.5 px-3">40-char Fingerprint or Legacy P2PKH Address (1...)</td>
                <td className="py-2.5 px-3 font-sans text-slate-400">The 40-character PGP fingerprint or legacy P2PKH Bitcoin address against which the signature is verified.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Implementation Mandates */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Client Verification Protocol
        </h2>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            When a Nostr client encounters a Kind 37773 event, it follows a 4-step verification pipeline:
          </p>

          <ol className="list-decimal list-inside space-y-2 text-slate-400">
            <li>
              <strong className="text-slate-200">Step 1 (Nostr Integrity):</strong> Verify event ID is <code className="text-purple-300">sha256(serialize(event))</code> and Schnorr signature is valid for <code className="text-purple-300">pubkey</code>.
            </li>
            <li>
              <strong className="text-slate-200">Step 2 (Cryptographic Proof):</strong>
              <ul className="list-disc list-inside pl-5 mt-1 space-y-1">
                <li>If <code className="text-purple-300">proof-type: "pgp"</code>: Parse OpenPGP cleartext message, extract Issuer Key ID/Fingerprint from signature packet, verify match with <code className="text-purple-300">key</code> tag, check that message asserts author's <code className="text-purple-300">npub</code>.</li>
                <li>If <code className="text-purple-300">proof-type: "btc"</code>: Recover secp256k1 public key point from compact 65-byte Bitcoin signature, compute legacy P2PKH Bitcoin address (<code className="text-purple-300">1...</code>), verify match with <code className="text-purple-300">key</code> tag, check assertion text.</li>
              </ul>
            </li>
            <li>
              <strong className="text-slate-200">Step 3 (URI Anti-Phishing &amp; Integrity):</strong> If a <code className="text-purple-300">uri</code> tag is present, verify that it points strictly to <code className="text-purple-300">bitcoin-otc.com</code> with a <code className="text-purple-300">?nick=</code> query parameter matching the claimed <code className="text-purple-300">d</code> tag identifier. Reject or flag third-party domains and mismatched nicks as spoof risks.
            </li>
            <li>
              <strong className="text-slate-200">Step 4 (UX Badging):</strong> Apply the mandate rules:
              <ul className="list-disc list-inside pl-5 mt-1 space-y-1">
                <li>Clients <strong className="text-emerald-400">MAY</strong> indicate that the cryptographic signature was successfully verified.</li>
                <li>Clients <strong className="text-amber-400">SHOULD</strong> distinguish between successful cryptographic verification and validation of an external identity.</li>
                <li>Clients <strong className="text-red-400">MUST NOT</strong> present the external identity as verified by an external registry unless another protocol layer provides that guarantee.</li>
              </ul>
            </li>
          </ol>
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

      {/* Published POC Event */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 p-6 space-y-3">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Canonical POC Event (TheButterZone)
        </h2>
        <pre className="p-4 bg-[#0B0F17] rounded-lg border border-slate-800 text-xs font-mono text-purple-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-80">
          {JSON.stringify(THEBUTTERZONE_POC_EVENT, null, 2)}
        </pre>
      </div>
    </div>
  );
};
