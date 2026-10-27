import { verifyEvent, getEventHash, nip19 } from 'nostr-tools';
import { NostrEvent, ParsedClaimTags } from '../types/nostr';

export function parseClaimTags(event: NostrEvent): ParsedClaimTags {
  const dTag = event.tags.find((t) => t[0] === 'd')?.[1] || '';
  const proofTypeRaw = event.tags.find((t) => t[0] === 'proof-type')?.[1] || '';
  const uri = event.tags.find((t) => t[0] === 'uri')?.[1] || '';
  const key = event.tags.find((t) => t[0] === 'key')?.[1] || '';

  let platform = '';
  let identifier = '';
  if (dTag.startsWith('ext:')) {
    const parts = dTag.slice(4).split(':');
    if (parts.length >= 2) {
      platform = parts[0];
      identifier = parts.slice(1).join(':');
    } else {
      platform = parts[0] || '';
    }
  }

  let proofType: 'pgp' | 'btc' | 'other' = 'other';
  const lowerProof = proofTypeRaw.toLowerCase();
  if (lowerProof.includes('pgp') || lowerProof.includes('gpg')) {
    proofType = 'pgp';
  } else if (lowerProof.includes('btc') || lowerProof.includes('bitcoin')) {
    proofType = 'btc';
  }

  const extraTags = event.tags.filter(
    (t) => !['d', 'proof-type', 'uri', 'key'].includes(t[0])
  );

  return {
    dTag,
    platform,
    identifier,
    proofType,
    uri,
    key,
    extraTags,
  };
}

export function getNpubFromPubkey(pubkey: string): string {
  try {
    return nip19.npubEncode(pubkey);
  } catch {
    return '';
  }
}

export function verifyNostrEventIntegrity(event: NostrEvent): {
  isValid: boolean;
  idMatches: boolean;
  sigMatches: boolean;
  computedId: string;
  error?: string;
} {
  try {
    const computedId = getEventHash(event);
    const idMatches = computedId.toLowerCase() === event.id.toLowerCase();
    const sigMatches = verifyEvent(event);

    return {
      isValid: idMatches && sigMatches,
      idMatches,
      sigMatches,
      computedId,
    };
  } catch (err) {
    return {
      isValid: false,
      idMatches: false,
      sigMatches: false,
      computedId: '',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
