# Phase 4: テスト作成

## メタ情報

| 項目 | 値 |
|------|-----|
| feature | `publish-state-backfill-admin-ui` |
| phase | 4 / 13 |
| 実装区分 | 実装仕様書 |
| workflow_state | implemented_local_evidence_captured |
| 前提 | Phase 1-3（設計）PASS |
| 正本 | 既存実装（PR #1064 / commit `745c95115` で dev へ landed） |

> 本タスクは既に dev へ実装・テスト済み。本仕様書は landed 実装の正本記述であり、テストファイルは既に実在する。Write 対象は仕様書のみ（コード変更は行わない）。

## 目的

公開状態 backfill 管理パネルの振る舞い（dry-run / apply の 2 段階フロー・破壊性ガード・schema 検証・error 分離）を、コンポーネントテストと schema テストの 2 層で固定する。AC-A1..A4 と不変条件（#8 命名 / #10 mutation 規約 / OKLch トークン）を実テストへ写像する。

## 実行タスク

正本となる実テストファイル（既に実在）:

1. `apps/web/src/features/admin/components/_sync/__tests__/BackfillPublishStatePanel.spec.tsx`
   - vitest + jsdom + `@testing-library/react`。
   - `useAdminMutation` を `vi.mock("../../../hooks/useAdminMutation", ...)` で差し替え、`trigger: triggerMock` / `isLoading` / `error` を `mutationState` から供給する。
   - `globalThis.confirm` は `beforeEach` で `vi.spyOn(globalThis, "confirm").mockReturnValue(true)` を既定とする。
   - `afterEach` で `cleanup()` + `vi.restoreAllMocks()`、`beforeEach` で `triggerMock.mockReset()` → `mockResolvedValue(DRY_RUN_RESULT)`。

2. `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts`
   - schema テストを既存 `sync-schemas.spec.ts` に **co-locate**（新規 `backfill.spec.ts` は作らない）。
   - `describe("BackfillResultSchema")` ブロックを追加し、`import { BackfillResultSchema } from "../backfill"` で検証する。

### テストデータ定数

| 定数 | 値 |
|------|-----|
| `DRY_RUN_RESULT` | `{ dryRun:true, policy:"auto-publish-on-consent", scanned:10, candidates:2, applied:0, skipped:{alreadyPublic:3, adminExplicit:1, consentNotMet:4, deleted:0} }` |
| `APPLY_RESULT` | `{ dryRun:false, policy:"auto-publish-on-consent", scanned:2, candidates:2, applied:2, skipped:{alreadyPublic:0, adminExplicit:0, consentNotMet:0, deleted:0} }` |
| `validBackfill`（schema spec） | `DRY_RUN_RESULT` 相当（`policy` は `as const`） |

### コンポーネントテストケース（BackfillPublishStatePanel.spec.tsx）

| TC | 内容 | 検証 |
|----|------|------|
| TC-A1 | dry-run 実行 | `triggerMock` が `({}, "/api/admin/sync/backfill-publish-state?dryRun=true")` で呼ばれ、`candidates` ラベル・値 `2`・`dryRun` ラベルが描画される |
| TC-A2 | apply 実行（dry-run 先行後） | `?dryRun=false` で呼ばれ `applied` 件数 + mode=apply を表示。`"apply"` は button 文言と mode dd の 2 箇所に現れる（`getAllByText("apply").length >= 2`） |
| TC-A2b | dry-run 前の apply | apply ボタンが `disabled === true` |
| TC-A2c | apply の confirm キャンセル | `confirm` を `false` モックすると trigger 呼出は dry-run の 1 回のみ（`toHaveBeenCalledTimes(1)`） |
| TC-A3 | skipped 内訳 | `skipped.adminExplicit` / `skipped.deleted` を各行表示 |
| TC-A4 | pending（`isLoading=true`） | dry-run / apply の両ボタンが `disabled === true`（二重起動防止） |
| TC-A4b | apply pending 中は apply ボタンだけ busy になる | apply 実行中に apply ボタンのみ `aria-busy="true"`（loading）、dry-run ボタンは loading しない（`activeMode` で in-flight 操作を分離） |
| TC-A5 | HTTP error（`mutationState.error`） | `role="alert"` に error 文言、結果テーブル（`candidates`）は非描画 |
| TC-A6 | schema mismatch（`{ foo:1 }`） | `parseError` alert を表示し結果テーブル非描画 |
| TC-A7 | apply 成功時の `onApplied` | 検証済み結果（`expect.objectContaining({ applied:2 })`）で呼ばれる |

### schema テストケース（sync-schemas.spec.ts → `describe("BackfillResultSchema")`）

