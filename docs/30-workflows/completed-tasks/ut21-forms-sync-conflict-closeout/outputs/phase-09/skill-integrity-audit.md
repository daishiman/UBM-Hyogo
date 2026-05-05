# Phase 9 Output: aiworkflow-requirements skill 整合監査

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-forms-sync-conflict-closeout-001 |
| Phase | 9 / 13 |
| 種別 | skill 整合監査（AC-7 達成根拠） |
| 監査対象 skill | `.claude/skills/aiworkflow-requirements/references/task-workflow.md` |
| 編集対象 skill | なし（mirror parity N/A） |
| 監査日 | 2026-04-30 |

## 1. 監査スコープ

本タスク全成果物（`index.md` / `phase-01.md`〜`phase-13.md` / `outputs/phase-01`〜`phase-10` / `artifacts.json`）が、aiworkflow-requirements skill `task-workflow.md` の current facts と矛盾しないことを 6 軸で確認する。skill 配下のファイルは編集しない（mirror parity 保護）。

## 2. 6 軸整合監査結果

| 軸 | skill `task-workflow.md` current facts | 本タスク記述（出典） | 整合判定 | 備考 |
| --- | --- | --- | --- | --- |
| 同期元 | Forms API（`forms.get` / `forms.responses.list`）を正本 | 同（Phase 1 §5 / Phase 2 / Phase 8 §3 SSOT） | PASS | Sheets API v4 は legacy 引用のみ |
| admin endpoint | split: `POST /admin/sync/schema`（03a） + `POST /admin/sync/responses`（03b）。単一 `POST /admin/sync` は新設しない close-out 済 | 同（Phase 1 §5 / Phase 2 no-new-endpoint-policy.md / Phase 8 §3 SSOT） | PASS | F-1 共通フレーズと一致 |
| 監査 ledger | `sync_jobs` 単一を正本。`sync_audit_logs/outbox` は新設しない（U02 判定後まで保留） | 同（Phase 1 §5 / Phase 8 §4.3 / index.md AC-4） | PASS | F-2 共通フレーズと一致 |
| 実装パス | `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*` | 同（Phase 1 §5 / Phase 8 §4.4） | PASS | `apps/api/src/sync/{core,manual,scheduled,audit}.ts` は U05 委譲ノートのみ |
| Bearer guard | `SYNC_ADMIN_TOKEN` を `/admin/sync/*`（split 両方）に適用 | 同（Phase 1 §6 / Phase 5 implementation-runbook.md） | PASS | 04c の patch 案で AC 反映 |
| Cron | Workers Cron Triggers が scheduled sync 実行基盤 | 同（09b runbook 委譲。本タスクは spec のみ） | PASS | 無料枠運用 |

## 3. 判定総括

- 6 軸すべて PASS、矛盾 0 件。
- AC-7（aiworkflow-requirements current facts と矛盾なし）達成根拠として確定。
- `task-workflow.md` の close-out 注記（「単一 `POST /admin/sync` を新設しない」「`sync_audit_logs/outbox` を新設しない」）は本タスクの方針と完全に整合しており、skill 改修は不要。

## 4. mirror parity 判定

| 観点 | 判定 |
| --- | --- |
| 本タスクが skill `references/` を編集するか | しない |
| `.claude` / `.agents` 双方の sync 必要性 | N/A |
| Phase 12 で skill-feedback として SKILL 改修提案する場合の取扱い | 別タスク（skill 更新タスク）として切り出す。本タスクでは扱わない |

## 5. drift 監視への引き継ぎ

- aiworkflow-requirements の indexes 再生成 CI gate（`.github/workflows/verify-indexes.yml`）が drift を継続監視する。
- 本タスク完了後に skill `task-workflow.md` が更新される場合は、本監査の 6 軸を再評価する必要がある（後続 U02 / U04 / U05 着手時の前提確認）。

## 6. AC への接続

| AC | 接続根拠 |
| --- | --- |
| AC-7 | 6 軸 PASS、矛盾 0 件（§2 / §3） |
| AC-9 | 不変条件 #5 含め skill との矛盾なし（Phase 9 main.md §5） |
| AC-10 | 監査結果が本ファイルに記録され、Phase 10 GO/NO-GO 判定の入力となる |
