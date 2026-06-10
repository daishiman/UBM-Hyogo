# 2026-06-09 admin-meeting-bulk-attendance-select

`admin-meeting-bulk-attendance-select` を `implemented_local_evidence_captured / implementation / VISUAL` として同期。
開催日ドロワーの出席追加 UI を、既存の単発 select を保持しつつ、未出席候補の複数選択チェックリストと大量選択モーダルへ拡張した。

実装は `apps/web` のみに閉じ、既存 import endpoint `POST /admin/meetings/:sessionId/attendance/import?dryRun=false` を再利用。
`MeetingsClientShell` を唯一の attended state owner とし、`committed:true` の時だけ state 更新、`committed:false` では
失敗内訳 toast を出して選択を保持する。

Evidence: focused Vitest PASS、typecheck PASS、lint PASS、verify:tokens PASS、local fixture screenshot 7 PNG present、apps/api/packages diff empty。
authenticated staging visual baseline、commit、push、PR は user-gated。
