# Phase 13 — PR 作成（user 明示承認後のみ）

## ⚠️ 実行条件

**user の明示的な許可を得るまで実施しない。** 自動 commit / push / `gh pr create` は行わない。

## PR 草案

### Title

`feat(apps/web): migrate error.tsx to @theme inline utility (task-26)`

### Base

`dev`

### Summary

- `apps/web/app/error.tsx` の Tailwind arbitrary value 直書きを task-09 `@theme inline` utility に置換
- 旧互換 alias / stale runtime token `--ubm-color-fg-muted` / `--ubm-color-primary` / `--ubm-color-on-primary` / `--ubm-color-border` / `--ubm-color-surface-2` を既存 utility へ統合
- 副次対象 `not-found.tsx` / `loading.tsx` を同 wave で移行
- task-18 `verify-design-tokens` CI gate と downstream visual baseline を regression gate として維持

### Test plan

- [ ] `pnpm --filter @ubm-hyogo/web typecheck` completed
- [ ] `pnpm --filter @ubm-hyogo/web lint` completed
- [ ] `pnpm --filter @ubm-hyogo/web verify-design-tokens` completed
- [ ] `pnpm --filter @ubm-hyogo/web test -- apps/web/app/__tests__/error.component.spec.tsx` completed
- [ ] `rg -n 'text-\[var\(|bg-\[var\(|border-\[var\(|fg-muted|ubm-color-(primary|on-primary|border|surface-2)' apps/web/app/error.tsx apps/web/app/not-found.tsx apps/web/app/loading.tsx` 0 件
- [ ] task-18 playwright-smoke / visual baseline remains downstream runtime gate

### 含めるファイル

- `apps/web/app/error.tsx`
- `apps/web/app/not-found.tsx`
- `apps/web/app/loading.tsx`
- `apps/web/app/__tests__/error.component.spec.tsx`
- `docs/30-workflows/task-26-.../**`（spec 一式）

### スクリーンショット

Phase 11 screenshot: `outputs/phase-11/screenshots/not-found-desktop.png`。task-18 visual baseline は downstream broad runtime gate。

## 実行コマンド（承認後）

```bash
# 自律フロー (CLAUDE.md「PR作成の完全自律フロー」準拠)
git fetch origin dev
git checkout -b feat/task-26-error-tsx-token-migration  # ブランチ未作成時のみ
git merge origin/dev
# 実装作業
git add -A
git commit -m "feat(apps/web): migrate error.tsx to @theme inline utility (task-26)"
gh pr create --base dev --title "..." --body "..."
```
