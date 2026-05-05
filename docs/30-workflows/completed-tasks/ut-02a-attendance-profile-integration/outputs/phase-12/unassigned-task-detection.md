# Unassigned Task Detection

## Result

This workflow formalizes the previous `MemberProfile.attendance` unassigned item.

## Remaining Candidates

| Candidate | Routing | Decision |
| --- | --- | --- |
| Attendance write operations | Separate implementation task after read path lands | 未タスク単票化: `docs/30-workflows/unassigned-task/task-ut-02a-attendance-write-operations-001.md` として起票（read path 完了後の独立 implementation task として分離。本 workflow の scope 外であることが phase-12 detection に明記されているため）。 |
| Attendance dashboard/analytics | Future product task, no-op for this workflow | NO-OP（future product task）: 本 workflow / 02b いずれの scope にも該当せず、UI/プロダクト要件が未確定のため起票しない。次回 governance review で扱う。 |
| Hono ctx or DI container migration | Architecture follow-up only if more repository dependencies need it | routing pending: 次回 governance review で確定。現状は `attendanceProvider` optional 引数で十分（L-UT02A-003）であり、追加 dependency 出現まで起票しない。 |
| Pagination for large attendance history | Follow-up if response size evidence exceeds practical limits | routing pending: 次回 governance review で確定。response size が実用限界を超えた evidence が未取得（L-UT02A-004 の deterministic ordering 仕様で当面は対応可能）。 |

No remaining candidate blocks this read-path specification.
