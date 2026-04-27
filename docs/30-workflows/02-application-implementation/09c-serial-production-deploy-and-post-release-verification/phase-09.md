# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09c-serial-production-deploy-and-post-release-verification |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| Wave | 9 |
| Mode | serial（最終） |
| 作成日 | 2026-04-26 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | pending |

## 目的

production deploy 直前の最終品質ゲートとして「無料枠見積もり（production 24h）」「secret hygiene（production secret の混入チェック）」「a11y（production smoke 後の WCAG AA 確認）」「品質ガード（lint / typecheck / test / build）」「rollback リハーサル（09b 引き渡し）」「不変条件 #5 / #6 / #10 / #11 / #15 の事前確認」の 6 軸で staging 結果と production 想定値を整合し、Phase 10 の GO/NO-GO 判定の根拠とする。production deploy 前に NO-GO 要素が見つかれば Phase 10 で blocker 解消まで進めない。

## 実行タスク

1. Cloudflare 無料枠（Workers / D1 / Pages）の production 24h 見積もり（MVP 基準: 5k req/day）
2. secret hygiene チェックリスト（production secret の log 漏洩 / commit 混入 / `.env` 残置）
3. a11y チェック（08b Playwright a11y suite を production URL placeholder で再走可能か事前確認）
4. 品質ガード（lint / typecheck / test / build を CI で再確認）
5. rollback リハーサル（09b で staging 試走済み、production 適用前の手順再確認）
6. 不変条件 #5 / #6 / #10 / #11 / #15 の production 文脈での再確認チェック

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | 無料枠仕様 |
| 必須 | doc/00-getting-started-manual/specs/09-ui-ux.md | a11y 観点 |
| 必須 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | rollback / secret 配信 |
| 必須 | doc/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-09.md | staging 品質ガード |
| 必須 | doc/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-09.md | cron 試算 / runbook a11y |
| 参考 | CLAUDE.md | secrets 管理ポリシー |

## 実行手順

### ステップ 1: 無料枠見積もり（production 24h）
- 想定: Workers req < 5k req/day（MVP 想定、staging の 30k より低いユーザー流入を想定）
- D1 reads / writes は無料枠の 10% 以下（reads 50k / writes 10k 以内）
- 実測は 24h 後に Cloudflare Analytics dashboard で取得

### ステップ 2: secret hygiene
- `git grep` で production 用 secret 名（`AUTH_SECRET=` / `GOOGLE_PRIVATE_KEY=` / `RESEND_API_KEY=`）の値が混入していないか
- `wrangler secret list --env production` の出力に予期しない secret がないか
- GitHub Actions 出力 log で production secret が masked されているか

### ステップ 3: a11y チェック
- 08b Playwright a11y suite が `BASE_URL=${PRODUCTION_WEB}` で実行可能な状態か
- WCAG AA 違反 0 件の判定基準が runbook に記載されているか

### ステップ 4: 品質ガード（CI 再確認）
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` を CI で再実行

### ステップ 5: rollback リハーサル
- 09b の rollback 試走（staging）結果を再確認
- production rollback の `wrangler deployments list --env production` の出力 placeholder を確認

### ステップ 6: 不変条件再確認
- #5 / #6 / #10 / #11 / #15 を production 文脈で個別確認

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO/NO-GO 判定の根拠（**production 用に厳格化**） |
| Phase 11 | smoke 後に同じ Cloudflare Analytics で 24h 再確認 |
| 上流 09a | staging 24h 結果と乖離がないか整合 |
| 上流 09b | cron 試算 97 req/day を production にも適用 |

## 多角的チェック観点（不変条件）

- 不変条件 #5: web bundle に D1 import なし（production deploy 前の build artifact で確認）
- 不変条件 #6: GAS apps script trigger を rollback 候補に含めない
- 不変条件 #10: 無料枠見積もりが PASS（10% 以下）
- 不変条件 #11: production admin UI に編集 form なし（grep + 目視チェックリスト）
- 不変条件 #15: attendance 重複防止 / 削除済み除外の SQL を 24h verify に含む

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 無料枠見積もり | 9 | pending | Workers / D1 / Pages |
| 2 | secret hygiene | 9 | pending | git grep / .env / log |
| 3 | a11y 確認 | 9 | pending | 08b a11y suite を production URL で |
| 4 | 品質ガード | 9 | pending | lint / typecheck / test / build |
| 5 | rollback リハーサル確認 | 9 | pending | 09b 試走結果 |
| 6 | 不変条件再確認 | 9 | pending | #5 / #6 / #10 / #11 / #15 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 品質サマリ + 6 軸チェック結果 |
| メタ | artifacts.json | Phase 9 を completed に更新 |

## 完了条件

- [ ] 無料枠見積もり PASS（Workers < 5k / D1 reads < 50k / D1 writes < 10k）
- [ ] secret hygiene 違反 0 件
- [ ] a11y violation 想定 0 件（runbook 上で実行可能と確認）
- [ ] 品質ガード 4 項目 green
- [ ] rollback リハーサル completed（09b 引き継ぎ）
- [ ] 不変条件 #5 / #6 / #10 / #11 / #15 の事前確認 PASS

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 6 軸チェックすべて PASS
- artifacts.json の phase 9 を completed に更新

## 次 Phase

- 次: 10 (最終レビュー)
- 引き継ぎ事項: 無料枠見積もり結果、secret hygiene 結果、a11y 結果、不変条件再確認結果
- ブロック条件: いずれかの軸で違反が 1 件でも出れば次 Phase へ進まず該当 task へ差し戻し（**production deploy 前の最終ゲート**）

## 無料枠見積もり（production 24h）

| メトリクス | 上限 | 想定実測（MVP） | 余裕 | 備考 |
| --- | --- | --- | --- | --- |
| Workers req | 100k req/day | < 5k req（MVP 想定ユーザー流入 + cron 97） | 95% | AC-8 基準 |
| D1 reads | 500k/day | < 50k（一覧 + 詳細 + admin queries） | 90% | AC-11 基準 |
| D1 writes | 100k/day | < 10k（sync UPSERT + admin notes） | 90% | AC-11 基準 |
| Pages req | 無制限相当 | - | - | 課金対象外 |

確認 URL（placeholder）:
- `${ANALYTICS_URL_API_PRODUCTION}` = `https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api/production/analytics`
- `${ANALYTICS_URL_D1_PRODUCTION}` = `https://dash.cloudflare.com/<account>/d1/databases/ubm_hyogo_production/metrics`

