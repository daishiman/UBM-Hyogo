# lessons-learned — step-06 meetings attendance confirm dialog 共通化（2026-05-20）

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/step-06-meetings-attendance-implementation/` |
| source spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-06-meetings-attendance/spec.md` |
| status | `implemented_local_evidence_captured` |
| user gate | commit / push / PR |

## 苦戦箇所サマリ

| ID | Lesson | Why（事故 / 強い選好） | How to apply（適用条件） |
| --- | --- | --- | --- |
| L-STEP06-001 | destructive 系 admin mutation には **`useConfirmDialog` + `ConfirmDialog` の共通組** を必ず経由させる | `<Button onClick={() => mutation.mutate()}>` 直結だと誤クリック取消不能・focus trap 不在で a11y NG。`window.confirm` も同様（Cloudflare Workers / OpenNext bundle で挙動が不安定） | admin 画面の「削除 / 解除 / 却下 / 取消」など破壊的 mutation 全般。`confirm` を画面ごとに自作しない |
| L-STEP06-002 | dialog の **state machine は `idle / open / submitting / error` の 4 値で統一**、`open && !submitting` の二重ガードで再クリック沈黙化 | submitting 中に re-open すると double mutation が走り、`409 conflict` を toast に 2 回出す。再現困難な race を future-you に残さないため | `useConfirmDialog` を新規 admin 画面に組み込む場合、submit button 側で `disabled={state==='submitting'}` を必ず付与 |
| L-STEP06-003 | admin 系 mutation は **`@/features/admin/hooks/useAdminMutation` 経由を強制**、直接 `fetch` 禁止 | error mapping (200/404/409/422/401/5xx → toast / session expire 検知) が画面ごとにバラつくと、ログイン切れ時に「無反応 / 二重ログイン誘導」が起きる。今回 `MeetingAttendancePanel` の直接 fetch を統一して回収 | `apps/web/src/components/admin/**` で新規 mutation を書く際は `useAdminMutation` を import。CLAUDE.md §不変条件 10 と一致 |
| L-STEP06-004 | Phase 1 で必ず **current UI SSOT (`apps/web/src/lib/admin/api.ts` + `apps/api/src/routes/admin/meetings.ts`) を確認**してから UI 期待 shape を決める | meetings は legacy 単数 route (`/api/admin/meeting/:id/attendance`) と現行 UI 複数形 alias (`/api/admin/meetings/:id/attendances`) が併存。混同すると adapter 層の追加実装が二重化し、戻り値 shape も乖離する | step-06 type / serial-05 配下の追改修着手時、Phase 1 のチェックリストに「current UI SSOT 確認」を必ず入れる。`task-specification-creator/references/phase-template-phase1.md` の Existing UI Route Inventory Gate と整合 |

## 派生 follow-up

- `docs/30-workflows/unassigned-task/admin-mutation-timeout-policy.md` — `useAdminMutation` の timeout policy 全体方針は step-06 では未 formalize。serial-05 配下の他 step と合流して設計する。

## 関連

- [[workflow-step-06-meetings-attendance-implementation-artifact-inventory]]
- [[lessons-learned-issue-769-root-error-focus-2026-05]]（focus management 系の隣接 lesson）
- [[lessons-learned-admin-member-delete-e2e-2026-05]]（admin destructive mutation の先行 lesson）
