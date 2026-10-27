import { NostrEvent, VerificationDetails } from '../types/nostr';
import { parseClaimTags, verifyNostrEventIntegrity, getNpubFromPubkey } from './nostrVerifier';
import { verifyPgpProof } from './pgpVerifier';
import { verifyBitcoinProof } from './btcVerifier';

export async function verifyKind37773Claim(
  event: NostrEvent,
  publicKeyArmored?: string
): Promise<VerificationDetails> {
  const parsedTags = parseClaimTags(event);
  const npub = getNpubFromPubkey(event.pubkey);

  // 1. Nostr Event Integrity
  const nostrCheck = verifyNostrEventIntegrity(event);

  let cryptoSignatureValid = false;
  let cryptoKeyMatches = false;
  let keyFoundOrRecovered = '';
  let keyExpected = parsedTags.key;
  let assertionTextSummary = '';
  let cryptoError: string | undefined;
  let cryptoAlgorithm = '';
  let signedTimestamp: string | undefined;

  // 2. Proof-Specific Cryptographic Check
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

  // 4. Client Rule Evaluation
  // Rule: Clients MUST NOT present the external identity as verified by an external registry unless another protocol layer provides that guarantee.
  // Rule: Clients SHOULD distinguish between successful cryptographic verification and validation of an external identity.
  const registryValidGuaranteed = false; // Self-attested claim alone does not guarantee external registry validation
  const distinctionRulePassed = cryptoSignatureValid && cryptoKeyMatches;

  let advisoryNotice = '';
  if (cryptoSignatureValid && cryptoKeyMatches) {
    advisoryNotice = `The cryptographic signature was successfully verified. The claimed Bitcoin-OTC identity is "${parsedTags.identifier || 'unknown'}" on ${parsedTags.platform || 'bitcoin-otc'}. Per Kind 37773 guidelines, clients MUST present this as a cryptographically valid self-attestation, NOT as guaranteed or verified by the bitcoin-otc.com registry itself without an oracle guarantee.`;
  } else if (!cryptoKeyMatches) {
    advisoryNotice = `Key mismatch: Expected key in tag "${parsedTags.key}", but cryptographic signature recovered/found "${keyFoundOrRecovered}".`;
  } else {
    advisoryNotice = cryptoError || 'Cryptographic verification could not be completed.';
  }

  return {
    nostrEventValid: nostrCheck.isValid,
    nostrIdMatches: nostrCheck.idMatches,
    nostrSigMatches: nostrCheck.sigMatches,
    nostrError: nostrCheck.error,

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
  };
}
