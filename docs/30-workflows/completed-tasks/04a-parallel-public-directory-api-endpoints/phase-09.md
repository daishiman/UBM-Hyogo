# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04a-parallel-public-directory-api-endpoints |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| Wave | 4 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 8（DRY 化） |
| 次 Phase | 10（最終レビュー） |
| 状態 | pending |

## 目的

型安全 / lint / test / a11y の 4 軸と Cloudflare 無料枠見積もり、secret hygiene、leak test 結果を点検する。本タスクは公開 API なので a11y は API contract の error message が UI から再翻訳できる形式かに限定する。leak test 結果（不適格 0 件 / `responseEmail` / `rulesConsent` / `adminNotes` keys なし）を本 phase の核とする。

## Free-tier 見積もり

### Workers リクエスト数

| endpoint | 想定 req/day（公開閲覧 1k visit） | 計算根拠 |
| --- | --- | --- |
| GET /public/stats | 1,000 | landing で 1 visit 1 回 |
| GET /public/members | 800 | members ページに 0.8 visit |
| GET /public/members/:memberId | 600 | profile clickthrough 0.6 visit |
| GET /public/form-preview | 100 | register ページから 0.1 visit |
| 合計 | 約 2,500 / day | 100k req/day 制限の 2.5% |

### D1 read

| 操作 | 1 req あたり | 1 day | 制限 (5M read / day) |
| --- | --- | --- | --- |
| GET /public/stats | 4 read（公開数 / zone / 今年 meeting / 直近 5 / sync） | 4,000 read | 0.08% |
| GET /public/members | 2 read（list + count） | 1,600 read | 0.03% |
| GET /public/members/:memberId | 5 read（exists + member + response + fields + schema） | 3,000 read | 0.06% |
| GET /public/form-preview | 1 read（schema_questions） | 100 read | 0.002% |
| 合計 | - | 約 8,700 read / day | 0.17% |

→ 不変条件 #10（無料枠）を満たす。Cache を導入すれば実 read はさらに減る。

### Cache 戦略

| endpoint | Cache-Control | 理由 |
| --- | --- | --- |
| GET /public/stats | `public, max-age=60` | 60 秒は集計遅延として許容、Workers/Edge で 600 → 100 に削減見込み |
| GET /public/members | `no-store` | 管理者操作（publishState 変更）の即時反映が要件 |
| GET /public/members/:memberId | `no-store` | 同上 + leak リグレッション防止のため必ず最新を返す |
| GET /public/form-preview | `public, max-age=60` | schema_sync 直後に反映遅延 60 秒許容 |

D1 write 0、KV/R2/Queues 未使用。

## Secret hygiene checklist

- [ ] AUTH_SECRET / GOOGLE_CLIENT_ID 等の secret を本タスクで読み出さない（公開 API のため一切不要）
- [ ] env で導入する非機密値は `RESPONDER_URL` / `GOOGLE_FORM_RESPONDER_URL` のみ（wrangler vars）
- [ ] D1 binding を apps/api 以外で使用しない（不変条件 #5）
- [ ] log に email / memberId を hash 化せずに出さない（debug 環境限定 + redact）
- [ ] response body に `responseEmail` / `rulesConsent` / `adminNotes` を漏らさない（contract test で保証）
- [ ] error log に SQL 文 / placeholder 値を出さない（zod issues path も user-friendly に re-map）
- [ ] `wrangler.toml` の `vars` セクションに secret を書かない（必ず `secret put`）

## 品質チェック

| 項目 | 確認手段 | 期待 |
| --- | --- | --- |
| typecheck | `pnpm --filter api typecheck` | エラーゼロ |
| lint | `pnpm --filter api lint` | エラーゼロ |
| unit test | `pnpm --filter api test` | 全 pass |
| contract test | `pnpm --filter api test contract/public/*.test.ts` | 全 pass |
| leak test | `pnpm --filter api test leak/public/*.test.ts` | 全 pass（独立 suite） |
| authz test | `pnpm --filter api test authz/public/*.test.ts` | 4 endpoint 未認証 200 |
| search test | `pnpm --filter api test search/public/*.test.ts` | tag AND / fallback / clamp 全 pass |
| zod schema 整合 | converter 出力が `parse`（safeParse 不可）で通る | true |
| API error contract | error response が `{ code, message?, issues? }` で統一 | true |
| 04b / 04c との重複 | `publicFilter` が 04b/04c から import されていない | static check |

