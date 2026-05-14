# Phase 12 — Documentation Changelog

## Step 1-A: 完了記録

- `index.md`: task-26 を `implemented_local_evidence_captured` へ再分類
- `artifacts.json` / `outputs/artifacts.json`: root/output parity を追加
- `outputs/phase-12/main.md`: strict 7 entry point を追加

## Step 1-B: 実装状況テーブル

- Phase 1-12 を `completed`、Phase 13 を user-gated `blocked` に統一
- `spec_created` と実装済み表現の混在を解消

## Step 1-C: 関連タスクテーブル

- task-05 / 08 / 09 / 18 / 24 の関係を `system-spec-update-summary.md` に記録

## Step 2: システム仕様変更

- 該当なし。token SSOT / `@theme inline` bridge は変更せず、consumer のみを既存 utility へ移行

## Workflow-local 同期

- `apps/web/app/error.tsx`: arbitrary token class を `text-danger`, `text-text-3`, `bg-surface-2`, `bg-accent`, `text-panel`, `border-border` へ置換
- `apps/web/app/not-found.tsx`: `fg-muted`, `primary`, `on-primary`, `border` の stale token を utility 化
- `apps/web/app/loading.tsx`: `surface-2` stale token を `bg-surface-2` へ置換し `motion-safe:animate-pulse` へ調整
- `apps/web/app/__tests__/error.component.spec.tsx`: `RouteError` / `Loading` / `NotFound` の className regression assertion を追加
- `outputs/phase-11/screenshots/not-found-desktop.png`: reachable UI screenshot を追加
- `docs/30-workflows/task-26-.../outputs/phase-12/*.md`: strict 7 / implemented-local close-out に同期

## Global skill sync

- `aiworkflow-requirements` ledger sync: `indexes/resource-map.md`, `indexes/quick-reference.md`, `references/task-workflow-active.md`, `LOGS/_legacy.md`
- `task-specification-creator` skill mutation: なし（既存 strict 7 / workflow-state rules に準拠）

## 確認コマンド

```bash
cmp -s docs/30-workflows/task-26-ui-mvp-w8-par-error-tsx-token-utility-migration/artifacts.json docs/30-workflows/task-26-ui-mvp-w8-par-error-tsx-token-utility-migration/outputs/artifacts.json
rg -n 'text-\[var\(|bg-\[var\(|border-\[var\(|fg-muted|ubm-color-(primary|on-primary|border|surface-2)' apps/web/app/error.tsx apps/web/app/not-found.tsx apps/web/app/loading.tsx
pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/app/__tests__/error.component.spec.tsx
pnpm --filter @ubm-hyogo/web test
pnpm --filter @ubm-hyogo/web verify-design-tokens
```
