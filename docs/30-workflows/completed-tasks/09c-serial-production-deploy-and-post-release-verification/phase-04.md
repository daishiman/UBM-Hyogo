# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09c-serial-production-deploy-and-post-release-verification |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | 9 |
| Mode | serial（最終） |
| 作成日 | 2026-04-26 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | spec_created |

## 目的

production deploy 13 ステップ + tag + share + 24h verify を 4 層（pre-deploy 検証 / deploy 中検証 / smoke / post-release）に分割し、各 AC（AC-1〜AC-12）を verify suite に対応付ける。

## 実行タスク

1. verify suite 4 層 × 各層 3〜5 ケース
2. AC ↔ verify suite matrix（12 AC × N suite）
3. 失敗時差し戻し先

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | wrangler / D1 / secrets / triggers |
| 必須 | docs/00-getting-started-manual/specs/14-implementation-roadmap.md | Phase 7 受け入れ |
| 必須 | docs/30-workflows/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-04.md | staging suite |
| 必須 | docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-04.md | runbook suite |

## 実行手順

### ステップ 1: verify suite 4 層
- pre-deploy / deploy 中 / smoke / post-release

### ステップ 2: AC matrix

### ステップ 3: 差し戻し先

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | suite を runbook の sanity check に紐付け |
| Phase 7 | AC matrix |
| Phase 11 | manual evidence で 4 層を実行 |
| 上流 09a | smoke 結果を receive |
| 上流 09b | rollback / cron 確認 suite を receive |

## 多角的チェック観点（不変条件）

- #4: smoke で `/profile` の編集 form 不在を確認
- #5: post-release で `apps/web` build artifact に D1 import がないことを確認
- #10: post-release で 24h Cloudflare Analytics 確認
- #11: smoke で admin UI に本人本文編集 form 不在を確認
- #15: post-release で attendance 重複防止 SQL 確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | verify suite 4 層設計 | 4 | pending | pre / deploy / smoke / post |
| 2 | AC matrix | 4 | pending | 12 AC × N suite |
| 3 | 差し戻し先 | 4 | pending | 09a / 09b / 03b / 04c |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | 戦略サマリ |
| ドキュメント | outputs/phase-04/verify-suite.md | 4 層 × ケース |
| メタ | artifacts.json | Phase 4 を completed に更新 |

## 完了条件

- [ ] 4 層 × 3〜5 ケース = 12〜20 ケース
- [ ] AC 12 件すべて対応
- [ ] 各 suite に確認コマンド付与

## タスク100%実行確認【必須】

- 全実行タスクが completed
- verify-suite.md 完成
- 未対応 AC 0 件
- artifacts.json の phase 4 を completed に更新

## 次 Phase

- 次: 5 (実装ランブック)
- 引き継ぎ事項: verify suite / AC matrix / 差し戻し先
- ブロック条件: 未対応 AC で次 Phase に進まない

## Verify suite 設計

### 1. pre-deploy 層（main merge / 上流 AC 確認 / D1 backup）

| ID | ケース | 期待 |
| --- | --- | --- |
| P-1 | `git log origin/main..origin/dev --oneline` で merge 対象 commit が一覧化される | 1 件以上 |
| P-2 | 09a / 09b の AC matrix がすべて completed である | `grep -c "completed" artifacts.json` で全件 PASS |
| P-3 | `bash scripts/cf.sh d1 export ubm_hyogo_production --remote --output=backup-<ts>.sql --env production` が成功 | backup ファイル存在、サイズ > 0 |
| P-4 | `git status` で staging branch に未コミット変更がない | clean |

### 2. deploy 中層（migration / secrets / api+web deploy）

| ID | ケース | 期待 |
| --- | --- | --- |
| D-1 | `bash scripts/cf.sh d1 migrations list ubm_hyogo_production --remote --env production` で全件 `Applied` | AC-1 PASS |
| D-2 | `bash scripts/cf.sh secret list --env production` で必須 4 種（GOOGLE_*, RESEND_API_KEY）あり | AC-2 PASS（api 側） |
| D-3 | `bash scripts/cf.sh pages secret list --project-name ubm-hyogo-web` で必須 3 種（AUTH_*）あり | AC-2 PASS（web 側） |
| D-4 | `pnpm --filter @ubm/api deploy:production` exit 0 | AC-3 PASS（api） |
| D-5 | `pnpm --filter @ubm/web deploy:production` exit 0 | AC-3 PASS（web） |

