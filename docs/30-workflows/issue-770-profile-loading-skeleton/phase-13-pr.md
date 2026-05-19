# Phase 13: PR 作成

## 1. ブランチ

```
feat/issue-770-profile-loading-skeleton
```

`dev` 起点で作成すること（CLAUDE.md / 既定 base = `dev`）。`main` への PR は本タスクでは作成しない。

## 2. ベース

```
dev
```

## 3. PR タイトル

```
feat(issue-770): /profile/loading.tsx OKLch skeleton 適用
```

## 4. PR 本文テンプレート

```markdown
## Summary

- `apps/web/app/profile/loading.tsx` を simple text placeholder から OKLch skeleton (avatar + heading + 4 KV bars) に置換
- `role="status"` / `aria-busy` / `aria-live="polite"` / `.sr-only` の a11y 3 点セットを適用
- `bg-surface-2` + `motion-safe:animate-pulse` で OKLch token / reduced-motion 整合
- `apps/web/app/profile/loading.spec.tsx` を新規追加（3 tests）
- parallel-07 spec §4.5 取り残しを消し込み

Closes #770

## 仕様書

- `docs/30-workflows/issue-770-profile-loading-skeleton/index.md`
- Parent: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i07-profile-loading-skeleton/spec.md`

## Test plan

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm --filter @ubm-hyogo/web test -- app/profile/loading.spec.tsx`（3 tests PASS）
- [ ] localhost `/profile` Slow 3G で skeleton 表示 → 本体差し替えを確認
- [ ] DevTools Accessibility パネルで role=status / aria-busy=true / aria-live=polite 確認
- [ ] `prefers-reduced-motion: reduce` で pulse 停止確認
- [ ] HEX 直書き grep ヒット 0 件

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 5. User Approval Gate

この Phase は自動実行禁止。`git commit`、`git push`、`gh pr create` はユーザーの明示承認後のみ実行する。AI は承認前に read-only evidence と PR 本文 draft までを扱う。

## 6. 作成コマンド（承認後のみ）

```bash
git switch -c feat/issue-770-profile-loading-skeleton
git add apps/web/app/profile/loading.tsx apps/web/app/profile/loading.spec.tsx \
        docs/30-workflows/issue-770-profile-loading-skeleton \
        docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i07-profile-loading-skeleton/spec.md
git commit -m "$(cat <<'EOF'
feat(issue-770): /profile/loading.tsx OKLch skeleton 適用

- avatar + heading + 4 KV bars skeleton への置換
- role=status / aria-busy / aria-live=polite / .sr-only a11y 整備
- bg-surface-2 + motion-safe:animate-pulse で OKLch + reduced-motion 整合
- loading.spec.tsx 新規追加 (3 tests)
- parallel-07 spec §4.5 消し込み

Closes #770

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push -u origin feat/issue-770-profile-loading-skeleton
gh pr create --base dev --title "feat(issue-770): /profile/loading.tsx OKLch skeleton 適用" --body-file <PR本文ファイル>
```

## 7. レビュー方針

solo 開発のため必須レビュアー 0。CI required status check (`verify-design-tokens`, `verify-test-suffix`, `playwright-smoke / smoke`, `playwright-smoke / visual`, typecheck/lint) の PASS のみで merge 可。

## 8. merge 後

- issue #770 自動 close（`Closes #770` 記述による）
- `docs/30-workflows/unassigned-task/integration-fixes-i07-profile-loading-skeleton.md` は consumed trace として保持
- parallel-07 DoD 表で §4.5 を `done` に更新
- 関連 PR (#768, root error focus) との visual 確認は別 PR で集約
