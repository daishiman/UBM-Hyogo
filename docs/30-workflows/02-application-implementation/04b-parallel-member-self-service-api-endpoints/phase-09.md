# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-self-service-api-endpoints |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | pending |

## 目的

型安全 / lint / test / a11y の 4 軸と Cloudflare 無料枠見積もり、secret hygiene を点検する。本タスクは API 層なので a11y は API contract の error message が UI から読める形式かに限定する。

## Free-tier 見積もり

### Workers リクエスト数

| endpoint | 想定 req/day（会員 50 人） | 計算根拠 |
| --- | --- | --- |
| GET /me | 200 | 会員 1 人 4 回 / day |
| GET /me/profile | 100 | 会員 1 人 2 回 / day |
| POST /me/visibility-request | 5 | 月数件 |
| POST /me/delete-request | 1 | 月 1 件未満 |
| 合計 | 約 306 / day | 100k req/day 制限の 0.3% |

### D1 read / write

| 操作 | 1 req あたり | 1 day | 制限 (500k read / 100k write) |
| --- | --- | --- | --- |
| GET /me | 2 read (members + status) | 400 read | 0.08% |
| GET /me/profile | 5 read (member + responses + sections + fields + visibility) | 500 read | 0.1% |
| POST visibility | 2 read + 2 write (notes + audit) | 10 read + 10 write | 0.002% / 0.01% |
| POST delete | 2 read + 2 write | 2 read + 2 write | 0.0004% / 0.002% |
| 合計 | - | 約 912 read / 12 write | 全項目 1% 未満 |

→ 不変条件 #10 (無料枠) を満たす。

## Secret hygiene checklist

- [ ] AUTH_SECRET / GOOGLE_CLIENT_ID 等の secret を本タスクで読み出さない（05a 経由）
- [ ] env で導入する非機密値は RESPONDER_URL のみ（wrangler vars）
- [ ] D1 binding を apps/api 以外で使用しない
- [ ] log に session cookie / JWT 全文を出力しない
- [ ] log に email / memberId を hash 化せずに出さない（出す場合は debug 環境限定 + redact）
- [ ] response body に admin_member_notes 本文を漏らさない（contract test で保証）

## 品質チェック

| 項目 | 確認手段 | 期待 |
| --- | --- | --- |
| typecheck | `pnpm --filter api typecheck` | エラーゼロ |
| lint | `pnpm --filter api lint` | エラーゼロ |
| unit test | `pnpm --filter api test` | 全 pass |
| contract test | `pnpm --filter api test contract/me/*.test.ts` | 全 pass |
| authz test | `pnpm --filter api test authz/me/*.test.ts` | 全 pass |
| zod schema 整合 | `safeParse` で view model と一致 | true |
| API error contract | error response が `{ code, message?, issues? }` で統一 | true |
| 02c との重複 | adminMemberNotes 直接 import を 04b 内で禁止 | repository helper 経由のみ |

## a11y（API 視点）

- error response の `message` を UI が i18n key として使える文字列にする
- `code` は machine-readable、`message` は人間向け（UI が再翻訳可）
- ステータスコード設計が WCAG 表示要件と矛盾しない（401 vs 403 を間違えない）

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | 無料枠 |
| 必須 | doc/00-getting-started-manual/specs/02-auth.md | secret 配置 |
| 参考 | CLAUDE.md | secret 管理ルール |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 品質チェック結果が GO/NO-GO 入力 |
| 09a (Wave 9) | staging で本 endpoint 群が pass する根拠 |

## 多角的チェック観点（不変条件マッピング）

- #5: D1 binding が apps/api のみで利用される（理由: 境界遵守）
- #10: 無料枠見積もりで 1% 未満を確認（理由: 運用コスト）
- #11: log に他人 memberId を露出させない（理由: 認可境界）
- #12: log に notes 本文を露出させない（理由: 公開境界）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 無料枠見積もり | 9 | pending | outputs/phase-09/free-tier.md |
| 2 | secret hygiene check | 9 | pending | main.md |
| 3 | typecheck / lint / test 結果記録 | 9 | pending | placeholder（実行は実装タスクで） |
| 4 | a11y 観点記録 | 9 | pending | error response 設計 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | Phase 9 主成果物 |
| ドキュメント | outputs/phase-09/free-tier.md | 無料枠見積もり |
| メタ | artifacts.json | Phase 9 を completed に更新 |

## 完了条件

- [ ] 無料枠見積もりが各テーブルで 5% 未満
- [ ] secret hygiene checklist 全 pass
- [ ] typecheck / lint / test がローカル placeholder で green 想定
- [ ] error response 形式が 04a / 04c と整合

## タスク100%実行確認【必須】

- 全実行タスク completed
- 全成果物配置済み
- 全完了条件チェック
- artifacts.json の Phase 9 を completed に更新

## 次 Phase

- 次: 10 (最終レビュー)
- 引き継ぎ事項: GO/NO-GO 判定の入力（無料枠 / secret / 品質）
- ブロック条件: 無料枠見積もりが 50% 超なら NO-GO
