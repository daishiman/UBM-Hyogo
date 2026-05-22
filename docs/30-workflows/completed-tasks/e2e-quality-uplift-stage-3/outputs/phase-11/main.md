# Phase 11 Evidence Boundary

Status: `branch_protection_applied_runtime_ci_pending` (2026-05-11)

`gh api -X PUT` を user 承認下で実行し、dev / main 双方の branch protection に新規 contexts (`e2e-tests-coverage-gate`, `lighthouse-ci`) を登録した。CLAUDE.md 不変条件 (INV-SOLO / INV-ENF / INV-LINEAR / INV-LOCK) も同時に正規化された (phase-3.md R-2 の方針を user 判断で「INV 全 drift 同時修正」へ拡張)。PR CI required 表示と Lighthouse workflow run evidence は後続の user-gated PR 実行で取得する。

## Runtime evidence 一覧

| ファイル | 内容 |
|---------|------|
| `branch-protection-dev-pre.json` | 適用前 dev snapshot (contexts: ci/Validate Build/coverage-gate) |
| `branch-protection-main-pre.json` | 適用前 main snapshot (同上 + INV drift あり) |
| `branch-protection-dev-post.json` | 適用後 dev snapshot (contexts に lighthouse-ci/e2e-tests-coverage-gate 追加、enforce_admins/linear=true、strict=false、reviews=null) |
| `branch-protection-main-post.json` | 適用後 main snapshot (同上) |
| `runtime-evidence/required-contexts-dev.txt` | dev contexts evidence (5 entries) |
| `runtime-evidence/required-contexts-main.txt` | main contexts evidence (5 entries) |
| `runtime-evidence/apply-result.txt` | apply.sh stdout |
| `runtime-evidence/apply-summary.txt` | branch 別 apply 要約（raw concat の監査補助） |
| `runtime-evidence/verify-result.txt` | verify-branch-protection.sh stdout (全 PASS) |

## 確認済み不変条件 (apply 後)

| 項目 | dev | main | 期待 |
|------|-----|------|------|
| `required_status_checks.contexts` | 5 (新規 2 追加) | 5 (新規 2 追加) | ✅ |
| `required_status_checks.strict` | false | false | ✅ |
| `required_pull_request_reviews` | null | null | ✅ INV-SOLO |
| `enforce_admins.enabled` | true | true | ✅ INV-ENF |
| `required_linear_history.enabled` | true | true | ✅ INV-LINEAR |
| `lock_branch.enabled` | false | false | ✅ INV-LOCK |
| `allow_force_pushes.enabled` | false | false | ✅ |
| `allow_deletions.enabled` | false | false | ✅ |
| `required_conversation_resolution.enabled` | true | true | ✅ |

## 残推奨タスク (本 PR 範囲外)

- dev/main 向け実 PR で `gh pr checks` 出力に新 contexts が "Required" 表示されることの最終確認 (本 PR 自身でも観測可)
- `lighthouse-ci` を実 PR / `workflow_dispatch` で 1 回成功させ、wait-on step 安定動作を確認

## redaction 確認

evidence 内に `ghp_` / `github_pat_` / `cf_` / `sk-` トークンが含まれていないことを確認済み。
