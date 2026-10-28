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

  // When parent changes currentEvent (e.g. preset clicked from TopBar), update jsonInput & run verification
  useEffect(() => {
    setJsonInput(JSON.stringify(currentEvent, null, 2));
    setParseError(null);
    handleRunVerification(currentEvent);
  }, [currentEvent]);

  // When user edits JSON in textarea: update local state, immediately clear stale verification badges
  const handleJsonChange = (val: string) => {
    setJsonInput(val);
    setVerificationResult(null); // Clear previous verification badges so no stale green indicators linger
    try {
      const parsed = JSON.parse(val);
      if (!parsed.kind || !parsed.tags || !parsed.pubkey) {
        setParseError('Missing required Nostr event properties (kind, tags, pubkey)');
        return;
      }
      setParseError(null);
      // DO NOT call onUpdateEvent(parsed) on keystroke to avoid cursor/re-render loops
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
      let target: NostrEvent | null = evToVerify || null;

      if (!target) {
        // Parse currently active text in the workspace editor
        try {
          const parsed = JSON.parse(jsonInput);
          if (!parsed || typeof parsed !== 'object') {
            throw new Error('Root of JSON must be an object');
          }
          if (!parsed.kind || !parsed.tags || !parsed.pubkey) {
            throw new Error('Missing required Nostr event properties (kind, tags, pubkey)');
          }
          setParseError(null);
          target = parsed as NostrEvent;
        } catch (err: any) {
          // Hard fail: DO NOT fall back to currentEvent!
          const failMsg = `Workspace JSON Error: ${err?.message || 'Invalid format'}. Cryptographic verification cannot proceed on invalid JSON.`;
          setParseError(failMsg);
          const failResult: VerificationDetails = {
            isOverallValid: false,
            criticalErrors: [failMsg],
            nostrEventValid: false,
            nostrIdMatches: false,
            nostrSigMatches: false,
            nostrError: failMsg,
            dTagValid: false,
            identityBindingValid: false,
            pubkeyBindingValid: false,
            proofType: 'other',
            cryptoSignatureValid: false,
            cryptoKeyMatches: false,
            keyFoundOrRecovered: 'N/A',
            keyExpected: 'N/A',
            assertionContainsPubkey: false,
            assertionContainsNpub: false,
            assertionTextSummary: 'Malformed JSON',
            cryptoError: err?.message,
            cryptoAlgorithm: 'None',
            registryValidGuaranteed: false,
            distinctionRulePassed: false,
            advisoryNotice: `VERIFICATION FAILED: Malformed JSON. ${err?.message}`,
            uriVerification: { status: 'none', message: 'Verification aborted.' },
          };
          setVerificationResult(failResult);
          setLastVerifiedTime(new Date().toLocaleTimeString());
          return;
        }
      }

      // Execute full Kind 37773 verification across all cryptographic layers
      const [res] = await Promise.all([
        verifyKind37773Claim(target),
        new Promise((resolve) => setTimeout(resolve, 200)),
      ]);

      setVerificationResult(res);
      // Synchronize parent state with the successfully tested event
      onUpdateEvent(target);
      const elapsed = Math.max(1, Math.round(performance.now() - start));
      setLastDurationMs(elapsed);
      setLastVerifiedTime(new Date().toLocaleTimeString());
      setIsCardFlashing(true);
      setTimeout(() => setIsCardFlashing(false), 500);
    } catch (err: any) {
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
    <div className="space-y-4">
      {/* Authentic #FFE0EB Pink Box Hero Card matching bitcoin-otc.com */}
      <div className="otc-pink-box">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#555753] mb-1 font-mono">
              <span className="font-bold text-[#2e3436]">Kind 37773</span>
              <span>·</span>
              <span>Parameterized Replaceable Event</span>
              <span>·</span>
              <span className="uppercase text-[#204a87] font-semibold">{parsedTags.proofType} Proof</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2e3436] flex flex-wrap items-center gap-2">
              <span>#bitcoin-otc Identity Linkage Proof:</span>
              <span className="text-[#204a87] font-mono text-lg sm:text-xl">
                {parsedTags.dTag || 'ext:bitcoin-otc:unknown'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[#555753] mt-1.5 max-w-3xl leading-relaxed">
              Reference implementation for Bitcoin-OTC Identity Linkage Proofs, decoupling proof of OTC credentials from Kind 0 metadata. This interactive verifier validates Nostr event integrity and underlying cryptographic signatures (PGP clearsign & Bitcoin signed message).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {lastVerifiedTime && (
              verificationResult?.isOverallValid ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-900 font-mono bg-emerald-100 border border-emerald-400 px-3 py-1.5 rounded">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>All Proofs Valid · {lastVerifiedTime} ({lastDurationMs}ms)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-red-950 font-mono bg-red-100 border-2 border-red-600 px-3 py-1.5 rounded font-bold shadow-xs">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                  <span>VERIFICATION FAILED ({lastDurationMs}ms)</span>
                </div>
              )
            )}
            <button
              onClick={() => handleRunVerification()}
              disabled={isVerifying}
              className="otc-btn-gold text-xs shadow-xs"
              title="Execute full multi-layer cryptographic verification"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Verifying Proof...' : 'Verify Cryptographic Proof'}</span>
            </button>
          </div>
        </div>

        {/* Quick event switcher styled with #888a85 gray buttons and #edd400 yellow font */}
        <div className="mt-3 pt-3 border-t border-[#f6bed1] flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#555753] font-bold">Test Events:</span>
          <button
            onClick={() => handleLoadPreset(THEBUTTERZONE_POC_EVENT)}
            className="otc-btn-gray"
            title="Load authentic TheButterZone PGP POC event"
          >
            TheButterZone (PGP on bitcoin-otc)
          </button>
          <button
            onClick={() => handleLoadPreset(SAMPLE_BTC_POC_EVENT)}
            className="otc-btn-gray"
            title="Load authentic Bitcoin signed message event"
          >
            Bitcoin Signed Message (BTC Address)
          </button>
        </div>
      </div>

      {/* Prominent Red Alert Banner for Protocol/Crypto Violations */}
      {verificationResult && !verificationResult.isOverallValid && (
        <div className="rounded border-2 border-red-600 bg-red-50 p-4 text-red-950 shadow-sm space-y-2">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-bold text-red-900 flex items-center gap-2">
                  <span>CRITICAL SECURITY ALERT: CRYPTOGRAPHIC VERIFICATION FAILED</span>
                </div>
                <span className="text-[11px] font-mono uppercase bg-red-700 text-white px-2 py-0.5 rounded font-bold tracking-wide">
                  Untrusted / Invalid Event
                </span>
              </div>
              <p className="text-xs text-red-900 leading-relaxed">
                This Nostr event failed mandatory protocol enforcement and cryptographic verification. Modifying event tags (such as the <code className="bg-red-100 px-1 py-0.5 rounded font-mono text-red-900 border border-red-300">d</code> tag or nick) or altering content without author re-signing breaks cryptographic provenance. Clients <strong>MUST REJECT</strong> this claim.
              </p>

              {verificationResult.criticalErrors.length > 0 && (
                <div className="pt-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-red-900 mb-1.5 font-bold">
                    Violations Detected ({verificationResult.criticalErrors.length}):
                  </div>
                  <div className="space-y-1.5">
                    {verificationResult.criticalErrors.map((err, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs font-mono text-red-900 bg-white p-2 rounded border border-red-300 shadow-2xs"
                      >
                        <span className="text-red-600 font-bold shrink-0">✕</span>
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verified Green Banner when 100% valid */}
      {verificationResult && verificationResult.isOverallValid && (
        <div className="rounded border border-emerald-500 bg-emerald-50 p-3.5 text-emerald-950 shadow-xs flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-emerald-900 flex items-center gap-2">
              <span>ALL CRYPTOGRAPHIC &amp; PROTOCOL CHECKS VERIFIED</span>
              <span className="text-[11px] font-mono bg-emerald-100 border border-emerald-300 text-emerald-900 px-2 py-0.5 rounded font-semibold">
                Valid Kind 37773
              </span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed">
              Nostr Schnorr signature, SHA-256 event ID commitment, {verificationResult.proofType.toUpperCase()} cryptographic signature, and identity binding for nick "{parsedTags.identifier}" are fully valid.
            </p>
          </div>
        </div>
      )}

      {/* Verification Status Breakdown Cards */}
      {verificationResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1: Nostr Event Integrity */}
          <div
            className={`rounded border p-3.5 transition-all duration-200 ${
              !verificationResult.nostrEventValid
                ? 'bg-red-50 border-red-400 text-red-950'
                : isCardFlashing
                ? 'bg-white border-[#204a87] ring-2 ring-blue-300'
                : 'bg-[#eeeeec] border-[#d3d7cf] text-[#2e3436]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#555753]">Layer 1: Nostr Protocol</span>
              {verificationResult.nostrEventValid ? (
                <span className="flex items-center gap-1 text-xs text-emerald-700 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Valid
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-red-700 font-bold bg-red-100 px-1.5 py-0.2 rounded border border-red-300">
                  <ShieldAlert className="w-3.5 h-3.5" /> FAILED
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-[#2e3436] mb-1">
              Event SHA-256 &amp; Schnorr Sig
            </div>
            <p className="text-[11px] text-[#555753] leading-relaxed">
              {verificationResult.nostrEventValid
                ? 'Nostr event hash serialization matches ID and Schnorr signature is valid for author pubkey.'
                : verificationResult.nostrError || 'Nostr event validation failed.'}
            </p>
          </div>

          {/* Card 2: Cryptographic Proof Verification */}
          <div
            className={`rounded border p-3.5 transition-all duration-200 ${
              !verificationResult.cryptoSignatureValid || !verificationResult.cryptoKeyMatches || !verificationResult.identityBindingValid
                ? 'bg-red-50 border-red-400 text-red-950'
                : isCardFlashing
                ? 'bg-white border-[#204a87] ring-2 ring-blue-300'
                : 'bg-[#eeeeec] border-[#d3d7cf] text-[#2e3436]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#555753]">
                Layer 2: {verificationResult.cryptoAlgorithm || 'Cryptographic Proof'}
              </span>
              {verificationResult.cryptoSignatureValid && verificationResult.cryptoKeyMatches && verificationResult.identityBindingValid ? (
                <span className="flex items-center gap-1 text-xs text-emerald-700 font-bold">
                  <Check className="w-3.5 h-3.5" /> Valid
                </span>
              ) : !verificationResult.identityBindingValid ? (
                <span className="flex items-center gap-1 text-xs text-red-700 font-bold bg-red-100 px-1.5 py-0.2 rounded border border-red-300">
                  <ShieldAlert className="w-3.5 h-3.5" /> Nick Mismatch
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-red-700 font-bold bg-red-100 px-1.5 py-0.2 rounded border border-red-300">
                  <ShieldAlert className="w-3.5 h-3.5" /> FAILED
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-[#2e3436] mb-1">
              {verificationResult.proofType.toUpperCase()} Key Assertion Match
            </div>
            <p className="text-[11px] text-[#555753] leading-relaxed">
              {!verificationResult.identityBindingValid && verificationResult.claimedNickInProof
                ? `Identity mismatch: 'd' tag claims "${parsedTags.identifier}", but signature was made for "${verificationResult.claimedNickInProof}".`
                : verificationResult.cryptoSignatureValid && verificationResult.cryptoKeyMatches
                ? `Cryptographic signature matches key in tag (${verificationResult.keyFoundOrRecovered.slice(0, 16)}...).`
                : verificationResult.cryptoError || 'Key verification mismatch or missing signature packet.'}
            </p>
          </div>

          {/* Card 3: External Registry Validation Advisory */}
          <div className="bg-[#eeeeec] rounded border border-[#d3d7cf] p-3.5 text-[#2e3436]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#555753]">Layer 3: External Registry Rule</span>
              <span className="flex items-center gap-1 text-xs text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                <Info className="w-3.5 h-3.5" /> Self-Attestation
              </span>
            </div>
            <div className="text-xs font-bold text-[#2e3436] mb-1">
              Registry Independence
            </div>
            <p className="text-[11px] text-[#555753] leading-relaxed">
              Clients <strong className="text-[#2e3436]">MUST NOT</strong> claim external registry verification without independent validation.
            </p>
          </div>
        </div>
      )}

      {/* Specification Compliance Callout Banner with Pink Box Shading */}
      {verificationResult && (
        <div className={`p-3.5 rounded border ${
          !verificationResult.isOverallValid
            ? 'border-red-400 bg-red-50 text-red-950'
            : 'otc-pink-box'
        }`}>
          <div className="flex items-start gap-2.5">
            <Info className={`w-4 h-4 shrink-0 mt-0.5 ${!verificationResult.isOverallValid ? 'text-red-600' : 'text-[#204a87]'}`} />
            <div className="space-y-1 text-xs leading-relaxed">
              <div className="font-bold text-[#2e3436]">
                Compliance Evaluation for Client Developers:
              </div>
              <p className={!verificationResult.isOverallValid ? 'text-red-900 font-medium' : 'text-[#2e3436]'}>
                {verificationResult.advisoryNotice}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[#555753]">
                <span className={`flex items-center gap-1 ${verificationResult.pubkeyBindingValid ? 'text-emerald-700 font-semibold' : 'text-red-700 font-bold'}`}>
                  {verificationResult.pubkeyBindingValid ? <Check className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                  Claimed npub asserted in text: {verificationResult.pubkeyBindingValid ? 'Yes' : 'No'}
                </span>
                <span>·</span>
                <span className={`flex items-center gap-1 ${verificationResult.identityBindingValid ? 'text-emerald-700 font-semibold' : 'text-red-700 font-bold'}`}>
                  {verificationResult.identityBindingValid ? <Check className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                  'd' Tag Nick Matches Proof: {verificationResult.identityBindingValid ? 'Yes' : 'No'}
                </span>
                <span>·</span>
                <span>Proof Method: {verificationResult.proofType.toUpperCase()}</span>
                {parsedTags.uri && (
                  <>
                    <span>·</span>
                    <a
                      href={parsedTags.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                      className="text-[#0000ee] hover:underline flex items-center gap-1"
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

      {/* Main Content Workspace Container styled with #555753 & #888a85 header */}
      <div className="bg-white rounded border border-[#cccccc] overflow-hidden shadow-xs">
        {/* Workspace Tab Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#555753] border-b border-[#3e403c]">
          <div className="flex flex-wrap items-center gap-1">
            {/* Tab 1: Raw Nostr Event JSON */}
            <button
              onClick={() => setActiveTab('json')}
              className={`otc-nav-btn ${activeTab === 'json' ? 'otc-nav-btn-active' : ''} cursor-pointer`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Raw Nostr Event JSON</span>
              {verificationResult && !verificationResult.isOverallValid ? (
                <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-red-600 text-white font-bold ml-1">
                  Invalid
                </span>
              ) : (
                <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-[#2e3436] text-[#edd400] ml-1">
                  Editor
                </span>
              )}
            </button>

            {/* Tab 2: Parsed Claim Tags & Keys */}
            <button
              onClick={() => setActiveTab('details')}
              className={`otc-nav-btn ${activeTab === 'details' ? 'otc-nav-btn-active' : ''} cursor-pointer`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Parsed Claim Tags &amp; Keys</span>
            </button>

            {/* Tab 3: Signed Content & Signature */}
            <button
              onClick={() => setActiveTab('content')}
              className={`otc-nav-btn ${activeTab === 'content' ? 'otc-nav-btn-active' : ''} cursor-pointer`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Signed Content &amp; Signature</span>
            </button>
          </div>

          <div className="text-[11px] text-[#d3d7cf] font-mono hidden md:block">
            Event ID: {currentEvent.id.slice(0, 16)}...
          </div>
        </div>

        {/* Tab 1 Body: Raw JSON Workspace (Front & Center) */}
        {activeTab === 'json' && (
          <div className="p-4 space-y-3">
            {/* JSON Editor Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#eeeeec]">
              <div className="flex items-center gap-2">
                {parseError ? (
                  <div className="flex items-center gap-1.5 text-xs text-red-900 font-mono bg-red-100 border border-red-300 px-2.5 py-1 rounded">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                    <span>JSON Syntax Error: {parseError}</span>
                  </div>
                ) : verificationResult && !verificationResult.isOverallValid ? (
                  <div className="flex items-center gap-1.5 text-xs text-red-950 font-mono bg-red-100 border-2 border-red-600 px-2.5 py-1 rounded font-bold shadow-2xs">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-red-600" />
                    <span>JSON Parsable · INVALID CRYPTOGRAPHY ({verificationResult.criticalErrors.length} Violation{verificationResult.criticalErrors.length > 1 ? 's' : ''})</span>
                  </div>
                ) : verificationResult && verificationResult.isOverallValid ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-900 font-mono bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded font-bold">
                    <Check className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
                    <span>Valid Event JSON · Kind {currentEvent.kind || 37773} ({parsedTags.proofType?.toUpperCase() || 'OTC'})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-[#555753] font-mono bg-[#eeeeec] border border-[#d3d7cf] px-2.5 py-1 rounded">
                    <span>Kind {currentEvent.kind || 37773} Event JSON · Modified (Click Verify)</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={handleFormatJson}
                  className="otc-btn-gray"
                  title="Format JSON with 2-space indentation"
                >
                  <Sparkles className="w-3 h-3 text-[#edd400]" />
                  <span>Format</span>
                </button>

                <button
                  onClick={handleCopyJson}
                  className="otc-btn-gray"
                  title="Copy JSON to clipboard"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-3 h-3 text-white" />
                      <span className="text-white">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-[#edd400]" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleRunVerification()}
                  disabled={isVerifying}
                  className="otc-btn-gold text-xs"
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
                className="w-full p-3 bg-[#fafafa] rounded border border-[#cccccc] text-xs font-mono text-[#2e3436] placeholder:text-gray-400 focus:outline-none focus:border-[#204a87] focus:bg-white leading-relaxed resize-y"
              />
            </div>

            {/* Status Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#777777] font-mono gap-1 pt-1">
              <div className="flex items-center gap-2">
                <span>{payloadBytes} bytes</span>
                <span>·</span>
                <span>{lineCount} lines</span>
                <span>·</span>
                <span>{currentEvent.tags?.length || 0} tags</span>
              </div>
              <div className="text-[#555753]">
                Tip: Edit any tag or nick above and click <strong className="text-[#204a87]">"Verify Event JSON"</strong> to test protocol enforcement.
              </div>
            </div>
          </div>
        )}

        {/* Tab 2 Body: Structured Tag Details formatted in authentic .otc-table */}
        {activeTab === 'details' && (
          <div className="p-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="otc-table">
                <thead>
                  <tr>
                    <th className="w-24">Tag</th>
                    <th>Value / Identifier</th>
                    <th>Specification Role</th>
                    <th className="w-36 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-mono font-bold text-[#204a87]">["d", ...]</td>
                    <td className="font-mono font-bold">{parsedTags.dTag}</td>
                    <td>
                      <div>Parameterized identifier binding</div>
                      <div className="text-[11px] text-[#777777]">
                        Platform: <strong>{parsedTags.platform || 'bitcoin-otc'}</strong> · Nick: <strong>{parsedTags.identifier || 'N/A'}</strong>
                      </div>
                    </td>
                    <td className="text-center font-mono">
                      {verificationResult?.identityBindingValid ? (
                        <span className="text-emerald-700 font-bold flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Bound
                        </span>
                      ) : (
                        <span className="text-red-700 font-bold flex items-center justify-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> Mismatch
                        </span>
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="font-mono font-bold text-[#204a87]">["proof-type"]</td>
                    <td className="font-mono uppercase font-bold">{parsedTags.proofType}</td>
                    <td>
                      {parsedTags.proofType === 'pgp'
                        ? 'OpenPGP armored cleartext statement with signature packet'
                        : parsedTags.proofType === 'btc'
                        ? 'Bitcoin Signed Message (compact secp256k1 recovery)'
                        : 'Custom external proof method'}
                    </td>
                    <td className="text-center font-mono">
                      <span className="text-emerald-700 font-bold flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Supported
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="font-mono font-bold text-[#204a87]">["key", ...]</td>
                    <td className="font-mono break-all">
                      <div className="flex items-center justify-between gap-1">
                        <span>{parsedTags.key || 'Missing key tag'}</span>
                        <button
                          onClick={() => copyToClipboard(parsedTags.key, 'key')}
                          className="otc-btn-gray p-1"
                          title="Copy key"
                        >
                          {copiedKey === 'key' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                    <td>Asserted public key fingerprint or Bitcoin address</td>
                    <td className="text-center font-mono">
                      {verificationResult?.cryptoKeyMatches ? (
                        <span className="text-emerald-700 font-bold flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Matched
                        </span>
                      ) : (
                        <span className="text-red-700 font-bold flex items-center justify-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> Mismatch
                        </span>
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="font-mono font-bold text-[#204a87]">["uri", ...]</td>
                    <td className="font-mono break-all">
                      {parsedTags.uri ? (
                        <a
                          href={parsedTags.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          className="text-[#0000ee] hover:underline flex items-center gap-1"
                        >
                          <span>{parsedTags.uri}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-[#888a85]">None (optional)</span>
                      )}
                    </td>
                    <td>External Web-of-Trust verification lookup URL</td>
                    <td className="text-center font-mono">
                      {verificationResult?.uriVerification?.status === 'canonical' ? (
                        <span className="text-emerald-700 font-bold flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Canonical
                        </span>
                      ) : (
                        <span className="text-amber-700 flex items-center justify-center gap-1">
                          <Info className="w-3.5 h-3.5" /> External
                        </span>
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="font-mono font-bold text-[#204a87]">pubkey</td>
                    <td className="font-mono break-all">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">{currentEvent.pubkey}</span>
                        <button
                          onClick={() => copyToClipboard(currentEvent.pubkey, 'hex')}
                          className="otc-btn-gray p-1"
                          title="Copy Hex Pubkey"
                        >
                          {copiedKey === 'hex' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                    <td>Nostr Author Hex 32-byte public key</td>
                    <td className="text-center font-mono">
                      {verificationResult?.nostrEventValid ? (
                        <span className="text-emerald-700 font-bold flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Valid
                        </span>
                      ) : (
                        <span className="text-red-700 font-bold flex items-center justify-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> Invalid
                        </span>
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="font-mono font-bold text-[#204a87]">npub</td>
                    <td className="font-mono break-all">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[#204a87] font-semibold truncate">{npub || 'Invalid'}</span>
                        <button
                          onClick={() => copyToClipboard(npub, 'npub')}
                          className="otc-btn-gray p-1"
                          title="Copy Bech32 npub"
                        >
                          {copiedKey === 'npub' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                    <td>Bech32 encoded author public key</td>
                    <td className="text-center font-mono">
                      <span className="text-emerald-700 font-bold flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Bech32
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3 Body: Signed Content */}
        {activeTab === 'content' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#555753]">
              <span className="font-bold text-[#2e3436]">Event Content Payload (Armored Statement)</span>
              <button
                onClick={() => copyToClipboard(currentEvent.content, 'content')}
                className="otc-btn-gray"
              >
                {copiedKey === 'content' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>Copy Payload</span>
              </button>
            </div>
            <pre className="p-3 bg-[#fafafa] rounded border border-[#cccccc] text-xs font-mono text-[#2e3436] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96">
              {currentEvent.content}
            </pre>
            <div className="flex flex-wrap items-center justify-between text-xs text-[#555753] gap-2 pt-2 border-t border-[#eeeeec]">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#204a87]" />
                <span>
                  Schnorr Signature (`sig`): <code className="text-[#2e3436] font-mono">{currentEvent.sig ? currentEvent.sig.slice(0, 32) + '...' : 'Missing'}</code>
                </span>
              </div>
              {verificationResult && (
                verificationResult.nostrSigMatches ? (
                  <span className="flex items-center gap-1 text-emerald-700 text-xs font-mono font-bold">
                    <Check className="w-3.5 h-3.5" /> Nostr Schnorr Valid
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-700 text-xs font-mono font-bold bg-red-100 px-2 py-0.5 rounded border border-red-300">
                    <ShieldAlert className="w-3.5 h-3.5" /> Nostr Schnorr FAILED
                  </span>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
