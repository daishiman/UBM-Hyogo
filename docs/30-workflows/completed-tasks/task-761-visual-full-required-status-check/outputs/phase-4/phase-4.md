[実装区分: 実装仕様書]

# Phase 4 — テスト設計

| 項目 | 値 |
|------|------|
| phase | 4 |
| 名称 | テスト設計 |
| status | completed |
| 完了条件 | read-only GET dry-run / check run name 実測 / pull_request trigger 自然発火 evidence 取得コマンド確定 |

## 1. テスト方針

本タスクは governance 変更に加えて、required check pending を避けるため `.github/workflows/playwright-visual-full.yml` の `pull_request.paths` を削除する。ユニット/結合テストは存在しないため、以下の static / read-only evidence を Phase 5 実行前に成立させる。

| # | テスト | 期待 |
|---|------|------|
| T-1 | dev branch protection GET | 200 / contexts 5 件取得 |
| T-2 | main branch protection GET | 200 / contexts 5 件取得 |
| T-3 | playwright-visual-full の latest run jobs[].name 取得 | 3 件の matrix job 名取得 |
| T-4 | pull_request trigger 全PR発火 gate | `.github/workflows/playwright-visual-full.yml` に `pull_request.paths` が存在しない |
| T-5 | pull_request trigger 自然発火 evidence | `gh run list` で event=pull_request の run が 1 件以上存在 |

## 2. T-1 / T-2 dry-run コマンド

```bash
# dev
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --jq '{contexts: .required_status_checks.contexts, strict: .required_status_checks.strict, enforce_admins: .enforce_admins.enabled}'

# main
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  --jq '{contexts: .required_status_checks.contexts, strict: .required_status_checks.strict, enforce_admins: .enforce_admins.enabled}'
```

期待結果（参考値）:

```json
{
  "contexts": ["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate"],
  "strict": true,
  "enforce_admins": true
}
```

## 3. T-3 check run name 実測

```bash
RUN_ID=$(gh api repos/daishiman/UBM-Hyogo/actions/workflows/playwright-visual-full.yml/runs \
  --jq '.workflow_runs[0].id')
echo "RUN_ID=$RUN_ID"

gh api repos/daishiman/UBM-Hyogo/actions/runs/$RUN_ID/jobs \
  --jq '.jobs[].name'
```

期待結果:

```
visual-full (desktop)
visual-full (tablet)
visual-full (mobile)
```

→ 不一致なら Phase 2 §2 / Phase 5 §3 の context 名を実測値で上書き。

## 4. T-4 pull_request trigger 全PR発火 gate

```bash
python3 - <<'PY'
from pathlib import Path
text = Path(".github/workflows/playwright-visual-full.yml").read_text()
block = text.split("pull_request:", 1)[1].split("concurrency:", 1)[0]
assert "paths:" not in block, "pull_request.paths must be absent before required-check promotion"
PY
```

## 5. T-5 pull_request trigger 自然発火 evidence

```bash
gh run list --workflow=playwright-visual-full.yml --limit 10 \
  --json databaseId,event,headBranch,status,conclusion,createdAt \
  > /tmp/visual-full-runs.json

# pull_request event の run を抽出
jq '[.[] | select(.event == "pull_request")]' /tmp/visual-full-runs.json
```

期待: PR #760 merge 以降の任意 PR で `event: "pull_request"` が 1 件以上記録されている。0 件なら required 化前に task-761 PR 自身で自然発火 evidence を取得する。

## 5. 失敗時の挙動

| テスト | 失敗時 |
|--------|--------|
| T-1 / T-2 | gh auth 確認、403 なら token scope `repo` 確認、Phase 5 進行不可 |
| T-3 | runs[0] が無い場合は manual `workflow_dispatch` 1 回実行（user 承認下）|
| T-4 | `.github/workflows/playwright-visual-full.yml` から `pull_request.paths` を削除する |
| T-5 | task-761 PR 自身で `pull_request` run を確認する |

## 7. evidence 保存先

- `outputs/phase-11/evidence/dev-protection-before.json.md`
- `outputs/phase-11/evidence/main-protection-before.json.md`
- `outputs/phase-11/evidence/pull-request-trigger-natural-firing.md`
