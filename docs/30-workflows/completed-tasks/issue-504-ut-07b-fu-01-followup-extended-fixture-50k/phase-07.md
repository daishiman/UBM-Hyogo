# Phase 7: stress trial driver 実装（`run-stress-trial.sh`）

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-7/phase-7.md` |
| 変更対象 | `scripts/schema-alias-backfill/run-stress-trial.sh`（新規） |

## 目的
Phase 3 の I/F に従い、staging で 10 trials を順次実行し、各 trial の数値メトリクスを `outputs/phase-3/evidence-schema.json` に準拠した JSON で stdout / file 出力する。

## 実行タスク
1. ファイル新規作成: `scripts/schema-alias-backfill/run-stress-trial.sh`
2. 各 trial loop:
   - 開始前 cleanup（前回データ削除 / Queue depth 0 確認）
   - fixture seed（`seed-staging-50k.sh --env staging --fixture-file ...`）
   - back-fill 発火は canonical path のみ使用: `curl -fsS -X POST -H "Authorization: Bearer ${ADMIN_SESSION_JWT:?}" -H "Content-Type: application/json" --data '{"source":"issue-504-50k-trial"}' "${ADMIN_API_BASE_URL%/}/admin/schema/backfill/trigger"`
   - 期待応答: HTTP 202、JSON body `{"accepted":true,"status":"pending"|"running"}`。HTTP 2xx 以外、または `accepted !== true` は trial failure。
   - polling: 10 秒間隔、最大 30 分。`backfill_status in ('completed','exhausted')` で停止。
   - 経過時間 / retry_count / queue_enqueued / dlq_count / backfill_status を D1 query で収集
   - JSON record を append
3. 出力例:
   ```json
   {"trial":1,"started_at":"...","ended_at":"...","retry_count":...,"cpu_ms":...,"queue_enqueued":...,"dlq_count":...,"backfill_status":"completed"}
   ```
4. **production guard 同様に実装**（trial driver も staging 固定）。
5. 各 trial 後に cleanup。最終 trial 後にも全件削除して D1 write quota を解放。

## ローカル実行・検証コマンド
```bash
shellcheck scripts/schema-alias-backfill/run-stress-trial.sh
# dry-run（実行計画の表示のみ・staging 認証不要）
bash scripts/schema-alias-backfill/run-stress-trial.sh --trials 10 --evidence-out /tmp/evidence.json --dry-run
```

## 統合テスト連携
Phase 4 で設計した production abort 検証は本スクリプトにも適用。Phase 11 でこのスクリプトを使い 10 trials の runtime evidence を取得。

## 参照資料
- `outputs/phase-3/evidence-schema.json`
- `apps/api/src/workflows/schemaAliasBackfillBatch.ts`
- `apps/api/src/repository/schemaDiffQueue.ts`

## 成果物
- `scripts/schema-alias-backfill/run-stress-trial.sh`
- `outputs/phase-7/phase-7.md`

## 完了条件 (DoD)
- shellcheck clean
- `--dry-run` で実行計画 JSON が決定論的に出力
- production guard 動作確認
- 10 trials の JSON output が evidence-schema.json に schema validate される（Phase 11 で実機検証）
- trigger endpoint / auth / polling interval / timeout が `outputs/phase-3/cli-spec.md` と一致する
