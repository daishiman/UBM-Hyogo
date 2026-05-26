# System Spec Update Summary — issue-917 alert relay runtime fire evidence

[実装区分: 実装 + ドキュメント]

## Step 1-A: Completion Record

本サイクル内で aiworkflow-requirements current ledgers へ以下を追記済み:

- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260525-issue-917-alert-relay-runtime-fire-evidence.md`（新規）
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-917-alert-relay-runtime-fire-evidence-artifact-inventory.md`（新規）
- `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-917-alert-relay-runtime-fire-evidence-2026-05.md`（新規）
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`

## Step 1-B: Implementation Status

Status: `implemented_local_evidence_captured` / `implementation` / `NON_VISUAL` / `runtime_observation`.

Gate-A/B/C は passed（local observability evidence captured 時点）。Gate-D（runtime + commit/push/PR）は pending（user-gated）。

## Step 1-C: Related Tasks

- 元 unassigned-task `docs/30-workflows/unassigned-task/UT-25-DERIV-02-FU-02-alert-relay-runtime-fire-evidence.md` は **本サイクルで consumed 化しない**。実 runtime evidence 取得が完了した後続サイクルで consumed 化する。
- 上流 `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/` は本サイクルで配線・token 契約を変更せず、`outputs/phase-12/implementation-guide.md` の「actual alert receipt」行を runtime evidence 取得後に更新する（step-08）。
- 親 `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/` は close-out チェックに本 evidence MD への逆参照を runtime サイクルで追加する（step-09）。
- 受信側 smoke `docs/30-workflows/unassigned-task/ut-17-followup-001-alert-relay-runtime-smoke-evidence.md` は別経路（受信 endpoint smoke）として保持。本サイクル（送信トリガー経路）と重複しないよう evidence MD は別ファイル `alert-relay-fire-staging.md` で保管。

## Step 2: Conditional System Spec Update

N/A. No new API endpoint, D1 schema, public response type, or TypeScript interface added. No env field added. No wrangler.toml var added (issue-857 で済み)。本サイクルの code change は scheduled job の structured log 追加のみで、`docs/00-getting-started-manual/specs/` 配下の system spec への影響なし。
