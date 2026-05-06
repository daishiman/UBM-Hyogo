# GitHub Actions CI/CD パイプライン

> 本ドキュメントは統合システム設計仕様書の一部です。
> 管理: .claude/skills/aiworkflow-requirements/

---

**親ドキュメント**: [deployment.md](./deployment.md)

## 概要

本ドキュメントは、ubm-hyogo プロジェクトの GitHub Actions CI/CD パイプライン設定を定義する。

### 目的

- PR 時の品質ゲート（Lint・型チェック・テスト・ビルド）を自動化
- dev / main ブランチへのマージ時の CD（dev=staging / main=production の自動デプロイ・通知）を実行
- テスト並列実行による高速フィードバックを実現

### スコープ

| 対象 | 説明 |
| ---- | ---- |
| CI | PR トリガーの品質検証（ci.yml） |
| CD | dev / main マージ時の自動デプロイ（web-cd.yml） |
| 最適化 | テストシャーディング、キャッシュ戦略、並列実行 |

### 設計原則

| 原則 | 説明 |
| ---- | ---- |
| 高速フィードバック | シャード分割とキャッシュで実行時間を最小化 |
| 品質ゲート | テスト・カバレッジ未達でマージをブロック |
| コスト効率 | 条件分岐で PR 時は軽量実行、main 時のみフル計測 |

---

## ワークフロー構成

