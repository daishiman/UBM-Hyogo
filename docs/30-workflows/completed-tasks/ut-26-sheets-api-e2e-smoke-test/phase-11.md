# Phase 11: 手動 smoke test

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets API エンドツーエンド疎通確認 (UT-26) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test |
| 作成日 | 2026-04-29 |
| Wave | 1 |
| 実行種別 | parallel |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| タスク分類 | implementation / smoke-test（manual evidence / NON_VISUAL） |
| user_approval_required | false |

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- 判定理由:
  - 本タスクは `apps/api` 配下の dev 限定 smoke route（`GET /admin/smoke/sheets`）と疎通確認スクリプトであり、エンドユーザー向け UI を提供しない。
  - 出力先は curl レスポンス JSON / wrangler structured log / Sheets API レスポンスサマリーであり、画面 / コンポーネント / レイアウト / インタラクションを伴わない。
  - 結果として screenshot による視覚証跡は不要。curl 出力 / wrangler 出力 / structured log（`event=sheets_smoke_test`）が一次証跡となる。
- 必須 outputs:
  - `outputs/phase-11/manual-smoke-log.md`（コマンド単位の実行ログ）
  - `outputs/phase-11/troubleshooting-runbook.md`（403 切り分け 4 ステップ runbook）
- **`outputs/phase-11/screenshots/.gitkeep` は作成しない**（NON_VISUAL のため screenshots ディレクトリ自体不要）。

## 目的

Phase 5 の implementation-runbook に基づき実装された smoke route / smoke スクリプトを、ローカル `wrangler dev` および staging の Cloudflare Workers 上で手動実行し、AC-1〜AC-9 がエンドツーエンドで成立することを一次証跡として採取する。fetch mock では検出できない Web Crypto API (RSA-SHA256) による JWT 署名・OAuth 2.0 token endpoint への HTTPS 通信・`spreadsheets.values.get` の HTTP 200 取得・アクセストークンキャッシュ・401/403/429 エラー分類のすべてを実機で確認する。production 環境への書き込みは一切行わない。

## 実行タスク

1. ローカル `wrangler dev`（remote / preview モード）で smoke route を起動できることを確認する（完了条件: 起動ログ取得 + `Ready on http://localhost:8787`）。
2. `curl` でローカル smoke route を叩き、Sheets API v4 から HTTP 200 が取得できることを確認する（完了条件: シート名 / 行数 / 先頭行サンプル がレスポンス JSON に含まれる）。
3. 同 route を 2 回連続で叩き、2 回目では OAuth token endpoint への fetch がスキップされる（cache hit）ことをログから確認する（完了条件: structured log に `token_cache=hit` が出る）。
4. staging 環境（Cloudflare Workers）に deploy し、staging URL に対し `SMOKE_ADMIN_TOKEN` 付きで curl を叩く（完了条件: HTTP 200 + Sheets サマリー JSON）。
5. 401（無効 token）/ 403（SA 共有未設定 spreadsheetId）/ 429（強制負荷シミュレーションまたは観測が無ければ N/A 記録）の各ケースで期待されるエラー分類が出ることを確認する（完了条件: 各ケースの error_code がログに分類済）。
6. 403 が観測された場合の切り分け runbook を 4 ステップ（SA 共有 / JSON 改行 / Sheets API 有効化 / spreadsheetId 確認）で `troubleshooting-runbook.md` に整備する（完了条件: 4 ステップすべてに「観測手順」「期待出力」「修復コマンド」が記述）。
7. 既知制限と production への書き込み禁止が保たれたことを `manual-smoke-log.md` に明記する（完了条件: production deploy が含まれない / write 系 API が呼ばれていないことを宣言）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/outputs/phase-05/implementation-runbook.md | smoke 対象の実装手順 |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/outputs/phase-07/ac-matrix.md | AC × smoke 項目の対応 |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/outputs/phase-10/go-no-go.md | GO 判定の前提確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare Secrets / `.dev.vars` 取扱い |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | dev 限定 smoke route 規約 |
| 参考 | https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get | Sheets API v4 |
| 参考 | https://developers.google.com/identity/protocols/oauth2/service-account | Service Account 認証 |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | Workers Web Crypto API |

## 実行手順

### ステップ 1: ローカル `wrangler dev` での疎通

