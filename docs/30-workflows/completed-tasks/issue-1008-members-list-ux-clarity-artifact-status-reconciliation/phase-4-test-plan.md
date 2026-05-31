# Phase 4: テスト計画（検証計画）

> docs-only タスクのため「テスト」= 補正後に満たすべき状態を assert する **read-only 検証コマンド群**。
> コードは追加せず、`jq` / `diff -u` / `gate-metadata:validate` / `rg` / `test -f` の各検証を
> 検証ケース ID（VC-1..VC-10）として定義する。補正前（現状）の期待 fail と補正後の期待 pass を
> RED/GREEN 表で対比する。

## 4.1 検証対象パス（定数）

| 略称 | パス |
|------|------|
| `<root>` | `docs/30-workflows/completed-tasks/members-list-ux-clarity/artifacts.json` |
| `<outputs>` | `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/artifacts.json` |
| `<task-a>` | `docs/30-workflows/completed-tasks/members-list-ux-clarity/tasks/task-a-density-toggle-ux-clarity/artifacts.json` |
| `<task-b>` | `docs/30-workflows/completed-tasks/members-list-ux-clarity/tasks/task-b-member-filters-live-affordance/artifacts.json` |
| `<task-c>` | `docs/30-workflows/completed-tasks/members-list-ux-clarity/tasks/task-c-page-integration-and-visual-baseline/artifacts.json` |
| `<task-b-p10>` | `docs/30-workflows/completed-tasks/members-list-ux-clarity/tasks/task-b-member-filters-live-affordance/phase-10-final-review.md` |
| `<wf-dir>` | `docs/30-workflows/completed-tasks/members-list-ux-clarity` |

> 全コマンドは worktree ルート（`/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260530-141233-wt-11`）を作業ディレクトリとして実行する。

## 4.2 検証ケース一覧

### VC-1: root status 3 フィールド一致（AC-1）

```bash
jq -r '.status, .metadata.workflow_state, .metadata.implementation_status' <root>
```

- 期待出力（補正後）: 3 行とも `implemented_local_runtime_pending`

### VC-2: root Phase 1-12 = completed（AC-2）

```bash
jq -c '[.phases[] | select(.phase <= 12) | .status] | unique' <root>
```

- 期待出力（補正後）: `["completed"]`

### VC-3: root Phase 13 = pending（AC-2 / user-gated 維持）

```bash
jq -r '.phases[] | select(.phase == 13) | .status' <root>
```

- 期待出力（補正後）: `pending`

### VC-4: root ↔ outputs parity（AC-3）

```bash
diff -u <root> <outputs>
```

- 期待出力（補正後）: 差分なし（終了コード 0）

### VC-5: root Gate-A / Gate-B = passed・passed_at が ISO8601（AC-6）

```bash
jq -r '.metadata.gates[] | select(.gate_id=="Gate-A" or .gate_id=="Gate-B") | "\(.gate_id) \(.status) \(.passed_at)"' <root>
```

- 期待出力（補正後）: 2 行とも `status=passed` かつ `passed_at` が ISO8601（例 `2026-05-30T00:00:00Z`）で `null` でない

### VC-6: root Gate-C = pending（AC-6 / staging visual baseline user-gated）

```bash
jq -r '.metadata.gates[] | select(.gate_id=="Gate-C") | .status' <root>
```

- 期待出力（補正後）: `pending`

### VC-7: root Gate-A / Gate-B evidence_path 実在（AC-6）

```bash
test -f "<wf-dir>/phase-3-design-review.md" && echo "Gate-A evidence OK"
test -f "<wf-dir>/outputs/phase-11/runtime-notes.md" && echo "Gate-B evidence OK"
```

- 期待出力（補正後）: 両方 OK。
- **重要**: 現状 Gate-B の `evidence_path` は `outputs/phase-11/manual-test-result.md` を指すが、実ファイルは存在しない（実在は `outputs/phase-11/runtime-notes.md`）。Phase 5 で `passed` 化する際、evidence_path を実在ファイル `outputs/phase-11/runtime-notes.md` に補正する（passed には実在 path が必須のため）。

