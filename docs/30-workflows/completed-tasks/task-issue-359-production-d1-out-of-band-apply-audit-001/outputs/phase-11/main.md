# Phase 11 main

- 実行日時: 2026-05-04 (UTC)
- 実行者: Claude Code (user 指示「タスク仕様書に基づくフェーズ1〜12の実装」)
- 監査ソース: 5 種（git log / docs grep / GitHub PR list / GitHub Actions run list + run-view / 親 workflow Phase 13 evidence）
- 候補件数: 4（C1〜C4 / うち confirmed=2、excluded=2）
- 判定: confirmed
- 親 workflow への影響: cross-reference 追加（Phase 12 で実施）

## 成果物

- d1-migrations-ledger.md: PASS（親 Phase 13 evidence と timestamp 完全一致）
- operation-candidate-inventory.md: 候補件数=4（C1, C2: confirmed / C3, C4: excluded）
- attribution-decision.md: `decision: confirmed (workflow=backend-ci/deploy-production/Apply D1 migrations, approval=PR #364 merge run id 25207878876 / PR #365 merge run id 25211958572)`
- single-record.md: PASS（timestamp / target / command / approver / classification を 1 record に固定）
- redaction-checklist.md: PASS（0 件）
- read-only-checklist.md: PASS（mutation 0 件、read-only 経路のみ）

## 判定要約

両 migration の apply は `.github/workflows/backend-ci.yml` `deploy-production` job が main push 契機で実行した `wrangler d1 migrations apply ubm-hyogo-db-prod --env production --remote` により記録された。

| migration | trigger | apply step | run id | merge commit |
| --- | --- | --- | --- | --- |
| `0008_schema_alias_hardening.sql` (`2026-05-01 08:21:04`) | PR #364 merge → push main `2026-05-01T08:20:38Z` | `deploy-production` step 6 success | `25207878876` | `9841e06a` |
| `0008_create_schema_aliases.sql` (`2026-05-01 10:59:35`) | PR #365 merge → push main `2026-05-01T10:59:07Z` | `deploy-production` step 6 success | `25211958572` | `2ced613d` |

両 run の `Deploy Workers app` step は failure（apply は完了済み）であり、これが backend-ci 全体の conclusion=failure として残ったため「out-of-band 風」に見えていただけで、実際は workflow 内・PR 承認・production environment gate を通過した正規 apply である。

## 次アクション

- Phase 12 で `cross-reference-plan.md` を作成し、親 workflow `task-issue-191-production-d1-schema-aliases-apply-001` Phase 13 evidence (`main.md` / `verification-report.md`) へ「先行 apply の出所＝backend-ci deploy-production / run id 25207878876・25211958572 / PR #364・#365 merge」を追記する。
- 親 workflow 既存記述の改変は禁止。追記のみで cross-reference を確立する（invariants 準拠）。
- ラベル `unattributed` は不要（confirmed のため `recurrence-prevention-formalization.md` は本タスクの成果物対象外）。
