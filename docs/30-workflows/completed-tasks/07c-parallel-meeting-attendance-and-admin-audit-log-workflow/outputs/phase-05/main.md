# Phase 5: 実装ランブック

## 実装手順

1. `attendance.ts` repository に `getAttendance` を追加する。
2. `addAttendance` 成功時は inserted row、duplicate 時は existing row を返す。
3. `removeAttendance` は削除前 row を返し、対象なしは `null`。
4. route に candidates GET を追加する。
5. POST は 201/409/404/422 を返し、成功時のみ `attendance.add` audit を書く。
6. DELETE は対象なし 404、成功時のみ `attendance.remove` audit を書く。

## 実装ファイル

- `apps/api/src/repository/attendance.ts`
- `apps/api/src/routes/admin/attendance.ts`
- `apps/api/src/repository/attendance.test.ts`
- `apps/api/src/routes/admin/attendance.test.ts`
