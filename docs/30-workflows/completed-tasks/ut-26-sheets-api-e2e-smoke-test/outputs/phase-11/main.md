# Phase 11 Main — 手動 smoke test 実施サマリ

## 状態

implemented (vitest pass) / live staging 実行 pending（staging 環境への deploy と SA JSON 共有完了後に実施）。

## NON_VISUAL Evidence Policy

screenshots は不要。エビデンスは vitest テスト結果 / curl / wrangler tail のログで構成する。

## 実装の達成事項

| 項目 | 内容 |
| --- | --- |
| 実装ファイル | `apps/api/src/routes/admin/smoke-sheets.ts` |
| テスト | `apps/api/src/routes/admin/smoke-sheets.test.ts` (vitest 10 ケース、全 pass) |
| ルート mount | `apps/api/src/index.ts` で `app.route("/admin/smoke/sheets", createSmokeSheetsRoute())` |
| env 名 Decision | `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` / `SMOKE_ADMIN_TOKEN` を採用 |
| 認可境界 | `ENVIRONMENT === "production"` で 404 / `Authorization: Bearer ${SMOKE_ADMIN_TOKEN}` 必須 |
| redact | spreadsheetId は `先頭4 + *** + 末尾4`、SA JSON / private_key / client_email / token は一切ログに残さない |

## AC-1〜AC-11 進捗

| AC | 状態 | 証跡 |
| --- | --- | --- |
| AC-1 staging 200 疎通 | pending live | staging deploy 後に curl で確認 |
| AC-2 JWT→token→API E2E | pending live | sheets-fetcher.ts (UT-09) の Web Crypto 経路を Workers ランタイムで実走させる |
| AC-3 対象 Sheets 値取得 | pending live | staging 実行のサンプル行を `manual-smoke-log.md` に記録 |
| AC-4 トークンキャッシュ | mock 検証済 | smoke-sheets.test.ts case 4 で 2回の Sheets fetch に対して OAuth token fetch が1回だけであることを `tokenFetchesDuringSmoke=1` として確認 |
| AC-5 401/403/429 分類 | mock 検証済 | smoke-sheets.test.ts case 5/6/7 で errorCode を確認 |
| AC-6 wrangler dev | pending live | `.dev.vars` 配置後に手動確認 |
| AC-7 verification-report | this doc | manual-smoke-log.md / troubleshooting-runbook.md 参照 |
| AC-8 Secret hygiene | satisfied | redact ルール実装済、テストにも実 secret は登場しない |
| AC-9 403 切り分け runbook | satisfied | troubleshooting-runbook.md Step A〜D |
| AC-10 UT-09 前提 | conditional GO | live 完了で確定 |
| AC-11 4条件 PASS | satisfied | Phase 10 go-no-go.md 参照 |

## テストケース一覧（vitest）

1. production 環境では 404
2. Authorization ヘッダなしで 401
3. Authorization ヘッダ不一致で 401
4. 正常系 200 / tokenFetchesDuringSmoke=1 / cacheHit=true / spreadsheetId redact 確認
5. SheetsFetchError(401) → errorCode='AUTH_INVALID'
6. SheetsFetchError(403) → errorCode='PERMISSION_DENIED'
7. SheetsFetchError(429) → errorCode='RATE_LIMITED'
8. GOOGLE_SHEETS_SA_JSON 未設定 → errorCode='CONFIG_MISSING'
9. SHEETS_SPREADSHEET_ID 未設定 → errorCode='CONFIG_MISSING'

## next: Phase 12 へ

- 実装ファイル一覧と env Decision を `documentation-changelog.md` / `system-spec-update-summary.md` に転記
- live 実行 pending を `unassigned-task-detection.md` の検出項目として記録（起票はしない）
