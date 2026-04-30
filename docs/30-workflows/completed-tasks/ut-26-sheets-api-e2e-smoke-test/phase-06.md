# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets API エンドツーエンド疎通確認 (UT-26) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-29 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | spec_created |
| タスク分類 | specification-design（failure-case） |

## 目的

Phase 5 runbook で組み立てた smoke route に対し、認証層（401）/ 認可層（403）/ リソース層（404）/ レート制限（429）/ サーバー側障害（5xx）/ ネットワーク層 / Workers ランタイム層（Web Crypto 失敗）の各層で発生し得る異常系を網羅し、再現手順・期待ログ・切り分け runbook を揃える。403 PERMISSION_DENIED の真因（SA 共有未設定 / JSON 改行コード破損 / Sheets API 無効 / spreadsheetId 取り違え）を 1 アクションで切り分けられる troubleshooting runbook を Phase 11 へ引き渡す。

## 真の論点

- 403 は単一エラーでも真因が 4 通り存在する。エラーメッセージだけでは特定できないため、各原因を段階的に確認する切り分け手順が本タスクの最大価値。
- Web Crypto API は Workers Edge Runtime 固有の挙動を持ち、ローカル `wrangler dev --local` と remote モードで結果が変わる場合がある。失敗パスをログから検出可能にする。

## 実行タスク

1. failure cases を 7 層別に列挙し、12 件以上のマトリクスを完成する（完了条件: 各ケースに分類 / 原因 / 再現手順 / 検出 / 期待ログ / 復旧の 6 項目が埋まる）。
2. 各ケースの retry 戦略（即時失敗 / linear / exponential / no-retry）を明示する（完了条件: 全件で戦略が一意）。
3. 構造化ログ（JSON）のフォーマットを統一する（完了条件: `event`/`status`/`code`/`latency_ms`/`hint` の 5 キーを共通スキーマ化）。
4. 403 切り分け runbook（4 真因の段階的判定）を整備する（完了条件: SA 共有 / 改行コード / API 無効化 / spreadsheetId 取り違え の 4 段が手順化）。
5. failure case ごとに Phase 4 のテストファイル / Phase 11 手動 smoke へ wire-in を割り当てる（完了条件: 全件で対応する検証手段が特定）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/phase-05.md | runbook 上の例外パスを起点 |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/phase-04.md | 検証スイート対応 |
| 必須 | docs/30-workflows/unassigned-task/UT-03-sheets-api-auth-setup.md | sheets-auth の error 分類仕様 |
| 参考 | https://developers.google.com/sheets/api/limits | Sheets API quota / error code |
| 参考 | https://cloud.google.com/apis/design/errors | Google API error model |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | Web Crypto エラー |

## failure cases マトリクス

