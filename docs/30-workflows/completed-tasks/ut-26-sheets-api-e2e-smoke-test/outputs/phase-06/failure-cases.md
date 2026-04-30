# Phase 6 成果物: 異常系検証 (failure-cases.md)

| 項目 | 値 |
| --- | --- |
| タスク | UT-26 Sheets API エンドツーエンド疎通確認 |
| Phase | 6 / 13 |
| 作成日 | 2026-04-29 |
| 状態 | spec_created |
| 関連 | phase-06.md, phase-04.md, phase-05.md, phase-11.md |

## 1. 概要

Phase 5 runbook で組み立てた smoke route (`GET /admin/smoke/sheets`) に対し、認証層 (401) / 認可層 (403) / リソース層 (404) / レート制限層 (429) / サーバー側障害 (5xx) / ネットワーク層 / Workers ランタイム層 (Web Crypto) の各層で発生し得る異常系を網羅する。403 PERMISSION_DENIED の真因 4 通り (SA 共有未設定 / JSON 改行コード破損 / Sheets API 無効 / formId と spreadsheetId の取り違え) を 5 分以内に切り分けられる runbook を整備する。

> 環境変数表記について: 仕様書 (Phase 2 以降) は `GOOGLE_SHEETS_SA_JSON` を採用しているが、現行コードは `GOOGLE_SHEETS_SA_JSON` を使用している (index.md Decision Log 2026-04-29)。本書では仕様書側表記を優先し、Phase 2 実装前ゲートで env 名統一を確定する前提で記述する。

## 2. failure cases マトリクス (15 件)

各ケースに「分類 / 原因 / 再現手順 / 検出 / 戦略 / 期待ログ / 復旧」を付与。

| # | 分類 | ケース | 原因 | 再現手順 | 検出 | 戦略 | 期待ログ | 復旧 |
| - | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 401 認証 | OAuth token endpoint 401 | SA JSON の private_key 不正 (改行コード破損) | `.dev.vars` の SA JSON で `\n` を `\\n` のまま投入 | OAuth fetch `response.status=401` | no-retry | `{"event":"sheets_smoke_test","status":"error","code":"SHEETS_AUTH_FAILED","hint":"check_private_key_newlines","latency_ms":120}` | Secret を 1Password 正本から再投入し改行を実改行に正規化 |
| 2 | 401 認証 | invalid access token | dev only debug flag で期限切れ token を強制注入 | smoke route に `?injectInvalidToken=1` を付与 (dev 限定) | values.get `response.status=401` | no-retry | `{"code":"SHEETS_AUTH_FAILED","hint":"token_invalid","latency_ms":210}` | token cache を破棄して再取得 |
| 3 | 403 認可 (A) | SA 共有未設定 | 対象 Sheets で SA メールへの共有設定が無い | 一時的に Sheets の共有から SA メールを除外 | values.get `response.status=403` body `PERMISSION_DENIED` | no-retry | `{"code":"SHEETS_FORBIDDEN","hint":"share_with_sa_email","saEmail":"...@iam.gserviceaccount.com","latency_ms":340}` | Sheets の「共有」に SA メール (閲覧者以上) を追加 |
| 4 | 403 認可 (B) | Sheets API が GCP project で無効 | コンソールで Sheets API を Disable した状態で疎通 | GCP コンソール → API とサービス → Sheets API を無効化 | values.get `response.status=403` body `SERVICE_DISABLED` | no-retry | `{"code":"SHEETS_API_DISABLED","hint":"enable_sheets_api_in_gcp","latency_ms":300}` | GCP コンソールで Sheets API を有効化 |
| 5 | 403 認可 (C) | SA JSON 改行コード破損 | Cloudflare Secret 投入時の改行 escape ミス | `wrangler secret put` で `\n` をリテラル文字列で投入 | OAuth fetch 401 / 403 | no-retry | `{"code":"SHEETS_AUTH_FAILED","hint":"private_key_format_invalid","latency_ms":150}` | 1Password の正本から `op run` 経由で再投入 |
| 6 | 404 リソース | spreadsheetId 取り違え | formId と spreadsheetId の混同 | `SHEETS_SPREADSHEET_ID` に formId (`119ec539...`) を設定 | values.get `response.status=404` | no-retry | `{"code":"SHEETS_NOT_FOUND","hint":"check_spreadsheet_id_vs_form_id","spreadsheetIdSuffix":"...3Xg","latency_ms":250}` | Forms「回答」タブから連携シートの spreadsheetId を取得し Variable を修正 |
| 7 | 422 入力 | range 文字列誤り | `A1:ZZ` 等の不正 range | smoke route の range 定数を不正値に変更 | response 400/422 | no-retry | `{"code":"SHEETS_RANGE_INVALID","range":"A1:ZZ","latency_ms":180}` | range を `A1:Z10` 等の妥当値に修正 |
| 8 | 429 レート制限 | quota 超過 (300 req/min/project) | 実観測困難 → unit テストで `Retry-After:30` mock | response.status=429 + `retry-after` header | linear backoff (header 値準拠) / smoke では即時失敗 | `{"code":"SHEETS_429","retryAfterSec":30,"latency_ms":210}` | 次 cron / 次 smoke 試行まで待機 |
| 9 | 5xx 一時障害 | Google 側 outage | unit テストで 503 mock | response.status>=500 | exponential backoff 最大 1 回 (smoke は短サイクル) | `{"code":"SHEETS_5XX","attempt":1,"latency_ms":420}` | 自動再試行で復旧、NG なら手動再実行 |
| 10 | network | DNS 解決失敗 / TLS 失敗 / wrangler dev fetch 制約 | `wrangler dev --local` で外部 fetch 制限が有効 | `wrangler dev --local` (remote 不使用) で疎通 | fetch 例外 throw | no-retry | `{"code":"NETWORK_ERROR","hint":"use_wrangler_dev_remote_mode","latency_ms":50}` | `wrangler dev --remote` に切替 |
| 11 | Workers Crypto | Web Crypto `subtle.importKey` 失敗 | private_key の PKCS#8 parse 失敗 | 不正な PEM 形式の private_key を投入 | `subtle.importKey` throw | no-retry | `{"code":"CRYPTO_IMPORT_FAILED","hint":"check_pkcs8_format","latency_ms":40}` | SA JSON を 1Password 正本から再取得 |
| 12 | Workers Crypto | RSA-SHA256 `subtle.sign` 失敗 | algorithm 不一致 / hash mismatch | mock で sign 失敗 throw | `subtle.sign` throw | no-retry | `{"code":"CRYPTO_SIGN_FAILED","hint":"check_algorithm","latency_ms":35}` | sheets-auth の algorithm 設定見直し (UT-03 へ差し戻し) |
| 13 | Smoke route 認可 | `SMOKE_ADMIN_TOKEN` mismatch | header 無し / 値不一致 | curl から `Authorization` header を外す | smoke route handler 検証 | no-retry | `{"code":"UNAUTHORIZED","latency_ms":5}` | 呼び出し側 token を確認 (1Password 参照) |
| 14 | 環境分岐 | production 環境への誤露出 | `wrangler.toml` の env 分岐ミス | production env に smoke route が登録された状態で deploy (hypothetical) | route 一覧 grep / `c.notFound()` 到達 | no-retry (route 未登録が正) | `{"code":"NOT_FOUND","latency_ms":3}` | `index.ts` の env ガード修正 → 再 deploy |
| 15 | cache | token cache が hit しない | isolate 再起動 / cache key mismatch | 連続呼び出しで `tokenFetchesDuringSmoke=false` が続く | 2 回目以降のレスポンス観測 | no-retry (仕様上許容) | `{"event":"sheets_smoke_test","tokenFetchesDuringSmoke":false,"attemptInWindow":2,"latency_ms":280}` | cache 実装は許容範囲。複数 isolate 跨ぎは out-of-scope |

