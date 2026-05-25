# Phase 4: テスト作成計画（TDD Red フェーズ）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | `issue-837-schema-alias-bulk-rollback` |
| 入力 | `phase-01-requirements.md` / `phase-02-design.md` / `phase-03-design-review.md` |
| 出力 | 追加/編集テストファイル一覧・テストケース表・実行コマンド |
| TDD フェーズ | **RED**（実装着手前に失敗するテストを先行追加） |

---

## TDD RED フェーズの方針

- 本フェーズでは **コードを実装しない**。テストファイルのみを追加・編集し、全テストが Red（fail）になることを確認する。
- Phase 5 の実装が完了した時点で Green に転じることを以て「実装完了」とみなす。
- **テスト操作対象の区別**:
  - `useSchemaDiffBulkRollbackSelection` の `toggle` / `selectAll` / `clearSelection` / `openModal` / `submit` / `isSubmitting` 遷移は **hook 内部 state**（`selectedIds: Set<string>` / `rows` / `summary` / `isSubmitting`）を直接操作・検証する。external prop は受け取らない。
  - `SchemaDiffBulkRollbackModal` の `per-row status バッジ` / `summary バナー` は **external prop**（`rows` / `summary` / `isSubmitting`）を親から受け取り表示するため、props を変えてレンダリング結果を検証する（internal state なし）。
  - `SchemaDiffPanel.tsx` の bulk rollback mode トグル / checkbox 表示 / 50件上限 alert は **`SchemaDiffPanel` の internal state**（`bulkRollbackMode`）と hook `useSchemaDiffBulkRollbackSelection` の external state を組み合わせて検証する。checkbox の selection state は hook が所有する internal state。

---

## 追加 / 変更テストファイル一覧

