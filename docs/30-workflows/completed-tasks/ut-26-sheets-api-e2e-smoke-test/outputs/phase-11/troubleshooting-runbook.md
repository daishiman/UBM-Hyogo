# Troubleshooting Runbook (UT-26)

## エラー分類と内部 errorCode

| HTTP / 例外 | errorCode | 主因 |
| --- | --- | --- |
| 401 Unauthorized (Sheets API) | AUTH_INVALID | access_token 失効 / JWT 署名不一致 / token endpoint 応答不正 |
| 403 Forbidden | PERMISSION_DENIED | SA メール未共有 / Sheets API 無効 / spreadsheetId と formId 取り違え / JSON 改行破損 |
| 429 Too Many Requests | RATE_LIMITED | 300 req/min/proj 超過 |
| SyntaxError on JSON | PARSE | レスポンス body が JSON でない |
| TypeError fetch failed | NETWORK | DNS / TLS / Workers fetch 経路障害 |
| SA JSON parse fail / env missing | CONFIG_MISSING | GOOGLE_SHEETS_SA_JSON / SHEETS_SPREADSHEET_ID 未設定 |
| その他 | UNKNOWN | 上記いずれにも該当しない例外 |

## 403 切り分け Step A〜D

### Step A: Service Account の共有確認
- 確認: Sheets の「共有」に SA メール（`*-@*.iam.gserviceaccount.com`）が含まれるか。Viewer 権限以上が必要。
- 安全に残す証跡: 「shared=yes/no」のみ。SA メール本文は記録しない。

### Step B: SA JSON のキー形式
- 確認: 1Password の `GOOGLE_SHEETS_SA_JSON` が `\n` を改行コードとして保持しているか。`\\n` リテラル化されている場合、`importPkcs8` が pkcs8 として読めず JWT 署名に失敗する（→ 401 / 500 のいずれかとして観測）。
- 既存実装の `apps/api/src/jobs/sheets-fetcher.ts::importPkcs8` は `\\n` を `\n` に正規化する。新規キー追加時は double escape 事故に注意。
- 安全に残す証跡: parse 成否 yes/no、private_key の SHA-256 fingerprint 先頭8文字（不可逆）のみ。

### Step C: Sheets API の有効化
- 確認: GCP プロジェクトで `sheets.googleapis.com` が enabled。403 メッセージに「has not been used」が含まれる場合は本ステップが原因。
- 安全に残す証跡: enabled=yes/no のみ。

### Step D: spreadsheetId と formId の取り違え
- 確認: `SHEETS_SPREADSHEET_ID` が Forms「回答」タブから連携されている Sheets の ID であること。formId（`119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg`）ではない。
- 安全に残す証跡: redacted ID（先頭4 + *** + 末尾4）のみ。

## 401 調査
- token endpoint POST 応答が 200 でない（assertion 不正、SA disabled）
- システム時刻と SA exp/iat が大きくズレ（Workers では発生しにくいが skew をログ）

## 429 調査
- Sheets API クォータ（300 req/min/proj）を smoke 1 回 + 既存 sync で超過していないか
- backoff は本タスクでは対象外（UT-09 / UT-10 で実装）。発生したら時間をおいて再実行

## PARSE / NETWORK
- PARSE: token endpoint または Sheets が HTML エラーページを返した可能性 → 直前の HTTP status を再確認
- NETWORK: Workers の fetch 経路で TLS エラー / DNS 失敗。`wrangler dev --remote` で再現するか確認

## wrangler dev の差分
- `wrangler dev`（remote / preview モード推奨）: 本番に近い fetch 経路で実 Sheets API を呼べる
- `wrangler dev --local`: miniflare ローカルランタイム。一部外部 fetch / WebCrypto 挙動が異なる場合がある。本 smoke は remote 推奨

## curl サンプル（redact 済）

```bash
# 正常系
curl -sS -i \
  -H "Authorization: Bearer ${SMOKE_ADMIN_TOKEN}" \
  "http://127.0.0.1:8787/admin/smoke/sheets?range=Sheet1!A1:B2"

# 期待: HTTP/1.1 200, body は { ok: true, env, spreadsheetIdRedacted, sheetName, rangeRequested, firstCall, secondCall, cacheHit }
```

## Secret Hygiene（再掲）

Service Account JSON / access_token / private_key / client_email / spreadsheetId 全文 / Authorization 値 はログ・PR・コミット・成果物に一切残さない。

## next: Phase 12 implementation-guide.md / system-spec-update-summary.md からこの runbook を参照する
