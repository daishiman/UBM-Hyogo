# task-issue-359-production-d1-out-of-band-apply-audit-001

[実装区分: ドキュメントのみ仕様書]

> 判定根拠: 本タスクは production D1 `ubm-hyogo-db-prod` の `0008_schema_alias_hardening.sql` / `0008_create_schema_aliases.sql` 先行 apply (`2026-05-01`) に対する **read-only 監査**である。
> Issue #434 の「制約」セクションに「read-only 監査。production D1 への write / 追加 apply / rollback / deploy は含まない」と明記されており、`unassigned-task/task-issue-359-production-d1-out-of-band-apply-audit-001.md` の Scope Out でも `production D1 への追加 migration apply、rollback、code deploy、fallback retirement、direct update guard 実装` が除外されている。
> 成果物は (a) 出所監査記録、(b) `task-issue-191-production-d1-schema-aliases-apply-001` Phase 13 evidence への cross-reference、(c) unattributed 判定時の再発防止策の runbook / lessons への formalize の 3 点のみで、すべてドキュメント変更で完結する。
> 監査結論が `unattributed` の場合のみ、approval gate 強化（hook / script 追加）の実装タスクを Phase 12 の未タスクレポートで formalize する。仕様作成時点で先に follow-up を起票しない理由は、実装内容が Phase 11 の出所判定に依存し、現時点で作ると「証跡なし」という結論を先取りするためである。

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | Wave 13 |
| mode | serial |
| owner | - |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| runtime evidence | captured / confirmed |
| Phase 12 decision | cross-reference applied |
| issue | https://github.com/daishiman/UBM-Hyogo/issues/434 (CLOSED, keep as-is — spec written as if CLOSED per user instruction) |
| task_id | TASK-ISSUE-359-PRODUCTION-D1-OUT-OF-BAND-APPLY-AUDIT-001 |
| parent issue | #359 |

## purpose

production D1 `ubm-hyogo-db-prod` に対して `2026-05-01 08:21:04 UTC` (`0008_schema_alias_hardening.sql`) および `2026-05-01 10:59:35 UTC` (`0008_create_schema_aliases.sql`) に行われた先行 apply の出所を、git history / docs outputs / PR timeline / Cloudflare D1 migration ledger から read-only に追跡し、`confirmed (workflow / approval evidence あり)` または `unattributed (証跡なし)` のいずれかへ分類する。`confirmed` の場合は親ワークフロー `task-issue-191-production-d1-schema-aliases-apply-001` Phase 13 evidence へ cross-reference を追加する。`unattributed` の場合は再発防止策 (runbook / hook / approval gate 強化) を lessons / runbook / `aiworkflow-requirements` のいずれかに formalize する。

## why this is not a restored old task

本タスクは Issue #359 の Phase 13 preflight で初めて顕在化した out-of-band production operation の出所監査タスクである。`task-issue-191-production-d1-schema-aliases-apply-001` 本体の DDL 再適用、production への新規 migration 投入、code deploy、rollback、guard 実装とは scope が完全に分離されている。

## scope in / out

### Scope In

- `d1_migrations` ledger 上の `0008_schema_alias_hardening.sql` / `0008_create_schema_aliases.sql` applied timestamp の確認（read-only）
- 2026-05-01 前後の git log / PR timeline / docs/30-workflows/ outputs / `.claude/skills/aiworkflow-requirements/changelog/` から該当 operation 候補の列挙
- 候補ごとの approval evidence / command evidence / database target evidence の照合
- 出所確定時: `task-issue-191-production-d1-schema-aliases-apply-001` の `outputs/phase-13/main.md` および `verification-report.md` への cross-reference 追記
- unattributed 時: 再発防止策（runbook / hook / approval gate 強化方針）の lessons / runbook / `aiworkflow-requirements` への formalize
- 承認有無 / command / target database / timestamp の単一 record 化
- Phase 12 での system spec / `references/task-workflow-active.md` 同期

### Scope Out

