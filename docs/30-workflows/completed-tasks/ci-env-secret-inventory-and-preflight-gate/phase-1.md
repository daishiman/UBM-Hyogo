# Phase 1: 要件定義

## Metadata

| Key | Value |
| --- | --- |
| Phase | `1` |
| 機能名 | `ci-env-secret-inventory-and-preflight-gate` |
| 作成日 | `2026-05-16` |
| タスク種別 | `implementation` |
| visualEvidence | `NON_VISUAL` |
| scope | GitHub Actions secret name inventory, staging runtime smoke secret runbook, adjacent workflow secret alignment, preflight gate |

## 真の論点

**「環境別 secret の欠落を CI 発火前に検知する仕組みが無い」**。これが (i) 今回直撃中の `staging-runtime-smoke` fail と (ii) 潜在 15 件の未登録・scope 不整合 secret に共通する根本原因。個別の secret 投入だけでは「次に Environment を増やしたとき同じパターンが再発する」ため、preflight gate を同一サイクルで導入する必要がある。

## 思考法レビュー（30 種から抜粋し論点別に圧縮）

| 思考法 | 適用結果 |
|--------|---------|
| 演繹（GitHub Secret 解決順位） | env → repo の 2 段（`daishiman` は user account のため Org scope 無し）。env / repo 両方に未登録なら空文字展開 → workflow 設計者は明示的 fail-fast を仕込むか、preflight で先行検知する必要 |
| アブダクション | 競合仮説（ローカル op 連携汚染 / step typo / env protection rule / OIDC 切替 / `secrets: inherit` 期待）はいずれも棄却済み。残る唯一の説明は env scope への未投入 |
| 帰納 | staging-runtime-smoke の 1 事例から「env 作成だけして secret 未投入」パターンが存在することが確認され、全 workflow grep で 15 件が同パターン候補 |
| システム思考 | CI job ↔ GitHub Environment ↔ Cloudflare 資格情報 ↔ runbook ↔ 1Password が連動。任意 1 ノード未整備で全体停止 |
| ダブルループ | 「env scope に置く」前提自体は当面維持（OIDC federation は中期）。ただし「投入を user 手動運用に依存」前提は preflight gate で代替検知 |
| 論点思考 | 真の論点 = 検知の自動化欠落（上記） |

## 依存・責務境界

| レイヤ | 責務 | 本 workflow での担当 |
|--------|------|--------------------|
| GitHub Environment | secret の永続保持 | user 単独（AI 禁止） |
| 1Password CLI (`op read`) | secret 値の正本保管・取り出し | user 単独 |
| `scripts/smoke/provision-staging-secrets.sh` | op→stdin→`gh secret set` 一括投入 | user 実行（既存スクリプト変更なし） |
| `.github/workflows/runtime-smoke-staging.yml` | verify gate + runtime smoke 実行 | 変更なし（前 workflow で完了） |
| `scripts/ci/verify-env-secrets.sh`（新規） | workflow YAML から `secrets.X` 参照集合を抽出し、対応 Environment / Repository scope の登録状況と突合 | AI（新規実装） |
| `.github/workflows/verify-env-secrets.yml`（新規） | preflight gate workflow | AI（新規実装） |
| `.github/workflows/d1-migration-verify.yml` ほか隣接 workflow | 未登録 secret 参照の解消 | AI（YAML 修正） + user（実投入が必要な分） |

## 変更ファイル inventory

