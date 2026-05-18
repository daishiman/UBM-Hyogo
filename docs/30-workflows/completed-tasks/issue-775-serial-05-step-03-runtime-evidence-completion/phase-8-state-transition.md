# Phase 8: 状態遷移

[実装区分: 実装仕様書]

## 1. 状態語彙テーブル

### 親 workflow (`completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/main.md`)

| Key | Before | After |
|-----|--------|-------|
| `workflow_state` | `implemented-local-runtime-pending` | `completed` |
| `implementation_status` | `IMPLEMENTED_LOCAL_RUNTIME_PENDING` | `IMPLEMENTED_COMPLETED` |
| `evidence_state` | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` | `PASS` |
| `phase_status (11)` | `runtime_pending` | `completed` |
| `phase_status (13)` | `pending_user_approval` | `pending_user_approval` (本タスクで変更なし) |
| `runtime_evidence` | `local 5 点 evidence captured。runtime screenshots は Cloudflare Workers + auth + D1 前提のため pending` | `local 5 点 + runtime 11 screenshots captured (Refs #775)` |
| `governance_mutation_user_gate` | `false` | `false` |

### 本 workflow (`issue-775-.../artifacts.json`)

| Key | Before | After |
|-----|--------|-------|
| `status` | `spec_created` | `implemented_local_evidence_captured` |
| `metadata.workflow_state` | `spec_created` | `implemented_local_evidence_captured` |
| `metadata.implementation_status` | `spec_created_pending_execution` | `runtime_evidence_completed` |
| `gates[0].status` (Gate-A) | `pending` | `passed` |
| `gates[1].status` (Gate-B) | `pending` | `passed` |
| `gates[2].status` (Gate-C) | `pending` | `pending_user_approval`（本サイクルでは commit / push / PR 未実行） |

### unassigned-task pointer

`docs/30-workflows/completed-tasks/serial-05-step-03-followup-001-runtime-evidence-completion.md` 末尾に追記:

```markdown
---
status: consumed
consumed_at: <YYYY-MM-DD>
canonical_workflow: docs/30-workflows/completed-tasks/issue-775-serial-05-step-03-runtime-evidence-completion/
recovery_note: |
  Issue #775 was closed before a canonical workflow root existed.
  This unassigned-task file is preserved for backward link integrity.
  All Phase 1-13 work has been migrated to the canonical workflow root above.
  Issue #775 reference mode: refs_only (no Closes #775).
---
```

### unassigned-task-detection (親 workflow)

`completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md`:

- 本 followup の該当行を `status: detected` → `status: consumed`
- `canonical_workflow` 列に `docs/30-workflows/completed-tasks/issue-775-serial-05-step-03-runtime-evidence-completion/`
- `consumed_at: <YYYY-MM-DD>`

## 2. 遷移手順（順序厳守）

1. Phase 7 evidence 全 PASS を確認
2. 親 workflow `manifest.json` を §1 後値で更新
3. 親 workflow `outputs/phase-12/main.md` を §1 後値で更新
4. 親 workflow `outputs/phase-12/unassigned-task-detection.md` を更新
5. unassigned-task ファイル末尾に YAML frontmatter 追記
6. 本 workflow `artifacts.json` の status / gates を更新
7. `mise exec -- pnpm indexes:rebuild` を実行（必要に応じて）
8. `bash scripts/verify-pr-ready.sh` で pre-flight 通過確認

## 3. Idempotency

すべての更新は最終形へ収束する idempotent 更新（同じ値で 2 回実行しても結果同一）。途中失敗時は §1 Before 値に戻して再実行。

## 4. ロールバック条件

Phase 9 の rollback トリガと連動。具体的には:
- evidence 取得後に PR が reject された場合 → 本 Phase の状態更新は維持（evidence は valid なまま）
- evidence 自体が無効と判明した場合 → §1 Before 値に全戻し
