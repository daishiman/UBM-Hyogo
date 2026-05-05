# ut-07b-fu-04-production-migration-apply-execution

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | Wave 7 |
| mode | serial |
| owner | - |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL (runtime CLI evidence — VISUAL_ON_EXECUTION 相当) |
| issue | https://github.com/daishiman/UBM-Hyogo/issues/424 (CLOSED, keep closed) |
| task_id | UT-07B-FU-04-PRODUCTION-MIGRATION-APPLY-EXECUTION |
| 実装区分 | 実装仕様書（already-applied verification + evidence writing） |

## purpose

UT-07B-FU-03 で整備した production migration apply runbook と、aiworkflow-requirements 正本の production ledger fact を突き合わせ、`apps/api/migrations/0008_schema_alias_hardening.sql` が Cloudflare D1 production DB `ubm-hyogo-db-prod` で既適用である事実を再確認する operations 検証タスク。duplicate apply は禁止し、redacted already-applied verification evidence と aiworkflow-requirements の同期境界を残すところまでを責務とする。

本タスクは当初 production apply execution として起票されたが、正本 `references/database-schema.md` は `0008_schema_alias_hardening.sql` が `2026-05-01 08:21:04 UTC` に production D1 ledger 登録済みであると示す。したがって本仕様書は **再 apply ではなく既適用検証** に再構成し、実 Cloudflare CLI 検証はユーザー明示承認後に `bash scripts/cf.sh` wrapper 経由でのみ実施する。

## why this is not a restored old task

UT-07B-FU-03 は production migration apply の **runbook（手順書）作成** を責務とする DOC_PASS タスクであり、production D1 の runtime evidence は scope 外として明示分離されていた。本タスク FU-04 は、その分離方針を継承しつつ、正本 ledger 既適用 fact を優先して「duplicate apply 禁止 + read-only verification 境界 + system spec 同期」へ再分類した operations follow-up であり、過去機能の復活ではない。

## scope in / out

### Scope In

- FU-03 runbook inventory と consumed unassigned task の再読・前提確認
- preflight: `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` による既適用確認
- ユーザー明示承認の記録（Cloudflare runtime verification を行う場合のみ）
- duplicate apply 禁止判定の記録
- post-check: `schema_diff_queue.backfill_cursor` / `backfill_status` の存在確認
- redacted runtime evidence の保存（CLI stdout/stderr の token・Account ID・PII 除去後）
- aiworkflow-requirements の already-applied verification boundary 同期（既存 ledger fact + placeholder evidence ベース。fresh runtime evidence は承認後のみ）

### Scope Out

- runbook の再設計（FU-03 で完結済み）
- queue / cron split for large back-fill
- admin UI retry label
- Cloudflare token 値、Account ID 値、raw secret 値の記録
- 自動 commit / push / PR（ユーザー明示指示時のみ）
- D1 physical rollback（D1 は physical rollback 不可、forward-fix 方針）
- Issue #424 の再オープン

## dependencies

### Depends On

- UT-07B-FU-03-production-migration-apply-runbook（runbook PR merge 済みであること）
- ユーザーによる read-only production verification 明示承認（Phase 11 runtime verification gate）
- `apps/api/migrations/0008_schema_alias_hardening.sql` の存在
- `apps/api/wrangler.toml` の `[env.production]` 設定が `ubm-hyogo-db-prod` を指していること

### Blocks

- aiworkflow-requirements 上の「production schema alias hardening 適用済み」fact の更新
- 本 migration の存在を前提とする後続 admin / queue 系タスク

## refs

- docs/30-workflows/unassigned-task/task-ut-07b-fu-04-production-migration-apply-execution.md
- https://github.com/daishiman/UBM-Hyogo/issues/424
- docs/30-workflows/unassigned-task/task-ut-07b-fu-03-production-migration-apply-runbook.md
- apps/api/migrations/0008_schema_alias_hardening.sql
- apps/api/wrangler.toml（`[env.production]` D1 binding 確認）
- scripts/cf.sh / scripts/with-env.sh
- .claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md
- .claude/skills/aiworkflow-requirements/references/task-workflow-active.md

