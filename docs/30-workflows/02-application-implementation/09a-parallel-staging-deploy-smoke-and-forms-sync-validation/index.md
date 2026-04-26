# 09a-parallel-staging-deploy-smoke-and-forms-sync-validation - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | staging-deploy-smoke-and-forms-sync-validation |
| ディレクトリ | doc/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation |
| Wave | 9 |
| 実行種別 | parallel |
| 担当 | release-staging |
| 作成日 | 2026-04-26 |
| 状態 | pending |
| タスク種別 | spec_created |

## 目的

`dev` ブランチの最新ビルドを Cloudflare staging 環境（`ubm-hyogo-web-staging` / `ubm-hyogo-api-staging` / `ubm_hyogo_staging`）へデプロイし、Google Forms 同期の動作確認と Playwright E2E green、staging smoke runbook 完走の 3 点を成立させる。production deploy（09c）の前提となる stage gate を提供する。

## スコープ

### 含む
- staging 用 D1 migration の事前確認（`wrangler d1 migrations list`）と適用（`wrangler d1 migrations apply --remote`）
- staging 用 Cloudflare Secrets の存在確認（`wrangler secret list` + Pages secret list）
- staging deploy の実行（`pnpm deploy:staging` を `apps/api`・`apps/web` の両方）
- staging で Forms 同期手動実行（`POST /admin/sync/schema` + `POST /admin/sync/responses`）と sync_jobs 結果確認
- staging で Playwright E2E（08b の成果物）を `STAGING` プロファイルで実行し green を確認
- staging smoke runbook (`outputs/phase-11/staging-smoke-runbook.md`) の作成と完走
- staging で公開一覧 / ログイン / マイページ / 管理画面が通る AC 確認

### 含まない
- production deploy（09c に分離）
- wrangler cron triggers の本番設定（09b に分離）
- release runbook 本体の作成（09b に分離）
- アプリ側のバグ修正（08a/08b までで完結）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 08a-parallel-api-contract-repository-and-authorization-tests | CI green と contract test artifact が staging deploy の前提 |
| 上流 | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke | Playwright spec と fixtures が staging で再利用される |
| 上流 | doc/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync | staging secrets / GitHub Actions deploy パイプラインの存在 |
| 下流 | 09c-serial-production-deploy-and-post-release-verification | staging green が production deploy の前提条件 |
| 並列 | 09b-parallel-cron-triggers-monitoring-and-release-runbook | 同 Wave。Phase 10-12 で release runbook と staging 結果を相互参照 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | staging deploy / D1 migration / secrets / cron 手順 |
| 必須 | doc/00-getting-started-manual/specs/14-implementation-roadmap.md | Phase 7 受け入れ条件（staging で Forms 同期 / 管理画面 / Playwright） |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | 無料枠と staging Worker / D1 / Pages 構成 |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | `responseEmail` 等 system field 仕様 |
| 必須 | doc/00-getting-started-manual/specs/03-data-fetching.md | sync ジョブの分類と staging 動作確認観点 |
| 必須 | doc/02-application-implementation/_design/phase-2-design.md | Wave 9a 仕様（scope / AC） |
| 必須 | doc/02-application-implementation/08a-parallel-api-contract-repository-and-authorization-tests/index.md | contract test artifact の参照先 |
| 必須 | doc/02-application-implementation/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/index.md | Playwright spec / screenshot 出力先 |
| 参考 | doc/01-infrastructure-setup/05b-parallel-smoke-readiness-and-handoff/ | smoke runbook 構造の雛形 |

## 受入条件 (AC)

