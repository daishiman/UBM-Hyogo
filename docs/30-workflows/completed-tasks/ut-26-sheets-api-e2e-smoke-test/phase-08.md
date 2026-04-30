# Phase 8: DRY 化 / リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets API エンドツーエンド疎通確認 (UT-26) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 / リファクタリング |
| 作成日 | 2026-04-29 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |
| タスク分類 | specification-design（refactoring / dry） |

## 目的

Phase 1〜7 で確定した要件・設計・実装ランブック・異常系・AC マトリクスに対し、UT-26 が新規追加する smoke route / smoke script の命名・型・パス・エンドポイント表記を統一し、UT-03 の `sheets-fetcher.ts` 既存実装と重複した認証ロジックを再実装しない方針を Phase 9 以降に持ち越さない状態で固定する。本タスクは新規 smoke route の追加のみで既存コードの破壊的変更を伴わないため、DRY 化の主眼は「(a) UT-03 認証 client の再利用契約の明文化」「(b) 新規追加箇所の命名・path・endpoint の単一表記化」「(c) artifacts.json / index.md / phase-XX.md 間の navigation drift 解消」の 3 点に絞る。

## 実行タスク

1. Phase 1〜7 の仕様書 / outputs path / artifacts.json を横断 grep し、新規追加対象（smoke route / smoke script / 環境変数 / Secret 名）の命名揺れを洗い出す（完了条件: 揺れ件数が表化されている）。
2. UT-03 の `apps/api/src/jobs/sheets-fetcher.ts` から再利用する API（`getAccessToken` 等）を一覧化し、再実装禁止対象として明記する（完了条件: 再利用 API リストが固定され、再実装禁止が記述されている）。
3. smoke route の URL / メソッド / 認可方式の表記を全 Phase で統一する（完了条件: `GET /admin/smoke/sheets` + Bearer `SMOKE_ADMIN_TOKEN` で全 Phase 一致）。
4. 新規追加ファイル（smoke route handler / smoke script / 環境変数の置き場）の単一定義先を確定する（完了条件: 重複候補が 0）。
5. artifacts.json の outputs path と各 phase-XX.md の参照 path が一致するか確認する（完了条件: 不一致 0）。
6. doc 内リンク（`docs/30-workflows/.../phase-XX.md`、`docs/30-workflows/unassigned-task/...`）を辿り、リンク切れが無いか確認する（完了条件: navigation drift 0）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/phase-01.md 〜 phase-07.md | DRY 化対象 |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/artifacts.json | path 整合の起点 |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/index.md | 用語・命名の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | `/admin/*` 命名規約 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | apps/api 境界 |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-08.md | DRY 化観点の参照事例 |

## Before / After 比較テーブル

> 本タスクは新規 smoke route の追加であり、既存コード上の Before（揺れ）はほぼ存在しない。Before 列は「規約上ありうる揺れ / 案出し時に出た揺れ」を仮想的に列挙し、After で単一表記に固定する。

### 命名規則

| 対象 | Before（仮想揺れ / なし） | After | 理由 |
| --- | --- | --- | --- |
| smoke route handler | `smoke.ts` / `smokeSheets.ts` / `sheetsSmoke.ts` の揺れ想定 | `apps/api/src/routes/admin/smoke-sheets.ts` | kebab-case ファイル名 + `admin/smoke/<source>` ディレクトリ |
| smoke script（CLI） | `smoke-sheets.ts` / `sheetsSmokeTest.ts` 揺れ想定 | `apps/api/src/scripts/smoke-test-sheets.ts` | `smoke-test-<source>.ts` 規約（index.md 苦戦箇所継承） |
| route 関数 export | `handleSmoke` / `smokeHandler` | `smokeSheetsHandler`（Hono Handler） | scope を関数名に明記 |
| log event 名 | `smoke_sheets` / `sheetsSmoke` 揺れ | `sheets_smoke_test` | snake_case + 接尾辞 `_test` |
| 環境変数（Variable） | `SHEETS_ID` / `SPREADSHEET_ID` 揺れ | `SHEETS_SPREADSHEET_ID` | UT-25 / index.md と整合 |
| Secret 名 | `SA_JSON` / `GOOGLE_SA_JSON` 揺れ | `GOOGLE_SHEETS_SA_JSON` | UT-25 で確定済み |
| 認可 Secret 名 | `ADMIN_TOKEN` / `SMOKE_TOKEN` 揺れ | `SMOKE_ADMIN_TOKEN` | scope を Secret 名に明記 |

