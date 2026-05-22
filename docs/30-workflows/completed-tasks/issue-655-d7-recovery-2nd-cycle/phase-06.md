# Phase 6 — テスト実装

## 目的

Phase 4 で定義した 5 ケースを `*.spec.ts` として実装する。

## 実装

### 6-1. `post-switch-monitor.recovery.spec.ts`

対象: `scripts/cf-audit-log/observation/post-switch-monitor.recovery.spec.ts` (新規)

```ts
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const ENTRY = "scripts/cf-audit-log/observation/post-switch-monitor.ts";

function run(args: string[]) {
  return execFileSync("pnpm", ["tsx", ENTRY, ...args], { encoding: "utf8" });
}

describe("post-switch-monitor --recovery-mode", () => {
  it("TC-RECOVERY-01: writes recovery-mode summary with 168 snapshots", () => {
    const dir = mkdtempSync(join(tmpdir(), "recovery-"));
    // seed 168 fixture snapshots into dir...
    const out = join(dir, "out.json");
    run(["--aggregate", "--window", "168", "--recovery-mode",
         "--since", "2026-05-15T01:00:00Z", "--input", dir, "--out", out,
         "--expected-snapshots", "168", "--require-non-skeleton"]);
    const json = JSON.parse(readFileSync(out, "utf8"));
    expect(json.mode).toBe("recovery");
    expect(json.actualSnapshots).toBe(168);
  });

  it("TC-RECOVERY-02: exits 2 when --since is missing", () => {
    expect(() => run(["--aggregate", "--recovery-mode", "--input", ".", "--out", "x.json"]))
      .toThrowError(/since is required/);
  });

  it("TC-RECOVERY-03: exits non-zero on skeleton-only fixture", () => {
    // ...
  });

  it("TC-REGRESSION-01: normal mode output stays schema-compatible with #586", () => {
    // ...
  });
});
```

### 6-2. `recovery-rootcause-helper.spec.ts`

対象: `scripts/cf-audit-log/observation/recovery-rootcause-helper.spec.ts` (新規)

`gh api` を `nock` または `MSW` で stub し、欠損 hour 3 件 + production-code 起因の fixture から `recovery-rootcause.md` stub が出力されることを assert。

### 6-3. workflow YAML 静的検証

`mise exec -- pnpm exec actionlint .github/workflows/cf-audit-log-7day-summary.yml` を Phase 7 で実行する。spec ファイル化はしない（既存 actionlint CI gate で carriage）。

## 完了条件

- [ ] 2 spec ファイルが新規追加され、Phase 4 の全 TC が記述されている
- [ ] focused test を local で実行可能なコマンドが phase-07 に記載されている
