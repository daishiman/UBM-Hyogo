# task-03-env-secret-preflight-gate

[実装区分: 実装仕様書]

判定根拠: 本タスクは新規スクリプト・新規 shell test・新規 allowlist 雛形・新規 GitHub Actions workflow の追加のみで構成される。既存ファイルの編集・既存 CI gate の挙動変更・ドキュメント差分は含まないため、純粋な「実装仕様書」に該当する。

## 概要

env-scope GitHub Secret（特に `staging` / `production` environment に紐付く `STAGING_*` / `PRODUCTION_*` 系）が CI 実行時に欠落していると、後続 job が runtime で初めて fail する。本タスクでは、PR / push (dev,main) / workflow_dispatch のタイミングで `.github/workflows/**` を静的解析し、参照されている `secrets.*` が（job ごとに紐付く） environment scope または repository scope のいずれかに登録済みであることを CI 発火前に検証する preflight gate を新規実装する。

検証は GitHub REST API による「secret name 列挙」（値ではない）にのみ依拠し、未解決があれば exit 1 で workflow を fail させる。false-positive は専用 allowlist で抑止する。

## 実装区分

実装仕様書（新規 4 ファイル追加のみ）。

## 変更対象ファイル

| 区分 | パス | 種別 |
|------|------|------|
| 新規 | `scripts/ci/verify-env-secrets.sh` | Bash スクリプト |
| 新規 | `scripts/ci/__tests__/verify-env-secrets.spec.sh` | shell test (Bash) |
| 新規 | `scripts/ci/verify-env-secrets.allowlist` | 平文 allowlist 雛形 |
| 新規 | `.github/workflows/verify-env-secrets.yml` | GitHub Actions workflow |

既存ファイルへの編集は行わない。

## アーキテクチャ

```
.github/workflows/**.yml
        │
        ▼
extract_secret_refs()  ──┐
        │                │
map_workflow_to_env()    │
        │                ├─► resolve() ──► apply_allowlist() ──► report()
fetch_env_secrets()      │                                          │
fetch_repo_secrets()  ──┘                                          ▼
                                                          stdout (text / JSON)
                                                          exit 0 | 1 | 2 | 3
```

データフロー:

1. `.github/workflows/**/*.yml` を走査し `secrets.NAME` の参照集合 `R = {(workflow, job, name)}` を抽出。
2. 各 (workflow, job) について `jobs.<id>.environment` を Bash + `awk` の限定パーサで抽出し env scope `E` を割り当て（未指定なら `repo` 扱い）。
3. GitHub REST API で env scope の secret name list と repo scope の secret name list を取得（値は取得しない）。
4. 各参照について env→repo の順で解決可否を判定。未解決は allowlist で suppress。
5. 残った未解決を stdout に列挙し、1 件以上なら exit 1。

## scripts/ci/verify-env-secrets.sh 関数仕様

### シグネチャ

```sh
verify_env_secrets() {
  # args:
  #   --workflows-dir DIR  (default: .github/workflows)
  #   --allow-list FILE    (default: scripts/ci/verify-env-secrets.allowlist)
  #   --json               (default: text)
  #   --event-name EVENT   (optional; scan only workflows that can run for EVENT)
  #   --owner OWNER        (default: git config remote.origin.url から導出)
  #   --repo  REPO         (default: 同上)
  # env:
  #   GH_TOKEN             (required; env/repo secrets の name 列挙権限)
  # stdout:
  #   text: workflow=...;job=...;env=...;secret=...;reason=...
  #   json: [{ "workflow":"...","job":"...","env":"...","secret":"...","reason":"..." }, ...]
  # exit:
  #   0  全 secret 解決済
  #   1  未解決 1 件以上
  #   2  usage error (不正な引数 / 入力)
  #   3  gh api error (token 不足 / network)
}
```

### 関数構造

| 関数 | 入力 | 出力 | 役割 |
|------|------|------|------|
| `extract_refs()` | workflow path | `workflow\tjob\tenv\tsecret` の TSV を stdout | `awk` で `jobs.<id>.environment` と同 job 内の `secrets.NAME` を抽出 |
| `env_secret_file(env)` | env 名 | secret name list file path | `gh api .../environments/$env/secrets --jq '.secrets[].name'`。HTTP 404 は存在しない Environment として空 list + `missing-environment-and-repo-secret` reason に変換 |
| `fetch_env_secrets(env)` | env 名 | secret name list (改行区切り) | `gh api repos/$OWNER/$REPO/environments/$env/secrets --paginate -q '.secrets[].name'` |
| `fetch_repo_secrets()` | (none) | secret name list | `gh api repos/$OWNER/$REPO/actions/secrets --paginate -q '.secrets[].name'` |
| `resolve(workflow, job, env, secret)` | tuple | `ok` / `missing` | env scope → repo scope の順に在籍判定 |
| `apply_allowlist(unresolved)` | unresolved list, allowlist file | 残 unresolved list | `name=...;reason=...` 行を read し、name 一致を skip |
| `report(unresolved, format)` | unresolved list | stdout (text/json) | format に応じて整形 |

