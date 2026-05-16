# Phase 5: 実装

## タスク 1: `runtime-smoke-staging.yml` の path 修正

**ファイル**: `.github/workflows/runtime-smoke-staging.yml`

**変更**: line 46 の error メッセージ内 path を current 位置（`completed-tasks/` 配下）へ更新。

```diff
- echo "::error::register via 'gh secret set <NAME> --env staging-runtime-smoke' (see docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md)"
+ echo "::error::register via 'gh secret set <NAME> --env staging-runtime-smoke' (see docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md)"
```

## タスク 2: `scripts/ci/verify-workflow-doc-refs.sh` 新規実装

### スケルトン

```sh
#!/usr/bin/env bash
# 目的: .github/workflows/*.yml 内の docs/...md 参照が実在することを検証する
# 終了コード: 0=OK / 1=missing / 2=usage error
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
workflows_dir=".github/workflows"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --root) repo_root="$2"; shift 2 ;;
    --workflows) workflows_dir="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

cd "$repo_root"
[ -d "$workflows_dir" ] || { echo "workflows dir not found: $workflows_dir" >&2; exit 2; }

missing=0
checked=0
files=0
report=""

while IFS= read -r yml; do
  files=$((files + 1))
  # docs/...md を全行から抽出（URL は除外）。
  while IFS=: read -r line_no match; do
    # URL 形式 (https?://...docs/...md) は除外
    ref="$(printf '%s' "$match" | grep -oE 'docs/[A-Za-z0-9_./\-]+\.md' | head -n1 || true)"
    [ -z "$ref" ] && continue
    # 前にスキーム https?:// があれば skip
    if printf '%s' "$match" | grep -qE 'https?://[^ )"]*docs/'; then
      continue
    fi
    # anchor 除去
    path="${ref%%#*}"
    checked=$((checked + 1))
    if [ ! -f "$path" ]; then
      missing=$((missing + 1))
      report="${report}${yml}:${line_no} -> ${path}\n"
    fi
  done < <(grep -nE 'docs/[A-Za-z0-9_./\-]+\.md' "$yml" || true)
done < <(find "$workflows_dir" -maxdepth 1 -type f \( -name '*.yml' -o -name '*.yaml' \))

if [ "$missing" -gt 0 ]; then
  printf "verify-workflow-doc-refs: MISSING\n"
  printf "%b" "$report"
  exit 1
fi
printf "verify-workflow-doc-refs: OK (%d references checked across %d files)\n" "$checked" "$files"
exit 0
```

実行可能化: `chmod +x scripts/ci/verify-workflow-doc-refs.sh`

## タスク 3: CI workflow 追加

**ファイル**: `.github/workflows/verify-workflow-doc-refs.yml`

Phase 2 (C) の YAML をそのまま配置。`required status check` 化はユーザー承認後に branch protection 側で別途設定。

## タスク 4: secret 投入（user operation・AI は実行禁止）

user は以下を順に実施する:

```bash
# 1. provisioning script を実行（1Password CLI と gh CLI へログイン済みの状態で）
bash scripts/smoke/provision-staging-secrets.sh

# 2. 確認
gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets \
  --jq '.secrets[].name' | sort
# 期待: 5 行
#   SLACK_WEBHOOK_INCIDENT
#   STAGING_ADMIN_BEARER
#   STAGING_API_BASE
#   STAGING_ME_BEARER
#   STAGING_MEMBER_ID

# 3. 再実行
gh workflow run runtime-smoke-staging.yml --ref dev
gh run watch
```

## 検証コマンド（AI 実行可）

```bash
# guard の動作確認
bash scripts/ci/verify-workflow-doc-refs.sh

# guard テストスイート
bash scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh

# YAML 構文チェック
mise exec -- pnpm exec actionlint .github/workflows/verify-workflow-doc-refs.yml \
                                  .github/workflows/runtime-smoke-staging.yml || true
```

## 実装上の注意

- secret 実値は **AI に渡さない / commit / PR / chat いずれにも貼らない**
- runbook を将来 `docs/30-workflows/runbooks/` 配下へ昇格させる場合は、本 guard が即座に stale を検出するため、同一 PR 内で `runtime-smoke-staging.yml` の参照パスも更新する
- guard 実装時に `set -e` 下で `grep` が 0 件 → exit 1 で本体停止しないよう `|| true` で必ず吸収する
