# 09b-parallel-cron-triggers-monitoring-and-release-runbook - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cron-triggers-monitoring-and-release-runbook |
| ディレクトリ | docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook |
| Wave | 9 |
| 実行種別 | parallel |
| 担当 | release-runbook |
| 作成日 | 2026-04-26 |
| 状態 | spec_created |
| タスク種別 | docs-only |
| workflow_state | spec_created |
| visualEvidence | NON_VISUAL |

## 目的

Workers Cron Triggers（forms sync 定期実行）の wrangler.toml 定義、Cloudflare Analytics / Sentry / Logpush の placeholder 連携、release runbook（`outputs/phase-12/release-runbook.md`）と incident response runbook、rollback 手順を整備し、staging（09a）と production（09c）の運用を一意に再現可能にする。

## スコープ

### 含む
- `apps/api/wrangler.toml` の `[triggers]` セクション（cron schedule）の正本定義
  - `0 * * * *`: legacy Sheets sync（現行残存。撤回・整理は UT21-U05）
  - `*/15 * * * *`: response sync（15 分毎）
  - `0 18 * * *`: schema sync（毎日 03:00 JST）
- Cloudflare Analytics ダッシュボード placeholder（URL を release runbook に記載）
- Sentry / Logpush 連携の placeholder（DSN / sink 名を環境変数化）
- release runbook (`outputs/phase-12/release-runbook.md`)
  - go-live 手順（09a → 09c の順序）
  - rollback 手順（worker / pages / D1 migration）
  - cron 一時停止 / 再開手順
- incident response runbook（initial response / escalation / postmortem）
- monitoring dashboard URL 一覧

### 含まない
- staging deploy 本体（09a）
- production deploy 本体（09c）
- 本番アラート送信先設定（Slack / Email の実値）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 08a-parallel-api-contract-repository-and-authorization-tests | sync API の AC 達成確認 |
| 上流 | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke | 監視 dashboard で参照する UI URL の確定 |
| 上流 | docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails | observability / cost guardrails の placeholder 配置 |
| 下流 | 09c-serial-production-deploy-and-post-release-verification | release runbook を production deploy で参照 |
| 並列 | 09a-parallel-staging-deploy-smoke-and-forms-sync-validation | 同 Wave。Phase 10-12 で staging URL / sync_jobs id を release runbook に取り込む |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | cron schedule / D1 migration / リリース前チェック |
| 必須 | docs/00-getting-started-manual/specs/14-implementation-roadmap.md | Phase 7 受け入れ条件 |
| 必須 | docs/00-getting-started-manual/specs/03-data-fetching.md | sync_jobs の running / failed 運用、cron 設計 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | 無料枠 |
| 必須 | docs/30-workflows/02-application-implementation/_design/phase-2-design.md | Wave 9b scope / AC |
| 必須 | docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver/index.md | sync_jobs 仕様 |
| 必須 | docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints/index.md | `POST /admin/sync/*` 仕様 |
| 参考 | docs/05b-parallel-smoke-readiness-and-handoff/ | rollback / handoff 構成 |

## 受入条件 (AC)

