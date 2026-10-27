# nostr-kind-37773

An interactive reference client, verification suite, and nsite portal for **Nostr Kind:37773 External Identity Claims**.

This application allows Nostr users to cryptographically link and verify external identities—specifically legacy **Bitcoin P2PKH addresses** (such as OTC reputation profiles) and **PGP keys**—producing self-attested, tamper-evident Nostr events that any client can verify independently.

---

## Overview

Traditional web identity relies on centralized issuers. Kind:37773 provides a decentralized identity attestation protocol on Nostr where a user signs a cryptographic statement with their external key (Bitcoin private key or PGP private key) that attests to ownership of their Nostr public key (`npub`).

The resulting attestation is published to Nostr relays as a parameterized replaceable event (**Kind 37773**), establishing a verifiable bridge across identity systems without third-party oracles.

```
       ┌────────────────────────┐
       │   External Key Pair    │
       │  (Bitcoin P2PKH / PGP) │
       └───────────┬────────────┘
                   │ Signs statement linking npub
                   ▼
       ┌────────────────────────┐
       │  Cryptographic Proof   │
       │ (ECDSA or PGP Sig)     │
       └───────────┬────────────┘
                   │ Packaged into event
                   ▼
┌──────────────────────────────────────────────┐
│            Nostr Kind 37773 Event            │
│  • k: identity type (bitcoin | pgp)          │
│  • d: identifier (address or fingerprint)    │
│  • i: external identifier                    │
│  • statement: exact text signed              │
│  • content: signature payload                │
└──────────────────────────────────────────────┘
```

---

## Kind 37773 Specification

Kind `37773` is a parameterized replaceable event defined as follows:

### Event Schema

| Field | Description | Example |
| :--- | :--- | :--- |
| `kind` | `37773` | `37773` |
| `tags[k]` | Key type | `["k", "bitcoin"]` or `["k", "pgp"]` |
| `tags[d]` | Identifier tag | `["d", "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"]` |
| `tags[i]` | External identifier | `["i", "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"]` |
| `tags[statement]` | Exact statement signed | `["statement", "I control 1A1z... and my Nostr pubkey is npub1..."]` |
| `content` | Cryptographic signature | Base64-encoded Bitcoin signature or ASCII-armored PGP signature |

### Bitcoin Attestation Rules
- **Address Format**: Addresses must be legacy **P2PKH** format starting with `1` (Base58Check encoded, 26–35 characters). Native SegWit (`bc1...`) and legacy multisig (`3...`) addresses are rejected.
- **Statement Standard**:
  ```text
  I am claiming that my Nostr public key is npub1... and I control the Bitcoin address 1...
  ```
- **Signature**: Standard Bitcoin message signature (compatible with Electrum, Bitcoin Core `signmessage`, and Trezor/Ledger).

### PGP Attestation Rules
- **Fingerprint Format**: Exactly 40 hexadecimal characters (case-insensitive, whitespace-insensitive).
- **Statement Standard**:
  ```text
  I am claiming that my Nostr public key is npub1... and I control the PGP key with fingerprint <40-HEX-FINGERPRINT>
  ```
- **Signature**: Detached or cleartext ASCII-armored OpenPGP signature verifiable with the corresponding public key.

---

## Features

1. **Interactive Proof Builder**:
   - Real-time address format gating (locks and validates P2PKH addresses before populating statements).
   - Instant PGP 40-character fingerprint canonicalization.
   - One-click copy for message signing in external wallets and CLI tools.
   - Direct broadcast to Nostr relays (supports NIP-07 browser extensions).

2. **Dual In-Browser Verifier**:
   - **Bitcoin**: Verifies message signatures against the stated P2PKH address and Nostr public key.
   - **OpenPGP**: In-browser signature verification using OpenPGP.js against provided public keys or keyserver lookups.

3. **Web of Trust Visualizer**:
   - Graph view mapping links between Nostr pubkeys, Bitcoin OTC reputations, and PGP fingerprints.
   - Cross-referencing attestations and trust paths.

4. **Client Badge Guidelines**:
   - Reference UI patterns and badge specifications for Nostr client authors to display external trust indicators on user profiles.

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- `npm`

### Installation

```bash
git clone https://github.com/<your-username>/nostr-kind-37773.git
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

The built static assets will be output to the `dist/` directory, ready to be hosted as an **nsite**, IPFS directory, or any static hosting provider.

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

## Security Model

- **Client-Side Execution**: All signature parsing, hashing, and verification happens 100% in the user's browser.
- **Zero Private Key Transmission**: The application never handles, asks for, or stores private keys. Signing is delegated to external tools (Bitcoin wallets, GnuPG, or NIP-07 browser extensions).
- **Zero Telemetry**: No tracking, cookies, or remote logging.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
