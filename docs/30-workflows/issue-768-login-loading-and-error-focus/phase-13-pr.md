# Phase 13: PR 作成

## 1. ブランチ命名

`feat/issue-768-login-loading-and-error-focus`

## 2. commit 単位

| commit | 内容 |
|---|---|
| `feat(login): add loading.tsx skeleton with a11y attributes (#768)` | Step 1 |
| `feat(login): error boundary focus management + aria-live=assertive + digest (#768)` | Step 2 |
| `test(login): loading.spec + error.spec coverage (#768)` | Step 3-4 |
| `chore(styles): add bg-surface-2 utility via OKLch token (#768)` | Step 5（必要時のみ） |
| `docs(integration-fixes): mark i05 implemented + parallel-07 DoD消し込み` | Phase 12 doc 更新 |

## 3. PR 本文テンプレート

```markdown
## Summary

- `/login` route に loading boundary を新規作成（OKLch skeleton + role=status / aria-busy / aria-live=polite）
- `/login` error boundary に h1 自動 focus（useRef + tabIndex=-1 + useEffect）と aria-live=assertive、digest 条件 render、Card layout を追加
- parallel-07 DoD line 141, 142 を消し込み、integration-fixes index の i05 を `implemented` に更新

Closes #768
Resolves: parallel-07 DoD line 141, 142

## Test plan

- [x] `pnpm --filter @ubm/web test -- app/login/loading.spec.tsx app/login/error.spec.tsx` 全 PASS
- [x] `pnpm typecheck` PASS
- [x] `pnpm lint` PASS
- [x] `pnpm --filter @ubm/web build` PASS
- [x] localhost 上で navigation skeleton と error focus を VoiceOver / Tab で目視確認
- [x] HEX 直書きなし（`grep -nE "bg-\[#" apps/web/app/login` → 0 件）

## a11y

- WCAG 2.1 SC 1.3.1 / 4.1.3 / 2.4.3 を満たす
- error 発生時、screen reader が h1 を assertive アナウンス
- keyboard user が Tab 1 回で reset CTA に到達

## 横展開（本 PR scope 外）

- root `apps/web/app/error.tsx` の focus 管理 → 別 issue (i06)
- `/profile/loading.tsx` skeleton → 別 issue (i07)
- 共通 hook `useAutoFocusOnMount` 抽出 → i05/i06 完了後の refactor PR
```

## 4. PR base

- base: `dev`
- head: `feat/issue-768-login-loading-and-error-focus`

## 5. 自動 PR 作成コマンド

```bash
git checkout -b feat/issue-768-login-loading-and-error-focus
# ... commit 群を作成 ...
git push -u origin feat/issue-768-login-loading-and-error-focus
gh pr create --base dev --title "feat(login): loading boundary + error focus management (#768)" --body "$(cat <<'EOF'
... 上記テンプレ ...
EOF
)"
```

## 6. PR 後ハウスキーピング

- Issue #768 が CLOSED のままなので、本 PR merge 後はコメントで「resolved by PR #<n>」を残す（reopen は不要）
- parallel-07 spec の DoD checklist を更新