- production D1 への追加 migration apply / rollback / code deploy
- fallback retirement (#299) / direct update guard (#300) の実装
- 再発防止策として hook / script を新規実装する作業（本タスクは「formalize（記述）」のみ。実装は別 follow-up）
- secret / token 実値の記録
- production D1 への write / 接続情報の取得・記録
- ユーザー明示指示なしの commit / push / PR 作成
- Issue #434 の状態変更（CLOSED のまま据え置き、reopen / close は行わない）

## dependencies

### Depends On

- `task-issue-191-production-d1-schema-aliases-apply-001` Phase 13 evidence（参照対象）
- `.claude/skills/aiworkflow-requirements/changelog/20260502-issue359-production-d1-schema-aliases-apply.md`
- `scripts/cf.sh`（必要に応じた production D1 read-only 確認）

### Blocks

- 本タスクの結論は Issue #299（fallback retirement）/ #300（direct update guard）の判断材料となる可能性があるが、blocking 関係ではない（独立タスク）

## refs

- docs/30-workflows/unassigned-task/task-issue-359-production-d1-out-of-band-apply-audit-001.md（本仕様書の上位 unassigned 仕様書）
- https://github.com/daishiman/UBM-Hyogo/issues/434
- https://github.com/daishiman/UBM-Hyogo/issues/359（parent）
- docs/30-workflows/completed-tasks/task-issue-191-production-d1-schema-aliases-apply-001/outputs/phase-13/main.md
- docs/30-workflows/completed-tasks/task-issue-191-production-d1-schema-aliases-apply-001/outputs/phase-13/local-check-result.md
- docs/30-workflows/completed-tasks/task-issue-191-production-d1-schema-aliases-apply-001/outputs/verification-report.md
- docs/30-workflows/completed-tasks/task-issue-191-production-d1-schema-aliases-apply-001/outputs/phase-12/unassigned-task-detection.md
- .claude/skills/aiworkflow-requirements/changelog/20260502-issue359-production-d1-schema-aliases-apply.md
- .claude/skills/aiworkflow-requirements/references/workflow-task-issue-191-production-d1-schema-aliases-apply-001-artifact-inventory.md
- 該当 timestamp: `2026-05-01 08:21:04 UTC` (`0008_schema_alias_hardening.sql`) / `2026-05-01 10:59:35 UTC` (`0008_create_schema_aliases.sql`)
- target database: `ubm-hyogo-db-prod`

## AC

- AC-1: `0008_schema_alias_hardening.sql` および `0008_create_schema_aliases.sql` の applied timestamp が `outputs/phase-11/d1-migrations-ledger.md` に redacted で記録され、Phase 13 evidence の値と一致する
- AC-2: 2026-05-01 前後の operation 候補が `outputs/phase-11/operation-candidate-inventory.md` に列挙され、各候補に対して `git commit / PR / workflow output / approval evidence` の有無が表として記録されている
- AC-3: 出所判定が `confirmed (workflow=<name>, approval=<evidence path>)` または `unattributed (no evidence found)` のいずれかとして `outputs/phase-11/attribution-decision.md` に確定記録されている
- AC-4: `confirmed` 判定の場合: `task-issue-191-production-d1-schema-aliases-apply-001` の `outputs/phase-13/main.md` または `verification-report.md` への cross-reference 追加方針が `outputs/phase-12/cross-reference-plan.md` に記載され、Phase 12 で該当ファイルへ cross-reference が反映されている
- AC-5: `unattributed` 判定の場合: 再発防止策が `outputs/phase-12/recurrence-prevention-formalization.md` として formalize され、`runbook` / `lessons-learned` / `aiworkflow-requirements` のいずれかへ反映先が決定している
- AC-6: 承認有無 / command / target database / timestamp が `outputs/phase-11/single-record.md` に単一レコードとして固定されている
- AC-7: secret / token 実値が成果物のいずれにも混入していない（redaction PASS）
- AC-8: 実行 transcript が allowlist コマンドのみに限定され、production D1 への write / 追加 apply / rollback / deploy が一切実行されていない。補助証跡として、取得可能な場合は `d1_migrations` ledger row 数の監査前後不変、local wrangler blocked 時は parent ledger snapshot + GitHub/git read-only transcript を使う
- AC-9: Phase 12 の 7 固定成果物 (`main.md` / `implementation-guide.md` / `documentation-changelog.md` / `system-spec-update-summary.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`) が実体配置されている

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計（監査ストラテジ）
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略（監査検証戦略）
- [phase-05.md](phase-05.md) — 実装ランブック（監査ランブック）
- [phase-06.md](phase-06.md) — 異常系検証（証跡欠落 / unattributed 経路）
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化（記述重複の正規化）
- [phase-09.md](phase-09.md) — 品質保証（redaction / read-only 検証）
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 監査実行 / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新 / 7 固定成果物
- [phase-13.md](phase-13.md) — PR 作成（user 承認待ち blocked）

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-11/manual-smoke-log.md
- outputs/phase-11/link-checklist.md
- outputs/phase-11/d1-migrations-ledger.md
- outputs/phase-11/operation-candidate-inventory.md
- outputs/phase-11/attribution-decision.md
- outputs/phase-11/single-record.md
- outputs/phase-11/redaction-checklist.md
- outputs/phase-11/read-only-checklist.md
- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-12/cross-reference-plan.md (confirmed 判定時)
- outputs/phase-12/recurrence-prevention-formalization.md (unattributed 判定時)
- outputs/phase-13/main.md

## invariants touched

- production D1 への write は一切行わない（CLAUDE.md「Cloudflare 系 CLI 実行ルール」に整合）
- `wrangler` 直接実行禁止 — `bash scripts/cf.sh` 経由の read-only 操作のみ
- secret 値は stdout / artifact / log / commit / 仕様書のいずれにも記録しない（redacted account / evidence path のみ）
- `task-issue-191-production-d1-schema-aliases-apply-001` Phase 13 evidence は本タスクから「追記」のみ可能（既存記録の改変禁止）
- Issue #434 / #359 の状態変更は行わない（CLOSED のまま据え置き）

## runtime audit result

Phase 11 was executed read-only on 2026-05-04. The decision is `confirmed`: both production D1 migration ledger entries came from GitHub Actions `backend-ci` / `deploy-production` / `Apply D1 migrations` after PR #364 and PR #365 merges. Phase 12 applied the confirmed-path cross-reference to the parent workflow Phase 13 evidence and artifact inventory.

Root workflow state remains `spec_created` because this task is docs-only / NON_VISUAL and Phase 13 commit / push / PR is still user-gated. Phase 1-12 outputs are present and current.

## completion definition

全 phase 仕様書 (phase-01〜phase-13) が揃い、Phase 11 で出所判定 (`confirmed` または `unattributed`) が確定し、Phase 12 で 7 固定成果物および判定別追加成果物 (`cross-reference-plan.md` または `recurrence-prevention-formalization.md`) が実体配置され、user 承認 gate (commit / push / PR) が明確であること。本 wave では実監査と Phase 12 cross-reference 追記まで完了し、commit / push / PR は行わない。

## issue 連携

- Issue #434 は CLOSED のまま据え置き、本仕様書作成では reopen / close 操作を行わない（ユーザー指示通り CLOSED 扱いで spec を書く）
- Issue #359 (parent) も状態変更しない
- 監査実行 (Phase 11) は 2026-05-04 に read-only で完了済み
- PR 作成 (Phase 13) はユーザーの明示指示で起動する
