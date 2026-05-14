# Phase 5: テスト実装

## 追加するテストファイル

本タスクは bash/jq を用いた smoke 検証のみ。新規テストファイルは作成せず、検証手順は `phase-4.md` のコマンドを実行する方式とする。

ただし以下の **再現可能な検証スクリプト**を 1 本作成する:

### scripts/verify-branch-protection.sh

```bash
#!/usr/bin/env bash
# Branch protection drift 検査スクリプト
# 使用: bash scripts/verify-branch-protection.sh
# 終了コード: 0 = drift なし, 1 = drift あり

set -euo pipefail
REPO="daishiman/UBM-Hyogo"
ROOT="$(git rev-parse --show-toplevel)"
EXIT=0

check_branch() {
  local branch="$1"
  local expected="${ROOT}/.github/branch-protection/${branch}.json"
  [[ -f "$expected" ]] || { echo "ERR: missing $expected" >&2; return 1; }

  local actual
  actual=$(gh api "repos/${REPO}/branches/${branch}/protection")

  # contexts 比較
  local exp_ctx act_ctx
  exp_ctx=$(jq -S '.required_status_checks.contexts | sort' "$expected")
  act_ctx=$(echo "$actual" | jq -S '.required_status_checks.contexts | sort')
  if [[ "$exp_ctx" != "$act_ctx" ]]; then
    echo "DRIFT(${branch}): required_status_checks.contexts mismatch"
    diff <(echo "$exp_ctx") <(echo "$act_ctx") || true
    return 1
  fi

  # CLAUDE.md 不変条件
  local reviews enforce lock linear
  reviews=$(echo "$actual" | jq '.required_pull_request_reviews')
  enforce=$(echo "$actual" | jq -r '.enforce_admins.enabled')
  lock=$(echo "$actual" | jq -r '.lock_branch.enabled')
  linear=$(echo "$actual" | jq -r '.required_linear_history.enabled')

  [[ "$reviews" == "null" ]] || { echo "DRIFT(${branch}): required_pull_request_reviews=$reviews (expected null)"; return 1; }
  [[ "$enforce" == "true" ]] || { echo "DRIFT(${branch}): enforce_admins=$enforce (expected true)"; return 1; }
  [[ "$lock" == "false" ]] || { echo "DRIFT(${branch}): lock_branch=$lock (expected false)"; return 1; }
  [[ "$linear" == "true" ]] || { echo "DRIFT(${branch}): required_linear_history=$linear (expected true)"; return 1; }

  echo "OK(${branch}): no drift"
}

check_branch dev || EXIT=1
check_branch main || EXIT=1
exit $EXIT
```

### 配置

- `scripts/verify-branch-protection.sh`（新規・実装フェーズで作成）
- chmod +x 必須

### 起動方法

```bash
bash scripts/verify-branch-protection.sh
```

## 既存テストへの影響

- E2E spec ファイル: 変更なし（Stage 1/2 の成果物をそのまま使用）
- coverage gate: 変更なし
- lighthouse: workflow yaml の起動 step のみ変更（テスト spec 自体は変更なし）

## テスト fixture

不要。

## モック / スタブ

不要（実 `gh api` を叩く）。

## 失敗時の修復フロー

1. `verify-branch-protection.sh` が DRIFT を報告
2. 原因（GitHub UI からの手動変更 / `enforce_admins=false` への戻り / context 名変更）を特定
3. `bash .github/branch-protection/apply.sh <branch>` で再適用
4. `verify-branch-protection.sh` を再実行し OK 確認
