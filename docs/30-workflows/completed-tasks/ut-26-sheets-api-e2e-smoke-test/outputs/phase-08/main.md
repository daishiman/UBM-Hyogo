# Phase 8 成果物: DRY 化 / リファクタリング (main.md)

| 項目 | 値 |
| --- | --- |
| タスク | UT-26 Sheets API エンドツーエンド疎通確認 |
| Phase | 8 / 13 |
| 作成日 | 2026-04-29 |
| 状態 | spec_created |
| 関連 | phase-08.md, phase-07.md, UT-03 sheets-fetcher / sheets-auth |

## 1. 概要

UT-26 は新規 smoke route の追加に閉じる。既存実装 (UT-03 が owner) との重複コードを生まず、命名・型・パス・エンドポイントを単一表記に固定する。本 phase の主眼は次の 3 点。

1. UT-03 認証 client (`sheets-fetcher.ts`) および `apps/api/src/jobs/sheets-fetcher.ts` の `GoogleSheetsFetcher` を再利用する契約の明文化
2. 新規追加箇所 (smoke route handler / 型 / 環境変数 / Secret 名) の単一表記化
3. artifacts.json / index.md / phase-XX.md 間の navigation drift 解消

## 2. 既存実装 (UT-03 owner) との重複点と DRY 化方針

### 2.1 既存資産

| 資産 | パス | owner |
| --- | --- | --- |
| GoogleSheetsFetcher | `apps/api/src/jobs/sheets-fetcher.ts` | UT-03 |
| `parseServiceAccountJson` / `signJwtRS256` / `getAccessToken` | `packages/integrations/google/src/forms/auth.ts` (現行) → `apps/api/src/jobs/sheets-fetcher.ts` (UT-03 完了後) | UT-03 |
| 認証用 env 名 | 現行 `GOOGLE_SHEETS_SA_JSON` → 仕様 `GOOGLE_SHEETS_SA_JSON` | UT-03 / Phase 2 実装前ゲートで解消 |

### 2.2 DRY 化方針

- **再利用のみ・再実装禁止**: smoke route は `GoogleSheetsFetcher` または `getAccessToken` を import するだけ。JWT 生成 / OAuth token 取得 / cache の責務に介入しない。
- **機能追加は UT-03 へ差し戻し**: 既存 fetcher にメソッド追加 (例: `fetchByRange`, `clearTokenCache`) が必要になった場合、UT-26 では実装せず UT-03 owner に差し戻す。UT-26 は smoke route と format-result helper のみ追加する。
- **env 名統一は UT-03 のスコープ**: `GOOGLE_SHEETS_SA_JSON` ↔ `GOOGLE_SHEETS_SA_JSON` の差分は UT-03 / Phase 2 ゲートで一本化。UT-26 は決定された名前を使うだけ。

## 3. 共通ユーティリティ抽出案 (候補と判定)

| # | 候補 util | 抽出先 (将来) | 他タスク転用可否 | UT-26 での扱い |
| --- | --- | --- | --- | --- |
| 1 | `redactSampleRows(rows)` (氏名・連絡先のマスキング) | `apps/api/src/lib/redact.ts` | 可 (UT-09 / UT-21 の D1 sync で再利用見込み) | **UT-26 では route 直下の `lib/smoke/format-result.ts` 内 private helper として実装。util 切り出しは UT-09 で formalize** |
| 2 | `classifySheetsError(response)` → `SmokeErrorKind` mapping | `apps/api/src/utils/sheets-error-mapper.ts` | 可 (UT-09 / UT-10) | **UT-26 では route 内 helper。UT-10 (error handling 標準化) で formalize** |
| 3 | `requireBearer(env, header)` (SMOKE_ADMIN_TOKEN 検証) | `apps/api/src/middlewares/admin-auth.ts` | 可 (UT-09 `/admin/sync` と共有) | **UT-26 では route 内 inline。UT-09 実装時に併合 formalize** |
| 4 | 構造化ログ logger (event=sheets_smoke_test) | `apps/api/src/lib/logger.ts` | 可 (UT-08 monitoring) | **UT-26 単独では切り出さず `console.log(JSON.stringify(...))` で完結。UT-08 で formalize** |

