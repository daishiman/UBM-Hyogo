# Phase 13: PR 作成（ユーザー承認後のみ実行）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 状態 | **blocked_pending_user_approval** |
| 入力 | Phase 11 / 12 完了 |
| 出力 | PR URL（ユーザー承認後） |

## 厳守事項

- **Issue #749 は CLOSED のまま、再 open 禁止**
- PR 本文には `Refs #749`（fixes / closes は使わない）
- base branch: `dev`（CLAUDE.md PR 作成フロー §「既定ブランチは dev」）
- commit / push / PR 作成は **ユーザー明示承認後のみ**

## 手順（承認後）

1. `git fetch origin dev` → ローカル `dev` を fast-forward
2. `feat/issue-749-primitive-adoption-tracker` に `dev` を merge（コンフリクトは CLAUDE.md の方針に従い解消）
3. `mise exec -- pnpm install --force` / `pnpm typecheck` / `pnpm lint`
4. `bash scripts/verify-primitive-adoption.sh` exit 0 を確認
5. `git status --porcelain` 空を確認
6. PR 本文を `outputs/phase-12/implementation-guide.md` + `outputs/adoption-tracker.md` から組み立て
7. `gh pr create --base dev --title "feat(issue-749): primitive adoption tracker (19 routes x 6 primitive)" --body "$(...)"`

## PR 本文骨子

```md
## Summary

parallel-09 で配置した 5 primitive + useAdminMutation hook の 19 routes × 6 primitive 採用を機械検証可能にした umbrella tracking task。

- `<input>` 直接利用 15 箇所を `FormField` 経由に統一
- 4 mutating admin panel の mutation を `useAdminMutation().trigger()` 経由に統一（read-only `AuditLogPanel` は C2 対象外）
- admin 8 route に `Breadcrumb` 配置、required zero-result UI に `EmptyState`、admin members / requests / audit に `Pagination`
- `scripts/verify-primitive-adoption.sh` + focused Vitest で C1-C6 gate 化
- `docs/30-workflows/completed-tasks/issue-749-primitive-adoption-tracker/outputs/adoption-tracker.md` で 19×6 matrix の `X` セル 0 を可視化

Refs #749

## Test plan

- [ ] mise exec -- pnpm --filter @ubm-hyogo/web typecheck
- [ ] pnpm exec vitest run --config vitest.config.ts <focused admin primitive specs>
- [ ] bash scripts/verify-primitive-adoption.sh
- [ ] authenticated admin visual screenshot（user-gated）
```

## 完了条件

- [ ] ユーザー承認を受領
- [ ] PR が `dev` を base に作成された
- [ ] `verify-primitive-adoption / verify` CI が green
- [ ] PR 本文に `Refs #749` のみ記載（fixes / closes なし）
- [ ] Issue #749 が CLOSED のまま

## 関連ドキュメント

- `outputs/phase-12/implementation-guide.md`
- `outputs/adoption-tracker.md`
- `artifacts.json`
