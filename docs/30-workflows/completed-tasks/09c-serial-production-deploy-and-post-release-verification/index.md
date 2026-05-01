# 09c-serial-production-deploy-and-post-release-verification - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | production-deploy-and-post-release-verification |
| ディレクトリ | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification |
| Wave | 9 |
| 実行種別 | serial（最終） |
| 担当 | release-production |
| 作成日 | 2026-04-26 |
| 状態 | spec_created |
| タスク種別 | docs-only |
| 実測証跡 | VISUAL / PENDING_USER_APPROVAL |

## 目的

09a（staging green）と 09b（release / incident runbook）の引き渡しを受けて、`main` ブランチ昇格後に Cloudflare production 環境（`ubm-hyogo-web` / `ubm-hyogo-api` / `ubm_hyogo_production`）へデプロイするための runbook / evidence template / approval gate を固定する。本仕様書自体は `docs-only / spec_created` であり、production D1 migration / deploy / tag push / 24h verification の実行は Phase 13 後の明示承認タスクへ分離する。Wave 9 の最終 serial、24 タスクの最終ゲート。

## スコープ

### 含む
- production の D1 migration 適用前確認 + 適用（`bash scripts/cf.sh d1 migrations apply ubm_hyogo_production --remote --env production`）
- production secrets 確認（`bash scripts/cf.sh secret list --env production` + Pages production secrets）
- production deploy（`pnpm --filter @ubm/api deploy:production` + `pnpm --filter @ubm/web deploy:production`）
- production smoke（10 ページ + 認可境界 + 公開導線）
- release tag 付与（`vYYYYMMDD-HHMM` 形式）
- incident response runbook（09b 成果物）の関係者共有（Slack / Email placeholder）
- post-release verification（24h Cloudflare Analytics で req / D1 reads が正常）

### 含まない
- 開発作業全般（08 までで完結）
- staging deploy（09a）
- cron triggers の追加変更（09b）
- アプリ機能の差し替え

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 09a-parallel-staging-deploy-smoke-and-forms-sync-validation | staging green が production deploy の前提 |
| 上流 | 09b-parallel-cron-triggers-monitoring-and-release-runbook | release runbook + incident response runbook + cron 設計 |
| 下流 | なし（Wave 9 最終 serial、24 タスクの最後） |
| 並列 | なし |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | production deploy / D1 / secrets 正本 |
| 必須 | docs/00-getting-started-manual/specs/14-implementation-roadmap.md | Phase 7 受け入れ条件 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | 無料枠と production 構成 |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | system field |
| 必須 | docs/30-workflows/02-application-implementation/_design/phase-2-design.md | Wave 9c scope / AC |
| 必須 | docs/30-workflows/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-12/ | staging green 引き渡し |
| 必須 | docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/outputs/phase-12/release-runbook.md | release runbook 本体 |
| 必須 | docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/outputs/phase-12/incident-response-runbook.md | incident runbook |

## 受入条件 (AC)

