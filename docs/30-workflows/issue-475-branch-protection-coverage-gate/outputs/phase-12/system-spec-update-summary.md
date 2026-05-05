# System Spec Update Summary — Issue #475

## 更新対象 SSOT

`.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md`

## 更新内容（Phase 5 で実適用）

| 表 / 章 | Before | After |
| --- | --- | --- |
| current applied (main) | `ci, Validate Build` | `ci, Validate Build, coverage-gate` (`last applied: 2026-05-05` / `ref: Issue #475`) |
| current applied (dev)  | `ci, Validate Build` | 同上 |
| invariant 行 | fresh GET の現行値 | Issue #475 起因 drift なし（dev の `required_pull_request_reviews=null` は out-of-scope / solo policy 方向として別記） |

> 2026-05-05: Phase 11 fresh GET 取得後に SSOT v1.4.2 として上記更新を実適用済（contexts: `ci, Validate Build, coverage-gate`）。dev の `required_pull_request_reviews=null` も実値反映（out-of-scope の既存 drift を solo policy 不変条件方向として記録）。Issue #475 invariant 違反 0 件・既存 contexts 維持を `outputs/phase-11/` evidence で確認。

## Step 1-A: 表の SSOT 反映

`gh api` GET の実値を表に直接反映する（jq で contexts を昇順ソートして転記）。

## Step 1-B: 反映後の skill index 再生成

```bash
mise exec -- pnpm indexes:rebuild
git diff --stat .claude/skills/aiworkflow-requirements/indexes/
```

## Step 1-C: CLAUDE.md 整合確認

```bash
grep -n 'coverage-gate\|required_status_checks' CLAUDE.md
```

矛盾があれば本タスク内で CLAUDE.md を併せて更新する（spec 内の "branch protection 実値を正本とする" 記述は維持）。

## Step 1-D: same-wave spec sync（Gate A evidence 取得後）

| 対象 | 状態 |
| --- | --- |
| `references/deployment-branch-strategy.md` | Issue #475 適用後 fresh GET evidence を current applied へ反映 |
| `indexes/resource-map.md` | canonical workflow root 行を適用済み / Gate B pending として同期 |
| `indexes/quick-reference.md` | Governance / Branch Protection 早見に Issue #475 適用済み evidence 行を同期 |
| `references/task-workflow-active.md` | active workflow として `runtime_evidence_captured / Gate B pending` を追記 |
| `docs/30-workflows/issue-475-branch-protection-coverage-gate/outputs/phase-12/phase12-task-spec-compliance-check.md` | `PASS_RUNTIME_VERIFIED_GATE_B_PENDING` に補正 |

## Step 2 (条件付き): 後続 SSOT 派生更新

**判定: 適用済（runtime apply 後 / 2026-05-05）**

実施内容:

- `deployment-branch-strategy.md` v1.4.2 で current applied 表を Issue #475 適用後の fresh GET 実値に更新
- 変更履歴行を追加（v1.4.2）
- 本タスクは GitHub branch protection settings-only implementation のため TypeScript インターフェース / API endpoint / D1 schema / shared package 型の派生更新はなし
- skill indexes は Issue #475 適用済み状態へ手動同期済。Gate B 前の最終検証で `mise exec -- pnpm indexes:rebuild` を再実行し drift 0 を確認する

## 検証

| 確認 | コマンド | 期待 |
| --- | --- | --- |
| 表更新 | `grep -n 'coverage-gate' .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | main / dev 両行で hit |
| index drift | `mise exec -- pnpm indexes:rebuild && git diff --quiet .claude/skills/aiworkflow-requirements/indexes/` | drift なし |
