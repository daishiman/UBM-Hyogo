# Phase 4 — テスト作成（TDD Red 写像 / landed test の正本記述）

**[実装区分: 実装仕様書 / implementation_mode: verify_existing]**

> 本フェーズは「新規に Red を書く」のではなく、commit `745c95115`（PR #1064）で dev に
> landed 済みの targeted test（`ManualFormResyncPanel.spec.tsx` の TC-B1..B8 と
> `sync-schemas.spec.ts` の TC-S1..S7）を「設計された targeted test」として写像する。
> **TDD Red サイクルは既に Green で着地済み**である。本フェーズの責務は、各 TC の検証内容・
> 期待値・モック方針・命名整合を正本として固定し、回帰確認の基準を与えることにある。

---

## 0. Phase 4 開始前チェック（必須）

> テスト着手前に runtime 整合を確認する。これを怠ると esbuild バージョン不整合で
> vitest が起動失敗する（[FB-MSO-002]）。

- [x] `mise exec -- pnpm install`（worktree ごとに `node_modules` が独立するため必須）
- [x] `mise exec -- pnpm verify:vitest-runtime`（arch / worktree isolation / esbuild version の 3 verify）
- [x] vitest は **リポジトリルートから実行**する（`--filter @ubm-hyogo/web exec vitest run --root=../..`）。
      web パッケージは unit / d1 の 2 config に分離しているため、root glob で正しく解決させる。

---

## 1. 対象テストファイルと命名整合（不変条件 #8）

| ファイル | 種別 | 命名規約 |
|---------|------|---------|
| `apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx` | component（jsdom + Testing Library） | `*.spec.tsx` のみ（`*.test.tsx` 禁止） |
| `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts` | schema unit | `*.spec.ts` のみ |

> **drift 補正**: 原タスクファイルの `manual-sync.spec.ts` は誤。landed の正本テスト名は
> `sync-schemas.spec.ts`（Task A の `BackfillResultSchema` と Task B の `SyncResultSchema` /
> `SyncRunResponseSchema` を **co-locate** したファイル）。
> `block-test-suffix`（lefthook）と `verify-test-suffix`（GitHub Actions）が `*.test.*` を reject するため、
> 新規追加時も `*.spec.{ts,tsx}` を厳守する。

---

## 2. モック方針（component test）

`ManualFormResyncPanel.spec.tsx` は外部依存を以下のとおり差し替える。

| 対象 | 手法 | 理由 |
|------|------|------|
| `useAdminMutation` / `FetchAuthedError` | `vi.hoisted` で state 容器とモック関数を作り、`vi.mock("../../../hooks/useAdminMutation", ...)` で差し替え | 通信層を遮断し UI の状態遷移だけを検証する |
| run / backfill の 2 mutation インスタンス振り分け | `hookCallCount % 2 === 0` で偶数呼び出し（2 番目）を backfill 側に割り当て | `ManualFormResyncPanel` が `useAdminMutation` を **同順で 2 回呼ぶ**実装に依存する。順序が正本 |
| `globalThis.confirm` | `vi.spyOn(globalThis, "confirm").mockReturnValue(true/false)` | backfill の確認ダイアログ。`window.confirm` 直書きでなく `globalThis` 経由が正本（[VSCPKR-03]） |

### private / 外部 props 注意（[VSCPKR-03]）

- `confirm` は `globalThis.confirm`。`apps/web` src 配下は `no-restricted-globals` lint があるため
  実装側も `globalThis.confirm` で呼ぶ。テストの spy 対象も `globalThis`。
- `isLoading` / `error` は `useAdminMutation` の **戻り値（外部依存）**であり、コンポーネント内部 state ではない。
  pending・error の検証は hook モックの state 容器（`h.runState` / `h.backfillState`）を書き換えて再 render することで行う。
  内部 `useState`（`lastResult` / `mode` / `parseError`）は直接触らず、描画結果（DOM）越しに観測する。
- mock の `beforeEach` reset（`mockReset` / `hookCallCount = 0` / 既定 resolve 値 / state 初期化 / `confirm` spy）を
  各 TC の前提として固定する。`afterEach` で `cleanup()` + `vi.restoreAllMocks()`。

---

## 3. component test ケース写像（TC-B1..B8）