| # | 分類 | ケース | 原因 | 再現手順 | 検出 | 戦略 | 期待ログ | 復旧 |
| - | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 401 認証 | OAuth token endpoint 401 | SA JSON の private_key 不正（base64 / 改行コード破損） | `.dev.vars` の SA JSON で `\n` を `\\n` のままにする | OAuth fetch response.status=401 | no-retry | `{event:"sheets_smoke_test",status:"error",code:"SHEETS_AUTH_FAILED",hint:"check_private_key_newlines"}` | Secret を再投入（`\n` を実改行に正規化） |
| 2 | 401 認証 | invalid access token | 期限切れ token を強制注入（dev only debug flag） | smoke route に `?injectInvalidToken=1` で意図的に壊す | values.get response.status=401 | no-retry | `{code:"SHEETS_AUTH_FAILED",hint:"token_invalid"}` | cache 破棄 → 再取得 |
| 3 | 403 認可（A） | SA 共有未設定 | 対象 Sheets で SA メールアドレスへの共有設定が無い | 一時的に SA メールを共有から外す | values.get response.status=403 + body `PERMISSION_DENIED` | no-retry | `{code:"SHEETS_FORBIDDEN",hint:"share_with_sa_email",saEmail:"...@iam.gserviceaccount.com"}` | Sheets の共有設定に SA メール追加（閲覧権限） |
| 4 | 403 認可（B） | Sheets API が GCP project で無効 | GCP コンソールで Sheets API を Disable した状態で疎通 | コンソールで Sheets API 無効化 | values.get response.status=403 + body `SERVICE_DISABLED` | no-retry | `{code:"SHEETS_API_DISABLED",hint:"enable_sheets_api_in_gcp"}` | GCP コンソールで Sheets API 有効化 |
| 5 | 403 認可（C） | SA JSON 改行コード破損 | Cloudflare Secret 投入時の改行 escape ミス | wrangler secret put で `\n` をリテラル文字列で投入 | OAuth fetch 401 / 403 | no-retry | `{code:"SHEETS_AUTH_FAILED",hint:"private_key_format_invalid"}` | 1Password の正本から再投入 |
| 6 | 404 リソース | spreadsheetId 取り違え | formId と spreadsheetId を混同 | `SHEETS_SPREADSHEET_ID` に formId を設定 | values.get response.status=404 | no-retry | `{code:"SHEETS_NOT_FOUND",hint:"check_spreadsheet_id_vs_form_id"}` | Forms 「回答」タブから正しい spreadsheetId を取得し Variable 修正 |
| 7 | 422 入力 | range 文字列誤り | `A1:ZZ` 等の不正 range | smoke route の range 定数を不正値に変更 | response.status=400/422 | no-retry | `{code:"SHEETS_RANGE_INVALID",range:"A1:ZZ"}` | range を `A1:Z10` 等に修正 |
| 8 | 429 レート制限 | quota 超過 | 300 req/min/project 超過（実観測は困難） | unit テストで `Retry-After:30` mock | response.status=429 + `retry-after` header | linear backoff（header 値準拠）/ smoke では即時失敗 | `{code:"SHEETS_429",retryAfterSec:30}` | 次 cron / 次 smoke 試行まで待機 |
| 9 | 5xx 一時障害 | Google 側 outage | unit テストで 503 mock | response.status>=500 | response.status>=500 | exponential backoff 最大 1 回（smoke は短サイクル） | `{code:"SHEETS_5XX",attempt:1}` | 自動再試行で復旧 / NG なら手動再実行 |
| 10 | network | DNS 解決失敗 / TLS 失敗 | wrangler dev で外部 fetch 制限有効 | `wrangler dev --local`（remote 不使用）で疎通 | fetch 例外 throw | no-retry | `{code:"NETWORK_ERROR",hint:"use_wrangler_dev_remote_mode"}` | `wrangler dev --remote` に切り替え |
| 11 | Workers Crypto | Web Crypto subtle.sign 失敗 | private_key の PKCS#8 parse 失敗 | 不正な PEM 形式の private_key を投入 | `subtle.importKey` throw | no-retry | `{code:"CRYPTO_IMPORT_FAILED",hint:"check_pkcs8_format"}` | SA JSON の private_key を再取得 |
| 12 | Workers Crypto | RSA-SHA256 署名検証失敗 | algorithm 不一致 / hash mismatch | mock で sign 失敗 throw | `subtle.sign` throw | no-retry | `{code:"CRYPTO_SIGN_FAILED",hint:"check_algorithm"}` | sheets-auth の algorithm 設定見直し（UT-03 へ差し戻し） |
| 13 | Smoke route 認可 | `SMOKE_ADMIN_TOKEN` mismatch | header 無し / 値不一致 | curl から Authorization header を外す | smoke route handler 検証 | no-retry | `{code:"UNAUTHORIZED"}` | 呼び出し側 token 確認 |
| 14 | 環境分岐 | production 環境への誤露出 | `wrangler.toml` の env 分岐ミス | production env に smoke route が登録された状態で deploy（hypothetical） | route 一覧 grep / `c.notFound()` への到達 | no-retry（route 未登録が正） | `{code:"NOT_FOUND"}`（404） | `index.ts` の env ガード修正 → 再 deploy |
| 15 | cache | token cache が hit しない | isolate 再起動 / cache key mismatch | 連続呼び出しで `tokenFetchesDuringSmoke=false` が続く | 2 回目以降のレスポンス観測 | no-retry（仕様上許容） | `{event:"sheets_smoke_test",tokenFetchesDuringSmoke:false,attemptInWindow:2}` | cache 実装は許容範囲。複数 isolate 跨ぎは out-of-scope |