| TC | 内容 | 検証 |
|----|------|------|
| TC-B1 | valid parse | endpoint 準拠 object を受理し `candidates === 2` |
| TC-B2 | policy literal 違反 | `policy:"other"` は `safeParse().success === false` |
| TC-B3 | 負数 | `scanned:-1`（nonnegative 違反）は reject |
| TC-B4 | skipped 欠落 | `skipped.deleted` 欠落は reject（`.strict()` で過不足検出） |

## 参照資料

| 種別 | パス |
|------|------|
| 実装（panel） | `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx` |
| 実装（schema） | `apps/web/src/features/admin/diagnostics/backfill.ts` |
| mount | `apps/web/app/(admin)/admin/sync-status/page.tsx`（:6 import / :128 mount） |
| mutation hook | `apps/web/src/features/admin/hooks/useAdminMutation`（不変条件 #10） |
| 設計 | `phase-2.md` / レビュー `phase-3.md` |
| 命名規約 | 不変条件 #8（`*.spec.{ts,tsx}` のみ） |

## 実行手順

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm lint
```

1. `BackfillPublishStatePanel.spec.tsx` を作成し、`useAdminMutation` を `vi.mock` で差し替える。
2. `DRY_RUN_RESULT` / `APPLY_RESULT` を定義し、`beforeEach` で `confirm` を true 既定モックする。
3. TC-A1..A7 を実装する。apply 系（TC-A2 / TC-A7）は `mockResolvedValueOnce(DRY_RUN_RESULT).mockResolvedValueOnce(APPLY_RESULT)` で dry-run → apply の順序を再現する。
4. `sync-schemas.spec.ts` に `describe("BackfillResultSchema")` を追記し TC-B1..B4 を実装する。
5. `pnpm --filter @ubm-hyogo/web test` で全 TC が green になることを確認する。

## 統合テスト連携

3 層整合を本 Phase で具体ケース化する:

| 層 | 正本 | 本 Phase の対応 |
|----|------|----------------|
| endpoint（D1） | `apps/api` の救済 endpoint（差分 0・本タスク非変更） | `DRY_RUN_RESULT` / `APPLY_RESULT` が endpoint レスポンス形に準拠 |
| web schema | `backfill.ts` `BackfillResultSchema` | TC-B1..B4 |
| panel | `BackfillPublishStatePanel.client.tsx` | TC-A1..A7 |

## 多角的チェック観点（AIが判断）

- `confirm` モック漏れで apply テストが flaky にならないか（`vi.spyOn(globalThis, "confirm")` を `beforeEach` 既定化）。
- jsdom 環境下で `globalThis.confirm` が未定義にならないか（spyOn が stub を提供）。
- `getAllByText("apply")` が button と dd の 2 箇所を正しく区別するか（mode 可視化検証）。
- `vi.mock` のパス（`"../../../hooks/useAdminMutation"`）が legacy `@/lib/useAdminMutation` を参照していないか（不変条件 #10）。
- 命名が `*.spec.tsx` / `*.spec.ts` のみで `*.test.*` を含まないか（不変条件 #8・lefthook `block-test-suffix`）。

## サブタスク管理

| ID | 内容 | 判定 |
|----|------|------|
| T4-1 | panel コンポーネントテスト（TC-A1..A7） | 完了（landed） |
| T4-2 | schema テスト co-locate（TC-B1..B4） | 完了（landed） |
| T4-3 | テストデータ定数の endpoint 準拠確認 | 完了 |

## 成果物

- `apps/web/src/features/admin/components/_sync/__tests__/BackfillPublishStatePanel.spec.tsx`（TC-A1..A7）
- `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts`（`describe("BackfillResultSchema")` TC-B1..B4 を co-locate）

## 完了条件

- [x] TC-A1..A7 と TC-B1..B4 が実装され green。
- [x] `useAdminMutation` を `vi.mock` 化、`confirm` を `vi.spyOn` 既定 true 化。
- [x] テスト命名は `*.spec.{ts,tsx}` のみ（不変条件 #8）。
- [x] schema テストは新規ファイルを作らず `sync-schemas.spec.ts` へ co-locate。
- [x] coverage AC（apps/web 既定閾値 Statements/Branches/Functions/Lines >= 80%）の検証は Phase 7 で確定する（本 Phase は green 確認まで）。

## タスク100%実行確認【必須】

- [x] TC とテストデータ定数を表で網羅した。
- [x] dry-run / apply / confirm キャンセル / pending / error / schema mismatch の各分岐を TC へ写像した。
- [x] 不変条件 #8 / #10 をチェック観点に明記した。

## 次Phase

Phase 5（実装）。
