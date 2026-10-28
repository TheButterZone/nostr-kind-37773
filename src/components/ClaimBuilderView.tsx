import React, { useState, useEffect, useMemo } from 'react';
import {
  Send,
  Key,
  ShieldCheck,
  Check,
  AlertCircle,
  Copy,
  Radio,
  Sparkles,
  LogOut,
  ExternalLink,
  Trash2,
  RefreshCw,
  PlusCircle,
  Layers,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { NostrEvent, RelayPublishResult } from '../types/nostr';
import { relayPool } from '../lib/relayPool';
import { finalizeEvent, generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';
import { getNpubFromPubkey } from '../lib/nostrVerifier';

interface ClaimBuilderViewProps {
  onEventCreated: (event: NostrEvent) => void;
  onNavigateToVerifier: () => void;
}

interface AuthState {
  pubkey: string;
  npub: string;
  privKeyBytes?: Uint8Array;
  method: 'nip07' | 'nsec';
}

function extractBitcoinSignature(input: string): string {
  const trimmed = input.trim();
  // If already clean base64 signature (65 bytes = 86-90 chars)
  if (trimmed.length >= 80 && trimmed.length <= 96 && /^[A-Za-z0-9+/=]+$/.test(trimmed)) {
    return trimmed;
  }

  // Look through lines if pasted from armor or Electrum dialog
  const lines = trimmed.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length >= 80 && line.length <= 96 && /^[A-Za-z0-9+/=]+$/.test(line)) {
      return line;
    }
  }

  return trimmed;
}