合計: 15 件（要件 12 件以上を満たす）。

## 構造化ログの共通スキーマ

```jsonc
{
  "event": "sheets_smoke_test",     // 固定
  "status": "success" | "error",    // どちらか
  "code": "SHEETS_AUTH_FAILED" | "SHEETS_FORBIDDEN" | "SHEETS_API_DISABLED" |
          "SHEETS_NOT_FOUND" | "SHEETS_RANGE_INVALID" | "SHEETS_429" |
          "SHEETS_5XX" | "NETWORK_ERROR" | "CRYPTO_IMPORT_FAILED" |
          "CRYPTO_SIGN_FAILED" | "UNAUTHORIZED" | "NOT_FOUND",
  "latency_ms": 0,
  "hint": "string (operator-readable next action)",
  "spreadsheetIdSuffix": "...3Xg"   // 末尾 4 桁のみ
  // access_token / SA JSON / private_key は絶対に含めない
}
```

## 403 切り分け runbook（4 真因の段階的判定）

> 目的: 403 が出た瞬間、operator が 5 分以内に真因を特定できる手順。

### Step A: SA 共有設定の確認（最頻原因）

```bash
# 対象 Sheets を browser で開き、共有 → 共有相手に SA メール（...@iam.gserviceaccount.com）が「閲覧者」以上で含まれることを確認
# 1Password から SA email を取得
op read "op://UBM-Hyogo/staging/sa_email"

# 含まれない → Sheets の「共有」から SA メール追加 → 1〜2 分待って再 smoke
```

### Step B: SA JSON 改行コードの確認（次頻原因）

```bash
# Cloudflare Secret は値を直接読めないため、smoke route のログを観測
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging | grep CRYPTO_IMPORT_FAILED

# CRYPTO_IMPORT_FAILED が出ている → 1Password の正本で再投入
# 注意: SA JSON は 1Password Secret Reference から op run 経由で揮発投入する。手書き編集禁止
```

### Step C: GCP プロジェクトでの Sheets API 有効化確認

```bash
# GCP コンソール → API とサービス → ライブラリ → "Google Sheets API" → 状態確認
# Disabled なら Enable をクリック → 数分待つ → 再 smoke
# ログで SHEETS_API_DISABLED が出る場合のみ該当
```

### Step D: spreadsheetId と formId の取り違え確認

```bash
# 対象 formId
echo "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg"

# Forms「回答」タブ → 連携シートを開く → URL が
# https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit
# この <SPREADSHEET_ID> を `SHEETS_SPREADSHEET_ID` に設定（formId とは異なる）

# 現在の Variable 確認（値ではなく末尾 4 桁のみ smoke レスポンスから）
curl -sS -H "Authorization: Bearer ${SMOKE_ADMIN_TOKEN}" \
  https://api-staging.example.com/admin/smoke/sheets | jq '.spreadsheetIdSuffix'
```

> 各 Step で smoke を再実行し、最初に 200 が返った Step がその時の真因。

## 各ケース ↔ 検証スイート / 手動 smoke wire-in

