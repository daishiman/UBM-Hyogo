# Phase 13 — PR 作成

## 前提

- **user の明示承認後のみ実施**（CLAUDE.md / task-specification-creator skill 共通方針）
- 本 workflow 自体はコード実装を含まないため、PR は「実装サイクル（03.実装.md 等）」完了後に作成する

## PR メタ情報（user 承認時に使用）

| 項目        | 値                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------- |
| base ブランチ | `dev`                                                                                           |
| ブランチ名候補 | `feat/login-redirect-when-authenticated`                                                       |
| タイトル候補 | `feat(login): logged-in redirect to /profile with safeNext whitelist`                          |

## PR 本文テンプレート

```markdown
## Summary
- ログイン済みユーザーが `/login` に到達した場合、即座に `/profile`（または safe な `next`）へリダイレクト
- `safeNext()` 純関数を新規追加し、open-redirect 攻撃面（`//`, `:`, `\`, 長さ）を遮断
- 既存 LoginCard 描画は未ログイン経路で完全維持（regression なし）

## Test plan
- [x] `mise exec -- pnpm exec vitest run apps/web/src/lib/url/__tests__/safe-next.spec.ts apps/web/app/login/__tests__/page.spec.tsx` PASS
- [x] `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` green
- [x] `mise exec -- pnpm lint` green
- [ ] staging で `/login` ログイン済みアクセス → `/profile` redirect 確認（user-gated）

## 関連
- 親 workflow: `docs/30-workflows/public-header-logged-in-nav-cleanup/`
- 詳細仕様: `docs/30-workflows/completed-tasks/login-redirect-when-authenticated/`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 事前チェック（user 承認前）

- [ ] `git status --porcelain` clean
- [ ] `git diff dev...HEAD --name-only` で PR 範囲確認
- [ ] `bash scripts/verify-pr-ready.sh` PASS
- [ ] outputs/phase-12 6 成果物 完備
- [x] unassigned 候補 0 件（旧 2 件は同サイクルで解消）

## 実行コマンド（user 承認後のみ）

```bash
gh pr create --base dev --title "..." --body "$(cat <<'EOF'
...
EOF
)"
```
