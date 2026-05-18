# Phase 11 — 手動テスト / Evidence (task-01)

## NON_VISUAL 宣言

**本タスクは NON_VISUAL (GitHub Actions infra 修正) であり、UI 影響を伴わない。**
よってスクリーンショットは取得しない。Phase 11 evidence は GitHub Actions の CI run ログ (`gh run view --log` 出力 + run URL) を正本とする。

## Evidence 取得手順

### Step 1: branch push 後の CI run id 取得

```bash
gh run list --workflow=ci.yml --branch=<feature-branch> --limit=1 --json databaseId,conclusion,headSha
```

### Step 2: workflow-shell-lint job の結果取得

```bash
gh run view <run-id> --json jobs -q '.jobs[] | select(.name=="workflow-shell-lint") | {name, conclusion, url}'
```

期待:
```json
{"name":"workflow-shell-lint","conclusion":"success","url":"https://github.com/daishiman/UBM-Hyogo/actions/runs/<run-id>/job/<job-id>"}
```

### Step 3: annotation 検証

```bash
gh run view <run-id> --log 2>&1 | grep -c "Path Validation Error"
```

期待: `0`

### Step 4: 全 job サマリ

```bash
gh run view <run-id> --json jobs -q '.jobs[] | {name, conclusion}'
```

期待: 全 conclusion が `success` (`workflow-shell-lint` 含む全 job が green)

## Evidence 表 (実装後に埋める)

| 項目 | 値 |
| ---- | -- |
| feature branch | (実装後記入) |
| CI run URL | (実装後記入) |
| run conclusion | (実装後記入) |
| workflow-shell-lint conclusion | (実装後記入) |
| `Path Validation Error` 出現回数 | (実装後記入: 期待 0) |
| 他 caller workflow (pr-build-test/e2e-tests 等) の latest conclusion | (実装後記入) |

## Evidence 保存

`outputs/phase-11/` (workflow root 配下) に以下を保存:

- `task-01-ci-run.json`: `gh run view <id> --json jobs,conclusion,url` の出力
- `task-01-ci-log-excerpt.txt`: `gh run view <id> --log` の workflow-shell-lint 部分抜粋 (annotation 検証用)

## DoD 検証マトリクス

| AC | Evidence | 判定 |
| -- | -------- | ---- |
| AC-1 | Step 2 (`conclusion=success`) | (実装後) |
| AC-2 | Step 3 (count=0) | (実装後) |
| AC-3 | Step 4 (全 success) | (実装後) |
| AC-4 | local actionlint exit 0 ログ | (実装後) |
