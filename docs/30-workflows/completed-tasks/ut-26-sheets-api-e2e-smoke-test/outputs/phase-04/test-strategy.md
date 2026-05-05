# UT-26 Phase 4 成果物 — test-strategy.md

| 項目 | 値 |
| --- | --- |
| タスク | Sheets API エンドツーエンド疎通確認 (UT-26) |
| Phase | 4 / 13（テスト戦略） |
| 作成日 | 2026-04-29 |
| 状態 | spec_created |
| visualEvidence | NON_VISUAL |

---

## 1. 目的

UT-03 の fetch mock ベース ユニットテストと、本タスクで追加する **実 API 疎通 (smoke)** の責務を明確に分離し、Phase 5 実装着手前に必要な 4 区分の検証スイート（unit / contract / smoke / authorization）を確定する。本 Phase 完了時点で、Phase 5 で「どのテストを Red にして Green に倒すか」「どこまでが mock テストの範囲で、どこからが staging 実 API smoke の責務か」が一意に決まる状態にする。

---

## 2. 4 区分のテスト設計

### 2.1 unit テスト（純粋ロジック / mock fetch）

| 対象モジュール | 手法 | 合格基準 | テストファイル |
| --- | --- | --- | --- |
| `apps/api/src/jobs/sheets-fetcher.ts` (UT-03 既存) | vitest + fetch mock | JWT claim 構造 / token cache TTL / 401/403 分類 / `\n` 改行正規化 | `apps/api/test/jobs/sheets-fetcher.test.ts` (UT-03 既存) |
| `apps/api/src/routes/admin/smoke-sheets.ts` (新規) | vitest + Hono test client + miniflare | handler 入出力契約 / `SMOKE_ADMIN_TOKEN` 検証分岐 / production 環境では 404 / 構造化ログ出力フォーマット | `apps/api/test/routes/admin/smoke/sheets.test.ts` |
| `apps/api/src/lib/smoke/format-result.ts` (新規) | vitest 純粋関数 | sheetTitle / rowCount の整形、PII redact、spreadsheetId 末尾 4 桁化 | `apps/api/test/lib/smoke/format-result.test.ts` |
| `apps/api/src/lib/smoke/error-mapper.ts` (新規) | vitest 純粋関数 | 401/403/404/429/5xx/parse/network → `SmokeErrorCode` 正規化 | `apps/api/test/lib/smoke/error-mapper.test.ts` |
| `apps/api/src/lib/smoke/env-guard.ts` (新規) | vitest 純粋関数 | `env.ENVIRONMENT === "production"` で notFound | `apps/api/test/lib/smoke/env-guard.test.ts` |

### 2.2 contract テスト（外部 I/F 契約 / mock fetch）

| 対象 | 手法 | 合格基準 |
| --- | --- | --- |
| Google OAuth 2.0 token endpoint | mock fetch | `POST https://oauth2.googleapis.com/token` body=`grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=<JWT>`、レスポンス `{access_token, expires_in, token_type:"Bearer"}` を満たす |
| Sheets API `spreadsheets.values.get` | mock fetch | `GET /v4/spreadsheets/{id}/values/{range}` レスポンス `{range, majorDimension, values: string[][]}` の parse、空シート時 `values` undefined 対応 |
| smoke route `GET /admin/smoke/sheets` | Hono test client | request: `Authorization: Bearer <SMOKE_ADMIN_TOKEN>` / response: `{ok, env, spreadsheetId_tail4, sheetTitle, rowCount, latencyMs, tokenFetchesDuringSmoke}` のスキーマ |
| token cache 契約 | vitest sequential | 2 回目以降の呼び出しで OAuth fetch が省略され、`tokenFetchesDuringSmoke=true` がレスポンスに反映 |

### 2.3 smoke テスト（実 API / staging only / 手動）

| ケース | 環境 | 手法 | 合格基準 | 記録先 |
| --- | --- | --- | --- | --- |
| success path | staging | `curl -H "Authorization: Bearer <token>" https://api-staging.../admin/smoke/sheets` | HTTP 200、`{ok:true, sheetTitle, rowCount>=0}`、Workers Logs に `event=sheets_smoke_test status=success` | `outputs/phase-11/manual-smoke-log.md` |
| token cache hit | staging | 同 curl を 1 秒以内に 2 回連続 | 2 回目 `tokenFetchesDuringSmoke=true`、Logs から OAuth token endpoint への fetch が 1 回のみ | 同上 |
| local 疎通 | wrangler dev (--remote) | `curl http://127.0.0.1:8787/admin/smoke/sheets ...` | staging と同等の 200 応答 | 同上 |

