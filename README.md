# Nostr Kind 37773: Bitcoin-OTC Identity Linkage Proof

[![GitHub Repository](https://img.shields.io/badge/GitHub-thebutterzone%2Fnostr--kind--37773-181717?logo=github)](https://github.com/thebutterzone/nostr-kind-37773)

An interactive reference client, cryptographic verification suite, and specification portal for **Nostr Kind:37773 — Bitcoin-OTC Identity Linkage Proof ONLY**.

> ⚠️ **CRITICAL PROTOCOL SCOPE: BITCOIN-OTC ONLY**
>
> Nostr Kind `37773` is strictly and exclusively dedicated to **Bitcoin-OTC Identity Linkage Proofs**.
>
> - **Single-Purpose Kind**: Kind 37773 cryptographically links a Nostr identity (`npub`) to a registered **#bitcoin-otc** Web of Trust account (`ext:bitcoin-otc:<nick>`) via the author's registered PGP key fingerprint or legacy Bitcoin P2PKH address (`1...`).
> - **No Overloading / Fork for Other Registries**: Other external platforms, identity registries, or web services (e.g., GitHub, Twitter/X, Keybase, DNS, Keyoxide, or general Web of Trust systems) **MUST NOT** use or overload Kind 37773. External systems must define and register their own separate, dedicated Nostr event kind numbers.

---

## Overview

Traditional web identity relies on centralized issuers or web domain DNS entries. The historic **#bitcoin-otc** Web of Trust—operating since the earliest days of Bitcoin on IRC—allowed peer-to-peer traders to record ratings and register their cryptographic credentials (PGP keys and legacy Bitcoin P2PKH addresses).

Kind 37773 defines a cryptographic identity linkage protocol specifically for the Bitcoin-OTC Web of Trust on Nostr:
1. The author signs a standardized attestation statement with their registered Bitcoin-OTC cryptographic key (PGP private key or Bitcoin private key) asserting control over their Nostr public key (`npub`).
2. The author publishes the attestation to Nostr relays as a parameterized replaceable event (**Kind 37773**).
3. Any Nostr client or indexer can independently verify the cryptographic signature without querying centralized oracles or leaking user network traffic.

```
       ┌─────────────────────────────────────────────────────────┐
       │       Bitcoin-OTC Registered Cryptographic Key          │
       │   (40-Char PGP Fingerprint or Legacy Bitcoin P2PKH)     │
       └────────────────────────────┬────────────────────────────┘
                                    │ Signs canonical statement linking npub
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │               Cryptographic Linkage Proof               │
       │            (OpenPGP Clearsign or Bitcoin Sig)           │
       └────────────────────────────┬────────────────────────────┘
                                    │ Stored in content field
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                        Nostr Kind 37773 Event                         │
│  • d: ext:bitcoin-otc:<nick>                                          │
│  • proof-type: pgp | btc                                              │
│  • uri: https://bitcoin-otc.com/viewratingdetail.php?nick=<nick>      │
│  • key: <40-char PGP fingerprint | Legacy P2PKH address>              │
│  • content: signed statement & signature payload                      │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Tag Schema Specification

Kind `37773` is a parameterized replaceable event (range `30000–39999`) using the following tag structure:

| Tag Name | Value Format | Description |
| :--- | :--- | :--- |
| `["d", ...]` | `ext:bitcoin-otc:<nick>` | **Mandatory.** Unique identifier for event replacement. Must strictly use the `ext:bitcoin-otc:` prefix followed by the Bitcoin-OTC nick. E.g. `ext:bitcoin-otc:thebutterzone` |
| `["proof-type", ...]` | `"pgp"` \| `"btc"` | **Mandatory.** Specifies the verification algorithm to apply to the `content` payload (PGP clearsign or Bitcoin ECDSA). |
| `["uri", ...]` | `https://bitcoin-otc.com/viewratingdetail.php?nick=<nick>` | **Optional.** Canonical reference link to the author's Bitcoin-OTC profile. Must strictly point to `bitcoin-otc.com` with `?nick=` matching the `d` tag identifier to prevent phishing. Arbitrary or third-party links are strictly forbidden. |
| `["key", ...]` | 40-char Fingerprint or Legacy P2PKH Address (`1...`) | **Mandatory.** The 40-character uppercase PGP fingerprint or legacy P2PKH Bitcoin address registered with Bitcoin-OTC against which the signature is verified. |

The signed statement and cryptographic signature are contained within the event's `content` field (as an ASCII-armored PGP clearsigned message or standard Bitcoin signed message format).

---

## Canonical Attestation Statement Standard

For **both** Bitcoin and PGP claims, the signed statement follows the exact canonical template published in the Kind:37773 specification:

```text
I, <nick>, assert control of Nostr pubkey <npub>. This is a self-attested statement associating external identity <nick> with this Nostr identity.
```

### Canonical PGP Proof Event (`TheButterZone`)

```json
{
  "id": "6357ba2d52aa177c7dedda29957539e5c6f494d99d2ccc0acb98f526486ef680",
  "pubkey": "2e17b86d692c979bb5b7c2ddb9f70e02e76bbc358afa95ac68135047bbe10e02",
  "created_at": 1791970732,
  "kind": 37773,
  "tags": [
    ["d", "ext:bitcoin-otc:thebutterzone"],
    ["proof-type", "pgp"],
    ["uri", "https://bitcoin-otc.com/viewratingdetail.php?nick=thebutterzone"],
    ["key", "C0A62F7AD5C16FB75A14A20D750A6640C5E4961B"]
  ],
  "content": "-----BEGIN PGP SIGNED MESSAGE-----\nHash: SHA256\n\nI, TheButterZone, assert control of Nostr pubkey npub19ctmsmtf9jtehddhctwmnacwqtnkh0p43tafttrgzdgy0wlppcpq50zf83. This is a self-attested statement associating external identity TheButterZone with this Nostr identity.\n-----BEGIN PGP SIGNATURE-----\n\niQIzBAEBCAAdFiEEwKYvetXBb7daFKINdQpmQMXklhsFAmrPSygACgkQdQpmQMXk\nlhtfmxAAzVz7cTeHQw/0a+qk8nByvmW6SEAfL2ss9XNDj6YUYnpUYXxgGbTrHLTo\nmyavVG9ZnIglVs9D8y3gZpnPT7QZcYDcgaJRDt4GDv/BukgBI79NATaiJpOSIsZ4\nhwxeegWg40HocYWbq21KnmBfoCHtuOQztGzwV+epXk7vjm9El7QIkNlews3KTOKH\n1arol28h6jAbTP2qO94EV3iKpARPXdGm78HGV4emgE6Eq56wUr6ECfsD9ZKJS4Of\nDLiifOBL1hc5KbKu9zmoVAPUKjXt52z8tYl01k4KGTr0VsQ00I3eJqrWvi1QjcKI\nQDO/znSERjqKQiktOpD/gvT+BpelTpWoTPxnqe5fd3gE6S6oaW7Xorzs3ukfQgbF\nIPYbLINUo8bUnYc9G9p7Khi0M7jFik+bMXQ52C1+vyDoBxt2K1/cCy7bnN1luMFV\nwR992BPB0CYEZHXcrdRXzupbUX2FtcpFzd1azQqdzxzfMbjU2dq0EitF1tcCdy0V\nSPxA/srhDzvr9Tx9Wp0fyE8ZPRnUdmS44OnskzEj/xD+3LEUWNoZMfyEeIdgx4rX\nR3E6dJEslT0Pz70zHUNTcZgdBba/SD9keMPB08AB30gsRNLj8Mnbl5HijAOSX3xC\nBow5oqhkf8KVjvsXda63aSfUmj907smcJvbJUnf1+vBF0kTnrFs=\n=czUK\n-----END PGP SIGNATURE-----",
  "sig": "58b257f8207d056fe401431d4f2afc617acf26d5ef595c729480207f20b6b5a6777707e04d4337ccae46a84bbc7eaf3f3f0e7ce2e19f9109aff090f68ca2007d"
}
```

### Sample Bitcoin Proof Event

```json
{
  "id": "a310bb21de265882678fdfc2079f82631cf5434d7d13264c8d927a7c73db8e3f",
  "pubkey": "fa984bd7dbb282f07e16e7ae87b2ec47087790ff4f4c2c78f8981e428e204d4f",
  "created_at": 1729000000,
  "kind": 37773,
  "tags": [
    ["d", "ext:bitcoin-otc:satoshi_reserve"],
    ["proof-type", "btc"],
    ["uri", "https://bitcoin-otc.com/viewratingdetail.php?nick=satoshi_reserve"],
    ["key", "16193nPH2mS3Q5U2Ui9HMLPxmxR9r4wxu3"]
  ],
  "content": "-----BEGIN BITCOIN SIGNED MESSAGE-----\nAddress: 16193nPH2mS3Q5U2Ui9HMLPxmxR9r4wxu3\nMessage: I, satoshi_reserve, assert control of Nostr pubkey npub1u724pwn2r92x76g63u77g290h835s64c8fcvm25f6966q59quxzquk9dff. This is a self-attested statement associating external identity satoshi_reserve with this Nostr identity.\n-----BEGIN BITCOIN SIGNATURE-----\nIB8Z24wO6mO/G8vXW3aK9jL7b2K1JgR5X6yN9P4Q7W1Z2X3C4V5B6N7M8L9K0J1H2G3F4D5S6A7Q8W9E0R1T2Y3U=\n-----END BITCOIN SIGNATURE-----"
}
```

---

## Key Management & Signing Model

### 1. Nostr Key Management
Publishing a Kind 37773 event to Nostr relays requires signing the Nostr event with the author's Nostr private key. The application supports two signing workflows:
- **In-Memory `nsec` Signing**: Users can enter their `nsec` or 32-byte hex secret key directly into the application. Keys are held ephemerally in browser runtime memory for event finalization (`finalizeEvent`) and are never sent to any external server or saved to persistent storage. Ephemeral keypair generation is also supported for test publishing.
- **NIP-07 Browser Extension**: If a NIP-07 compatible extension (such as Alby, nos2x, or Amber) is detected in `window.nostr`, the app can request public keys (`getPublicKey`) and request event signing (`signEvent`) without the web application touching the private key.

### 2. External Keys (Bitcoin & PGP)
- **External Private Keys are Never Handled**: The web application never asks for, accepts, or processes Bitcoin private keys (WIF/seed phrases) or PGP private keys.
- **Offline External Signing**: Users generate the canonical statement in the Proof Builder, sign it externally in their own trusted tools (e.g., GnuPG, Kleopatra, Electrum, Bitcoin Core `signmessage`, or hardware wallet), and paste the resulting signature into the app.

---

## Client Verification Rules

When a Nostr client encounters a Kind:37773 event:

1. **Nostr Integrity**:
   - Check that `id === sha256(serialize(event))` and verify the Schnorr signature against the author's Nostr `pubkey`.
2. **Cryptographic Proof**:
   - **PGP**: Parse the ASCII-armored clearsigned message in `content`, verify the signature packet using OpenPGP, ensure the signing key matches the `key` tag (fingerprint), and verify that the message contains the author's `npub`.
   - **Bitcoin**: Extract the compact 65-byte base64 signature from `content`, recover the `secp256k1` public key point, compute the legacy P2PKH address (`1...`), ensure it matches the `key` tag, and verify that the statement contains the author's `npub`.
3. **Anti-Phishing & URI Integrity Mandate**:
   - Because Kind:37773 is dedicated to Bitcoin-OTC, any `uri` tag included in the event **MUST** point strictly to `https://bitcoin-otc.com/viewratingdetail.php?nick=<nick>` (or `https://www.bitcoin-otc.com/...`).
   - The `nick` query parameter in the URI **MUST** strictly match the external identity identifier extracted from the `d` tag (`ext:bitcoin-otc:<nick>`).
   - Clients **MUST** treat any external domain, non-canonical path, or mismatched `nick` in the `uri` tag as an untrusted or spoofed link, and display an explicit security warning.
4. **UX Display Mandates**:
   - Clients **MAY** indicate that the cryptographic signature was successfully verified.
   - Clients **SHOULD** distinguish between successful cryptographic verification and validation of an external identity.
   - Clients **MUST NOT** present the external identity as verified by an external registry unless another protocol layer (such as an oracle or NIP-32 attestation) provides that guarantee.
   - Clients **MUST NOT** make unauthenticated HTTP calls to third-party APIs during feed rendering to avoid leaking user IP addresses.

---

## External Registry & Oracle Verification

Kind 37773 cryptographically links a Nostr public key to an external key or address, but does not inherently attest that the external registry currently associates that key with the claimed identifier.

- Clients **MUST NOT** query external HTTP endpoints during feed or profile rendering, preventing user IP address leakage and unauthenticated network dependencies.
- External registry validation **SHOULD** be performed out-of-band by independent indexers or attestation layers (e.g., NIP-32) publishing on-relay events.
- For oracles, indexers, and archival verification, Bitcoin-OTC publishes machine-readable registration records (Key ID, PGP fingerprint, Bitcoin address, and registration timestamp) at:
  ```text
  https://bitcoin-otc.com/viewgpg.php?nick=<nick>&outformat=json
  ```

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- `npm`

### Installation

```bash
git clone https://github.com/thebutterzone/nostr-kind-37773.git
cd nostr-kind-37773
npm install
```

### Running Locally

```bash
npm run dev
```

The application will start on `http://localhost:3000`.

### Building for Production

```bash
npm run build
```

Static build output is written to `dist/`, ready for hosting as an **nsite**, IPFS deployment, or static web host.

---

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 8
- **Styling**: Tailwind CSS 4
- **Nostr Engine**: `nostr-tools`
- **Cryptography**: `openpgp`, `@scure/base`
- **Icons**: Lucide React
- **Animations**: Motion

---

## License

MIT License. See [LICENSE](LICENSE) for details.
