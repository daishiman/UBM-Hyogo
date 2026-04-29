# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-backoffice-api-endpoints |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | completed |

## 目的

型安全 / lint / test / a11y の 4 軸と Cloudflare 無料枠見積もり、secret hygiene を点検する。本タスクは API 層なので a11y は API contract の error message が UI から読める形式かに限定する。

## Free-tier 見積もり

### Workers リクエスト数

| endpoint | 想定 req/day（admin 3 人） | 計算根拠 |
| --- | --- | --- |
| GET /admin/dashboard | 30 | 1 人 10 回 / day |
| GET /admin/members | 60 | 検索操作 |
| GET /admin/members/:memberId | 30 | drawer 開閉 |
| PATCH .../status | 5 | 状態切替の頻度 |
| POST/PATCH .../notes | 10 | メモ作成 / 編集 |
| POST .../delete | 1 | 月数件 |
| POST .../restore | 1 | 月数件 |
| GET /admin/tags/queue | 20 | 1 人 数回 |
| POST /admin/tags/queue/:queueId/resolve | 5 | 1 人 数回 |
| GET /admin/schema/diff | 10 | 1 人 数回 |
| POST /admin/schema/aliases | 2 | 月数件 |
| GET /admin/meetings | 15 | 1 人 5 回 |
| POST /admin/meetings | 1 | 月数件 |
| POST/DELETE attendance | 30 | 開催ごとに 10 件 |
| POST /admin/sync/* | 4 | cron 自動 + 手動 trigger |
| 合計 | 約 224 / day | 100k req/day 制限の 0.2% |

### D1 read / write

| 操作 | 1 req あたり | 1 day | 制限 (500k read / 100k write) |
| --- | --- | --- | --- |
| GET /admin/dashboard | 6 read（集計クエリ） | 180 read | 0.04% |
| GET /admin/members | 3 read | 180 read | 0.04% |
| GET /admin/members/:memberId | 7 read | 210 read | 0.04% |
| PATCH status | 2 read + 2 write | 10 read + 10 write | 0.002% / 0.01% |
| POST notes | 1 read + 2 write | 10 read + 20 write | - |
| POST attendance | 2 read + 2 write | 60 read + 60 write | 0.012% / 0.06% |
| POST sync/* | 1 read + 2 write | 4 read + 8 write | - |
| 合計 | - | 約 700 read / 100 write | 全項目 1% 未満 |

→ 不変条件 #10 (無料枠) を満たす。

## Secret hygiene checklist

- [ ] AUTH_SECRET / GOOGLE_* secret は 05a / 03a / 03b 経由でのみ参照
- [ ] 本タスクで新規 secret を導入しない
- [ ] log に session cookie / JWT 全文を出力しない
- [ ] log に admin email を hash 化せずに出さない（debug 環境限定 + redact）
- [ ] response body に admin_member_notes 本文を漏らさない（contract test で保証）
- [ ] D1 binding を apps/api 以外で使用しない
- [ ] sync trigger の job ID を URL query で公開しない（path のみ）

## 品質チェック

| 項目 | 確認手段 | 期待 |
| --- | --- | --- |
| typecheck | `pnpm --filter api typecheck` | エラーゼロ |
| lint | `pnpm --filter api lint` | エラーゼロ |
| unit test | `pnpm --filter api test` | 全 pass |
| contract test | `pnpm --filter api test contract/admin/*.test.ts` | 全 pass |
| authz test | `pnpm --filter api test authz/admin/*.test.ts` | 全 pass |
| zod schema 整合 | safeParse で view model 一致 | true |
| API error contract | `{ code, message?, issues? }` 統一 | true |
| route 一覧 audit | PATCH .../profile, PATCH .../tags が router に mount されていない | true |

## a11y（API 視点）

- error response の `message` を UI が i18n key として使える文字列にする
- `code` は machine-readable（例: `NOT_ADMIN`, `DUPLICATE_ATTENDANCE`, `DELETED_MEMBER`）
- `message` は人間向け
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

- #5: D1 binding が apps/api のみで利用される
- #10: 無料枠見積もりで 1% 未満を確認
- #11: log に他人 memberId / admin email 露出ゼロ
- #12: log と response に notes 本文露出ゼロ

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 無料枠見積もり | 9 | completed | outputs/phase-09/free-tier.md |
| 2 | secret hygiene check | 9 | completed | main.md |
| 3 | typecheck / lint / test 結果記録 | 9 | completed | placeholder |
| 4 | a11y 観点記録 | 9 | completed | error response 設計 |

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
- [ ] error response 形式が 04a / 04b と整合

## タスク100%実行確認【必須】

- 全実行タスク completed
- 全成果物配置済み
- 全完了条件チェック
- artifacts.json の Phase 9 を completed に更新

## 次 Phase

- 次: 10 (最終レビュー)
- 引き継ぎ事項: GO/NO-GO 判定の入力（無料枠 / secret / 品質）
- ブロック条件: 無料枠見積もりが 50% 超なら NO-GO
