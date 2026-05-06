# Phase 12 Implementation Guide

## Part 1: 中学生レベル

出席記録は、先生がクラスの出席表に丸を付けたり消したりする作業に似ています。大事なのは、同じ人に同じ日の丸を二重に付けないこと、いない授業に丸を付けないこと、あとで誰が直したか分かるようにしておくことです。

このタスクでは、新しい出席表を作り直すのではなく、すでにある出席表の書き込みルールを確認して、仕様書にも同じことを書きます。

| 用語 | 日常語での言い換え |
| --- | --- |
| repository | 出席表を読み書きする係 |
| route | 受付窓口 |
| audit log | 誰が直したかの記録ノート |
| duplicate | 二重に丸を付けようとした状態 |
| soft delete | 表から見えないようにする印 |

## Part 2: 技術者レベル

write 正本は `apps/api/src/repository/attendance.ts` の `addAttendance` / `removeAttendance`。新規 `AttendanceWriter` 抽象と `AttendanceRecordId` は導入しない。

| API | contract |
| --- | --- |
| `POST /admin/meetings/:sessionId/attendances` | canonical add/remove route |
| `POST /admin/meetings/:sessionId/attendance` | legacy add route |
| `DELETE /admin/meetings/:sessionId/attendance/:memberId` | legacy remove route |

Response shape:

| route family | success shape | 用途 |
| --- | --- | --- |
| canonical `/attendances` | `{ ok: true, attended: boolean }` | UI toggle 向けの軽量 contract |
| legacy `/attendance` | `{ ok: true, attendance: {...} }` | row 詳細を返す旧 contract |

`removeAttendance` の冪等性は repository-only。repository は missing row を `null` で返し、route は操作対象がなかったことを `404 attendance_not_found` として返す。

Error mapping:

| repository reason | HTTP |
| --- | --- |
| `duplicate` | 409 |
| `deleted_member` | 422 |
| `member_not_found` | 404 |
| `session_not_found` | 404 |
