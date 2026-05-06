# Issue #402 — delete request 承認後の物理削除 / retention policy — 実行サマリ (main.md)

## 概要

UBM 兵庫支部会のメンバーから退会 (delete request) があり admin が承認した場合、現状は `deleted_members` に soft-delete されたまま PII が残り続ける。Issue #402 では承認から **180 日** の保持期間 (retention) を経過した member row を既存 Cloudflare daily Cron branch で物理削除し、`deleted_members` tombstone と audit_log 差分行だけを残す retention purge job を導入する。

## 6 必須タスク表

| # | タスク | 成果物 | 状態 |
| --- | --- | --- | --- |
| 1 | 実装ガイド (Part 1 中学生レベル + Part 2 技術者レベル) | `implementation-guide.md` | ✓ |
| 2 | システム仕様書更新（`data-retention-policy.md` 新規） | `system-spec-update-summary.md` | ✓ |
| 3 | ドキュメント更新履歴 | `documentation-changelog.md` | ✓ |
| 4 | 未タスク検出（0 件でも出力） | `unassigned-task-detection.md` | ✓ |
| 5 | スキルフィードバック（3 観点） | `skill-feedback-report.md` | ✓ |
| 6 | タスク仕様書コンプライアンスチェック | `phase12-task-spec-compliance-check.md` | ✓ |

## Phase 1-13 ハイライト

1. Phase 1: GO 判定 / 既存 `deleted_members` schema と admin request flow 確認
2. Phase 2: retention 期間 (180 日) / cron 実行間隔 (daily 03:00 JST) / dry-run mode 設計
3. Phase 3: 影響範囲（`apps/api` の jobs / migrations / templates / scheduled handler）
4. Phase 4: 検証シナリオ（dry-run 一致 / 1 件 apply / 子テーブル 0 件 / audit_log 差分 / invariant）
5. Phase 5: `apps/api/src/jobs/retention-purge.ts` 実装 + migration + 既存 cron branch 配線 + 通知テンプレ更新
6. Phase 6-7: 実装 + coverage 維持
7. Phase 8: cron trigger ↔ job 統合確認
8. Phase 9: typecheck / lint / test / coverage / migration drift / index drift
9. Phase 10: rollback 経路 3 段（pre-purge / 7 日以内 PITR / 7 日超過は不可逆）+ member 通知文言レビュー
10. Phase 11: NON_VISUAL evidence 7 ファイル（dry-run / apply / audit / cron）
11. Phase 12: 7 必須成果物
12. Phase 13: PR 作成（**user 承認必須**）

## 参照

- 親 Issue: https://github.com/daishiman/UBM-Hyogo/issues/402 (CLOSED)
- SSOT 新規: `.claude/skills/aiworkflow-requirements/references/data-retention-policy.md`
- 関連: `apps/api/src/routes/admin/requests` / `db/schema/deleted_members.sql`