### 内部規約

- `GITHUB_TOKEN` 組み込みシークレット (`secrets.GITHUB_TOKEN`) は常に解決済として skip する（特例リスト: `GITHUB_TOKEN`）。
- `if: false` で恒久 disable されている job は `awk` で検出し対象から除外する。
- `jobs.<id>.environment` が存在するが GitHub Environment 自体が未作成の場合、API 404 を usage error にせず未解決 secret として報告する。
- 値（value）には一切触れない。`gh api` の戻り値は name list 以外を参照しない。
- 一時ファイルは `mktemp -d` 配下に作り、`trap 'rm -rf "$TMP"' EXIT` で必ず削除する。
- `$OWNER` / `$REPO` 未指定時は `git config --get remote.origin.url` を `sed` で `owner/repo` に正規化（`https://github.com/...` と `git@github.com:...` 両対応）。

## allow-list 形式

`scripts/ci/verify-env-secrets.allowlist`:

```
# verify-env-secrets allowlist
# 行頭 # はコメント。
# 形式: name=<SECRET_NAME>;reason=<provision 計画や根拠>
# 雛形には最小限のエントリのみを記載し、長期 mute を避ける。

name=GH_VERIFY_ENV_SECRETS_TOKEN;reason=fine-grained PAT used only by this preflight gate (task-03 fallback)
```

パース規則:

- 空行・`#` で始まる行は無視。
- 1 行 1 entry。`name=...;reason=...` の形式必須。
- `reason` 未指定はパースエラー（exit 2）。長期 mute を防ぐため必須化する。

## scripts/ci/__tests__/verify-env-secrets.spec.sh テストケース

### 共通方針

- 実 GitHub API は叩かない。`PATH` の先頭に test 用 `gh` stub script を配置し、`gh api ...` の呼び出しに対し fixture JSON を返す。
- fixture はテスト実行時に `mktemp -d` 配下へ生成し、`PATH` 先頭の `gh` stub が固定応答を返す。
- assertion は `diff <(actual) <(expected)` および `[ "$actual_exit" -eq <expected> ]` で判定。
- すべて Bash で記述し、`set -euo pipefail` を有効化する。

### ケース一覧

| ID | 前提 | 期待 exit | 期待 stdout |
|----|------|-----------|-------------|
| TC-01 | 全 secret が env または repo に登録済 | 0 | 空（text）/ `[]`（json） |
| TC-02 | `staging-runtime-smoke.yml` の `STAGING_*` (4 件) を `staging-runtime-smoke` env-secrets fixture から外す | 1 | 4 行（workflow=staging-runtime-smoke;job=smoke;env=staging-runtime-smoke;secret=STAGING_*;reason=missing in env+repo） |
| TC-03 | env scope に欠落するが repo scope に同名 secret あり | 0 | 空 |
| TC-04 | TC-02 の 4 件のうち 1 件を allowlist に登録 | 1 | 3 行（残 3 件） |
| TC-05 | workflow が `secrets.GITHUB_TOKEN` のみ参照 | 0 | 空 |
| TC-06 | workflow job が `if: false` で disable | 0 | 空（解析対象から除外） |
| TC-07 | job environment が未作成 | 1 | `missing-environment-and-repo-secret` reason で 1 行 |
| TC-08 | manual-only workflow を `--event-name pull_request` で実行 | 0 | 空 |
| TC-09 | `environment.name` object と step `name:` の取り違え防止 | 0 | 空 |

### gh stub の挙動

```sh
# scripts/ci/__tests__/fixtures/bin/gh
#!/bin/sh
case "$*" in
  "api repos/"*"/environments/staging-runtime-smoke/secrets"*) cat "$FIXTURE_DIR/env-secrets/staging-runtime-smoke.json" ;;
  "api repos/"*"/environments/staging/secrets"*) cat "$FIXTURE_DIR/env-secrets/staging.json" ;;
  "api repos/"*"/environments/production/secrets"*) cat "$FIXTURE_DIR/env-secrets/production.json" ;;
  "api repos/"*"/actions/secrets"*) cat "$FIXTURE_DIR/repo-secrets.json" ;;
  *) echo "gh stub: unexpected args: $*" >&2; exit 99 ;;
esac
```

各 fixture は `{"secrets":[{"name":"..."}]}` 形式の固定 JSON。

## .github/workflows/verify-env-secrets.yml

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
      - name: Run preflight gate
        env:
          # 1st choice: built-in GITHUB_TOKEN (actions:read で env secret name 列挙可能か検証)
          # 2nd choice: fine-grained PAT (環境変数 GH_VERIFY_ENV_SECRETS_TOKEN)
          GH_TOKEN: ${{ secrets.GH_VERIFY_ENV_SECRETS_TOKEN || secrets.GITHUB_TOKEN }}
        run: |
          mkdir -p ci-evidence
          bash scripts/ci/verify-env-secrets.sh --json \
            > ci-evidence/verify-env-secrets.json
      - name: Upload evidence on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: verify-env-secrets-evidence
          path: ci-evidence/verify-env-secrets.json
