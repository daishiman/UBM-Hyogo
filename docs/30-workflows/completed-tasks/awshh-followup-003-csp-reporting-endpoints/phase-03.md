# Phase 3: 設計レビュー

## 判定: Phase 4 へ進む（GO）

## レビュー観点

### 1. 受信先: 内製 vs SaaS

| 案 | 価値 | コスト | 不変条件 | 1サイクル |
| --- | --- | --- | --- | --- |
| Sentry CSP endpoint（採用） | 受信側実装ゼロ・既存導入済み | 公開 URL を env に追加するのみ | #5 維持（apps/api 不変） | ○ 完結 |
| apps/api 内製 + D1 保存 | 自前管理 | 新規 route + D1 schema + retention 実装 | #5 抵触リスク・別タスク化必須 | × 1サイクル超過 |

→ Sentry 採用。内製は scope out。

### 2. report-to と report-uri の併記

- `report-to`: W3C Reporting API Level 1 の現行仕様。`Reporting-Endpoints` ヘッダのグループ名を参照。
- `report-uri`: 旧仕様だが Safari 等まだ `report-to` 未対応ブラウザがあるため**併記**して取りこぼしを防ぐ（リスク表「ブラウザ実装差」対策）。
- 両者は同一 `reportEndpoint` URL を指す。`report-to` はグループ名経由、`report-uri` は URL 直書き。

### 3. 後方互換（AC-4）

`reportEndpoint` 未設定時に report 系を一切出さない設計により、local（env 未投入）や既存テストの無回帰を保証。既存 7 テストは `reportEndpoint` を渡していないため挙動不変。

### 4. env アクセス不変条件

`getPublicEnv()` の pick に新規 env を追加して参照する設計で、`process.env` 直接参照を増やさない（AC-5）。zod optional なので未投入環境で parse エラーにならない。

## 4条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | enforce 切替の判断材料（誤検知/許可漏れ）を取得可能にする |
| 実現性 | PASS | apps/web 5 ファイルの修正のみ・1 サイクル |
| 整合性 | PASS | #5 / env 不変条件 / 後方互換を破らない |
| 運用性 | PASS | 受信・retention は Sentry 側。runbook で方針明文化 |

## 次フェーズ引き継ぎ

Phase 4 でテストケース TC-1〜5 を設計する。