| TC | シナリオ | トリガ | 期待 |
|----|---------|--------|------|
| TC-B1 | 差分 sync 実行 → 結果表示 | `manual-sync-run` click | `runTriggerMock` が `({}, "/api/admin/sync/responses?fullSync=false")` で呼ばれる / `writeCount` ラベル + 値 `2` + `run` モード表示 |
| TC-B2 | 全件 backfill（confirm 承認） | `manual-sync-backfill` click（`confirm` → true） | `confirm` 呼出後に `backfillTriggerMock` が `({}, "...?fullSync=true")` で呼ばれる / `backfill` 表示 |
| TC-B3 | confirm キャンセル | `manual-sync-backfill` click（`confirm` → false） | `backfillTriggerMock` が**呼ばれない** |
| TC-B4 | pending 中の二重起動防止 | `h.runState.isLoading = true` で render | `manual-sync-run` / `manual-sync-backfill` の `disabled` が共に `true` |
| TC-B5 | 409 sync_in_progress 検知 | `h.runState.error = FetchAuthedError(409, JSON{ok:false,result:{status:"skipped",jobId,...}})` で render | `role="status"` に「他の sync が実行中です」/ 結果テーブル（`writeCount`）**非描画** |
| TC-B6 | HTTP error | `h.runState.error = new Error("sync failed")` で render | `role="alert"` に message / 結果テーブル**非描画** |
| TC-B7 | schema mismatch | `runTriggerMock.mockResolvedValueOnce({ foo: 1 })` → run click | `role="alert"`（parseError「sync result schema mismatch」）/ 結果テーブル**非描画** |
| TC-B8 | 差分成功 → onSynced | `onSynced` prop 注入 → run click | `onSynced` が `{ status:"succeeded", writeCount:2 }`（`objectContaining`）で呼ばれる |

> **drift 補正（409 body 形）**: 原タスクの `{ok:false,error:"sync_in_progress"}` は誤。
> 正本は `{ok:false,result:{status:"skipped", jobId, processedCount, writeCount, cursor, skippedReason}}`。
> TC-B5 はこの形を `FetchAuthedError.bodyText` に詰め、`parseInProgress` が
> `SyncRunResponseSchema.safeParse` 成功 + `result.status === "skipped"` を検知することを保証する。

### 検証の構造的ポイント

- **「テーブル非描画」は全 fail path の共通不変条件**（TC-B5/B6/B7）。`screen.queryByText("writeCount")` が `null`。
- error 表示の role 使い分け: `parseError` と HTTP error → `role="alert"`、409 inProgress → `role="status"`（assertive vs polite）。
  描画分岐の優先順位は `parseError` > `inProgress` > `error` の順（実装の三項分岐に一致）。
- 非同期 trigger を待つ assertion は `waitFor` / `findBy*`。同期描画（pending / error は render 時点で確定）は `getBy*`。

---

## 4. schema test ケース写像（TC-S1..S7）

`sync-schemas.spec.ts` の `manual-sync schemas` describe（Task A 分は同ファイル先頭の `BackfillResultSchema` describe）。

| TC | 対象 | 入力 | 期待 |
|----|------|------|------|
| TC-S1 | `SyncResultSchema` valid | `status:"succeeded"` の最小正常 object | parse 成功・`status==="succeeded"` |
| TC-S2 | `SyncRunResponseSchema` 200 wrapper | `{ ok:true, result }` | `result.status === "succeeded"` を持つ |
| TC-S3 | `SyncRunResponseSchema` 409 wrapper | `{ ok:false, result:{status:"skipped",...} }` | `result.status === "skipped"` を持つ |
| TC-S4 | status enum | `{...valid, status:"running"}` | **reject**（enum は `succeeded`/`failed`/`skipped` のみ） |
| TC-S5 | nonnegative | `{...valid, writeCount:-1}` | **reject** |
| TC-S6 | `skippedReason` optional | `skippedReason` を欠落 | **success** |
| TC-S7 | ok:false refine | `{ ok:false, result:<status:succeeded> }` | **reject**（`ok:false` 枝は `status==="skipped"` を `.refine` で要求） |

> **drift 補正（schema フィールド）**: 原タスク §3.2 / §8.5 の `failed` 周辺フィールド・`retryCount`・`durationMs` は
> landed schema に**存在しない**。正本フィールドは `status / jobId / processedCount / writeCount / cursor / skippedReason(optional)` の
> 6 個で、object は `.strict()`。`SyncRunResponseSchema` は 200（`ok:true`）と 409（`ok:false` + skipped refine）の
> 2 枝 union で、両枝とも `.strict()`。`status` enum に `running` は無い（TC-S4 が reject を保証）。

---

## 5. 検証コマンド（本フェーズの Green 確認）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. \
  apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx \
  apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
```

- 期待: 上記 2 ファイルの全 TC（component 8 + schema 7、加えて Task A backfill 4）が pass。
- `verify_existing` のため Red は発生せず、最初から Green であることが正本（landed 済み）。

---

## 完了条件

- [x] Phase 4 開始前チェック（`pnpm install` + esbuild 整合 [FB-MSO-002]）を明記した
- [x] 対象テスト 2 ファイルと命名整合（不変条件 #8・`*.spec.{ts,tsx}`）を記述した
- [x] モック方針（`vi.hoisted` / `vi.mock` / `vi.spyOn(globalThis,"confirm")`）と private/外部 props 注意（[VSCPKR-03]）を記述した
- [x] component test TC-B1..B8 を期待値付きで写像した
- [x] schema test TC-S1..S7 を期待値付きで写像した
- [x] drift 補正（テスト名 / schema フィールド / 409 body）を正本として固定した
- [x] TDD Red が既に Green 済みである旨を明記した
- [x] 検証コマンドを提示した