| Case # | 対応スイート（Phase 4） | 対応 Phase 11 手動 smoke |
| --- | --- | --- |
| 1, 2, 5 | unit（sheets-auth UT-03 既存）+ contract | troubleshooting-runbook の Step B |
| 3, 4 | (実環境依存) | troubleshooting-runbook の Step A / Step C で 1 件以上手動再現 |
| 6 | unit（404 分類）+ Step D | troubleshooting-runbook の Step D |
| 7 | unit（range invalid 分類） | smoke では再現しない |
| 8, 9 | unit + contract（mock fetch） | smoke では再現しない |
| 10 | smoke（wrangler dev --local 実機） | manual-smoke-log で観測 |
| 11, 12 | unit（mock subtle.sign throw） | staging で初回 smoke 実行時に間接観測 |
| 13 | authorization スイート 4 ケース | 該当無し |
| 14 | authorization（production 拒否） | production への hypothetical 検証は禁止。route 一覧 grep で代替 |
| 15 | 2 回連続 smoke で観測 | manual-smoke-log の cache 行 |

## 実行手順

1. 15 件のマトリクスを `outputs/phase-06/failure-cases.md` に転記。
2. 各ケースのログ JSON フォーマットを共通スキーマで統一。
3. 検証スイート / 手動 smoke wire-in を Phase 4 / Phase 11 と相互参照。
4. 403 切り分け runbook（Step A〜D）をコマンドベースで記述し Phase 11 troubleshooting-runbook.md に転記予約。
5. open question（UT-10 で標準化される項目）を Phase 12 unassigned に送る。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | failure case を AC マトリクスの「異常系」列に紐付け |
| Phase 9 | 異常系の境界値テストを coverage に含める |
| Phase 11 | 403 切り分け runbook を staging で 1 件以上手動 smoke |
| Phase 12 | UT-10（error handling 標準化）への引き継ぎを unassigned-task-detection に登録 |

## 多角的チェック観点

- 価値性: 403 切り分け runbook が 5 分以内に真因特定できる粒度か。
- 実現性: Workers Edge Runtime の Web Crypto エラーが 11/12 ケースとして分類可能か。
- 整合性: 構造化ログのキー名が UT-07 通知基盤の入力契約と整合するか。
- 運用性: 復旧コマンドがコピペで完結し、production を触らない設計か。
- セキュリティ: ログから SA JSON / access_token / private_key が一切出ないか。
- 認可境界: smoke route の production 露出（Case 14）が「絶対に発生しない」設計になっているか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 15 件の failure case マトリクス | spec_created |
| 2 | retry 戦略付与 | spec_created |
| 3 | 構造化ログ共通スキーマ確定 | spec_created |
| 4 | 403 切り分け runbook（A〜D） | spec_created |
| 5 | Phase 4 / Phase 11 への wire-in | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/failure-cases.md | 15 件マトリクス + 403 切り分け runbook + 共通ログスキーマ |
| メタ | artifacts.json | Phase 6 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 12 件以上の failure case が分類別に網羅
- [ ] 全ケースで retry 戦略が一意
- [ ] 全ケースに対応する Phase 4 スイートまたは Phase 11 手動 smoke が指定
- [ ] 403 切り分け runbook（Step A〜D）がコマンド付きで完成
- [ ] 構造化ログの共通スキーマ（5 キー以上）が固定
- [ ] SA JSON / access_token / private_key がログ出力例から完全排除

## タスク100%実行確認【必須】

- 実行タスク 5 件が `spec_created`
- 成果物が `outputs/phase-06/failure-cases.md` に配置済み
- 15 件全てに 6 項目（分類・原因・再現手順・検出・期待ログ・復旧）が記入
- Phase 5 擬似コードの例外パス（classifySheetsError）が全て failure case に対応
- production 書き込みを誘発する手順が 1 件も無い

## 次 Phase への引き渡し

- 次 Phase: 7 (AC マトリクス)
- 引き継ぎ事項:
  - 15 件の failure case ID を AC マトリクスの「異常系」列で参照
  - 403 切り分け runbook を Phase 11 troubleshooting-runbook.md に転記予約
  - 共通ログスキーマを Phase 11 manual-smoke-log の証跡フォーマットに採用
- ブロック条件:
  - 12 件未満で Phase 7 へ進む
  - 403 真因 4 つ（SA 共有 / 改行 / API 無効 / id 取り違え）のいずれかで切り分け手順が欠落
