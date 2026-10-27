export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export type ProofType = 'pgp' | 'btc' | 'other';

export interface ParsedClaimTags {
  dTag: string; // e.g. ext:bitcoin-otc:thebutterzone
  platform: string;
  identifier: string;
  proofType: ProofType;
  uri: string;
  key: string; // PGP fingerprint or Bitcoin address
  extraTags: string[][];
}

export interface VerificationDetails {
  nostrEventValid: boolean;
  nostrIdMatches: boolean;
  nostrSigMatches: boolean;
  nostrError?: string;

  proofType: ProofType;
  cryptoSignatureValid: boolean;
  cryptoKeyMatches: boolean;
  keyFoundOrRecovered: string;
  keyExpected: string;
  assertionContainsPubkey: boolean;
  assertionContainsNpub: boolean;
  assertionTextSummary: string;
  cryptoError?: string;
  cryptoAlgorithm?: string;
  signedTimestamp?: string;

  registryValidGuaranteed: boolean;
  distinctionRulePassed: boolean;
  advisoryNotice: string;

  uriVerification?: {
    status: 'canonical' | 'domain_mismatch' | 'nick_mismatch' | 'invalid_url' | 'none';
    message: string;
    canonicalUrl?: string;
  };
}

export interface RelayStatus {
  url: string;
  isDefault: boolean;
  enabled: boolean;
  connected: boolean;
  connecting: boolean;
  lastError?: string;
  latencyMs?: number;
}

export interface RelayPublishResult {
  relay: string;
  success: boolean;
  accepted: boolean;
  reason?: string;
  timestamp: number;
}
