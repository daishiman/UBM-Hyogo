# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets API エンドツーエンド疎通確認 (UT-26) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-04-29 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | spec_created |
| タスク分類 | specification-design（test-strategy） |

## 目的

UT-03 で実装済みの fetch mock ベースのユニットテスト（`apps/api/src/jobs/sheets-fetcher.test.ts`）と、本タスクで追加する実 API 疎通 (smoke) の責務を明確に分離し、Phase 5 実装着手前に必要な 4 層の検証スイート（unit / contract / smoke / authorization）を確定する。本 Phase が完了した時点で、Phase 5 では「どのテストを Red にして Green に倒すか」「どこまでが mock テストの範囲で、どこからが staging 実 API smoke の責務か」が一意に決まり、success path / 401 / 403 / 429 を漏れなく検証できる状態にする。

## 真の論点

- mock テスト（UT-03 で済）と実 API smoke（本タスク）の境界が曖昧だと、staging 疎通失敗時に「mock を疑うべきか実 API を疑うべきか」が分からなくなる。本 Phase で責務分離 contract を成果物として固定する。
- staging で疎通成功させる test case matrix（success path / 401 / 403 / 429）を網羅し、Phase 6 異常系検証 / Phase 11 手動 smoke へ wire-in する。

## 実行タスク

1. 4 層の検証スイート（unit / contract / smoke / authorization）の対象モジュールと観点を確定する（完了条件: スイート × 対象モジュールのマトリクスに空セル無し）。
2. mock テストと実 API smoke の責務分離 contract を表形式で確定する（完了条件: UT-03 fetch mock の責務 / 本タスク smoke の責務 / 重複ゼロが宣言される）。
3. staging で疎通成功させる test case matrix（success / 401 / 403 / 429）を確定する（完了条件: 4 ケースすべてに前提条件・操作・期待結果・記録方法が記載）。
4. Vitest targeted run のテストファイルパスを事前列挙する（完了条件: `apps/api/test/routes/admin/smoke/sheets.test.ts` 等のフルパスで列挙、広域実行を排除）。
5. coverage 計測の allowlist を変更ファイル限定で確定する（完了条件: smoke route 実装ファイルのみが allowlist）。
6. 事前ビルドチェック（`pnpm install` + `pnpm --filter ./apps/api build`）を Red サイクル前の Step 0 として確定する（完了条件: esbuild darwin mismatch 対策が runbook 化）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/phase-02.md | smoke route / cache / error mapping 設計 |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/phase-03.md | base case と open question |
| 必須 | docs/30-workflows/unassigned-task/UT-03-sheets-api-auth-setup.md | 既存 fetch mock テストの責務範囲 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | smoke route 認可基準 |
| 参考 | https://vitest.dev/guide/coverage.html | coverage 設定 |
| 参考 | https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get | Sheets API v4 契約 |

## 検証スイート設計（4 層）

### 1. unit テスト（純粋ロジック単位 / mock fetch）

| 対象モジュール | テスト観点 | 想定ファイル | 主担当 |
| --- | --- | --- | --- |
| `apps/api/src/jobs/sheets-fetcher.ts`（既存） | JWT claim 構造、token cache TTL、401/403 分類、改行コード（`\n`）の正規化 | `apps/api/src/jobs/sheets-fetcher.test.ts`（UT-03 既存） | UT-03 完了済 |
| `apps/api/src/routes/admin/smoke-sheets.ts`（新規） | handler の入出力契約、`SMOKE_ADMIN_TOKEN` 検証分岐、production 環境では 404/disabled、構造化ログ出力フォーマット | `apps/api/test/routes/admin/smoke/sheets.test.ts` | 本タスク |
| `apps/api/src/lib/smoke/format-result.ts`（新規 or inline） | レスポンスサマリー（sheetTitle / rowCount / sample のマスキング）の純粋関数 | `apps/api/test/lib/smoke/format-result.test.ts` | 本タスク |

### 2. contract テスト（外部 I/F 契約 / mock fetch）

| 対象 | 検証内容 |
| --- | --- |
| Google OAuth 2.0 token endpoint 契約 | `POST https://oauth2.googleapis.com/token` body=`grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=<JWT>`、レスポンス `{access_token, expires_in, token_type}` |
| Sheets API `spreadsheets.values.get` 契約 | `GET /v4/spreadsheets/{id}/values/{range}` レスポンス `{range, majorDimension, values: string[][]}`、空シート時 `values` undefined |
| smoke route `GET /admin/smoke/sheets` 契約 | request: `Authorization: Bearer <SMOKE_ADMIN_TOKEN>`、response: `{ok: true, env, spreadsheetId(末尾4桁), sheetTitle, rowCount, sampleRowsRedacted, latencyMs, tokenFetchesDuringSmoke}` |
| token cache 契約 | 2 回目以降の呼び出しで OAuth fetch が省略され、`tokenFetchesDuringSmoke=true` がレスポンスに反映 |