合計 15 件 (要件 12 件以上を満たす)。

## 3. 内部エラーコード分類

```
SHEETS_AUTH_FAILED       — 401 系 (private_key / token 失効)
SHEETS_FORBIDDEN         — 403 系 (SA 共有不足)
SHEETS_API_DISABLED      — 403 系 (GCP 側 Sheets API 無効)
SHEETS_NOT_FOUND         — 404 系 (spreadsheetId 取り違え)
SHEETS_RANGE_INVALID     — 400/422 系 (range 文字列誤り)
SHEETS_429               — 429 系 (per-minute quota 超過)
SHEETS_5XX               — 5xx 系 (Google 側一時障害)
NETWORK_ERROR            — fetch 例外 (DNS/TLS/wrangler dev 制約)
CRYPTO_IMPORT_FAILED     — Web Crypto importKey throw
CRYPTO_SIGN_FAILED       — Web Crypto subtle.sign throw
UNAUTHORIZED             — SMOKE_ADMIN_TOKEN mismatch
NOT_FOUND                — route 未登録 (production 露出ガード)
```

UT-10 へは `SmokeErrorKind = 'auth' | 'permission' | 'rate_limit' | 'network' | 'unknown'` の 5 分類で集約して引き渡す (Phase 8 の DRY 化方針)。

## 4. 構造化ログの共通スキーマ

```jsonc
{
  "event": "sheets_smoke_test",                           // 固定
  "status": "success" | "error",
  "code": "<上記内部エラーコードのいずれか>",
  "latency_ms": 0,                                         // 整数
  "hint": "string (operator-readable next action)",
  "spreadsheetIdSuffix": "...3Xg"                          // 末尾 4 桁のみ。それ以外の id は伏せる
  // access_token / SA JSON / private_key / SMOKE_ADMIN_TOKEN は絶対に含めない
}
```

5 キー (`event` / `status` / `code` / `latency_ms` / `hint`) を共通スキーマとして固定。`spreadsheetIdSuffix` / `tokenFetchesDuringSmoke` / `retryAfterSec` / `attempt` 等は補助フィールド。

## 5. 403 切り分け runbook (4 真因の段階的判定)

