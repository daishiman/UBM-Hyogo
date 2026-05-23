# Phase 13: PR 作成

> 本 Phase はユーザー明示承認後にのみ実行する (commit / push / PR 作成は user-gated)。

## 13.1 PR base ブランチ

- **base: `dev`**（CLAUDE.md 既定 / project memory 準拠）
- main への PR は production リリース時のみ

## 13.2 ブランチ・コミット

```bash
git status   # 想定 modified ファイル一覧を確認
git add \
  docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/ \
  docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/main.md \
  docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/screenshots/admin-dashboard-placeholder.png \
  docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/screenshots/admin-dashboard-chart.png \
  docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-12/main.md \
  docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-12/unassigned-task-detection.md \
  docs/30-workflows/unassigned-task/step-05-followup-001-admin-dashboard-runtime-screenshot-capture.md
```

commit message (HEREDOC):

```
docs(issue-819): admin dashboard runtime screenshot capture — replace dummy 16x16 PNG with authenticated runtime evidence

- Replace admin-dashboard-{placeholder,chart}.png (16x16 dummy 445B) with authenticated runtime PNG
- Update parent workflow outputs/phase-11/main.md (runtime_pending → runtime_completed)
- Update parent workflow outputs/phase-12/main.md §6 (consume authenticated runtime screenshot item)
- Update parent workflow outputs/phase-12/unassigned-task-detection.md (consumed by issue-819)
- Move unassigned-task/step-05-followup-001-* to consumed state
- No code change in apps/web or apps/api (temporary fixture injection reverted)

Consumed-followup: docs/30-workflows/unassigned-task/step-05-followup-001-admin-dashboard-runtime-screenshot-capture.md
Refs: #819 (closed — body work remained outstanding)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

## 13.3 push & PR

```bash
git push -u origin feat/issue-819-admin-dashboard-runtime-screenshot
gh pr create --base dev --title "docs(issue-819): admin dashboard runtime screenshot capture" --body "$(cat <<'EOF'
## Summary

- step-05-dashboard-chart-implementation で残課題だった authenticated runtime screenshot を取得
- dummy 16x16 PNG (445B) を本物の admin/dashboard PNG (placeholder / populated chart 各 1 枚) に置換
- 親 workflow Phase 11 / Phase 12 main.md と unassigned-task-detection.md を `runtime_completed` / `consumed` に更新
- `apps/web` / `apps/api` のコードは変更ゼロ（一時 fixture 注入はすべて revert 済み）

## Source issue

Refs [#819](https://github.com/daishiman/UBM-Hyogo/issues/819) — closed 済みだが evidence completion が未実施だったため、closed のまま本 PR で消し込み

## Acceptance Criteria

- [ ] AC-1 placeholder PNG 視覚確認
- [ ] AC-2 chart PNG 視覚確認（bar 3 本）
- [ ] AC-3 PNG size / dimension 制約
- [ ] AC-4 working tree clean (apps/web, apps/api)
- [ ] AC-5 親 Phase 11 / 12 main.md 更新
- [ ] AC-6 unassigned-task-detection.md consumed 行追記
- [ ] AC-7 unassigned-task spec consumed 化
- [ ] AC-8 typecheck / lint / vitest / build / grep-gate 全 pass

## Screenshots

- `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11/screenshots/admin-dashboard-placeholder.png`
- `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11/screenshots/admin-dashboard-chart.png`

## Test plan

- [ ] mise exec -- pnpm --filter @ubm-hyogo/web typecheck
- [ ] mise exec -- pnpm --filter @ubm-hyogo/web lint
- [ ] mise exec -- pnpm --filter @ubm-hyogo/web test -- src/features/admin/components/_dashboard/StatusDistribution.spec.tsx
- [ ] mise exec -- pnpm --filter @ubm-hyogo/web build
- [ ] grep -nE 'fill="#|bg-\[#|text-\[#' apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx → 0 hit
- [ ] git status apps/web/ apps/api/ → clean

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## 13.4 PR 作成後

- PR URL をユーザーに報告
- 親 closed issue #819 へ「PR #XXX で followup を完了」コメント追記の判断はユーザーに委ねる（closed issue へのコメントが運用上必要か判断）

## 13.5 ロールバック手順

PR review で reject された場合:
- `git revert <commit-sha>` で巻き戻し
- evidence PNG 差し替えのみで対応可能なら追加コミットで補正

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

ユーザー承認後に commit / push / PR を作成する手順を固定する。

## 実行タスク

- Phase 11 evidence が揃った後に staging 対象を確認する。
- closed Issue は `Refs #819` のみを使う。
- ユーザー承認後に push と PR 作成を行う。

## 参照資料

- `phase-11-manual-test.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- GitHub Issue #819

## 成果物

- commit message draft
- PR body draft
- rollback procedure

## 完了条件

ユーザー承認なしに commit / push / PR を実行しないことが明記されている。

- [ ] ユーザー承認なしに commit / push / PR を実行しないことが明記されている
