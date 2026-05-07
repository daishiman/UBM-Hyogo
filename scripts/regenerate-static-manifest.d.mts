export interface RegenerateResult {
  ok: true;
  manifestPath: string;
  sourceSpecHash: string;
}

export function regenerateStaticManifest(opts?: {
  sourceSpecPath?: string;
  outputPath?: string;
  gitMeta?: { sourceSpecVersion: string; generatedAt: string } | null;
}): Promise<RegenerateResult>;

export function canonicalizeMarkdown(text: string): string;
export function sha256Hex(buf: string | Buffer): string;
export function parseSourceSpec(markdown: string): Record<
  string,
  { fields: Array<{ stableKey: string; label: string; kind: string }> }
>;
export function buildManifestObject(args: {
  parsed: ReturnType<typeof parseSourceSpec>;
  sourceSpecHash: string;
  sourceSpecVersion: string;
  generatedAt: string;
}): Record<string, unknown>;
