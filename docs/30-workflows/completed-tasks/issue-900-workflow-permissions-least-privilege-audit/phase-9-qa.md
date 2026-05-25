# Phase 9: QA

## 9.1 自動 QA

```bash
# 1. 静的検証スクリプト
bash scripts/verify-workflow-top-level-permissions.sh

# 2. actionlint（local 導入済みの場合）
./actionlint -color .github/workflows/*.yml

# 3. required context 名不変
git diff dev -- .github/workflows/ | \
  grep -E "^[+-]\s*[a-z_-]+:\s*$" | \
  grep -vE "permissions:|contents:|id-token:|packages:|deployments:|pull-requests:|actions:|issues:|checks:|statuses:|security-events:|attestations:|models:|pages:|discussions:|repository-projects:" \
  || echo "no job-key/name diff"

# 4. 既存 job-level 宣言の保持
git diff dev -- .github/workflows/backend-ci.yml \
                 .github/workflows/playwright-visual-baseline-update.yml \
                 .github/workflows/web-cd.yml \
                 .github/workflows/d1-migration-verify.yml \
                 .github/workflows/playwright-visual-full.yml \
  | grep "^-" | grep -v "^---" || echo "no deletion in group B"
```

期待: 4 つすべて PASS。

## 9.2 手動レビュー観点

| 観点 | 確認方法 |
|------|---------|
| 挿入位置（`on:` 直後・`jobs:` 直前） | `git diff` で目視 |
| インデント 2 スペース | 同上 |
| 既存 job-level 宣言の保持 | 同上 |
| `incident-runbook-slack-delivery.yml` を誤って変更していない | `git diff --name-only dev` に含まれない |

## 9.3 既存 top-level permissions 保有 workflow の過剰判定

スコープ外ではあるが軽くチェック（コード変更しない）:

- `ci.yml:15-16` = `contents: read` → 過剰なし
- `runtime-smoke-staging.yml:15-16` = `contents: read` → 過剰なし
- その他既存 HAS 列挙物（`audit-correlation-verify.yml` 等）も `contents: read` 系で過剰なし想定

過剰判定結果は本 phase の本ファイルに記録するのみとし、別タスクへの follow-up が必要な場合は Phase 12 unassigned-task-detection.md で起票する。
