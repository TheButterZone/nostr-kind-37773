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

export const THEBUTTERZONE_POC_EVENT: NostrEvent = {
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
export const SAMPLE_BTC_POC_EVENT: NostrEvent = {
  id: "e8dd9dce4f091803f2b470d6b8a54267985aea1be6fdee6c32076aefab69477e",
  pubkey: "56b328b30c8bf5839e24058747879408bdb36241dc9c2e7c619faa12b2920967",
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
      "https://bitcoin-otc.com/viewratingdetail.php?nick=satoshi_reserve"
    ],
    [
      "key",
      "1FvyAqqELFiQyaEWdhFbWF8MZapKPZS8J7"
    ]
  ],
  content: "-----BEGIN BITCOIN SIGNED MESSAGE-----\nAddress: 1FvyAqqELFiQyaEWdhFbWF8MZapKPZS8J7\nMessage: I, satoshi_reserve, assert control of Nostr pubkey npub126ej3vcv306c883yqkr50pu5pz7mxcjpmjwzulrpn74p9v5jp9ns5f9e49. This is a self-attested statement associating external identity satoshi_reserve with this Nostr identity.\n-----BEGIN BITCOIN SIGNATURE-----\nH0as+974mZWBUDqkFHwRpoaHPMi/CCKnbcyju8ty4rI4Y5Lfly1DxuWG5eM24FJj+XUPEE71Up8Y+Hs7Jmr1zJI=\n-----END BITCOIN SIGNATURE-----",
  sig: "a4dd2bfebed3ee1e05e3a7d3746a4ee071de4e335e16df53c20834d77beb67cc1ae3813cc9ebb2d3fbb229a473c006e4fc233885fb49acef0acc3498fb56ae32"
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
