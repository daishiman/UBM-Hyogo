# UT-06-FU-A Artifact Inventory

## メタ情報

| 項目 | 内容 |
|---|---|
| タスクID | UT-06-FU-A |
| タスク名 | apps/web wrangler.toml の OpenNext Workers 形式移行 |
| ディレクトリ | docs/30-workflows/ut-06-followup-A-opennext-workers-migration/ |
| 完了日 | 2026-04-29（Phase 13 approval_required） |
| ステータス | static_verified_pending_staging（Phase 11） / approval_required（Phase 13） |
| GitHub Issue | #114 (CLOSED) |

## Current Canonical Set（仕様・成果物）

| ファイル | 種別 | 変更種別 | 説明 |
|---|---|---|---|
| `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/index.md` | index | 新規 | タスク全体メタ情報・AC-1〜16・主要成果物表 |
| `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/phase-01.md` 〜 `phase-13.md` | 仕様 | 新規 | Phase 別仕様書 13 本 |
| `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/artifacts.json` | メタ | 新規 | 機械可読サマリー |
| `outputs/phase-01/main.md` | 成果物 | 新規 | 要件定義（4条件・true issue・依存境界） |
| `outputs/phase-02/wrangler-migration-design.md` | 成果物 | 新規 | wrangler.toml 差分設計 / Mermaid 構造図 / env マトリクス |
| `outputs/phase-02/open-next-config-design.md` | 成果物 | 新規 | open-next.config.ts / `.assetsignore` / build script 設計 |
| `outputs/phase-02/rollback-plan.md` | 成果物 | 新規 | Pages 形式への切戻し手順・旧 Pages リソース保持期間 |
| `outputs/phase-03/main.md` | 成果物 | 新規 | 設計レビュー（代替案 3 件以上 + PASS/MINOR/MAJOR 判定） |
| `outputs/phase-04/test-strategy.md` | 成果物 | 新規 | build / deploy / smoke / bundle size / 404 fallback 検証戦略 |
| `outputs/phase-05/implementation-runbook.md` | 成果物 | 新規 | ファイル一覧・差分擬似コード・staging deploy 手順 |
| `outputs/phase-06/failure-cases.md` | 成果物 | 新規 | bundle size 超過 / nodejs_compat 漏れ / `.open-next/` 未生成 / SPA fallback 失敗 |
| `outputs/phase-07/ac-matrix.md` | 成果物 | 新規 | AC-1〜AC-16 × 検証 × 実装のトレーサビリティ |
| `outputs/phase-08/main.md` | 成果物 | 新規 | DRY 化（deploy-runbook 共通化） |
| `outputs/phase-09/main.md` | 成果物 | 新規 | 品質保証 |
| `outputs/phase-09/free-tier-estimation.md` | 成果物 | 新規 | Workers / R2 cache の無料枠見積もり |
| `outputs/phase-10/go-no-go.md` | 成果物 | 新規 | GO/NO-GO 判定・blocker 一覧 |
| `outputs/phase-11/manual-smoke-log.md` | 成果物 | 新規 | staging Workers 形式 smoke ログ |
| `outputs/phase-12/implementation-guide.md` | 成果物 | 新規 | Part 1（中学生向け）+ Part 2（技術者向け） |
| `outputs/phase-12/system-spec-update-summary.md` | 成果物 | 新規 | 仕様書同期サマリー |
| `outputs/phase-12/documentation-changelog.md` | 成果物 | 新規 | ドキュメント更新履歴 |
| `outputs/phase-12/unassigned-task-detection.md` | 成果物 | 新規 | 未タスク検出レポート（0件でも出力） |
| `outputs/phase-12/skill-feedback-report.md` | 成果物 | 新規 | スキルフィードバック |
| `outputs/phase-13/main.md` | 成果物 | 新規 | PR 作成成果物（approval_required） |

## Current Canonical Set（実装ファイル）

| ファイル | 種別 | 変更種別 | 説明 |
|---|---|---|---|
| `apps/web/wrangler.toml` | 設定 | 更新 | Pages 形式から OpenNext Workers 形式へ移行（`pages_build_output_dir` 撤去 / `main = ".open-next/worker.js"` / `compatibility_flags = ["nodejs_compat"]` / `[assets]` / `[observability]`） |
| `apps/web/.assetsignore` | 設定 | 新規 | `.open-next/assets/` 配下の `node_modules` / `.DS_Store` / `.git` 等の除外 |
| `apps/web/package.json` | 設定 | 更新 | build / preview script 整備（deploy 実行は `bash scripts/cf.sh` に統一） |
| `apps/web/open-next.config.ts` | 設定 | 既存確認 | `defineCloudflareConfig` の維持確認（r2IncrementalCache 採否は follow-up） |
| `apps/web/next.config.ts` | 設定 | 確認 | `outputFileTracingRoot` / `turbopack.root` の worktree root 明示確認 |

## Skill 同期成果物

| ファイル | 種別 | 変更種別 | 説明 |
|---|---|---|---|
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | reference | 更新 | Pages vs OpenNext Workers 判定フロー / 移行チェックリストを追記 |
| `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-ut06-followup-A-opennext-workers-2026-04.md` | lessons-learned | 新規 | L-UT06-FU-A-001〜008 の8苦戦箇所 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | reference | 更新 | UT-06-FU-A の Phase 進捗反映 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-backlog.md` | reference | 更新 | follow-up タスク 3 件の登録 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | index | 更新 | OpenNext / Workers 関連キーワード追加 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | index | 更新 | 該当セクションの行番号同期 |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | meta | 更新 | 変更履歴に UT-06-FU-A 反映を追記 |

## Follow-up 未タスク

| 未タスクID | タイトル | 優先度 |
|---|---|---|
| UT-06-FU-A-R2 | R2 incremental cache 採否決定 | medium |
| UT-06-FU-A-RGT | open-next.config.ts の regression tests | medium |
| UT-06-FU-A-OBS | production route secret observability | medium |
| task-impl-opennext-workers-migration-001 | 派生実装タスク（unassigned-task 配下） | medium |

## Validation Chain

| 検証項目 | 結果 |
|---|---|
| AC-1〜AC-16 トレース（Phase 7 / 10） | PASS（静的検証） |
| 4条件（価値性 / 実現性 / 整合性 / 運用性） | PASS |
| Worker bundle size（Free 3 MiB or Paid 切替判断） | 文書化済 |
| 404 / SPA fallback 明示設定（AC-12） | 静的設定済 |
| staging Workers 形式 smoke S-01〜S-10 | static_verified_pending_staging（ユーザー承認後の実測で充足） |
| Next.js 16 / Turbopack monorepo root 誤検出ゲート（AC-16） | PASS |
| `scripts/cf.sh` 経由徹底 | PASS（ドキュメント・scripts 走査 0 件） |
| Phase 13 ユーザー承認 | approval_required |

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
|---|---|---|
| #5 | D1 への直接アクセスは `apps/api` に閉じる | apps/web の配信形式変更のみ。D1 binding を `apps/web/wrangler.toml` に追加しないことを Phase 2 で明文化 |
| #6 | GAS prototype は本番バックエンド仕様に昇格させない | 本タスクは GAS prototype に依存しない（明示的非関与） |