```

設計メモ:

- `permissions.actions: read` を明示。
- `GH_TOKEN` は PAT があれば優先し、なければ `GITHUB_TOKEN` にフォールバック。後者で env secret name 列挙が拒否される場合は fallback 戦略へ進む。
- 失敗時のみ JSON を artifact 化する（false-positive 調査用）。

## fallback 戦略 (PAT 切替)

組み込み `GITHUB_TOKEN` で env scope secret の name 列挙が拒否される可能性があるため、以下の順で fallback する:

1. **事前検証**: 一時 workflow_dispatch で以下を実行し HTTP code を取得する。

   ```sh
   gh api -i repos/${OWNER}/${REPO}/environments/staging/secrets | head -n 1
   ```

   - `200 OK` → `GITHUB_TOKEN` で十分。PAT 不要。
   - `403 Forbidden` / `404 Not Found` → PAT が必要。

2. **PAT 発行（ユーザー手動）**: fine-grained PAT を以下スコープで発行。

   - Repository access: 当該 repo のみ
   - Permissions:
     - `Actions: Read-only`
     - `Secrets: Read-only` (env / repo)
     - `Environments: Read-only`

3. **secret 登録**: `gh secret set GH_VERIFY_ENV_SECRETS_TOKEN -b <PAT>` を実行（CLAUDE.md の Cloudflare 系ラッパールールには非該当。`gh` 直接実行で可）。

4. **workflow 切替**: 上記 yaml の `GH_TOKEN` 行が `secrets.GH_VERIFY_ENV_SECRETS_TOKEN || secrets.GITHUB_TOKEN` の順で評価されるため、登録だけで自動切替される。

5. **allowlist 反映**: `GH_VERIFY_ENV_SECRETS_TOKEN` 自身は本 gate 専用なので allowlist 雛形に既定で含めておく。
   `AUTH_SECRET` は `lighthouse.yml` の authenticated probe 用 optional secret で、未設定時は workflow 内 availability gate により authenticated steps を skip するため、理由付き allowlist に含める。

## ローカル・CI 実行コマンド

ローカル:

```sh
# 単発実行（要 gh auth login 済 or GH_TOKEN export）
GH_TOKEN=$(gh auth token) bash scripts/ci/verify-env-secrets.sh
GH_TOKEN=$(gh auth token) bash scripts/ci/verify-env-secrets.sh --json | jq .

# テスト一式
bash scripts/ci/__tests__/verify-env-secrets.spec.sh

# actionlint
mise exec -- pnpm exec actionlint .github/workflows/verify-env-secrets.yml
```

CI:

- `.github/workflows/verify-env-secrets.yml` が PR / push (dev,main) / workflow_dispatch で発火し、`--event-name "$GITHUB_EVENT_NAME"` で当該 event の発火対象 workflow だけを検査する。
- 失敗時は `verify-env-secrets-evidence` artifact を確認。

## DoD

- [ ] `scripts/ci/verify-env-secrets.sh` が新規作成され、上記関数群と CLI を満たす。
- [ ] `scripts/ci/__tests__/verify-env-secrets.spec.sh` が新規作成され、TC-01〜TC-09 が local pass する。
- [ ] `scripts/ci/verify-env-secrets.allowlist` が雛形（既定 2 エントリ）として配置される。
- [ ] `.github/workflows/verify-env-secrets.yml` が新規作成され、`pnpm exec actionlint` を pass する。
- [ ] task-01 / task-02 完了後、本 workflow が `dev` 上で green を確認できる。
- [ ] false-positive のために allowlist に追加された行が、雛形の最小 2 エントリ以外に存在しない（mute 濫用なし）。

## 不変条件

1. secret の **値** は GitHub API で取得不能。コードも値に触れない設計を維持する。
2. test は実 GitHub API を叩かず、`PATH` 先頭の `gh` stub のみで動作する（CI 上の flakiness ゼロを保証）。
3. 本 gate は `.github/workflows/**` の静的解析にのみ依拠し、ランタイム実行を伴わない（5 分以内に終了）。
4. allowlist は「provision 計画が確定している短期 mute」専用とし、`reason` の記述を必須化する。
5. 本 task では既存ファイルを編集せず、4 つの新規ファイル追加のみで完結する。
6. CLAUDE.md の `apps/web` env アクセス不変条件・Cloudflare CLI ラッパールール等は本 task の scope 外（GitHub Actions / `gh` CLI のみを扱う）。

## References

- 上位 workflow: `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/index.md`
- Phase 1: `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/phase-1.md`
- Phase 2: `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/phase-2.md`
- Phase 3: `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/phase-3.md`
- 関連 task: `task-01-staging-runtime-smoke-secret-finalization/`, `task-02-adjacent-unregistered-secret-inventory/`
- GitHub REST API:
  - `GET /repos/{owner}/{repo}/environments/{environment_name}/secrets`
  - `GET /repos/{owner}/{repo}/actions/secrets`
- 既存 CI gate 参考: `.github/workflows/verify-indexes.yml`, `.github/workflows/verify-test-suffix.yml`