- AC-1: `wrangler d1 migrations list` で staging D1 (`ubm_hyogo_staging`) が最新 migration まで `Applied` であることを確認する
- AC-2: `wrangler secret list --config apps/api/wrangler.toml` と Pages 側 secret 一覧で必須 secret 7 種（`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_FORM_ID`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `RESEND_API_KEY`）が staging 環境に存在
- AC-3: `pnpm --filter @ubm/api deploy:staging` と `pnpm --filter @ubm/web deploy:staging` がいずれも exit 0 で完了する
- AC-4: staging URL に対して `POST /admin/sync/schema` 実行後、`schema_versions` が最新 31 項目・6 セクションを保持し `sync_jobs` が `success` で記録される
- AC-5: staging URL に対して `POST /admin/sync/responses` 実行後、`member_responses` が更新され `sync_jobs` が `success` で記録される
- AC-6: staging URL を base にした Playwright E2E が desktop / mobile profile の両方で 100% pass、screenshot evidence が `outputs/phase-11/playwright-staging/` 配下に保存される
- AC-7: staging で `/`, `/members`, `/members/:id`, `/login`, `/profile`, `/admin`, `/admin/members`, `/admin/tags`, `/admin/schema`, `/admin/meetings` の 10 ページが手動 smoke で 200 / 認可境界通り（未ログインで `/profile` → `/login`、admin 未登録で `/admin/*` → 403 / login 経由）
- AC-8: 不変条件 #5（apps/web から D1 直接アクセス禁止）を staging build artifact で再確認（network log で D1 直叩きが出現しない）
- AC-9: 不変条件 #10（無料枠）に基づき staging deploy 後 24h の Workers リクエスト数 / D1 reads が 30k req / 50k reads 以下に収まる見積もり

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | pending | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | pending | outputs/phase-02/main.md, outputs/phase-02/staging-deploy-flow.md |
| 3 | 設計レビュー | phase-03.md | pending | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | pending | outputs/phase-04/main.md, outputs/phase-04/verify-suite.md |
| 5 | 実装ランブック | phase-05.md | pending | outputs/phase-05/main.md, outputs/phase-05/staging-deploy-runbook.md |
| 6 | 異常系検証 | phase-06.md | pending | outputs/phase-06/main.md, outputs/phase-06/failure-cases.md |
| 7 | AC マトリクス | phase-07.md | pending | outputs/phase-07/main.md, outputs/phase-07/ac-matrix.md |
| 8 | DRY 化 | phase-08.md | pending | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | pending | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10/main.md, outputs/phase-10/go-no-go.md |
| 11 | 手動 smoke | phase-11.md | pending | outputs/phase-11/main.md, outputs/phase-11/staging-smoke-runbook.md, outputs/phase-11/playwright-staging/ |
| 12 | ドキュメント更新 | phase-12.md | pending | outputs/phase-12/{implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md |
| 13 | PR 作成 | phase-13.md | pending | outputs/phase-13/{main.md,pr-body.md} |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ランブック | outputs/phase-05/staging-deploy-runbook.md | 11 ステップの staging deploy 実行手順 |
| ランブック | outputs/phase-11/staging-smoke-runbook.md | 10 ページ × 認可境界の手動確認手順 |
| 証跡 | outputs/phase-11/playwright-staging/ | Playwright screenshot / video / trace |
| 証跡 | outputs/phase-11/sync-jobs-staging.json | sync_jobs テーブルの dump |
| メタ | artifacts.json | Phase 状態と outputs 記録 |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare Workers (staging) | API runtime | 100k req/day 内 |
| Cloudflare Workers (staging) | Web UI | 無料 |
| Cloudflare D1 (staging) | DB | 5GB / 500k reads/day 内 |
| wrangler CLI | deploy / migration / secret 管理 | 無料 |
| Playwright | E2E (staging プロファイル) | 無料 |
| Google Forms API | sync 動作確認 | 無料 |

## Secrets 一覧（このタスクで導入）

このタスクは新規 secret を導入しない。staging に登録済みの 7 種を確認するのみ。

| secret | 配置 | 確認方法 |
| --- | --- | --- |
| GOOGLE_SERVICE_ACCOUNT_EMAIL | Cloudflare Secrets (api staging) | `wrangler secret list --config apps/api/wrangler.toml` |
| GOOGLE_PRIVATE_KEY | Cloudflare Secrets (api staging) | 同上 |
| GOOGLE_FORM_ID | Cloudflare Secrets (api staging) | 同上 |
| RESEND_API_KEY | Cloudflare Secrets (api staging) | 同上 |
| AUTH_SECRET | Cloudflare Workers Secrets (web staging) | `wrangler pages secret list --project-name ubm-hyogo-web-staging` |
| AUTH_GOOGLE_ID | Cloudflare Workers Secrets (web staging) | 同上 |
| AUTH_GOOGLE_SECRET | Cloudflare Workers Secrets (web staging) | 同上 |

## invariants touched

- #1 実フォームの schema をコードに固定しすぎない: staging sync で 31 項目を D1 へ反映する経路で確認
- #2 consent キーを `publicConsent` / `rulesConsent` に統一: staging Playwright で AuthGateState 検証
- #3 `responseEmail` は system field: sync 後の `member_responses` で検証
- #5 apps/web → D1 直接アクセス禁止: staging build artifact / runtime network log で再確認
- #6 GAS prototype を本番仕様にしない: staging には GAS 由来コードが含まれないこと
- #10 Cloudflare 無料枠: staging deploy 後 24h の Workers / D1 メトリクスを記録
- #11 admin は本人本文を直接編集できない: staging admin 画面で編集 UI 不在を確認

## 完了判定

- 全 13 phase の状態が artifacts.json と一致し completed
- AC-1〜AC-9 が Phase 7 / 10 で完全トレースされる
- staging Playwright が green、staging smoke runbook が走り切る
- Phase 12 の 6 ドキュメントが揃い、09b と 09c への引き渡しが明示される
- Phase 13 はユーザー承認なしでは実行しない

## 関連リンク

- 上位 README: ../README.md
- 同 Wave 並列: ../09b-parallel-cron-triggers-monitoring-and-release-runbook/
- 下流 serial: ../09c-serial-production-deploy-and-post-release-verification/
- 共通テンプレ: ../_templates/phase-template-app.md
