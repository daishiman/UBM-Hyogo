import { describe, expect, it } from "vitest";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve as resolvePath, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GeneratedManifestResolver,
  defaultMetadataResolver,
  UNKNOWN_SECTION_KEY,
  type AliasQueueAdapter,
} from "./metadata";
import { verifyStaticManifest } from "../../../../../scripts/verify-static-manifest.mjs";

describe("GeneratedManifestResolver", () => {
  it("resolves consent stable_keys to consent kind (AC-4)", () => {
    const r = defaultMetadataResolver;
    const pubResult = r.resolveFieldKind("publicConsent");
    const rulesResult = r.resolveFieldKind("rulesConsent");
    expect(pubResult.ok && pubResult.value).toBe("consent");
    expect(rulesResult.ok && rulesResult.value).toBe("consent");
  });

  it("does not misclassify text/select stable_keys as consent (AC-4 boundary)", () => {
    const r = defaultMetadataResolver;
    const fullName = r.resolveFieldKind("fullName");
    const ubmZone = r.resolveFieldKind("ubmZone");
    expect(fullName.ok && fullName.value).toBe("shortText");
    expect(ubmZone.ok && ubmZone.value).toBe("radio");
  });

  it("resolves canonical labels and never returns the stable_key itself (AC-5)", () => {
    const r = defaultMetadataResolver;
    const result = r.resolveLabel("fullName");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).not.toBe("fullName");
      expect(result.value.length).toBeGreaterThan(0);
    }
  });

  it("returns Result.err with unknownStableKey for drift (AC-6)", () => {
    const r = defaultMetadataResolver;
    const result = r.resolveSectionKey("q_section1_company_name");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("unknownStableKey");
      if (result.error.kind === "unknownStableKey") {
        expect(result.error.stableKey).toBe("q_section1_company_name");
      }
    }
  });

  it("treats responseEmail as system field (invariant #3)", () => {
    const r = defaultMetadataResolver;
    const kind = r.resolveFieldKind("responseEmail");
    const section = r.resolveSectionKey("responseEmail");
    expect(kind.ok && kind.value).toBe("system");
    expect(section.ok && section.value).toBe("__system__");
  });

  it("supports alias adapter hook (AC-7)", () => {
    const adapter: AliasQueueAdapter = {
      async dryRunAlias(): Promise<{ ok: false; reason: string }> {
        return { ok: false, reason: "not-implemented" };
      },
    };
    const r = new GeneratedManifestResolver({ aliasAdapter: adapter });
    expect(r.getAliasAdapter()).toBe(adapter);
  });

  it("works without alias adapter (AC-7 fallback)", () => {
    const r = new GeneratedManifestResolver();
    expect(r.getAliasAdapter()).toBeUndefined();
    const result = r.resolveFieldKind("fullName");
    expect(result.ok).toBe(true);
  });

  it("listSections includes consent and __system__ ordering anchors", () => {
    const sections = defaultMetadataResolver.listSections();
    const keys = sections.map((s) => s.key);
    expect(keys).toContain("consent");
    expect(keys).toContain("__system__");
  });

  it("UNKNOWN_SECTION_KEY constant is stable", () => {
    expect(UNKNOWN_SECTION_KEY).toBe("__unknown__");
  });
});

describe("static manifest hardening (DT-15 / DT-16)", () => {
  const REPO_ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "../../../../..");
  const REAL_SOURCE = resolvePath(REPO_ROOT, "docs/00-getting-started-manual/specs/01-api-schema.md");
  const REAL_MANIFEST = resolvePath(REPO_ROOT, "apps/api/src/repository/_shared/generated/static-manifest.json");

  it("DT-15: manifest hash drift simulation で sourceSpecHashDrift を返す", async () => {
    const tmp = await mkdtemp(join(tmpdir(), "ubm-meta-"));
    try {
      const drifted = join(tmp, "spec.md");
      const original = await readFile(REAL_SOURCE, "utf8");
      await writeFile(drifted, original + "\n# drift\n", "utf8");
      const result = await verifyStaticManifest({
        sourceSpecPath: drifted,
        manifestPath: REAL_MANIFEST,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("sourceSpecHashDrift");
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it("DT-16: metadata.ts に retirement 条件への参照コメントが存在する", async () => {
    const metaSrc = await readFile(
      resolvePath(REPO_ROOT, "apps/api/src/repository/_shared/metadata.ts"),
      "utf8",
    );
    expect(metaSrc).toMatch(/Static Manifest Retirement Condition/);
    expect(metaSrc).toMatch(/verify-static-manifest/);
  });
});
