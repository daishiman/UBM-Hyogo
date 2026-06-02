# インタラクション状態テーブル — publish-state-backfill-admin-ui

| 項目 | 値 |
|------|-----|
| feature | `publish-state-backfill-admin-ui` |
| component | `BackfillPublishStatePanel.client.tsx` |
| ステータス | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING（runtime 描画は staging user-gated） |

## 状態（ST-1..ST-7）

| # | 状態 | トリガ | 期待描画 | 検証 TC |
|---|------|--------|----------|---------|
| ST-1 | dry-run 初期 | mount 直後 | `AdminSectionCard` title="公開状態 backfill"。dry-run（`variant="soft"`, `data-testid="backfill-dry-run"`, enabled）+ apply（`variant="danger"`, `data-testid="backfill-apply"`, **disabled**）。`<dl>` 非表示。alert 非表示 | TC-A2b |
| ST-2 | 結果表示（dry-run） | dry-run 押下 → 200 + safeParse 成功 | `<dl className="grid grid-cols-2 md:grid-cols-4">` に `mode=dryRun` / `scanned` / `candidates` / `applied(=0)` / `skipped.alreadyPublic` / `skipped.adminExplicit` / `skipped.consentNotMet` / `skipped.deleted` | TC-A1 / TC-A3 |
| ST-3 | apply disabled | dry-run 未実行 または `candidates===0` | apply `disabled`（`canApply===false`）。`canApply = lastResult!==null && mode==="dryRun" && lastResult.dryRun && lastResult.candidates>0` | TC-A2b |
| ST-4 | apply 実行 | apply 押下 → confirm OK → 200 | `<dl>` に `mode=apply` / `applied`（昇格件数）。`onApplied(parsed.data)` 発火 | TC-A2 / TC-A7 |
| ST-5 | error（HTTP） | dry-run/apply で HTTP error | `<p role="alert" className="text-[var(--ubm-color-danger)]">` に `mutation.error.message`。`<dl>` 非描画 | TC-A5 |
| ST-6 | parseError（schema mismatch） | レスポンスが `BackfillResultSchema` 不適合 | `<p role="alert">` に `"backfill result schema mismatch"`。`<dl>` 非描画。`parseError` が `mutation.error` より優先 | TC-A6 |
| ST-7 | pending | dry-run/apply 実行中 | 両ボタン `disabled={mutation.isLoading}`。実行モード側ボタンのみ `loading`（in-flight 中の `activeMode` 基準・dry-run: `activeMode !== "apply"` / apply: `activeMode === "apply"`）。完了済み `mode` ではなく `activeMode` を使うことで押下ボタンだけが busy 表示 | TC-A4 / TC-A4b |

## トークン / a11y 不変条件

| 観点 | 値 |
|------|-----|
| error 文言色 | `text-[var(--ubm-color-danger)]`（OKLch トークン・HEX 禁止） |
| ラベル色 | `text-[var(--ubm-color-text-muted)]` |
| error role | `role="alert"` |
| 結果構造 | `<dl>` / `<dt>` / `<dd>`（label-value semantics） |
| 破壊的操作 | apply=`variant="danger"` + dry-run 先行 + `globalThis.confirm` |

## 表示優先順位（error）

```
parseError ? <alert>{parseError}</alert>
  : mutation.error ? <alert>{mutation.error.message}</alert>
  : null
```

- ST-6（parseError）は ST-5（HTTP error）より優先表示される。
