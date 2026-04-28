# Phase 7: AC × 証跡マトリクス

## 1. AC-Phase-証跡対応

| AC | 内容 | 主担当 Phase | 副担当 Phase | 一次証跡 | 二次証跡 | 確認コマンド |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 | Web 本番 URL 200 OK | Phase 5 | Phase 11 | `outputs/phase-05/deploy-execution-log.md` | `outputs/phase-11/smoke-test-result.md` (S-01) | `curl -sI https://<web-url>` |
| AC-2 | API Workers `/health` healthy | Phase 5 | Phase 11 | `outputs/phase-05/deploy-execution-log.md` | `outputs/phase-11/smoke-test-result.md` (S-02) | `curl -sS https://<api-host>/health` |
| AC-3 | D1 migrations 履歴記録 | Phase 5 | — | `outputs/phase-05/migration-apply-record.md` | — | `wrangler d1 migrations list ubm-hyogo-db-prod --env production` |
| AC-4 | Workers→D1 SELECT 疎通 | Phase 5 | Phase 11 | `outputs/phase-05/deploy-execution-log.md` | `outputs/phase-11/smoke-test-result.md` (S-03) | `curl -sS https://<api-host>/health/db` |
| AC-5 | smoke test 全件 PASS | Phase 11 | Phase 5 | `outputs/phase-11/smoke-test-result.md` | — | S-01〜S-10 一覧 |
| AC-6 | デプロイ実施記録文書化 | Phase 5 | — | `outputs/phase-05/deploy-execution-log.md` | — | レビュアー目視 |
| AC-7 | D1 export バックアップ取得 | Phase 5 | — | `outputs/phase-05/d1-backup-evidence.md` | バックアップファイル本体 | `wrangler d1 export` 完了 |
| AC-8 | ロールバック runbook 事前確認 | Phase 2 | Phase 6 | `outputs/phase-02/rollback-runbook.md` | `outputs/phase-06/abnormal-case-matrix.md`, `rollback-rehearsal-result.md` | runbook §5 チェックリスト全 GREEN |

## 2. dependency edge カバレッジ

| 上流タスク | 提供物 | 本タスクでの利用先 | カバー状況 |
| --- | --- | --- | --- |
| 02-serial monorepo runtime foundation | mise / pnpm 環境固定 | Phase 4 verify suite (V-9 〜 V-11) | PASS |
| 03-serial data-source-and-storage-contract | D1 runbook (migrations 適用手順) | Phase 2 deploy-design.md Step 2 / Phase 5 migration-apply-record.md | PASS |
| 04-serial cicd-secrets-and-environment-sync | 本番 Secrets 配置 | Phase 4 verify suite (V-5 / V-6) / Phase 9 secret-hygiene-checklist | PASS |
| 05b-parallel smoke-readiness-and-handoff | readiness checklist | Phase 4 verify suite handoff 確認 / Phase 11 smoke-test-result | PASS |

## 3. 証跡欠損チェック

- [ ] AC-1: Phase 5 + Phase 11 で 2 重証跡
- [ ] AC-2: Phase 5 + Phase 11 で 2 重証跡
- [ ] AC-3: Phase 5 単独 (`migrations list` 出力)
- [ ] AC-4: Phase 5 + Phase 11 で 2 重証跡
- [ ] AC-5: Phase 11 単独 (S-01〜S-10)
- [ ] AC-6: Phase 5 単独 (実行ログそのもの)
- [ ] AC-7: Phase 5 単独 (バックアップ証跡)
- [ ] AC-8: Phase 2 + Phase 6 で 2 重証跡

→ docs-only モードのため証跡実値は TBD だが、テンプレレベルでは全 AC 対応済。

## 4. 多角的観点

| 観点 | 確認 |
| --- | --- |
| 機能網羅 | 8 AC 全て対応 |
| 異常系網羅 | Phase 6 abnormal-case-matrix.md で A-1 〜 A-12 |
| 非機能 (信頼性) | バックアップ + rollback で復旧経路あり |
| 運用性 | runbook 化済 (Phase 2 / Phase 8) |
| セキュリティ | Phase 9 secret-hygiene-checklist.md 別途 |