> 方針: smoke 1 ルートの追加に留めるため、汎用 util の事前抽出は行わない。抽出は UT-09 / UT-10 / UT-21 / UT-08 が同居する Wave で判定する (= wrapper / adapter 方式)。

### 3.1 wrapper / adapter 方式の採用根拠

- UT-26 は **fetcher のラッパー (smoke route)** であり、内部実装に手を入れない (= adapter pattern)。
- これにより:
  - UT-03 owner 境界を侵食しない (機能追加は UT-03 差し戻し)
  - UT-26 削除時の影響範囲が smoke route + format-result の 2〜3 ファイルに限定
  - UT-09 が `GoogleSheetsFetcher` を独自に拡張しても conflict しない
- 反対案 (util 事前抽出) の却下理由: UT-26 単独では転用先が無く YAGNI。Phase 9 line budget も小さく保てる。

## 4. Before / After 比較テーブル

### 4.1 命名規則

| 対象 | Before (仮想揺れ) | After | 理由 |
| --- | --- | --- | --- |
| smoke route handler | `smoke.ts` / `smokeSheets.ts` / `sheetsSmoke.ts` | `apps/api/src/routes/admin/smoke-sheets.ts` | kebab-case + `admin/smoke/<source>` |
| smoke script (CLI) | `smoke-sheets.ts` / `sheetsSmokeTest.ts` | `apps/api/src/scripts/smoke-test-sheets.ts` | `smoke-test-<source>.ts` 規約 |
| route 関数 export | `handleSmoke` / `smokeHandler` | `smokeSheetsHandler` (Hono Handler) | scope を関数名に明記 |
| log event 名 | `smoke_sheets` / `sheetsSmoke` | `sheets_smoke_test` | snake_case + 接尾辞 `_test` |
| 環境変数 (Variable) | `SHEETS_ID` / `SPREADSHEET_ID` | `SHEETS_SPREADSHEET_ID` | UT-25 / index.md 整合 |
| Secret 名 (SA) | `SA_JSON` / `GOOGLE_SA_JSON` / `GOOGLE_SHEETS_SA_JSON` (現行) | `GOOGLE_SHEETS_SA_JSON` (Phase 2 ゲート後) | UT-25 で確定済み |
| 認可 Secret 名 | `ADMIN_TOKEN` / `SMOKE_TOKEN` | `SMOKE_ADMIN_TOKEN` | scope を Secret 名に明記 |

### 4.2 型定義

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| smoke 結果 | adhoc `{ ok: boolean }` | `SmokeResult { ok, latencyMs, sheetTitle, rowCount, sample, tokenFetchesDuringSmoke, spreadsheetIdSuffix }` を `apps/api/src/routes/admin/smoke/types.ts` に集約 | Phase 6 異常系・Phase 11 証跡と一致 |
| エラー分類 | adhoc literal | `SmokeErrorKind = 'auth' \| 'permission' \| 'rate_limit' \| 'network' \| 'unknown'` | UT-10 引き渡し用 |
| Env binding | adhoc `any` | `Env` interface に `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` / `SMOKE_ADMIN_TOKEN` を必須宣言 | Phase 9 secret hygiene 前提 |

### 4.3 パス (ファイル配置)

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| smoke route | (新規) | `apps/api/src/routes/admin/smoke-sheets.ts` | 複数 source 対応に拡張可能 |
| smoke script | (新規) | `apps/api/src/scripts/smoke-test-sheets.ts` | UT-03 同等 scripts/ 配下 |
| 共通型 | (新規) | `apps/api/src/routes/admin/smoke/types.ts` | route 直下に局所化 |
| 認証 client (再利用) | UT-03 提供 | `apps/api/src/jobs/sheets-fetcher.ts` (既存) / `apps/api/src/jobs/sheets-fetcher.ts` | UT-26 は再実装しない |