export const ClaimBuilderView: React.FC<ClaimBuilderViewProps> = ({
  onEventCreated,
  onNavigateToVerifier,
}) => {
  // Localized Authentication State
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [hasExtension, setHasExtension] = useState(false);
  const [loginNsec, setLoginNsec] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Sub-tab: 'create' or 'manage'
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'manage'>('create');

  // Form Fields (Create)
  const [proofType, setProofType] = useState<'btc' | 'pgp'>('btc');
  const [platform, setPlatform] = useState('bitcoin-otc');
  const [identifier, setIdentifier] = useState('');
  const [includeUri, setIncludeUri] = useState(true);
  const [externalKey, setExternalKey] = useState('');
  const [btcSignatureInput, setBtcSignatureInput] = useState('');
  const [pgpPayloadInput, setPgpPayloadInput] = useState('');

  const canonicalUri = useMemo(() => {
    const cleanId = identifier.trim();
    if (!cleanId) return 'https://bitcoin-otc.com/viewratingdetail.php?nick=<nick>';
    return `https://bitcoin-otc.com/viewratingdetail.php?nick=${encodeURIComponent(cleanId.toLowerCase())}`;
  }, [identifier]);

  const sanitizePgpKey = (val: string): string => {
    return val.replace(/^0x/i, '').replace(/[\s:-]/g, '').toUpperCase();
  };

  const cleanPgpKey = sanitizePgpKey(externalKey);
  const isPgpKeyHex = /^[0-9A-F]*$/.test(cleanPgpKey);
  const pgpKeyStatus = useMemo(() => {
    if (proofType !== 'pgp' || !cleanPgpKey) return null;
    if (!isPgpKeyHex) {
      return {
        type: 'error' as const,
        message: 'Invalid characters: PGP fingerprint must contain only hexadecimal characters (0-9, A-F).'
      };
    }
    if (cleanPgpKey.length === 8) {
      return {
        type: 'warning' as const,
        message: '⚠️ 32-bit short Key ID detected. 32-bit IDs are vulnerable to collision spoofing ("Evil 32"). The Kind 37773 specification requires your full 40-character PGP fingerprint.'
      };
    }
    if (cleanPgpKey.length === 16) {
      return {
        type: 'warning' as const,
        message: '⚠️ 64-bit long Key ID detected. To ensure collision resistance, the Kind 37773 specification requires your full 40-character PGP fingerprint.'
      };
    }
    if (cleanPgpKey.length === 40) {
      return {
        type: 'success' as const,
        message: '✓ Valid 40-character PGP fingerprint format.'
      };
    }
    if (cleanPgpKey.length < 40) {
      return {
        type: 'info' as const,
        message: `Incomplete fingerprint: ${cleanPgpKey.length}/40 hex characters. Modern OpenPGP and Kind 37773 require the full 40-character fingerprint.`
      };
    }
    return {
      type: 'error' as const,
      message: `Fingerprint is too long: ${cleanPgpKey.length} characters (expected 40 hex characters).`
    };
  }, [proofType, cleanPgpKey, isPgpKeyHex]);

  const cleanBtcAddress = externalKey.replace(/\s+/g, '');
  const btcAddressStatus: { type: 'success' | 'warning' | 'error' | 'info'; message: string } | null = useMemo(() => {
    if (proofType !== 'btc' || !cleanBtcAddress) return null;

    if (/^(bc1|tb1|bcrt1)/i.test(cleanBtcAddress)) {
      return {
        type: 'error' as const,
        message: '⚠️ Native SegWit / Taproot address (bc1...) detected. Bitcoin-OTC identity registrations exclusively use legacy P2PKH addresses (1...). Kind 37773 proofs cannot link bc1 addresses.'
      };
    }

    if (/^3/.test(cleanBtcAddress)) {
      return {
        type: 'error' as const,
        message: '⚠️ P2SH / Multisig address (3...) detected. Bitcoin-OTC identity registrations exclusively use legacy P2PKH addresses (1...). Kind 37773 proofs cannot link 3... addresses.'
      };
    }

    if (/[0OIl]/.test(cleanBtcAddress)) {
      return {
        type: 'error' as const,
        message: 'Invalid Base58 characters detected (characters 0, O, I, and l are not permitted in Base58 addresses).'
      };
    }

    if (!cleanBtcAddress.startsWith('1')) {
      return {
        type: 'error' as const,
        message: 'Invalid address prefix: Bitcoin-OTC identity registrations require legacy P2PKH addresses starting with "1".'
      };
    }

    if (/[^1-9A-HJ-NP-Za-km-z]/.test(cleanBtcAddress)) {
      return {
        type: 'error' as const,
        message: 'Invalid characters: address must contain only valid Base58 characters.'
      };
    }

    if (cleanBtcAddress.length < 26) {
      return {
        type: 'info' as const,
        message: `Incomplete address: ${cleanBtcAddress.length}/26+ characters (legacy P2PKH addresses starting with 1 are typically 26–35 characters).`
      };
    }

    if (cleanBtcAddress.length > 35) {
      return {
        type: 'error' as const,
        message: `Address is too long: ${cleanBtcAddress.length} characters (legacy P2PKH addresses are maximum 35 characters).`
      };
    }

    if (/^1[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(cleanBtcAddress)) {
      return {
        type: 'success' as const,
        message: '✓ Valid legacy P2PKH address format (1...).'
      };
    }

    return {
      type: 'error' as const,
      message: 'Invalid legacy P2PKH address format.'
    };
  }, [proofType, cleanBtcAddress]);

  // Status & Telemetry (Create)
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<RelayPublishResult[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [publishedEvent, setPublishedEvent] = useState<NostrEvent | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Management & Revocation State (Kind 5)
  const [userClaims, setUserClaims] = useState<NostrEvent[]>([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState(false);
  const [manualDTag, setManualDTag] = useState('');
  const [manualEventId, setManualEventId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResults, setDeleteResults] = useState<RelayPublishResult[]>([]);
  const [deleteStatusMessage, setDeleteStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [confirmDeleteDTag, setConfirmDeleteDTag] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).nostr) {
      setHasExtension(true);
    }
  }, []);

  const fetchUserClaims = async (pubkey: string) => {
    setIsLoadingClaims(true);
    try {
      const events = await relayPool.queryEvents({
        kinds: [37773],
        authors: [pubkey],
      });
      const valid = events.filter((e) => e.kind === 37773 && e.pubkey === pubkey);
      valid.sort((a, b) => b.created_at - a.created_at);
      setUserClaims(valid);
    } catch (err) {
      console.error('Failed to query user claims:', err);
    } finally {
      setIsLoadingClaims(false);
    }
  };

  const handleLoginNip07 = async () => {
    setAuthError(null);
    try {
      if (!(window as any).nostr) {
        throw new Error('NIP-07 extension (Alby, nos2x, Amber) not found in window.nostr');
      }
      const pk = await (window as any).nostr.getPublicKey();
      const npub = getNpubFromPubkey(pk);
      const newAuth: AuthState = {
        pubkey: pk,
        npub,
        method: 'nip07',
      };
      setAuth(newAuth);
      fetchUserClaims(pk);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleLoginNsec = (keyString: string) => {
    setAuthError(null);
    try {
      const trimmed = keyString.trim();
      if (!trimmed) throw new Error('Please enter an nsec or hex secret key');

      let skBytes: Uint8Array;
      if (trimmed.startsWith('nsec1')) {
        const decoded = nip19.decode(trimmed);
        if (decoded.type !== 'nsec') throw new Error('Invalid nsec encoded key');
        skBytes = decoded.data;
      } else {
        skBytes = new Uint8Array(
          trimmed.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
        );
        if (skBytes.length !== 32) {
          throw new Error('Hex private key must be exactly 32 bytes (64 hex characters)');
        }
      }

      const pk = getPublicKey(skBytes);
      const npub = getNpubFromPubkey(pk);
      const newAuth: AuthState = {
        pubkey: pk,
        npub,
        privKeyBytes: skBytes,
        method: 'nsec',
      };
      setAuth(newAuth);
      fetchUserClaims(pk);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleGenerateEphemeralKey = () => {
    const sk = generateSecretKey();
    const pk = getPublicKey(sk);
    const npub = getNpubFromPubkey(pk);
    const newAuth: AuthState = {
      pubkey: pk,
      npub,
      privKeyBytes: sk,
      method: 'nsec',
    };
    setAuth(newAuth);
    setAuthError(null);
    fetchUserClaims(pk);
  };

  const handleLogout = () => {
    setAuth(null);
    setPublishedEvent(null);
    setPublishResults([]);
    setStatusMessage(null);
    setUserClaims([]);
    setDeleteResults([]);
    setDeleteStatusMessage(null);
    setConfirmDeleteDTag(null);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Statement Validation & Template Pre-fill
  const userNpub = auth?.npub || 'npub1...';
  const isBtcAddressValid = proofType === 'btc' && btcAddressStatus?.type === 'success';
  const isPgpKeyValid = proofType === 'pgp' && pgpKeyStatus?.type === 'success';
  const isStatementReady = proofType === 'btc' ? isBtcAddressValid : isPgpKeyValid;

  // Real canonical statement (associating external identity <nick> with Nostr pubkey)
  const canonicalStatement = `I, ${identifier || '<username>'}, assert control of Nostr pubkey ${userNpub}. This is a self-attested statement associating external identity ${identifier || '<username>'} with this Nostr identity.`;

  // Gated Display Statement to prevent invalid address embedding
  const displayStatement = useMemo(() => {
    if (proofType === 'btc') {
      if (isBtcAddressValid) {
        return canonicalStatement;
      }
      if (!cleanBtcAddress) {
        return '[Enter a valid legacy P2PKH Bitcoin address (starting with 1) above to generate your statement to sign]';
      }
      if (btcAddressStatus?.type === 'error') {
        return `[Statement locked: Incompatible address format. A legacy P2PKH address (1...) is required to generate statement to sign.]`;
      }
      return '[Awaiting complete legacy P2PKH address (1...)...]';
    } else {
      if (isPgpKeyValid) {
        return canonicalStatement;
      }
      if (!cleanPgpKey) {
        return '[Enter your 40-character PGP fingerprint above to generate statement to sign]';
      }
      if (pgpKeyStatus?.type === 'error') {
        return '[Statement locked: PGP fingerprint contains invalid characters (hexadecimal 0-9, A-F only)]';
      }
      return '[Statement locked: Full 40-character PGP fingerprint required (32-bit and 64-bit Key IDs cannot be used)]';
    }
  }, [proofType, isBtcAddressValid, isPgpKeyValid, canonicalStatement, cleanBtcAddress, btcAddressStatus, cleanPgpKey, pgpKeyStatus]);

  const handleSignAndPublish = async () => {
    if (!auth) {
      setStatusMessage({ text: 'Please connect your Nostr identity first.', isError: true });
      return;
    }

    setStatusMessage(null);
    setPublishResults([]);
    setIsPublishing(true);

    try {
      if (!identifier.trim()) throw new Error('Claimed identifier/username is required');

      const sanitizedKey = proofType === 'pgp' ? sanitizePgpKey(externalKey) : externalKey.trim();
      if (!sanitizedKey) throw new Error('External public key or address is required');

      if (proofType === 'pgp') {
        if (!/^[0-9A-F]+$/.test(sanitizedKey)) {
          throw new Error('PGP fingerprint must contain only hexadecimal characters (0-9, A-F).');
        }
        if (sanitizedKey.length !== 40) {
          if (sanitizedKey.length === 8 || sanitizedKey.length === 16) {
            throw new Error(
              `The Kind 37773 specification requires your full 40-character PGP fingerprint (not a ${sanitizedKey.length * 4}-bit Key ID) to ensure collision resistance.`
            );
          }
          throw new Error(`PGP fingerprint must be exactly 40 hexadecimal characters (got ${sanitizedKey.length}).`);
        }
      }

      if (proofType === 'btc') {
        if (/^(bc1|tb1|bcrt1)/i.test(sanitizedKey)) {
          throw new Error(
            'Native SegWit / Taproot address (bc1...) cannot be used. Bitcoin-OTC identity registrations strictly require legacy P2PKH addresses starting with 1.'
          );
        }
        if (/^3/.test(sanitizedKey)) {
          throw new Error(
            'P2SH / multisig address (3...) cannot be used. Bitcoin-OTC identity registrations strictly require legacy P2PKH addresses starting with 1.'
          );
        }
        if (!/^1[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(sanitizedKey)) {
          throw new Error(
            'Invalid Bitcoin address: Must be a valid legacy P2PKH address starting with 1 (26–35 Base58 characters).'
          );
        }
      }

      const dTag = `ext:${platform.trim()}:${identifier.trim()}`;
      const tags: string[][] = [
        ['d', dTag],
        ['proof-type', proofType],
      ];
      if (includeUri && identifier.trim()) {
        const computedCanonicalUri = `https://bitcoin-otc.com/viewratingdetail.php?nick=${encodeURIComponent(identifier.trim().toLowerCase())}`;
        tags.push(['uri', computedCanonicalUri]);
      }
      tags.push(['key', sanitizedKey]);

      let finalContent = '';
      if (proofType === 'btc') {
        const rawSig = btcSignatureInput.trim();
        if (!rawSig) throw new Error('Bitcoin signature is required');
        const extractedSig = extractBitcoinSignature(rawSig);

        // Standard Bitcoin signed message envelope
        finalContent = `-----BEGIN BITCOIN SIGNED MESSAGE-----\n${canonicalStatement}\n-----BEGIN SIGNATURE-----\n${externalKey.trim()}\n${extractedSig}\n-----END BITCOIN SIGNED MESSAGE-----`;
        tags.push(['sig', extractedSig]);
      } else {
        const rawPgp = pgpPayloadInput.trim();
        if (!rawPgp) throw new Error('Armored PGP cleartext message is required');
        if (!rawPgp.includes('BEGIN PGP SIGNED MESSAGE') || !rawPgp.includes('BEGIN PGP SIGNATURE')) {
          throw new Error('PGP signature must be a complete OpenPGP armored clearsign block.');
        }
        finalContent = rawPgp;
      }

      let signedEvent: NostrEvent;

      if (auth.method === 'nip07') {
        if (!(window as any).nostr) {
          throw new Error('NIP-07 browser extension not found in window.nostr');
        }
        const unsigned = {
          kind: 37773,
          created_at: Math.floor(Date.now() / 1000),
          tags,
          content: finalContent,
          pubkey: auth.pubkey,
        };
        signedEvent = await (window as any).nostr.signEvent(unsigned);
      } else {
        if (!auth.privKeyBytes) throw new Error('Private key missing for signing');
        const unsigned = {
          kind: 37773,
          created_at: Math.floor(Date.now() / 1000),
          tags,
          content: finalContent,
        };
        signedEvent = finalizeEvent(unsigned, auth.privKeyBytes) as NostrEvent;
      }

      setPublishedEvent(signedEvent);
      onEventCreated(signedEvent);

      // Broadcast to relays
      setStatusMessage({ text: 'Broadcasting Bitcoin-OTC proof to active Nostr relays...', isError: false });
      const results = await relayPool.publishEvent(signedEvent, (progress) => {
        setPublishResults((prev) => [...prev.filter((p) => p.relay !== progress.relay), progress]);
      });

      setPublishResults(results);
      const acceptedCount = results.filter((r) => r.accepted).length;
      setStatusMessage({
        text: `Broadcast complete: Accepted by ${acceptedCount} of ${results.length} active relays.`,
        isError: acceptedCount === 0,
      });

      // Refresh claim list in background
      fetchUserClaims(auth.pubkey);
    } catch (err) {
      setStatusMessage({
        text: err instanceof Error ? err.message : String(err),
        isError: true,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Kind 5 Event Deletion Request
  const handleDeleteClaim = async (dTagToRevoke: string, eventId?: string) => {
    if (!auth) return;
    const cleanD = dTagToRevoke.trim();
    if (!cleanD) {
      setDeleteStatusMessage({ text: 'Please specify the d-tag to revoke.', isError: true });
      return;
    }

    setIsDeleting(true);
    setDeleteStatusMessage(null);
    setDeleteResults([]);

    try {
      const coordinate = `37773:${auth.pubkey}:${cleanD}`;
      const tags: string[][] = [
        ['a', coordinate],
        ['k', '37773'],
      ];
      if (eventId && eventId.trim()) {
        tags.push(['e', eventId.trim()]);
      }

      const unsigned = {
        kind: 5,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content: `Revoked Kind 37773 Bitcoin-OTC identity linkage proof: ${cleanD}`,
        pubkey: auth.pubkey,
      };

      let signedEvent: NostrEvent;
      if (auth.method === 'nip07') {
        if (!(window as any).nostr) {
          throw new Error('NIP-07 extension not found in window.nostr');
        }
        signedEvent = await (window as any).nostr.signEvent(unsigned);
      } else {
        if (!auth.privKeyBytes) throw new Error('Private key missing for signing');
        signedEvent = finalizeEvent(unsigned, auth.privKeyBytes) as NostrEvent;
      }

      setDeleteStatusMessage({
        text: `Broadcasting Kind 5 deletion for coordinate ${coordinate}...`,
        isError: false,
      });

      const results = await relayPool.publishEvent(signedEvent, (progress) => {
        setDeleteResults((prev) => [...prev.filter((p) => p.relay !== progress.relay), progress]);
      });

      setDeleteResults(results);
      const acceptedCount = results.filter((r) => r.accepted).length;
      setDeleteStatusMessage({
        text: `Kind 5 Deletion broadcast complete: Accepted by ${acceptedCount} of ${results.length} active relays.`,
        isError: acceptedCount === 0,
      });

      // Remove from local list
      setUserClaims((prev) => prev.filter((ev) => ev.tags.find((t) => t[0] === 'd')?.[1] !== cleanD));
      setConfirmDeleteDTag(null);
      setManualDTag('');
      setManualEventId('');
    } catch (err) {
      setDeleteStatusMessage({
        text: err instanceof Error ? err.message : String(err),
        isError: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // If NOT authenticated, show the localized auth gate
  if (!auth) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="otc-pink-box text-center space-y-4">
          <div className="w-12 h-12 rounded bg-[#555753] border border-[#3e403c] mx-auto flex items-center justify-center text-[#edd400]">
            <Key className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-[#2e3436]">
              Connect Nostr Identity to Build &amp; Manage Claims
            </h1>
            <p className="text-xs text-[#555753] mt-2 max-w-lg mx-auto leading-relaxed">
              Log in with your Nostr key so your exact <code className="text-[#204a87] font-mono font-semibold">npub</code> is immediately embedded into the statement template, and you can revoke existing claims via Kind 5. Public tabs (Proof Verifier, UX Guidelines, Relays, Spec) remain open without login.
            </p>
          </div>

          <div className="space-y-3 max-w-md mx-auto pt-1">
            {hasExtension && (
              <button
                type="button"
                onClick={handleLoginNip07}
                className="w-full otc-btn-gold py-2 justify-center text-xs shadow-xs"
              >
                <span>Connect via Nostr Extension (NIP-07)</span>
              </button>
            )}

            <div className="bg-white/80 p-3 rounded border border-[#f6bed1] space-y-2 text-left">
              <label className="block text-xs font-bold text-[#2e3436]">
                Or enter nsec or 32-byte hex secret key:
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={loginNsec}
                  onChange={(e) => setLoginNsec(e.target.value)}
                  placeholder="nsec1... or hex key"
                  className="flex-1 px-3 py-1.5 bg-[#fafafa] border border-[#cccccc] rounded text-xs font-mono text-[#2e3436] focus:outline-none focus:border-[#204a87]"
                />
                <button
                  type="button"
                  onClick={() => handleLoginNsec(loginNsec)}
                  className="otc-btn-gold text-xs"
                >
                  Log In
                </button>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleGenerateEphemeralKey}
                className="text-xs text-[#0000ee] hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#204a87]" />
                <span>Generate Ephemeral Test Keypair</span>
              </button>
            </div>

            {authError && (
              <div className="p-2.5 rounded bg-red-100 border border-red-300 text-red-950 text-xs flex items-center gap-2 text-left font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{authError}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Authenticated State
  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Identity Banner & Mode Navigation */}
      <div className="bg-white rounded border border-[#cccccc] overflow-hidden shadow-xs">
        <div className="bg-[#555753] p-3 text-[#d3d7cf] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded bg-[#2e3436] border border-[#737671] flex items-center justify-center text-[#edd400] font-bold text-xs shrink-0">
              ✓
            </div>
            <div className="min-w-0">
              <span className="text-[11px] text-[#babdb6] block">Authenticated Nostr Author:</span>
              <span className="text-xs font-mono font-semibold text-[#edd400] truncate block">
                {auth.npub}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="otc-btn-gray self-start sm:self-center"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnect</span>
          </button>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex flex-wrap gap-2 p-3 bg-white border-b border-[#cccccc]">
          <button
            type="button"
            onClick={() => setActiveSubTab('create')}
            className={`otc-nav-btn ${activeSubTab === 'create' ? 'otc-nav-btn-active' : ''} cursor-pointer`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Publish New Proof (Kind 37773)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('manage')}
            className={`otc-nav-btn ${activeSubTab === 'manage' ? 'otc-nav-btn-active' : ''} cursor-pointer`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Revoke / Delete Proof (Kind 5)</span>
            {userClaims.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded bg-[#2e3436] text-[10px] text-[#edd400] font-mono">
                {userClaims.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* VIEW A: CREATE NEW CLAIM */}
      {activeSubTab === 'create' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left Column: Metadata & Pre-Filled Statement */}
            <div className="bg-white rounded border border-slate-300 p-5 space-y-4 shadow-xs">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                1. Bitcoin-OTC Proof Metadata
              </h2>

              {/* Proof Type Toggle */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5 font-mono">
                  Proof Method (`proof-type` tag)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProofType('btc')}
                    className={`px-3 py-2 text-xs font-semibold rounded border transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      proofType === 'btc'
                        ? 'bg-amber-50 text-amber-900 border-amber-400 font-bold'
                        : 'bg-slate-100 text-slate-700 border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <span>Bitcoin Signature (BTC)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProofType('pgp')}
                    className={`px-3 py-2 text-xs font-semibold rounded border transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      proofType === 'pgp'
                        ? 'bg-amber-50 text-amber-900 border-amber-400 font-bold'
                        : 'bg-slate-100 text-slate-700 border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <span>PGP Clearsign</span>
                  </button>
                </div>
              </div>

              {/* Platform & Identifier */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Platform Name
                    </label>
                    <span className="text-[10px] text-blue-700 font-mono">Kind 37773 dedicated</span>
                  </div>
                  <input
                    type="text"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    placeholder="bitcoin-otc"
                    className="w-full px-3 py-1.5 bg-[#FBFBFC] border border-slate-300 rounded text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Kind 37773 is dedicated to Bitcoin-OTC.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Bitcoin-OTC Nick / ID
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="thebutterzone"
                    className="w-full px-3 py-1.5 bg-[#FBFBFC] border border-slate-300 rounded text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-700"
                  />
                </div>
              </div>

              {/* URI tag */}
              <div className="bg-slate-50 rounded p-3 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-800 flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeUri}
                      onChange={(e) => setIncludeUri(e.target.checked)}
                      className="rounded border-slate-300 text-blue-700 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span>Include canonical Bitcoin-OTC profile link (<code className="text-blue-800 font-mono">["uri", ...]</code>)</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono bg-slate-200 px-1.5 py-0.5 rounded">optional</span>
                </div>

                {includeUri ? (
                  <div className="space-y-1 pt-1 border-t border-slate-200">
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>Canonical URL (strictly bound to nick &amp; bitcoin-otc.com):</span>
                    </div>
                    <div className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono text-blue-800 break-all select-all flex items-center justify-between gap-2">
                      <span>{canonicalUri}</span>
                      {identifier.trim() && (
                        <a
                          href={canonicalUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:underline shrink-0 p-1 rounded"
                          title="Preview canonical profile link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                    The <code className="text-slate-600 font-mono">["uri", ...]</code> tag will be omitted from the event payload.
                  </p>
                )}
              </div>

              {/* Key tag */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">
                    {proofType === 'btc' ? 'External Bitcoin Address' : 'External PGP Fingerprint'} (`key` tag)
                  </label>
                  {proofType === 'pgp' ? (
                    <span className="text-[10px] text-blue-700 font-mono">
                      Full 40-char fingerprint required
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-800 font-mono">
                      Legacy P2PKH (1...) required
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={externalKey}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (proofType === 'pgp') {
                      setExternalKey(sanitizePgpKey(val));
                    } else {
                      setExternalKey(val.replace(/\s+/g, ''));
                    }
                  }}
                  placeholder={
                    proofType === 'btc'
                      ? 'Bitcoin Address (e.g. 1FvyAqqELFiQyaEWdhFbWF8MZapKPZS8J7)'
                      : 'PGP Fingerprint (e.g. C0A62F7AD5C16FB75A14A20D750A6640C5E4961B)'
                  }
                  className="w-full px-3 py-1.5 bg-[#FBFBFC] border border-slate-300 rounded text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-700"
                />

                {proofType === 'btc' && (
                  <div className="mt-1 space-y-1">
                    {btcAddressStatus && (
                      <div
                        className={`text-[11px] px-2.5 py-1.5 rounded border leading-relaxed ${
                          btcAddressStatus.type === 'success'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : btcAddressStatus.type === 'warning'
                            ? 'bg-amber-50 border-amber-300 text-amber-900 font-medium'
                            : btcAddressStatus.type === 'error'
                            ? 'bg-red-50 border-red-300 text-red-900'
                            : 'bg-slate-100 border-slate-300 text-slate-700'
                        }`}
                      >
                        {btcAddressStatus.message}
                      </div>
                    )}
                    {!externalKey && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                        <span>Must be a legacy P2PKH address starting with 1.</span>
                        <button
                          type="button"
                          onClick={() => setExternalKey('1FvyAqqELFiQyaEWdhFbWF8MZapKPZS8J7')}
                          className="text-blue-700 hover:underline font-mono text-[10px] cursor-pointer"
                        >
                          Fill Example P2PKH Address
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {proofType === 'pgp' && (
                  <div className="mt-1 space-y-1">
                    {pgpKeyStatus && (
                      <div
                        className={`text-[11px] px-2.5 py-1.5 rounded border leading-relaxed ${
                          pgpKeyStatus.type === 'success'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : pgpKeyStatus.type === 'warning'
                            ? 'bg-amber-50 border-amber-300 text-amber-900 font-medium'
                            : pgpKeyStatus.type === 'error'
                            ? 'bg-red-50 border-red-300 text-red-900'
                            : 'bg-slate-100 border-slate-300 text-slate-700'
                        }`}
                      >
                        {pgpKeyStatus.message}
                      </div>
                    )}
                    {!externalKey && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                        <span>Must be the full 40-character fingerprint.</span>
                        <button
                          type="button"
                          onClick={() => setExternalKey('C0A62F7AD5C16FB75A14A20D750A6640C5E4961B')}
                          className="text-blue-700 hover:underline font-mono text-[10px] cursor-pointer"
                        >
                          Fill Example Fingerprint
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Statement Template with Real npub & Address Gating */}
              <div className="bg-slate-50 rounded p-3 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-700">
                  <span className={`font-semibold flex items-center gap-1.5 ${isStatementReady ? 'text-blue-800' : 'text-slate-600'}`}>
                    {isStatementReady ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    <span>Statement to Sign:</span>
                  </span>
                  <button
                    type="button"
                    disabled={!isStatementReady}
                    onClick={() => copyToClipboard(canonicalStatement, 'statement')}
                    className={`flex items-center gap-1 transition-colors ${
                      isStatementReady
                        ? 'text-blue-700 hover:underline cursor-pointer'
                        : 'text-slate-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {copiedKey === 'statement' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy Statement</span>
                  </button>
                </div>
                <div
                  className={`text-xs font-mono p-2.5 rounded border leading-relaxed whitespace-pre-wrap ${
                    isStatementReady
                      ? 'text-slate-900 bg-white border-slate-300 select-all'
                      : 'text-slate-500 bg-slate-100 border-slate-200 italic select-none'
                  }`}
                >
                  {displayStatement}
                </div>
                <p className="text-[11px] text-slate-500">
                  {!isStatementReady
                    ? proofType === 'btc'
                      ? 'Legacy P2PKH address (1...) validation required before statement is generated.'
                      : 'Full 40-character PGP fingerprint validation required before statement is generated.'
                    : proofType === 'btc'
                    ? 'Paste this statement into your Bitcoin wallet (Electrum) and sign with your address.'
                    : 'Sign this statement with your PGP key (`gpg --clearsign`).'}
                </p>
              </div>
            </div>

            {/* Right Column: Signature & Broadcasting */}
            <div className="bg-white rounded border border-slate-300 p-5 space-y-4 shadow-xs">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                2. Signature &amp; Broadcast
              </h2>

              {proofType === 'btc' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Bitcoin Signature (Paste detached base64 from Electrum or wallet)
                  </label>
                  <textarea
                    rows={5}
                    value={btcSignatureInput}
                    onChange={(e) => setBtcSignatureInput(e.target.value)}
                    placeholder="Paste the base64 signature string (e.g. H0as+974mZWBUDqkFHwRpoaHPMi/CCKnbcyju8ty4rI4Y5Lfly1DxuWG5eM24FJj+XUPEE71Up8Y+Hs7Jmr1zJI=)"
                    className="w-full px-3 py-2 bg-[#FBFBFC] border border-slate-300 rounded text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-700 resize-y"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Accepts either the raw detached base64 signature or an armored signature block.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    OpenPGP Armored Clearsign (`content` payload)
                  </label>
                  <textarea
                    rows={7}
                    value={pgpPayloadInput}
                    onChange={(e) => setPgpPayloadInput(e.target.value)}
                    placeholder="-----BEGIN PGP SIGNED MESSAGE-----\nHash: SHA256\n...\n-----BEGIN PGP SIGNATURE-----\n...\n-----END PGP SIGNATURE-----"
                    className="w-full px-3 py-2 bg-[#FBFBFC] border border-slate-300 rounded text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-700 resize-y"
                  />
                </div>
              )}

              {/* Primary Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSignAndPublish}
                  disabled={isPublishing}
                  className="w-full otc-btn-gold py-2.5 justify-center text-xs shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Send className={`w-4 h-4 ${isPublishing ? 'animate-pulse' : ''}`} />
                  <span>{isPublishing ? 'Broadcasting to Relays...' : 'Sign & Broadcast Kind 37773 Bitcoin-OTC Proof'}</span>
                </button>
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div
                  className={`p-3 rounded border text-xs flex items-start gap-2 ${
                    statusMessage.isError
                      ? 'bg-red-100 border-red-300 text-red-950 font-semibold'
                      : 'bg-emerald-100 border-emerald-300 text-emerald-950 font-semibold'
                  }`}
                >
                  {statusMessage.isError ? (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  ) : (
                    <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
                  )}
                  <span className="leading-relaxed">{statusMessage.text}</span>
                </div>
              )}

              {/* Shortcut to Proof Verifier */}
              {publishedEvent && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onNavigateToVerifier}
                    className="w-full otc-btn-gray py-2 justify-center text-xs cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#edd400]" />
                    <span>Inspect &amp; Verify in Proof Verifier</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Live Relay Broadcast Telemetry */}
          {publishResults.length > 0 && (
            <div className="bg-white rounded border border-slate-300 p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Radio className="w-4 h-4 text-blue-700" />
                  <span>Relay Broadcast Telemetry</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {publishResults.map((res) => (
                  <div
                    key={res.relay}
                    className="bg-slate-50 rounded border border-slate-200 p-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-slate-800 font-semibold truncate">{res.relay}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">{res.reason}</div>
                    </div>

                    <div className="shrink-0">
                      {res.accepted ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-medium">
                          Accepted
                        </span>
                      ) : res.success ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-medium">
                          Rejected
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-900 border border-red-300 font-medium">
                          Failed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* VIEW B: MANAGE & REVOKE CLAIMS (KIND 5) */}
      {activeSubTab === 'manage' && (
        <div className="space-y-5">
          {/* Explanation Banner */}
          <div className="bg-white rounded border border-slate-300 p-5 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase font-mono">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>NIP-09 Parameterized Event Deletion (Kind 5)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              In Nostr, parameterized replaceable events (Kind 37773) are revoked by publishing a <code className="text-rose-800 font-mono">kind: 5</code> deletion request tagged with coordinate <code className="text-rose-800 font-mono">[&quot;a&quot;, &quot;37773:{auth.pubkey.slice(0, 10)}...:&lt;d_tag&gt;&quot;]</code> and <code className="text-rose-800 font-mono">[&quot;k&quot;, &quot;37773&quot;]</code>. Relays supporting NIP-09 will discard the stored Bitcoin-OTC proof and cease serving it to clients.
            </p>
          </div>

          {/* Discovered Active Claims */}
          <div className="bg-white rounded border border-slate-300 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                  Active Bitcoin-OTC Proofs on Connected Relays
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kind 37773 Bitcoin-OTC proofs found for your pubkey across active relays.
                </p>
              </div>

              <button
                type="button"
                onClick={() => fetchUserClaims(auth.pubkey)}
                disabled={isLoadingClaims}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingClaims ? 'animate-spin text-blue-700' : ''}`} />
                <span>{isLoadingClaims ? 'Querying Relays...' : 'Refresh'}</span>
              </button>
            </div>

            {isLoadingClaims ? (
              <div className="py-8 text-center text-xs text-slate-500 animate-pulse font-mono">
                Querying active relays for Kind 37773 proofs matching {auth.npub}...
              </div>
            ) : userClaims.length === 0 ? (
              <div className="bg-slate-50 rounded p-6 border border-slate-200 text-center space-y-2">
                <Layers className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 font-medium">
                  No active Kind 37773 Bitcoin-OTC proofs found on connected relays for your pubkey.
                </p>
                <p className="text-[11px] text-slate-500">
                  If you already published a proof that has not returned yet, you can revoke it manually below.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {userClaims.map((claim) => {
                  const dTag = claim.tags.find((t) => t[0] === 'd')?.[1] || 'unknown';
                  const pType = claim.tags.find((t) => t[0] === 'proof-type')?.[1] || 'unknown';
                  const keyTag = claim.tags.find((t) => t[0] === 'key')?.[1] || '';
                  const isConfirming = confirmDeleteDTag === dTag;

                  return (
                    <div
                      key={claim.id}
                      className="bg-slate-50 rounded border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-blue-900 truncate">
                            {dTag}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              pType === 'btc'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-blue-100 text-blue-900 border-blue-300'
                            }`}
                          >
                            {pType.toUpperCase()}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {new Date(claim.created_at * 1000).toLocaleString()}
                          </span>
                        </div>

                        {keyTag && (
                          <div className="text-[11px] text-slate-600 font-mono truncate">
                            Key: {keyTag}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          ID: {claim.id}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isConfirming ? (
                          <div className="flex items-center gap-2 bg-rose-50 p-1.5 rounded border border-rose-300">
                            <span className="text-[11px] text-rose-900 font-medium">Confirm deletion?</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteClaim(dTag, claim.id)}
                              disabled={isDeleting}
                              className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-semibold rounded cursor-pointer disabled:opacity-50"
                            >
                              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteDTag(null)}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] rounded cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteDTag(dTag)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Revoke Proof</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Manual Revocation by d-tag */}
          <div className="bg-white rounded border border-slate-300 p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Manual Bitcoin-OTC Proof Revocation by `d` Tag
            </h3>
            <p className="text-xs text-slate-500">
              Broadcast a Kind 5 deletion for a specific coordinate even if not retrieved from current relays.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Identifier (`d` tag value) *
                </label>
                <input
                  type="text"
                  value={manualDTag}
                  onChange={(e) => setManualDTag(e.target.value)}
                  placeholder="ext:bitcoin-otc:thebutterzone"
                  className="w-full px-3 py-1.5 bg-[#FBFBFC] border border-slate-300 rounded text-xs font-mono text-slate-900 focus:outline-none focus:border-rose-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Event ID (`e` tag, optional)
                </label>
                <input
                  type="text"
                  value={manualEventId}
                  onChange={(e) => setManualEventId(e.target.value)}
                  placeholder="Hex event ID (optional)"
                  className="w-full px-3 py-1.5 bg-[#FBFBFC] border border-slate-300 rounded text-xs font-mono text-slate-900 focus:outline-none focus:border-rose-600"
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => handleDeleteClaim(manualDTag, manualEventId)}
                disabled={isDeleting || !manualDTag.trim()}
                className="py-2 px-4 bg-rose-700 hover:bg-rose-800 active:bg-rose-900 disabled:opacity-50 text-white font-semibold text-xs rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Broadcasting Deletion...' : 'Broadcast Kind 5 Deletion Request'}</span>
              </button>
            </div>

            {/* Delete Status Message */}
            {deleteStatusMessage && (
              <div
                className={`p-3 rounded border text-xs flex items-start gap-2 ${
                  deleteStatusMessage.isError
                    ? 'bg-red-50 border-red-300 text-red-900'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}
              >
                {deleteStatusMessage.isError ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                ) : (
                  <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                )}
                <span className="leading-relaxed">{deleteStatusMessage.text}</span>
              </div>
            )}
          </div>

          {/* Delete Broadcast Telemetry */}
          {deleteResults.length > 0 && (
            <div className="bg-white rounded border border-slate-300 p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 font-mono">
                <Radio className="w-4 h-4 text-rose-700" />
                <span>Kind 5 Relay Deletion Telemetry</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {deleteResults.map((res) => (
                  <div
                    key={res.relay}
                    className="bg-slate-50 rounded border border-slate-200 p-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-slate-800 font-semibold truncate">{res.relay}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">{res.reason}</div>
                    </div>

                    <div className="shrink-0">
                      {res.accepted ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-medium">
                          Accepted
                        </span>
                      ) : res.success ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-medium">
                          Rejected
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-900 border border-red-300 font-medium">
                          Failed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
