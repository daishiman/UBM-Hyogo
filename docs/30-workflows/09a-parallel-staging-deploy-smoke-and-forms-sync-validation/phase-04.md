# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09a-parallel-staging-deploy-smoke-and-forms-sync-validation |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | 9 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending |

## 目的

staging deploy / sync 検証 / Playwright / smoke を「unit / contract / E2E / authorization / health」の 5 層に分割し、各 AC を verify suite に対応させる。spec_created なので「テスト設計のみ」、実装は別タスクで行う。

## 実行タスク

1. verify suite を 5 層 × 各層 3〜5 ケースで設計する
2. 各 AC（AC-1 〜 AC-9）が verify suite のどのケースで担保されるか matrix を作る
3. staging プロファイルでの実行コマンドを suite 単位で確定する
4. 失敗時の差し戻し先（08a / 08b / 04 secrets）を明記する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/ | contract / authorization test の引き継ぎ |
| 必須 | docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/ | Playwright suite |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | リリース前チェック |
| 必須 | docs/00-getting-started-manual/specs/03-data-fetching.md | sync ジョブ検証点 |

## 実行手順

### ステップ 1: verify suite 設計
- `outputs/phase-04/verify-suite.md` に 5 層 × ケースを書く
- staging プロファイルでの実行コマンドを各ケースに紐付け

### ステップ 2: AC ↔ verify suite matrix
- AC-1 〜 AC-9 と verify suite ケースを 1 対 1 以上で対応付け

### ステップ 3: 失敗時の差し戻し設計
- 各 verify ケースが fail した場合の責務 task を決める

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | verify suite の各ケースを runbook の sanity check に紐付け |
| Phase 7 | AC matrix の検証列に suite ケース ID を入れる |
| Phase 11 | 手動 smoke で suite に未収載の項目があれば追記 |
| 並列 09b | release runbook の monitoring suite と整合 |

## 多角的チェック観点（不変条件）

- 不変条件 #5: e2e-boundary suite で apps/web bundle に `D1Database` import が無いことを assertion
- 不変条件 #10: free-tier suite で staging Workers req と D1 reads の見積もりを assertion
- 不変条件 #11: admin-ui-edit suite で staging admin に編集 form がないことを assertion

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | verify suite 5 層設計 | 4 | pending | unit/contract/e2e/authz/health |
| 2 | AC ↔ suite matrix 作成 | 4 | pending | 9 AC × N suite |
| 3 | 失敗差し戻し先表 | 4 | pending | 08a/08b/04 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | 戦略サマリ |
| ドキュメント | outputs/phase-04/verify-suite.md | 5 層 × ケース定義 |
| メタ | artifacts.json | Phase 4 実行時に artifacts.json を更新 |

## 完了条件

- [ ] 5 層 × 3〜5 ケース = 15 〜 25 ケース定義
- [ ] AC 9 件すべてが suite に対応
- [ ] 各 suite に staging 実行コマンドが付与

## タスク100%実行確認【必須】

- 全実行タスクが実行時に完了条件を満たす
- verify-suite.md が 5 層分埋まっている
- AC ↔ suite matrix で未対応 AC が 0 件
- artifacts.json の phase 4 は実行時に更新

## 次 Phase

- 次: 5 (実装ランブック)
- 引き継ぎ事項: verify suite、AC matrix、失敗差し戻し先表
- ブロック条件: 未対応 AC が 1 件でもあれば次 Phase に進まない

## Verify suite 設計

### 1. unit 層（D1 / wrangler config 単体）

| ID | ケース | 期待 | 失敗時差し戻し |
| --- | --- | --- | --- |
| U-1 | `wrangler d1 migrations list ubm_hyogo_staging` | 全 migration が `Applied` | 01a へ差し戻し |
| U-2 | `wrangler secret list --config apps/api/wrangler.toml` | 4 種の secret 存在 | 04 (infra) へ差し戻し |
| U-3 | `wrangler pages secret list --project-name ubm-hyogo-web-staging` | 3 種の secret 存在 | 04 (infra) へ差し戻し |

### 2. contract 層（staging API レスポンス）

| ID | ケース | 期待 | 失敗時差し戻し |
| --- | --- | --- | --- |
| C-1 | `curl https://ubm-hyogo-api-staging.../public/stats` | `PublicStatsView` zod parse pass | 04a |
| C-2 | `curl https://ubm-hyogo-api-staging.../public/members` | `PublicMemberListView` zod parse pass、`isDeleted=true` を 0 件 | 04a |
| C-3 | `curl -H "Authorization: ..." .../me` | `SessionUser` zod parse pass | 04b |
| C-4 | `curl -X POST -H "Authorization: ..." .../admin/sync/schema` | 200 + `sync_jobs.success` | 03a |
| C-5 | `curl -X POST -H "Authorization: ..." .../admin/sync/responses` | 200 + `sync_jobs.success` | 03b |

### 3. e2e 層（Playwright staging プロファイル）

| ID | ケース | 期待 | 失敗時差し戻し |
| --- | --- | --- | --- |
| E-1 | landing → /members → /members/:id 導線 | screenshot 一致 | 06a |
| E-2 | /login で AuthGateState 5 状態出し分け | 各状態 screenshot | 06b / 05b |
| E-3 | /profile で editResponseUrl ボタン → 外部遷移 | URL が responderUrl | 06b |
| E-4 | /admin → /admin/members 認可 | 未ログインで 401/redirect | 06c / 05a |
| E-5 | /admin/tags queue resolve → member_tags 反映 | reload 後反映 | 07a |

### 4. authorization 層（認可境界）

| ID | ケース | 期待 | 失敗時差し戻し |
| --- | --- | --- | --- |
| A-1 | 未ログインで `GET /me` | 401 | 04b / 05a |
| A-2 | 一般 user で `GET /admin/dashboard` | 403 | 04c / 05a |
| A-3 | admin で `GET /admin/dashboard` | 200 + `AdminDashboardView` | 04c / 05a |

### 5. health 層（無料枠 / boundary）

| ID | ケース | 期待 | 失敗時差し戻し |
| --- | --- | --- | --- |
| H-1 | apps/web bundle に `D1Database` import なし | grep 0 件 | 02c (data-access-boundary) |
| H-2 | Cloudflare Analytics で staging Workers req 24h | 30k req 以下 | 04c / 03a/b（過剰呼出し疑い） |
| H-3 | Cloudflare D1 metrics で staging reads 24h | 50k 以下 | 02a/b/c |
| H-4 | staging admin UI で「他人本文編集 form」検索 | 0 hit | 06c / 04c |

## AC ↔ verify suite matrix

| AC | 対応 suite |
| --- | --- |
| AC-1 (D1 migration) | U-1 |
| AC-2 (secrets) | U-2, U-3 |
| AC-3 (deploy exit 0) | runbook の手順 + GitHub Actions log |
| AC-4 (schema sync success) | C-4 |
| AC-5 (responses sync success) | C-5 |
| AC-6 (Playwright green) | E-1〜E-5 |
| AC-7 (10 ページ smoke) | E-1〜E-5 + 手動 smoke |
| AC-8 (#5 boundary) | H-1 |
| AC-9 (#10 free-tier) | H-2, H-3 |