### 型定義

| 対象 | Before（なし） | After | 理由 |
| --- | --- | --- | --- |
| smoke 結果 | adhoc な `{ ok: boolean }` | `SmokeResult { ok, latencyMs, sheetTitle, rowCount, sample, tokenFetchesDuringSmoke }` を `apps/api/src/routes/admin/smoke/types.ts` に集約 | Phase 6 異常系・Phase 11 証跡と一致 |
| エラー分類 | adhoc literal | `SmokeErrorKind = 'auth' \| 'permission' \| 'rate_limit' \| 'network' \| 'unknown'` を types.ts に集約 | Phase 6 / UT-10 引き渡し用 |
| Env binding | adhoc `any` | `Env` interface に `GOOGLE_SHEETS_SA_JSON` `SHEETS_SPREADSHEET_ID` `SMOKE_ADMIN_TOKEN` を必須宣言 | Phase 9 secret hygiene 前提 |

### パス（ファイル配置）

| 対象 | Before（なし） | After | 理由 |
| --- | --- | --- | --- |
| smoke route | （新規） | `apps/api/src/routes/admin/smoke-sheets.ts` | `admin/smoke/<source>` 配下で複数 source 対応に拡張可能 |
| smoke script | （新規） | `apps/api/src/scripts/smoke-test-sheets.ts` | UT-03 同等の scripts/ 配下 |
| 共通型 | （新規） | `apps/api/src/routes/admin/smoke/types.ts` | route 直下で局所化（util に切り出すほどの再利用なし） |
| 認証 client（再利用） | UT-03 が提供 | `apps/api/src/jobs/sheets-fetcher.ts`（再利用のみ） | UT-26 は再実装しない |

### エンドポイント

| 対象 | Before（仮想揺れ） | After | 理由 |
| --- | --- | --- | --- |
| smoke endpoint | `/smoke/sheets` / `/admin/smoke-sheets` / `/admin/sheets/smoke` 揺れ | `GET /admin/smoke/sheets` | api-endpoints.md と Phase 2 設計 / artifacts.json `endpoints[0]` に統一 |
| 認可方式 | header 名揺れ（`X-Smoke-Token` 等） | `Authorization: Bearer <SMOKE_ADMIN_TOKEN>` | RFC 6750 準拠、UT-09 `/admin/sync` と整合 |
| 環境分岐 | adhoc `if (env === 'production')` | `wrangler.toml` の `[env.staging]` のみ route mount + production では `enabled=false` ガード | 不変条件 #5 + 認可境界 |
| バージョニング | `/v1/admin/smoke/sheets` 案 | 未付与（admin route は MVP では暗黙 v1） | 内部 admin、UT-09 と整合 |

## 既存実装との重複回避方針（sheets-fetcher.ts）

UT-03 が提供する認証 client は **再利用のみ** とし、UT-26 では一切再実装しない。

### 再利用 API（UT-03 由来 / import するのみ）

| API | 役割 | UT-26 での扱い |
| --- | --- | --- |
| `getAccessToken(env)` | JWT 生成 → OAuth token 取得 → in-memory cache 返却 | smoke route から直接呼び出し（再実装禁止） |
| `parseServiceAccountJson(env)` | `GOOGLE_SHEETS_SA_JSON` のパース・改行コード復元 | `getAccessToken` 内部で利用（UT-26 は介入しない） |
| `signJwtRS256(claims, privateKey)` | Web Crypto API による RSA-SHA256 署名 | `getAccessToken` 内部で利用（UT-26 は介入しない） |
| `clearTokenCache()`（あれば） | キャッシュ無効化（テスト用） | AC-4 のキャッシュ動作確認時のみ使用 |

