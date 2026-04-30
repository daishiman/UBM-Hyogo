# Phase 8: DRY 化

## Before / After

| 対象 | Before | After |
| --- | --- | --- |
| duplicate response | `{ error: "already attended" }` | `{ error: "attendance_already_recorded", existing }` |
| success status | POST 200 | POST 201 |
| remove result | `void` | removed row or `null` |
| audit action | `admin.attendance.added/removed` | `attendance.add/remove` |
| actor | `null` | `authUser.memberId/email` |

## 共通化判断

既存 admin routes は明示的 `auditAppend` を使っているため、今回の局所変更では middleware 抽象化を追加しない。将来 07a/07b/07c をまとめる段階で action enum と payload sanitizer を共有化する。
