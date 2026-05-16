# Phase 2: 設計

## 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────────┐
│ user (1Password CLI + GitHub CLI)                                   │
│   op read 'op://...' | gh secret set <NAME> --env <ENV>             │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ writes secret
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ GitHub Secrets store                                                │
│   Environment scope:                                                │
│     - staging-runtime-smoke (target 5 件: STAGING_*, SLACK_*)       │
│     - staging (CLOUDFLARE_API_TOKEN)                                │
│     - production (CLOUDFLARE_API_TOKEN)                             │
│   Repository scope:                                                 │
│     - GOOGLE_SERVICE_ACCOUNT_JSON, SLACK_WEBHOOK_INCIDENT, ...      │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ reads (read-only, via gh api)
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ scripts/ci/verify-env-secrets.sh  (新規・preflight gate 本体)        │
│   1. .github/workflows/*.yml を走査して secrets.X 参照集合を抽出     │
│   2. 各 workflow の job ごとに environment: 指定を抽出               │
│   3. gh api .../environments/<env>/secrets と突合                   │
│   4. fallback: gh api .../actions/secrets (Repository scope)        │
│   5. 解決不能な (secret 名, scope 集合) を列挙                       │
│   6. 既知 false-positive (条件付き発火 / inputs 経由) は許可リストへ │
│   7. 未登録があれば exit 1                                           │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ invoked by
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ .github/workflows/verify-env-secrets.yml  (新規)                    │
│   triggers: pull_request, push (dev/main), workflow_dispatch        │
│   step: bash scripts/ci/verify-env-secrets.sh                       │
│   secrets required: GITHUB_TOKEN (default), 追加なし                 │
└─────────────────────────────────────────────────────────────────────┘
```

## task-01: staging-runtime-smoke secret finalization

### 設計方針

既存 `scripts/smoke/provision-staging-secrets.sh` を user 単独で実行することで一括投入する。AI 側で行うのは:

1. 投入対象 5 件の確定リストを task-01/runbook.md に記述（既存 `secret-provisioning.md` を citation）
2. 投入前 baseline（`gh api .../secrets --jq '.secrets | length'` = 0）の evidence 受け入れ枠を準備
3. 投入後 verify（同コマンド = 5）の evidence 受け入れ枠を準備
4. `gh workflow run runtime-smoke-staging.yml` 再実行手順と success 判定 step の citation

### 投入対象 5 件

| name | source (1Password 参照は既存 runbook を canonical とする) | 用途 |
|------|----------------------------------------------------------|------|
| `STAGING_API_BASE` | staging worker URL | runtime smoke 接続先 |
| `STAGING_ADMIN_BEARER` | admin bearer | admin endpoint 認証 |
| `STAGING_MEMBER_ID` | seed member uuid | member-scoped probe |
| `STAGING_ME_BEARER` | member bearer | `/me` endpoint 認証 |
| `SLACK_WEBHOOK_INCIDENT` | failure post 用 | smoke failure 時の Slack 通知 |

### 制約

- runbook citation 形式: 「`docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` §54-58 に従う」を明示
- AI による `op read` / `gh secret set` 代行禁止
- 値の hash / 末尾抜粋 / token fragment を chat / file に残さない

## task-02: adjacent unregistered secret inventory

### 設計方針

prior investigation で抽出した未登録・scope 不整合 15 件を、各 workflow の発火条件・用途とともに棚卸しし、1 件ずつ 3 分類のいずれかへ確定させる:

| 分類 | 定義 | 完了条件 |
|------|------|----------|
| 投入 (provision) | workflow を残し、user が値を投入する | 該当 scope に secret 登録済み |
| 整合 (align) | 既存 secret 名 (`CLOUDFLARE_API_TOKEN`) に統一して workflow YAML を編集 | workflow YAML 修正済み + preflight gate green |
| 廃止 (retire) | 使われていない / 重複 / 別経路で代替済み workflow を一時 disable または削除 | workflow YAML から参照削除 / `if: false` |

### 初期分類案（task-02 で詳細詰め）

| secret 名 | 参照 workflow | 初期分類 | 根拠 |
|----------|--------------|---------|------|
| `CLOUDFLARE_API_TOKEN_STAGING` | `d1-migration-verify.yml` | 整合 | `staging` env の `CLOUDFLARE_API_TOKEN` で代替可能 |
| `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY` | `post-release-dashboard.yml` | 投入 | 権限分離が必要なため readonly token 新規発行が筋 |
| `CF_AUDIT_D1_TOKEN_PROD` / `CF_AUDIT_R2_TOKEN_PROD` / `CF_AUDIT_TOKEN_PROD` / `CF_AUDIT_WORKERS_AI_TOKEN` | audit log 系 | 投入 or 整合 | task-02 で実発火状況確認後決定 |
| `CLOUDFLARE_ACCOUNT_TAG` / `CLOUDFLARE_ZONE_TAG` | dashboard / analytics 系 | 投入（vars 移行可能性も検討） | 非機密の可能性あり → GitHub Variables 化検討 |
| `CLOUDFLARE_ALERTS_TOKEN_READ` / `CLOUDFLARE_ANALYTICS_API_TOKEN` / `CLOUDFLARE_ALERT_RELAY_URL` | alert / analytics 系 | 投入 | 必要な scope の token を発行 |
| `AUTH_SECRET` | Auth.js 系 | 投入 | 既に web-cd 等で利用想定。env 別投入 |
| `EMAIL_WEBHOOK_URL` | 通知系 | 整合 or 廃止 | 使用状況要確認 |
| `SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` / `SLACK_WEBHOOK_URL` | Slack 系 | 整合 | repo-level `SLACK_WEBHOOK_INCIDENT` に集約可否を判定 |

### 制約

- 「投入」分類の secret は task-02 spec 内に投入手順 (1Password item path / `gh secret set` コマンド) を user 操作用に明記
- 「整合」分類の workflow YAML 編集は AI 実行可（実値触れない）
- 「廃止」分類は 1 cycle 内で行うのは workflow `if: false` 化 or 参照削除のみ。workflow ファイル自体の削除は user 確認後

## task-03: env-scope secret preflight gate

### `scripts/ci/verify-env-secrets.sh` 設計

#### 入力
- 環境変数: `GH_TOKEN`（CI で `secrets.GITHUB_TOKEN` を渡す。Repository / Environment secret list API への read 権限）
- 任意引数: `--workflows-dir <path>`（既定 `.github/workflows`）、`--allow-list <path>`（既定 `scripts/ci/verify-env-secrets.allowlist`）、`--json`（machine-readable 出力）

#### 処理フロー (Bash + `gh` + `awk`)

1. **secret 参照抽出**:
   ```sh
   grep -rhEo 'secrets\.[A-Z_][A-Z0-9_]+' "$WORKFLOWS_DIR" | sed 's/^secrets\.//' | sort -u
   ```
2. **workflow ↔ environment マッピング抽出**: 各 yml を Bash + `awk` の限定パーサで読み、`jobs.*.environment` と job 内 `secrets.*` 参照を関連付ける
3. **GitHub API 突合**:
   - 全 Environment 列挙: `gh api repos/{owner}/{repo}/environments --jq '.environments[].name'`
   - 各 env の secret 一覧: `gh api repos/{owner}/{repo}/environments/$env/secrets --jq '.secrets[].name'`
   - Repository scope: `gh api repos/{owner}/{repo}/actions/secrets --jq '.secrets[].name'`
4. **解決判定**: 各 (workflow, job, secret 名) について「(a) 該当 env scope に存在 OR (b) Repository scope に存在 OR (c) `${{ github.token }}` / `GITHUB_TOKEN` 等の built-in」のいずれかなら PASS
5. **allow-list 適用**: false-positive 抑止用に `name=<secret>;reason=<text>` 形式を読み込み、該当を skip
6. **出力**: 未解決一覧を行ごとに `workflow=...;job=...;env=...;secret=...;reason=missing-in-env-and-repo` または `missing-environment-and-repo-secret` で stdout。`--json` 指定時は JSON array
7. **exit code**: 未解決 1 件以上 → 1、なし → 0

#### 制約・回避

- 実値は一切取得しない（`secret` API は **値を返さない** name list のみ。read-only 経路）
- false-positive 源:
  - workflow_call の `secrets: inherit` → caller-callee 両方を走査する必要あり
  - `if:` 条件で発火しない job → スキャン対象に含めるが、allow-list で「未発火だが将来要」を suppress 可能
  - inputs 経由で渡される secret 名 → 静的解析困難。allow-list で個別対応
  - PR/push gate では `--event-name "$GITHUB_EVENT_NAME"` により、その event で発火しない workflow を scan 対象外にする
- 性能: 環境 5 + repo secrets 1 + workflow 約 30 ファイルで API call 約 10 回未満。CI 30 秒以内で完了する

### `scripts/ci/__tests__/verify-env-secrets.spec.sh` 設計

bats もしくは plain shell test:

| ケース | 入力 | 期待 |
|--------|------|------|
| TC-01 全 secret 登録済 | mock API + fixture workflow が完全 | exit 0 |
| TC-02 env scope 欠落 | staging-runtime-smoke の STAGING_* を mock から外す | exit 1, stdout に 4 行 |
| TC-03 repo scope fallback OK | repo に該当 secret あり | exit 0 |
| TC-04 allow-list で suppress | 欠落あるが allow-list 記載 | exit 0 |
| TC-05 GITHUB_TOKEN built-in | `secrets.GITHUB_TOKEN` のみ | exit 0 |
| TC-06 workflow が `if: false` | 発火不能 workflow | exit 0（allow-list 不要、`if:` 検出で自動 skip） |

mock 方法: `gh` を `PATH` から外し、テスト用 `gh` stub script を差し込んで応答固定化。

### `.github/workflows/verify-env-secrets.yml` 設計

```yaml
name: verify-env-secrets
on:
  pull_request:
  push:
    branches: [dev, main]
  workflow_dispatch:
permissions:
  contents: read
  actions: read
jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - name: run preflight gate
        env:
          GH_TOKEN: ${{ secrets.GH_VERIFY_ENV_SECRETS_TOKEN || secrets.GITHUB_TOKEN }}
        run: bash scripts/ci/verify-env-secrets.sh --json --event-name "${GITHUB_EVENT_NAME}" > ci-evidence/verify-env-secrets.json
      - name: upload report on fail
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: verify-env-secrets-report-${{ github.run_id }}
          path: ci-evidence/verify-env-secrets.json
```

`GITHUB_TOKEN` の `actions: read` で Environment / Repository secret list API は `repo` scope 必要（`metadata` scope では `name` 取得不可なので Personal Access Token 等が必要か検証する。検証で `GITHUB_TOKEN` で不足が判明した場合は `secrets.GH_VERIFY_ENV_SECRETS_TOKEN`（fine-grained PAT）を追加する設計に切り替える。task-03 spec 内に検証手順と切替手順の両方を記載する）。

## 検証戦略

- task-01: user 操作完了 evidence (`gh api .../secrets --jq '.secrets | length'` = 5) を Phase 11 へ
- task-02: 15 件が「投入 / 整合 / 廃止」のどれに分類されたかの完了表を Phase 11 へ。整合分の workflow YAML diff を引用
- task-03: 上記 9 ケース test の実行ログを Phase 11 へ。CI 上の verify-env-secrets workflow が green になった run URL を引用

## エラー処理

- preflight gate が GITHUB_TOKEN 権限不足で API 失敗 → 仕様変更（fine-grained PAT 投入）。task-03 spec に両ケース手順
- workflow_call 経由 inherit が解析できない → allow-list に追加 + 改善 issue 別起票

## ロギング

- `verify-env-secrets.sh` の stdout は CI step log に。失敗時は JSON report を artifact upload
- 実値は一切ログに出さない（`set -x` を使わない）
