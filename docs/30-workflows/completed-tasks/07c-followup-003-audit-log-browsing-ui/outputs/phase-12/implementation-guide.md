# Implementation Guide

## Part 1: 中学生向け説明

`/admin/audit` は、管理者が「だれが、いつ、何をしたか」を見るための変更履歴ノートです。

たとえば参加履歴を追加したとき、その記録は `audit_log` に残ります。この画面では、その記録を検索して確認できます。ただし、記録を書き換えたり消したりする画面ではありません。メールアドレスや電話番号のような個人情報は、そのまま見せずに `[masked]` のように隠して表示します。

日時は管理者が見やすい JST で入力・表示し、API へ送る検索条件は UTC に変換します。

## Part 2: 技術者向け記録

API:

- `GET /admin/audit`
- Auth: Auth.js JWT + `requireAdmin`
- Query: `action`, `actorEmail`, `targetType`, `targetId`, `from`, `to`, `limit`, `cursor`
- `limit`: `1..100`, default `50`
- Cursor: base64url JSON `{ createdAt, auditId }`
- Order: `created_at DESC, audit_id DESC`
- Date range: UTC ISO query accepted. API also accepts local JST-like input defensively.
- Response: `items`, `nextCursor`, `appliedFilters`
- Item: `auditId`, `actorId`, `actorEmail`, `action`, `targetType`, `targetId`, `maskedBefore`, `maskedAfter`, `parseError`, `createdAt`
- Raw `beforeJson` / `afterJson` are not exposed.
- API masking covers common PII key variants including email, mail, phone, tel, mobile, address, addr, name/fullName/displayName, kana, postal, and zip.

Web:

- Route: `/admin/audit`
- Page: `apps/web/app/(admin)/admin/audit/page.tsx`
- Component: `apps/web/src/components/admin/AuditLogPanel.tsx`
- Admin proxy: `fetchAdmin`, no D1 direct access.
- Sidebar: `AdminSidebar` includes `監査ログ`.
- PII masking is repeated in the UI before DOM rendering.

Screenshots:

- Phase 11 evidence directory: `outputs/phase-11/screenshots/`
- Includes `audit-initial.png`, `audit-action-filter.png`, `audit-json-collapsed.png`, `audit-json-expanded-masked.png`, `audit-empty.png`, `audit-forbidden.png`, and `audit-mobile.png`.
- Evidence boundary: screenshots are local static render evidence of implemented UI states, supported by API/Web automated tests. Authenticated local/staging admin session + D1 fixture E2E screenshots are deferred to `docs/30-workflows/unassigned-task/task-09a-exec-staging-smoke-001.md`.

Verification:

- API tests: PASS, 82 files / 493 tests.
- API typecheck: PASS.
- Web typecheck: PASS.
- Focused web tests: PASS, 2 files / 7 tests.
- Full web test: unrelated `/no-access` invariant failure remains.

### TypeScript Contract Snapshot

```ts
type AuditLogQuery = {
  action?: string;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
  from?: string; // UTC ISO string
  to?: string; // UTC ISO string
  limit?: number; // 1..100, default 50
  cursor?: string; // base64url JSON { createdAt, auditId }
};

type AuditLogItem = {
  auditId: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string;
  targetId: string;
  maskedBefore: unknown;
  maskedAfter: unknown;
  parseError: boolean;
  createdAt: string;
};
```

### API Usage Example

```http
GET /admin/audit?action=attendance.add&from=2026-05-01T00%3A00%3A00.000Z&limit=50
Authorization: Auth.js session cookie
```

The API returns `401/403` through `requireAdmin` for unauthenticated or non-admin callers. Invalid query parameters return validation errors. Broken stored JSON does not expose raw JSON; the item sets `parseError=true` and returns masked projection fields.

### Edge Cases / Constants

| Item | Contract |
| --- | --- |
| Empty result | `items=[]`, `nextCursor=null`, filters echoed in `appliedFilters` |
| Cursor order | `created_at DESC, audit_id DESC` |
| Limit | `1..100`, default `50` |
| Date input | UTC ISO query is canonical; API defensively accepts JST-like local input |
| PII keys | email/mail/phone/tel/mobile/address/addr/name/fullName/displayName/kana/postal/zip variants are masked |
| Raw JSON | `before_json` / `after_json` are never returned |
