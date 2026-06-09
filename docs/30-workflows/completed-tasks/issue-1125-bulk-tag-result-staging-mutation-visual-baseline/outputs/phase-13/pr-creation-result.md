# Phase 13 — PR Creation Result

Status: `pending_user_approval`

## 1. 現状

本 wave はタスク仕様書（Phase 1-13）と Phase 12 strict-7 出力を作成し、新規 Playwright spec / seed・cleanup SQL / capture runner shell / runner shell test / smoke:test wiring を実コードとして追加した。commit / push / PR、認証付き staging への seed → mutation → baseline 生成 → cleanup は未実行で、user 承認後に行う。

## 2. PR 方針（CLAUDE.md PR フロー準拠）

| 項目 | 値 |
| --- | --- |
| base ブランチ | `dev`（既定。`main` への PR は production リリース時のみ） |
| 想定タイトル | `feat(issue-1125): bulk tag 結果サマリ 2 状態の認証付き staging mutation visual baseline 取得基盤` |
| commit 対象 | 本 workflow root（spec / outputs）+ 新規 Playwright spec + seed/cleanup SQL + capture runner shell（+ Phase 6 runner shell test）+ aiworkflow-requirements 同期（実装後） |
| PR 本文 | `outputs/phase-12/implementation-guide.md` の内容を反映。視覚証跡は baseline 取得後に画像参照を追加 |
| GitHub issue | #1125 は **CLOSED 維持**・reopen しない（recovered_from_unassigned / refs_only） |

## 3. PR 本文骨子

- 概要: 認証付き staging `/admin/members` で実 `POST /admin/members/tags/bulk` mutation を経た BulkActionBar result summary の all-success / partial-failure 2 状態を visual baseline 化する基盤を追加。
- 追加ファイル: `admin-members-bulk-tag-result-authenticated.spec.ts` / `bulk-tag-result-staging-{seed,cleanup}.sql` / `capture-bulk-tag-result.sh`（+ `__tests__/capture-bulk-tag-result.test.sh`）。
- 設計: 副作用所有権を runner に集約（guard → seed → capture → trap cleanup → 残存 0 検証）。synthetic prefix `e2e_test_issue1125_` 限定。seed/cleanup SQL は D1 remote 制約により `BEGIN/COMMIT` 不使用。
- partial-failure 主シナリオ: 退会済み member（`is_deleted=1`）による `skipped`。`notFound` 視覚網羅は親 local fixture + `BulkActionBar.spec.tsx` TC-BAB-TAG-03 が継続担保（scope-out 理由は unassigned-task-detection.md 参照）。
- 不変条件: apps/api・apps/web 本番ソース・D1 schema・Google Form は不変（AC-8）。
- 視覚証跡: `bulk-tag-result-all-success.png` / `bulk-tag-result-partial-failure.png`（baseline 取得後に画像参照を追加）。

## 4. 含まれるファイル一覧（想定）

| 区分 | パス |
| --- | --- |
| workflow spec | `docs/30-workflows/completed-tasks/issue-1125-bulk-tag-result-staging-mutation-visual-baseline/index.md` + `phase-1..5-*.md` ほか Phase 6-10 |
| Phase 11 ledger | `.../outputs/phase-11/manual-test-result.md`（+ baseline 取得後 screenshots） |
| Phase 12 strict-7 | `.../outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| Phase 13 | `.../outputs/phase-13/pr-creation-result.md` |
| artifacts | `.../artifacts.json` + `.../outputs/artifacts.json` |
| 新規実装（本 wave で追加済み） | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-result-authenticated.spec.ts` / `apps/api/migrations/seed/bulk-tag-result-staging-{seed,cleanup}.sql` / `scripts/smoke/capture-bulk-tag-result.sh` / `scripts/smoke/__tests__/capture-bulk-tag-result.test.sh` |
| skill 同期（実装後） | `.claude/skills/aiworkflow-requirements/**`（artifact inventory / changelog / ledger / indexes 再生成） |
| consumed unassigned-task | `docs/30-workflows/unassigned-task/task-issue-1036-followup-001-staging-authenticated-bulk-tag-visual-baseline.md`（consumed pointer 追記） |

## 5. user 承認後の実行順序

1. `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / 回帰 `BulkActionBar.spec.tsx` / runner shell test（実 D1 非依存）を green に。
2. 認証付き staging で `bash scripts/smoke/capture-bulk-tag-result.sh staging`（seed → 実 mutation → `--update-snapshots` baseline 生成 → trap cleanup → 残存 0 検証）。evidence copy を `outputs/phase-11/screenshots/` へ。
3. `bash scripts/verify-pr-ready.sh` を実行。
4. `git fetch origin dev` → ローカル dev を ff 同期 → 作業ブランチへ merge → conflict があれば既定方針で解消。
5. `git add -A` → commit（末尾に Co-Authored-By 行）。
6. `gh pr create --base dev`。PR 本文に implementation-guide の主要見出しと、取得済み baseline screenshot 参照を含める。

## 6. runtime / 副作用境界

- 認証付き staging への baseline 取得は実 mutation を伴うが、対象は `e2e_test_issue1125_` synthetic prefix のみ。`trap ... EXIT` cleanup で 6 table の残存 0 を検証してから exit する（恒久副作用ゼロ）。
- production 環境では一切実行しない（`assert_staging_guard`）。
- apps 本番ソース / D1 schema / Google Form への変更ゼロ。
- commit / push / PR / staging deploy / baseline 生成は user-gated。実コード追加は本 wave で完了済み。

## 7. 残課題

- `notFound`（未登録 tag）の staging runtime 視覚網羅は本タスク scope-out（代替担保済み）。`unassigned-task-detection.md` の baseline B-1 参照。
- aiworkflow-requirements への skill 反映（artifact inventory / changelog / active ledger / quick-reference / resource-map / LOGS / indexes 再生成）は実装着地後に別途実施。
