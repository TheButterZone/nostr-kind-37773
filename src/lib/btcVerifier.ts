import { sha256 } from '@noble/hashes/sha2.js';
import { ripemd160 } from '@noble/hashes/legacy.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { base58check, bech32 } from '@scure/base';

export interface BtcVerificationOutput {
  signatureValid: boolean;
  keyMatches: boolean;
  expectedAddress: string;
  recoveredAddress: string;
  recoveredPubKeyHex: string;
  signedMessage: string;
  rawSignature: string;
  error?: string;
}

function encodeVarInt(length: number): Uint8Array {
  if (length < 253) {
    return new Uint8Array([length]);
  } else if (length <= 0xffff) {
    const buf = new Uint8Array(3);
    buf[0] = 253;
    buf[1] = length & 0xff;
    buf[2] = (length >> 8) & 0xff;
    return buf;
  } else {
    const buf = new Uint8Array(5);
    buf[0] = 254;
    buf[1] = length & 0xff;
    buf[2] = (length >> 8) & 0xff;
    buf[3] = (length >> 16) & 0xff;
    buf[4] = (length >> 24) & 0xff;
    return buf;
  }
}

export function formatBitcoinMagicMessage(message: string): Uint8Array {
  // Normalize line endings to \n as per Bitcoin Core and Electrum specification
  const normalizedMsg = message.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const magic = new TextEncoder().encode('Bitcoin Signed Message:\n');
  const magicLen = encodeVarInt(magic.length); // Exactly 24 bytes (0x18)
  const msgBytes = new TextEncoder().encode(normalizedMsg);
  const msgLen = encodeVarInt(msgBytes.length);

  const total = new Uint8Array(magicLen.length + magic.length + msgLen.length + msgBytes.length);
  let offset = 0;

  total.set(magicLen, offset);
  offset += magicLen.length;
  total.set(magic, offset);
  offset += magic.length;
  total.set(msgLen, offset);
  offset += msgLen.length;
  total.set(msgBytes, offset);

  return total;
}

export function hashBitcoinMessage(message: string): Uint8Array {
  const magicBytes = formatBitcoinMagicMessage(message);
  return sha256(sha256(magicBytes));
}

function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64.trim());
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function pubKeyToBitcoinAddresses(pubKeyBytes: Uint8Array): {
  p2pkh: string;
  p2sh_p2wpkh: string;
  p2wpkh: string;
} {
  const b58c = base58check(sha256);

  // 1. P2PKH (Legacy - starts with '1')
  const pubHash = ripemd160(sha256(pubKeyBytes));
  const p2pkhPayload = new Uint8Array(1 + pubHash.length);
  p2pkhPayload[0] = 0x00; // mainnet P2PKH version byte
  p2pkhPayload.set(pubHash, 1);
  const p2pkh = b58c.encode(p2pkhPayload);

  // 2. Native SegWit P2WPKH (bech32 - starts with 'bc1q')
  const words = bech32.toWords(pubHash);
  const p2wpkh = bech32.encode('bc', [0, ...words]);

  // 3. Nested SegWit P2SH-P2WPKH (starts with '3')
  const redeemScript = new Uint8Array(2 + pubHash.length);
  redeemScript[0] = 0x00;
  redeemScript[1] = 0x14;
  redeemScript.set(pubHash, 2);
  const scriptHash = ripemd160(sha256(redeemScript));
  const p2shPayload = new Uint8Array(1 + scriptHash.length);
  p2shPayload[0] = 0x05; // mainnet P2SH version byte
  p2shPayload.set(scriptHash, 1);
  const p2sh_p2wpkh = b58c.encode(p2shPayload);

  return { p2pkh, p2sh_p2wpkh, p2wpkh };
}

export function parseBitcoinArmoredContent(content: string): {
  message: string;
  signature: string;
  address?: string;
} {
  let message = '';
  let signature = '';
  let address = '';

  const hasArmor =
    content.includes('BEGIN BITCOIN SIGNED MESSAGE') ||
    content.includes('BEGIN SIGNED MESSAGE') ||
    content.includes('BEGIN SIGNATURE') ||
    content.includes('BEGIN BITCOIN SIGNATURE');

  if (hasArmor) {
    const lines = content.split('\n');
    let inMessage = false;
    let inSignature = false;
    const msgLines: string[] = [];
    const sigLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Start of message
      if (line.includes('BEGIN BITCOIN SIGNED MESSAGE') || line.includes('BEGIN SIGNED MESSAGE')) {
        inMessage = true;
        inSignature = false;
        continue;
      }

      // Start of signature section (Electrum, Bitcoin Core, Sparrow)
      if (
        line.includes('BEGIN SIGNATURE') ||
        line.includes('BEGIN BITCOIN SIGNATURE') ||
        line.includes('BEGIN SIGNATURE BLOCK')
      ) {
        inMessage = false;
        inSignature = true;
        continue;
      }

      // End of section
      if (
        line.includes('END BITCOIN SIGNED MESSAGE') ||
        line.includes('END BITCOIN SIGNATURE') ||
        line.includes('END SIGNATURE')
      ) {
        inSignature = false;
        continue;
      }

      if (inMessage) {
        if (line.startsWith('Address:')) {
          address = line.replace('Address:', '').trim();
        } else if (line.startsWith('Message:')) {
          msgLines.push(line.replace('Message:', '').trim());
        } else {
          msgLines.push(lines[i]);
        }
      } else if (inSignature) {
        // Discard header labels or extract address
        if (line.startsWith('Address:')) {
          address = line.replace('Address:', '').trim();
        } else if (line.startsWith('Signature:')) {
          sigLines.push(line.replace('Signature:', '').trim());
        } else if (/^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{38,59})$/.test(line)) {
          // It's the Bitcoin address on line 1 of Electrum's signature block
          address = line;
        } else if (line.length >= 80 && /^[A-Za-z0-9+/=]+$/.test(line)) {
          // It's the 65-byte base64 signature
          sigLines.push(line);
        } else if (line) {
          sigLines.push(line);
        }
      }
    }

    message = msgLines.join('\n').trim();
    signature = sigLines.join('').trim();
  } else {
    // Check if content itself is a raw 88-char base64 signature
    const trimmed = content.trim();
    if (trimmed.length >= 86 && trimmed.length <= 92 && /^[A-Za-z0-9+/=]+$/.test(trimmed)) {
      signature = trimmed;
    } else {
      message = trimmed;
    }
  }

  return { message, signature, address };
}

