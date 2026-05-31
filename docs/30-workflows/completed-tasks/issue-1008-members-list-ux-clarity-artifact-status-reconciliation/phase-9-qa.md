# Phase 9: QA

> docs-only タスクのため QA は read-only 検証コマンド一式の実行。`apps/` `packages/` 差分ゼロを最終確認する。

## 9.1 QA コマンド一式

```bash
# 作業ディレクトリ = worktree ルート
WF=docs/30-workflows/completed-tasks/members-list-ux-clarity

# Q1: root status 3 フィールド（VC-1）
jq -r '.status, .metadata.workflow_state, .metadata.implementation_status' "$WF/artifacts.json"

# Q2: root Phase 1-12 = completed / Phase 13 = pending（VC-2 / VC-3）
jq -c '[.phases[] | select(.phase<=12) | .status] | unique' "$WF/artifacts.json"
jq -r '.phases[] | select(.phase==13) | .status' "$WF/artifacts.json"

# Q3: root Gate-A/B passed + ISO8601 + Gate-C pending（VC-5 / VC-6）
jq -r '.metadata.gates[] | "\(.gate_id) \(.status) \(.passed_at)"' "$WF/artifacts.json"

# Q4: Gate passed evidence_path 実在（VC-7 / VC-R3）
test -f "$WF/phase-3-design-review.md"            && echo "Gate-A evidence OK"
test -f "$WF/outputs/phase-11/runtime-notes.md"   && echo "Gate-B evidence OK"

# Q5: root ↔ outputs parity（VC-4 / VC-R1）
diff -u "$WF/artifacts.json" "$WF/outputs/artifacts.json" && echo "PARITY OK"

# Q6: sub-task A/B/C status 整合（VC-8 / VC-R4）
for f in "$WF"/tasks/*/artifacts.json; do
  echo "== $f =="
  jq -r '.status, .metadata.workflow_state, .metadata.implementation_status' "$f"
  jq -c '[.phases[] | select(.phase<=12) | .status] | unique' "$f"
  jq -r '.phases[] | select(.phase==13) | .status' "$f"
done

# Q7: phase status enum に spec_created が残らない（VC-R5）
for f in "$WF"/artifacts.json "$WF"/outputs/artifacts.json "$WF"/tasks/*/artifacts.json; do
  jq -r '.phases[].status' "$f"
done | sort -u

# Q8: Task B phase-10 AC checkbox（VC-9）
grep -c '☑ PASS' "$WF/tasks/task-b-member-filters-live-affordance/phase-10-final-review.md"
grep -c '☐ PASS' "$WF/tasks/task-b-member-filters-live-affordance/phase-10-final-review.md"

# Q9: gate-metadata:validate（VC-10）
mise exec -- pnpm gate-metadata:validate

# Q10: register 整合（VC-11）
rg 'members-list-ux-clarity' \
  .claude/skills/aiworkflow-requirements/references/task-workflow-active.md \
  .claude/skills/aiworkflow-requirements/references/workflow-members-list-ux-clarity-artifact-inventory.md

# Q11: apps/ packages/ 差分ゼロ（不変条件）
git status --porcelain apps/ packages/
```

## 9.2 期待結果

| Q | 期待結果 |
|---|----------|
| Q1 | 3 行とも `implemented_local_runtime_pending` |
| Q2 | `["completed"]` / `pending` |
| Q3 | `Gate-A passed <ISO8601>` / `Gate-B passed <ISO8601>` / `Gate-C pending null` |
| Q4 | `Gate-A evidence OK` / `Gate-B evidence OK`（両方実在）|
| Q5 | 差分なし + `PARITY OK` |
| Q6 | 3 sub-task とも status 3 行 = `implemented_local_runtime_pending` / `["completed"]` / `pending` |
| Q7 | 出力が `completed` と `pending` の 2 値のみ（`spec_created` なし）|
| Q8 | `☑ PASS` = 10、`☐ PASS` = 0 |
| Q9 | members-list-ux-clarity 配下 ERROR 0 |
| Q10 | register / inventory の status 記述が `implemented_local_runtime_pending` で artifacts と一致 |
| Q11 | **出力が空**（`apps/` `packages/` に差分ゼロ）|

## 9.3 観察ポイント

- Q4 で Gate-B evidence が `runtime-notes.md` を指していること（補正前の不在 path `manual-test-result.md` でないこと）。
- Q9 で本タスクが触っていない他 workflow の既存 ERROR が増減していないこと（members-list-ux-clarity 配下のみ改善）。
- Q11 が空であることが本タスクの最重要 invariant。空でなければ補正が `apps/` `packages/` に漏れているため即 `git restore` する。

## 9.4 indexes drift 確認（条件付き）

status 値変更は keyword index に影響しない見込みだが、念のため drift を確認する。

```bash
mise exec -- pnpm indexes:rebuild
git status --porcelain .claude/skills/aiworkflow-requirements/indexes
```

- 期待: index 出力が空（drift なし）。drift が出た場合のみ regenerated index を含めてコミット（commit は user-gated / Phase 13）。

## 9.5 user-gated 作業（本 QA では実行しない）

- commit / push / PR 作成（Phase 13）
- staging visual baseline 撮影（Gate-C / `/members` route）
- issue #1008 の状態変更（CLOSED のまま維持）