## Secret hygiene チェックリスト（production）

| # | 項目 | 確認コマンド | 期待 |
| --- | --- | --- | --- |
| 1 | リポジトリに secret 平文がない | `git grep -n "AUTH_SECRET=\|GOOGLE_PRIVATE_KEY=\|RESEND_API_KEY="` | 0 hit |
| 2 | `.env` 系がコミット対象外 | `git check-ignore -v .env .env.production` | 全て ignored |
| 3 | GitHub Actions log で secret が masked | `gh run view --log` で `***` 表示 | masked |
| 4 | wrangler secret 一覧で予期せぬ secret なし | `wrangler secret list --env production --config apps/api/wrangler.toml` | 4 種のみ（`GOOGLE_*` / `RESEND_API_KEY`） |
| 5 | Pages secret 一覧で予期せぬ secret なし | `wrangler pages secret list --project-name ubm-hyogo-web` | 3 種のみ（`AUTH_*`） |
| 6 | runbook に secret 実値がない | `rg "AUTH_SECRET=[a-zA-Z0-9]" doc/02-application-implementation/09c-*/` | 0 hit |
| 7 | release tag に secret 値が含まれない | `git tag -l "v*" --format='%(contents)'` | placeholder のみ |

## a11y チェック（production URL、placeholder で再走可能か事前確認）

| ページ | 確認項目 | 期待 |
| --- | --- | --- |
| `/` | landmark / heading / contrast | violation 0 |
| `/members` | filter form の label / focus order | violation 0 |
| `/members/:id` | summary 表の構造 / a11y label | violation 0 |
| `/login` | form / error message の aria | violation 0 |
| `/profile` | summary 表 + Forms 編集ボタンの aria-label | violation 0 |
| `/admin` | nav / table / drawer 操作 | violation 0 |
| `/admin/members` | drawer + status の aria | violation 0 |
| `/admin/tags` | queue UI の aria | violation 0 |
| `/admin/schema` | diff + alias の aria | violation 0 |
| `/admin/meetings` | session 操作の aria | violation 0 |

## 品質ガード（CI 再確認）

| ガード | コマンド | 期待 |
| --- | --- | --- |
| lint | `pnpm lint` | exit 0 |
| typecheck | `pnpm typecheck` | exit 0 |
| test | `pnpm test` | exit 0 |
| build | `pnpm build` | exit 0 |

## rollback リハーサル確認（09b 引き継ぎ）

| rollback 種別 | 09b 試走済み | 09c production 適用前確認 |
| --- | --- | --- |
| A. Worker rollback | staging で試走済 | `wrangler deployments list --env production` の出力 placeholder 確認 |
| B. Pages rollback | staging で試走済 | Cloudflare Dashboard 操作手順を再確認 |
| C. D1 migration rollback | spec 上記述 | 後方互換 fix migration 手順の妥当性 |
| D. Cron 一時停止 | staging で試走済 | `crons = []` の挙動を 09b で確認済 |
| E. Release tag 取消 | 09c 固有 | spec 上の immutable 原則確認 |

## 不変条件 #5 / #6 / #10 / #11 / #15 事前確認

| 不変条件 | 確認方法（pre-deploy） | 期待 |
| --- | --- | --- |
| #5 apps/web → D1 直接禁止 | `rg "D1Database\|env\.DB" apps/web/.vercel/output/` | 0 hit |
| #6 GAS prototype 昇格しない | `rg -niw "GAS\|onFormSubmit\|Apps Script trigger" apps/api/src/ apps/web/src/` | 0 hit |
| #10 Cloudflare 無料枠 | 上記 24h 見積もり | 10% 以下 |
| #11 admin は本人本文を直接編集できない | `rg -niw "editable\|input.*memberBody\|textarea.*memberBody" apps/web/src/app/admin/` | 0 hit |
| #15 attendance 重複防止 / 削除済み除外 | unique index + `WHERE deleted_at IS NULL` の存在を 02a / 06b で確認済 | spec 整合 |