### 3. smoke テスト（実 API / staging only / 手動）

| ケース | 環境 | 操作 | 期待結果 | 記録 |
| --- | --- | --- | --- | --- |
| success path | staging | `curl -H "Authorization: Bearer <token>" https://api.example.com/admin/smoke/sheets` | HTTP 200、`{ok:true, sheetTitle, rowCount>=0}`、Workers Logs に `event=sheets_smoke_test status=success latency_ms=<n>` | `outputs/phase-11/manual-smoke-log.md` |
| token cache hit | staging | 同 curl を 1 秒以内に 2 回連続実行 | 2 回目 `tokenFetchesDuringSmoke=true`、Workers Logs から OAuth token endpoint への fetch が 1 回のみ | 同上 |
| ローカル | wrangler dev (remote mode) | `curl http://127.0.0.1:8787/admin/smoke/sheets -H "Authorization: Bearer ..."` | staging と同等の 200 応答 | 同上 |

### 4. authorization テスト（smoke route 認可境界）

| ケース | 期待 | 想定 |
| --- | --- | --- |
| `Authorization: Bearer <SMOKE_ADMIN_TOKEN>` 一致（dev/staging） | 200 + 疎通実行 | unit |
| ヘッダ無し | 401 | unit |
| token mismatch | 401 | unit |
| production 環境（`env.ENVIRONMENT === "production"`）からの呼び出し | 404 もしくは route 未マウント | unit |

## mock テストと実 API smoke の責務分離

| 検証対象 | UT-03 fetch mock テスト | 本タスク smoke テスト |
| --- | --- | --- |
| JWT claim 構造（iss/scope/aud/exp/iat） | ◯ 担当 | × |
| Web Crypto API による RSA-SHA256 署名（実機動作） | × | ◯ 担当（Workers Edge Runtime 上で実行） |
| OAuth 2.0 token endpoint への HTTPS 通信 | × | ◯ 担当 |
| token cache TTL ロジック | ◯ 担当（純粋ロジック） | △ 2 回連続呼び出しで間接確認 |
| `spreadsheets.values.get` レスポンス parse | ◯ 担当 | × |
| 実スプレッドシートからのデータ取得 | × | ◯ 担当 |
| 401 / 403 / 429 の status code 分類ロジック | ◯ 担当 | △ 異常系シナリオで 1 件以上実観測（Phase 6 / 11） |
| SA 共有未設定時の 403 PERMISSION_DENIED 切り分け | × | ◯ 担当（troubleshooting runbook） |

> 重複ゼロ宣言: smoke テストは「Workers Edge Runtime 上の実 HTTPS 通信」と「実スプレッドシートからのデータ取得」のみを責務とし、JWT 構造や cache ロジックの再検証は行わない。

## staging 疎通 test case matrix（success / 401 / 403 / 429）

| Case | 前提 | 操作 | 期待 | 検証手段 | 記録先 |
| --- | --- | --- | --- | --- | --- |
| success | SA 共有済 / Secret 配置済 | `GET /admin/smoke/sheets` | 200 / `{ok:true}` | smoke + Workers Logs | `outputs/phase-11/manual-smoke-log.md` |
| 401 | 無効 access token を強制注入（Phase 6 で `?injectInvalidToken=1` 等の dev only flag） | 同 GET | 401 + `code:SHEETS_AUTH_FAILED` | smoke（dev 限定 flag） | `outputs/phase-11` |
| 403 | SA 共有を一時的に外す or 別 spreadsheetId を指定 | 同 GET | 403 + `code:SHEETS_FORBIDDEN` + 切り分け hints をログ出力 | smoke 手動 | `outputs/phase-11/troubleshooting-runbook.md` |
| 429 | Sheets API quota 超過の再現は困難なため、`fetch` を mock した unit/contract で確認 | unit + contract | 429 + `retry-after` header の解釈 | unit / contract | `apps/api/test/...` |

## Vitest targeted run のファイルリスト（SIGKILL 回避）

- 本タスク関連のみ:
  - `apps/api/test/routes/admin/smoke/sheets.test.ts`
  - `apps/api/test/lib/smoke/format-result.test.ts`（純粋関数を切り出す場合）
