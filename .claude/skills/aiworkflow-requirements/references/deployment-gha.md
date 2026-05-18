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
| `web-cd.yml` | Web アプリ CD（dev: staging / main: production 自動デプロイ。OpenNext Workers bundle を `scripts/cf.sh deploy` で配備） |
| `backend-ci.yml` | API アプリ CD（dev: staging / main: production 自動デプロイ + Discord 通知） |
| `incident-runbook-slack-delivery.yml` | 09c production deploy 後の incident runbook Slack delivery。`backend-ci` / `web-cd` の main 成功後 dry-run、production は `workflow_dispatch` + `production-slack-delivery` approval のみ。 |
| `validate-build.yml` | ビルド検証（PR / push トリガー、apps/* の `pnpm build` 通過確認） |
| `verify-indexes.yml` | aiworkflow-requirements skill indexes drift 検出（`pnpm indexes:rebuild` 結果と committed の差分検証） |
| `verify-env-secrets.yml` | GitHub Actions workflow の `secrets.NAME` 参照を Environment scope / Repository scope の name-only inventory と突合する preflight gate。値は取得しない。 |
| `pr-target-safety-gate.yml` | `pull_request_target` trusted context を triage / metadata / manual audit のみに限定する safety gate。PR head checkout / install / build は禁止。 |
| `pr-build-test.yml` | untrusted PR head の build / lint / typecheck と Issue #626 RB-01 の integrated `lighthouse-ci` を `pull_request` + `contents: read` のみで実行する workflow。`build-test` が標準 `Build` 直後の `apps/web/.next` を `next-build-${{ github.sha }}` artifact として upload し、`lighthouse-ci` が `needs: build-test` で download して再 build なしに Lighthouse CI を実行する。 |
| `cf-token-rotation-reminder.yml` | Cloudflare API Token 90 日 rotation の 85 日 reminder。`schedule` + `workflow_dispatch` dry-run で Issue 起票を通知に限定する。 |
| `.github/workflows/ci.yml` / `workflow-shell-lint` | Issue #526 post-release observation reminder lint gate。PR / push の既存 CI で `.github/workflows/post-release-observation-reminder.yml` と `.github/workflows/ci.yml` を actionlint、`scripts/observation/*.sh` と `scripts/observation/test/*.sh` を shellcheck / bash syntax / shell unit で検査する。 |

> **current facts (Issue #407 / 2026-05-06)**: `cf-token-rotation-reminder.yml` は `contents: read` / `issues: write` のみを持ち、`secrets.*` を参照しない。発行日は GitHub Variable `CF_TOKEN_ISSUED_AT`、起票 threshold は 85 日、実 rotation / secret injection は runbook 側の user approval gate 後のみ。

> **current facts (Issue #526 / 2026-05-08)**: `ci.yml` に `workflow-shell-lint` job を追加済み。job は `contents: read` のみを持ち、`bash -n scripts/observation/create-reminder-issue.sh`、`bash scripts/observation/test/test-create-reminder-issue.sh`、`shellcheck scripts/observation/*.sh scripts/observation/test/*.sh`、downloaded `actionlint` による `.github/workflows/post-release-observation-reminder.yml` / `.github/workflows/ci.yml` 検査、`secrets.GITHUB_TOKEN` 以外の `secrets.*` literal allowlist grep を実行する。既存 branch protection required context は `ci`, `Validate Build`, `coverage-gate` であるため、同じ gate を `ci` job 内の `pnpm observation:lint` にも組み込み、PR merge gate の強制力を既存 required context 経由で担保する。`post-release-observation-reminder.yml` の schedule / workflow_dispatch / Issue 作成副作用は変更しない。Runtime CI evidence は PR 後の `gh run view` で追記するため `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`。

> **current facts (PR #795 residual CI recovery / 2026-05-18)**: `workflow-shell-lint` は `setup-project` を `install: 'false'` で呼ぶため、`actions/setup-node@v4` の pnpm cache post step が存在しない store path を検証しないよう `cache: ''` を必ず渡す。`setup-project` の `cache` input default は `'pnpm'` で、通常 caller の cache behavior は維持する。`backend-ci.yml` は D1 migration step で `CF_TOKEN_D1_<ENV>`、Workers deploy step で `CF_TOKEN_WORKERS_<ENV>` を `with.apiToken` と step-level `env.CLOUDFLARE_API_TOKEN` の両方へ渡す。これは同じ scoped secret の action互換注入であり、secret 未登録時の独立 fallback ではない。runtime green evidence、secret existence confirmation、commit / push / PR は user-gated。

> **current facts (Issue #626 RB-01 / 2026-05-12)**: standalone `.github/workflows/lighthouse.yml` は `pr-build-test.yml` の `lighthouse-ci` job に統合され、削除済み。`lighthouse-ci` の `name:` は required status context 互換のため維持し、`if: github.base_ref == 'dev'` で旧 Lighthouse dev-base 境界を維持する。PR dry-run checks、`lighthouse-ci` log の再 build 0 件確認、merge-time branch protection before/after diff は user-gated runtime evidence。

> **current facts (CI env secret preflight / 2026-05-16)**: `verify-env-secrets.yml` は PR / dev・main push / workflow_dispatch で `scripts/ci/verify-env-secrets.sh --json` を実行する。`GH_VERIFY_ENV_SECRETS_TOKEN` があれば優先し、なければ `GITHUB_TOKEN` を使う。`d1-migration-verify.yml` は `environment: staging` + `secrets.CLOUDFLARE_API_TOKEN` に統一済みで、旧 `CLOUDFLARE_API_TOKEN_STAGING` は撤回。secret placement、variables placement、runtime-smoke rerun、commit、push、PR は user-gated。

> **current facts (09c Slack delivery / 2026-05-06)**: `incident-runbook-slack-delivery.yml` は `workflow_run.workflows: ["backend-ci", "web-cd"]` に接続し、`conclusion == success` かつ `head_branch == main` の場合だけ automatic dry-run を実行する。production 配信は `workflow_dispatch` の `mode=production`、`dryrun_evidence_confirmed=true`、GitHub environment `production-slack-delivery` approval の三条件を要求する。

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

1. ブランチに応じて Cloudflare Workers へ自動デプロイ（`pnpm --filter @ubm-hyogo/web build:cloudflare` → `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env <staging|production>`）。Issue #331 cleanup で `.github/workflows/web-cd.yml` の Pages deploy 残は撤去済み
1. ブランチに応じて Cloudflare Workers へ自動デプロイ。2026-05-09 CI recovery wave 以降、`.github/workflows/web-cd.yml` は `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` で OpenNext Workers bundle を作成し、`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging|production` で配備する。
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

> **deploy target current facts (Issue #331 cleanup / Issue #638 deletion completed)**: `apps/web/wrangler.toml` は OpenNext Workers 形式、`.github/workflows/web-cd.yml` は OpenNext bundle build 後に `scripts/cf.sh deploy --config apps/web/wrangler.toml --env <staging|production>` を呼ぶ。`CLOUDFLARE_PAGES_PROJECT` は Web CD 経路では未参照で、Issue #638 workflow により repository variable deletion は user approval marker 後に完了済み。
> **deploy target current facts (CI recovery / 2026-05-09)**: `apps/web/wrangler.toml` は OpenNext Workers 形式、`.github/workflows/web-cd.yml` は Pages deploy を撤去済み。runtime deployment evidence は user-approved dev/main run 後に取得する。

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

> **current facts (Issue #718 + PR #795 / 2026-05-18)**: 現行 `backend-ci.yml` は D1 migration step で `CF_TOKEN_D1_<ENV>`、Workers deploy step で `CF_TOKEN_WORKERS_<ENV>` を使い、各 wrangler-action step に同じ scoped secret を `with.apiToken` と step-level `env.CLOUDFLARE_API_TOKEN` の両方で渡す。`web-cd.yml` は実 GitHub Environment に登録済みの `secrets.CLOUDFLARE_API_TOKEN` を deploy step の `env.CLOUDFLARE_API_TOKEN` へ限定注入し、同 step 内で空展開を早期 fail する。job-level env と separate `Verify CF token is present` step は Issue #640 以降の current contract では使用しない。`CF_TOKEN_PAGES_<ENV>` は current web-cd path で使用しない。Issue #718 の Cloudflare revoke / GitHub Secrets mutation / 1Password mutation は user-gated であり、backend-ci 切替後も 4 scoped secret の environment inventory evidence を merge gate として扱う。

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
| `CF_TOKEN_WORKERS_STAGING` / `CF_TOKEN_WORKERS_PRODUCTION` | backend-ci Workers deploy 用 Cloudflare API Token。`web-cd.yml` では task-01 alignment 後に使用しない | Yes for backend-ci / Not used by web-cd |
| `CF_TOKEN_PAGES_STAGING` / `CF_TOKEN_PAGES_PRODUCTION` | Deprecated historical Pages deploy token | Historical only |
| `CLOUDFLARE_API_TOKEN` | web-cd の environment-scoped deploy token 正本名。backend / future OIDC cutover では legacy direct token として扱う | Yes for web-cd / Transitional elsewhere |
| `DISCORD_WEBHOOK_URL` | Discord 通知用 Webhook URL | No |

### U-FIX-CF-ACCT-01-DERIV-01: OIDC short-lived credential target contract（2026-05-06）

`docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/` は `spec_created / implementation-spec / NON_VISUAL` の target contract である。OIDC runtime cutover は未実行であり、現行 `backend-ci.yml` は Issue #718 以降 `CF_TOKEN_D1_*` / `CF_TOKEN_WORKERS_*` を使う。`d1-migration-verify.yml` は 2026-05-16 CI env secret preflight 以降 `secrets.CLOUDFLARE_API_TOKEN` に統一済みで、旧 `CLOUDFLARE_API_TOKEN_STAGING` は撤回済み。`web-cd.yml` は 2026-05-09 task-01 web-cd secret alignment で実 Environment 名 `CLOUDFLARE_API_TOKEN` へ同期済み。

| 項目 | 契約 |
| --- | --- |
| primary IdP | AWS STS（GitHub OIDC federation） |
| workflow inventory | `.github/workflows/web-cd.yml`, `.github/workflows/backend-ci.yml`, `.github/workflows/d1-migration-verify.yml` |
| deploy job permissions | deploy job のみ `id-token: write` + `contents: read`。top-level / PR job には付与しない |
| credential lifetime | 1 時間以内を Phase 11 evidence で実測 |
| credential boundary | Cloudflare Token object が per-job 短命化できない場合は AWS STS session <= 3600s + job-scoped retrieval を短命境界として記録し、Cloudflare Token 自体の 1h expiry を主張しない |
| approval gates | G1 trust policy / G2 staging cutover / G3 production cutover / G4 long-lived token revoke |
| commit / push / PR | G1-G4 とは別の user approval。自動実行禁止 |

実装 PR では `secrets.CLOUDFLARE_API_TOKEN` 直接参照を対象 workflow から除去または明示的に impact-checked とし、OIDC → AWS STS → job-scoped credential → `scripts/cf.sh` 経路に統一する。旧 `secrets.CLOUDFLARE_API_TOKEN_STAGING` は撤回済みのため復活させない。rollback 用の長命 Token 再注入は 24h 限定の緊急運用に限る。

### Variables（非シークレット）

## Issue #638 CLOUDFLARE_PAGES_PROJECT deletion current state

`CLOUDFLARE_PAGES_PROJECT` は Issue #638 の user approval marker 後に GitHub repository variable から削除済み。現行 `web-cd.yml` は OpenNext Workers deploy のためこの variable を読まない。rollback が必要な場合のみ、別途 user approval 後に value=`ubm-hyogo-web` で repository variable を再作成する。

| Variable 名 | 用途 | 必須 |
| ----------- | ---- | ---- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account 識別子。資格情報ではないため Repository Variable として管理し、workflow では `${{ vars.CLOUDFLARE_ACCOUNT_ID }}` で参照する | Yes |
| `CLOUDFLARE_PAGES_PROJECT` | Pages production/base プロジェクト名。Issue #331 cleanup 後の `web-cd.yml` では未参照。Issue #638 で repository variable deletion 完了済み。rollback 時のみ value=`ubm-hyogo-web` で再作成する | Deleted by Issue #638 |
| `CLOUDFLARE_PAGES_PROJECT` | Deprecated for current `web-cd.yml`; retained only for historical Pages/UT-28 references. Current web deploy target comes from `apps/web/wrangler.toml` `[env.staging].name` / `[env.production].name` | Historical only |
| `CF_TOKEN_ISSUED_AT` | Cloudflare API Token の production 発行日。`cf-token-rotation-reminder.yml` が 85 日経過判定に使用する ISO 8601 日付 | Yes |

Deprecated Pages variable note: historical Pages workflows derived staging as `${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging`, so storing `ubm-hyogo-web-staging` was invalid. Current `web-cd.yml` no longer references this variable.
Current `web-cd.yml` must not read `CLOUDFLARE_PAGES_PROJECT`. Historical Pages workflows must not store `ubm-hyogo-web-staging` in this variable because suffix concatenation would produce `ubm-hyogo-web-staging-staging`.

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
| `CF_TOKEN_WORKERS_STAGING` / `CF_TOKEN_WORKERS_PRODUCTION` | Secret | environment-scoped（`staging` / `production`） | backend-ci Workers deploy step 用。web-cd は task-01 alignment 後に `CLOUDFLARE_API_TOKEN` を使う |
| `CF_TOKEN_PAGES_STAGING` / `CF_TOKEN_PAGES_PRODUCTION` | Secret | environment-scoped（`staging` / `production`） | Deprecated historical Pages deploy token。current `web-cd.yml` は参照しない |
| `CLOUDFLARE_API_TOKEN` | Secret | environment-scoped（`staging` / `production`） | web-cd deploy token 正本名。backend/OIDC cutover 文脈では transitional direct token |
| `CLOUDFLARE_ACCOUNT_ID` | Variable | repository-scoped | Account ID は資格情報ではなく識別子。既存 GitHub 実設定に合わせ、`vars.` 参照で空展開を防ぐ |
| `DISCORD_WEBHOOK_URL` | Secret | repository-scoped（分離が必要なら environment-scoped） | MVP は単一通知先。未設定時も CI 全体を落とさない |
| `CLOUDFLARE_PAGES_PROJECT` | Variable | repository-scoped | Deleted by Issue #638 with user approval marker. Current `web-cd.yml` must not read it; rollback POST remains user-gated |
| `CLOUDFLARE_PAGES_PROJECT` | Variable | repository-scoped | Deprecated historical Pages value; current `web-cd.yml` must not read it |

運用ゲート:

- `staging` / `production` Environments は `gh api repos/{owner}/{repo}/environments/{name} -X PUT` で作成する。
- dev push smoke は `backend-ci.yml` / `web-cd.yml` の `deploy-staging` green と Discord 通知または未設定耐性を確認する。
- `if: secrets.X != ''` に依存せず、workflow 側では env に受けて shell で空文字判定する設計を優先する。
- API Token は Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read の最小スコープに限定し、命名規則 `ubm-hyogo-cd-{env}-{yyyymmdd}`（例: `ubm-hyogo-cd-staging-20260429`）でローテーション履歴を Token 名から追えるようにする。

## Workflow lint scope の不変条件（CI recovery / 2026-05-09）

`.github/workflows/ci.yml` の `workflow-shell-lint` job が呼び出す actionlint は、`.github/workflows/*.yml` を glob で全件検査する。Issue #526 時点の限定列挙と 2026-05-09 CI recovery wave の追記運用は、Issue #290 で全 32 workflow を対象にする glob gate へ昇格した。新規 workflow を `.github/workflows/` に追加した場合、同じ glob に自動包含される。

| 観点 | 正本 |
| --- | --- |
| actionlint runner | `.github/workflows/ci.yml` の `workflow-shell-lint` job 内 actionlint step |
| 対象 workflow（Issue #290 / 2026-05-17 時点） | `.github/workflows/*.yml`（現行 32 件） |
| 拡張ルール | `.github/workflows/` への workflow 追加は glob に自動包含。allowlist 追記運用へ戻さない |
| shellcheck 対象 | `scripts/observation/*.sh`, `scripts/observation/test/*.sh`, `scripts/redaction-check.sh`, `scripts/__tests__/*.sh`。`scripts/smoke/provision-staging-secrets.sh` は現行 Issue #290 scope 外であり、この invariant には含めない |

## setup-project cache input 不変条件（PR #795 residual CI recovery / 2026-05-18）

`setup-project` composite action の `cache` input は `actions/setup-node@v4` の cache strategy にそのまま渡す。default は `'pnpm'` で、通常 caller は指定不要。`install: 'false'` の caller は pnpm store を作らないため、`cache: ''` を明示して setup-node cache restore/save path を無効化する。

| Caller pattern | Required cache value | Reason |
| --- | --- | --- |
| `install: 'true'` / default install | omitted or `'pnpm'` | dependency install creates pnpm store |
| `install: 'false'` | `''` | no pnpm store exists; avoids setup-node cache post-step path validation |
| `setup-strategy: 'mise'` | ignored by node-setup path | mise action owns its own cache behavior |

## Failure cascade 抑止 pattern（CI recovery / 2026-05-09）

通知 / post step が依存する artifact 不在時に Slack webhook POST や `${VAR:?}` 展開で job 全段が連鎖失敗するのを防ぐため、**前提 artifact の存在を `hashFiles(...)` で guard する** pattern を canonical とする。`.github/workflows/runtime-smoke-staging.yml` の Slack failure post step は次の形を採用しており、他 workflow にも横展開推奨する。

```yaml
- name: Post Slack failure
  if: ${{ failure() && hashFiles('ci-evidence/summary.json') != '' }}
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_INCIDENT }}
  run: |
    bash scripts/smoke/post-slack-failure.sh
```

| guard 対象 | 評価式 |
| --- | --- |
| 必須 artifact が emit されているか | `hashFiles('<path>') != ''` |
| previous step の失敗 | `failure()` |
| 両方を AND 結合 | `${{ failure() && hashFiles('<path>') != '' }}` |

`if: secrets.X != ''` は repository / environment の解決順序によって false positive が起こり得るため、shell 内で空文字判定するか、本 pattern と組み合わせる。`${VAR:?}` を必要とする step は guard 内側に閉じ、guard 不成立時には step 全体を skip させて連鎖失敗を抑止する。

## Lessons learned (PR #795 由来 / 2026-05-18)

- **L-CICACHE-001**: `actions/setup-node@v4` の pnpm cache は `install: 'false'` 時に store path 不在で post step が fail する。`setup-project` action の `cache` input を `''` 明示で渡し cache を完全に無効化することが回避策。default は `'pnpm'` のまま、install を伴わない caller のみ `cache: ''` を渡す（参照: `## setup-project cache input 不変条件`、`changelog/20260518-pr795-ci-cache-token-recovery.md`）。
- **L-CFTOKEN-001**: `cloudflare/wrangler-action@v3` は `with.apiToken` 入力優先だが、内部で step-level `env.CLOUDFLARE_API_TOKEN` も参照するため、両方に同じ scoped secret を注入する dual injection が action 互換性で必須。独立 fallback ではなく、両者の同時注入が contract（参照: `references/deployment-secrets-management.md`、`changelog/20260518-pr795-ci-cache-token-recovery.md`）。
- **L-WFSCOPE-001**: `backend-ci.yml` で job-level env に Cloudflare token を昇格すると install / build step まで token が露出するため、deploy step-scoped 限定で `env` を渡すのが secret hygiene として必須。job-level `env:` への昇格は禁止し、step ごとに `env: { CLOUDFLARE_API_TOKEN: ${{ secrets.CF_TOKEN_* }} }` を限定付与する（参照: `references/deployment-secrets-management.md`、`changelog/20260518-pr795-ci-cache-token-recovery.md`）。

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

## post-release-30day-auto-summary

Issue #517 follow-up auto-summary foundation は、Issue #497 の 30 日 conclusion 集計を GitHub Actions cron で自動化する implementation / NON_VISUAL workflow である。Issue #517 / #497 / #351 は PR 文面で `Refs` のみ使用し、CLOSED issue を reopen しない。

| 項目 | 正本値 |
| --- | --- |
| workflow | `.github/workflows/post-release-30day-auto-summary.yml` |
| trigger | `schedule: '0 1 * * *'` (UTC 01:00) + `workflow_dispatch` input `dry_run` |
| script | `scripts/post-release-dashboard/30day-summary.sh` |
| aggregate lib | `scripts/post-release-dashboard/lib/aggregate.sh` |
| test | `scripts/post-release-dashboard/__tests__/30day-summary.test.sh` |
| branch | `auto/post-release-30day-summary-YYYYMM` |
| PR title prefix | `[auto-summary] post-release-dashboard 30d` |
| runtime state | `CONTRACT_READY_RUNTIME_PENDING` until scheduled 30 day runtime PASS |

### Steps

1. `gh run list --workflow=post-release-dashboard.yml --limit=80 --json conclusion,createdAt,event,databaseId,url` で raw JSON を取得する。
2. `event=="schedule"` のみを gate / 集計対象にし、manual `workflow_dispatch` は 30 日連続判定・failure rate・streak に含めない。
3. 最古 schedule run の `createdAt <= today - 30d`、schedule day 数 `>= 30`、`missing_schedule_gap_days == 0` を 30 日 gate とし、不成立時は exit 0 silent skip にする。
4. schedule run の conclusion 分布 / 連続 failure / 原因分類 / failure 比率を集計する。
5. `token` / `bearer` / `secret` / `Authorization` を含む行を redaction する。
6. 同月内に同 title prefix の open PR が存在する場合は exit 0 silent skip とし、Slack 通知もしない。
7. gate 成立かつ重複なしの場合のみ branch push と `gh pr create --draft` を実行する。
8. Slack Incoming Webhook に 5 行以内の summary と PR URL を POST する。

### Slack channel bootstrap

Slack channel 作成は workflow / shell script に入れない。Slack App / Bot OAuth 化を避け、次の manual preflight を Phase 11 evidence と README に固定する。

| 項目 | 正本値 |
| --- | --- |
| channel | `w1618436027-ek2505248` |
| webhook | Incoming Webhook を当該 channel に bind |
| secret source | 1Password 正本 |
| GitHub Secret | `SLACK_WEBHOOK_URL`（derived copy / 実値を docs, logs, PR body に残さない） |
| evidence | `docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/phase-11/evidence/slack-test-post.log` |
| pending state | channel / webhook / secret 未準備時は `CONTRACT_READY_SECRET_PENDING` |

### Permissions / failure handling

workflow permissions は `contents: write` / `pull-requests: write` / `actions: read` のみ。`gh run list` 失敗は workflow failure、Slack POST 失敗は PR 残置 + exit 3 とし、retry / alert 実装は本 workflow に含めない。failure 比率 `>= 10%` の場合は PR body に retry / alert 検討節を追記する。

| 2026-05-09 | 2.6.0 | CI recovery wave: 「Workflow lint scope の不変条件」と「Failure cascade 抑止 pattern」を追加。actionlint 対象 workflow に `web-cd.yml` / `runtime-smoke-staging.yml` を含めること、Slack failure post 等の通知 step は `hashFiles('<artifact>') != ''` guard で連鎖失敗を抑止することを正本化 |
| 2026-05-18 | 2.6.1 | PR #795 residual CI recovery を同期。`setup-project.cache` input と `install: 'false'` caller の `cache: ''` 不変条件、backend-ci D1 / Workers scoped tokens の `with.apiToken` + step-level `env.CLOUDFLARE_API_TOKEN` 併用、secret 存在確認 / runtime GHA evidence の user-gated 境界を正本化 |
| 2026-05-07 | 2.5.0 | Issue #517 follow-up auto-summary foundation を実装。`.github/workflows/post-release-30day-auto-summary.yml`、`scripts/post-release-dashboard/30day-summary.sh` ＋ TC-01〜TC-07 / TC-05b plain shell test、schedule-only 30 day gate、open PR idempotency、`auto/post-release-30day-summary-YYYYMM` branch / `[auto-summary] post-release-dashboard 30d` PR title prefix / Slack Incoming Webhook (channel `w1618436027-ek2505248`) を正本化。Issue #517 は CLOSED 維持 / `Refs` のみ |
| 2026-05-06 | 2.4.0 | Issue #407 Cloudflare API Token rotation reminder workflow を追加。`CF_TOKEN_ISSUED_AT`、85 日 reminder、dry-run、duplicate guard、最小 permissions を正本化 |
| 2026-05-05 | 2.3.0 | Issue #351 post-release dashboard automation を追加。read-only analytics token、daily schedule、artifact path、redaction gate、`scripts/cf.sh api-post` 境界を正本化 |
| 2026-04-29 | 2.2.0 | UT-CICD-DRIFT: Node 22→24 / pnpm 9→10.33.2 同期、workflow 構成表に `validate-build.yml` / `verify-indexes.yml` を追加、Discord 通知未実装の current facts 注記、coverage soft→hard gate 段階性注記 |
| 2026-05-06 | 2.3.0 | U-FIX-CF-ACCT-01-DERIV-01 OIDC short-lived credential target contract を追加。OIDC runtime cutover は未実行。Issue #718 以降 `backend-ci.yml` は `CF_TOKEN_D1_*` / `CF_TOKEN_WORKERS_*`、`d1-migration-verify.yml` は 2026-05-16 に `secrets.CLOUDFLARE_API_TOKEN` へ統一済み、`web-cd.yml` は environment-scoped `secrets.CLOUDFLARE_API_TOKEN` を使う |
| 2026-04-29 | 2.1.0 | UT-27: GitHub Secrets / Variables 配置決定マトリクスと Phase 13 user 承認ゲートを追記 |
| 2026-04-09 | 2.0.0 | 旧デプロイ基盤・Electron E2E 削除、Cloudflare Pages デプロイへ移行 |
