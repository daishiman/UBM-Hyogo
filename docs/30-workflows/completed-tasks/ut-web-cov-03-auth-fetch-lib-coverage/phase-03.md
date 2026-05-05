# Phase 3: 設計レビュー — ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装仕様書]

> 本タスクはユーザー指定 `taskType=docs-only` に対し、Vitest テストファイル新規作成が必須のため、CONST_004 実態優先原則に基づき実装仕様書として作成する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-03-auth-fetch-lib-coverage |
| phase | 3 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| 改訂日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 2 設計に対する整合性レビュー、不変条件チェック、漏れ検出を行う。decision log 形式で結果を記録する。

## 実行タスク

1. 不変条件チェックリストで Phase 2 設計を audit する。
2. shared package 越境がないことを確認する。
3. coverage exclude による数値合わせをしていないことを確認する。
4. レビュー結果を outputs/phase-03/main.md に decision log 形式で記録する。

## レビュー チェックリスト

| # | 観点 | 期待 | Phase 2 設計の対応箇所 |
| --- | --- | --- | --- |
| R-01 | 不変条件 #5 (D1 直接アクセスは apps/api に閉じる) | test 内でも mock fetch のみ使用、D1 binding mock 禁止 | mock 戦略表 `fetch/public.ts` 行（`getCloudflareContext` を stub し fetch のみ） |
| R-02 | 不変条件 #6 / apps/web D1 直接アクセス禁止 | fetch wrapper test で D1 binding を import しない | `authed.test.ts` / `public.test.ts` の mock 戦略 |
| R-03 | shared package 越境禁止 | `@ubm-hyogo/shared` は型 import のみ、ロジック改変しない | テストケース表に shared ロジック改変なし |
| R-04 | coverage exclude による数値合わせ禁止 | 型のみファイル以外は exclude しない | Phase 4 で `me-types.ts` のみ除外候補と明記 |
| R-05 | test ID 重複なし | 7 ファイル × test ID prefix が一意（AUTH/ML/OA/SES/FA/FP） | Phase 2 テストケース表 |
| R-06 | AC ↔ test ID マッピング漏れなし | AC-1〜AC-6 すべてが test ID で覆われる | Phase 4 で確定（事前確認） |
| R-07 | mock 過剰禁止 | 実装の DI 受け口（`auth.ts` の `fetchImpl`）優先、不要な vi.mock を増やさない | mock 戦略表で DI 優先を明記 |
| R-08 | error 経路網羅 | 各対象で network-fail / non-2xx の双方を含む | テストケース表で全 6 file カバー |
| R-09 | 副作用検証 | console.error が test 中に発火しないこと | 入出力・副作用定義の共通副作用 |
| R-10 | 既存実装非改変 | `auth.ts` 等の既存 lib コードを変更しない | Phase 2「既存実装の変更: なし」 |

## decision log（事前ドラフト）

| decision ID | 内容 | 判定 |
| --- | --- | --- |
| D-01 | `me-types.ts` を coverage 計測対象から除外する | 採用候補（Phase 4 で最終確定） |
| D-02 | `fetch-mock.ts` を `apps/web/src/test-utils/` に新規作成する | 採用 |
| D-03 | `auth.ts` 既存 DI（`fetchImpl` / `providerFactories`）を活用、追加 export なし | 採用 |
| D-04 | D1 binding mock は禁止、fetch mock のみ使用 | 採用（不変条件 #5・#6） |
| D-05 | shared package 改変なし、型 import のみ | 採用 |

## 変更対象ファイル一覧（Phase 3 確認）

Phase 1 / Phase 2 と同じ。レビューによる追加・削除なし。レビュー結果次第で D-01〜D-05 が確定する。

## 参照資料

- 起票根拠: 2026-05-01 実測 apps/web coverage（lines=39.39%）
- `docs/00-getting-started-manual/specs/02-auth.md`
- `docs/00-getting-started-manual/specs/13-mvp-auth.md`
- CLAUDE.md 不変条件 #5 / #6
- Phase 2 outputs（テストケース表 / mock 戦略表）

## 実行手順

- 対象 directory: `docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/`
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。
- ローカル実行コマンド: `mise exec -- pnpm --filter web test:coverage`

## 統合テスト連携

- 上流: 05a-authjs-google-oauth-admin-gate, 05b-B-magic-link-callback-credentials-provider
- 関連 quality gate: 06b-A-me-api-authjs-session-resolver; release readiness handoff: 09b-A-observability-sentry-slack-runtime-smoke

## 多角的チェック観点

- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden（fetch wrapper 経由のみ／test 内でも遵守）
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。

## サブタスク管理

- [ ] R-01〜R-10 を Phase 2 設計に照らして audit する
- [ ] decision log D-01〜D-05 を確定する
- [ ] outputs/phase-03/main.md に decision log を記録する

## 成果物

- `outputs/phase-03/main.md`（decision log 形式）

## 完了条件

- レビューチェックリスト R-01〜R-10 がすべて pass。
- decision log D-01〜D-05 が確定し、Phase 4 へ引き継がれる。
- 既存 web test に regression なし。
- 本 Phase では レビュー結果が outputs に記録されていれば DoD を満たす。

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 4 へ以下を渡す: レビューチェック結果、decision log、変更対象ファイル一覧、AC ↔ test ID マッピング作成方針。
