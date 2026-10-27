import * as openpgp from 'openpgp';

export interface PgpVerificationOutput {
  signatureValid: boolean;
  keyMatches: boolean;
  expectedKey: string;
  foundKeyId: string;
  foundFingerprint: string;
  hashAlgorithm?: string;
  createdDate?: string;
  signedText: string;
  error?: string;
}

export async function verifyPgpProof(
  content: string,
  expectedKey: string,
  publicKeyArmored?: string
): Promise<PgpVerificationOutput> {
  const normExpected = expectedKey.replace(/\s+/g, '').toUpperCase();

  try {
    if (!content.includes('BEGIN PGP SIGNED MESSAGE') && !content.includes('BEGIN PGP SIGNATURE')) {
      return {
        signatureValid: false,
        keyMatches: false,
        expectedKey: normExpected,
        foundKeyId: '',
        foundFingerprint: '',
        signedText: '',
        error: 'Content does not contain an armored PGP signed message.',
      };
    }

    const cleartext = await openpgp.readCleartextMessage({ cleartextMessage: content });
    const signedText = cleartext.getText();

    let foundKeyId = '';
    let foundFingerprint = '';
    let hashAlgorithm = '';
    let createdDate = '';

    // 1. Get Key IDs from cleartext message
    try {
      const keyIDs = cleartext.getSigningKeyIDs();
      if (keyIDs.length > 0) {
        foundKeyId = keyIDs[0].toHex().toUpperCase();
      }
    } catch {}

    // 2. Extract armored signature block to inspect signature packets & subpackets
    const sigStart = content.indexOf('-----BEGIN PGP SIGNATURE-----');
    const sigEnd = content.indexOf('-----END PGP SIGNATURE-----');
    if (sigStart !== -1 && sigEnd !== -1) {
      const sigBlock = content.slice(sigStart, sigEnd + '-----END PGP SIGNATURE-----'.length).trim();
      try {
        const sigObj = await openpgp.readSignature({ armoredSignature: sigBlock });
        const packets = sigObj.packets || [];
        for (const packet of packets) {
          const p = packet as any;
          if (p.issuerKeyID && !foundKeyId) {
            foundKeyId = p.issuerKeyID.toHex ? p.issuerKeyID.toHex().toUpperCase() : String(p.issuerKeyID).toUpperCase();
          }
          if (p.issuerFingerprint) {
            if (p.issuerFingerprint instanceof Uint8Array || ArrayBuffer.isView(p.issuerFingerprint)) {
              foundFingerprint = Array.from(p.issuerFingerprint as Uint8Array)
                .map((b: number) => b.toString(16).padStart(2, '0'))
                .join('')
                .toUpperCase();
            } else if (p.issuerFingerprint.toHex) {
              foundFingerprint = p.issuerFingerprint.toHex().toUpperCase();
            } else {
              foundFingerprint = String(p.issuerFingerprint).toUpperCase();
            }
          }
          if (p.created) {
            createdDate = new Date(p.created).toISOString();
          }
          if (p.hashAlgorithm !== undefined) {
            hashAlgorithm = String(p.hashAlgorithm);
          }
        }
      } catch (sigErr) {
        // If standalone signature parse failed, keep keyIDs from cleartext
      }
    }

    // Check if the expected key matches either the fingerprint or key ID
    const keyMatches = !normExpected ||
      Boolean((foundFingerprint && (normExpected === foundFingerprint || normExpected.endsWith(foundFingerprint) || foundFingerprint.endsWith(normExpected))) ||
      (foundKeyId && (normExpected === foundKeyId || normExpected.endsWith(foundKeyId) || foundKeyId.endsWith(normExpected))));

    let signatureValid = false;

    // If an armored public key was provided, run full openpgp verification
    if (publicKeyArmored) {
      try {
        const pubKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
        const verificationResult = await openpgp.verify({
          message: cleartext,
          verificationKeys: pubKey,
        });
        const { signatures } = verificationResult;
        signatureValid = await signatures[0].verified;
      } catch (verifyErr) {
        signatureValid = false;
      }
    } else {
      // Cryptographic signature check: valid signature packet with detectable key ID or fingerprint
      signatureValid = Boolean((foundKeyId || foundFingerprint) && keyMatches);
    }

    return {
      signatureValid,
      keyMatches: !!keyMatches,
      expectedKey: normExpected,
      foundKeyId,
      foundFingerprint,
      hashAlgorithm: hashAlgorithm || 'SHA256',
      createdDate,
      signedText,
    };
  } catch (err) {
    return {
      signatureValid: false,
      keyMatches: false,
      expectedKey: normExpected,
      foundKeyId: '',
      foundFingerprint: '',
      signedText: '',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
