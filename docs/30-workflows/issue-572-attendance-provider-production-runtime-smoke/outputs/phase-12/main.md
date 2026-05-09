# Phase 12 Main

## Status

`implemented-local / production runtime smoke pending_user_gate`.

This file is the Phase 12 main entrypoint required by `task-specification-creator` (strict 7 file rule). The detailed task index is `phase-12.md`; the six supporting outputs are present and updated for the implemented-local close-out of issue #572 (attendanceProvider production runtime smoke). Phase 11 production runtime evidence (production GET smoke / redact zero-hit log / DI-bound array assertion) remains user-gated and is not asserted as captured in this file.

## Scope Recap

- 親 Issue: #572（CLOSED, retrospective として記録）
- 関連 Issue: #531 / #371 / #571（すべて CLOSED）
- taskType: `implementation` / visualEvidence: `NON_VISUAL`
- Endpoints (read-only GET): `/admin/members`, `/admin/members/:memberId`, `/me/profile`, `/me/attendance`
- DI-bound evidence: `.attendance | type == "array"` on `/admin/members/:memberId` and `.profile.attendance | type == "array"` on `/me/profile`

## Required Outputs (strict 7)

| # | Output | Status |
| - | --- | --- |
| 1 | `main.md`（本ファイル） | Created |
| 2 | `implementation-guide.md` | Updated |
| 3 | `system-spec-update-summary.md` | Updated |
| 4 | `documentation-changelog.md` | Updated |
| 5 | `unassigned-task-detection.md` | Updated |
| 6 | `skill-feedback-report.md` | Updated |
| 7 | `phase12-task-spec-compliance-check.md` | Updated |

> 旧 `phase-12.md`（索引）は本ファイル作成後も保持し、Phase 12 詳細仕様の正本索引として機能する。`main.md` は strict 7 file rule の Phase 12 本体エントリポイントとして併存する。

## Implementation Summary

- **コード成果物（local 配置済）**:
  - `apps/api/scripts/runtime-smoke/run-smoke.sh`（canonical runner）
  - `scripts/lib/redaction.sh` / `tests/unit/redaction.test.sh`（redact filter & unit test）
  - `tests/unit/runtime-smoke.test.sh`（runner unit test）
  - `docs/30-workflows/runbooks/production-runtime-smoke-attendance.md`（canonical runbook）
- **DI-bound 契約**: `MemberDetail.attendance: AttendanceEntry[]` / `MeProfile.attendance: AttendanceEntry[]` を本仕様書で確定。API public response は不変（DI 配線の確定のみ）。
- **redact filter zero-hit ルール**: cookie / Bearer / cf-* / OAuth secret / magic link / email local part / fullName 実値 / profile body 実値の禁則 grep を boolean / exit metadata のみで記録する設計（実値は永続化しない）。

## Boundary

| 項目 | 状態 |
| --- | --- |
| 本仕様書 (workflow root) | `implemented-local` |
| Phase 11 production runtime smoke | `pending_user_gate` |
| Phase 13 commit / push / PR creation | `pending_user_approval` |
| 親 Issue #371 昇格 commit (`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` → `PASS_RUNTIME_VERIFIED`) | user gate 解除後に取得（commit hash は user gate 解除後に system-spec-update-summary.md に追記） |

## DoD（本ファイル単位）

- [x] strict 7 file が `outputs/phase-12/` に揃っている
- [x] `phase-12.md` 索引と `main.md` 本体が併存し、責務が分離されている
- [x] runtime evidence pending を boundary suffix で明示し、`PASS` 単独表記を禁則化
- [x] `artifacts.json` (root / outputs) の `phase-12.outputs` に `main.md` を追加
