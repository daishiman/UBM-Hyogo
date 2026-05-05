# Phase 9 補助成果物: deploy contract 整合確認（Pages vs Workers）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-CICD-DRIFT |
| Phase | 9 / 13 |
| 作成日 | 2026-04-29 |
| 範囲 | apps/web の deploy target に関する Pages vs OpenNext Workers の判断材料整理 |
| 結論 | current contract の確定は本タスク内では行わず、派生 `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` に委譲 |

## 全体方針

`deployment-cloudflare.md`（正本仕様）と `apps/web/wrangler.toml`（実体）の deploy target に関する drift を 5 観点で表化し、Pages vs OpenNext on Workers のどちらを current contract とするかの判断材料を整理する。本タスクは判断材料の提示のみで、確定判断は派生タスクに委譲する。

## 5 観点 drift 表

| 観点 | `deployment-cloudflare.md` 表記 | `apps/web/wrangler.toml` 実体 | drift 種別 | 派生タスク化先 |
| --- | --- | --- | --- | --- |
| Pages 前提 | `pages_build_output_dir` を持つこと（旧仕様の名残の可能性） | 実値の有無を確認（Phase 11 smoke で grep） | docs-only or impl | `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` |
| OpenNext on Workers 前提 | `main = ".open-next/worker.js"` 等 | 同上 | 同上 | 同上 |
| Cron Triggers | `[triggers] crons = ['0 */6 * * *']` 形式 | 同上 | docs-only | impl 派生で wrangler.toml に追加が必要なら起票 |
| `[assets]` block | OpenNext on Workers 前提で必要 | 同上 | impl | 派生（`UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` の確定後） |
| compatibility_date / compatibility_flags | SSOT 化対象 | 実値確認 | docs-only | `deployment-cloudflare.md` で SSOT 化 |

## Pages vs OpenNext on Workers のメリデメ比較

### Cloudflare Pages（build budget 監視）

| 観点 | 内容 |
| --- | --- |
| メリット | Pages 専用 build pipeline、Preview deploy が容易、無料枠 500 builds/month |
| デメリット | OpenNext on Workers と機能整合が薄い、Static export 制約、Cron Triggers が直接持てない |
| 05a 監視 | Pages build budget をターゲットに監視可能 |
| current 状態 | 旧仕様で記述された可能性、実体は OpenNext へ移行中 |

### OpenNext on Cloudflare Workers（Workers limits 監視）

| 観点 | 内容 |
| --- | --- |
| メリット | Next.js App Router フル対応、Cron Triggers 内包、`@opennextjs/cloudflare` で SSR / RSC 対応 |
| デメリット | `[assets]` block / `compatibility_flags` の追加設定が必要、Pages preview に相当する仕組みが別途必要 |
| 05a 監視 | Workers req / CPU time / KV ops を監視 |
| current 状態 | CLAUDE.md スタック表で「Cloudflare Workers + Next.js App Router via `@opennextjs/cloudflare`」と明記、こちらが target contract |

## 推奨方向（判断材料としての整理）

CLAUDE.md スタック表が `Cloudflare Workers + Next.js App Router via @opennextjs/cloudflare` を正と明記しているため、**OpenNext on Workers が target contract**。Pages 前提の記述（仕様書 / wrangler.toml に残った場合）は cleanup 対象。ただし current contract の最終確定および wrangler.toml 編集は派生 `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` に委譲する。

## OpenNext on Workers 切替時の追加 Secret 洗い出し

| Secret 名 | 既存？ | 追加必要？ | 備考 |
| --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | 既存 | 追加不要 | wrangler deploy 時に流用 |
| `CLOUDFLARE_ACCOUNT_ID` | 既存 | 追加不要 | 同上 |
| OpenNext 特有 token | なし | なし | OSS のため追加 Secret 不要 |
| KV / R2 binding 用 token | 状況次第 | 派生で確認 | binding 名と Secret 注入経路は派生タスクで設計 |

新規 Secret 導入 0 を維持できる見込み。

## 不変条件抵触確認

| 不変条件 | 抵触の有無 | 根拠 |
| --- | --- | --- |
| #5（D1 への直接アクセスは `apps/api` に閉じる） | 抵触なし（想定） | apps/web は OpenNext 経由でも D1 直アクセスを行わず、`apps/api` 経由に統一 |
| #6（GAS prototype を本番昇格させない） | 抵触なし | deploy 対象は apps/web のみ、GAS prototype は CI/CD 対象外 |

抵触が新たに発見された場合、派生タスクで blocker 印とともに起票する。

## 派生タスク化方針

| 派生タスク | スコープ |
| --- | --- |
| `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` | apps/web の current contract 確定（Pages 廃止 / OpenNext 統一の意思決定）と wrangler.toml 編集、`deployment-cloudflare.md` 後追い SSOT 化 |
| `UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC` | 上記決定後、05a observability-matrix.md の監視対象を Workers limits に揃える |

## 完了条件チェック

- [x] 5 観点で drift 表化
- [x] Pages vs OpenNext のメリデメ整理
- [x] 推奨方向の判断材料記述（決定はしない）
- [x] 切替時の追加 Secret 洗い出し
- [x] 不変条件抵触確認
- [x] 派生タスク化方針記述

## 次 Phase への引き渡し

- 本ファイルを Phase 10 GO/NO-GO 判定の deploy contract 根拠に使用
- 派生 `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` を Phase 12 で起票
- ブロック条件: drift 表に空セル / 派生タスク化方針未確定 / 不変条件抵触の見落とし