### VC-8: sub-task A/B/C status 整合（AC-4）

```bash
for f in <task-a> <task-b> <task-c>; do
  echo "== $f =="
  jq -r '.status, .metadata.workflow_state, .metadata.implementation_status' "$f"
  jq -c '[.phases[] | select(.phase <= 12) | .status] | unique' "$f"
  jq -r '.phases[] | select(.phase == 13) | .status' "$f"
done
```

- 期待出力（補正後）: 各 sub-task とも status 3 行 = `implemented_local_runtime_pending` / Phase 1-12 = `["completed"]` / Phase 13 = `pending`

### VC-9: Task B phase-10 AC checkbox 10 件が ☑（AC-5）

```bash
grep -c '☑ PASS' <task-b-p10>
grep -c '☐ PASS' <task-b-p10>
```

- 期待出力（補正後）: `☑ PASS` = 10、`☐ PASS` = 0

### VC-10: gate-metadata:validate ERROR 0（AC-8）

```bash
mise exec -- pnpm gate-metadata:validate
```

- 期待出力（補正後）: members-list-ux-clarity 配下 artifacts に対し ERROR 0

### VC-11: aiworkflow register 整合（AC-7）

```bash
rg 'members-list-ux-clarity' .claude/skills/aiworkflow-requirements/references/task-workflow-active.md .claude/skills/aiworkflow-requirements/references/workflow-members-list-ux-clarity-artifact-inventory.md
```

- 期待出力（補正後）: register / inventory の status 記述が `implemented_local_runtime_pending` で実 `artifacts.json` と一致（register は既に該当値の見込みのため確認のみ。drift があれば Phase 5 で補正）

## 4.3 RED / GREEN 対比表

| VC | 検証内容 | 補正前（RED・現状期待 fail） | 補正後（GREEN・期待 pass） |
|----|----------|------------------------------|-----------------------------|
| VC-1 | root status 3 フィールド | 3 行とも `spec_created` → ❌ | 3 行とも `implemented_local_runtime_pending` → ✅ |
| VC-2 | root Phase 1-12 | `["completed","pending"]`（3 completed / 残 pending）→ ❌ | `["completed"]` → ✅ |
| VC-3 | root Phase 13 | `pending` → ✅（不変） | `pending` → ✅ |
| VC-4 | root↔outputs parity | 両方 `spec_created` で diff は 0 だが値が誤 → ❌（値の整合不成立）| diff 0 かつ補正済み値 → ✅ |
| VC-5 | Gate-A/B passed + ISO8601 | 両 gate `pending` / `passed_at=null` → ❌ | `passed` / ISO8601 → ✅ |
| VC-6 | Gate-C pending | `pending` → ✅（不変）| `pending` → ✅ |
| VC-7 | Gate-A/B evidence 実在 | Gate-B path `manual-test-result.md` 不在 → ❌ | path を `runtime-notes.md` に補正し実在 → ✅ |
| VC-8 | sub-task A/B/C 整合 | A/C 全 `spec_created`、B は 1-10 completed/11-13 pending → ❌ | 3 sub-task とも 1-12 completed/13 pending → ✅ |
| VC-9 | Task B p10 checkbox | `☐ PASS`=10 / `☑ PASS`=0 → ❌ | `☑ PASS`=10 / `☐ PASS`=0 → ✅ |
| VC-10 | gate-metadata:validate | Gate-B evidence 不在 / status 不整合で ERROR → ❌ | ERROR 0 → ✅ |
| VC-11 | register 整合 | register が `implemented_local_runtime_pending`・実 artifacts が `spec_created` で drift → ❌ | 両者一致 → ✅ |

> VC-3 / VC-6 は補正前後で不変（user-gated 境界の維持確認）。それ以外 9 件は補正前 RED → 補正後 GREEN。

## 4.4 検証の前提（不変条件）

- 検証は全て read-only（`jq` / `diff` / `grep` / `rg` / `test -f` / `gate-metadata:validate`）であり、`apps/` `packages/` を一切変更しない。
- evidence ファイル（PNG 27 件 / `focused-component-tests.log` / `runtime-notes.md`）の中身は検証対象だが変更しない。