| ファイルパス | 種別 | 変更内容 |
| --- | --- | --- |
| `apps/web/src/lib/admin/__tests__/api.spec.ts` | **編集** | `rollbackSchemaAliasBulk` のケースを新規 `describe` ブロックで追記 |
| `apps/web/src/components/admin/__tests__/SchemaDiffBulkRollbackModal.component.spec.tsx` | **新規** | modal 単体テスト（a11y / per-row status / summary バナー） |
| `apps/web/src/components/admin/hooks/__tests__/useSchemaDiffBulkRollbackSelection.spec.tsx` | **新規** | hook 単体テスト（selection state / openModal / submit / isSubmitting 解放） |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` | **編集** | bulk rollback mode トグル / bulk resolve との非干渉ケース追記 |
| `playwright/tests/issue837-schema-bulk-rollback.spec.ts` | **新規** | E2E シナリオ（Phase 11 で実行） |

> **命名規則**: `*.spec.tsx` / `*.spec.ts` のみ（`*.test.*` は禁止。CLAUDE.md 不変条件8）。

---

## テストケース詳細

### 1. `apps/web/src/lib/admin/__tests__/api.spec.ts`（編集）

新規 `describe` ブロック名: `rollbackSchemaAliasBulk()`

**fetch モック方式**: 既存 `api.spec.ts` の方式に合わせ、`fetchSpy = vi.fn()` を `beforeEach` で生成し `globalThis.fetch = fetchSpy as unknown as typeof fetch` で注入する（`vi.stubGlobal("window", ...)` は使用しない）。

| テスト ID | 対象 | 入力 | 期待値 |
| --- | --- | --- | --- |
| RBLK-01 | `rollbackSchemaAliasBulk([])` | 空配列 | `{ results: [] }` を即座に返し `fetchSpy` を呼ばない |
| RBLK-02 | 全件成功（3件） | 各行 `version=1`、全 fetch が HTTP 200 を返す | `results[].status` が `["success","success","success"]` / `results[].aliasId` が入力順と一致 |
| RBLK-03 | 部分失敗：1件 409 混在 | 3件中 `aliasId="a2"` の fetch が HTTP 409 `{ error: "version_mismatch" }` を返す | `results[1].status === "error"` / `results[1].error.kind === "version_mismatch"` / `results[1].error.httpStatus === 409` / 他2件は `"success"` |
| RBLK-04 | 404 not_found | 1件の fetch が HTTP 404 `{ error: "not_found" }` を返す | `results[0].status === "error"` / `results[0].error.kind === "not_found"` / `results[0].error.httpStatus === 404` |
| RBLK-05 | network 失敗 | fetch が `new Error("offline")` を reject | `results[0].status === "error"` / `results[0].error.kind === "network"` / `results[0].error.httpStatus === 0` / `results[0].error.message === "offline"` |
| RBLK-06 | 50 件超 throw | 51件の rows を渡す | `RollbackApiError` を throw / `.code === "bulk_limit_exceeded"` / `.status === 0` / fetch は呼ばれない |
| RBLK-07 | concurrency 順序非依存 | 8件を concurrency 8 で fan-out（fetch ごとに 1ms 遅延） | `results.map(r => r.aliasId)` が入力順と一致 / `maxInflight <= 8` |
| RBLK-08 | `onRowResult` コールバック発火 | 2件、`onRowResult` を `vi.fn()` で渡す | `onRowResult` が 2回呼ばれ、各呼び出しの第1引数が対応する `SchemaAliasRollbackBulkRowResult`、第2引数が行インデックス |

---

### 2. `apps/web/src/components/admin/__tests__/SchemaDiffBulkRollbackModal.component.spec.tsx`（新規）

**セットアップ方針**:
- `window.api` モックが必要な場合は `Object.defineProperty(window, "api", { value: ..., writable: true })` を使う（`vi.stubGlobal("window", ...)` は happy-dom 環境では禁止）。
- `jest-axe`（`axe` / `toHaveNoViolations`）を使い a11y violation 0 を確認する。

**テスト用ヘルパー型**:

```typescript
const makeAlias = (id: string): ResolvedAliasItem => ({
  id,
  version: 1,
  aliasLabel: `alias-${id}`,
  stableKey: `key-${id}`,
  resolvedAt: "2026-05-01T00:00:00.000Z",
  impact: { affectedResponseCount: 3, recomputeRequired: false },
});
```

| テスト ID | 対象 | 入力 props | 期待値 |
| --- | --- | --- | --- |
| MOD-01 | `role="dialog"` 付与 | open=true, rows=[alias-1] | container に `role="dialog"` / `aria-modal="true"` |
| MOD-02 | `aria-labelledby` 対応 | open=true | dialog の `aria-labelledby` が見出し要素の id と一致 |
| MOD-03 | focus trap: Tab で modal 外に抜けない | open=true, rows=[alias-1] | Tab キー 3回押下後もフォーカスが modal 内に留まる |
| MOD-04 | close: `onClose` 発火 | isSubmitting=false | キャンセル押下で `onClose` が 1回呼ばれる |
| MOD-05 | 選択 alias 一覧表示 | selected=[alias-1, alias-2] | aliasLabel / stableKey / resolvedAt が各行に描画される |
| MOD-06 | aggregate 影響件数（affectedResponseCount 合計） | selected 2件（各 count=3） | 合計 6 件を示すテキストが描画される |
| MOD-07 | per-row status バッジ: 全 pending | rows の `submitStatus="pending"` | 各行に pending 相当のバッジが描画される |
| MOD-08 | per-row status バッジ: エラー行 | rows に `submitStatus="error"` + `errorMessage` | error 行に失敗バッジ + errorMessage |
| MOD-09 | summary バナー: 全成功 | summary={succeeded:[a1,a2],failed:[]} | `data-summary-kind="all-success"` |
| MOD-10 | summary バナー: 部分成功 | summary={succeeded:[a1,a2],failed:[a3]} | `data-summary-kind="partial"` |
| MOD-11 | summary バナー: 全失敗 | summary={succeeded:[],failed:[a1,a2]} | `data-summary-kind="all-failed"` |
| MOD-12 | 失敗分再 submit | partial failure 後に失敗 rows のみ残る | 同じ「一括で取り消す」ボタンが enabled で、再押下可能 |
| MOD-13 | 送信中 lock | isSubmitting=true | submit / cancel button が disabled |
| MOD-14 | a11y violation 0 | open=true, rows=[alias-1] | `axe(container)` の violations が空配列 |

---

### 3. `apps/web/src/components/admin/hooks/__tests__/useSchemaDiffBulkRollbackSelection.spec.tsx`（新規）

**セットアップ方針**:
- `renderHook` / `act`（`@testing-library/react`）を使用。
- `rollbackSchemaAliasBulk` は `vi.fn()` でモック（`SchemaAliasRollbackBulkRowResult[]` を返す）。

**テスト用ヘルパー**:

```typescript
const makeSuccessResult = (aliasId: string): SchemaAliasRollbackBulkRowResult => ({
  aliasId,
  status: "success",
  data: { aliasId, rolledBackAt: "2026-01-01T00:00:00Z", relatedAuditId: "aud-1", newVersion: 2, impact: { affectedResponseCount: 1, recomputeRequired: false } },
});

