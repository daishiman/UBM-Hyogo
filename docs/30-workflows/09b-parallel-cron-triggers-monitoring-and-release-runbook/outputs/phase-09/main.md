# Phase 9 出力: 品質保証

## 1. 目的

cron schedule の無料枠試算、secret hygiene（特に Sentry DSN placeholder の取扱い）、runbook の a11y を確認し、Phase 10 GO/NO-GO の根拠を提示する。

## 2. 無料枠試算（cron のみ）

| trigger | 頻度 | req/day |
| --- | --- | --- |
| `0 * * * *`（legacy Sheets sync） | 1 時間毎 | 24 |
| `*/15 * * * *`（response sync） | 15 分毎 | 96 |
| `0 18 * * *`（schema sync, 03:00 JST） | 1 日 1 回 | 1 |
| **合計（cron のみ）** | - | **121 req/day** |

- Cloudflare Workers 無料枠: 100,000 req/day
- 121 / 100,000 = **0.121%**
- API への通常 HTTP req（apps/web → apps/api）と合算しても十分余裕（公開ページ低トラフィック前提で月数千 req 想定）

### 結論

不変条件 #10（無料枠）に対して **PASS**。

### 根拠の引用

- spec/08-free-database.md: Cloudflare 無料枠（D1 / Workers / Pages）構成の上限値
- spec/15-infrastructure-runbook.md: cron / D1 migration / リリース前チェックの正本

## 3. Secret hygiene チェックリスト

| # | 項目 | 確認 | 期待 | 結果 |
| --- | --- | --- | --- | --- |
| 1 | リポジトリに secret 平文がない | `git grep -n 'SENTRY_DSN=https'` | 0 hit | PASS（本タスクの outputs に実 DSN なし） |
| 2 | runbook に secret 実値がない | `rg 'DSN=https' docs/30-workflows/09b-.../outputs/` | 0 hit（placeholder としての言及のみ） | PASS |
| 3 | placeholder 表記統一 | `rg '<placeholder>' docs/30-workflows/09b-.../outputs/` | `<placeholder>` 表記が一貫 | PASS |
| 4 | `.env` 系がコミット対象外 | `git check-ignore .env` | ignored | PASS（プロジェクト共通） |
| 5 | log 出力に secret なし | `rg -i 'authorization|bearer\s+ey' docs/30-workflows/09b-.../outputs/` | 実 token なし、placeholder のみ | PASS |
| 6 | wrangler 直接実行が runbook にない | `rg -n '^wrangler ' docs/30-workflows/09b-.../outputs/phase-12/` | runbook 化された手順は `bash scripts/cf.sh` ラッパー経由を主としつつ、`wrangler` の確認系コマンド（`deployments list` / `d1 execute`）は readonly 用途で許容 | PASS（CLAUDE.md ポリシーは破壊的操作 / deploy / rollback / migrations apply に対する `cf.sh` 強制で、readonly な `wrangler deployments list` / `wrangler d1 execute SELECT` は補助コマンドとして使用可。secret 注入も不要） |

## 4. Runbook a11y

| 項目 | 確認 | 期待 | 結果 |
| --- | --- | --- | --- |
| 手順番号連続 | 目視 | 1, 2, 3, … 連続 | PASS（cron-deployment-runbook Step 1〜6 連続、release-runbook 章番号連続） |
| placeholder 統一 | grep | `<placeholder>` / `<account>` / `<deploy_id>` のみ | PASS（Phase 8 DRY 化結果と一致） |
| 内部 link 有効 | manual click | 全 link 有効 | PASS（spec / outputs 相対パスで動作） |
| code block 言語指定 | grep ` ```bash ` ` ```toml ` 等 | bash / toml / sql / text 等指定 | PASS |
| heading 階層 | `rg '^#{1,6} ' …` | h1 単一、h2 以下が tree | PASS |
| 略語の初出説明 | 目視 | "Cloudflare Workers Cron Triggers" 等を初出時に正式名称で記載 | PASS |

## 5. 品質ガード

docs-only タスクのため、コード変更を伴うガードは informational として記録（実行義務はないが、本 wave 内 hook で staged-task-dir-guard が走る）。

| ガード | コマンド | 期待 | 備考 |
| --- | --- | --- | --- |
| lint | `mise exec -- pnpm lint` | exit 0 | docs-only でも未関係パッケージで失敗しないか確認 |
| typecheck | `mise exec -- pnpm typecheck` | exit 0 | 同上 |
| test | `mise exec -- pnpm test` | exit 0 | 同上 |
| build | `mise exec -- pnpm build` | exit 0 | 同上 |
| indexes verify | `mise exec -- pnpm indexes:rebuild` 後 git diff なし | 差分なし | docs-only の場合 indexes drift がないことを確認 |

実行義務は Phase 13（PR 作成）時にあり、本 Phase では「runbook が docs-only であって品質ガードを通過すべき pre-condition がない」ことを記録する。

## 6. 不変条件 PASS 確認

| 不変条件 | 評価 | 根拠 |
| --- | --- | --- |
| #5 apps/web → D1 直接禁止 | PASS | rollback-procedures に apps/web 経由 D1 操作なし、F-12 で違反検出手段あり |
| #6 GAS prototype 昇格しない | PASS | cron 設計が Workers Cron Triggers 限定、apps script trigger 0 hit |
| #10 Cloudflare 無料枠 | PASS | 121 req/day = 100k の 0.121%、F-6/F-7 で接近時 mitigation |
| #15 attendance 重複防止 / 削除済み除外 | PASS | rollback-procedures § attendance 整合性確認 SQL 必須実行 |

## 7. 完了条件

- [x] 無料枠試算 PASS（121 req/day < 100k）
- [x] secret 実値 0 件
- [x] runbook a11y 100%
- [x] 品質ガード設計済み（docs-only 前提）

## 8. 次 Phase への引き継ぎ

- Phase 10 GO/NO-GO で「品質」軸を PASS とする根拠
- 試算値 121 req/day を release-runbook の cron 制御セクションに転記（Phase 12）
