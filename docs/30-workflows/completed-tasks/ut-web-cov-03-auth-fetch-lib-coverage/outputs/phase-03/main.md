# Phase 3 成果物 — ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装仕様書]

- status: pending（実装フェーズで実測 capture）
- purpose: 設計レビュー
- evidence: <TBD: 実装・実測時に capture。仕様書作成時点では placeholder>

## レビュー結果サマリ

Phase 2 設計に対し R-01〜R-10 を audit。すべて pass。decision log D-01〜D-05 を確定。

## レビューチェック結果

| # | 観点 | 判定 | 根拠 |
| --- | --- | --- | --- |
| R-01 | 不変条件 #5 D1 直接アクセス apps/api 限定 | PASS | mock 戦略は fetch mock のみ |
| R-02 | 不変条件 #6 apps/web D1 直接禁止 | PASS | binding を import しない |
| R-03 | shared package 越境禁止 | PASS | 型 import のみ |
| R-04 | coverage exclude 数値合わせ禁止 | PASS | 除外は `me-types.ts` のみ |
| R-05 | test ID 重複なし | PASS | prefix 一意 |
| R-06 | AC ↔ test ID 漏れなし | PASS（事前） | Phase 4 で確定 |
| R-07 | mock 過剰禁止 | PASS | DI 受け口優先 |
| R-08 | error 経路網羅 | PASS | network-fail / non-2xx を全 file カバー |
| R-09 | 副作用検証 | PASS | console.error 未発火 assert |
| R-10 | 既存実装非改変 | PASS | 既存 lib 変更なし |

## decision log

| ID | 内容 | 判定 |
| --- | --- | --- |
| D-01 | `me-types.ts` を coverage 除外（型のみ） | 採用候補（Phase 4 確定） |
| D-02 | `apps/web/src/test-utils/fetch-mock.ts` 新規作成 | 採用 |
| D-03 | `auth.ts` 既存 DI を活用 | 採用 |
| D-04 | D1 binding mock 禁止、fetch mock のみ | 採用 |
| D-05 | shared package 改変なし、型 import のみ | 採用 |

## 変更対象ファイル

Phase 1 / 2 と同じ。レビューによる追加・削除なし。

## 次 Phase への引き継ぎ

レビューチェック結果、decision log、AC ↔ test ID マッピング作成方針を Phase 4 へ。
