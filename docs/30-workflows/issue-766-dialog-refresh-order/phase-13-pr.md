# Phase 13: PR 作成

## 1. PR 基本情報

| 項目 | 値 |
|------|-----|
| base | `dev` |
| head | `feat/issue-766-dialog-refresh-order` (実装サイクル時に作業ブランチを統一) |
| title | `fix(profile): dialog 内で router.refresh → onSubmitted → onClose の順序を固定 (#766)` |

## 2. PR 本文テンプレート

```markdown
## Summary
- profile マイページの公開停止/再公開/退会 dialog で `router.refresh() → onSubmitted → onClose` の順序を dialog 内で固定
- `RequestActionPanel.onSubmitted` から `router.refresh()` を撤去し、parent 由来の二重発火を解消
- 該当 component spec に副作用呼び出し順序の assertion を追加

closes #766

## Why
issue #766 / spec `parallel-i03-dialog-refresh-order` が指摘する以下のバグ:
- dialog unmount 後に parent から `router.refresh()` が走り、stale UI が一瞬見える
- 「unmounted component から navigation API 呼び出し」warning が出る可能性

を、副作用順序を spec 通りに固定することで根本解消する。

## Changes
| File | Change |
|------|--------|
| `apps/web/app/profile/_components/VisibilityRequestDialog.tsx` | `useRouter` 追加 / 成功 path で refresh を最先発火 |
| `apps/web/app/profile/_components/DeleteRequestDialog.tsx` | 同上 |
| `apps/web/app/profile/_components/RequestActionPanel.tsx` | `onSubmitted` から refresh 撤去 / 未使用 import 削除 |
| `apps/web/app/profile/_components/VisibilityRequestDialog.component.spec.tsx` | 順序 assertion (TC-D1/D3/D5) |
| `apps/web/app/profile/_components/DeleteRequestDialog.component.spec.tsx` | 順序 assertion (TC-D2/D4/D5) |
| `apps/web/app/profile/_components/RequestActionPanel.component.spec.tsx` | parent 由来 refresh 非発火 (TC-P1) |

## Test plan
- [ ] `mise exec -- pnpm typecheck`
- [ ] `mise exec -- pnpm lint`
- [ ] `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/_components`
- [ ] dev 環境で /profile から公開停止/再公開/退会申請 → banner 即時更新、console warning なしを目視

## Notes
- mutation hook によるカプセル化は将来 followup として保留
- error / catch path の挙動は変更なし
```

## 3. PR 作成コマンド

```bash
gh pr create --base dev --title "fix(profile): dialog 内で router.refresh → onSubmitted → onClose の順序を固定 (#766)" --body "$(cat <<'EOF'
... 上記テンプレートを HEREDOC で挿入 ...
EOF
)"
```

## 4. レビュー / マージ

solo 運用ポリシーに従い `required_pull_request_reviews=null`。CI gate (typecheck / lint / vitest / verify-design-tokens 等) が全 green になったら squash merge。

## 5. DoD

- [ ] PR が `dev` 宛で作成済み
- [ ] CI 全 green
- [ ] closes #766 (issue 自体は既に closed のため reopen 不要。PR で完了を記録)
- [ ] PR description が上記テンプレートを反映
- [ ] (production リリース時) `dev → main` の PR を別途作成
