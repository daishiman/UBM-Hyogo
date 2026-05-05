# Phase 5: 実装（コード + ドキュメント編集の実行手順）

[実装区分: 実装仕様書]
判定根拠: 今回サイクルでコード変更を含むため本 Phase は code skeleton + docs 編集の手順書として機能する。

## メタ情報

| Phase | 5 / 13 |
| --- | --- |
| 前 Phase | 4（実装計画） |
| 次 Phase | 6（vitest） |
| 状態 | completed |

## CONST_005 必須項目（実装手順）

### 変更対象ファイル一覧と種別

phase-04.md のサブタスク表参照（T1〜T10）。

### 関数 / 型シグネチャ・入出力・副作用・テスト方針

phase-04.md の同名セクション参照。本 Phase では実行手順のみ記述する。

### 実行コマンド（DoD 検証）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --config vitest.config.ts apps/api/src/jobs/_shared
gh api repos/daishiman/UBM-Hyogo/codeowners/errors
grep -l 'sync-shared-modules-owner' apps/api/src/jobs/_shared/*.ts
```

### DoD

AC-1 〜 AC-12 全 PASS。

## 編集手順（後続実行者向け）

### Step 1: `_shared/` ディレクトリ作成（T1）

```bash
mkdir -p apps/api/src/jobs/_shared/__tests__
```

### Step 2: `ledger.ts` 作成（T2）

`apps/api/src/jobs/_shared/ledger.ts` を新規作成。本文は phase-04.md の `ledger.ts` ブロックをそのまま採用。冒頭 JSDoc に owner 表 path（`docs/30-workflows/_design/sync-shared-modules-owner.md`）を必ず含める。

### Step 3: `sync-error.ts` 作成（T3）

`apps/api/src/jobs/_shared/sync-error.ts` を新規作成。本文は phase-04.md の `sync-error.ts` ブロックをそのまま採用。`classifySyncError` の正規表現分類は `apps/api/src/jobs/sync-forms-responses.ts` 内 `classifyError` の実装（line 411〜420）を参考にしつつ、最小スコープ（4 union 値）で再構成する。冒頭 JSDoc に owner 表 path を必ず含める。

### Step 4: `index.ts` 作成（T4）

`apps/api/src/jobs/_shared/index.ts` を新規作成し barrel export を記述。冒頭 JSDoc に owner 表 path を必ず含める。

### Step 5: `__tests__/ledger.test.ts` 作成（T5）

vitest で smoke import test を記述:

```ts
import { describe, it, expect } from "vitest";
import * as L from "../ledger";

describe("_shared/ledger re-export", () => {
  it("re-exports start/succeed/fail/findLatest/listRecent", () => {
    expect(typeof L.start).toBe("function");
    expect(typeof L.succeed).toBe("function");
    expect(typeof L.fail).toBe("function");
    expect(typeof L.findLatest).toBe("function");
    expect(typeof L.listRecent).toBe("function");
  });
  it("re-exports error classes", () => {
    expect(L.IllegalStateTransition).toBeDefined();
    expect(L.SyncJobNotFound).toBeDefined();
  });
});
```

### Step 6: `__tests__/sync-error.test.ts` 作成（T6）

```ts
import { describe, it, expect } from "vitest";
import { classifySyncError, redactMetricsJson } from "../sync-error";

describe("classifySyncError", () => {
  it("classifies lock conflict", () => {
    expect(classifySyncError(new Error("sync lock already held"))).toBe("lock-conflict");
  });
  it("classifies fetch failures (5xx / 429 / network)", () => {
    expect(classifySyncError(new Error("HTTP 503 Service Unavailable"))).toBe("fetch-failed");
    expect(classifySyncError(new Error("429 quota exceeded"))).toBe("fetch-failed");
  });
  it("classifies D1 / UNIQUE constraint failures", () => {
    expect(classifySyncError(new Error("UNIQUE constraint failed"))).toBe("d1-write-failed");
  });
  it("falls back to unknown", () => {
    expect(classifySyncError(new Error("???"))).toBe("unknown");
  });
});

describe("redactMetricsJson", () => {
  it("drops PII keys", () => {
    const out = redactMetricsJson({
      duration: 1, responseEmail: "x@y.z", email: "a@b.c", responseId: "rid", count: 3,
    });
    expect(out).toEqual({ duration: 1, count: 3 });
  });
});
```

### Step 7: `.github/CODEOWNERS` 編集（T7）

`apps/api/** @daishiman` の行より後ろに以下を挿入:

```text
# sync 共通モジュール owner 表: docs/30-workflows/_design/sync-shared-modules-owner.md
apps/api/src/jobs/_shared/** @daishiman
```

### Step 8: owner 表 markdown 表現更新（T8）

`docs/30-workflows/_design/sync-shared-modules-owner.md` を Edit で更新:
- 「未作成の将来正本パスである」表現を削除し「実体化済み skeleton」に変更
- 物理移管が後続タスク扱いである旨を明記
- 表に `apps/api/src/jobs/_shared/index.ts` 行を追加（既に追加済み）

### Step 9 / 10: 03a / 03b index.md 追記（T9 / T10）

冒頭メタ表直後または `## dependencies` 節の冒頭に下記 1 行を挿入:

```markdown
> **共通モジュールの owner 表**: [../../_design/sync-shared-modules-owner.md](../../_design/sync-shared-modules-owner.md)
```

### Step 11: 検証

```bash
mise exec -- pnpm exec vitest run --config vitest.config.ts apps/api/src/jobs/_shared
mise exec -- pnpm typecheck
mise exec -- pnpm lint
gh api repos/daishiman/UBM-Hyogo/codeowners/errors
grep -l 'sync-shared-modules-owner' apps/api/src/jobs/_shared/*.ts
```

## DoD（Definition of Done）

- T1〜T10 すべて適用完了
- 上記検証コマンドすべて exit 0 / 期待出力
- secret hygiene grep（Phase 9）で 0 件
- 不変条件 #5（D1 直接アクセスは `apps/api` 内のみ）遵守: 新モジュールはすべて `apps/api/` 配下

## 成果物

- `outputs/phase-05/edit-log.md`（編集前後 diff サマリ）

## 完了条件

- 10 サブタスクすべて適用完了
- DoD 全項目クリア

## 目的

本 Phase の目的は、issue-195 follow-up 002 を code / NON_VISUAL workflow として矛盾なく完了させるための判断・作業・検証を記録すること。

## 実行タスク

- [x] 本 Phase の責務に対応する成果物を作成または更新する
- [x] code / NON_VISUAL の分類と owner 表 governance の整合を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-195-03b-followup-002-sync-shared-modules-owner/` | 対象仕様書 |
| owner 表 | `docs/30-workflows/_design/sync-shared-modules-owner.md` | owner / co-owner 正本 |

## 統合テスト連携

- `pnpm exec vitest run --config vitest.config.ts apps/api/src/jobs/_shared`
- `pnpm --filter @ubm-hyogo/api typecheck`
- `pnpm --filter @ubm-hyogo/api lint`
