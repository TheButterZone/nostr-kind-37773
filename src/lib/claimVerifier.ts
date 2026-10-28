import { NostrEvent, VerificationDetails } from '../types/nostr';
import { parseClaimTags, verifyNostrEventIntegrity, getNpubFromPubkey } from './nostrVerifier';
import { verifyPgpProof } from './pgpVerifier';
import { verifyBitcoinProof } from './btcVerifier';

export function extractNickFromAssertion(text: string): string | null {
  if (!text) return null;
  // Match "I, <nick>, assert control" or "I <nick> assert control"
  const m0 = text.match(/(?:I,\s*|I\s+)([a-zA-Z0-9_\-\.]+)[,\s]+assert\s+control/i);
  if (m0 && m0[1]) return m0[1].trim();

  // Match "I am <nick> on bitcoin-otc" or "I am <nick> on #bitcoin-otc"
  const m1 = text.match(/(?:I am|I'm|I,)\s+([a-zA-Z0-9_\-\.]+)\s+on\s+(?:#)?bitcoin-otc/i);
  if (m1 && m1[1]) return m1[1].trim();

  // Match "bitcoin-otc nick: <nick>" or "nick: <nick>"
  const m2 = text.match(/(?:bitcoin-otc\s+)?nick\s*[:=]\s*([a-zA-Z0-9_\-\.]+)/i);
  if (m2 && m2[1]) return m2[1].trim();

  // Match "external identity <nick>"
  const m3 = text.match(/external\s+identity\s+([a-zA-Z0-9_\-\.]+)/i);
  if (m3 && m3[1]) return m3[1].trim();

  // Match "ext:bitcoin-otc:<nick>"
  const m4 = text.match(/ext:bitcoin-otc:([a-zA-Z0-9_\-\.]+)/i);
  if (m4 && m4[1]) return m4[1].trim();

  return null;
}

export async function verifyKind37773Claim(
  event: NostrEvent,
  publicKeyArmored?: string
): Promise<VerificationDetails> {
  const parsedTags = parseClaimTags(event);
  const npub = getNpubFromPubkey(event.pubkey);

  // 1. Nostr Event Integrity (L1)
  const nostrCheck = verifyNostrEventIntegrity(event);

  let cryptoSignatureValid = false;
  let cryptoKeyMatches = false;
  let keyFoundOrRecovered = '';
  let keyExpected = parsedTags.key;
  let assertionTextSummary = '';
  let cryptoError: string | undefined;
  let cryptoAlgorithm = '';
  let signedTimestamp: string | undefined;

  // 2. Proof-Specific Cryptographic Check (L2)
  if (parsedTags.proofType === 'pgp') {
    cryptoAlgorithm = 'OpenPGP (RFC 4880 / 9580)';
    const pgpRes = await verifyPgpProof(event.content, parsedTags.key, publicKeyArmored);
    cryptoSignatureValid = pgpRes.signatureValid;
    cryptoKeyMatches = pgpRes.keyMatches;
    keyFoundOrRecovered = pgpRes.foundFingerprint || pgpRes.foundKeyId || 'Unknown Key ID';
    assertionTextSummary = pgpRes.signedText || event.content;
    signedTimestamp = pgpRes.createdDate;
    cryptoError = pgpRes.error;
  } else if (parsedTags.proofType === 'btc') {
    cryptoAlgorithm = 'Bitcoin Signed Message (secp256k1 / BIP-137)';
    const btcRes = verifyBitcoinProof(event.content, parsedTags.key);
    cryptoSignatureValid = btcRes.signatureValid;
    cryptoKeyMatches = btcRes.keyMatches;
    keyFoundOrRecovered = btcRes.recoveredAddress || 'Unrecoverable Address';
    assertionTextSummary = btcRes.signedMessage || event.content;
    cryptoError = btcRes.error;
  } else {
    cryptoAlgorithm = 'Unrecognized proof-type';
    cryptoError = `Unknown or unsupported proof-type: "${parsedTags.proofType}". Expected "pgp" or "btc".`;
  }

  // 3. Check whether the assertion content mentions the author's pubkey or npub
  const lowerAssertion = (assertionTextSummary || event.content).toLowerCase();
  const assertionContainsPubkey = !!(event.pubkey && lowerAssertion.includes(event.pubkey.toLowerCase()));
  const assertionContainsNpub = !!(npub && lowerAssertion.includes(npub.toLowerCase()));
  const pubkeyBindingValid = assertionContainsPubkey || assertionContainsNpub;

  // 4. Nick extraction & Identity Binding
  const claimedNickInProof = extractNickFromAssertion(assertionTextSummary || event.content) || undefined;
  const dTagValid = parsedTags.dTag.startsWith('ext:bitcoin-otc:') && parsedTags.identifier.trim().length > 0;

  let identityBindingValid = false;
  if (claimedNickInProof && parsedTags.identifier) {
    identityBindingValid = parsedTags.identifier.trim().toLowerCase() === claimedNickInProof.trim().toLowerCase();
  } else if (parsedTags.identifier) {
    identityBindingValid = lowerAssertion.includes(parsedTags.identifier.trim().toLowerCase());
  }

  // 5. Critical Errors Collection
  const criticalErrors: string[] = [];

  if (!nostrCheck.isValid) {
    criticalErrors.push(
      nostrCheck.error ||
        'Nostr Event Integrity Failure: SHA-256 event ID commitment or Schnorr signature is invalid. The event contents/tags have been tampered with.'
    );
  }

  if (!dTagValid) {
    criticalErrors.push(
      `Invalid 'd' tag: "${parsedTags.dTag}". Kind 37773 mandates the format "ext:bitcoin-otc:<nick>".`
    );
  }

  if (!identityBindingValid) {
    criticalErrors.push(
      claimedNickInProof
        ? `Identity Mismatch: Event 'd' tag claims nick "${parsedTags.identifier}", but the signed cryptographic proof is for nick "${claimedNickInProof}".`
        : `Identity Mismatch: The claimed nick "${parsedTags.identifier}" is missing from the signed cryptographic proof message.`
    );
  }

  if (!pubkeyBindingValid) {
    criticalErrors.push(
      `Author Pubkey Binding Mismatch: Cryptographic proof does not bind author Nostr pubkey (${event.pubkey ? event.pubkey.slice(0, 16) + '...' : 'none'}) or npub.`
    );
  }

  if (!cryptoSignatureValid) {
    criticalErrors.push(
      `Cryptographic Proof Invalid: ${cryptoError || 'Failed to verify signature on proof content.'}`
    );
  }

  if (!cryptoKeyMatches) {
    criticalErrors.push(
      `Key Mismatch: Expected key in tag "${parsedTags.key}", but cryptographic signature used "${keyFoundOrRecovered}".`
    );
  }

  const isOverallValid =
    nostrCheck.isValid &&
    dTagValid &&
    identityBindingValid &&
    pubkeyBindingValid &&
    cryptoSignatureValid &&
    cryptoKeyMatches;

  // 6. Client Rule Evaluation
  // Rule: Clients MUST NOT present the external identity as verified by an external registry unless another protocol layer provides that guarantee.
  // Rule: Clients SHOULD distinguish between successful cryptographic verification and validation of an external identity.
  const registryValidGuaranteed = false;
  const distinctionRulePassed = isOverallValid;

  let advisoryNotice = '';
  if (isOverallValid) {
    advisoryNotice = `The cryptographic signature was successfully verified. The claimed Bitcoin-OTC identity is "${parsedTags.identifier || 'unknown'}" on ${parsedTags.platform || 'bitcoin-otc'}. Per Kind 37773 guidelines, clients MUST present this as a cryptographically valid self-attestation, NOT as guaranteed or verified by the bitcoin-otc.com registry itself without an oracle guarantee.`;
  } else if (!isOverallValid) {
    advisoryNotice = `VERIFICATION FAILED: Event fails Kind 37773 specification or cryptographic integrity. ${criticalErrors[0] || 'Invalid event.'}`;
  }

  // 7. URI Integrity Check
  let uriVerification: VerificationDetails['uriVerification'];
  if (!parsedTags.uri.trim()) {
    uriVerification = {
      status: 'none',
      message: 'No URI tag present (optional per Kind 37773 specification).',
    };
  } else {
    try {
      const parsedUrl = new URL(parsedTags.uri.trim());
      const host = parsedUrl.hostname.toLowerCase();
      if (host !== 'bitcoin-otc.com' && host !== 'www.bitcoin-otc.com') {
        uriVerification = {
          status: 'domain_mismatch',
          message: `Non-canonical domain "${parsedUrl.hostname}". Kind 37773 is dedicated to Bitcoin-OTC; URI MUST point exclusively to bitcoin-otc.com.`,
        };
      } else {
        const nickParam = parsedUrl.searchParams.get('nick') || '';
        const cleanExpected = parsedTags.identifier.trim().toLowerCase();
        if (!nickParam) {
          uriVerification = {
            status: 'nick_mismatch',
            message: 'URI is missing the required ?nick= query parameter.',
          };
        } else if (cleanExpected && nickParam.toLowerCase() !== cleanExpected) {
          uriVerification = {
            status: 'nick_mismatch',
            message: `URI nick parameter ("${nickParam}") does not match claimed nick ("${parsedTags.identifier}"). Potential profile spoof.`,
          };
        } else {
          uriVerification = {
            status: 'canonical',
            message: `Canonical Bitcoin-OTC profile link verified for nick "${parsedTags.identifier}".`,
            canonicalUrl: parsedTags.uri.trim(),
          };
        }
      }
    } catch {
      uriVerification = {
        status: 'invalid_url',
        message: 'URI tag does not contain a valid parseable URL.',
      };
    }
  }

  return {
    isOverallValid,
    criticalErrors,

    nostrEventValid: nostrCheck.isValid,
    nostrIdMatches: nostrCheck.idMatches,
    nostrSigMatches: nostrCheck.sigMatches,
    nostrError: nostrCheck.error,

    dTagValid,
    identityBindingValid,
    pubkeyBindingValid,
    claimedNickInProof,

    proofType: parsedTags.proofType,
    cryptoSignatureValid,
    cryptoKeyMatches,
    keyFoundOrRecovered,
    keyExpected,
    assertionContainsPubkey,
    assertionContainsNpub,
    assertionTextSummary,
    cryptoError,
    cryptoAlgorithm,
    signedTimestamp,

    registryValidGuaranteed,
    distinctionRulePassed,
    advisoryNotice,
    uriVerification,
  };
}
