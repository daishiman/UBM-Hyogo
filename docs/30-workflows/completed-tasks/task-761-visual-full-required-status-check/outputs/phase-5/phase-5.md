[実装区分: 実装仕様書]

# Phase 5 — 実装

| 項目 | 値 |
|------|------|
| phase | 5 |
| 名称 | 実装（branch protection mutation） |
| status | completed |
| 完了条件 | dev / main 双方の `required_status_checks.contexts` に 3 件追加、before/after evidence 揃い |

## ⚠️ 重要警告

**USER 明示承認なしに `gh api -X PUT` を絶対に実行しないこと。**
承認は `outputs/phase-11/evidence/user-approval-marker.md` に記載された日時 + 文言で確認する。
未承認のまま PUT を実行した場合、branch protection が想定外状態になり全 PR が merge 不能化するリスクがある。

## 1. 実行順序

| # | 操作 | コマンド | evidence |
|---|------|----------|----------|
| 1 | dev before GET | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection > /tmp/dev-before.json` | `evidence/dev-protection-before.json.md` |
| 2 | main before GET | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection > /tmp/main-before.json` | `evidence/main-protection-before.json.md` |
| 3 | user 承認 marker 確認 | `test -f outputs/phase-13/user-approval-task-761-visual-full-required-status-check-<timestamp>.md` | Phase 13 approval marker |
| 4 | contexts payload 生成 | Phase 2 §4 の JSON テンプレ | `/tmp/visual-full-contexts.json` |
| 5 | **dev contexts POST 実行** | `gh api -X POST repos/daishiman/UBM-Hyogo/branches/dev/protection/required_status_checks/contexts --input /tmp/visual-full-contexts.json` | — |
| 6 | dev after GET | `gh api .../branches/dev/protection > /tmp/dev-after.json` | `evidence/dev-protection-after.json.md` |
| 7 | dev diff 確認 | `diff <(jq -S . /tmp/dev-before.json) <(jq -S . /tmp/dev-after.json)` | diff は contexts 3 件追加のみであること |
| 8 | main contexts payload | 同 JSON | `/tmp/visual-full-contexts.json` |
| 9 | **main contexts POST 実行** | `gh api -X POST repos/daishiman/UBM-Hyogo/branches/main/protection/required_status_checks/contexts --input /tmp/visual-full-contexts.json` | — |
| 10 | main after GET | `gh api .../branches/main/protection > /tmp/main-after.json` | `evidence/main-protection-after.json.md` |
| 11 | main diff 確認 | 同 diff | contexts 3 件追加のみ |

## 2. 完全コマンド集

```bash
set -euo pipefail
REPO=daishiman/UBM-Hyogo
EVID=docs/30-workflows/task-761-visual-full-required-status-check/outputs/phase-11/evidence

CTX_DESKTOP="visual-full (desktop)"   # Phase 1 で実測した値で上書き
CTX_TABLET="visual-full (tablet)"
CTX_MOBILE="visual-full (mobile)"

cat > /tmp/visual-full-contexts.json <<JSON
{"contexts":["$CTX_DESKTOP","$CTX_TABLET","$CTX_MOBILE"]}
JSON

# 1-2. before GET
gh api repos/$REPO/branches/dev/protection  > /tmp/dev-before.json
gh api repos/$REPO/branches/main/protection > /tmp/main-before.json

# 3. user approval 確認（手動）
ls docs/30-workflows/task-761-visual-full-required-status-check/outputs/phase-13/user-approval-task-761-visual-full-required-status-check-*.md >/dev/null 2>&1 || {
  echo "STOP: no Phase 13 user approval marker"
  exit 1
}

# 4-7. dev
gh api -X POST repos/$REPO/branches/dev/protection/required_status_checks/contexts --input /tmp/visual-full-contexts.json
gh api repos/$REPO/branches/dev/protection > /tmp/dev-after.json
./scripts/verify-branch-protection.sh dev

# 8-11. main
gh api -X POST repos/$REPO/branches/main/protection/required_status_checks/contexts --input /tmp/visual-full-contexts.json
gh api repos/$REPO/branches/main/protection > /tmp/main-after.json
./scripts/verify-branch-protection.sh main
```

## 3. 失敗時 rollback

```bash
gh api -X DELETE repos/$REPO/branches/dev/protection/required_status_checks/contexts --input /tmp/visual-full-contexts.json
gh api -X DELETE repos/$REPO/branches/main/protection/required_status_checks/contexts --input /tmp/visual-full-contexts.json
```

## 4. DoD

- [ ] dev `required_status_checks.contexts` に 3 件追加（diff 上 3 行のみ）
- [ ] main 同上
- [ ] before / after JSON 4 件が evidence/ に保存
- [ ] 既存 5 contexts 残存
- [ ] `required_pull_request_reviews=null` / `enforce_admins=true` 等不変条件保持
