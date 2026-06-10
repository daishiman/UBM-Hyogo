# ドキュメント更新履歴 — admin-meeting-bulk-attendance-select

workflow_state: `implemented_local_evidence_captured` / 生成日: 2026-06-09

本タスクは apps/web 実装と local evidence を同一 wave で完了した。以下は本 wave で作成/更新したドキュメント、
作成/変更した `apps/web` ファイル一覧、workflow-local 同期と global skill sync、および検証結果を記録する。

## 本 wave で作成した Phase 12 strict 7

| ファイル | 種別 |
| --- | --- |
| `outputs/phase-12/main.md` | 新規 |
| `outputs/phase-12/implementation-guide.md` | 新規 |
| `outputs/phase-12/system-spec-update-summary.md` | 新規 |
| `outputs/phase-12/documentation-changelog.md` | 新規（本ファイル） |
| `outputs/phase-12/unassigned-task-detection.md` | 新規 |
| `outputs/phase-12/skill-feedback-report.md` | 新規 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規 |

## 本 wave で作成した Phase 11 計画成果物

| ファイル | 種別 |
| --- | --- |
| `outputs/phase-11/manual-test-result.md` | 新規 |
| `outputs/phase-11/ui-sanity-visual-review.md` | 新規 |
| `outputs/phase-11/screenshot-plan.json` | 新規（mode: VISUAL） |
| `outputs/phase-11/phase11-capture-metadata.json` | 新規（status: pending_implementation・PNG 0 件） |

## 本 wave で作成/変更した実装ファイル（apps/web のみ）

| # | パス | 種別 | AC |
| --- | --- | --- | --- |
| F1 | `apps/web/src/lib/admin/api.ts` | 編集 | AC-5 |
| F2 | `apps/web/src/components/ui/Checkbox.tsx` | 新規 | AC-1/AC-11 |
| F3 | `apps/web/src/features/admin/components/_meetings/useBulkAttendanceSelection.ts` | 新規 | AC-2/AC-4/AC-9 |
| F4 | `apps/web/src/features/admin/components/_meetings/bulk-attendance-message.ts` | 新規 | AC-7 |
| F5 | `apps/web/src/features/admin/components/_meetings/BulkAttendanceChecklist.tsx` | 新規 | AC-1/AC-2/AC-3 |
| F6 | `apps/web/src/features/admin/components/_meetings/BulkAttendanceModal.tsx` | 新規 | AC-8/AC-9 |
| F7 | `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx` | 編集 | AC-1/AC-8/AC-10 |
| F8 | `apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx` | 編集 | AC-5/AC-6/AC-7 |
| F9 | `apps/web/src/features/admin/components/_meetings/index.ts` | 編集 | — |
| F10 | `apps/web/src/styles/globals.css` | 編集 | AC-11 |
| T1 | `apps/web/src/components/ui/__tests__/Checkbox.spec.tsx` | 新規 | AC-1/AC-11 |
| T2 | `.../_meetings/__tests__/useBulkAttendanceSelection.spec.ts` | 新規 | AC-2/AC-4 |
| T3 | `.../_meetings/__tests__/bulk-attendance-message.spec.ts` | 新規 | AC-7 |
| T4 | `.../_meetings/__tests__/BulkAttendanceChecklist.spec.tsx` | 新規 | AC-1/AC-3 |
| T5 | `.../_meetings/__tests__/BulkAttendanceModal.spec.tsx` | 新規 | AC-8 |
| T6 | `.../_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx` | 編集 | AC-10 |
| T7 | `apps/web/src/lib/admin/__tests__/api.attendance-import.spec.ts` | 新規 | AC-5 |

> 上記は本 wave の実変更一覧であり、`artifacts.json.metadata.implementation_files` と整合する。

## workflow-local 同期（本 wave 実施）

| 対象 | 内容 |
| --- | --- |
| workflow root（`index.md` / `phase-11..13`） | implemented_local_evidence_captured 状態・AC・成果物パスを記述 |
| `outputs/phase-12/*` strict 7 | 本 wave で実体化 |
| `outputs/phase-11/*` | 撮影計画・PASS 観点を実体化し、local fixture PNG 7 枚を `screenshots/` に保存 |
| `artifacts.json` / `outputs/artifacts.json` | gates（Gate-A passed / Gate-B,C pending）/ phase12_strict_outputs / verify_commands を保持 |

## global skill sync（別ブロック・aiworkflow-requirements）

| 対象 | 内容 | 扱い |
| --- | --- | --- |
| workflow inventory / artifact-inventory | 本 spec の workflow を implemented_local_evidence_captured active として登録 | 同 wave 同期 |
| quick-reference / resource-map | task-spec 参照を追記 | 同 wave 同期 |
| task-workflow-active / changelog | implemented_local_evidence_captured エントリを prepend | 同 wave 同期 |
| indexes（topic-map / keywords） | drift があれば `pnpm indexes:rebuild` で再生成 | drift 検出時のみ |

> Step 2 が N/A（ドメイン仕様無影響）のため、API schema / D1 / auth など横断正本の更新対象は発生しない。
> global skill sync は active workflow の ledger 同期に限定する。

## baseline 記録（current 非該当・CONST_007 例外候補）

- M-1: CSV ファイルアップロード一括取込 UI（import endpoint の email 行・dryRun preview 活用）→ 将来の別 UX。起票見送り。
- M-2: attendance route 二系統（plural toggle / import）の API 統合は apps/api リファクタの別タスク。起票見送り。

詳細は [`unassigned-task-detection.md`](unassigned-task-detection.md) を参照。

## validator 結果（implemented_local_evidence_captured）

| 検証 | 状況 |
| --- | --- |
| focused vitest | PASS（10 files / 38 tests） |
| `git diff --name-only -- apps/api packages`（AC-12） | PASS（空） |
| `pnpm verify:phase12-compliance` | 本 wave 実行（strict 7 canonical 見出し準拠の確認） |
| `pnpm gate-metadata:validate` | 本 wave 実行（root / outputs artifacts.json の gates 検証） |
| `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / `mise exec -- pnpm verify:tokens` | PASS |

> local fixture screenshot は 2026-06-09 の実装レビューで取得済み。authenticated staging baseline は user-gated として未取得。