```bash
# .dev.vars に GOOGLE_SHEETS_SA_JSON / SHEETS_SPREADSHEET_ID / SMOKE_ADMIN_TOKEN を 1Password 参照で展開済みであること
cd apps/api
mise exec -- bash ../../scripts/with-env.sh pnpm wrangler dev
```

- 期待値: `Ready on http://localhost:8787` の出力。`--local` ではなく remote / preview モードで起動（外部 fetch 制約回避）。
- 失敗時: `.dev.vars` の op 参照展開、`wrangler.toml` の `[env.dev.vars]`、`SMOKE_ADMIN_TOKEN` の長さを確認。

### ステップ 2: smoke route 呼び出し（1 回目 / cache miss）

```bash
curl -i -X GET 'http://localhost:8787/admin/smoke/sheets' \
  -H "Authorization: Bearer $SMOKE_ADMIN_TOKEN"
```

- 期待値: HTTP 200 + JSON `{ "ok": true, "spreadsheetId": "<masked>", "sheetTitle": "...", "rowCount": N, "sampleRow": [...], "tokenCache": "miss" }` 形式。
- 失敗時: 403 なら `troubleshooting-runbook.md` の 4 ステップを順に実施。

### ステップ 3: smoke route 呼び出し（2 回目 / cache hit）

```bash
curl -s -X GET 'http://localhost:8787/admin/smoke/sheets' \
  -H "Authorization: Bearer $SMOKE_ADMIN_TOKEN" | jq '.tokenCache'
```

- 期待値: `"hit"`。Workers ログに `event=sheets_smoke_test token_cache=hit oauth_fetch=skipped` が出力される。

### ステップ 4: staging deploy（read-only）

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
```

- 期待値: deploy 成功 + Worker URL が出力される。production には deploy しない（`--env production` を使わない）。

### ステップ 5: staging への curl 疎通

```bash
STAGING_URL="https://<staging-worker>.workers.dev"
curl -i -X GET "${STAGING_URL}/admin/smoke/sheets" \
  -H "Authorization: Bearer $SMOKE_ADMIN_TOKEN"
```

- 期待値: HTTP 200 + Sheets サマリー JSON。staging 環境の `GOOGLE_SHEETS_SA_JSON` が UT-25 で配置済みのため認証フローが成立する。
- ログ確認: `wrangler tail --env staging` で `event=sheets_smoke_test status=success latency_ms=<N>` が出ること。

### ステップ 6: 401 / 403 / 429 エラー分類確認

```bash
# 401: 無効トークン
curl -i -X GET "${STAGING_URL}/admin/smoke/sheets" -H "Authorization: Bearer invalid-token"
# 期待: HTTP 401 + { "error_code": "smoke_unauthorized" }

# 403: SA 未共有の dummy spreadsheetId（環境変数 override で再現 / staging には影響させない）
# ローカルで `SHEETS_SPREADSHEET_ID=<未共有 id>` を一時設定して再起動 → curl
# 期待: HTTP 403 + { "error_code": "sheets_permission_denied", "hint": "see troubleshooting-runbook.md" }

