> 関連 source: docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md
> 実装区分: 実装仕様書
> 生成 phase: phase-12

# Unassigned Task Detection

## 判定

新規未タスク化: 0 件

今回検出した改善点は workflow package / `apps/web` / system spec 内で修正完了した。Sentry dashboard smoke と staging runtime logger evidence は新規未タスクではなく、既存 Phase 13 / G4 user approval gate の実行事項として残す。

## 検出コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n '\bwindow\.' src/ \
  | grep -v 'is-browser.ts' \
  | grep -v 'instrumentation-client.ts' \
  | (! grep .)

mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n '\bdocument\.' src/ \
  | grep -v 'is-browser.ts' \
  | grep -v '__tests__' \
  | (! grep .)
```

## 検出結果テーブル

| path | line | 提案修正 | 委譲先 task |
| --- | --- | --- | --- |
| N/A | N/A | local PASS 5 点取得済み。新規 backlog 化対象なし | N/A |

## 転記用スニペット

```markdown
- [ ] task-04 Phase 9 grep gate を実行し、`is-browser.ts` / `instrumentation-client.ts` 以外の `window.` が 0 件であることを確認する。
```

## Canonical follow-up locations

新規未タスク化は 0 件のため起票は不要だが、`window.` / `document.` / `history.` / `navigator.` 直書きの本格消化先は以下の既存タスク群を canonical follow-up location とする:

- task-05（`app/error.tsx` error boundary integration）: `logger.error({ event, error, digest })` を error boundary から呼び出す導入先。
- task-11..17（per-screen migration）: 各画面で `whenBrowser()` / `browserHistory()` / `browserDocument()` / `browserNavigator()` を採用し、ESLint allow-list（`apps/web/src/lib/is-browser.ts` / `apps/web/src/instrumentation-client.ts` / `apps/web/src/lib/sentry/**` / `apps/web/src/**/__tests__/**`）以外での直書き残置を grep gate で検出。

新規 unassigned-task の formalize は不要（既存タスク内で消化）。