- AC-1: `bash scripts/cf.sh d1 migrations list ubm_hyogo_production --env production` で production D1 が最新 migration まで `Applied` であることを確認
- AC-2: `bash scripts/cf.sh secret list --env production` および Pages production の secret 一覧で必須 7 種が production 環境に存在
- AC-3: `pnpm --filter @ubm/api deploy:production` と `pnpm --filter @ubm/web deploy:production` がいずれも exit 0 で完了
- AC-4: production URL（`https://ubm-hyogo-web.pages.dev`、`https://ubm-hyogo-api.<account>.workers.dev`）に対して `/`, `/members`, `/members/:id`, `/login`, `/profile`, `/admin`, `/admin/members`, `/admin/tags`, `/admin/schema`, `/admin/meetings` の 10 ページが手動 smoke で 200 / 認可境界通り
- AC-5: production で `POST /admin/sync/schema` + `POST /admin/sync/responses` が success（手動 trigger）し `sync_jobs` に `success` 記録
- AC-6: release tag が `vYYYYMMDD-HHMM`（例: `v20260426-1530`）形式で `main` 最新 commit に付与され `git push --tags` で remote 反映
- AC-7: incident response runbook（09b 成果物）が関係者（admin / 開発担当）に共有された記録（Slack post / Email placeholder）が `outputs/phase-11/share-evidence.md` に残る
- AC-8: production deploy 後 24h で Cloudflare Analytics の Workers req が想定（< 5k req/day MVP）以下、D1 reads / writes が無料枠の 10% 以下
- AC-9: 不変条件 #4（本人本文 D1 override しない）が production smoke の `/profile` で確認済み（編集 form 不在）
- AC-10: 不変条件 #5（apps/web → D1 直接禁止）が production build artifact で再確認（`rg D1Database apps/web/.vercel/output` で 0 hit）
- AC-11: 不変条件 #10（無料枠）が production 24h メトリクスで PASS
- AC-12: 不変条件 #11（admin は本人本文を直接編集できない）が production admin UI で確認

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | spec_created | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | spec_created | outputs/phase-02/main.md, outputs/phase-02/production-deploy-flow.md |
| 3 | 設計レビュー | phase-03.md | spec_created | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | spec_created | outputs/phase-04/main.md, outputs/phase-04/verify-suite.md |
| 5 | 実装ランブック | phase-05.md | spec_created | outputs/phase-05/main.md, outputs/phase-05/production-deploy-runbook.md, outputs/phase-05/release-tag-script.md |
| 6 | 異常系検証 | phase-06.md | spec_created | outputs/phase-06/main.md, outputs/phase-06/production-rollback-procedures.md |
| 7 | AC マトリクス | phase-07.md | spec_created | outputs/phase-07/main.md, outputs/phase-07/ac-matrix.md |
| 8 | DRY 化 | phase-08.md | spec_created | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | spec_created | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | spec_created | outputs/phase-10/main.md, outputs/phase-10/go-no-go.md |
| 11 | 手動 smoke | phase-11.md | template_complete_pending_runtime_user_approval | outputs/phase-11/main.md, outputs/phase-11/production-smoke-runbook.md, outputs/phase-11/playwright-production/, outputs/phase-11/sync-jobs-production.json, outputs/phase-11/wrangler-tail-production.log, outputs/phase-11/share-evidence.md, outputs/phase-11/release-tag-evidence.md, outputs/phase-11/post-release-24h-evidence.md |
| 12 | ドキュメント更新 | phase-12.md | spec_created | outputs/phase-12/{post-release-summary,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md |
| 13 | PR 作成 | phase-13.md | pending_user_approval | outputs/phase-13/{main.md,pr-body.md} |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 設計 | outputs/phase-02/production-deploy-flow.md | 13 ステップ deploy フロー |
| ランブック | outputs/phase-05/production-deploy-runbook.md | 13 ステップ deploy 手順 |
| ランブック | outputs/phase-05/release-tag-script.md | release tag 付与手順 |
| 異常系 | outputs/phase-06/production-rollback-procedures.md | production rollback |
| 証跡 | outputs/phase-11/production-smoke-runbook.md | smoke 手順と結果 |
| 証跡 | outputs/phase-11/release-tag-evidence.md | tag commit hash + remote URL |
| 証跡 | outputs/phase-11/share-evidence.md | incident runbook 共有記録 |
| 完了 | outputs/phase-12/post-release-summary.md | 24h メトリクス + 後続タスク |
| メタ | artifacts.json | Phase 状態 |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare Workers (production) | API runtime | 100k req/day 内 |
| Cloudflare Workers (production) | Web UI | 無料 |
| Cloudflare D1 (production) | DB | 5GB / 500k reads/day 内 |
| wrangler CLI | deploy / migration / secret | 無料 |
| GitHub | release tag / repo | 無料 |

## Secrets 一覧（このタスクで導入）

このタスクは新規 secret を導入しない。production に登録済みの 7 種を確認するのみ。

| secret | 配置 | 確認方法 |
| --- | --- | --- |
| GOOGLE_SERVICE_ACCOUNT_EMAIL | Cloudflare Secrets (api production) | `bash scripts/cf.sh secret list --env production --config apps/api/wrangler.toml` |
| GOOGLE_PRIVATE_KEY | 同上 | 同上 |
| GOOGLE_FORM_ID | 同上 | 同上 |
| RESEND_API_KEY | 同上 | 同上 |
| AUTH_SECRET | Cloudflare Workers Secrets (web production) | `bash scripts/cf.sh pages secret list --project-name ubm-hyogo-web` |
| AUTH_GOOGLE_ID | 同上 | 同上 |
| AUTH_GOOGLE_SECRET | 同上 | 同上 |

## invariants touched

- #4 本人本文 D1 override しない: production `/profile` で編集 form 不在を確認するテンプレートを定義（runtime evidence pending）
- #5 apps/web → D1 直接禁止: production build artifact で再確認するテンプレートを定義（runtime evidence pending）
- #10 Cloudflare 無料枠: production 24h メトリクスで確認するテンプレートを定義（runtime evidence pending）
- #11 admin は本人本文を直接編集できない: production admin UI で確認するテンプレートを定義（runtime evidence pending）
- #15 attendance 重複防止 / 削除済み除外: production data で重複 0 件 SQL を確認するテンプレートを定義（runtime evidence pending）

## 完了判定

- docs-only / spec_created として、全 13 phase の状態が artifacts.json と一致する
- AC-1〜AC-12 が Phase 7 / 10 で完全トレースされ、runtime evidence は pending_user_approval と明示される
- production smoke / release tag / incident runbook 共有 / 24h verification は `docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md` に分離される
- Phase 12 の 7 ドキュメントが揃う
- Phase 13 はユーザー承認なしでは実行しない（PR 作成承認。production deploy 承認は follow-up で取得）

## 関連リンク

- 上位 README: ../02-application-implementation/README.md
- 上流 並列: ../02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/, ../02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/
- 下流: なし
- 共通テンプレ: ../_templates/phase-template-app.md
