#!/usr/bin/env node
// scripts/verify-static-manifest.mjs
// static-manifest.json の sourceSpecHash と source spec markdown の hash を比較し
// drift を検出する。CI gate 用 (pnpm verify:static-manifest)。

import { readFile, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalizeMarkdown, sha256Hex } from "./regenerate-static-manifest.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..");

const DEFAULT_SOURCE = "docs/00-getting-started-manual/specs/01-api-schema.md";
const DEFAULT_MANIFEST =
  "apps/api/src/repository/_shared/generated/static-manifest.json";

export async function verifyStaticManifest(opts = {}) {
  const sourceSpecPath = opts.sourceSpecPath
    ? resolve(opts.sourceSpecPath)
    : resolve(REPO_ROOT, DEFAULT_SOURCE);
  const manifestPath = opts.manifestPath
    ? resolve(opts.manifestPath)
    : resolve(REPO_ROOT, DEFAULT_MANIFEST);

  let manifestRaw;
  try {
    manifestRaw = await readFile(manifestPath, "utf8");
  } catch (e) {
    return {
      ok: false,
      reason: "invalidSchema",
      details: { message: `cannot read manifest: ${e?.message ?? e}`, manifestPath },
    };
  }

  let manifest;
  try {
    manifest = JSON.parse(manifestRaw);
  } catch (e) {
    return {
      ok: false,
      reason: "invalidSchema",
      details: { message: `manifest JSON parse failed: ${e?.message ?? e}` },
    };
  }

  if (
    typeof manifest.sourceSpecHash !== "string" ||
    !manifest.sourceSpecHash.startsWith("sha256:")
  ) {
    return {
      ok: false,
      reason: "invalidSchema",
      details: { message: "manifest.sourceSpecHash missing or not sha256:<hex>" },
    };
  }
  if (typeof manifest.sourceSpecVersion !== "string") {
    return {
      ok: false,
      reason: "invalidSchema",
      details: { message: "manifest.sourceSpecVersion missing" },
    };
  }

  try {
    await access(sourceSpecPath);
  } catch {
    return { ok: false, reason: "missingSourceSpec", path: sourceSpecPath };
  }

  const raw = await readFile(sourceSpecPath, "utf8");
  const canonical = canonicalizeMarkdown(raw);
  const actual = `sha256:${sha256Hex(canonical)}`;
  const expected = manifest.sourceSpecHash;

  if (actual !== expected) {
    return {
      ok: false,
      reason: "sourceSpecHashDrift",
      expected,
      actual,
    };
  }

  return { ok: true };
}

// CLI entry
if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("verify-static-manifest.mjs")
) {
  const result = await verifyStaticManifest();
  if (!result.ok) {
    process.stderr.write(
      `[verify-static-manifest] FAIL reason=${result.reason}\n`,
    );
    process.stderr.write(JSON.stringify(result, null, 2) + "\n");
    process.stderr.write(
      "Run `pnpm regenerate:static-manifest` to refresh.\n",
    );
    process.exit(1);
  }
  process.stdout.write("[verify-static-manifest] OK\n");
}
