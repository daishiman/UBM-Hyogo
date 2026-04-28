# Phase 1: 要件定義サマリー

## 1. タスク分類とスコープ固定

| 項目 | 値 |
| --- | --- |
| taskId | UT-06 |
| taskName | 本番デプロイ実行 |
| taskType | **implementation** (本番環境への実デプロイを伴う) |
| Wave | 1 |
| 実行モード (本タスク) | docs-only (ユーザー指示によりドキュメントのみ作成。本番影響コマンドは未発火) |
| 不可逆操作 | D1 マイグレーション本番適用 / Workers 本番デプロイ / OpenNext Workers 本番デプロイ |
| Issue | #8 (CLOSED) — 実行時は再オープンまたは別 Issue 起票要 |

## 2. AC × Phase 別証跡責務マッピング

| AC | 内容 | 主担当 Phase | 副担当 Phase | 証跡パス |
| --- | --- | --- | --- | --- |
| AC-1 | Web 本番 URL 200 OK | Phase 5 | Phase 11 | outputs/phase-05/deploy-execution-log.md, outputs/phase-11/smoke-test-result.md |
| AC-2 | API Workers `/health` healthy | Phase 5 | Phase 11 | outputs/phase-05/deploy-execution-log.md, outputs/phase-11/smoke-test-result.md |
| AC-3 | D1 migrations 履歴記録 | Phase 5 | — | outputs/phase-05/migration-apply-record.md |
| AC-4 | Workers→D1 SELECT 疎通 | Phase 5 | Phase 11 | outputs/phase-05/deploy-execution-log.md, outputs/phase-11/smoke-test-result.md |
| AC-5 | smoke test 全件 PASS | Phase 11 | Phase 5 | outputs/phase-11/smoke-test-result.md |
| AC-6 | デプロイ実施記録文書化 | Phase 5 | — | outputs/phase-05/deploy-execution-log.md |
| AC-7 | D1 export バックアップ取得 | Phase 5 | — | outputs/phase-05/d1-backup-evidence.md |
| AC-8 | ロールバック runbook 事前確認 | Phase 2 | Phase 6 | outputs/phase-02/rollback-runbook.md, outputs/phase-06/abnormal-case-matrix.md |

## 3. スコープ

### 含む
- Cloudflare Workers (`apps/web` + OpenNext Workers / `apps/api`) 本番初回デプロイ
- D1 本番マイグレーション初回適用 (`apps/api/migrations/0001_init.sql`)
- デプロイ後 smoke test (Pages 200 / API /health / D1 SELECT)
- 本番 URL 確認・記録
- D1 本番バックアップ取得手順整備
- ロールバック手順の事前確認・runbook 化

### 含まない
- 本番データ投入 / Sheets→D1 初回同期 (UT-09)
- 継続モニタリング・アラート設定 (UT-08)
- CI/CD パイプライン構築 (UT-05)
- カスタムドメイン完全設定 (DNS 構成)
- アプリ機能実装

## 4. 4 条件評価観点 (Phase 1 時点の所感)

| 条件 | 観点 | 所感 |
| --- | --- | --- |
| 価値性 | Wave 1 infra first deploy 完了が後続 UT-08 / UT-09 / 02-application-implementation のクリティカルパス解放に直結 | 高い |
| 実現性 | package/lockfile の wrangler version が利用可能・mise (Node 24.15.0 / pnpm 10.33.2) で実行環境固定済 | 実現可能 |
| 整合性 | OpenNext Workers 正本仕様 (deployment-cloudflare.md) と現状 `apps/web/wrangler.toml` (`pages_build_output_dir = ".next"` の Pages 形式) に乖離あり → Phase 2 で要対処 | 要調整 |
| 運用性 | バックアップ → 適用 → デプロイ → smoke → 記録 / 失敗ロールバックのフローが unassigned 出典で確立済 | 良好 |

