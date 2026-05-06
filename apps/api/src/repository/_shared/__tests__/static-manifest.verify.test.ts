import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { mkdtemp, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { verifyStaticManifest } from "../../../../../../scripts/verify-static-manifest.mjs";
import { regenerateStaticManifest } from "../../../../../../scripts/regenerate-static-manifest.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const REAL_SOURCE = resolve(REPO_ROOT, "docs/00-getting-started-manual/specs/01-api-schema.md");
const REAL_MANIFEST = resolve(REPO_ROOT, "apps/api/src/repository/_shared/generated/static-manifest.json");

describe("verifyStaticManifest (DT-01〜DT-04)", () => {
  it("DT-01: 健全 manifest で { ok: true } を返す", async () => {
    const result = await verifyStaticManifest({
      sourceSpecPath: REAL_SOURCE,
      manifestPath: REAL_MANIFEST,
    });
    expect(result).toEqual({ ok: true });
  });

  it("DT-02: source spec drift で sourceSpecHashDrift を返す", async () => {
    const tmp = await mkdtemp(join(tmpdir(), "ubm-verify-"));
    try {
      const driftSource = join(tmp, "spec.md");
      const original = await readFile(REAL_SOURCE, "utf8");
      await writeFile(driftSource, original + "\n\n<!-- drift marker -->\n", "utf8");

      const result = await verifyStaticManifest({
        sourceSpecPath: driftSource,
        manifestPath: REAL_MANIFEST,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("sourceSpecHashDrift");
        if (result.reason === "sourceSpecHashDrift") {
          expect(result.expected).toMatch(/^sha256:/);
          expect(result.actual).toMatch(/^sha256:/);
          expect(result.actual).not.toBe(result.expected);
        }
      }
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it("DT-03: source spec 欠損で missingSourceSpec を返す", async () => {
    const result = await verifyStaticManifest({
      sourceSpecPath: "/nonexistent/path/to/spec.md",
      manifestPath: REAL_MANIFEST,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("missingSourceSpec");
  });

  it("DT-04: invalid manifest schema で invalidSchema を返す", async () => {
    const tmp = await mkdtemp(join(tmpdir(), "ubm-verify-"));
    try {
      const badManifest = join(tmp, "manifest.json");
      await writeFile(badManifest, JSON.stringify({ source: "x" }), "utf8");

      const result = await verifyStaticManifest({
        sourceSpecPath: REAL_SOURCE,
        manifestPath: badManifest,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("invalidSchema");
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });
});

describe("regenerateStaticManifest (DT-05〜DT-07)", () => {
  let tmp: string;
  beforeAll(async () => {
    tmp = await mkdtemp(join(tmpdir(), "ubm-regen-"));
  });
  afterAll(async () => {
    await rm(tmp, { recursive: true, force: true });
  });

  it("DT-05: 同入力で 2 回連続実行が byte-identical", async () => {
    const out1 = join(tmp, "m1.json");
    const out2 = join(tmp, "m2.json");
    await regenerateStaticManifest({ sourceSpecPath: REAL_SOURCE, outputPath: out1 });
    await regenerateStaticManifest({ sourceSpecPath: REAL_SOURCE, outputPath: out2 });
    const a = await readFile(out1);
    const b = await readFile(out2);
    expect(Buffer.compare(a, b)).toBe(0);
  });

  it("DT-06: top-level キー順序が固定", async () => {
    const out = join(tmp, "m.json");
    await regenerateStaticManifest({ sourceSpecPath: REAL_SOURCE, outputPath: out });
    const obj = JSON.parse(await readFile(out, "utf8"));
    expect(Object.keys(obj)).toEqual([
      "$comment",
      "source",
      "sourceSpecVersion",
      "sourceSpecHash",
      "generatedAt",
      "regenerateCommand",
      "retirementCondition",
      "sections",
      "fields",
    ]);
  });

  it("DT-07: sections position 昇順 + fields stableKey 辞書順", async () => {
    const out = join(tmp, "m.json");
    await regenerateStaticManifest({ sourceSpecPath: REAL_SOURCE, outputPath: out });
    const obj = JSON.parse(await readFile(out, "utf8"));
    const positions: number[] = obj.sections.map((s: { position: number }) => s.position);
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]!);
    }
    const fieldKeys = Object.keys(obj.fields);
    const sorted = [...fieldKeys].sort();
    expect(fieldKeys).toEqual(sorted);
  });
});
