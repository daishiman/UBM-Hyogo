# Phase 2: 設計（PUT body 構築）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 作成日 | 2026-05-05 |
| 状態 | spec_created |

## 目的

`main` / `dev` 両ブランチに対する `gh api PUT .../protection` の **完全な PUT body** を baseline GET から決定論的に組み立てる方式を確定する。`required_status_checks.contexts` のみ append し、他項目は GET 値をそのまま echo back する。

## 設計方針

| 観点 | 採用方針 |
| --- | --- |
| 全体置換リスク | `gh api PUT` は contexts を全置換するため、GET → jq で append → PUT する3段階を厳守 |
| invariant 維持 | `required_pull_request_reviews` / `lock_branch` / `enforce_admins` などは fresh GET の現行値を保持し、固定値へ補正しない |
| 冪等性 | 既に `coverage-gate` が含まれる場合は PUT を skip。未登録時は配列末尾に順序保持 append |
| 段階適用 | main → dev の順。main 適用後 fresh GET で drift 確認してから dev へ |

## PUT body 組み立てスクリプト（Phase 5 で適用）

```bash
build_put_body() {
  local branch="$1"
  local outfile="$2"
  gh api "repos/daishiman/UBM-Hyogo/branches/${branch}/protection" \
    | jq '{
        required_status_checks: (
          .required_status_checks
          | .contexts = ((.contexts // []) as $c
              | if ($c | index("coverage-gate")) then $c else $c + ["coverage-gate"] end)
        ),
        enforce_admins: .enforce_admins.enabled,
        required_pull_request_reviews: .required_pull_request_reviews,
        restrictions: .restrictions,
        required_linear_history: .required_linear_history.enabled,
        allow_force_pushes: .allow_force_pushes.enabled,
        allow_deletions: .allow_deletions.enabled,
        required_conversation_resolution: .required_conversation_resolution.enabled,
        lock_branch: .lock_branch.enabled,
        allow_fork_syncing: (.allow_fork_syncing.enabled // false)
      }' > "$outfile"
}
```

## preflight normalized diff（Gate A 前に必須）

```bash
for b in main dev; do
  gh api "repos/daishiman/UBM-Hyogo/branches/${b}/protection" \
    > "outputs/phase-5/${b}-protection-before-full.json"
  build_put_body "$b" "outputs/phase-2/${b}-put-body.json"
  jq -S 'del(.required_status_checks.contexts)' "outputs/phase-2/${b}-put-body.json" \
    > "outputs/phase-2/${b}-put-body-without-contexts.json"
  jq -S '{
    required_status_checks,
    enforce_admins: .enforce_admins.enabled,
    required_pull_request_reviews,
    restrictions,
    required_linear_history: .required_linear_history.enabled,
    allow_force_pushes: .allow_force_pushes.enabled,
    allow_deletions: .allow_deletions.enabled,
    required_conversation_resolution: .required_conversation_resolution.enabled,
    lock_branch: .lock_branch.enabled,
    allow_fork_syncing: (.allow_fork_syncing.enabled // false)
  } | del(.required_status_checks.contexts)' "outputs/phase-5/${b}-protection-before-full.json" \
    > "outputs/phase-2/${b}-baseline-without-contexts.json"
  diff -u "outputs/phase-2/${b}-baseline-without-contexts.json" \
          "outputs/phase-2/${b}-put-body-without-contexts.json" \
    > "outputs/phase-2/${b}-preflight-nontarget.diff"
done
```

`*-preflight-nontarget.diff` が空でない場合は Gate A に進まない。

## main / dev 適用 PUT コマンド（Phase 5 採用）

```bash
# main
build_put_body main outputs/phase-2/main-put-body.json
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/main/protection \
  --input outputs/phase-2/main-put-body.json \
  | tee outputs/phase-5/main-put-response.json

# dev（main 安定確認後）
build_put_body dev outputs/phase-2/dev-put-body.json
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --input outputs/phase-2/dev-put-body.json \
  | tee outputs/phase-5/dev-put-response.json
```

## SSOT ドキュメント差分（Phase 5 採用）

対象ファイル: `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md`

差分方針:
- "current applied" 表の `main` / `dev` 行 `required_status_checks.contexts` カラムに `coverage-gate` を追記
- 適用日 (`2026-05-05`) と Issue #475 への参照を併記
- 編集後 `pnpm indexes:rebuild` で skill index を再生成

## PASS / MINOR / MAJOR / NO-GO

| 判定 | 条件 | 戻り先 |
| --- | --- | --- |
| PASS | PUT body が GET 値を保持しつつ `coverage-gate` のみ append | Phase 3 へ |
| MINOR | `allow_fork_syncing` 等のオプショナル key が GET にない | デフォルト値で補完し進行 |
| MAJOR | non-target diff が発生した | Phase 2 body 設計へ差戻し |

## 成果物

- `outputs/phase-2/main-put-body.json`（Phase 5 直前に生成）
- `outputs/phase-2/dev-put-body.json`（同上）
- `outputs/phase-2/design-decision.md`（採用方針記録）