export function verifyBitcoinProof(
  content: string,
  expectedAddress: string,
  explicitSignature?: string
): BtcVerificationOutput {
  const normExpected = expectedAddress.trim();

  try {
    const parsed = parseBitcoinArmoredContent(content);
    const message = parsed.message;
    const signatureBase64 = (explicitSignature || parsed.signature).trim();

    if (!message) {
      return {
        signatureValid: false,
        keyMatches: false,
        expectedAddress: normExpected,
        recoveredAddress: '',
        recoveredPubKeyHex: '',
        signedMessage: '',
        rawSignature: '',
        error: 'No message content found to verify.',
      };
    }

    if (!signatureBase64) {
      return {
        signatureValid: false,
        keyMatches: false,
        expectedAddress: normExpected,
        recoveredAddress: '',
        recoveredPubKeyHex: '',
        signedMessage: message,
        rawSignature: '',
        error: 'No Bitcoin signature found (expected base64 compact signature).',
      };
    }

    const sigBytes = base64ToBytes(signatureBase64);
    if (sigBytes.length !== 65) {
      return {
        signatureValid: false,
        keyMatches: false,
        expectedAddress: normExpected,
        recoveredAddress: '',
        recoveredPubKeyHex: '',
        signedMessage: message,
        rawSignature: signatureBase64,
        error: `Invalid signature length: got ${sigBytes.length} bytes, expected 65 bytes.`,
      };
    }

    const header = sigBytes[0];
    if (header < 27 || header > 42) {
      return {
        signatureValid: false,
        keyMatches: false,
        expectedAddress: normExpected,
        recoveredAddress: '',
        recoveredPubKeyHex: '',
        signedMessage: message,
        rawSignature: signatureBase64,
        error: `Header byte ${header} out of valid recovery range (27-42).`,
      };
    }

    const recid = (header - 27) & 3;
    const compressed = ((header - 27) & 4) !== 0;

    const msgHash = hashBitcoinMessage(message);
    const rHex = bytesToHex(sigBytes.slice(1, 33));
    const sHex = bytesToHex(sigBytes.slice(33, 65));
    const r = BigInt('0x' + rHex);
    const s = BigInt('0x' + sHex);

    // secp256k1 recovery using noble-curves Signature
    const sig = new secp256k1.Signature(r, s, recid);
    const recoveredPoint = sig.recoverPublicKey(msgHash);
    const pubKeyBytes = recoveredPoint.toBytes(compressed);
    const pubKeyHex = bytesToHex(pubKeyBytes);

    const addresses = pubKeyToBitcoinAddresses(pubKeyBytes);

    const targetExpected = normExpected || parsed.address || '';
    const matchesP2PKH = targetExpected ? addresses.p2pkh.toLowerCase() === targetExpected.toLowerCase() : false;
    const matchesP2SH = targetExpected ? addresses.p2sh_p2wpkh.toLowerCase() === targetExpected.toLowerCase() : false;
    const matchesP2WPKH = targetExpected ? addresses.p2wpkh.toLowerCase() === targetExpected.toLowerCase() : false;

    const keyMatches = !targetExpected || matchesP2PKH || matchesP2SH || matchesP2WPKH;
    let recoveredAddress = addresses.p2pkh;
    if (matchesP2WPKH) recoveredAddress = addresses.p2wpkh;
    else if (matchesP2SH) recoveredAddress = addresses.p2sh_p2wpkh;

    return {
      signatureValid: true,
      keyMatches,
      expectedAddress: targetExpected,
      recoveredAddress,
      recoveredPubKeyHex: pubKeyHex,
      signedMessage: message,
      rawSignature: signatureBase64,
    };
  } catch (err) {
    return {
      signatureValid: false,
      keyMatches: false,
      expectedAddress: normExpected,
      recoveredAddress: '',
      recoveredPubKeyHex: '',
      signedMessage: content,
      rawSignature: explicitSignature || '',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
