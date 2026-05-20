# Phase 13: PR 作成 / 承認ゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| 区分 | リリースゲート |
| base ブランチ | `dev`（CLAUDE.md 既定） |
| 想定所要 | 0.1 人日 |

## 目的

Phase 5 実装と Phase 11 evidence、Phase 12 ドキュメントを揃えた上で、ユーザー明示承認後に PR を作成する。**本 Phase は AI が独断で実行しない。**

## 事前チェック（PR push 前）

```bash
# 1. 全変更のステージング
git status --porcelain
git add -A

# 2. typecheck / lint / test / build
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test --run
mise exec -- pnpm --filter @ubm-hyogo/web build

# 3. Phase 12 compliance pre-flight
bash scripts/verify-pr-ready.sh

# 4. dev 取り込み
git fetch origin dev
git merge origin/dev   # コンフリクトが出たら pnpm sync:resolve

# 5. push
git push origin <branch>
```

## 承認ゲート（ユーザー明示承認）

PR 作成前に **必ずユーザーに承認を求める**。承認なしで `gh pr create` を実行しない（CLAUDE.md）。

承認依頼時に提示する情報:

| 項目 | 内容 |
| --- | --- |
| 変更ファイル数 | `git diff dev...HEAD --name-only` の件数 |
| 変更要約 | `StatusDistribution.tsx` に SVG bar chart 追加 / spec / test |
| Phase 11 evidence | `outputs/phase-11/evidence/` の status |
| Phase 12 compliance | `verify-pr-ready.sh` の exit code |
| visual snapshot 差分 | あり / なし |
| 未タスク | 0 件（API `byStatus` producer は同一サイクル内で実装済み） |

## PR 本文テンプレート

```markdown
## Summary
- admin dashboard の `StatusDistribution` に SVG bar chart 描画ロジックを追加
- `slices` が `undefined / empty` のときは既存 placeholder を維持（後方互換）
- 依存追加なし（SVG 直書き）、OKLch token 経由（HEX 直書き 0 件）
- ワークフロー: `docs/30-workflows/step-05-dashboard-chart-implementation/`

## Scope
- `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx` (編集)
- `apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx` (新規)
- `apps/api/src/routes/admin/dashboard.ts` / `apps/api/src/repository/dashboard.ts` (編集)
- `packages/shared/src/zod/viewmodel.ts` / `packages/shared/src/types/viewmodel/index.ts` (編集)
- `docs/30-workflows/step-05-dashboard-chart-implementation/**` (新規)
- visual snapshot (更新あれば)

## Out of scope
- authenticated runtime screenshot capture and PR publication remain user-gated.

## Test plan
- [ ] `mise exec -- pnpm typecheck` green
- [ ] `mise exec -- pnpm lint` green
- [ ] `mise exec -- pnpm test apps/web --run -- StatusDistribution.spec.tsx` green (7 tests / TC-CHART-01〜14 coverage)
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web build` green
- [ ] `bash scripts/verify-pr-ready.sh` exit 0
- [ ] `playwright-smoke / visual` snapshot 想定通り
- [ ] admin dashboard 手動目視: placeholder / chart 双方 OK

## Screenshots
（Phase 11 evidence の `outputs/phase-11/screenshots/admin-dashboard-{placeholder,chart}.png` を参照）

## Refs
- Source spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-05-dashboard-chart/spec.md`
```

## PR 作成コマンド（承認後）

```bash
gh pr create --base dev --title "feat: StatusDistribution に SVG bar chart 描画ロジック追加 (step-05-dashboard-chart)" --body "$(cat <<'EOF'
... (上記テンプレートを HEREDOC で渡す)
EOF
)"
```

## post-merge 後

| 作業 | 内容 |
| --- | --- |
| ワークフロー archive | `docs/30-workflows/step-05-dashboard-chart-implementation/` を `docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/` に移動（`completed-tasks-policy.md` に従う） |
| metadata 据え置き | `artifacts.json` の `workflow_state` は据え置き |
| `Refs #XXX` | PR が close した issue があれば本ファイルに追記 |

## 実行タスク

- Phase 13: commit / push / PR をユーザー承認ゲートで止める。

## 参照資料

- - `phase-12.md`
- - `artifacts.json`
- - `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 成果物

- - PR body draft と approval checklist を成果物にする。

## 統合テスト連携

- - PR checks はユーザー承認後の runtime gate に接続する。

## 完了条件

- [ ] ユーザーが PR 作成を明示承認した
- [ ] PR が `dev` を base に作成された
- [ ] 全 required status check が green
- [ ] PR 本文に Phase 11 evidence / 未タスク 0 件 / Out of scope が明記されている

## 依存Phase trace

- Phase 1 / phase-01.md
- Phase 2 / phase-02.md
- Phase 5 / phase-05.md
- Phase 6 / phase-06.md
- Phase 7 / phase-07.md
- Phase 8 / phase-08.md
- Phase 9 / phase-09.md
- Phase 10 / phase-10.md
- Phase 11 / phase-11.md
- Phase 12 / phase-12.md
