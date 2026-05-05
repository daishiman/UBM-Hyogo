# Phase 1 Output: 要件定義

## Result

Status: `completed`

`MemberProfile.attendance` の空配列 stub を実データ注入へ置き換える実装タスクとして、AC-1〜10、依存境界、NON_VISUAL evidence 方針を確定した。

## Decisions

- `MemberProfile.attendance: AttendanceRecord[]` は 02a の確定済み interface として変更しない。
- builder への注入は `attendanceProvider` optional dependency を採用し、DI container / Hono ctx 拡張は本タスク外に置く。
- D1 bind 上限回避は 80 件単位の事前 chunk とする。
- UI 新規実装は行わず、API response と UI render log の NON_VISUAL evidence で通電確認する。

## Open Questions For Phase 2

- 02b 側 schema が `meeting_sessions` / `member_attendance` を実装済みか。
- `AttendanceRecord` 型の所在を repository 層からどう import するか。
- 未注入 fallback を warning log にするか、test-only guard にするか。
