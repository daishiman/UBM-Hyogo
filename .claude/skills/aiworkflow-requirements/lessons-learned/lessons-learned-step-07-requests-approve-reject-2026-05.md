---
task_root: docs/30-workflows/step-07-requests-approve-reject/
synced_at: 2026-05-22
state: implemented_local_evidence_captured / NON_VISUAL / local_evidence_pass
related_lessons:
  - lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md
related_specs:
  - docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-07-requests-approve-reject/spec.md
  - docs/30-workflows/step-07-requests-approve-reject/phase-12-documentation.md
  - .claude/skills/aiworkflow-requirements/references/workflow-step-07-requests-approve-reject-artifact-inventory.md
follow_ups:
  - commit / push / PR は user-gated（Phase 13 `pending_user_approval` で保持）
  - staging fresh smoke は user-gated runtime evidence として別経路
  - HTML5 `<dialog>` の iOS Safari 17.4+ fallback 判断は別 task で起票
---

# step-07 requests approve/reject の苦戦箇所

> 対象 workflow: `docs/30-workflows/step-07-requests-approve-reject/`
> 同期日: 2026-05-22
> 実装範囲:
> - `apps/web/src/components/admin/RequestQueuePanel.tsx`（hook 統合 / mutation 制御 / refresh）
> - `apps/web/src/components/admin/RequestQueueDetail.tsx`（読み取り専用 detail）
> - `apps/web/src/components/admin/RequestConfirmDialog.tsx`（HTML5 dialog / reject note 検証）
> - `apps/web/src/components/admin/__tests__/*.spec.tsx`（23/23 pass）

---

## L-STEP07-001: spec-only → implemented-local の状態昇格漏れ

### 状況

Phase 1-12 仕様が `spec_created` で先行作成された後、`apps/web` に app code 着地済みなのに
Phase 10/12 のドキュメントが「app code は未着手」前提のまま残置されていた。
artifacts.json / aiworkflow-requirements indexes の `workflow_state` も `spec_created` のままで、
PR/compliance gate からは「仕様だけある workflow」に見えて差分が無視される構造リスクがあった。

### 判断 / 採用解

implementation diff が land した同 wave で次を必ず再走させる:

1. Phase 10 / Phase 12 ドキュメントを「実装済 / local evidence」前提に書き直す
2. artifacts.json の `metadata.workflow_state` を `implemented_local_evidence_captured` に更新
3. aiworkflow-requirements の `resource-map` / `quick-reference` / `task-workflow-active` / artifact inventory を同 wave で同期
4. `legacy-ordinal-family-register` に Phase 12 strict 7 present を記録

### 再発防止

- spec-only として起票した workflow に app code が land した瞬間、Phase 10/12 と
  aiworkflow indexes の状態用語を**同じ commit 単位で**昇格させる（partial 昇格禁止）
- `workflow_state` の取り得る値は `spec_created` / `implemented_local_evidence_captured` /
  `pass_runtime_synced` の 3 段階。staging fresh runtime に到達しない限り
  `pass_runtime_synced` に昇格させない

---

## L-STEP07-002: Phase 12 strict 7 を flat workflow root に物理配置する責務

### 状況

step-07 は `docs/30-workflows/step-07-requests-approve-reject/` 直下に `phase-12-documentation.md`
等を平置きする flat 構造で、`outputs/phase-12/` 配下に strict 7 を置く階層構造とは別。
flat root の存在を理由に strict 7 配置を省略すると Phase 12 compliance gate が落ちる。

### 判断 / 採用解

flat root であっても `outputs/phase-12/` 配下に strict 7 ファイル
（`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` /
`documentation-changelog.md` / `unassigned-task-detection.md` /
`skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`）を必ず物理配置し、
artifacts.json の `phases."12"` に列挙する。flat root の `phase-12-documentation.md` は
summary index として残し、詳細は `outputs/phase-12/` を正本とする。

### 再発防止

- workflow 構造が flat か階層かに関わらず Phase 12 strict 7 は `outputs/phase-12/` 必須
- artifacts.json zod schema (`gate-metadata:validate`) で phases."12" の 7 ファイル登録を強制

