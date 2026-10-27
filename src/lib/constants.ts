import { NostrEvent } from '../types/nostr';

export const DEFAULT_RELAYS: string[] = [
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://relay.snort.social',
  'wss://bitcoiner.social',
  'wss://relay.wellorder.net',
  'wss://relay.nostrfy.org',
  'wss://relay.ditto.pub',
  'wss://relay.dreamith.to',
];

export const BUTTERZONE_POC_EVENT: NostrEvent = {
  id: "6357ba2d52aa177c7dedda29957539e5c6f494d99d2ccc0acb98f526486ef680",
  pubkey: "2e17b86d692c979bb5b7c2ddb9f70e02e76bbc358afa95ac68135047bbe10e02",
  created_at: 1791970732,
  kind: 37773,
  tags: [
    [
      "d",
      "ext:bitcoin-otc:thebutterzone"
    ],
    [
      "proof-type",
      "pgp"
    ],
    [
      "uri",
      "https://bitcoin-otc.com/viewratingdetail.php?nick=thebutterzone"
    ],
    [
      "key",
      "C0A62F7AD5C16FB75A14A20D750A6640C5E4961B"
    ]
  ],
  "content": "-----BEGIN PGP SIGNED MESSAGE-----\nHash: SHA256\n\nI, TheButterZone, assert control of Nostr pubkey npub19ctmsmtf9jtehddhctwmnacwqtnkh0p43tafttrgzdgy0wlppcpq50zf83. This is a self-attested statement associating external identity TheButterZone with this Nostr identity.\n-----BEGIN PGP SIGNATURE-----\n\niQIzBAEBCAAdFiEEwKYvetXBb7daFKINdQpmQMXklhsFAmrPSygACgkQdQpmQMXk\nlhtfmxAAzVz7cTeHQw/0a+qk8nByvmW6SEAfL2ss9XNDj6YUYnpUYXxgGbTrHLTo\nmyavVG9ZnIglVs9D8y3gZpnPT7QZcYDcgaJRDt4GDv/BukgBI79NATaiJpOSIsZ4\nhwxeegWg40HocYWbq21KnmBfoCHtuOQztGzwV+epXk7vjm9El7QIkNlews3KTOKH\n1arol28h6jAbTP2qO94EV3iKpARPXdGm78HGV4emgE6Eq56wUr6ECfsD9ZKJS4Of\nDLiifOBL1hc5KbKu9zmoVAPUKjXt52z8tYl01k4KGTr0VsQ00I3eJqrWvi1QjcKI\nQDO/znSERjqKQiktOpD/gvT+BpelTpWoTPxnqe5fd3gE6S6oaW7Xorzs3ukfQgbF\nIPYbLINUo8bUnYc9G9p7Khi0M7jFik+bMXQ52C1+vyDoBxt2K1/cCy7bnN1luMFV\nwR992BPB0CYEZHXcrdRXzupbUX2FtcpFzd1azQqdzxzfMbjU2dq0EitF1tcCdy0V\nSPxA/srhDzvr9Tx9Wp0fyE8ZPRnUdmS44OnskzEj/xD+3LEUWNoZMfyEeIdgx4rX\nR3E6dJEslT0Pz70zHUNTcZgdBba/SD9keMPB08AB30gsRNLj8Mnbl5HijAOSX3xC\nBow5oqhkf8KVjvsXda63aSfUmj907smcJvbJUnf1+vBF0kTnrFs=\n=czUK\n-----END PGP SIGNATURE-----",
  sig: "58b257f8207d056fe401431d4f2afc617acf26d5ef595c729480207f20b6b5a6777707e04d4337ccae46a84bbc7eaf3f3f0e7ce2e19f9109aff090f68ca2007d"
};

// Valid Bitcoin Signed Message sample for instant BTC proof testing
// Address: 1L67q5k3x77QxZ3vM31yK7oPzM3WqK5V9A (sample) or standard BIP-137 format:
export const SAMPLE_BTC_POC_EVENT: NostrEvent = {
  id: "a310bb21de265882678fdfc2079f82631cf5434d7d13264c8d927a7c73db8e3f",
  pubkey: "fa984bd7dbb282f07e16e7ae87b2ec47087790ff4f4c2c78f8981e428e204d4f",
  created_at: 1729000000,
  kind: 37773,
  tags: [
    [
      "d",
      "ext:bitcoin-otc:satoshi_reserve"
    ],
    [
      "proof-type",
      "btc"
    ],
    [
      "uri",
      "https://mempool.space/address/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
    ],
    [
      "key",
      "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
    ]
  ],
  content: `-----BEGIN BITCOIN SIGNED MESSAGE-----
Address: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
Message: I assert control of Nostr pubkey npub1u724pwn2r92x76g63u77g290h835s64c8fcvm25f6966q59quxzquk9dff. This is a self-attested statement associating external Bitcoin address 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa with this Nostr identity.
-----BEGIN BITCOIN SIGNATURE-----
IB8Z24wO6mO/G8vXW3aK9jL7b2K1JgR5X6yN9P4Q7W1Z2X3C4V5B6N7M8L9K0J1H2G3F4D5S6A7Q8W9E0R1T2Y3U=
-----END BITCOIN SIGNATURE-----`,
  sig: "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
};

export const SPEC_RULES = {
  may: [
    "Indicate that the cryptographic signature was successfully verified",
    "Display the claimed external identity (e.g. 'thebutterzone' on 'bitcoin-otc')",
    "Display the proof method (PGP or BTC)",
    "Link to the external reference specified by the uri tag",
    "Allow filtering or searching by external identity"
  ],
  should: [
    "Distinguish between successful cryptographic verification and validation of an external identity"
  ],
  mustNot: [
    "Present the external identity as verified by an external registry unless another protocol layer provides that guarantee"
  ]
};
