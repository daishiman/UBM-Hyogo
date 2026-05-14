# Phase 2: 設計

## アーキテクチャ概要

```
┌───────────────────────────────────────────────────────────────┐
│ .github/branch-protection/                                    │
│   ├── dev.json     ← desired contexts + strict manifest       │
│   ├── main.json    ← desired contexts + strict manifest       │
│   └── apply.sh     ← fresh GET から contexts + invariants PUT │
│                                                               │
│ docs/30-workflows/e2e-quality-uplift-stage-3/outputs/         │
│   └── phase-11/                                               │
│       ├── branch-protection-dev-pre.json   (read-only)        │
│       ├── branch-protection-dev-post.json  (read-only)        │
│       ├── branch-protection-main-pre.json                     │
│       ├── branch-protection-main-post.json                    │
│       └── runtime-evidence/                                   │
│           ├── required-contexts-dev.txt                       │
│           └── required-contexts-main.txt                      │
│                                                               │
│ .github/workflows/lighthouse.yml  ← 起動 step を wait-on 化   │
└───────────────────────────────────────────────────────────────┘
```

## 主要設計判断

### D-1: branch protection の正本境界

GitHub branch protection は外部設定であるため、**GitHub fresh GET の実値を operational source of truth** とする。`.github/branch-protection/{dev,main}.json` は `required_status_checks.contexts` と `required_status_checks.strict` の desired-state manifest であり、full PUT body の正本ではない。理由:

1. 再現性: contexts drift 発生時に desired contexts を再適用できる
2. 監査性: 変更履歴が git log に残る
3. fresh GET から optional fields を保持しつつ、CLAUDE.md invariants（`required_pull_request_reviews=null`, `enforce_admins=true`, `required_linear_history=true`, `lock_branch=false`）だけを明示正規化できる

### D-2: status check context 名の最終形

| 場面 | dev | main |
|------|-----|------|
| 既存（保持） | `ci`, `Validate Build`, `coverage-gate` | 同左 |
| 新規追加 | `e2e-tests-coverage-gate`, `lighthouse-ci` | 同左 |

`e2e-tests-coverage-gate` は `e2e-tests.yml` の集約 job であり、matrix 3 project の成功と coverage gate を 1 つの required context にまとめる。`e2e (<project>)` 3 件を個別 required 化すると保証は重複し、required context 数だけ運用 drift 面が増えるため採用しない。

`lighthouse-ci` は `lighthouse.yml` の `jobs.lighthouse.name: lighthouse-ci` に対応する。workflow は `pull_request.branches: [dev, main]` と `workflow_dispatch` を持ち、dev/main required context の両方で check が生成される。

### D-3: apply.sh の I/F

```bash
.github/branch-protection/apply.sh dev   # dev のみ
.github/branch-protection/apply.sh main  # main のみ
.github/branch-protection/apply.sh all   # 両方
```

実装:
```bash
#!/usr/bin/env bash
set -euo pipefail
TARGET="${1:-}"
REPO="${REPO:-daishiman/UBM-Hyogo}"
ROOT="$(git rev-parse --show-toplevel)"
apply_one() {
  local branch="$1"
  local desired="${ROOT}/.github/branch-protection/${branch}.json"
  local payload
  payload="$(mktemp)"
  gh api "repos/${REPO}/branches/${branch}/protection" |
    jq --slurpfile desired "$desired" '{
      required_status_checks: {
        strict: (.required_status_checks.strict // false),
        contexts: $desired[0].contexts
      },
      enforce_admins: true,
      required_pull_request_reviews: null,
      restrictions: null,
      required_linear_history: true,
      allow_force_pushes: (.allow_force_pushes.enabled // false),
      allow_deletions: (.allow_deletions.enabled // false),
      block_creations: (.block_creations.enabled // false),
      required_conversation_resolution: (.required_conversation_resolution.enabled // true),
      lock_branch: false,
      allow_fork_syncing: (.allow_fork_syncing.enabled // false)
    }' > "$payload"
  gh api -X PUT "repos/${REPO}/branches/${branch}/protection" -H "Accept: application/vnd.github+json" --input "$payload"
  rm -f "$payload"
}
case "$TARGET" in
  dev|main) apply_one "$TARGET" ;;
  all) apply_one dev; apply_one main ;;
  *) echo "usage: apply.sh {dev|main|all}" >&2; exit 1 ;;
esac
```

### D-4: lighthouse.yml の起動 step 安定化

現行:
```yaml
- name: Start server (background)
  run: pnpm --filter @ubm-hyogo/web start &
- name: Wait for server
  run: |
    for i in {1..60}; do
      curl -fsS http://localhost:3000 >/dev/null && exit 0
    ...
```

修正後（nohup + wait-on）:
```yaml
- name: Start server (background)
  run: |
    nohup pnpm --filter @ubm-hyogo/web start \
      > /tmp/web-server.log 2>&1 &
    echo $! > /tmp/web-server.pid
- name: Wait for server (wait-on)
  run: pnpm dlx wait-on -t 120000 http-get://localhost:3000
```

### D-5: pre/post snapshot の取得方針

read-only `gh api GET`。redact 不要（contexts / 設定値のみ、secrets 非含有）。差分は `diff` で目視確認しやすいよう `jq -S` で sort key 出力。

## データ構造（dev.json 例）

```jsonc
{
  "strict": false,
  "contexts": [
    "ci",
    "Validate Build",
    "coverage-gate",
    "lighthouse-ci",
    "e2e-tests-coverage-gate"
  ]
}
```

`main.json` も同じ desired contexts / strict 値を持つ。CLAUDE.md invariants は `apply.sh` が PUT payload で明示正規化し、その他 optional fields は fresh GET から保持する。

## エラーハンドリング

| 失敗ケース | 対応 |
|----------|------|
| `gh api -X PUT` が 422 (invalid context) | context 名が job name と一致しているか確認、`gh run list --workflow=e2e-tests.yml` で実 job 名を確認 |
| post snapshot が pre と diff なし | apply 失敗 → log 確認 |
| lighthouse workflow が `lighthouse-ci` job name で発火しない | `name: lighthouse-ci` と job key が一致しているか確認 |

## セキュリティ

- `gh` の認証は既存の `GITHUB_TOKEN` / `gh auth status` に依存。仕様書・スクリプトに token を埋め込まない
- snapshot JSON は `url` フィールドが含まれるが、これは public repo の公開 URL であり機密ではない（念のため `*_url` を redact してもよい）
