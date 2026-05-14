# Phase 13 — PR 作成（user 明示承認後のみ）

## ⚠️ 実行条件

**user の明示的な許可を得るまで実施しない。** 自動 commit / push / `gh pr create` は行わない。

## PR 草案

### Title

`feat(apps/web): migrate error.tsx to @theme inline utility (task-26)`

### Base

`dev`

### Summary

- `apps/web/src/app/error.tsx` の Tailwind arbitrary value 直書きを task-09 `@theme inline` utility に置換
- 未定義 token `--ubm-color-fg-muted` の命名齟齬を `text-text-3` に統合して解消
- 副次対象（`global-error.tsx` / `not-found.tsx` / `loading.tsx`）に同パターンが存在する場合は同 wave で移行
- task-18 `verify-design-tokens` CI gate / `playwright-smoke / visual` baseline diff 0 で regression なしを確認

### Test plan

- [ ] `pnpm --filter @ubm-hyogo/web typecheck` PASS
- [ ] `pnpm --filter @ubm-hyogo/web lint` PASS
- [ ] `pnpm --filter @ubm-hyogo/web build` PASS
- [ ] `grep -nE 'text-\[var\(|bg-\[var\(' apps/web/src/app/error.tsx` 0 件
- [ ] `grep -n 'ubm-color-fg-muted' apps/web/src/app/error.tsx` 0 件
- [ ] task-18 verify-design-tokens CI green
- [ ] task-18 playwright-smoke / visual baseline diff 0

### 含めるファイル

- `apps/web/src/app/error.tsx`
- 該当時: `apps/web/src/app/global-error.tsx` / `not-found.tsx` / `loading.tsx`
- `docs/30-workflows/task-26-.../**`（spec 一式）

### スクリーンショット

UI/UX 変更なし（pure className migration）のため新規スクリーンショット添付なし。task-18 visual baseline 比較で代替。

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