| パス | 種別 | 概要 | 担当タスク |
|------|------|------|----------|
| `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/task-01-staging-runtime-smoke-secret-finalization/runbook.md` | 新規 | user 操作手順（op read \| gh secret set）の確定版 | task-01 |
| `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/task-02-adjacent-unregistered-secret-inventory/inventory.md` | 新規 | 15 件未登録・scope 不整合 secret の分類表（投入 / 整合 / 削除） | task-02 |
| `.github/workflows/d1-migration-verify.yml` | 編集 | `CLOUDFLARE_API_TOKEN_STAGING` 参照を `staging` env scope の `CLOUDFLARE_API_TOKEN` に統一 | task-02 |
| `.github/workflows/post-release-dashboard.yml` | user-gated runtime secret placement | `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY` 投入後に維持。短期 allowlist では隠さない | task-02 |
| `.github/workflows/cloudflare-analytics-export.yml` | 編集 | `CLOUDFLARE_ACCOUNT_TAG` / `CLOUDFLARE_ZONE_TAG` を GitHub Variables 参照へ移行 | task-02 |
| `.github/workflows/{cf-audit-log-monitor,cf-audit-log-cold-storage,cloudflare-alerts-drift,incident-runbook-slack-delivery,lighthouse,post-release-30day-auto-summary}.yml` | user-gated runtime secret placement | inventory で provision / align 方針を確定。実値投入は user 境界 | task-02 |
| `scripts/ci/verify-env-secrets.sh` | 新規 | workflow YAML grep + `gh api` 突合 script (Bash) | task-03 |
| `scripts/ci/__tests__/verify-env-secrets.spec.sh` | 新規 | unit test（合格ケース / 欠落検出ケース / false positive 防止ケース） | task-03 |
| `.github/workflows/verify-env-secrets.yml` | 新規 | PR・push (dev/main) で実行する preflight gate workflow | task-03 |
| `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/outputs/phase-11/*` | 新規 | NON_VISUAL evidence root and command evidence | workflow 全体 |
| `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/outputs/phase-12/*` | 新規 | strict 7 必須成果物 | workflow 全体 |

## 命名規約

- `scripts/ci/verify-*.sh` / `scripts/ci/__tests__/verify-*.spec.sh`（kebab-case + `.spec.sh`）
- `.github/workflows/verify-*.yml`（既存 `verify-indexes.yml`、`verify-test-suffix.yml`、`verify-workflow-doc-refs.yml` に整合）
- task ディレクトリ: `task-NN-kebab-case`

## NON_VISUAL 宣言

本 workflow は CI / 運用設定変更のみで UI/UX 変更なし。Phase 11 の screenshot は不要。代替証跡:
- `gh workflow run` 再実行ログ + secret 一覧の取得結果（scope 別件数のみ。値は出さない）
- `bash scripts/ci/verify-env-secrets.sh` の exit code + stdout
- `gh run view <run-id> --log` の preflight gate green 確認

## carry-over 確認

- 前 workflow `completed-tasks/ci-runtime-smoke-staging-secrets-recovery/` の積み残し: (A) secret 実投入 / (D) preflight gate
- 前 workflow `completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/` で導入された `scripts/smoke/provision-staging-secrets.sh` は再利用（変更なし）

本サイクルで repository-local 実装と evidence 受け入れ枠を完了し、secret 投入・runtime workflow rerun は user-gated operation として Phase 13 境界へ分離する。follow-up は OIDC federation 化と production runtime smoke 新設のみを別 workflow として残す（CONST_007 例外、独立大規模スコープ）。

## サイクル外候補（CONST_007 例外）

| 候補 | サイクル外理由 | 想定実施場所 |
|------|----------------|------------|
| Cloudflare OIDC federation 採用 | `CLOUDFLARE_API_TOKEN` 系撤廃は Cloudflare 側 subject mapping 設定 + workflow 全件改修で独立大規模スコープ | 既存 unassigned: `docs/30-workflows/unassigned-task/issue-640-followup-001-oidc-full-migration.md` |
| production 用 runtime smoke 新設 | production env 観測欠落は別論点（本 workflow は staging secret 解消と検知 gate に focus）。新設前に本 workflow の gate が green になっていることが前提 | 既存 unassigned: `docs/30-workflows/unassigned-task/task-issue-531-production-runtime-smoke-attendance-provider-001.md` |

## 完了条件

- 変更ファイル inventory 確定（上記表）
- 全タスク (task-01〜03) の DoD 草案が phase-2 / phase-3 で詰められる前提が整う
- 既存 secret 未登録の evidence（`gh api .../secrets` 結果）を `outputs/phase-1/baseline.md` に記録（**値は出さない・件数と name のみ**）
