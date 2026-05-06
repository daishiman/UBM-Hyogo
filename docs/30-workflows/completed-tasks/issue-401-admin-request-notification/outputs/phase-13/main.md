# Phase 13: コミット・PR 作成（多段承認 gate）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 13 / 13 |
| Phase 名称 | コミット・PR 作成 |
| 前 Phase | 12 (ドキュメント整備) |
| 状態 | spec_created |

## 目的

実装 + evidence + ドキュメントが揃った段階で、ユーザー明示承認を得たうえで commit / push / PR を作成する。

## G1-G4 多段承認ゲート

各 gate は独立承認とし、合算承認禁止。

| Gate | 対象 | 承認条件 |
| --- | --- | --- |
| G1 | runtime deploy（staging dispatch 動作確認） | Phase 11 evidence で sent / dlq 双方の挙動確認済み |
| G2 | Forms / 外部連携同期 | 該当なし（本タスクは Forms 影響なし、明示 skip） |
| G3 | D1 apply（production migration） | staging で migration apply + smoke 完了、rollback SQL 保存済み |
| G4 | commit-push-PR | G1 / G3 完了 + ユーザー明示承認 |

## G4 実行手順（ユーザー承認後）

```bash
# 1. ステージング
git add docs/30-workflows/issue-401-admin-request-notification/ \
        apps/api/migrations/0014_notification_outbox.sql \
        apps/api/src/repository/notificationOutbox.ts \
        apps/api/src/repository/__tests__/notificationOutbox.test.ts \
        apps/api/src/services/notification/ \
        apps/api/src/workflows/notificationDispatchTick.ts \
        apps/api/src/workflows/notificationDispatchTick.test.ts \
        apps/api/src/routes/admin/requests.ts \
        apps/api/src/routes/admin/requests.test.ts \
        apps/api/src/index.ts \
        apps/api/wrangler.toml \
        docs/00-getting-started-manual/specs/07-edit-delete.md \
        .claude/skills/aiworkflow-requirements/

# 2. commit
git commit -m "$(cat <<'EOF'
feat(issue-401): admin resolve 後の member 通知 (outbox + dispatcher)

- notification_outbox / notification_ledger migration (0014)
- notificationOutbox repository (enqueue / claim / markSent / markFailed / moveToDlq)
- services/notification/{templates,dispatcher} (PII sanitize + Resend)
- workflows/notificationDispatchTick (exponential backoff + DLQ)
- resolve API 末尾に best-effort enqueue 追加（resolve transaction 疎結合）
- scheduled handler / wrangler cron 結線

Refs #401 (issue already closed; do not auto-close)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 3. push & PR
git push -u origin docs/issue-401-admin-request-notification-task-spec

gh pr create --title "feat(issue-401): admin resolve notification (outbox + dispatcher)" --body "$(cat <<'EOF'
## Summary
- admin resolve 後の member 通知を outbox + dispatch worker で実装
- resolve transaction とは疎結合（enqueue 失敗で resolve は rollback しない）
- PII sanitize（200 char truncate + control-char strip）
- exponential backoff + DLQ 終端

## Test plan
- [ ] migration apply 成功（staging）
- [ ] resolve smoke 後 outbox row 1 件
- [ ] dispatch tick 後 ledger sent event
- [ ] dlq simulation で 5 回失敗 → dlq 遷移
- [ ] coverage 新規ファイル ≥80% branch / ≥85% line

EOF
)"
```

## 禁止事項

- 本仕様書作成プロンプト内で commit / push / PR 実行禁止（CONST_002）
- G4 承認なしで `git push` 禁止
- `--no-verify` 禁止（merge commit 例外を除く）

## 完了条件

- [ ] G1 / G3 完了 + ユーザー G4 承認
- [ ] PR URL が記録されている
- [ ] CI 全 PASS（typecheck / lint / test / coverage-gate）

## 状態

- 仕様書段階: `spec_created`（PR 未作成）
- PR 作成後: `pr_created`
- merge 後: `completed`

## 実行タスク

1. G1-G4 の独立承認を確認する
2. user approval 後のみ commit / push / PR を実行する

## 成果物/実行手順

G4 実行手順（ユーザー承認後）を参照する。

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-template-phase13.md`
- `phase-11.md`
- `phase-12.md`