### 3. smoke 層（10 ページ + 認可境界 + manual sync）

| ID | ケース | 期待 |
| --- | --- | --- |
| S-1 | `/`, `/members`, `/members/:id` 公開 3 ページが 200（未認証） | AC-4 部分（public） |
| S-2 | `/login` が 200、Auth.js リダイレクト先が `/profile` | AC-4 部分（authn 入口） |
| S-3 | 認証後 `/profile` 200、編集 form **不在** | AC-4 + AC-9（不変条件 #4） |
| S-4 | 認証後 `/admin`, `/admin/members`, `/admin/tags`, `/admin/schema`, `/admin/meetings` の 5 ページが admin role で 200、member role で 403 | AC-4 + 認可境界 |
| S-5 | `POST /admin/sync/schema` + `POST /admin/sync/responses` が 200、`sync_jobs` に `success` 行追加 | AC-5 PASS |

### 4. post-release 層（tag / share / 24h verify / 不変条件再確認）

| ID | ケース | 期待 |
| --- | --- | --- |
| R-1 | `git tag` で `vYYYYMMDD-HHMM` 形式が `main` 最新 commit に存在 | AC-6 PASS（local） |
| R-2 | `git ls-remote --tags origin | grep vYYYYMMDD-HHMM` で remote 反映 | AC-6 PASS（remote） |
| R-3 | incident runbook 共有 evidence（Slack post URL / Email log）が share-evidence.md にある | AC-7 PASS |
| R-4 | 24h 後の Cloudflare Workers Analytics で req < 5k/day | AC-8 PASS（Workers） |
| R-5 | 24h 後の Cloudflare D1 metrics で reads / writes が無料枠 10% 以下 | AC-8 PASS（D1） + AC-11 PASS（#10） |
| R-6 | `rg D1Database apps/web/.vercel/output` で 0 hit | AC-10 PASS（#5） |
| R-7 | production admin UI に本人本文編集 form 不在を click 確認 | AC-12 PASS（#11） |
| R-8 | `SELECT session_id, member_id, COUNT(*) c FROM attendances WHERE deleted_at IS NULL GROUP BY session_id, member_id HAVING c > 1;` で 0 行 | 不変条件 #15 PASS |

## AC ↔ verify suite matrix

| AC | 内容 | 対応 suite |
| --- | --- | --- |
| AC-1 | D1 migration 最新まで Applied | D-1 |
| AC-2 | secrets 7 種 production にあり | D-2 + D-3 |
| AC-3 | api / web deploy exit 0 | D-4 + D-5 |
| AC-4 | 10 ページ smoke 200 / 認可境界 | S-1〜S-4 |
| AC-5 | manual sync success + sync_jobs success | S-5 |
| AC-6 | release tag `vYYYYMMDD-HHMM` 付与 + push | R-1 + R-2 |
| AC-7 | incident runbook 関係者共有記録 | R-3 |
| AC-8 | 24h Analytics 無料枠 10% 以下 | R-4 + R-5 |
| AC-9 | 不変条件 #4（本人本文 override しない） | S-3 |
| AC-10 | 不変条件 #5（web → D1 直接禁止） | R-6 |
| AC-11 | 不変条件 #10（無料枠） | R-5 |
| AC-12 | 不変条件 #11（admin は本文編集不可） | R-7 |

## 差し戻し先

| 検出 suite | 差し戻し先 task | 理由 |
| --- | --- | --- |
| D-1 失敗 | 02a（D1 schema） | migration 不整合 |
| D-2/D-3 失敗 | 04 infra（secrets 配信） | secret 未登録 |
| D-4/D-5 失敗 | 該当 wave（02c / 03 / 04 / 05） | build / deploy 設定 |
| S-1〜S-4 失敗 | 該当 wave（05 / 06 / 07） | UI 実装 |
| S-5 失敗 | 03b（response sync） | sync 実装 |
| R-1/R-2 失敗 | 09c Phase 5 修正 | tag script 修正 |
| R-3 失敗 | 09c Phase 11 修正 | 共有 evidence 取得方法修正 |
| R-4/R-5 失敗 | 03b / 09b | cron 頻度 / 02a 02b query 最適化 |
| R-6 失敗 | 02c（web 専用） | bundle 設定 |
| R-7 失敗 | 07a / 07b（admin UI） | admin 編集 form 削除 |
| R-8 失敗 | 06b（attendance） | 重複防止 unique 制約 |