### 2.4 authorization テスト（smoke route 認可境界）

| ケース | 期待 | 区分 |
| --- | --- | --- |
| `Authorization: Bearer <SMOKE_ADMIN_TOKEN>` 一致 (dev/staging) | 200 + 疎通実行 | unit |
| ヘッダ無し | 401 | unit |
| token mismatch | 401 | unit |
| production 環境 (`env.ENVIRONMENT === "production"`) からの呼び出し | 404（route 未マウント or env-guard） | unit |

---

## 3. mock テストと実 API smoke の責務分離（NON_VISUAL）

| 検証対象 | UT-03 fetch mock | UT-26 smoke (実 API) |
| --- | --- | --- |
| JWT claim 構造（iss/scope/aud/exp/iat） | ◯ 担当 | × |
| Web Crypto API による RSA-SHA256 署名（実機動作） | × | ◯ 担当（Workers Edge Runtime 上で実行） |
| OAuth 2.0 token endpoint への HTTPS 通信 | × | ◯ 担当 |
| token cache TTL ロジック | ◯ 担当（純粋ロジック） | △ 2 回連続呼び出しで間接確認 |
| `spreadsheets.values.get` レスポンス parse | ◯ 担当 | × |
| 実スプレッドシートからのデータ取得 | × | ◯ 担当 |
| 401 / 403 / 429 の status code 分類ロジック | ◯ 担当 | △ 異常系シナリオで 1 件以上実観測（Phase 6 / 11） |
| SA 共有未設定時の 403 PERMISSION_DENIED 切り分け | × | ◯ 担当（troubleshooting-runbook） |
| 構造化ログのスキーマ（フィールド名・redact） | ◯ 担当 | △ Workers Logs で実機確認 |

> **重複ゼロ宣言**: smoke テストは「Workers Edge Runtime 上の実 HTTPS 通信」と「実スプレッドシートからのデータ取得」のみを責務とし、JWT 構造や cache ロジックの再検証は行わない。AC のうち実機性質を持つものだけが smoke の責務に置かれる。

---

## 4. AC-1〜AC-11 のトレース対応表

| AC | 内容（要旨） | 主担当区分 | 補助区分 | テスト / 検証手段 |
| --- | --- | --- | --- | --- |
| AC-1 | staging から `values.get` が HTTP 200 | smoke | contract | smoke success path / contract OAuth + Sheets |
| AC-2 | JWT → token → API の e2e が Workers 上で動作 | smoke | unit (UT-03) | smoke success path（実機）+ UT-03 既存 unit |
| AC-3 | 対象 Sheets から値取得・サマリー記録 | smoke | unit | smoke success path + format-result unit |
| AC-4 | token cache が 2 回目以降で OAuth fetch を省略 | smoke + contract | unit | smoke cache hit case + token cache contract test |
| AC-5 | 401/403/429 のエラー分類とログ | unit + contract | smoke | error-mapper unit + smoke 異常系（Phase 6 / 11）|
| AC-6 | ローカル `wrangler dev` で同等疎通 | smoke | - | smoke local 疎通 case |
| AC-7 | 疎通結果が verification-report に記録 | smoke | - | `outputs/phase-11/manual-smoke-log.md` への記録 |
| AC-8 | SA JSON が平文残らず redact 完備 | unit | smoke | format-result redact unit + PR `rg` 検証 |
| AC-9 | 403 切り分け runbook 化 | smoke (runbook) | - | `outputs/phase-11/troubleshooting-runbook.md` |
| AC-10 | UT-09 が安全にアクセス可能とマーク | smoke | - | Phase 11 完了後に Phase 12 で記録 |
| AC-11 | 4 条件最終判定 PASS | - | - | Phase 10 go-no-go.md |

---

## 5. fetch mock と実機 smoke の責務分離（NON_VISUAL）

NON_VISUAL の本タスクでは、screenshots / Playwright などの UI E2E は採用しない。代わりに以下の 2 系統を**明確に区別**する。