> 目的: 403 が出た瞬間、operator が 5 分以内に真因を特定できる手順。Phase 11 troubleshooting-runbook.md に転記する。

### Step A: SA 共有設定の確認 (最頻原因)

```bash
# 対象 Sheets を browser で開き、共有 → 共有相手に SA メール (...@iam.gserviceaccount.com) が「閲覧者」以上で含まれることを確認
op read "op://UBM-Hyogo/staging/sa_email"
# 含まれない → Sheets の「共有」から SA メールを追加 → 1〜2 分待ってから再 smoke
```

### Step B: SA JSON 改行コードの確認 (次頻原因)

```bash
# Cloudflare Secret は値を直接読めないため、smoke route のログを観測
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging | grep CRYPTO_IMPORT_FAILED
# CRYPTO_IMPORT_FAILED が出ている → 1Password 正本で再投入 (op run 経由)
# SA JSON は手書き編集禁止
```

### Step C: GCP プロジェクトでの Sheets API 有効化確認

```bash
# GCP コンソール → API とサービス → ライブラリ → "Google Sheets API" → 状態確認
# Disabled なら Enable をクリック → 数分待ってから再 smoke
# ログに SHEETS_API_DISABLED が出る場合のみ該当
```

### Step D: spreadsheetId と formId の取り違え確認

```bash
echo "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg"   # これは formId

# Forms「回答」タブ → 連携シートを開く → URL の
#   https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit
# の <SPREADSHEET_ID> を SHEETS_SPREADSHEET_ID に設定 (formId とは別物)

# 末尾 4 桁を smoke レスポンスから確認
curl -sS -H "Authorization: Bearer ${SMOKE_ADMIN_TOKEN}" \
  https://api-staging.example.com/admin/smoke/sheets | jq '.spreadsheetIdSuffix'
```

> 各 Step 後に smoke を再実行し、最初に 200 が返った Step がその時の真因。

## 6. ログサンプル (代表ケース 5 件)

```json
{"event":"sheets_smoke_test","status":"success","code":"OK","latency_ms":312,"sheetTitle":"フォームの回答 1","rowCount":42,"tokenFetchesDuringSmoke":true,"spreadsheetIdSuffix":"...3Xg"}
{"event":"sheets_smoke_test","status":"error","code":"SHEETS_FORBIDDEN","latency_ms":340,"hint":"share_with_sa_email","saEmail":"ubm-hyogo-sheets@<project>.iam.gserviceaccount.com","spreadsheetIdSuffix":"...3Xg"}
{"event":"sheets_smoke_test","status":"error","code":"SHEETS_NOT_FOUND","latency_ms":250,"hint":"check_spreadsheet_id_vs_form_id","spreadsheetIdSuffix":"...p7Xg"}
{"event":"sheets_smoke_test","status":"error","code":"SHEETS_429","latency_ms":210,"retryAfterSec":30,"hint":"backoff_or_retry"}
{"event":"sheets_smoke_test","status":"error","code":"CRYPTO_IMPORT_FAILED","latency_ms":40,"hint":"check_pkcs8_format"}
```

## 7. 各ケース ↔ 検証スイート / Phase 11 手動 smoke wire-in

| Case # | 対応スイート (Phase 4) | 対応 Phase 11 手動 smoke |
| --- | --- | --- |
| 1, 2, 5 | unit (sheets-auth UT-03 既存) + contract | troubleshooting-runbook Step B |
| 3, 4 | (実環境依存) | troubleshooting-runbook Step A / Step C で 1 件以上手動再現 |
| 6 | unit (404 分類) + Step D | troubleshooting-runbook Step D |
| 7 | unit (range invalid 分類) | smoke では再現しない |
| 8, 9 | unit + contract (mock fetch) | smoke では再現しない |
| 10 | smoke (wrangler dev --local 実機) | manual-smoke-log で観測 |
| 11, 12 | unit (mock subtle.sign throw) | staging 初回 smoke 実行時に間接観測 |
| 13 | authorization スイート 4 ケース | 該当無し |
| 14 | authorization (production 拒否) | production への hypothetical 検証は禁止。route 一覧 grep で代替 |
| 15 | 2 回連続 smoke で観測 | manual-smoke-log の cache 行 |

## 8. 完了条件チェック

- [x] 12 件以上の failure case 網羅 (15 件)
- [x] retry 戦略が全件で一意
- [x] 全ケースに対応 Phase 4 スイート / Phase 11 手動 smoke 指定
- [x] 403 切り分け runbook (Step A〜D) コマンド付き
- [x] 構造化ログ共通スキーマ 5 キー固定
- [x] SA JSON / access_token / private_key がログ例から完全排除

---

next: phase-07 (AC マトリクス) へ引き渡し — 15 件の failure case ID と内部エラーコード分類を AC-5 / AC-9 のトレース行に紐付ける。403 切り分け runbook (Step A〜D) は Phase 11 troubleshooting-runbook.md に転記予約。共通ログスキーマは Phase 11 manual-smoke-log の証跡フォーマットに採用。