## 5. 既存資産インベントリ (要点・詳細は existing-assets-inventory.md)

- `apps/api/wrangler.toml`: `name = "ubm-hyogo-api"`, D1 binding `DB`, トップレベル設定が production 扱い (明示的 `[env.production]` セクション無し)
- `apps/web/wrangler.toml`: `name = "ubm-hyogo-web"`, `pages_build_output_dir = ".next"` (Pages 形式と OpenNext Workers の併存課題)
- `apps/api/migrations/0001_init.sql`: 1 件のみ (初期スキーマ DDL)
- `.mise.toml`: Node 24.15.0 / pnpm 10.33.2 固定
- 上流タスク: `02-serial` `03-serial` は `completed-tasks/` 配下、`04-serial` `05b-parallel` は `01-infrastructure-setup/` 配下に存在

## 6. carry-over 確認

```
git rev-parse HEAD: 99fa85921e0ca0a775acc9f97cbe3b787e2c8116

git log --oneline -5:
99fa859 Merge pull request #74 from daishiman/feat/ut-05-followup-specs
bc13be8 merge: sync feat/ut-05-followup-specs with main
12dc7df docs(ut-05-followup): UT-05 派生未タスク仕様書 5 件を追加
3084265 Merge pull request #72 from daishiman/docs/05b-phase12-closeout-and-skill-sync
398d162 merge: resolve conflicts with origin/main
```

→ 直前は UT-05 派生仕様の docs PR。本タスクは UT-06 仕様の outputs/ 整備のみで作業を進める。

## 7. targeted run 方針

| 対象 | コマンド | 目的 | 本タスクでの実施 |
| --- | --- | --- | --- |
| web build | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | OpenNext adapter 出力確認 | docs-only モードのため未実施 |
| api build | `mise exec -- pnpm --filter @ubm-hyogo/api build` | API Workers build 確認 | 未実施 |
| typecheck | `mise exec -- pnpm typecheck` | 型整合 | 未実施 (実行時に推奨) |
| wrangler ver | `bash scripts/cf.sh --version` | CLI 確認 | **4.84.1 確認済 (期待 3.x 以上を満たす)** |
| wrangler whoami | `bash scripts/cf.sh whoami` | アカウント確認 | 本番アクセス系のため未実行 |

## 8. 本番実行承認方針

**承認ゲート**: Phase 4 で `outputs/phase-04/production-approval.md` に下記を記録し、運用責任者の署名取得後にのみ Phase 5 に進む。

- delivery 担当 (実施者)
- レビュアー 1 名以上 (立会)
- 運用責任者 (実装承認権者)
- 対象 commit SHA
- 実行ウィンドウ
- abort 条件 (verify suite FAIL / 異常系発動 / Cloudflare 障害)

**判定**: GO 判定取得前は Phase 5 への進行を一切行わない (本番不可逆操作の前提)。

## 9. 多角的チェック (Phase 1 時点)

- 価値性: PASS (Wave 1 解放価値)
- 実現性: PASS (CLI ・実行環境固定済)
- 整合性: MINOR (`apps/web` の OpenNext Workers 形式整合は Phase 2 で再評価)
- 運用性: PASS (フロー確立済)

## 10. Phase 2 への引き継ぎ

- AC × Phase 別証跡責務マッピング (本ファイル §2)
- 既存資産インベントリ (`existing-assets-inventory.md`)
- 正本仕様照合結果 (`spec-extraction-map.md`)
- targeted run 方針 (本ファイル §7)
- `apps/web/wrangler.toml` の OpenNext Workers 形式整合課題 (要対処項目)

## 11. サブタスク完了状態

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | taskType / scope 固定 | completed |
| 2 | AC 証跡責務割当 | completed |
| 3 | 正本仕様照合 | completed (spec-extraction-map.md 参照) |
| 4 | 既存資産インベントリ | completed (existing-assets-inventory.md 参照) |
| 5 | targeted run 方針 | completed |