| 系統 | 実行環境 | 判定材料 | 失敗時の切り分け |
| --- | --- | --- | --- |
| fetch mock 系 | Node + vitest（CI / ローカル） | 純粋ロジック / レスポンス parse / 認可分岐 | unit / contract が Red → 実装ロジック修正 |
| 実機 smoke 系 | Workers Edge Runtime（wrangler dev --remote / staging deploy） | 実 HTTPS 通信 + 実 SA 認証 + 実 spreadsheet データ | smoke が Red → SA 共有 / API 有効化 / spreadsheetId / network のいずれかを Phase 11 runbook で切り分け |

切り分けが曖昧になることを防ぐため、**smoke 失敗時にまず unit / contract を疑わない**ルールを runbook に明記する。Workers Logs の `event=sheets_smoke_test` エントリが構造化されている限り、原因は実機側にあると判断できる。

---

## 6. Vitest targeted run のファイルパス（SIGKILL 回避）

本タスクで実行するテストファイルは以下のみ。広域 `pnpm vitest run` は monorepo 全走で SIGKILL リスクのため使用禁止。

```
apps/api/test/routes/admin/smoke/sheets.test.ts
apps/api/test/lib/smoke/format-result.test.ts
apps/api/test/lib/smoke/error-mapper.test.ts
apps/api/test/lib/smoke/env-guard.test.ts
```

実行例:

```bash
mise exec -- pnpm --filter ./apps/api vitest run \
  apps/api/test/routes/admin/smoke/sheets.test.ts \
  apps/api/test/lib/smoke/format-result.test.ts \
  apps/api/test/lib/smoke/error-mapper.test.ts \
  apps/api/test/lib/smoke/env-guard.test.ts
```

---

## 7. 事前ビルドチェック（esbuild darwin mismatch 防止 / Step 0）

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter ./apps/api build
mise exec -- pnpm --filter ./apps/api vitest run apps/api/test/routes/admin/smoke/sheets.test.ts
```

> Phase 5 runbook の Step 0 として予約。

---

## 8. coverage 計測 allowlist（変更ファイル限定）

```
apps/api/src/routes/admin/smoke-sheets.ts
apps/api/src/routes/admin/smoke/index.ts
apps/api/src/middlewares/admin-smoke-auth.ts
apps/api/src/lib/smoke/env-guard.ts
apps/api/src/lib/smoke/sheets-smoke-client.ts
apps/api/src/lib/smoke/error-mapper.ts
apps/api/src/lib/smoke/format-result.ts
```

- 目標: line 80%+ / branch 70%+
- 既存 `apps/api/src/jobs/sheets-fetcher.ts` は UT-03 のスコープのため本タスクの allowlist に含めない（広域指定禁止）。

---

## 9. staging 疎通 test case matrix（success / 401 / 403 / 429）

| Case | 前提 | 操作 | 期待 | 検証手段 | 記録先 |
| --- | --- | --- | --- | --- | --- |
| success | SA 共有済 / Secret 配置済 | `GET /admin/smoke/sheets` | 200 / `{ok:true}` | smoke + Workers Logs | `outputs/phase-11/manual-smoke-log.md` |
| 401 | 無効 access token を強制注入（Phase 6 で `?injectInvalidToken=1` dev-only flag）| 同 GET | 502 + `code:SHEETS_AUTH_FAILED` | smoke (dev only) + unit | `outputs/phase-11` |
| 403 | SA 共有を一時的に外す or 別 spreadsheetId | 同 GET | 502 + `code:SHEETS_FORBIDDEN` + 切り分け hints | smoke 手動 | `outputs/phase-11/troubleshooting-runbook.md` |
| 429 | quota 超過再現困難なため、unit/contract で `fetch` mock | unit + contract | 503 + `Retry-After` の解釈 | unit / contract | `apps/api/test/...` |

---

## next: Phase 5 へ引き渡す事項

- **targeted vitest ファイルパス 4 件** → runbook の Red サイクル（Step 2）で使用
- **事前ビルドチェック** → Step 0 として予約
- **smoke matrix（success/401/403/429）** → Phase 6 異常系 / Phase 11 手動 smoke へ wire-in
- **coverage allowlist** → Phase 9 で実測、変更ファイル限定で広域指定禁止
- **責務分離（mock vs smoke）の重複ゼロ宣言** → Phase 6 / Phase 11 で「smoke 失敗時にまず unit を疑わない」ルールとして再利用
