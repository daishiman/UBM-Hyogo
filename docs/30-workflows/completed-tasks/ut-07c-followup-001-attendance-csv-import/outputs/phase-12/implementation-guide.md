# Implementation Guide — UT-07C-FU-001

## 概要

meeting attendance CSV 一括 import 機能。新 endpoint `POST /admin/meetings/:sessionId/attendance/import` と admin UI 3-step wizard を追加。

## アーキテクチャ

```
[admin browser]
   │  CSV file
   ▼
papaparse (parse-attendance.ts)
   │  AttendanceImportRow[]
   ▼
fetch('/admin/meetings/:id/attendance/import?dryRun=true')
   │
   ▼
[apps/api: routes/admin/attendance.ts]
   │  zod parse + 413 / 400 / 404 gate
   ▼
importAttendanceBulk (use-cases/admin/import-attendance-bulk.ts)
   │  1) session 存在確認 (なければ SessionNotFoundError)
   │  2) lookup ctx 構築 (member_identities + member_status の単一 query)
   │  3) listExistingAttendanceMemberIds(sessionId) で既存集合
   │  4) classifyImportRow を全行に適用
   │  5) commit=true && every(ok) のとき chunk size 80 で D1 batch
   │  6) attendance insert + audit_log insert('attendance.import.add') を同一 batch 境界に投入
   ▼
{ summary, rows, committed } → admin UI へ
```

## 主要 API

### POST /admin/meetings/:sessionId/attendance/import

- Query: `dryRun=true|false`
- `dryRun=false` の明示時のみ commit。省略 / typo は安全側の dry-run。
- Body: `{ rows: Array<{ memberId?: string; email?: string }> }`
- 制約: `rows.length <= 500`
- Response 200: `{ ok, summary, rows, dryRun, committed }`
- Response: 400 `invalid_json` / `invalid_payload`, 401 unauth, 403 non-admin, 404 `session_not_found`, 413 `payload_too_large`

### Service signature

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

### classifyImportRow

`(row, index, lookup, existingMemberIds) => ImportRowResult`。pure function として export し、F11 で単体テスト。
同一 payload 内で同じ member を複数指定した場合は 2 行目以降を `duplicate` / `duplicate_in_payload` に分類し、commit しない。

### normalizeEmail

`apps/api/src/lib/email.ts`。`s.normalize("NFKC").trim().toLowerCase()`。

## UI state machine

`useReducer` 6 state: `idle` → `parsing` → `preview` → `confirming` → `done` / `error`。`data-testid` で test と結合: `csv-file-input`, `step-upload`, `step-preview`, `step-done`, `step-error`, `confirm-import`, `cancel-import`, `preview-row`, `status-pill`。
client parse 後に 501 行以上を fetch 前 reject し、memberId/email 空 row は API preview の `invalid` 行として残す。

## 不変条件 (CLAUDE.md)

| # | 条件 | 適合方法 |
| --- | --- | --- |
| 5 | apps/web から D1 直接アクセス禁止 | UI は `fetch` 経由のみ。CSV parse もクライアント JS で完結 |
| 8 | 新規 test は `*.spec.{ts,tsx}` | 4 spec すべて `*.spec.{ts,tsx}` |

## 既存 endpoint との関係

`POST /admin/meetings/:sessionId/attendance` / `DELETE /admin/meetings/:sessionId/attendance/:memberId` / `GET /admin/meetings/:sessionId/attendance/candidates` は変更せず、4 つ目として import endpoint を追加。既存 318 件の api test が GREEN を維持。

## 環境変数 / 依存

- 新規 env なし
- 新規 D1 schema / migration なし
- 新規 dependencies: `papaparse@^5.4.1`, `@types/papaparse@^5.3.14`

## 配信前チェック (DoD)

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck     # PASS
mise exec -- pnpm lint           # PASS
mise exec -- pnpm --filter @ubm-hyogo/api test                # 318 passed
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  --root=../.. --config=vitest.d1.config.ts \
  apps/api/src/routes/admin/attendance-import.contract.spec.ts # 10 passed
mise exec -- pnpm --filter @ubm-hyogo/web test                 # 633 passed
```

## Phase 11 Visual Evidence

| Screenshot | Scenario |
| --- | --- |
| `outputs/phase-11/screenshots/S1-upload.png` | upload 待機状態 |
| `outputs/phase-11/screenshots/S2-preview.png` | dry-run preview 表示 |
| `outputs/phase-11/screenshots/S3-confirm-done.png` | commit 完了画面 |
| `outputs/phase-11/screenshots/S4-error-deleted-member.png` | deleted_member preview / confirm disabled |

Playwright: `apps/web/playwright/tests/attendance-csv-import.spec.ts` / desktop Chromium / 1 passed。

## 既知の制約 / トレードオフ

1. CSV parse は server 側ではなく client 側 papaparse → multipart upload 不要、JSON のみで完結
2. commit semantics: 全行 ok のみ insert（部分コミット禁止）。一部だけ insert したい運用は spec 範囲外
3. 上限 500 行 / chunk 80: Cloudflare Workers CPU budget と D1 batch latency を考慮した経験値
