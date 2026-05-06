# Phase 11: 手動テスト / runtime evidence (NON_VISUAL)

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動テスト / runtime evidence |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント整備) |
| 状態 | spec_created |
| visualEvidence | NON_VISUAL |

## 目的

NON_VISUAL タスクのため、画面スクリーンショットではなく D1 / log / API レスポンスによる runtime evidence を取得する。

## Evidence ファイル

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/main.md` | 全 evidence のサマリと PASS 判定 |
| `outputs/phase-11/migration-apply.log` | staging D1 への migration apply ログ（`bash scripts/cf.sh wrangler d1 migrations apply ubm-hyogo-db-staging --env staging`） |
| `outputs/phase-11/schema-verification.log` | `SELECT name FROM sqlite_master WHERE name LIKE 'notification%'` 結果 |
| `outputs/phase-11/resolve-enqueue-evidence.log` | staging で test resolve 実行 → outbox SELECT で 1 件確認（PII redact 済） |
| `outputs/phase-11/dispatch-tick-evidence.log` | scheduled handler 手動 invoke（`wrangler cron trigger --env staging`）→ ledger に sent event 記録 |
| `outputs/phase-11/dlq-simulation.log` | dispatcher を fail させる test row を投入し、5 回失敗で dlq に遷移することを確認（staging のみ） |
| `outputs/phase-11/template-grep-evidence.log` | 配信メール（test 用 inbox）の text/html を取得し raw resolutionNote が含まれないことを grep で検証 |
| `outputs/phase-11/secret-list-check.log` | `bash scripts/cf.sh wrangler secret list --env staging` で `MAIL_PROVIDER_KEY` の存在確認（値は表示しない） |

## 取得手順

```bash
# 1. staging migration apply
bash scripts/cf.sh wrangler d1 migrations apply ubm-hyogo-db-staging --env staging \
  | tee outputs/phase-11/migration-apply.log

# 2. schema verify
bash scripts/cf.sh wrangler d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT name, sql FROM sqlite_master WHERE name LIKE 'notification%';" \
  | tee outputs/phase-11/schema-verification.log

# 3. resolve smoke (test admin で test member の visibility_request を resolve)
curl -X POST https://api-staging.ubm-hyogo.example/admin/requests/<NOTE_ID>/resolve \
  -H "Authorization: Bearer <TEST_ADMIN_TOKEN>" \
  -d '{"resolution":"approve"}' \
  | tee outputs/phase-11/resolve-api-response.json

bash scripts/cf.sh wrangler d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT notification_id, note_id, outcome, status, retry_count FROM notification_outbox ORDER BY created_at DESC LIMIT 5;" \
  | tee outputs/phase-11/resolve-enqueue-evidence.log

# 4. dispatch tick
bash scripts/cf.sh wrangler tail --env staging --format pretty \
  > outputs/phase-11/dispatch-tick-evidence.log &
TAIL_PID=$!
bash scripts/cf.sh wrangler triggers cron deploy --env staging  # cron 即時実行は手動 trigger で
sleep 30
kill $TAIL_PID

bash scripts/cf.sh wrangler d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT * FROM notification_ledger ORDER BY created_at DESC LIMIT 10;" \
  | tee -a outputs/phase-11/dispatch-tick-evidence.log

# 5. dlq simulation: dispatcher を mock fail にしたテストルートを使うか、
#    staging 上で意図的に invalid recipient を持つ row を 5 回処理させる
#    → 詳細は outputs/phase-11/dlq-simulation.log に記録

# 6. secret list
bash scripts/cf.sh wrangler secret list --env staging \
  | tee outputs/phase-11/secret-list-check.log
```

## redaction 規約

- `recipient_email` は `t***@example.com` 形式に redact してログ保存
- `provider_message_id` はそのまま記録可
- `last_error` は記録、ただし API key 文字列が含まれていないことを grep で確認

## 完了条件 / PASS 判定

各 evidence ファイルが揃い、以下を満たすこと:

- [ ] migration apply 成功（exit 0）
- [ ] `notification_outbox` / `notification_ledger` テーブル存在
- [ ] resolve smoke 後 outbox row 1 件作成（status=pending）
- [ ] dispatch tick 後 ledger に sent event 記録（実 Resend 送信もしくは sandbox API 経由）
- [ ] dlq simulation で 5 回失敗後 dlq 遷移確認
- [ ] secret list に `MAIL_PROVIDER_KEY` 存在
- [ ] template grep で raw resolutionNote が検出されない

## 状態

- 仕様書段階: `spec_created`
- 実装後 evidence 取得時: `runtime_evidence_captured`
- runtime PASS と spec contract PASS を分離（PASS_BOUNDARY_SYNCED_RUNTIME_PENDING を `PASS` 単独表記しない）

## 次 Phase

次: 12 (ドキュメント整備、必須7成果物)。

## 実行タスク

1. staging migration / schema / resolve / dispatch / DLQ evidence を取得する
2. secret readiness と redaction を確認する

## 成果物/実行手順

Evidence ファイル表と取得手順を参照する。

## 参照資料

- `phase-02.md`
- `phase-10.md`
- `scripts/cf.sh`

## 統合テスト連携

Phase 9 の local green に staging runtime evidence を追加する。
