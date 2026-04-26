# Phase 4 / verification-commands.md

Phase 5 の事前疎通および事後 smoke にコピペ流用するコマンド集。実値はすべて placeholder。

## 0. 環境変数（ローカル shell）

```bash
export SHEET_ID="<formId 紐付き spreadsheetId>"
export DB_NAME="ubm-hyogo-db-staging"
export TOKEN="$(gcloud auth application-default print-access-token)"  # もしくは service account JWT 経由
```

実値は 1Password Environments から取得。`.env` にコミットしない。

## 1. Sheets API 接続確認

```bash
# 認証確認
curl -sS -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" \
  "https://sheets.googleapis.com/v4/spreadsheets/$SHEET_ID?fields=spreadsheetId"
# 期待: 200

# 1 row 読取
curl -sS -H "Authorization: Bearer $TOKEN" \
  "https://sheets.googleapis.com/v4/spreadsheets/$SHEET_ID/values/A1:AE2" | jq '.values | length'
# 期待: >=1
```

| 応答 | 意味 | 対応 |
| --- | --- | --- |
| 200 | 正常 | 続行 |
| 401 | service account 未共有 / token 失効 | Sheets owner で共有 / token 再発行 |
| 403 | 権限不足 | Viewer 以上で再共有 |
| 429 | rate limit | exp backoff 後再試行 |

## 2. D1 binding 疎通

```bash
# 一覧
wrangler d1 list

# staging
wrangler d1 execute "$DB_NAME" --env staging --command "select 1 as ok"
# 期待: [{"ok":1}]

# prod
wrangler d1 execute ubm-hyogo-db-prod --env production --command "select 1 as ok"
```

## 3. 件数ベースライン

```bash
wrangler d1 execute "$DB_NAME" --env staging --command "select count(*) as n from member_responses"
wrangler d1 execute "$DB_NAME" --env staging --command "select count(*) as n from sync_audit"
```

## 4. mapping 単体（fixture 投入想定）

```bash
# 1 件 insert（mapping 出力検証用、実装後は runner.ts 経由）
wrangler d1 execute "$DB_NAME" --env staging --command "
INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, answers_json)
VALUES ('RID-FIXTURE', 'FORM-FIXTURE', 'REV-FIXTURE', 'HASH-FIXTURE', 'system@example.org', datetime('now'), '{"publicConsent":"consented","rulesConsent":"consented"}');
"

# 確認
wrangler d1 execute "$DB_NAME" --env staging --command \
  "select response_id, response_email from member_responses where response_id='RID-FIXTURE'"
```

## 5. 冪等性検証

```bash
# 同一 responseId を 2 回 UPSERT した後の件数
wrangler d1 execute "$DB_NAME" --env staging --command \
  "select count(*) as n from member_responses where response_id='RID-FIXTURE'"
# 期待: n=1
```

## 6. 異常系検証コマンド

```bash
# Sheets 429 を擬似（不正 SHEET_ID で短時間連打）
for i in 1 2 3; do
  curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" \
    "https://sheets.googleapis.com/v4/spreadsheets/INVALID/values/A1"
done

# D1 transaction 失敗（型違反）
wrangler d1 execute "$DB_NAME" --env staging --command \
  "INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, submitted_at, answers_json) VALUES ('RID-BAD', 'FORM', 'REV', 'HASH', datetime('now'), NULL)"
# 期待: 失敗 / 全件 rollback
```

## 7. クリーンアップ

```bash
wrangler d1 execute "$DB_NAME" --env staging --command \
  "DELETE FROM member_responses WHERE response_id LIKE 'RID-%'"
```

## 8. PASS 表

| ID | コマンド | PASS 条件 |
| --- | --- | --- |
| V1 | `wrangler d1 list` | 対象 DB 表示 |
| V2 | `wrangler d1 execute ... select 1` | `1` 返却 |
| V3 | curl Sheets meta | 200 |
| V4 | curl Sheets values A1:AE2 | values length >=1 |
| V5 | mapping fixture insert | 1 row affected |
| V6 | 冪等 count | n=1 |