const makeErrorResult = (aliasId: string, kind: "version_mismatch" | "not_found" | "network" | "other"): SchemaAliasRollbackBulkRowResult => ({
  aliasId,
  status: "error",
  error: { kind, message: `${kind} error`, httpStatus: kind === "version_mismatch" ? 409 : kind === "not_found" ? 404 : 0 },
});
```

| テスト ID | 対象 | 操作 | 期待値 |
| --- | --- | --- | --- |
| HOOK-01 | `toggle` | `toggle("a1")` を 1 回呼ぶ | `selectedIds` に `"a1"` が追加される / `selectedCount === 1` |
| HOOK-02 | `toggle` 2回（トグル解除） | `toggle("a1")` を 2 回呼ぶ | `selectedIds` から `"a1"` が除去される / `selectedCount === 0` |
| HOOK-03 | `selectAll` | `selectAll(["a1","a2","a3"])` | `selectedIds` が `{"a1","a2","a3"}` / `selectedCount === 3` |
| HOOK-04 | `clearSelection` | `selectAll(["a1","a2"])` → `clearSelection()` | `selectedIds` が空 / `selectedCount === 0` |
| HOOK-05 | 50件超過判定は Panel が担当 | 51件の aliasId を `selectAll` | `selectedCount === 51`（Panel 側で limit alert / disabled を検証） |
| HOOK-06 | 50件境界値 | 50件を `selectAll` | `selectedCount === 50` |
| HOOK-07 | `submit` が `rollbackSchemaAliasBulk` を呼ぶ | 2件選択後 `submit(rows)` | `rollbackSchemaAliasBulk` が rows と同じ aliasId を含む引数で 1回呼ばれる |
| HOOK-08 | 全成功 | `submit` で mock が 2件 success を返す | `summary = {succeeded:["a1","a2"],failed:[]}` / modal close / rows 空 |
| HOOK-09 | 部分失敗 | `submit` で mock が 1成功 + 1 version_mismatch error を返す | `summary = {succeeded:["a1"],failed:["a2"]}` / 成功 row 除去 / 失敗 row errorMessage 残留 |
| HOOK-10 | `isSubmitting` 解放 | `submit` 呼び出し前後 | submit 完了後 `isSubmitting === false` |
| HOOK-11 | `onRowsSucceeded` コールバック（全成功） | 全成功 submit | 成功 aliasId 配列で 1 回呼ばれる |
| HOOK-12 | `onRowsSucceeded` コールバック（部分成功） | 部分失敗 submit | 成功分 aliasId のみで呼ばれる |
| HOOK-13 | `summary` の error breakdown | 全失敗（2件 version_mismatch） | `summary = {total:2,success:0,error:2}` |

---

### 4. `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx`（編集）

新規 `describe` ブロック名: `HistoryPane — bulk rollback mode`

**編集方針**: 既存 spec のテストケースには一切手を加えず、末尾に新規 describe ブロックを追記する。

| テスト ID | 対象 | 操作 | 期待値 |
| --- | --- | --- | --- |
| PANEL-BR-01 | bulk rollback mode トグル | 「Bulk Rollback」ボタン（`aria-pressed="false"` 初期状態）を click | HistoryPane の各行に checkbox が描画される |
| PANEL-BR-02 | bulk rollback mode OFF 時の単体 rollback 回帰 | `bulkRollbackMode=false` の状態 | 各行に従来の「Rollback」ボタンが描画され checkbox は描画されない |
| PANEL-BR-03 | select-all checkbox | bulk rollback mode ON → select-all click | 全行の checkbox が checked になる |
| PANEL-BR-04 | 50 件超 alert | bulk rollback mode ON で 51件を選択（select-all + 51件のフィクスチャ） | 50件超を示す alert テキストが描画され「一括取消」ボタンが disabled |
| PANEL-BR-05 | 0件選択時の「一括取消」ボタン disabled | bulk rollback mode ON で何も選択しない | 「一括取消」ボタンが disabled |
| PANEL-BR-06 | bulk resolve mode との非干渉 | bulk resolve mode を ON にし、その後 bulk rollback mode を ON に切替 | bulk resolve の checkbox/トグルと bulk rollback の checkbox/トグルが独立している |
| PANEL-BR-07 | 既存 single rollback spec の回帰なし | 既存の `PANEL-*` テストを実行 | 全て green（変更なし） |

---

### 5. `playwright/tests/issue837-schema-bulk-rollback.spec.ts`（新規 E2E）

> **実行タイミング**: この E2E spec は **Phase 11 の手動テスト証跡取得フェーズ**で実行する。Phase 4 の TDD Red フェーズでは「テストファイルの存在」のみを確認し、実行は省略してよい（playwright は staging 環境依存のため）。

| シナリオ ID | シナリオ名 | 手順概要 | 期待値 |
| --- | --- | --- | --- |
| E2E-BR-01 | bulk select → modal → all-success | HistoryPane で 3件を checkbox 選択 → 「一括取消」→ confirm → 全成功 | modal が閉じ、選択した alias が履歴から消える |
| E2E-BR-02 | partial failure: 成功分確定・失敗分残留 | 3件中 2件が成功 / 1件が version_mismatch | 成功 2件が履歴から消え、失敗 1件が modal に残り「失敗分を再取消」ボタンが表示される |
| E2E-BR-03 | 50 件超 confirm 抑止 | 51件を select-all で選択 | 「一括取消」ボタンが disabled / 50件上限 alert が表示される |
| E2E-BR-04 | 全失敗（全件 version_mismatch） | 全件 409 を mock | summary バナーに「全失敗」相当テキスト / 「失敗分を再取消」ボタンが表示される |

---

## fixtures / mock 方針

- 新規 mock infra（`schema.handlers.ts` 等）は作成しない。既存 `api.spec.ts` と同じく `fetchSpy = vi.fn()` / `globalThis.fetch = fetchSpy as unknown as typeof fetch` パターンを踏襲する。
- `SchemaDiffPanel.component.spec.tsx` では既存 `SchemaDiffHistoryPanel.component.spec.tsx` / `SchemaDiffPanel.component.spec.tsx` の fetch mock パターンを確認して統一する。
- `useSchemaDiffBulkRollbackSelection.spec.tsx` では `rollbackSchemaAliasBulk` を `vi.fn()` で注入し、fetch 層には触れない。

---

## ローカル実行コマンド

```bash
# 単体テスト（Red 確認）
mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/lib/admin/__tests__/api.spec.ts apps/web/src/components/admin/hooks/__tests__/useSchemaDiffBulkRollbackSelection.spec.tsx apps/web/src/components/admin/__tests__/SchemaDiffBulkRollbackModal.component.spec.tsx apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx
```

> このタイミングでは全テストが **fail（Red）** になることを確認する。実装は Phase 5 で進める。

---

## 完了条件

- [ ] 上記 5 テストファイルが追加/編集され、すべて Red になっている
- [ ] テスト命名規則（`*.spec.tsx` / `*.spec.ts`）違反なし
- [ ] `vi.stubGlobal("window", ...)` を使用していない（happy-dom 注意）
- [ ] `Object.defineProperty` / `globalThis.fetch = fetchSpy` 方式で fetch をモックしている
- [ ] jest-axe が `SchemaDiffBulkRollbackModal.component.spec.tsx` に含まれている
- [ ] E2E spec ファイルが存在している（Phase 11 まで実行不要）
