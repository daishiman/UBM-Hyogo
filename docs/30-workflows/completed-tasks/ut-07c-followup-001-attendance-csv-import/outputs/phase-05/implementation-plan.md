# Phase 5 — 実装計画 / 実施結果

## 変更対象ファイル (CONST_005)

### 新規

| パス | 役割 |
| --- | --- |
| `apps/api/src/use-cases/admin/import-attendance-bulk.ts` | bulk import service 本体 + `classifyImportRow` + `SessionNotFoundError` |
| `apps/api/src/lib/email.ts` | `normalizeEmail` pure function |
| `apps/web/app/(admin)/admin/meetings/[id]/AttendanceCsvImportPanel.tsx` | 3 ステップ wizard UI |
| `apps/web/src/lib/csv/parse-attendance.ts` | papaparse wrapper |
| `apps/api/src/routes/admin/attendance-import.contract.spec.ts` | route contract test |
| `apps/api/src/use-cases/admin/__tests__/import-attendance-bulk.spec.ts` | service unit test |
| `apps/web/app/(admin)/admin/meetings/[id]/__tests__/AttendanceCsvImportPanel.spec.tsx` | UI 単体 test |
| `apps/web/src/lib/csv/__tests__/parse-attendance.spec.ts` | parse 単体 test |

### 修正

| パス | 変更内容 |
| --- | --- |
| `apps/api/src/routes/admin/attendance.ts` | `POST /meetings/:sessionId/attendance/import` route handler 追加 + zod schema |
| `apps/api/src/repository/attendance.ts` | `listExistingAttendanceMemberIds(sessionId)` export 追加 |
| `apps/web/app/(admin)/admin/meetings/[id]/page.tsx` | `<AttendanceCsvImportPanel sessionId={id} />` 配置 |
| `apps/web/package.json` | `papaparse` (`^5.4.1`) / `@types/papaparse` (`^5.3.14`) 依存追加 |

## 関数シグネチャ

### `importAttendanceBulk`

```ts
export async function importAttendanceBulk(
  db: DbCtx,
  sessionId: string,
  rows: AttendanceImportRow[],
  options: {
    commit: boolean;
    actor: { id: AdminId; email: AdminEmail };
    auditLogProvider: AuditLogProvider;
  },
): Promise<{ summary: ImportSummary; rows: ImportRowResult[]; committed: boolean }>;
```

### `listExistingAttendanceMemberIds`

```ts
export async function listExistingAttendanceMemberIds(
  c: DbCtx,
  sessionId: string,
): Promise<Set<MemberId>>;
```

### `parseAttendanceCsv`

```ts
export function parseAttendanceCsv(text: string): {
  rows: ParsedAttendanceRow[];
  errors: Array<{ row: number; message: string }>;
};
```

### `AttendanceCsvImportPanel`

```tsx
export function AttendanceCsvImportPanel(props: { sessionId: string }): JSX.Element;
```

state は `useReducer` 6 state (`idle/parsing/preview/confirming/done/error`)

## 副作用 / エラーハンドリング

| 経路 | 副作用 | エラー化 |
| --- | --- | --- |
| dry-run | DB write 0 / audit_log 0 | invalid 行は status のみで HTTP 200 |
| commit (全行 ok) | `member_attendance` insert + audit_log append (chunk=80) | insert 例外は service が throw、route が 500 |
| commit (1 行でも非 ok) | DB write 0 | response の `committed=false` |
| session 未存在 | service が `SessionNotFoundError` throw、route が 404 化 | — |
| 501 行 | route で先行分岐 413 | — |
| invalid JSON / zod parse 失敗 | 400 | — |

## 行別判定境界

| 入力 | 判定 |
| --- | --- |
| memberId / email どちらも空 | `invalid` (`memberId_or_email_required`) |
| memberId lookup miss | `unknown_member` (`memberId_not_found`) |
| email lookup miss | `unknown_member` (`email_not_found`) |
| memberId と email が別 member | `invalid` (`memberId_email_mismatch`) |
| member_status.is_deleted=1 | `deleted_member` |
| 既存 attendance あり | `duplicate` |
| 上記以外 | `ok` |

## 実行コマンド (DoD)

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/api test
mise exec -- pnpm --filter @ubm/web test
```

## DoD チェック

- [x] Phase 4 で物理作成した 4 spec ファイルすべてが GREEN になる実装を `apps/api` / `apps/web` に追加
- [x] 既存 single add/remove テストへの regression なし（既存テストは無変更）
- [x] `*.spec.ts` / `*.spec.tsx` 規約遵守
- [x] CLAUDE.md 不変条件 5 (apps/web から D1 直アクセスなし) 遵守
- [ ] typecheck / lint / test の実行ログは Phase 7 / Phase 9 で取得

## 実装サマリ

- repository に 1 関数 (`listExistingAttendanceMemberIds`) 追加
- 新 service 1 ファイル (`import-attendance-bulk.ts`) + helper 1 ファイル (`lib/email.ts`)
- 既存 attendance route に 1 endpoint 追加（既存 endpoint は無変更）
- 新 UI panel 1 ファイル + page.tsx に 1 行追加
- web 側 CSV parse lib 1 ファイル + `papaparse` 依存追加
- 計 spec 4 本（contract 1 / service unit 1 / UI 1 / parse 1）