## AC

- AC-1: FU-03 runbook inventory / consumed task を Phase 02 で再読し、preflight → duplicate apply prohibition → optional read-only post-check の sequence を本仕様書内に再現する
- AC-2: `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` または正本既存 evidence で `0008_schema_alias_hardening` が「既適用」であることが確認される
- AC-3: ユーザーの runtime verification 明示承認が Phase 10 / Phase 11 evidence に記録される（未承認時は placeholder として BLOCKED）
- AC-4: `0008_schema_alias_hardening` の duplicate apply が実行されていないことが記録される
- AC-5: post-check で `schema_diff_queue.backfill_cursor` / `backfill_status` の 2 点が確認される
- AC-6: `outputs/phase-11/` 配下に redacted runtime evidence（preflight log / apply log / post-check log）が保存され、token 値・Account ID 値・PII を含まない
- AC-7: aiworkflow-requirements の already-applied verification boundary が既存 ledger fact + placeholder evidence に基づき Phase 12 で同期される

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計（既存 runbook 再確認）
- [phase-03.md](phase-03.md) — アーキテクチャ整合
- [phase-04.md](phase-04.md) — 実装計画詳細
- [phase-05.md](phase-05.md) — 主要実装手順（runbook execution dry-run）
- [phase-06.md](phase-06.md) — 単体検証（preflight）
- [phase-07.md](phase-07.md) — 統合検証（post-check）
- [phase-08.md](phase-08.md) — 品質ゲート
- [phase-09.md](phase-09.md) — ステージング検証（parity 確認）
- [phase-10.md](phase-10.md) — production 切替準備
- [phase-11.md](phase-11.md) — production 適用 + runtime evidence 取得
- [phase-12.md](phase-12.md) — ドキュメント / 5 タスク + compliance check
- [phase-13.md](phase-13.md) — PR 作成

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
- outputs/phase-11/preflight-list.log
- outputs/phase-11/apply.log
- outputs/phase-11/post-check.log
- outputs/phase-11/user-approval-record.md
- outputs/phase-11/redaction-checklist.md
- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-13/main.md

`spec_created` 時点では Phase 11 runtime evidence は未取得であり、`outputs/phase-11/*.log` は placeholder / no-op prohibition evidence として実体化する。Phase 12 の 7 固定成果物は仕様準拠のため spec 作成段階でも実体を配置する。

## invariants touched

- 不変条件 5「D1 への直接アクセスは `apps/api` に閉じる」 — migration source は `apps/api/migrations/` を正本とし、runtime verification は `bash scripts/cf.sh` wrapper 経由の read-only operation に限定する
- Cloudflare CLI は `bash scripts/cf.sh` 経由で扱い、`wrangler` を直接呼ばない（CLAUDE.md 規約）
- `.env` の中身を `cat` / `Read` / `grep` で表示しない、API Token / OAuth トークン値を出力やドキュメントに転記しない
- Issue #424 は CLOSED のまま運用し、再オープンしない
- D1 は physical rollback 不可。post-check FAIL 時は forward-fix migration を別タスクで起票する
- evidence は redacted shape のみ保存し、token・Account ID・raw PII を記録しない

## completion definition

全 phase 仕様書（phase-01〜phase-13）が揃い、Phase 11 evidence contract（already-applied preflight / duplicate-apply prohibition / post-check の redacted log + ユーザー承認記録）と Phase 12 close-out の 7 成果物が実体化され、production 既適用検証、approval gate、rollback（forward-fix）方針、aiworkflow-requirements 同期対象が明確であること。本仕様書作成では実 production apply・commit・push・PR を行わない。

## issue 連携

- Issue #424 はクローズド状態のままタスク仕様書を作成する（再オープンしない）
- spec-created 段階では Issue 状態を変更しない
- 実 production read-only verification・PR 作成時に必要であればユーザーが明示的に指示する。duplicate apply は引き続き禁止する
