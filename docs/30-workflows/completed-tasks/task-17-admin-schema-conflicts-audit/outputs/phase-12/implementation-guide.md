# Implementation Guide

## Part 1: 中学生レベル

学校の名簿で、同じ人の名前が少し違う形で二つ出てきたり、先生が見る記録の項目名が変わったりすると、あとで誰の情報か分からなくなります。

この作業は、管理画面でその迷子になりやすい情報を確認し、正しい名前札を付け直し、あとで何が起きたかを見返せるようにするための準備です。

対象は三つです。

| 画面 | すること |
| --- | --- |
| `/admin/schema` | 質問項目が変わったとき、同じ意味の質問を同じ名前札でつなぐ |
| `/admin/identity-conflicts` | 同じ人かもしれない二つの記録を比べ、まとめるか別人として残す |
| `/admin/audit` | 管理画面で起きた操作をあとから探して確認する |

専門用語の言い換え:

| 用語 | 言い換え |
| --- | --- |
| schema | 情報の入れ物の設計図 |
| stableKey | 変わらない名前札 |
| identity conflict | 同じ人かもしれない記録 |
| audit | 操作の記録帳 |
| cursor | 次のページを見るためのしおり |

## Part 2: 技術者レベル

### Classification

- `taskType`: `implementation`
- `visualEvidence`: `VISUAL_ON_EXECUTION`
- `workflow_state`: `implemented-local`
- `implementation_mode`: `existing-admin-contract-hardening-with-e2e-fixture-fix`

### Canonical Web Paths

| Surface | Canonical path |
| --- | --- |
| schema route | `apps/web/app/(admin)/admin/schema/page.tsx` |
| identity conflicts route | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` |
| audit route | `apps/web/app/(admin)/admin/audit/page.tsx` |
| schema component | `apps/web/src/components/admin/SchemaDiffPanel.tsx` |
| identity component | `apps/web/src/components/admin/IdentityConflictRow.tsx` |
| audit component | `apps/web/src/components/admin/AuditLogPanel.tsx` |
| client mutation helper | `apps/web/src/lib/admin/api.ts` |
| server fetch helper | `apps/web/src/lib/admin/server-fetch.ts` |

### API Contract

| Endpoint | Request contract | Notes |
| --- | --- | --- |
| `GET /admin/schema/diff` | none | Returns schema diff list with recommended stable keys |
| `POST /admin/schema/aliases` | `{ questionId, stableKey, diffId?, dryRun? }` | `questionId` is required. `keepMemberId` style names are not used |
| `GET /admin/schema/aliases/:diffId/backfill` | path `diffId` | Backfill status check |
| `POST /admin/sync/schema` | sync-admin token path | Existing endpoint only |
| `GET /admin/identity-conflicts` | `cursor?`, `limit?` | No status filter in current API |
| `POST /admin/identity-conflicts/:id/merge` | `{ targetMemberId, reason }` | `targetMemberId` must match conflict id target |
| `POST /admin/identity-conflicts/:id/dismiss` | `{ reason }` | Dismisses pair |
| `GET /admin/audit` | `action?`, `actorEmail?`, `targetType?`, `targetId?`, `from?`, `to?`, `cursor?`, `limit?` | Uses masked projection |

### Error Boundaries

- schema alias validation: `422`
- schema alias race/conflict: `409`
- identity bad conflict id: `400`
- identity already merged: `409`
- identity not found: `404`
- audit invalid query: `400`

### Phase 11 Visual Evidence

Screenshots were captured in this cycle. Metadata: `docs/30-workflows/task-17-admin-schema-conflicts-audit/outputs/phase-11/phase11-capture-metadata.json`.

| Screenshot | Actual UI state |
| --- | --- |
| `admin-schema-default.png` | default diff list |
| `admin-schema-empty.png` | pane empty/default coverage |
| `admin-schema-apply-modal.png` | inline stableKey assignment form |
| `admin-schema-assign-error.png` | assignment validation alert |
| `admin-identity-conflicts-default.png` | default conflict list |
| `admin-identity-conflicts-empty.png` | component-contract empty-state evidence |
| `admin-identity-conflicts-merge-modal.png` | inline merge final confirmation |
| `admin-audit-default.png` | default table |
| `admin-audit-filtered.png` | filtered table |
| `admin-audit-empty.png` | empty table |

Focused command:

```bash
PLAYWRIGHT_EVIDENCE_TASK=task-17-admin-schema-conflicts-audit pnpm -F @ubm-hyogo/web exec playwright test playwright/tests/admin-schema-conflicts-audit.spec.ts --project=desktop-chromium
```
