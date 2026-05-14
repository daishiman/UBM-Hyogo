# Phase 9: 受け入れ検証

## Issue #608 受け入れ条件チェック

| # | 条件 | 検証方法 | 期待 |
|---|------|---------|------|
| 1 | CI 上で E2E + Lighthouse が PR ブロッキング gate として動作 | dev/main 向け実 PR で `gh pr checks <PR>` に新規 contexts が "Required" 表示 | runtime_pending（PR 作成後に取得） |
| 2 | coverage 80% 未達時 / critical route smoke 失敗時に CI fail | `scripts/coverage-gate-e2e.sh` を意図的に閾値未達状態で走らせ exit 1 を確認 | ✅ |
| 3 | dev / main の `required_status_checks.contexts` に新規 context が登録され、`gh api` で確認可能 | `gh api .../branches/{dev,main}/protection` 出力に `e2e-tests-coverage-gate` / `lighthouse-ci` | ✅ |

## index.md 受け入れ条件チェック

| # | 条件 | 検証 |
|---|------|------|
| A | `.github/workflows/e2e-tests.yml` 存在 | 既存（変更なし） |
| B | `.github/workflows/lighthouse.yml` 存在 + wait-on 化 | Phase 6 Step 5 で実施 |
| C | `lighthouserc.json` 存在 | 既存（変更なし） |
| D | `scripts/coverage-gate-e2e.sh` 存在 | 既存（変更なし） |
| E | branch protection snapshot 取得 | Phase 6 Step 1/7 で `outputs/phase-11/` に保存 |
| F | `required_status_checks.contexts` 更新 | Phase 6 Step 6 で apply |
| G | PR CI runtime evidence 取得 + workflow_state=completed | PR 作成後に `gh pr checks` / Lighthouse run evidence を保存。取得前は `implemented_local_runtime_pending` 維持 |

## CLAUDE.md 不変条件 drift チェック

| 項目 | 期待 | 検証 |
|------|------|------|
| `required_pull_request_reviews` | `null` | `verify-branch-protection.sh` |
| `enforce_admins.enabled` | `true` | 同上 |
| `lock_branch.enabled` | `false` | 同上 |
| `required_linear_history.enabled` | `true` | 同上 |

## 失敗時のロールバック

1. `outputs/phase-11/branch-protection-{dev,main}-pre.json` を参照
2. pre snapshot の contexts 配列を抽出
3. `gh api -X PUT repos/.../branches/{branch}/protection --input <pre-derived>` で復旧
4. ただし `enforce_admins=false` への戻りは CLAUDE.md 不変条件違反になるため、本 stage で `true` に正規化した値は維持する

## 完了条件（最終）

- [ ] Issue #608 の 3 受け入れ条件すべて ✅（#1 は PR CI evidence 取得後）
- [ ] index.md 受け入れ条件 A-G すべて ✅
- [ ] CLAUDE.md 不変条件 4 項目すべて drift なし
- [ ] PR CI / Lighthouse runtime evidence 取得後にのみ `index.md` の workflow_state を `completed` に更新