---

## L-STEP07-003: 409 already_resolved の UI 競合制御を mutation hook ではなく panel 側で吸収

### 状況

複数管理者が同じ request を同時操作した場合、後発の resolve は API から
409 `already_resolved` + `currentStatus` を受ける。`useAdminMutation` 側で
共通エラーハンドリングに巻き取ると、refresh 経路（`router.refresh()`）と
toast メッセージが他 mutation と混ざり、UX が「単に失敗した」表示になる。

### 判断 / 採用解

409 検知は `RequestQueuePanel.tsx` 側で行い、専用 toast（"already-processed"）と
`router.refresh()` を呼ぶ。`useAdminMutation` は generic な auth / duplicate submit /
network failure のみ責務とし、業務的競合は呼び出し側で扱う。
RequestConfirmDialog は busy 中の submit/cancel を disable して duplicate call を構造防止。

### 再発防止

- 業務固有の HTTP status（409 conflict / 422 invalid state）は呼び出し側 panel で扱う
- generic mutation hook には「auth・duplicate submit・network・5xx」のみ集約
- 競合検知時は必ず `router.refresh()` で server state を再取得（楽観更新は廃止）

---

## L-STEP07-004: NON_VISUAL タスクの evidence 戦略

### 状況

step-07 は admin panel の interactive flow で、Playwright visual smoke ではなく
focused component test (vitest + testing-library) で挙動を担保。
Phase 11 evidence に screenshot が無いことを「証拠不足」と誤判定するリスクがあった。

### 判断 / 採用解

Phase 11 を NON_VISUAL タスクとして明示し、代替 evidence を以下で構成:

- vitest 23/23 pass ログ（3 spec: panel / detail / dialog）
- `primitive-adoption` grep gate PASS（design token drift 0、HEX 禁止）
- typecheck 0 error / lint 0 error

`outputs/phase-11/manual-test.md` に `provenance: vitest_local` を明示し、
staging fresh runtime smoke は別経路（user-gated）として `workflow_state` を昇格させない。

### 再発防止

- VISUAL / NON_VISUAL のタスク種別を Phase 4 test plan 時点で確定
- NON_VISUAL でも `phase-11-screenshot-guide.md` の代替 evidence 列（vitest log / grep gate /
  typecheck / lint）の AC matrix 充足を確認

---

## L-STEP07-005: admin form input の FormField 統一と useAdminMutation 一本化

### 状況

CLAUDE.md 不変条件 9/10 で `apps/web/src/components/admin/` 配下の生 `<input>` 追加禁止、
`@/features/admin/hooks/useAdminMutation` への一本化が定められているが、
legacy `@/lib/useAdminMutation` への新規参照を増やす誘惑があった
（既存 panel が legacy を import している場合の inertia）。

### 判断 / 採用解

`RequestConfirmDialog` の reject 理由 textarea は `FormField` 経由で実装し、
panel/dialog 双方の mutation 呼び出しを `@/features/admin/hooks/useAdminMutation` に統一。
legacy hook への参照は追加しない（既存箇所の移行は別 task）。

### 再発防止

- admin 配下の新規 form 要素は必ず `FormField` 経由（grep gate 候補）
- mutation hook の import path を CI gate（`ban-legacy-admin-mutation-import`）で固定検査

---

## 教訓まとめ

1. spec-only から implemented-local への昇格は **app code land と同 wave で全 index 同期**
   （Phase 10/12 ドキュメント / artifacts.json / aiworkflow-requirements indexes / legacy register）
2. flat workflow root でも **Phase 12 strict 7 を `outputs/phase-12/` に物理配置**
3. 業務固有 HTTP status（409 など）は **呼び出し側 panel で扱う**。generic mutation hook に巻き取らない
4. NON_VISUAL タスクは vitest + grep gate + typecheck + lint を **AC matrix の evidence として明示**
5. admin 配下の form / mutation は `FormField` + `@/features/admin/hooks/useAdminMutation` への
   **一本化を新規追加から徹底**（既存移行は別 task）