### 4.4 エンドポイント

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| smoke endpoint | `/smoke/sheets` / `/admin/smoke-sheets` / `/admin/sheets/smoke` | `GET /admin/smoke/sheets` | api-endpoints.md / Phase 2 設計 / artifacts.json `endpoints[0]` 統一 |
| 認可方式 | header 名揺れ (`X-Smoke-Token` 等) | `Authorization: Bearer <SMOKE_ADMIN_TOKEN>` | RFC 6750 準拠、UT-09 `/admin/sync` と整合 |
| 環境分岐 | adhoc `if (env === 'production')` | `wrangler.toml` `[env.staging]` のみ route mount + production では未マウント | 不変条件 #5 + 認可境界 |
| バージョニング | `/v1/admin/smoke/sheets` 案 | 未付与 (admin route は MVP 暗黙 v1) | 内部 admin / UT-09 整合 |

## 5. navigation drift の確認 (チェックリスト)

| チェック項目 | 確認方法 | 期待結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` × phase-XX.md 成果物 path | grep `outputs/phase-` | 完全一致 |
| index.md Phase 一覧の file 列 × 実ファイル | ls 照合 | 完全一致 |
| index.md 主要成果物表 × artifacts.json | 突き合わせ | 完全一致 |
| phase-XX.md 内 `../phase-YY.md` 相対参照 | 全件確認 | リンク切れ 0 |
| 原典 unassigned-task 参照 | 実在確認 | 実在 |
| Skill reference path | `.claude/skills/aiworkflow-requirements/references/` | 実在 |
| `endpoints[0].path` × Phase 2/5/11 表記 | 文字列突合 | `GET /admin/smoke/sheets` 完全一致 |

## 6. 共通化パターン

- 命名規則: snake_case (log event / Secret) / camelCase (TS 変数) / PascalCase (型) / kebab-case (ファイル) を住み分け徹底
- 4条件の順序: 価値性 / 実現性 / 整合性 / 運用性 で固定
- AC ID: `AC-1`〜`AC-11` のハイフン区切りで全 Phase 統一
- 環境名: `staging` / `production` のみ。略称 `prod` / `dev` は混在禁止 (production 露出禁止のため)

## 7. 削除対象 / 却下対象

- 仮命名 `smoke.ts` / `SA_JSON` / `/smoke/sheets` 等を outputs/ に残さない
- production 環境への smoke route mount 案 (`wrangler.toml` `[env.production]` への route 露出) は明示却下

## 8. UT-03 owner 境界 (機能追加は UT-03 差し戻し)

| 状況 | UT-26 での対応 |
| --- | --- |
| `GoogleSheetsFetcher` に新メソッドが必要 | UT-03 owner に差し戻し。UT-26 では実装しない |
| `getAccessToken` の cache TTL 変更が必要 | UT-03 owner に差し戻し |
| Web Crypto algorithm 変更が必要 | UT-03 owner に差し戻し |
| env 名統一 (`GOOGLE_SHEETS_SA_JSON` → `GOOGLE_SHEETS_SA_JSON`) | UT-03 / Phase 2 ゲートで完了。UT-26 は決定値を使用 |

## 9. 完了条件チェック

- [x] Before / After が 4 区分 (命名 / 型 / path / endpoint) で網羅
- [x] sheets-fetcher.ts / sheets-fetcher.ts の再利用 API リスト固定、再実装禁止明記
- [x] 重複コード抽出候補 4 件列挙、UT-26 単独では抽出しない判定記述
- [x] navigation drift チェックリストを記述 (実走査は Phase 9 link 検証で実施)
- [x] `GET /admin/smoke/sheets` + Bearer 認可で全 Phase 一致
- [x] wrapper/adapter 方式の採用根拠を明示

---

next: phase-09 (品質保証) へ引き渡し — DRY 化済みの命名・path 表を free-tier 見積もり / secret hygiene の前提として使用。sheets-fetcher.ts 再利用契約を line budget 計算で「UT-26 は新規実装が小さい」前提として参照。navigation drift 0 は Phase 9 link 検証で実走査して再確認。