# 429: 観測ベース。連続呼び出しで quota が当たらなければ N/A として記録する
```

## 403 切り分け runbook（`troubleshooting-runbook.md` 必須記載 4 ステップ）

| ステップ | 観点 | 観測コマンド | 修復アクション |
| --- | --- | --- | --- |
| 1 | Service Account 共有設定 | `bash scripts/cf.sh d1` ではなく Sheets「共有」UI / Drive API で SA email が viewer 以上に含まれるか確認 | Sheets を SA email（`*-iam@*.gserviceaccount.com`）に viewer 共有 |
| 2 | `GOOGLE_SHEETS_SA_JSON` の改行コード | Workers ログには secret 値・長さ・`client_email` を出さず、JSON parse 成否、鍵形式判定結果、非可逆 fingerprint（例: SHA-256 先頭 8 桁のみ）だけを出力する。`\n` が `\\n` に二重エスケープされている疑いはローカルの一時診断で確認し、成果物には残さない | 1Password の secure-note を再生成し、値を永続ファイル・ログ・PR に残さない対話入力または `scripts/cf.sh` の揮発的注入経路で `secret put` する |
| 3 | Sheets API 有効化 | GCP コンソール `APIs & Services > Enabled APIs` に Google Sheets API v4 が含まれるか確認 | `gcloud services enable sheets.googleapis.com --project=<project-id>` |
| 4 | `formId` vs `spreadsheetId` 取り違え | `.dev.vars` / wrangler env vars の `SHEETS_SPREADSHEET_ID` を確認。値が `1xxxx` で始まるか（formId は `119ec...` で本タスクの spreadsheetId とは別物） | Forms「回答」タブ → スプレッドシート連携 → URL `/d/<spreadsheetId>/edit` を取得し再設定 |

> 各ステップは「単独で観測 → 単独で修復」できるように分離する。複数を一度に変更すると原因が再特定不能になるため禁止。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | test-strategy.md の手動 smoke 観点を本 Phase の手順に落とし込み |
| Phase 7 | AC matrix の smoke 列に本 Phase の証跡パスを記入（AC-1〜AC-7 / AC-9） |
| Phase 9 | 自動テスト結果サマリー（unit / contract / authorization）を本 Phase の `manual-smoke-log.md` 末尾に転記 |
| Phase 12 | smoke 実行で判明した運用知見を `unassigned-task-detection.md` / `skill-feedback-report.md` に登録 |
| 関連タスク | UT-09 / UT-10 へ「実 API 疎通成立」を伝達 |

## 自動テスト結果サマリー（Phase 9 から転記、本 Phase の主証跡ソース）

| 種別 | テスト数 | PASS | FAIL | 主な検証対象 |
| --- | --- | --- | --- | --- |
| unit (token cache / error mapping) | TBD | TBD | TBD | キャッシュ TTL / 401/403/429 分類 |
| contract (sheets-fetcher.ts client) | TBD | TBD | TBD | UT-03 認証 client の再利用契約 |
| smoke (local / staging) | TBD | TBD | TBD | end-to-end 200 取得 |
| authorization (Bearer / no token / wrong token) | TBD | TBD | TBD | dev 限定 smoke route 認可境界 |

> **本 Phase の証跡の主ソースは自動テストと手動 smoke 双方**。手動 smoke は実 API 環境での AC 最終確認と 403 切り分け runbook 整備が目的であり、自動テストの代替ではない。

## 多角的チェック観点（AIが判断）

- 価値性: 実 Workers Edge Runtime で Sheets API 200 取得が成立し、UT-09 着手前提が満たされたか。
- 実現性: ローカル `wrangler dev` と staging の双方で疎通が確認できているか。
- 整合性: AC-1〜AC-9 の証跡パスが Phase 7 AC matrix と一致しているか。
- 運用性: 403 切り分け runbook が「単独観測 / 単独修復」で再現可能になっているか。
- 認可境界: smoke route が dev / staging のみで応答し、production では 404 または disabled になるか。
- Secret hygiene: `manual-smoke-log.md` に SA JSON / Bearer / `private_key` / `client_email` / spreadsheetId 実値が漏洩していないか（マスク必須）。
- 不変条件 #5: smoke route が `apps/api` 内に閉じ、`apps/web` から呼ばれていないか。
- production 書き込み禁止: write 系 API（`spreadsheets.values.update` / `append` 等）が一切呼ばれていないこと。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local `wrangler dev` 起動確認 | 11 | spec_created | remote/preview モード使用 |
| 2 | local smoke route HTTP 200 確認 | 11 | spec_created | cache miss |
| 3 | local cache hit 確認 | 11 | spec_created | 2 回目 OAuth fetch skip |
| 4 | staging deploy（read-only） | 11 | spec_created | production 禁止 |
| 5 | staging smoke route 疎通 | 11 | spec_created | wrangler tail でログ確認 |
| 6 | 401/403/429 エラー分類確認 | 11 | spec_created | 429 は N/A 可 |
| 7 | troubleshooting-runbook 4 ステップ整備 | 11 | spec_created | 単独観測/単独修復 |
| 8 | 自動テスト結果サマリー転記 | 11 | spec_created | Phase 9 から |

## manual evidence（実装後に採取するログの placeholder / NON_VISUAL）【必須】

| 項目 | コマンド | 採取先 | マスク対象 | 採取済 |
| --- | --- | --- | --- | --- |
| wrangler dev 起動ログ | `pnpm wrangler dev` | manual-smoke-log.md §1 | none | TBD |
| local smoke 1 回目 | `curl /admin/smoke/sheets` | manual-smoke-log.md §2 | Bearer / spreadsheetId | TBD |
| local smoke 2 回目（cache hit） | `curl ... | jq '.tokenCache'` | manual-smoke-log.md §3 | Bearer | TBD |
| staging deploy | `bash scripts/cf.sh deploy --env staging` | manual-smoke-log.md §4 | API token | TBD |
| staging smoke | `curl ${STAGING_URL}/admin/smoke/sheets` | manual-smoke-log.md §5 | Bearer / URL host | TBD |
| staging tail ログ | `wrangler tail --env staging` | manual-smoke-log.md §6 | private_key / client_email | TBD |
| 401 観測 | curl 不正 token | manual-smoke-log.md §7 | none | TBD |
| 403 観測 + runbook 適用 | curl 未共有 spreadsheetId | manual-smoke-log.md §8 + troubleshooting-runbook.md | spreadsheetId | TBD |
| 429 観測 or N/A 宣言 | quota 観測ベース | manual-smoke-log.md §9 | none | TBD |

> 各セクションには「コマンド」「実行日時」「stdout / stderr 抜粋」「期待値との一致 / 不一致」を記録する。SA JSON / Bearer / private_key / client_email / 完全な spreadsheetId は必ずマスクする。

## 既知制限リスト【必須】

| # | 制限 | 影響範囲 | 委譲先 / 補足 |
| --- | --- | --- | --- |
| 1 | `wrangler dev --local` では外部 fetch 制約により Sheets API へ届かないケースがある | local smoke 失敗時の切り分け | remote / preview モード（`--local` 無し）に切替 |
| 2 | アクセストークン TTL 1 時間 / Workers isolate 再起動でキャッシュ消失 | cache hit 観測の再現性 | 同一 isolate 内 2 回目で観測。複数 isolate 跨ぎは out-of-scope |
| 3 | 429 は project 共有 quota であり常に再現できない | レート制限ハンドリング検証 | 観測できない場合は N/A 宣言。完全検証は UT-10 に委譲 |
| 4 | staging spreadsheetId は production と同じ Google Sheets を read-only で参照する | staging に独立データソースなし | write は一切行わない。read-only 制約で安全担保 |
| 5 | production 環境への deploy は本 Phase で禁止 | production 疎通の未検証 | UT-09 実装後に production deploy 時の post-deploy smoke で再確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ログ | outputs/phase-11/manual-smoke-log.md | 9 セクション分の実行ログ（コマンド / stdout / stderr / マスク済） |
| Runbook | outputs/phase-11/troubleshooting-runbook.md | 403 切り分け 4 ステップ（SA 共有 / JSON 改行 / Sheets API / spreadsheetId） |
| メタ | artifacts.json | Phase 11 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] `outputs/phase-11/manual-smoke-log.md` と `outputs/phase-11/troubleshooting-runbook.md` の 2 ファイルが揃っている
- [ ] manual evidence テーブルの 9 項目すべての採取列が完了（または各 N/A 理由が記載）
- [ ] local + staging の双方で smoke route が HTTP 200 を返している
- [ ] cache hit が `tokenCache=hit` で観測されている
- [ ] 401 / 403 のエラー分類が確認され、429 は観測 or N/A 宣言済み
- [ ] troubleshooting-runbook が 4 ステップで「観測 / 修復」分離されている
- [ ] 自動テスト結果サマリー（unit / contract / smoke / authorization）が転記されている
- [ ] 既知制限が 5 項目以上列挙され、それぞれ委譲先または補足が記述されている
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）
- [ ] production 環境への deploy / write が一切発生していないことが宣言されている
- [ ] ログに SA JSON / Bearer / private_key / client_email の平文が含まれていない

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 2 ファイルが `outputs/phase-11/` 配下に配置される設計になっている
- AC-1〜AC-9 の証跡採取コマンドが定義済み
- 403 切り分け 4 ステップが runbook に固定済み
- production 書き込み禁止が明文化
- artifacts.json の `phases[10].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - smoke 実行で得られた運用知見を Phase 12 の `unassigned-task-detection.md` / `skill-feedback-report.md` に渡す
  - troubleshooting-runbook の 4 ステップを `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` への追記候補として system-spec-update-summary に登録
  - 自動テスト結果サマリーを `system-spec-update-summary.md` の影響範囲に転記
  - UT-09 / UT-10 への「実 API 疎通成立」signal を documentation-changelog で記録
- ブロック条件:
  - manual evidence の 9 項目に未採取 / 未 N/A 化が残っている
  - production 環境への deploy / write が観測された（→ 即時停止 / Phase 5 / 12 secret hygiene 再確認）
  - `screenshots/` ディレクトリが誤って作成されている
  - SA JSON / Bearer / private_key の平文がログに残っている