## leak test 結果（report）

| ケース | 期待 | 実装後の結果（placeholder） |
| --- | --- | --- |
| `/public/members` items に declined 0 件 | 0 件 | TBD |
| `/public/members` items に hidden 0 件 | 0 件 | TBD |
| `/public/members` items に deleted 0 件 | 0 件 | TBD |
| `/public/members/m_declined` | 404 | TBD |
| `/public/members/m_hidden` | 404 | TBD |
| `/public/members/m_deleted` | 404 | TBD |
| `/public/members/:適格` の field 全て visibility=public | 100% | TBD |
| `/public/members/:適格` keys に `responseEmail` 不在 | 不在 | TBD |
| `/public/members/:適格` keys に `rulesConsent` 不在 | 不在 | TBD |
| `/public/members/:適格` keys に `adminNotes` 不在 | 不在 | TBD |

## a11y（API 視点）

- error response の `message` を UI が i18n key として使える文字列にする
- `code` は machine-readable（`NOT_FOUND` / `BAD_REQUEST` / `INTERNAL`）、`message` は人間向け（UI が再翻訳可）
- ステータスコード設計が WCAG 表示要件と矛盾しない（404 を 200 で返さない、200 を 4xx で返さない）
- `application/json` 固定で content negotiation を強要しない（UI 側 fetch を簡素化）
- 多言語対応の余地として `Accept-Language` を将来の拡張余地に残す（MVP では ja のみ）

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | 無料枠 |
| 必須 | outputs/phase-04/test-matrix.md | leak / authz / search 検証 |
| 必須 | CLAUDE.md | secret 管理ルール |
| 参考 | docs/00-getting-started-manual/specs/09-ui-ux.md | a11y |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 品質チェック結果が GO/NO-GO 入力 |
| 09a (Wave 9) | staging で本 endpoint 群が pass する根拠 |
| 08a / 08b | leak test report と contract test 連動 |

## 多角的チェック観点（不変条件マッピング）

- #2（consent キー）— leak test で declined 0 件保証
- #3（`responseEmail`）— contract test で keys 不在保証、log にも出さない
- #5（apps/api 限定）— D1 binding が apps/api のみ
- #10（無料枠）— 見積もり 0.17% で十分余裕
- #11（admin-managed 分離）— `adminNotes` keys 不在、log にも出さない
- #14（schema 集約）— form-preview の field count を hardcode しない

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 無料枠見積もり | 9 | pending | outputs/phase-09/free-tier-estimate.md |
| 2 | secret hygiene check | 9 | pending | main.md |
| 3 | typecheck / lint / test 結果記録 | 9 | pending | placeholder（実行は実装タスクで） |
| 4 | leak test report | 9 | pending | outputs/phase-09/leak-test-report.md |
| 5 | a11y 観点記録 | 9 | pending | error response 設計 |
| 6 | Cache 戦略確定 | 9 | pending | endpoint ごと |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | Phase 9 主成果物 |
| ドキュメント | outputs/phase-09/free-tier-estimate.md | 無料枠見積もり |
| ドキュメント | outputs/phase-09/leak-test-report.md | leak test 結果 placeholder |
| メタ | artifacts.json | Phase 9 を `completed` に更新 |

## 完了条件

- [ ] 無料枠見積もりが各テーブルで 5% 未満
- [ ] secret hygiene checklist 全 pass
- [ ] leak test report 10 ケース placeholder 配置
- [ ] typecheck / lint / test がローカル placeholder で green 想定
- [ ] error response 形式が 04b / 04c と整合

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 全完了条件チェック
- [ ] artifacts.json の Phase 9 を `completed` に更新

## 次 Phase

- 次: 10（最終レビュー）
- 引き継ぎ事項: GO/NO-GO 判定の入力（無料枠 / secret / 品質 / leak）
- ブロック条件: leak test の placeholder に未確定項目があるか、無料枠見積もりが 50% 超なら NO-GO
