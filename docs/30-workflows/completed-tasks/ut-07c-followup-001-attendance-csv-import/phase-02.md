# Phase 2 — 設計

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| 名前 | 設計 |
| 状態 | spec_created |
| 依存 | Phase 1 |
| 入力 | outputs/phase-01/requirements.md |
| 出力 | outputs/phase-02/api-design.md, outputs/phase-02/service-design.md, outputs/phase-02/ui-design.md |

## 目的

API endpoint / service / UI の 3 層を、後続 Phase 4 (RED テスト) / Phase 5 (実装) が
そのまま参照できる粒度で設計する。

## タスク

### API 設計 (`api-design.md`)

- [ ] endpoint 設計表
  - method: `POST`
  - path: `/admin/meetings/:sessionId/attendance/import`
  - query: `dryRun=true|false`（既定 false）
  - content-type: `application/json`（MVP）。`multipart/form-data` は将来拡張余地として記載のみ
  - middleware: `requireAdmin`
- [ ] zod schema 設計
  - `attendanceImportRowSchema`: `{ memberId?: string; email?: string }`, `refine` で「いずれか必須」
  - `attendanceImportRequestSchema`: `{ rows: attendanceImportRowSchema[] }`
  - `rows.length > 500` は zod の通常 400 ではなく route handler で先に 413 (`payload_too_large`) として返す
- [ ] レスポンス shape
  ```json
  {
    "summary": { "total": 12, "ok": 10, "duplicate": 1, "deletedMember": 0, "unknownMember": 1, "invalid": 0 },
    "rows": [
      { "index": 0, "status": "ok", "memberId": "mem_xxx" },
      { "index": 1, "status": "duplicate", "memberId": "mem_yyy" },
      { "index": 2, "status": "unknown_member", "message": "email not found" }
    ]
  }
  ```
- [ ] エラーレスポンス: 401 / 403 / 413 / 400（zod parse 失敗）

### service 設計 (`service-design.md`)

- [ ] 関数シグネチャ:
  ```ts
  importAttendanceBulk(
    db: DbCtx,
    sessionId: string,
    rows: AttendanceImportRow[],
    options: {
      commit: boolean;
      actor: { id: AdminId; email: AdminEmail };
      auditLogProvider: AuditLogProvider;
    },
  ): Promise<{ summary: ImportSummary; rows: ImportRowResult[] }>;
  ```
- [ ] 内部処理ステップ:
  1. session 存在検証（404 → 上位 route で 404 化）
  2. `listExistingAttendanceMemberIds(sessionId)` で既存 attendance member set 取得
  3. row ごとに lookup → 判定（`ok` / `duplicate` / `deleted_member` / `unknown_member` / `invalid`）
  4. `commit=true` かつ全行 preflight が `ok` の場合のみ D1 batch insert（`ATTENDANCE_BIND_CHUNK_SIZE = 80` 分割）
  5. 成功行ごとに `auditLogProvider.append` 経由で `action='attendance.import.add'` を 1 record
- [ ] repository 変更:
  - `apps/api/src/repository/attendance.ts` に `listExistingAttendanceMemberIds(c: DbCtx, sessionId: string): Promise<Set<MemberId>>` 追加
- [ ] email lookup: NFKC + lowercase に正規化（pure function helper として切り出し）
- [ ] audit_log actor: `requireAdmin` middleware で context に注入される `adminId` 由来
- [ ] `memberId` と `email` が同時指定された場合:
  - `memberId` を主キーとして lookup
  - `email` も一致した場合のみ `ok` 判定へ進む
  - `memberId` と `email` が別 member を指す場合は `invalid` + `message='memberId_email_mismatch'`

### UI 設計 (`ui-design.md`)

- [ ] state machine（XState 不要・useReducer で十分）
  ```
  idle → parsing → preview(ok|hasIssues) → confirming → done
                                           → error
  ```
- [ ] ステップ間 state 引き渡しテーブル（rows / dryRunResult / commitResult）
- [ ] 既存コンポーネント再利用方針:
  - 既存 `MeetingAttendancePanel` は分割せず変更しない
  - 新 `AttendanceCsvImportPanel` を **sibling** として `apps/web/app/(admin)/admin/meetings/[id]/page.tsx` に追加
- [ ] CSV parse は `papaparse`（クライアント側）
- [ ] Next.js App Router のため Preload API は対象外（browser fetch）
- [ ] アクセシビリティ: step 進捗を `aria-current="step"` で表現

## 成果物

- `outputs/phase-02/api-design.md`
- `outputs/phase-02/service-design.md`
- `outputs/phase-02/ui-design.md`

## 完了条件

- API endpoint surface, zod schema, レスポンス shape が一意に決まる
- service signature が型レベルで確定し、Phase 5 でそのまま import できる
- UI state machine が 6 状態以下で完結する

## 注意点 / リスク

- D1 batch insert は単一 Worker invocation 内で完結させる（外部 queue を持ち込まない）。D1 transaction による全件巻き戻しは前提にせず、commit 前の全行 preflight が `ok` の場合のみ insert に進む。
- audit_log の `action` 値は既存 schema を継承（自由文字列ではなく `auditAction` brand で型保証）
- `papaparse` を `apps/web/package.json` に追加することを設計時点で宣言する（Phase 5 の DoD と整合）
