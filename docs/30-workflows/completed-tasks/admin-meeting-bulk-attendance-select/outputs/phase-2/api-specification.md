# API 利用仕様（再利用契約・変更しない） — admin-meeting-bulk-attendance-select

> 本タスクは新 endpoint を追加しない。既存 endpoint を web から呼ぶ契約を確定する。

## 呼び出す endpoint

```
POST /api/admin/meetings/{sessionId}/attendance/import?dryRun=false
Body: { "rows": [{ "memberId": string }, ...] }
```

| 項目 | 値 |
| --- | --- |
| proxy | `apps/web/app/api/admin/[...path]/route.ts`（catch-all・追加不要） |
| backend | `apps/api/src/routes/admin/attendance.ts:120-175` |
| use-case | `apps/api/src/use-cases/admin/import-attendance-bulk.ts` |
| 上限 | `IMPORT_MAX_ROWS = 500` |
| commit 条件 | all-or-nothing（全行 ok のみ） |

## レスポンス型（web 側 type 定義 = F1 内）

```ts
interface ImportAttendanceSummary { total:number; ok:number; duplicate:number; deletedMember:number; unknownMember:number; invalid:number; }
interface ImportAttendanceRowResult { index:number; status:"ok"|"duplicate"|"deleted_member"|"unknown_member"|"invalid"; memberId?:string; message?:string; }
interface ImportAttendanceResponse { ok:boolean; summary:ImportAttendanceSummary; rows:ImportAttendanceRowResult[]; dryRun:boolean; committed:boolean; }
```

> packages/shared には追加しない（apps/web 局所型）。shared 型追加は AC-12 抵触のため不可。

## web client 関数（F1）

```ts
export const importAttendance = (sessionId: string, memberIds: ReadonlyArray<string>) =>
  call<ImportAttendanceResponse>(
    `/meetings/${encodeURIComponent(sessionId)}/attendance/import?dryRun=false`,
    "POST",
    { rows: memberIds.map((memberId) => ({ memberId })) },
  );
```

- `call<T>` の戻り `{ok:true,data:T} | {ok:false,status,error}` をそのまま返す（unwrap しない＝committed:false を業務判定するため）。

## ステータス→UX マッピング

| 条件 | UX |
| --- | --- |
| `res.ok && data.committed` | summary.ok 反映・成功 toast・clear |
| `res.ok && !data.committed` | 反映ゼロ・`bulkFailureMessage(summary)` toast・選択保持 |
| `!res.ok`（4xx/5xx） | 反映ゼロ・`一括追加に失敗: {error}` toast・選択保持 |
| 送信前 fresh 0 / >500 | ガード toast |
