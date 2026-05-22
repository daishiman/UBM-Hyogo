# Phase 5: 実装

> [実装区分: 実装仕様書] / TDD GREEN

## 1. 実装タスク一覧

### Task 5-1: `scripts/redaction-check.sh` 新規作成

**パス**: `scripts/redaction-check.sh`

**概要**: log の中に Cloudflare Account ID や token 形式の文字列が漏れていないか grep で検証する。

**実装スケルトン**:

```bash
#!/usr/bin/env bash
set -euo pipefail

LOG_FILE=""
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --log) LOG_FILE="$2"; shift 2 ;;
    --account-id) ACCOUNT_ID="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ -n "$LOG_FILE" && ! -f "$LOG_FILE" ]]; then
  echo "ERROR: log file not found: $LOG_FILE" >&2
  exit 1
fi

INPUT_SRC="${LOG_FILE:-/dev/stdin}"
LEAK_FOUND=0

# 1. Account ID 検出（明示的に与えられた場合のみ）
if [[ -n "$ACCOUNT_ID" ]]; then
  if grep -F -n "$ACCOUNT_ID" "$INPUT_SRC" >/dev/null 2>&1; then
    echo "::error::Cloudflare Account ID leaked in log"
    grep -F -n "$ACCOUNT_ID" "$INPUT_SRC" | sed 's/[A-Za-z0-9]/*/g'
    LEAK_FOUND=1
  fi
fi

# 2. token 形式（40+ chars）検出。GitHub Actions の `***` マスクが効いていれば該当しない
if grep -E -n '[A-Za-z0-9_-]{40,}' "$INPUT_SRC" 2>/dev/null | grep -v -E '(sha256|sha1|sha512|commit|hash|node_modules|integrity|pnpm-lock|package-lock)' >/dev/null; then
  echo "::error::token-like long string detected in log"
  LEAK_FOUND=1
fi

exit $LEAK_FOUND
```

**シグネチャ**: `bash scripts/redaction-check.sh [--log <path>] [--account-id <id>]`
**副作用**: なし（read-only）
**戻り値**: 0 = leak なし / 1 = leak 検出 / 2 = 引数エラー

### Task 5-2: `.github/workflows/web-cd.yml` 改修

**現状**（line 22, 63 付近）:

```yaml
deploy-staging:
  environment: staging
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}  # ← line 22, job-level
  steps:
    - run: |
        if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
          echo "::error::CLOUDFLARE_API_TOKEN is empty..."
        fi
    ...
```

**変更後**:

```yaml
deploy-staging:
  environment: staging
  # job-level env から CLOUDFLARE_API_TOKEN を削除
  steps:
    - name: Deploy to Cloudflare Workers (staging)
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
      run: |
        set -o pipefail
        if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
          echo "::error::CLOUDFLARE_API_TOKEN is empty. Confirm GitHub Environment 'staging' has CLOUDFLARE_API_TOKEN registered."
          exit 1
        fi
        bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging 2>&1 | tee deploy.log
    - name: Redaction check
      env:
        CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
      run: bash scripts/redaction-check.sh --log deploy.log --account-id "$CLOUDFLARE_ACCOUNT_ID"
```

production も同様。

### Task 5-3: `.github/workflows/backend-ci.yml` 確認

**現状**: `cloudflare/wrangler-action@v3` の `apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}` は step 直下の `with:` で渡されているため、すでに step-scoped。

**変更**: なし。`wrangler-action` の `with.apiToken` は action step 入力であり、取得済み log file が存在しないため `redaction-check.sh` は接続しない。job-level に env が存在しないことと `apiToken` 4 箇所が step-scoped であることを `workflow-env-scope.test.sh` で確認する。

### Task 5-4: 他 4 workflow の確認・補正

```bash
# 開始時に必ず grep で再確認
grep -n "CLOUDFLARE_API_TOKEN" \
  .github/workflows/cf-audit-log-cold-storage.yml \
  .github/workflows/cf-audit-log-monitor.yml \
  .github/workflows/d1-migration-verify.yml \
  .github/workflows/post-release-dashboard.yml
```

結果に基づき、job-level `env:` 配置のものを step-scoped に降格。

### Task 5-5: テストファイル作成

Phase 4 の TC 群を `scripts/__tests__/redaction-check.test.sh` / `workflow-env-scope.test.sh` として bash で実装。

### Task 5-6: `deployment-secrets-management.md` 更新

`.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` に以下を追記:

- step-scoped `env:` パターンの canonical 記述
- redaction-check の存在と運用方針
- OIDC 完全移行は別 unassigned task（issue-640-followup-001）に切り出し済みである旨

## 2. 変更対象ファイル一覧（最終）

| パス | 種別 |
|---|---|
| `scripts/redaction-check.sh` | 新規 |
| `scripts/__tests__/redaction-check.test.sh` | 新規 |
| `scripts/__tests__/workflow-env-scope.test.sh` | 新規 |
| `.github/workflows/web-cd.yml` | 編集 |
| `.github/workflows/backend-ci.yml` | 静的確認（wrangler-action `with.apiToken` の step-scoped 維持） |
| `.github/workflows/cf-audit-log-cold-storage.yml` | 編集（必要時） |
| `.github/workflows/cf-audit-log-monitor.yml` | 編集（必要時） |
| `.github/workflows/d1-migration-verify.yml` | 編集（必要時） |
| `.github/workflows/post-release-dashboard.yml` | 編集（job-level analytics token を step-scoped 化） |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 |

## 3. ローカル検証コマンド

```bash
# テスト
bash scripts/__tests__/redaction-check.test.sh
bash scripts/__tests__/workflow-env-scope.test.sh

# workflow lint
actionlint .github/workflows/web-cd.yml .github/workflows/backend-ci.yml
pnpm test:workflow-secrets

# grep evidence
grep -n "CLOUDFLARE_API_TOKEN" .github/workflows/*.yml
```

## 4. DoD（Phase 5）

- [ ] Phase 4 のテストが全て GREEN
- [ ] `actionlint` がエラーなし（ローカル未導入の場合は CI gate で確認）
- [ ] `grep -A1 "jobs:" .github/workflows/web-cd.yml | grep -B0 -A4 "env:"` で job-level に CLOUDFLARE_API_TOKEN がないことを確認
- [ ] redaction-check.sh が単体実行で動作
