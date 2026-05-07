export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "sourceSpecHashDrift"; expected: string; actual: string }
  | { ok: false; reason: "missingSourceSpec"; path: string }
  | { ok: false; reason: "invalidSchema"; details: unknown };

export function verifyStaticManifest(opts?: {
  sourceSpecPath?: string;
  manifestPath?: string;
}): Promise<VerifyResult>;
