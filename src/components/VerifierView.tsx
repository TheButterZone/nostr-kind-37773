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
  FileCode,
  Sparkles,
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
  const [copiedJson, setCopiedJson] = useState(false);
  const [activeTab, setActiveTab] = useState<'json' | 'details' | 'content'>('json');
  const [lastVerifiedTime, setLastVerifiedTime] = useState<string | null>(null);
  const [lastDurationMs, setLastDurationMs] = useState<number | null>(null);
  const [isCardFlashing, setIsCardFlashing] = useState(false);

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
    } catch (err: any) {
      setParseError('Invalid JSON format');
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonInput(formatted);
      setParseError(null);
    } catch (err: any) {
      setParseError('Cannot format: invalid JSON syntax');
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonInput);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleLoadPreset = (preset: NostrEvent) => {
    setJsonInput(JSON.stringify(preset, null, 2));
    setParseError(null);
    onUpdateEvent(preset);
  };

  const handleRunVerification = async (evToVerify?: NostrEvent) => {
    setIsVerifying(true);
    const start = performance.now();
    try {
      let target = evToVerify;
      if (!target) {
        // Attempt to parse currently typed JSON in the active editor
        try {
          const parsed = JSON.parse(jsonInput);
          if (parsed && typeof parsed === 'object') {
            if (!parsed.kind || !parsed.tags || !parsed.pubkey) {
              setParseError('Missing required Nostr event properties (kind, tags, pubkey)');
            } else {
              setParseError(null);
              target = parsed;
              onUpdateEvent(parsed);
            }
          }
        } catch (err: any) {
          setParseError(`JSON Syntax Error: ${err?.message || 'Invalid format'}`);
        }
      }

      const eventToTest = target || currentEvent;
      // Perceptible execution delay (~350ms) so user clearly perceives the cryptographic evaluation
      const [res] = await Promise.all([
        verifyKind37773Claim(eventToTest),
        new Promise((resolve) => setTimeout(resolve, 350)),
      ]);

      setVerificationResult(res);
      const elapsed = Math.max(1, Math.round(performance.now() - start));
      setLastDurationMs(elapsed);
      setLastVerifiedTime(new Date().toLocaleTimeString());
      setIsCardFlashing(true);
      setTimeout(() => setIsCardFlashing(false), 700);
    } catch (err) {
      console.error('Verification error:', err);
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
  const payloadBytes = new Blob([jsonInput]).size;
  const lineCount = jsonInput.split('\n').length;

  return (
    <div className="space-y-6">
      {/* Hero header strip */}
      <div className="bg-[#111827]/80 rounded-xl border border-slate-800 p-6 shadow-sm">
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

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {lastVerifiedTime && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-800/60 px-3 py-2 rounded-lg animate-in fade-in duration-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Verified at {lastVerifiedTime} ({lastDurationMs}ms)</span>
              </div>
            )}
            <button
              onClick={() => handleRunVerification()}
              disabled={isVerifying}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:opacity-50 rounded-lg transition-all flex items-center gap-2 shadow-md shadow-purple-900/30 cursor-pointer whitespace-nowrap shrink-0 hover:shadow-purple-600/20"
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
            onClick={() => handleLoadPreset(THEBUTTERZONE_POC_EVENT)}
            className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            TheButterZone (PGP on bitcoin-otc)
          </button>
          <button
            onClick={() => handleLoadPreset(SAMPLE_BTC_POC_EVENT)}
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
          <div
            className={`bg-[#111827] rounded-xl border p-5 transition-all duration-300 ${
              isCardFlashing
                ? 'border-purple-500 ring-2 ring-purple-500/40 shadow-lg shadow-purple-950/50'
                : 'border-slate-800'
            }`}
          >
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
          <div
            className={`bg-[#111827] rounded-xl border p-5 transition-all duration-300 ${
              isCardFlashing
                ? 'border-purple-500 ring-2 ring-purple-500/40 shadow-lg shadow-purple-950/50'
                : 'border-slate-800'
            }`}
          >
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
          <div
            className={`bg-[#111827] rounded-xl border p-5 transition-all duration-300 ${
              isCardFlashing
                ? 'border-purple-500 ring-2 ring-purple-500/40 shadow-lg shadow-purple-950/50'
                : 'border-slate-800'
            }`}
          >
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
      <div className="bg-[#111827] rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        {/* Workspace Tab Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-[#0E1524]">
          <div className="flex items-center gap-1">
            {/* Tab 1: Raw Nostr Event JSON (Default & First) */}
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'json'
                  ? 'bg-purple-900/40 text-purple-300 border border-purple-800/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Raw Nostr Event JSON</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40">
                Primary
              </span>
            </button>

            {/* Tab 2: Parsed Claim Tags & Keys */}
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'details'
                  ? 'bg-purple-900/40 text-purple-300 border border-purple-800/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Parsed Claim Tags &amp; Keys</span>
            </button>

            {/* Tab 3: Signed Content & Signature */}
            <button
              onClick={() => setActiveTab('content')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'content'
                  ? 'bg-purple-900/40 text-purple-300 border border-purple-800/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Signed Content &amp; Signature</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-mono hidden sm:block">
            Event ID: {currentEvent.id.slice(0, 16)}...
          </div>
        </div>

        {/* Tab 1 Body: Raw JSON Workspace (Front & Center) */}
        {activeTab === 'json' && (
          <div className="p-6 space-y-4">
            {/* JSON Editor Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                {parseError ? (
                  <div className="flex items-center gap-1.5 text-xs text-red-400 font-mono bg-red-950/40 border border-red-800/60 px-2.5 py-1 rounded-md">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{parseError}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded-md">
                    <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>Valid Event JSON · Kind {currentEvent.kind || 37773} ({parsedTags.proofType?.toUpperCase() || 'OTC'})</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleFormatJson}
                  className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Format JSON with 2-space indentation"
                >
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Format</span>
                </button>

                <button
                  onClick={handleCopyJson}
                  className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Copy JSON to clipboard"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleRunVerification()}
                  disabled={isVerifying}
                  className="px-3 py-1 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:opacity-50 rounded transition-colors flex items-center gap-1.5 shadow-sm shadow-purple-900/30 cursor-pointer"
                >
                  <Play className={`w-3 h-3 fill-current ${isVerifying ? 'animate-spin' : ''}`} />
                  <span>{isVerifying ? 'Verifying...' : 'Verify Event JSON'}</span>
                </button>
              </div>
            </div>

            {/* Monospace JSON Textarea */}
            <div className="relative">
              <textarea
                value={jsonInput}
                onChange={(e) => handleJsonChange(e.target.value)}
                rows={16}
                spellCheck={false}
                placeholder="Paste or edit Kind 37773 Nostr Event JSON..."
                className="w-full p-4 bg-[#0B0F17] rounded-lg border border-slate-800 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/80 leading-relaxed resize-y selection:bg-purple-900/60 selection:text-purple-200"
              />
            </div>

            {/* Status Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 font-mono gap-2 pt-1">
              <div className="flex items-center gap-3">
                <span>{payloadBytes} bytes</span>
                <span aria-hidden="true">·</span>
                <span>{lineCount} lines</span>
                <span aria-hidden="true">·</span>
                <span>{currentEvent.tags?.length || 0} tags</span>
              </div>
              <div className="text-slate-400">
                Tip: Edit any tag or signature above and click <strong className="text-purple-300">"Verify Event JSON"</strong> to test protocol enforcement.
              </div>
            </div>
          </div>
        )}

        {/* Tab 2 Body: Structured Tag Details */}
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

        {/* Tab 3 Body: Signed Content */}
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
      </div>
    </div>
  );
};