### UT-26 が新規実装する（重複しない）責務

| 責務 | 配置 | 既存 API との関係 |
| --- | --- | --- |
| `spreadsheets.values.get` 呼び出し | smoke route 内 fetch | 認証 token は `getAccessToken` から取得 |
| 401/403/429 → `SmokeErrorKind` への mapping | smoke route 内 helper | UT-03 は raw error を投げるのみ。分類は UT-26 で実施 |
| 結果の構造化ログ出力 | smoke route 内 logger 呼び出し | UT-03 とは別レイヤ |
| `SMOKE_ADMIN_TOKEN` 検証 | smoke route ミドルウェア | UT-03 と無関係 |

### 重複コードの抽出可否（候補）

| # | 候補 | 抽出先 | 他タスク転用可否 | 判定 |
| --- | --- | --- | --- | --- |
| 1 | `Authorization: Bearer` 検証 | `apps/api/src/middlewares/admin-auth.ts`（UT-09 で formalize 予定） | 可（UT-09 / UT-21 と共有） | UT-26 単独では切り出さず、UT-09 実装時に併合 |
| 2 | 401/403/429 → kind mapping | `apps/api/src/utils/sheets-error-mapper.ts` | 可（UT-09 / UT-10 で formalize） | UT-26 では route 内 helper、UT-10 で formalize |
| 3 | 構造化ログ出力 | `apps/api/src/lib/logger.ts`（UT-08 で formalize 予定） | 可 | UT-26 単独では切り出さない |

> UT-26 は smoke 1 ルートの追加に留めるため、汎用 util の事前抽出は **行わない**。抽出は UT-09 / UT-10 / UT-21 が同居して取り組む際に判定する。

## navigation drift の確認

