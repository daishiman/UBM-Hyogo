# Phase 13 — PR Creation Result（user-gated 境界）

## 1. 状態

- workflow_state: `implemented_local_evidence_captured`
- 本 Phase 13 は **user-gated**。ローカル実装・検証完了時点では commit / push / PR を実行しない。

## 2. 実装完了後の PR 作成手順

```bash
# 1. ブランチ
git switch -c feat/member-header-admin-link

# 2. 変更コミット（差分は Phase 5 §1 の実装ファイル + 本 workflow docs + aiworkflow sync）
git add apps/web/src/components/layout/MemberHeader.tsx \
        apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx \
        apps/web/app/\(member\)/layout.tsx \
        apps/web/src/lib/auth-view/ \
        docs/30-workflows/completed-tasks/member-header-admin-link/ \
        docs/00-getting-started-manual/specs/02-auth.md \
        .claude/skills/aiworkflow-requirements/

# 3. 品質検証
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh

# 4. PR
gh pr create --base dev --title "feat(member-header): admin リンクと session 配線" --body "$(cat outputs/phase-12/implementation-guide.md)"
```

## 3. PR 本文要件

- `## Summary`: 「`auth-view` 最小基盤を追加し、`MemberHeader` に `authView` prop と admin 分岐リンクを追加。`(member)/layout.tsx` を async 化して `getAuthView()` から配信。」
- `## Test plan`: Phase 9 §1 の gate #1〜#7
- `outputs/phase-11/screenshots/` に PNG がある場合は本文に参照を追加。なければ screenshot セクションを作らない。

## 4. user-gated 項目

| 項目 | 承認者 |
|------|--------|
| commit 実行 | user |
| push 実行 | user |
| PR 作成 | user |
| staging deploy | user |
| staging visual smoke | user |

## 5. ロールバック

問題発生時は `git revert <commit>` で 3 ファイル分の差分を戻すのみ。
