# Artifact Inventory — admin-meeting-bulk-attendance-select

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-meeting-bulk-attendance-select/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL` |
| scope | `apps/web` only |

## Implementation

- `apps/web/src/lib/admin/api.ts`
- `apps/web/src/components/ui/Checkbox.tsx`
- `apps/web/src/features/admin/components/_meetings/useBulkAttendanceSelection.ts`
- `apps/web/src/features/admin/components/_meetings/bulk-attendance-message.ts`
- `apps/web/src/features/admin/components/_meetings/BulkAttendanceChecklist.tsx`
- `apps/web/src/features/admin/components/_meetings/BulkAttendanceModal.tsx`
- `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx`
- `apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx`
- `apps/web/src/styles/globals.css`

## Evidence

- focused Vitest 10 files / 38 tests PASS.
- `mise exec -- pnpm typecheck` PASS.
- `mise exec -- pnpm lint` PASS.
- `mise exec -- pnpm verify:tokens` PASS.
- `docs/30-workflows/completed-tasks/admin-meeting-bulk-attendance-select/outputs/phase-11/screenshots/` 7 PNG present.
- `git diff --name-only -- apps/api packages` empty.

## Boundary

Existing import endpoint is reused. API / D1 / Google Form / packages are unchanged.
Authenticated staging visual baseline, commit, push, and PR are user-gated.

## Lessons Learned

- **L-AMBA-001（複数 route 領域では契約引用前に対象 endpoint を直接 Read）**: 初回コード調査 SubAgent が `meetings.ts`（plural toggle route）のみを見て「一括取込 endpoint は存在しない」と誤報した。実体は `attendance.ts:120-175` に存在し `index.ts:283` で mount 済みだった。`attendance.ts` を直接 Read して endpoint 実在 + mount を確認し、Phase 1 §4 に訂正記録を残した。FB-01 / Issue #1065 gate（設計前提に引用する契約は実コードを Read 済み）の成功適用例。
- **L-AMBA-002（既存 endpoint 再利用で API 変更ゼロ）**: 一括追加に新規 endpoint を作らず、既存 import endpoint（all-or-nothing / dryRun / IMPORT_MAX_ROWS）を再利用することで AC-12（apps/api 非変更）を構造的に満たした。CLAUDE.md「UI prototype alignment 正本順位」の「既存 endpoint surface のみ利用し UI 側に adapter を置く」方針の忠実な適用。
- **L-AMBA-003（all-or-nothing と未出席のみ選択の整合）**: import は all-or-nothing（1 件失敗で全件未 commit）だが、選択母集合を未出席候補のみに限定することで通常 duplicate を構造的に回避した。Shell を唯一の committed state owner とし `committed:true` のみ state 更新、`committed:false` 時は選択保持（AC-7）で UX 破綻を防いだ。
- **L-AMBA-004（VISUAL local fixture は同サイクル取得・staging baseline のみ user-gate）**: VISUAL 実装タスクでは local fixture PNG を同サイクルで取得（7 枚）し、authenticated staging visual baseline のみ user-gated とする方が検証4条件に整合する。local screenshot まで user-gate 扱いにした初期 close-out drift を同サイクルで是正した。
- **L-AMBA-005（skill 同期 wave は indexes:rebuild を明示実行）**: skill index 手編集（quick-reference / resource-map / task-workflow-active）+ 新規 changelog / artifact-inventory を加えた後、`pnpm indexes:rebuild` を忘れると topic-map / keywords.json が drift し CI gate `verify-indexes-up-to-date` が fail する。本 wave も rebuild 漏れを検出し補完した（冪等・5494 キーワード）。

anti-pattern:
- ❌ 複数 route ファイルがある領域で調査 SubAgent の「endpoint なし」報告を実 Read せず鵜呑みにする。
- ❌ 既存 import endpoint があるのに一括追加用の新規 endpoint を作り apps/api を変更する。
- ❌ skill index 手編集後に `indexes:rebuild` を省略し topic-map / keywords drift を残す。