- AC-1: `apps/api/wrangler.toml` の current facts として `[triggers] crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]` を監視 runbook に記録する。09b は docs-only / spec_created のため wrangler.toml 自体は変更しない
- AC-2: cron が staging で適用された場合の確認方法（`wrangler triggers list` 相当のサンプル出力）が runbook に記載
- AC-3: `outputs/phase-12/release-runbook.md` に staging → production の go-live 手順、production rollback 手順、cron 一時停止 / 再開手順が含まれる
- AC-4: incident response runbook に initial response / escalation matrix / postmortem template が含まれる
- AC-5: monitoring dashboard URL（Cloudflare Analytics: Workers / D1 / Pages）と Sentry / Logpush placeholder が release runbook に記載
- AC-6: cron が同種 job 二重起動を防ぐため `sync_jobs` の `running` レコードを参照する設計（spec/03-data-fetching.md 準拠）が runbook に明記
- AC-7: 不変条件 #5（apps/web → D1 直接禁止）に違反する rollback 手順が含まれていない
- AC-8: 不変条件 #6（GAS prototype を本番仕様にしない）に違反する cron 定義（apps script trigger 等）が含まれていない
- AC-9: 不変条件 #10（無料枠）を遵守し、`*/15` cron 頻度が Workers 100k req/day 内に収まる試算が含まれる

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md, outputs/phase-02/cron-schedule-design.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | completed | outputs/phase-04/main.md, outputs/phase-04/verify-suite.md |
| 5 | 実装ランブック | phase-05.md | completed | outputs/phase-05/main.md, outputs/phase-05/cron-deployment-runbook.md |
| 6 | 異常系検証 | phase-06.md | completed | outputs/phase-06/main.md, outputs/phase-06/failure-cases.md, outputs/phase-06/rollback-procedures.md |
| 7 | AC マトリクス | phase-07.md | completed | outputs/phase-07/main.md, outputs/phase-07/ac-matrix.md |
| 8 | DRY 化 | phase-08.md | completed | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/main.md, outputs/phase-10/go-no-go.md |
| 11 | 手動 smoke | phase-11.md | completed | outputs/phase-11/main.md, outputs/phase-11/manual-smoke-log.md, outputs/phase-11/link-checklist.md |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/{main,release-runbook,incident-response-runbook,runbook-diff-plan,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md |
| 13 | PR 作成 | phase-13.md | pending | outputs/phase-13/{main,local-check-result,change-summary,pr-info,pr-creation-result}.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 設計 | outputs/phase-02/cron-schedule-design.md | cron 頻度設計 + 二重起動防止 |
| ランブック | outputs/phase-05/cron-deployment-runbook.md | cron deploy / 一時停止 / 再開手順 |
| 異常系 | outputs/phase-06/rollback-procedures.md | worker / pages / D1 migration の rollback |
| 運用 | outputs/phase-12/release-runbook.md | go-live + rollback + cron 制御 + dashboard URL |
| 運用 | outputs/phase-12/incident-response-runbook.md | initial response / escalation / postmortem |
| メタ | artifacts.json | Phase 状態と outputs |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare Workers Cron Triggers | 定期 sync | 無料（Workers 100k req/day 内に含まれる） |
| Cloudflare Analytics | Workers / D1 / Pages metrics | 無料 |
| Cloudflare Logpush | log sink（placeholder） | 一部有料、初期は無効 |
| Sentry | error tracking placeholder | free tier |
| wrangler CLI | trigger / deploy 確認 | 無料 |

## Secrets 一覧（このタスクで導入）

このタスクは新規 secret を直接導入しないが、Sentry DSN を将来的に登録する placeholder を runbook に残す。

| secret | 配置 | 状態 |
| --- | --- | --- |
| SENTRY_DSN（将来） | Cloudflare Secrets (api / web 両方) | placeholder（09b 完了時点では未登録） |

## invariants touched

- #5 apps/web → D1 直接禁止: rollback 手順で web 側 D1 操作を禁止
- #6 GAS prototype を本番仕様にしない: cron 定義を Workers Cron Triggers に限定
- #10 Cloudflare 無料枠: cron 頻度試算で 100k req/day 内
- #15 meeting attendance 重複防止 / 削除済み除外: rollback 時に attendance データの整合性を保つ

## 完了判定

- 全 13 phase の状態が artifacts.json と一致し completed
- AC-1〜AC-9 が Phase 7 / 10 で完全トレース
- release runbook と incident response runbook が完成し 09c へ引き渡し済み
- Phase 12 の skill 必須 7 成果物と 09b 固有 runbook 3 件（release / incident / diff plan）が揃う
- Phase 13 はユーザー承認なしでは実行しない

## 関連リンク

- 上位 README: ../README.md
- 同 Wave 並列: ../09a-parallel-staging-deploy-smoke-and-forms-sync-validation/
- 下流 serial: ../09c-serial-production-deploy-and-post-release-verification/
- 共通テンプレ: ../_templates/phase-template-app.md