| チェック項目 | 確認方法 | 想定結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` と各 phase-XX.md の成果物 path 一致 | grep `outputs/phase-` | 完全一致 |
| index.md `Phase 一覧` 表の file 列と実ファイル名 | ls で照合 | 完全一致 |
| index.md `主要成果物` 表のパス | artifacts.json と突き合わせ | 完全一致 |
| phase-XX.md 内の他 phase 参照リンク | `../phase-YY.md` を全件確認 | リンク切れ 0 |
| 原典 unassigned-task 参照 | `docs/30-workflows/unassigned-task/UT-26-sheets-api-e2e-smoke-test.md` 実在確認 | 実在 |
| Skill reference path | `.claude/skills/aiworkflow-requirements/references/` | 実在 |
| artifacts.json `endpoints[0].path` × Phase 2/5/11 の表記 | 文字列突合 | `GET /admin/smoke/sheets` 完全一致 |

## 共通化パターン

- 命名: snake_case（log event / Secret） / camelCase（TS 変数） / PascalCase（型） / kebab-case（ファイル）の住み分けを徹底。
- 4条件の順序: 価値性 / 実現性 / 整合性 / 運用性 で固定。
- AC ID は `AC-1`〜`AC-11` のハイフン区切りで全 Phase 統一。
- 環境名は `staging` / `production` を使用（`prod` / `dev` 等の略称を混在させない。本タスクは production への露出禁止）。

## 削除対象一覧

- Phase 案出し時に出た仮命名（`smoke.ts` / `SA_JSON` / `/smoke/sheets` 等）を outputs/ に残さない。
- production 環境で smoke route が mount される旧案（`wrangler.toml` の `[env.production]` への route 露出案）は明示的に却下。

## 実行手順

### ステップ 1: 命名揺れの洗い出し
- `grep -rn 'smoke\|SMOKE\|SA_JSON' docs/30-workflows/ut-26-sheets-api-e2e-smoke-test` を実行。
- 揺れを表に整理。

### ステップ 2: Before / After 比較テーブルの作成
- 4 区分（命名 / 型 / path / endpoint）で記述。

### ステップ 3: sheets-fetcher.ts 再利用契約の明文化
- 再利用 API リスト + UT-26 が新規実装する責務を分離記述。

### ステップ 4: navigation drift 確認
- artifacts.json と各 phase-XX.md の path 照合。
- リンク切れ 0 確認。

### ステップ 5: outputs/phase-08/main.md に集約
- 上記すべてを 1 ドキュメントに統合。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化済み命名・path を品質保証チェックリストの前提に使用 |
| Phase 10 | navigation drift 0 を GO/NO-GO の根拠に使用 |
| Phase 11 | smoke route URL / Secret 名の単一表記を手動 smoke ログに反映 |
| Phase 12 | system-spec-update-summary.md / documentation-changelog.md に反映 |
| UT-09 | 同 wave で `/admin/sync` 命名と並列の `/admin/smoke/sheets` 命名を確認 |
| UT-10 | 401/403/429 → kind mapping を formalize 候補として引き渡し |

## 多角的チェック観点

- 価値性: DRY 化により Phase 11 手動 smoke 時の手戻り削減。
- 実現性: 既存 `apps/api/src/jobs/sheets-fetcher.ts` への依存のみで完結する。
- 整合性: 不変条件 #1（schema 固定回避）/ #5（apps/api 内閉鎖）を維持。本タスクは書き込み無しのため #4 違反なし。
- 運用性: 命名の一貫性で runbook / log 検索性が向上。
- 認可境界: smoke route が production で runtime 404 を返す設計を再確認。
- 無料枠: 新規 util 切り出しを行わないため bundle 増加なし。
- Secret hygiene: Secret 名の単一表記により誤注入リスク低減。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 命名揺れ洗い出し | 8 | spec_created | grep 結果を表化 |
| 2 | Before / After 比較テーブル作成 | 8 | spec_created | 4 区分すべて |
| 3 | sheets-fetcher.ts 再利用契約明文化 | 8 | spec_created | 再実装禁止対象を列挙 |
| 4 | endpoint 表記統一 | 8 | spec_created | `GET /admin/smoke/sheets` |
| 5 | navigation drift 確認 | 8 | spec_created | リンク切れ 0 |
| 6 | outputs/phase-08/main.md 作成 | 8 | spec_created | 全項目集約 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果（Before/After・再利用契約・navigation drift） |
| メタ | artifacts.json | Phase 8 状態の更新 |

## 完了条件

- [ ] Before / After 比較テーブルが 4 区分（命名 / 型 / path / endpoint）すべてで埋まっている
- [ ] sheets-fetcher.ts の再利用 API リストが固定され「再実装禁止」が明記されている
- [ ] 重複コード抽出候補 3 件以上が列挙され、UT-26 単独で抽出しない判定が記述されている
- [ ] navigation drift（artifacts.json / index.md / phase-XX.md / outputs path）が 0
- [ ] `GET /admin/smoke/sheets` + Bearer 認可で全 Phase 一致
- [ ] outputs/phase-08/main.md が生成対象として定義され、実行時に作成される

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物が `outputs/phase-08/main.md` に配置予定
- Before / After が 4 区分で網羅
- sheets-fetcher.ts 再利用契約が明文化
- navigation drift 0
- artifacts.json の `phases[7].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - DRY 化済みの命名・path 表（Phase 9 free-tier 見積もり / secret hygiene の前提として参照）
  - sheets-fetcher.ts 再利用契約（Phase 9 line budget 計算で「UT-26 は新規実装が小さい」前提に使用）
  - navigation drift 0 状態の維持（Phase 9 link 検証で再確認）
- ブロック条件:
  - Before / After に空セルが残る
  - navigation drift が 0 にならない
  - sheets-fetcher.ts 再利用契約が未明記（重複再実装の余地が残る）
