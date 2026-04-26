# Phase 6 — 異常系・エラーケース検証

## シナリオ 1: 部分失敗（一部行の同期失敗）

### シナリオ定義

- 500行のバッチ中、15行目と42行目のメールアドレスが無効形式
- D1のバリデーション制約によりINSERT失敗

### 設計の対処

1. `ON CONFLICT(response_id) DO UPDATE` 失敗時、該当行をスキップ
2. `sync_audit.diff_summary_json` に `{"errors":[{"row":15,"reason":"invalid email"},{"row":42,"reason":"invalid email"}]}` を追記
3. `sync_audit.rows_skipped` を2インクリメント
4. 残りの行の処理を継続（skip-and-continue戦略）
5. 全バッチ完了後: `status='success'`（スキップありでも処理は完了）

### 検証結果

| 確認項目 | 結果 |
|---------|------|
| 部分失敗時にスキップして継続するか | PASS（`outputs/phase-05/retry-policy.md` §エラー種別ごとのリトライ戦略） |
| スキップ行がdiff_summary_jsonに記録されるか | PASS（`outputs/phase-05/sync-audit-contract.md` §diff_summary_json） |
| 成功した行がD1に反映されるか | PASS（トランザクションはバッチ単位でCOMMITされる） |
| 管理者がエラー行を特定できるか | PASS（sync_auditのdiff_summary_jsonを参照） |

**判定: PASS。設計文書修正不要。**

---

## シナリオ 2: quota超過（429 Too Many Requests）

### シナリオ定義

- バッチ取得中にSheets APIから429レスポンス
- Retry-Afterヘッダー: `30`

### 設計の対処

1. Retry-Afterヘッダーを確認 → 30秒待機
2. 30秒後にリトライ（1回目）
3. 再度429なら Exponential Backoff: 1s → 2s → 4s → 8s → 16s
4. 5回試行後も失敗なら `sync_audit.status='failure'`, `error_reason='quota exceeded after 5 retries'`

### 検証結果

| 確認項目 | 結果 |
|---------|------|
| Retry-Afterヘッダーが尊重されるか | PASS（`outputs/phase-05/retry-policy.md` §Exponential Backoffパラメータ） |
| 最大5回リトライで諦めるか | PASS（MAX_RETRY=5） |
| quota超過後の失敗がsync_auditに記録されるか | PASS（status='failure'に遷移） |
| バッチ間200ms待機でquota超過を事前防止しているか | PASS（BATCH_DELAY_MS=200） |

**判定: PASS。設計文書修正不要。**

---

## シナリオ 3: 冪等性確保（重複実行）

### シナリオ定義

- 同一CronジョブがWorkerの二重起動により同時に2回実行された
- 同一のSheetsデータを2つのWorkerが同時に取得・書き込み

### 設計の対処

1. `INSERT ... ON CONFLICT(response_id) DO UPDATE SET ...` による UPSERT
2. `response_id` が主キー → 重複挿入は上書きとなり副作用なし
3. 後発の同期では `rows_upserted` がインクリメントされるが、データ破損なし
4. 各実行の `sync_audit` レコードは `run_id`（UUIDv4）で独立管理

### 検証結果

| 確認項目 | 結果 |
|---------|------|
| 重複実行でデータが二重に挿入されないか | PASS（response_idの主キー制約 + ON CONFLICT(response_id) DO UPDATE） |
| 2回目の実行でエラーが発生しないか | PASS（UPSERT は既存レコードの上書きで成功する） |
| 各同期実行が独立したrun_idで追跡できるか | PASS（sync_audit.run_id = UUIDv4） |

**判定: PASS。設計文書修正不要。**

---

## 総合判定

| シナリオ | 判定 |
|---------|------|
| 部分失敗（skip-and-continue） | PASS |
| quota超過（Exponential Backoff） | PASS |
| 冪等性確保（重複実行） | PASS |

**全シナリオ PASS。設計文書の修正は不要。Phase 7 へ進む。**
