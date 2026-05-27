# Phase 9: テスト計画

## 9.1 テストフレームワーク

| 項目 | 値 |
| --- | --- |
| Runner | vitest |
| Config | repo root の vitest config を継承（scripts/__tests__ は既に対象範囲） |
| Fixture 配置 | `scripts/__tests__/fixtures/coverage-threshold-lint/` |
| 拡張子 | `.spec.ts`（CLAUDE.md 不変条件 #8） |

## 9.2 Fixture 一覧（4 ケース最小）

| Fixture | 内容 | 期待 |
| --- | --- | --- |
| F-1 | quality-requirements-match.md（3 行 / 12 セル全て 80） + coverage-guard-80.sh（`THRESHOLD=80`） + codecov 不在 | `ok=true`, sources.length=2, mismatches=[] |
| F-2 | quality-requirements-match.md + coverage-guard-70.sh（`THRESHOLD=70`） + codecov 不在 | `ok=false`, mismatches に `aiworkflow-requirements (80) != coverage-guard.sh (70)` |
| F-3 | quality-requirements-match.md + coverage-guard-80.sh + codecov-80.yml（target: 80% / threshold: 1%） | `ok=true`, sources.length=3（Codecov tolerance は無視） |
| F-4 | quality-requirements-broken.md（coverage 表行 anchor 無し） + coverage-guard-80.sh | `errorKind=parse` |

追加で sanity:

| Fixture | 内容 | 期待 |
| --- | --- | --- |
| F-5 | F-3 + codecov-70.yml（target: 70%） | `ok=false`, mismatches に codecov.yml drift |
| F-6 | codecov-broken.yml（target: 行 0 件） | `errorKind=parse`（exit 2 相当） |
| F-7 | `THRESHOLD=80 # comment` | executor threshold を 80 として抽出 |
| F-8 | CLI `--json` | stdout が純 JSON で `jq '.ok'` 可能 |

## 9.3 テストコード擬似コード

```ts
// scripts/__tests__/coverage-threshold-lint.spec.ts
import { describe, expect, it } from "vitest";
import path from "node:path";
import { runLint } from "../coverage-threshold-lint";

const FIX = path.resolve(__dirname, "fixtures/coverage-threshold-lint");

describe("coverage-threshold-lint", () => {
  it("F-1: 2 source 一致 → ok", () => {
    const r = runLint({
      ssotPath: path.join(FIX, "quality-requirements-match.md"),
      executorPath: path.join(FIX, "coverage-guard-80.sh"),
      codecovPath: path.join(FIX, "absent.yml"),
      rootDir: "/",
    });
    expect(r.ok).toBe(true);
  });

  it("F-2: executor drift → ok=false", () => {
    const r = runLint({
      ssotPath: path.join(FIX, "quality-requirements-match.md"),
      executorPath: path.join(FIX, "coverage-guard-70.sh"),
      codecovPath: path.join(FIX, "absent.yml"),
      rootDir: "/",
    });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.errorKind).toBe("drift");
  });

  it("F-3: 3 source 一致", () => {
    const r = runLint({
      ssotPath: path.join(FIX, "quality-requirements-match.md"),
      executorPath: path.join(FIX, "coverage-guard-80.sh"),
      codecovPath: path.join(FIX, "codecov-80.yml"),
      rootDir: "/",
    });
    expect(r.ok).toBe(true);
    expect(r.sources.length).toBe(3);
  });

  it("F-4: SSOT parse failed", () => {
    const r = runLint({
      ssotPath: path.join(FIX, "quality-requirements-broken.md"),
      executorPath: path.join(FIX, "coverage-guard-80.sh"),
      codecovPath: path.join(FIX, "absent.yml"),
      rootDir: "/",
    });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.errorKind).toBe("parse");
  });
});
```

## 9.4 DoD 達成検証コマンド

| ID | コマンド | 期待 |
| --- | --- | --- |
| DoD-1 | `mise exec -- pnpm typecheck` | exit 0 |
| DoD-2 | `mise exec -- pnpm vitest run scripts/__tests__/coverage-threshold-lint.spec.ts` | exit 0、8 tests pass |
| DoD-3 | `mise exec -- pnpm lint:coverage-threshold` | exit 0 + `OK (sources=2, threshold=80)` |
| DoD-4 | （dry-run）coverage-guard.sh を一時的に `THRESHOLD=70` に書き換え → `pnpm lint:coverage-threshold` | exit 1 + stderr に drift テーブル |
| DoD-5 | runbook 確認 | `index.md` Runbook セクションが存在 |

## 9.5 既存 CI gate との相互作用

| gate | 影響 |
| --- | --- |
| `verify-test-suffix` | `.spec.ts` は許容 |
| `verify-indexes-up-to-date` | skill index に新規 entry が追加されるため Phase 12 で `pnpm indexes:rebuild` 実行 |
| `verify-phase12-compliance` | 本ワークフロー root の strict 7 を生成 |
| `gate-metadata:validate` | `artifacts.json` を schema validate |
| `coverage-gate-shard` | 無影響（`apps/` / `packages/` の coverage は変動なし） |

## 9.6 手動 smoke（任意 / 実装サイクル）

| 手順 | 期待 |
| --- | --- |
| `mise exec -- pnpm lint:coverage-threshold` | exit 0 |
| `mise exec -- pnpm lint:coverage-threshold --json \| jq '.sources[].threshold'` | `80` × 2（codecov.yml 不在時） |
| 一時的に `cp codecov.yml.template codecov.yml` （存在しない場合は touch + minimal target） | `--json` 出力で sources.length=3 |