| ファイル | 用途 |
| -------- | ---- |
| `ci.yml` | PR 時の CI（Lint・型チェック・テスト・ビルド） |
| `web-cd.yml` | Web アプリ CD（dev: staging / main: production 自動デプロイ + Discord 通知） |
| `backend-ci.yml` | API アプリ CD（dev: staging / main: production 自動デプロイ + Discord 通知） |
| `validate-build.yml` | ビルド検証（PR / push トリガー、apps/* の `pnpm build` 通過確認） |
| `verify-indexes.yml` | aiworkflow-requirements skill indexes drift 検出（`pnpm indexes:rebuild` 結果と committed の差分検証） |
| `pr-target-safety-gate.yml` | `pull_request_target` trusted context を triage / metadata / manual audit のみに限定する safety gate。PR head checkout / install / build は禁止。 |
| `pr-build-test.yml` | untrusted PR head の build / lint / typecheck を `pull_request` + `contents: read` のみで実行する workflow。 |
| `cf-token-rotation-reminder.yml` | Cloudflare API Token 90 日 rotation の 85 日 reminder。`schedule` + `workflow_dispatch` dry-run で Issue 起票を通知に限定する。 |

> **current facts (Issue #407 / 2026-05-06)**: `cf-token-rotation-reminder.yml` は `contents: read` / `issues: write` のみを持ち、`secrets.*` を参照しない。発行日は GitHub Variable `CF_TOKEN_ISSUED_AT`、起票 threshold は 85 日、実 rotation / secret injection は runbook 側の user approval gate 後のみ。

> **current facts (UT-GOV-002-IMPL / 2026-04-30)**: 上記 8 件が `.github/workflows/` 配下の current inventory。`pr-target-safety-gate.yml` / `pr-build-test.yml` は spec_created 時点の実 workflow 草案で、Phase 13 ユーザー承認後に dry-run / VISUAL evidence を取得して branch protection context と同期する。

---

## CI ワークフロー要件（PR 時）

### トリガー条件

- PR が dev または main ブランチに対して作成されたとき
- PR に新しいコミットがプッシュされたとき

### 実行ステップ

1. リポジトリコードの取得
2. pnpm のセットアップ（バージョン: 10.33.2 / `.mise.toml` に固定、`pnpm/action-setup@v4` で導入）
3. Node.js のセットアップ（バージョン: 24 / `.mise.toml` に固定、`actions/setup-node@v4` で導入）
4. pnpm キャッシュの有効化
5. 依存関係のインストール（frozen-lockfile モード）
6. TypeScript 型チェックの実行
7. ESLint によるコード品質チェック
8. Next.js ビルドの確認
9. Vitest によるユニットテストの実行
10. **カバレッジチェックと Codecov 連携**
    - test ジョブ完了後にカバレッジを収集
    - Codecov にレポートをアップロード
    - 閾値 80% 未達で CI 失敗

### 品質ゲート

- すべてのステップが成功しない限り PR をマージできないようにする
- テストは前のステップが失敗しても必ず実行する
- **カバレッジが 80% 未満の場合、CI を失敗させる**
  - Project coverage: 80% 以上
  - Patch coverage: 80% 以上
  - 設定ファイル: `codecov.yml`

> **current facts（ci-test-recovery-coverage-80-2026-05-04 / 2026-05-04）**: `ci.yml` の `coverage-gate` job は Task E で hard gate 化済み。過去に job レベルと `Run coverage-guard` step レベルの両方に `continue-on-error: true` があり、`coverage-guard.sh` が 80% 未達で exit 1 になっても GitHub Actions の check は success 扱いになっていた。現在は両方の `continue-on-error` を削除し、`scripts/coverage-guard.test.ts` で `coverage-gate` block に `continue-on-error` が再混入しないことを静的検証する。

---

## キャッシュ戦略

### pnpm キャッシュ

| 項目 | 設定 |
| ---- | ---- |
| 使用 Action | `actions/cache@v4` |
| 対象 | pnpm ストア、node_modules |
| キャッシュキー | OS + pnpm-lock.yaml のハッシュ |
| フォールバック | OS のみでマッチ |
| 効果 | 初回 3-5 分 → キャッシュヒット時 30-60 秒 |

### ビルドキャッシュ

| 項目 | 設定 |
| ---- | ---- |
| 対象 | `.next/cache`、`.tsbuildinfo` |
| キャッシュキー | OS + Git SHA |
| フォールバック | OS + ブランチ名 |
| 注意点 | ブランチごとにキャッシュを分離する |

---

## 並列実行の活用

### 並列実行可能なジョブ

- lint と typecheck は依存関係がないため並列実行可能
- 複数パッケージのテストは `--filter` で分離して並列実行

### 順次実行必須なジョブ

- build → test（テストはビルド成果物が必要）
- test → deploy（品質ゲート通過後のみデプロイ）

### GitHub Actions 無料枠

- パブリックリポジトリ：無制限
- プライベートリポジトリ：月 2,000 分

### テストシャード戦略

テスト実行時間を短縮するため、GitHub Actions matrix でシャード分割を行う。

| 項目 | 設定値 | 効果 |
| ---- | ------ | ---- |
| シャード数 | 16 | 各シャード約 25 ファイル |
| 分散方式 | Vitest --shard=N/M | ファイルハッシュベースで均等分配 |
| 並列度 | maxForks=4 (CI) | I/O 待ち時間活用 |

**ジョブ依存グラフ**:

| ジョブ | 依存関係 | 並列実行 |
| ------ | -------- | -------- |
| lint | なし | 可 |
| build-shared | なし | 可 |
| typecheck | build-shared | 条件付き |
| test-shared | build-shared | 条件付き |
| test-web[shard 1-16] | build-shared | 16 並列 |
| coverage | test-web 全完了 | 順次 |

**カバレッジ条件分岐**:

| イベント | カバレッジ計測 | 理由 |
| -------- | -------------- | ---- |
| pull_request | なし | 高速フィードバック優先 |
| push (main) | あり | 品質メトリクス収集 |

### Vitest 並列化設定（CI 環境）

| 設定項目 | CI 値 | ローカル値 | 理由 |
| -------- | ----- | ---------- | ---- |
| maxForks | 4 | CPU コア数/2 | CI は 2 コアだが I/O 活用で 4 並列 |
| fileParallelism | true | 環境変数制御可 | CI 高速化 |
| testTimeout | 10 秒 | 10 秒 | 両環境共通 |
| pool | forks | forks | プロセス分離で安定性確保 |

---

## CD ワークフロー要件（dev / main マージ時）

### トリガー条件

- dev ブランチへのプッシュ（PR マージ時）
- main ブランチへのプッシュ（PR マージ時）

### 実行内容

1. ブランチに応じて Cloudflare Workers へ自動デプロイ（`cloudflare/wrangler-action@v3` + `wrangler deploy --env <env>`）。2026-05-01 時点の `.github/workflows/web-cd.yml` は Pages deploy 残で、ADR-0001 / `task-impl-opennext-workers-migration-001` で置換する
2. デプロイ完了後、Discord Webhook で通知を送信

### 通知要件

| 項目 | 説明 |
| ---- | ---- |
| 形式 | Discord Embed 形式で視認性を向上 |
| 内容 | コミットハッシュ、ブランチ名、作成者を含める |
| タイムスタンプ | 付与する |
| 成功時 | 緑色の Embed でデプロイ完了を通知 |
| 失敗時 | 赤色の Embed でエラー内容を通知 |

> **current facts (UT-CICD-DRIFT / 2026-04-29)**: 上記 Discord Webhook 通知ステップは現行 `.github/workflows/web-cd.yml` には未実装。UT-08-IMPL（観測性実装、Wave 2）で導入予定。UT-CICD-DRIFT では存在しない派生タスクIDへ委譲せず、通知未実装を current facts として固定する。

> **deploy target current facts (ADR-0001 / 2026-05-01)**: `apps/web/wrangler.toml` は OpenNext Workers 形式、`.github/workflows/web-cd.yml` は Pages deploy 残。Workers deploy への切替は `task-impl-opennext-workers-migration-001` の責務。

---

## Backend ワークフロー要件（dev / main マージ時）

### トリガー条件

- dev ブランチへのプッシュ（PR マージ時）
- main ブランチへのプッシュ（PR マージ時）

### 実行内容

1. D1 migrations apply を先に実行して、スキーマ変更を反映する
2. ブランチに応じて Cloudflare Workers へ自動デプロイ（`wrangler deploy`）
3. デプロイ完了後、Discord Webhook で通知を送信

### 注意点

- staging は `apps/api/wrangler.toml` の `[env.staging]`、production は top-level 設定を使う
- migration と deploy の順序を逆にしない

> **current facts (Issue #434 audit / 2026-05-04)**: `.github/workflows/backend-ci.yml` は D1 migrations apply 後に Workers deploy を実行する。migration step 成功後に deploy step が failure になった場合、`Record post-migration deploy failure` step が GitHub Actions summary に「migration は適用済み、deploy 失敗、migration を安易に再実行しない」旨を明示する。これは deploy atomicity を保証するものではなく、partial production operation の可視化と復旧手順の入口である。
>
> **current facts (UT-CICD-DRIFT / 2026-04-29)**: 現行 `.github/workflows/backend-ci.yml` には D1 migrations apply + Workers deploy のステップは実装済みだが、Discord Webhook 通知ステップは未実装。UT-08-IMPL（Wave 2）で導入予定。UT-CICD-DRIFT では存在しない派生タスクIDへ委譲せず、通知未実装を current facts として固定する。

> **current facts (U-FIX-CF-ACCT-01-DERIV-02 / 2026-05-06)**: Cloudflare deploy token は現行 workflow step 単位で分割する。`backend-ci.yml` の D1 migration step は `CF_TOKEN_D1_<ENV>`、Workers deploy step は `CF_TOKEN_WORKERS_<ENV>` を使う。`web-cd.yml` の Pages deploy step は `CF_TOKEN_PAGES_<ENV>` を使う。`deploy-staging.yml` / `deploy-production.yml` は現行 repo に存在しないため正本にしない。Issue #406 は CLOSED のため PR 文面は `Refs #406` のみ。

---

## モニタリングとアラート

### ヘルスチェックエンドポイント設計

**基本ヘルスチェック（`/api/health`）**

| 項目 | 仕様 |
| ---- | ---- |
| ステータスコード | 200 |
| レスポンス | ステータスとタイムスタンプを含む JSON |
| 実行時間 | 100ms 以内 |
| 内容 | サーバー稼働状況のみ |

### 監視すべきメトリクス（ゴールデンシグナル）

| シグナル | 測定項目 | 目標値 |
| -------- | -------- | ------ |
| レイテンシ | p50, p95, p99 | p95 < 500ms |
| トラフィック | リクエスト数/分 | ベースライン把握 |
| エラー | エラー率 | < 1% |
| サチュレーション | CPU・メモリ使用率 | < 80% |

### Discord 通知

**通知レベル**

| レベル | トリガー | 対応期限 |
| ------ | -------- | -------- |
| Critical | サービスダウン、エラー率 > 10% | 即座に対応 |
| Warning | エラー率 5-10%、パフォーマンス劣化 | 24 時間以内 |
| Info | デプロイ成功、定期バックアップ完了 | 記録のみ |

---

## GitHub Secrets の要件

| Secret 名 | 用途 | 必須 |
| --------- | ---- | ---- |
| `CF_TOKEN_D1_STAGING` / `CF_TOKEN_D1_PRODUCTION` | D1 migration 用 Cloudflare API Token | Yes |
| `CF_TOKEN_WORKERS_STAGING` / `CF_TOKEN_WORKERS_PRODUCTION` | Workers deploy 用 Cloudflare API Token | Yes |
| `CF_TOKEN_PAGES_STAGING` / `CF_TOKEN_PAGES_PRODUCTION` | Pages deploy 用 Cloudflare API Token | Yes |
| `CLOUDFLARE_API_TOKEN` | 旧単一 Cloudflare API Token。U-FIX-CF-ACCT-01-DERIV-02 の 24h 並行保持後に削除 | Deprecated |
| `DISCORD_WEBHOOK_URL` | Discord 通知用 Webhook URL | No |

### U-FIX-CF-ACCT-01-DERIV-01: OIDC short-lived credential target contract（2026-05-06）

`docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/` は `spec_created / implementation-spec / NON_VISUAL` の target contract である。runtime cutover は未実行であり、現行 `web-cd.yml` / `backend-ci.yml` の長命 `secrets.CLOUDFLARE_API_TOKEN` 参照と `d1-migration-verify.yml` の `secrets.CLOUDFLARE_API_TOKEN_STAGING` 参照は current fact として残る。

| 項目 | 契約 |
| --- | --- |
| primary IdP | AWS STS（GitHub OIDC federation） |
| workflow inventory | `.github/workflows/web-cd.yml`, `.github/workflows/backend-ci.yml`, `.github/workflows/d1-migration-verify.yml` |
| deploy job permissions | deploy job のみ `id-token: write` + `contents: read`。top-level / PR job には付与しない |
| credential lifetime | 1 時間以内を Phase 11 evidence で実測 |
| credential boundary | Cloudflare Token object が per-job 短命化できない場合は AWS STS session <= 3600s + job-scoped retrieval を短命境界として記録し、Cloudflare Token 自体の 1h expiry を主張しない |
| approval gates | G1 trust policy / G2 staging cutover / G3 production cutover / G4 long-lived token revoke |
| commit / push / PR | G1-G4 とは別の user approval。自動実行禁止 |

実装 PR では `secrets.CLOUDFLARE_API_TOKEN` / `secrets.CLOUDFLARE_API_TOKEN_STAGING` 直接参照を対象 workflow から除去または明示的に impact-checked とし、OIDC → AWS STS → job-scoped credential → `scripts/cf.sh` 経路に統一する。rollback 用の長命 Token 再注入は 24h 限定の緊急運用に限る。

### Variables（非シークレット）

| Variable 名 | 用途 | 必須 |
| ----------- | ---- | ---- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account 識別子。資格情報ではないため Repository Variable として管理し、workflow では `${{ vars.CLOUDFLARE_ACCOUNT_ID }}` で参照する | Yes |
| `CLOUDFLARE_PAGES_PROJECT` | Pages production/base プロジェクト名。UT-28 正本値は `ubm-hyogo-web`。staging は workflow 側で `-staging` suffix を連結して `ubm-hyogo-web-staging` とする | Yes |
| `CF_TOKEN_ISSUED_AT` | Cloudflare API Token の production 発行日。`cf-token-rotation-reminder.yml` が 85 日経過判定に使用する ISO 8601 日付 | Yes |

`CLOUDFLARE_PAGES_PROJECT` に `ubm-hyogo-web-staging` を直接入れてはいけない。dev deploy は `${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging` を使うため、staging 名を入れると `ubm-hyogo-web-staging-staging` になる。

### セキュリティ要件

| 要件 | 説明 |
| ---- | ---- |
| 設定場所 | GitHub リポジトリの Settings から設定 |
| 注入方法 | 環境変数として安全に注入 |
| マスク処理 | ログに出力されないようマスク処理 |

## UT-27: GitHub Secrets / Variables 配置決定（2026-04-29）

UT-27 (`docs/30-workflows/completed-tasks/ut-27-github-secrets-variables-deployment/`) では、CD 有効化に必要な GitHub Actions Secrets / Variables / Environments を次の配置に固定する。実 `gh secret set` / `gh variable set` / `gh api .../environments` は Phase 13 の user 明示承認後だけ実行する。

| 名前 | 種別 | 配置 | 理由 |
| --- | --- | --- | --- |
| `CF_TOKEN_D1_STAGING` / `CF_TOKEN_D1_PRODUCTION` | Secret | environment-scoped（`staging` / `production`） | D1 migration step のみが使う token に分離 |
| `CF_TOKEN_WORKERS_STAGING` / `CF_TOKEN_WORKERS_PRODUCTION` | Secret | environment-scoped（`staging` / `production`） | Workers deploy step のみが使う token に分離 |
| `CF_TOKEN_PAGES_STAGING` / `CF_TOKEN_PAGES_PRODUCTION` | Secret | environment-scoped（`staging` / `production`） | Pages deploy step のみが使う token に分離 |
| `CLOUDFLARE_API_TOKEN` | Secret | environment-scoped（`staging` / `production`） | Deprecated。24h 並行保持後に Cloudflare / GitHub から削除 |
| `CLOUDFLARE_ACCOUNT_ID` | Variable | repository-scoped | Account ID は資格情報ではなく識別子。既存 GitHub 実設定に合わせ、`vars.` 参照で空展開を防ぐ |
| `DISCORD_WEBHOOK_URL` | Secret | repository-scoped（分離が必要なら environment-scoped） | MVP は単一通知先。未設定時も CI 全体を落とさない |
| `CLOUDFLARE_PAGES_PROJECT` | Variable | repository-scoped | 非機密値で、suffix 連結結果をログで追えるよう Secret 化しない |

運用ゲート:

- `staging` / `production` Environments は `gh api repos/{owner}/{repo}/environments/{name} -X PUT` で作成する。
- dev push smoke は `backend-ci.yml` / `web-cd.yml` の `deploy-staging` green と Discord 通知または未設定耐性を確認する。
- `if: secrets.X != ''` に依存せず、workflow 側では env に受けて shell で空文字判定する設計を優先する。
- API Token は Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read の最小スコープに限定し、命名規則 `ubm-hyogo-cd-{env}-{yyyymmdd}`（例: `ubm-hyogo-cd-staging-20260429`）でローテーション履歴を Token 名から追えるようにする。

## Post-release dashboard automation (Issue #351 / 2026-05-05)

09c production release 後の 24h metrics は `docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/` を current implementation spec とし、GitHub Actions schedule / workflow_dispatch で自動収集する。

| 項目 | 正本 |
| --- | --- |
| workflow file | `.github/workflows/post-release-dashboard.yml` |
| 起動 | `schedule: '0 0 * * *'` (UTC, 1 日 1 回) + `workflow_dispatch` |
| secret | `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY`（read-only。production deploy 用 `CLOUDFLARE_API_TOKEN` とは別 token） |
| account variable | `vars.CLOUDFLARE_ACCOUNT_ID` |
| artifact path | `outputs/post-release-dashboard/<UTC-yyyy-mm-dd>/dashboard.{json,md}` |
| retention | 90 days |
| metrics | `workers_requests` / `workers_errors` / `d1_reads` / `d1_writes` / `cron_status` |
| threshold | 09c post-release summary と一致（`< 5000` req/24h, `<= 50000` reads/24h, `<= 10000` writes/24h） |
| redaction gate | `scripts/post-release-dashboard/lib/redaction-check.sh` が artifact directory に `redaction-check.md` を生成し、secret-like findings 0 件を記録 |
| CI regression gate | `ci.yml` で `pnpm post-release-dashboard:test` を実行し、collector / judgment / redaction report 生成を検証 |

`scripts/cf.sh api-post /client/v4/graphql -d <json>` は GraphQL Analytics discover / metrics query の公開入口とし、`api-post` は `/client/v4/graphql` 以外の path を fail-closed する。workflow は `secrets.CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY` を正参照し、`secrets.CLOUDFLARE_API_TOKEN` を参照しない。

### 30 day schedule feedback contract (Issue #497 / 2026-05-06)

Issue #351 の 30 日連続 schedule 実測 feedback は `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/` を current follow-up spec とする。これは **runtime conclusion evidence ではなく、30 日 gate 到達後に実行する docs-only / NON_VISUAL 契約**である。

| 項目 | 正本 |
| --- | --- |
| workflow state | `spec_created / docs-only / NON_VISUAL / external-time-dependent` |
| GitHub Issue | #497 CLOSED 維持。PR 文脈は `Refs #497, Refs #351` のみ |
| trigger | Issue #351 main merge 後 30 日以上。`gh run list --workflow=post-release-dashboard.yml --limit=80 --json createdAt` の最古 `createdAt` が実行日 - 30 日以前 |
| Phase 11 raw evidence | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/phase-11/post-release-dashboard-30d.json` |
| Phase 11 summaries | conclusion distribution / failure root cause classification / consecutive failure window / failure rate decision / redaction grep |
| schedule continuity | `event=="schedule"` のみ採用し、日次 gap 0 を確認。manual `workflow_dispatch` は 30 日連続判定に含めない |
| artifact / duration evidence | `gh run download <id>` の downloadability と `createdAt`〜`updatedAt` 所要時間分布を記録 |
| redaction gate | `token|bearer|secret|Authorization|ya29\.|ghp_|ghs_` を failure log に対して grep し、skill references へ secret-like value を転記しない |
| next action threshold | failure rate `< 10%` は現状維持。`>= 10%` は retry / alert 追加を別 unassigned task として起票し、Issue #497 自体は再 OPEN しない |

30 日 gate 未達時は runtime PASS を主張せず、workflow root と artifacts は `spec_created` のまま維持する。gate 成立後に Phase 11 / Phase 12 を実行し、この `deployment-gha.md` セクションへ実測値を追記する。

| 2026-05-06 | 2.4.0 | Issue #407 Cloudflare API Token rotation reminder workflow を追加。`CF_TOKEN_ISSUED_AT`、85 日 reminder、dry-run、duplicate guard、最小 permissions を正本化 |
| 2026-05-05 | 2.3.0 | Issue #351 post-release dashboard automation を追加。read-only analytics token、daily schedule、artifact path、redaction gate、`scripts/cf.sh api-post` 境界を正本化 |
| 2026-04-29 | 2.2.0 | UT-CICD-DRIFT: Node 22→24 / pnpm 9→10.33.2 同期、workflow 構成表に `validate-build.yml` / `verify-indexes.yml` を追加、Discord 通知未実装の current facts 注記、coverage soft→hard gate 段階性注記 |
| 2026-05-06 | 2.3.0 | U-FIX-CF-ACCT-01-DERIV-01 OIDC short-lived credential target contract を追加。runtime cutover は未実行で、`web-cd.yml` / `backend-ci.yml` の `CLOUDFLARE_API_TOKEN` と `d1-migration-verify.yml` の `CLOUDFLARE_API_TOKEN_STAGING` 参照は current fact として分離 |
| 2026-04-29 | 2.1.0 | UT-27: GitHub Secrets / Variables 配置決定マトリクスと Phase 13 user 承認ゲートを追記 |
| 2026-04-09 | 2.0.0 | 旧デプロイ基盤・Electron E2E 削除、Cloudflare Pages デプロイへ移行 |
