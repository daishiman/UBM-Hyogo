# Phase 5 — 実装

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| 名前 | 実装 |
| 状態 | spec_created |
| 依存 | Phase 4 |
| 入力 | outputs/phase-04/test-plan.md |
| 出力 | outputs/phase-05/implementation-plan.md |

## 目的

Phase 4 で確定した RED テストを通す最小実装を、CONST_005 必須項目（変更対象ファイル一覧・
関数シグネチャ・入出力・テスト方針・実行コマンド・DoD）を満たす形で実装する。

## タスク

- [ ] 新規・修正ファイル一覧を確定する
- [ ] 関数シグネチャ / 入出力 / 副作用 / エラーハンドリングを明記する
- [ ] DoD（typecheck / lint / 全テスト緑）を明記する

## 変更対象ファイル一覧 (CONST_005 必須)

### 新規

| パス | 役割 |
| --- | --- |
| `apps/api/src/use-cases/admin/import-attendance-bulk.ts` | bulk import service 本体 |
| `apps/web/app/(admin)/admin/meetings/[id]/AttendanceCsvImportPanel.tsx` | 3 ステップ wizard UI |
| `apps/web/src/lib/csv/parse-attendance.ts` | papaparse wrapper + 正規化 helper |
| `apps/api/src/routes/admin/attendance-import.contract.spec.ts` | route contract test |
| `apps/api/src/use-cases/admin/__tests__/import-attendance-bulk.spec.ts` | service unit test |
| `apps/web/src/components/admin/__tests__/AttendanceCsvImportPanel.spec.tsx` | UI 単体テスト |

### 修正

| パス | 変更内容 |
| --- | --- |
| `apps/api/src/routes/admin/attendance.ts` | route-local path `POST /meetings/:sessionId/attendance/import` 追加（公開 URL は `/admin/meetings/:sessionId/attendance/import`） |
| `apps/api/src/repository/attendance.ts` | `listExistingAttendanceMemberIds(sessionId)` 追加 |
| `apps/web/app/(admin)/admin/meetings/[id]/page.tsx` | `<AttendanceCsvImportPanel />` 配置 |
| `apps/web/package.json` | `papaparse` / `@types/papaparse` 依存追加 |

## 関数シグネチャ / 入出力 / 副作用

### `import-attendance-bulk.ts`

```ts
export interface AttendanceImportRow {
  memberId?: string;
  email?: string;
}

export type ImportRowStatus =
  | "ok"
  | "duplicate"
  | "deleted_member"
  | "unknown_member"
  | "invalid";

export interface ImportRowResult {
  index: number;
  status: ImportRowStatus;
  memberId?: string;
  message?: string;
}

export interface ImportSummary {
  total: number;
  ok: number;
  duplicate: number;
  deletedMember: number;
  unknownMember: number;
  invalid: number;
}

export async function importAttendanceBulk(
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

- **副作用**: `commit=true` かつ全行 preflight が `ok` の場合のみ D1 `member_attendance` insert + `auditLogProvider.append`
- **エラーハンドリング**: route は `rows.length > 500` を 413 に先行分岐し、zod parse 失敗は 400 に変換。D1 binding 不在は 500
- **層分離**: Hono `Context` を service 層へ渡さない。route で `ctx({ DB: c.env.DB })`、`authUser`、`requireProvider(c.var.auditLogProvider, "auditLogProvider")` を解決して明示依存として渡す

### `listExistingAttendanceMemberIds`

```ts
export async function listExistingAttendanceMemberIds(
  c: DbCtx,
  sessionId: string,
): Promise<Set<MemberId>>;
```

### `AttendanceCsvImportPanel.tsx`

```ts
export interface AttendanceCsvImportPanelProps {
  sessionId: string;
}

export function AttendanceCsvImportPanel(
  props: AttendanceCsvImportPanelProps,
): JSX.Element;
```

state は `useReducer` の 6 状態（idle / parsing / preview / confirming / done / error）

### `parse-attendance.ts`

```ts
export interface ParsedAttendanceRow {
  memberId?: string;
  email?: string;
}

export function parseAttendanceCsv(text: string): {
  rows: ParsedAttendanceRow[];
  errors: Array<{ row: number; message: string }>;
};
```

email は NFKC + lowercase に正規化する pure function

## 行別判定の境界

| 条件 | 判定 | 備考 |
| --- | --- | --- |
| `memberId` / `email` がどちらも空 | `invalid` | zod refine 後も service で防御 |
| `memberId` と `email` が同一 member を指す | `ok` または後続判定 | 二重指定は許容 |
| `memberId` と `email` が別 member を指す | `invalid` | `message='memberId_email_mismatch'` |
| 既存 attendance がある | `duplicate` | D1 insert には進まない |
| `member_status.is_deleted = 1` | `deleted_member` | 既存 schema の削除 flag を使う |
| lookup 不能 | `unknown_member` | email / memberId どちらも未解決 |

## 実行コマンド (DoD 検証)

```bash
mise exec -- pnpm install        # papaparse 追加反映
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/api test
mise exec -- pnpm --filter @ubm/web test
```

## DoD

- [ ] 全テスト緑（Phase 4 で定義した 14 ケース）
- [ ] `mise exec -- pnpm typecheck` PASS
- [ ] `mise exec -- pnpm lint` PASS
- [ ] 既存 single add/remove テスト regression なし
- [ ] `*.spec.ts` 規約遵守（lefthook `block-test-suffix` 通過）
- [ ] Phase 4 で物理作成した RED test が GREEN に反転している

## 成果物

- `outputs/phase-05/implementation-plan.md`（上記表 + シグネチャ + DoD を 1 ファイルに集約）

## 注意点 / リスク

- `apps/web` 側で D1 binding を直接参照しない（CLAUDE.md 不変条件 5）
- env 参照は `apps/web/src/lib/env.ts` の `getEnv()` 経由のみ
- `papaparse` の bundle size は許容範囲内（~45KB gzipped）だが、Phase 7 で OpenNext bundle size を確認
