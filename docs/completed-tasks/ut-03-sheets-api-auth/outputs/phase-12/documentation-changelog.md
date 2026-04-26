# ドキュメント変更履歴

## 2026-04-26 — UT-03 初期実装

### 新規作成

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-01/requirements.md` | 要件定義書 |
| `outputs/phase-02/auth-design.md` | 認証フロー設計書 |
| `outputs/phase-02/auth-comparison-table.md` | Service Account vs OAuth 2.0 比較評価表 |
| `outputs/phase-02/env-secret-matrix.md` | 環境別シークレット管理マトリクス |
| `outputs/phase-03/design-review.md` | 設計レビュー結果 |
| `outputs/phase-04/test-plan.md` | テスト計画（AUTH-01〜AUTH-06） |
| `outputs/phase-04/pre-verify-checklist.md` | 事前確認チェックリスト |
| `outputs/phase-05/setup-runbook.md` | セットアップ runbook |
| `outputs/phase-05/sheets-auth-spec.md` | 実装仕様書 |
| `outputs/phase-05/local-dev-guide.md` | ローカル開発ガイド |
| `outputs/phase-06/failure-case-matrix.md` | 異常系マトリクス |
| `outputs/phase-07/ac-traceability-matrix.md` | AC トレーサビリティ |
| `outputs/phase-08/refactoring-log.md` | DRY 化記録 |
| `outputs/phase-09/quality-checklist.md` | 品質チェックリスト |
| `outputs/phase-10/go-nogo-decision.md` | GO/NOGO 判定 |
| `outputs/phase-11/manual-smoke-log.md` | 手動 smoke テストログ |
| `outputs/phase-11/link-checklist.md` | リンク確認 |
| `outputs/phase-12/implementation-guide.md` | 実装ガイド |
| `outputs/phase-12/system-spec-update-summary.md` | システム仕様更新サマリー |
| `outputs/phase-12/skill-feedback-report.md` | スキルフィードバック |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 準拠確認 |
| `outputs/phase-13/pr-checklist.md` | Phase 13 チェックリスト（PR未実行） |
| `packages/integrations/src/sheets-auth.ts` | 認証モジュール実装 |
| `packages/integrations/src/sheets-auth.test.ts` | 統合テスト |

### 変更

| ファイル | 変更内容 |
| --- | --- |
| `.gitignore` | `.dev.vars` / `**/.dev.vars` を追加 |
| `packages/integrations/package.json` | `test`・`test:run`・`test:watch` スクリプト追加、`vitest` devDependency 追加 |
| `packages/integrations/package.json` | `./sheets-auth` subpath export 追加 |
| `packages/integrations/src/index.ts` | `sheets-auth.ts` の public API を root export から再公開 |
| `packages/integrations/src/sheets-auth.ts` | Service Account ごとの KV cache key、runtime validation、Token Endpoint error body redaction を追加 |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | `GOOGLE_SERVICE_ACCOUNT_JSON` / `SHEETS_TOKEN_CACHE` を追記 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Google Sheets Service Account Secret 手順を追記 |
| `.claude/skills/aiworkflow-requirements/references/arch-integration-packages.md` | `@ubm-hyogo/integrations` Sheets auth public API を追記 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-completed-recent-2026-04d.md` | UT-03 完了記録を追記 |
| `.claude/skills/aiworkflow-requirements/LOGS.md` | UT-03 close-out sync を追記 |
