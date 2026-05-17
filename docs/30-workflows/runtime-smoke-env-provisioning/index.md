# runtime-smoke 環境プロビジョニング（staging + production）

[実装区分: 実装仕様書 / 仕様書のみ生成（コード変更は別タスク）]

## 概要

`runtime-smoke-staging.yml` および新設予定の `runtime-smoke-production.yml` が、GitHub Environment secret の欠落・D1 migration 未適用・smoke runner の staging-only ガード・Auth.js JWT の短命化により恒常的に失敗している。本タスクでは ① CI smoke 専用の長寿命 service-token endpoint を `apps/api` に新設し、② smoke runner を production 対応（read-only 限定）に拡張し、③ production 用 workflow / allowlist / provision script / runbook を staging と対称構造で揃えることで、staging + production の runtime smoke を SDD 準拠で一気通貫運用する。

| 項目              | 値 |
|-------------------|----|
| workflow_id       | `runtime-smoke-env-provisioning` |
| タスク種別        | NON_VISUAL（backend + CI + ops、UI 変更なし） |
| 実装モード        | `new`（service-token endpoint / production workflow / production runbook） + `verify_existing`（既存 staging workflow / smoke runner / allowlist 差分確認） |
| 視覚証跡          | UI/UX 変更なしのため Phase 11 スクリーンショット不要 |
| workflow_state    | `spec_created`（本タスクは仕様書生成のみ。実コード変更・secret 投入・workflow rerun・commit・push・PR は user-gated で別タスク化） |
| commit / PR       | 本タスクでは実施しない |

## 真因分析

| # | 直接原因 | 構造原因 | 影響 |
|---|---------|---------|------|
| 1 | `staging-runtime-smoke` / `production-runtime-smoke` Environment に必須 secret が未投入 | 既存 `verify-env-secrets.allowlist` は staging scope のみ宣言、production scope の宣言行が無い | preflight gate が production の name-only 不整合を検出できず、smoke job 起動後に fail |
| 2 | D1 migration が staging / production DB に未適用 | runbook が complete-tasks 配下に分散し、本タスクの canonical runbook が無い | smoke 実行時に schema mismatch で 500 / 404 |
| 3 | `runtime-attendance-provider.sh` が staging only（`if [ "$ENV" = "staging" ]` のような早期 return） | production 対応の分岐が無く、production smoke は実行経路自体が存在しない | production の health/read 系を恒常監視できない |
| 4 | smoke で使う bearer が Auth.js 短命 JWT（exp ≦ 30min） | CI 用の長寿命経路が無く、bearer を CI secret に固定できない | secret 投入直後しか smoke が通らない |
| 5 | seed user（admin / member 固定 ID）の投入手順が runbook 化されていない | task ごとに別経路で投入し直しており再現性が無い | smoke の入力が安定しない |

## 解決策の骨子

| レイヤ | 対応 | 担当 |
|--------|------|------|
| API    | `POST /internal/service-token/{admin,member}` を `apps/api` に新設。HMAC-SHA256 で protection し、90 日有効の JWT を発行。Rate limit + audit log を伴う。 | spec → 別実装タスク |
| smoke runner | `scripts/smoke/runtime-attendance-provider.sh` の staging-only ガード解除。production では read-only ルートに限定（write 系は環境変数 `SMOKE_READONLY=1` で抑止）。 | spec → 別実装タスク |
| CI     | `.github/workflows/runtime-smoke-production.yml` を新設し、staging 版と対称構造で `production-runtime-smoke` Environment を参照。`scripts/ci/verify-env-secrets.allowlist` に production scope 行を追加。 | spec → 別実装タスク |
| provision | `scripts/smoke/provision-staging-secrets.sh` を env 引数化（または並列スクリプト追加）。1Password 経路 / 直接 `gh secret set` 経路の両対応。 | spec → 別実装タスク |
| ops    | D1 migration apply / service-token 発行 / seed user 投入 / incident 対応 の 4 runbook を本タスク root に新設。実 apply・実投入は user-gated。 | spec |

## Phase 構成

| Phase | 状態 | 成果物 |
|-------|------|--------|
| 1 要件定義 | spec_created | `outputs/phase-01/requirements.md` |
| 2 設計 | spec_created | `outputs/phase-02/design.md` |
| 3 設計レビュー | spec_created | `outputs/phase-03/design-review.md` |
| 4 テスト作成 | spec_created | `outputs/phase-04/test-plan.md` |
| 5 実装計画 | spec_created | `outputs/phase-05/implementation-plan.md` |
| 6 テスト拡充 | spec_created | `outputs/phase-06/test-extension.md` |
| 7 カバレッジ確認 | spec_created | `outputs/phase-07/coverage-check.md` |
| 8 リファクタ | spec_created | `outputs/phase-08/refactoring.md` |
| 9 品質保証 | spec_created | `outputs/phase-09/quality-gate.md` |
| 10 最終レビュー | spec_created | `outputs/phase-10/final-review.md` |
| 11 手動テスト (NON_VISUAL) | spec_created | `outputs/phase-11/manual-test-result.md` |
| 12 ドキュメント更新 | spec_created | `outputs/phase-12/*` 4 件 |
| 13 PR | blocked (user 明示承認後) | `outputs/phase-13/pr-checklist.md` |

> 本仕様書は **仕様書生成のみ**。実コード変更（apps/api endpoint / smoke runner / workflow / allowlist / provision script）は別タスクで実装する。D1 migration apply、secret 投入、workflow rerun、commit、push、PR は user-gated。

## 不変条件

1. 平文 `.env` をリポジトリにコミットしない。実値は 1Password (`op://Vault/Item/Field`) 参照のみ。
2. Cloudflare CLI は `bash scripts/cf.sh` 経由のみ。`wrangler` 直接実行禁止。
3. `apps/web` から D1 directly アクセス禁止。D1 binding は `apps/api` に閉じる。
4. main 直接 push 禁止。PR base は `dev`。production リリースは `dev → main` PR のみ。
5. production smoke は read-only ルートのみ。write 系は staging に限定。
6. service-token endpoint は HMAC 検証必須。平文 secret をログ / 監査出力に残さない。
7. 新規 test は `*.spec.{ts,tsx}` のみ（`*.test.{ts,tsx}` 禁止）。
8. bearer 値・API token 値・1Password 実値はドキュメント本文に **絶対に書かない**（参照経路 `op://...` の表記まで）。

## 主要参照

- `.github/workflows/runtime-smoke-staging.yml`
- `.github/workflows/verify-env-secrets.yml`
- `scripts/ci/verify-env-secrets.sh`
- `scripts/ci/verify-env-secrets.allowlist`
- `scripts/smoke/runtime-attendance-provider.sh`
- `scripts/smoke/provision-staging-secrets.sh`
- `scripts/cf.sh`
- `apps/api/src/routes/`（service-token 追加先の参考 surface）
- `docs/30-workflows/runtime-smoke-staging-secrets-restore/`（先行 incident workflow / 参照モデル）
- `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md`（既存 staging 投入手順 canonical）
- `docs/00-getting-started-manual/specs/02-auth.md`（Auth.js JWT 仕様）
- `docs/00-getting-started-manual/specs/08-free-database.md`（D1 構成）