- 実行例: `mise exec -- pnpm --filter ./apps/api vitest run apps/api/test/routes/admin/smoke/sheets.test.ts`
- 広域 `vitest run` は monorepo 全走で SIGKILL リスクのため避ける。

## 事前ビルドチェック（esbuild darwin mismatch 防止）

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter ./apps/api build
mise exec -- pnpm --filter ./apps/api vitest run apps/api/test/routes/admin/smoke/sheets.test.ts
```

## coverage 計測

- 対象 allowlist（変更ファイルのみ）:
  - `apps/api/src/routes/admin/smoke-sheets.ts`
  - `apps/api/src/lib/smoke/format-result.ts`（新規切り出し時のみ）
- 目標: line 80%+ / branch 70%+
- 既存 `apps/api/src/jobs/sheets-fetcher.ts` は UT-03 のスコープのため本タスクの allowlist に含めない（広域指定禁止）。

## 実行手順

1. 4 層スイートのマトリクスを `outputs/phase-04/test-strategy.md` に転記する。
2. mock vs smoke の責務分離表を Phase 5 / Phase 6 から参照可能な形に整える。
3. staging test case matrix を Phase 11 手動 smoke の入力として予約する。
4. Vitest targeted run のフルパスを Phase 5 runbook に渡す。
5. coverage allowlist を vitest 設定 draft として記述する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | テストファイルパスを runbook の Red サイクルへ連結 |
| Phase 6 | 401/403/4210 ケースを failure case と相互参照 |
| Phase 7 | AC × 検証手段のトレース表に流し込み |
| Phase 9 | coverage 実測値を allowlist に対して取得 |
| Phase 11 | smoke スイートの 3 ケース（success / 2 回連続 / wrangler dev）を再実行 |

## 多角的チェック観点

- 価値性: 4 層スイートで AC-1〜AC-11 をすべてカバーするか。
- 実現性: smoke route の Web Crypto 署名が実機で通るか（Phase 11 で確定）。
- 整合性: UT-03 の既存 fetch mock テストと本タスクの責務が重複していないか。
- 運用性: targeted run でローカル / CI 両方が SIGKILL せず通るか。
- 認可境界: production からの呼び出しは route 未マウント or 404 で確実に拒否されるか。
- セキュリティ: SA JSON / access token がテストログ・スナップショットに残らないか（マスキング検証 1 件以上）。

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | unit スイート 3 件定義 | spec_created | 既存 + 新規 2 件 |
| 2 | contract スイート 4 件定義 | spec_created | OAuth / Sheets / smoke route / cache |
| 3 | smoke スイート 3 ケース定義 | spec_created | success / cache hit / wrangler dev |
| 4 | authorization スイート 4 ケース定義 | spec_created | production 拒否含む |
| 5 | mock vs smoke 責務分離表確定 | spec_created | 重複ゼロ宣言 |
| 6 | staging test case matrix（4 ケース）確定 | spec_created | success/401/403/429 |
| 7 | targeted vitest パス列挙 | spec_created | 2 ファイル |
| 8 | 事前ビルドチェック手順確定 | spec_created | Red Step 0 |
| 9 | coverage allowlist 確定 | spec_created | 変更ファイルのみ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/test-strategy.md | 4 層スイート設計・責務分離表・staging matrix・targeted run・coverage allowlist |
| メタ | artifacts.json | Phase 4 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 4 層スイート × 対象モジュールのマトリクスに空セル無し
- [ ] mock テストと実 API smoke の責務分離が重複ゼロで宣言されている
- [ ] staging test case matrix（success / 401 / 403 / 429）の 4 ケースが完成
- [ ] targeted vitest ファイルパスが 2 件以上列挙
- [ ] coverage allowlist が変更ファイル限定（広域指定禁止）
- [ ] 事前ビルドチェックが Red 実行前の Step 0 に予約
- [ ] AC-1〜AC-11 すべてに 1 件以上の検証手段が割り当てられている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物パスが `outputs/phase-04/test-strategy.md` に固定済み
- AC-1〜AC-11 すべてに対応するスイートが存在
- production 書き込み禁止の前提が test ケース全件に貫通
- artifacts.json の `phases[3].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック)
- 引き継ぎ事項:
  - targeted vitest ファイルパス → runbook の Red サイクル
  - 事前ビルドチェック → Step 0 として予約
  - smoke matrix（success/401/403/429）→ Phase 6 異常系 / Phase 11 手動 smoke
  - coverage allowlist → Phase 9 で実測
- ブロック条件:
  - mock vs smoke の責務分離表に重複が残る
  - staging matrix が 4 ケース未満
  - targeted run でも SIGKILL するなら Phase 5 着手不可
