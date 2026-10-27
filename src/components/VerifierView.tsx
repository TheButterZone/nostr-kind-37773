import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Play,
  Key,
  FileCheck,
  Info,
  Clock,
  Fingerprint,
} from 'lucide-react';
import { NostrEvent, VerificationDetails } from '../types/nostr';
import { parseClaimTags, getNpubFromPubkey } from '../lib/nostrVerifier';
import { verifyKind37773Claim } from '../lib/claimVerifier';
import { THEBUTTERZONE_POC_EVENT, SAMPLE_BTC_POC_EVENT } from '../lib/constants';

interface VerifierViewProps {
  currentEvent: NostrEvent;
  onUpdateEvent: (ev: NostrEvent) => void;
}

export const VerifierView: React.FC<VerifierViewProps> = ({
  currentEvent,
  onUpdateEvent,
}) => {
  const [jsonInput, setJsonInput] = useState<string>(
    JSON.stringify(currentEvent, null, 2)
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationDetails | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'json' | 'content'>('details');

  useEffect(() => {
    setJsonInput(JSON.stringify(currentEvent, null, 2));
    setParseError(null);
    handleRunVerification(currentEvent);
  }, [currentEvent]);

  const handleJsonChange = (val: string) => {
    setJsonInput(val);
    try {
      const parsed = JSON.parse(val);
      if (!parsed.kind || !parsed.tags || !parsed.pubkey) {
        setParseError('Missing required Nostr event properties (kind, tags, pubkey)');
        return;
      }
      setParseError(null);
      onUpdateEvent(parsed);
    } catch (err) {
      setParseError('Invalid JSON format');
    }
  };

  const handleRunVerification = async (evToVerify: NostrEvent = currentEvent) => {
    setIsVerifying(true);
    try {
      const res = await verifyKind37773Claim(evToVerify);
      setVerificationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const parsedTags = parseClaimTags(currentEvent);
  const npub = getNpubFromPubkey(currentEvent.pubkey);

  return (
    <div className="space-y-6">
      {/* Hero header strip */}
      <div className="bg-[#111827]/80 rounded-xl border border-slate-800 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5 font-mono">
              <span>Kind 37773</span>
              <span aria-hidden="true">·</span>
              <span>Parameterized Replaceable Event</span>
              <span aria-hidden="true">·</span>
              <span className="uppercase text-purple-400 font-semibold">{parsedTags.proofType} Proof</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Bitcoin-OTC Identity Linkage Proof:</span>
              <span className="text-purple-400 font-mono text-xl">
                {parsedTags.dTag || 'ext:bitcoin-otc:unknown'}
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Reference implementation for Bitcoin-OTC Identity Linkage Proofs, decoupling proof of OTC credentials from Kind 0 metadata.
              This interactive verifier validates Nostr event integrity and underlying cryptographic signatures (PGP clearsign &amp; Bitcoin signed message).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleRunVerification(currentEvent)}
              disabled={isVerifying}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-purple-900/30 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Verifying Proof...' : 'Verify Cryptographic Proof'}</span>
            </button>
          </div>
        </div>

        {/* Quick event switcher */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Test Events:</span>
          <button
            onClick={() => onUpdateEvent(THEBUTTERZONE_POC_EVENT)}
            className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            TheButterZone (PGP on bitcoin-otc)
          </button>
          <button
            onClick={() => onUpdateEvent(SAMPLE_BTC_POC_EVENT)}
            className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors cursor-pointer"
          >
            Bitcoin Signed Message (BTC Address)
          </button>
        </div>
      </div>

      {/* Verification Status Banner */}
      {verificationResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Nostr Event Integrity */}
          <div className="bg-[#111827] rounded-xl border border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">Layer 1: Nostr Protocol</span>
              {verificationResult.nostrEventValid ? (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                  <ShieldCheck className="w-4 h-4" /> Valid Signature
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-red-400 font-semibold">
                  <ShieldAlert className="w-4 h-4" /> Invalid
                </span>
              )}
            </div>
            <div className="text-sm font-semibold text-white mb-1">
              Event SHA-256 &amp; Schnorr Sig
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {verificationResult.nostrEventValid
                ? 'Nostr event hash serialization matches ID and Schnorr signature is valid for author pubkey.'
                : verificationResult.nostrError || 'Nostr event validation failed.'}
            </p>
          </div>

          {/* Card 2: Cryptographic Proof Verification */}
          <div className="bg-[#111827] rounded-xl border border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">
                Layer 2: {verificationResult.cryptoAlgorithm || 'Cryptographic Proof'}
              </span>
              {verificationResult.cryptoSignatureValid && verificationResult.cryptoKeyMatches ? (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                  <Check className="w-4 h-4" /> Signature Valid
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                  <AlertTriangle className="w-4 h-4" /> Check Warning
                </span>
              )}
            </div>
            <div className="text-sm font-semibold text-white mb-1">
              {verificationResult.proofType.toUpperCase()} Key Assertion Match
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {verificationResult.cryptoSignatureValid && verificationResult.cryptoKeyMatches
                ? `Cryptographic signature matches key in tag (${verificationResult.keyFoundOrRecovered.slice(0, 16)}...).`
                : verificationResult.cryptoError || 'Key verification mismatch or missing signature packet.'}
            </p>
          </div>

          {/* Card 3: External Registry Validation Advisory */}
          <div className="bg-[#111827] rounded-xl border border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-amber-400">Layer 3: External Registry Rule</span>
              <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                <Info className="w-4 h-4" /> Self-Attestation
              </span>
            </div>
            <div className="text-sm font-semibold text-white mb-1">
              Registry Independence
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Clients <strong className="text-slate-200">MUST NOT</strong> claim external registry verification without independent validation.
            </p>
          </div>
        </div>
      )}

      {/* Specification Compliance Callout Banner */}
      {verificationResult && (
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs leading-relaxed">
              <div className="font-semibold text-slate-200">
                Compliance Evaluation for Client Developers:
              </div>
              <p className="text-slate-400">
                {verificationResult.advisoryNotice}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2 text-slate-400">
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Claimed npub asserted in text: {verificationResult.assertionContainsNpub || verificationResult.assertionContainsPubkey ? 'Yes' : 'No'}
                </span>
                <span aria-hidden="true">·</span>
                <span>Proof Method: {verificationResult.proofType.toUpperCase()}</span>
                {parsedTags.uri && (
                  <>
                    <span aria-hidden="true">·</span>
                    <a
                      href={parsedTags.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                      className="text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <span>External URI</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Workspace Tabs */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-[#0E1524]">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-purple-900/40 text-purple-300 border border-purple-800/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Parsed Claim Tags &amp; Keys
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'content'
                  ? 'bg-purple-900/40 text-purple-300 border border-purple-800/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Signed Content &amp; Signature
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'json'
                  ? 'bg-purple-900/40 text-purple-300 border border-purple-800/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Raw Nostr Event JSON
            </button>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Event ID: {currentEvent.id.slice(0, 12)}...
          </div>
        </div>

        {/* Tab 1: Structured Tag Details */}
        {activeTab === 'details' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* d tag */}
              <div className="bg-[#0B0F17] rounded-lg border border-slate-800 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-mono text-purple-400">["d", "{parsedTags.dTag}"]</span>
                  <span>Identifier Tag</span>
                </div>
                <div className="text-sm font-semibold text-white font-mono break-all">
                  {parsedTags.dTag}
                </div>
                <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
                  <span>Platform: <strong className="text-slate-200">{parsedTags.platform || 'bitcoin-otc'}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Bitcoin-OTC Nick: <strong className="text-slate-200">{parsedTags.identifier || 'N/A'}</strong></span>
                </div>
              </div>

              {/* proof-type tag */}
              <div className="bg-[#0B0F17] rounded-lg border border-slate-800 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-mono text-purple-400">["proof-type", "{parsedTags.proofType}"]</span>
                  <span>Proof Method</span>
                </div>
                <div className="text-sm font-semibold text-white uppercase font-mono">
                  {parsedTags.proofType}
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  {parsedTags.proofType === 'pgp'
                    ? 'OpenPGP armored cleartext statement with signature packet'
                    : parsedTags.proofType === 'btc'
                    ? 'Bitcoin Signed Message (compact secp256k1 recovery)'
                    : 'Custom external proof method'}
                </div>
              </div>

              {/* uri tag */}
              <div className="bg-[#0B0F17] rounded-lg border border-slate-800 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-mono text-purple-400">["uri", "..."]</span>
                  <span>External Registry Link</span>
                </div>
                {parsedTags.uri ? (
                  <div className="space-y-1.5">
                    <a
                      href={parsedTags.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                      className="text-xs font-mono text-purple-400 hover:text-purple-300 break-all flex items-center gap-1.5"
                    >
                      <span className="truncate">{parsedTags.uri}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                    {verificationResult?.uriVerification && (
                      <div className={`text-[11px] px-2 py-1 rounded border flex items-center gap-1.5 ${
                        verificationResult.uriVerification.status === 'canonical'
                          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                          : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                      }`}>
                        {verificationResult.uriVerification.status === 'canonical' ? (
                          <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        )}
                        <span>{verificationResult.uriVerification.message}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 font-mono flex items-center justify-between">
                    <span>No external URI provided</span>
                    <span className="text-[10px] text-slate-600 bg-slate-900 px-1.5 py-0.5 rounded">optional</span>
                  </div>
                )}
              </div>

              {/* key tag */}
              <div className="bg-[#0B0F17] rounded-lg border border-slate-800 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-mono text-purple-400">["key", "..."]</span>
                  <span>Proof Public Key / Fingerprint</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-mono text-white break-all">
                    {parsedTags.key || 'Missing key tag'}
                  </div>
                  <button
                    onClick={() => copyToClipboard(parsedTags.key, 'key')}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded shrink-0 cursor-pointer"
                    title="Copy key"
                  >
                    {copiedKey === 'key' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Author Nostr Keys */}
            <div className="bg-[#0B0F17] rounded-lg border border-slate-800 p-4 space-y-3">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-purple-400" />
                <span>Nostr Author Identity</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block mb-1">Hex Pubkey</span>
                  <div className="flex items-center justify-between bg-slate-900/90 p-2 rounded border border-slate-800/80">
                    <span className="text-slate-300 truncate">{currentEvent.pubkey}</span>
                    <button
                      onClick={() => copyToClipboard(currentEvent.pubkey, 'hex')}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'hex' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">Bech32 npub</span>
                  <div className="flex items-center justify-between bg-slate-900/90 p-2 rounded border border-slate-800/80">
                    <span className="text-purple-300 truncate">{npub || 'Invalid'}</span>
                    <button
                      onClick={() => copyToClipboard(npub, 'npub')}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'npub' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Signed Content */}
        {activeTab === 'content' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Event Content Payload (Armored Statement)</span>
              <button
                onClick={() => copyToClipboard(currentEvent.content, 'content')}
                className="flex items-center gap-1 hover:text-white cursor-pointer"
              >
                {copiedKey === 'content' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy Payload</span>
              </button>
            </div>
            <pre className="p-4 bg-[#0B0F17] rounded-lg border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96">
              {currentEvent.content}
            </pre>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-purple-400" />
              <span>
                Schnorr Signature (`sig`): <code className="text-slate-300">{currentEvent.sig.slice(0, 32)}...</code>
              </span>
            </div>
          </div>
        )}

        {/* Tab 3: Raw JSON Editor */}
        {activeTab === 'json' && (
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Edit or Paste Any Nostr Kind 37773 JSON Event</span>
              {parseError && <span className="text-red-400 font-medium">{parseError}</span>}
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => handleJsonChange(e.target.value)}
              rows={14}
              className="w-full p-4 bg-[#0B0F17] rounded-lg border border-slate-800 text-xs font-mono text-purple-200 focus:outline-none focus:border-purple-500/80 leading-relaxed resize-y"
            />
          </div>
        )}
      </div>
    </div>
  );
};
