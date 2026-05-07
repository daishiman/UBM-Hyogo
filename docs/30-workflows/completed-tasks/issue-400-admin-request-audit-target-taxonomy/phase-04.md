# Phase 4: 実装タスク分解

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | issue-400-admin-request-audit-target-taxonomy |
| phase | 04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Issue #400 の admin request audit target taxonomy を実装・検証・正本同期する。

## 実行タスク

- Phase 本文の内容を実行し、成果物と検証証跡を同期する。

## 参照資料

- `docs/30-workflows/issue-400-admin-request-audit-target-taxonomy/index.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`

## 成果物

- root Phase 仕様書と `outputs/phase-*/main.md`


| # | タスク | 対象ファイル | 依存 |
| --- | --- | --- | --- |
| T1 | `AuditTargetType` union 拡張 | `apps/api/src/repository/auditLog.ts` | — |
| T2 | resolve INSERT の target_type / target_id 切替 | `apps/api/src/routes/admin/requests.ts` | T1 |
| T3 | repository 単体テスト追加 | `apps/api/src/repository/__tests__/auditLog.test.ts` | T1 |
| T4 | requests route テスト期待値更新 | `apps/api/src/routes/admin/requests.test.ts` | T2 |
| T5 | audit route filter テスト追加 | `apps/api/src/routes/admin/audit.test.ts` | T2 |
| T6 | shared zod コメント追記 | `packages/shared/src/zod/viewmodel.ts` | T1 |
| T7 | UI placeholder 文言更新 | `apps/web/src/components/admin/AuditLogPanel.tsx` | — |
| T8 | UI test placeholder assertion 更新（条件付） | `apps/web/src/components/admin/__tests__/AuditLogPanel.test.tsx` | T7 |
| T9 | docs 同期 | `docs/00-getting-started-manual/specs/`, `.claude/skills/aiworkflow-requirements/references/` | T1-T2 |

## 並列実行可能性

- T1 / T7 は独立 → 並列可
- T2 は T1 完了後
- T3 / T4 / T5 は T1+T2 完了後、相互独立 → 並列可
- T6 / T8 / T9 は最後にまとめて

## 完了条件

各タスクが Phase 5 の手順詳細に対応する 1-to-1 マッピングで参照される

## 統合テスト連携

- focused unit / route tests と validator を Phase 11 で接続する。
