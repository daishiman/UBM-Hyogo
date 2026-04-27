# 01b: zod view models と Google Forms API クライアント基盤

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | zod-view-models-and-google-forms-api-client |
| Wave | 1 |
| 実行種別 | parallel（同 Wave: 01a） |
| 上流 | 00 (monorepo / shared / UI primitives foundation) |
| 下流 | 02a / 02b / 02c (D1 repository), 03a / 03b (Forms sync), 04a / 04b / 04c (API endpoints) |
| 種別 | spec_created |
| 想定工数 | 1.0 day |
| 作成日 | 2026-04-26 |
| 状態 | spec_ready |

## 目的

`packages/shared` に `04-types.md` の **型 4 層**（schema 層 / response 層 / identity 層 / viewmodel 層）と zod schema を実装し、`packages/integrations/google` に Google Forms API クライアント（`forms.get` / `forms.responses.list`）を実装する。これにより Wave 2/3/4 のすべての repository / sync / API endpoint タスクが共通型と Forms 取得 I/F を import するだけで進められる状態にする。

## スコープ（in / out）

### in

- `packages/shared/types/` 4 層型定義（TypeScript only / runtime 不要）
  - schema 層: `FormSchema` / `FormSection` / `FormQuestion`
  - response 層: `FormResponse` / `FormResponseAnswer`
  - identity 層: `MemberIdentity` / `MemberStatus`
  - viewmodel 層: 10 種（Public / Member / Admin）
- `packages/shared/branded/` branded types: `MemberId` / `ResponseId` / `ResponseEmail` / `StableKey` / `SessionId` / `TagId` / `AdminId`
- `packages/shared/zod/` zod schema: 31 項目の field schema、view model parser、I/O 境界 validation
- `packages/shared/utils/` consent key normalizer (`publicConsent` / `rulesConsent` 統一)
- `packages/integrations/google/forms/` Forms API クライアント
  - `getForm(formId)` → `FormSchema`
  - `listResponses(formId, { pageToken, since })` → `FormResponse[]`
  - サービスアカウント認証（JWT 署名 → access token）
  - exponential backoff（429 / 5xx）
  - rate limit 計測（quota メトリクス）
- vitest unit test（型 / zod / Forms client mock）

### out

- D1 repository 実装（02a/02b/02c で実施）
- Forms 同期ロジック本体（03a/03b で実施）
- API endpoint（04a/04b/04c で実施）
- UI 実装（06a/06b/06c で実施）

## 受け入れ基準（AC, quantitative）

| ID | 項目 | 検証 | 閾値 |
| --- | --- | --- | --- |
| AC-1 | 型 4 層が `04-types.md` を 100% カバー | `tsc --noEmit` PASS | 0 error |
| AC-2 | branded type 7 種が export される | `import` 経路確認 | 7/7 |
| AC-3 | zod schema が 31 項目すべてを検証 | unit test | 31/31 case PASS |
| AC-4 | viewmodel 10 種が export される | `import` 経路確認 | 10/10 |
| AC-5 | `consent` キーは `publicConsent` / `rulesConsent` の 2 つのみ | grep 結果 | 0 件の旧キー |
| AC-6 | `responseEmail` は schema 外（system field） | 型ファイル grep | schema 内 0 件 |
| AC-7 | `responseId` と `memberId` が異なる branded type | type test | distinct |
| AC-8 | Forms client が auth → forms.get の chain で動作（mock） | unit test | PASS |
| AC-9 | Forms client が 429 → backoff retry を実装 | unit test | PASS |
| AC-10 | `apps/web` から `packages/integrations/google` に依存しない（保護線） | ESLint | 0 violation |

## 不変条件タッチ

| 不変条件 | 触れ方 |
| --- | --- |
| #1 schema 抽象 | schema 層を struct 化、specific question を hardcode しない |
| #2 consent キー | normalizer が `publicConsent` / `rulesConsent` を強制 |
| #3 responseEmail system field | response 層の system field として分離 |
| #5 D1 直接アクセス apps/api 限定 | このタスクは D1 に触れない（型のみ） |
| #6 GAS prototype 非昇格 | viewmodel は spec/04, 05 由来、GAS 由来 0 件 |
| #7 responseId / memberId 別 PK | branded type で型レベル分離 |

## Phase 一覧

| Phase | 内容 |
| --- | --- |
| 1 | 要件定義（4 層 + 7 branded + 10 viewmodel + Forms client 範囲確定） |
| 2 | 設計（package 構造 / module 分割 / Forms auth flow） |
| 3 | 設計レビュー（alternative 評価, PASS-MINOR-MAJOR） |
| 4 | テスト戦略（型 / zod / Forms mock / ESLint rule） |
| 5 | 実装ランブック（package init → 型 → zod → Forms client） |
| 6 | 異常系検証（型不整合 / zod パース失敗 / Forms 401/429/5xx） |
| 7 | AC マトリクス（10 AC ↔ test 対応） |
| 8 | DRY 化（型 alias / zod helper / Forms response mapper） |
| 9 | 品質保証（無料枠 / secret hygiene / a11y N/A） |
| 10 | 最終レビュー（GO/NO-GO） |
| 11 | 手動 smoke（typecheck / vitest / Forms mock 実行） |
| 12 | ドキュメント更新（implementation guide / changelog 等 6 種） |
| 13 | PR 作成（user 承認） |

## ブロック解除先

- 02a: response 層型 / branded MemberId / ResponseId / ResponseEmail を import
- 02b: tag / meeting / schema viewmodel を import
- 02c: admin viewmodel / branded AdminId を import
- 03a: schema 層 + Forms `getForm` を使用
- 03b: response 層 + Forms `listResponses` を使用
- 04a/b/c: viewmodel 10 種を Hono ハンドラ response として使用
- 05a/b: SessionUser viewmodel を session callback で使用
- 06a/b/c: viewmodel 10 種を SSR / fetch で使用

## 参照仕様

- `doc/00-getting-started-manual/specs/04-types.md` 型 4 層
- `doc/00-getting-started-manual/specs/01-api-schema.md` 31 項目
- `doc/00-getting-started-manual/specs/03-data-fetching.md` 同期 contract（型側のみ参照）
- `doc/00-getting-started-manual/specs/05-pages.md` viewmodel 利用画面
- `doc/00-getting-started-manual/specs/13-mvp-auth.md` SessionUser
- `CLAUDE.md` 不変条件 #1〜#7

## 完了条件

- 15 ファイル（index / artifacts / phase-01〜13）配置
- AC-1〜AC-10 の検証手順が phase-04 / phase-07 に明記
- 不変条件 #1/#2/#3/#5/#6/#7 が phase-06 異常系に組み込み済み
