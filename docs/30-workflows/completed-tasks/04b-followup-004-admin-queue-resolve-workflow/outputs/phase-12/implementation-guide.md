# 実装ガイド — admin queue resolve workflow

## Part 1: 中学生レベルの概念説明

会員さんが「公開やめたい」「退会したい」とお願いを出すと、それは依頼ボックス（`admin_member_notes` テーブル）にいったん溜まります。

管理者は依頼ボックスを開いて、1 件ずつ次の 3 つから選びます:
- 「はい、公開やめます」
- 「はい、退会させます」
- 「今回はお断り」

「はい」を選ぶと、会員情報の状態（公開中／非公開／削除済み）も同時に書き換えます。「依頼に印を付ける」のと「会員情報を書き換える」のは必ずセットで動きます。片方だけ成功して片方が失敗することはありません。

間違えて 2 回承認ボタンを押しても 1 回しか効きません。別の管理者が先に処理していたら「もう処理済みです」と教えてくれます。

誰がいつどの依頼をどう処理したかは、履歴（audit log）に全部残ります。

## Part 2: 技術者レベルの説明

### API 仕様

#### `GET /admin/requests`
- **query**: `status=pending`（必須・現状固定）, `type=visibility_request|delete_request`（必須）, `limit=1..100`（既定 20）, `cursor?`（base64url JSON `{createdAt, noteId}`）
- **auth**: `requireAdmin`（401/403）
- **response**:
  ```ts
  {
    ok: true,
    items: Array<{
      noteId: string;
      memberId: string;
      noteType: "visibility_request" | "delete_request";
      requestStatus: "pending";
      requestedAt: string;       // ISO8601
      requestedReason: string | null;
      requestedPayload: unknown; // PII sanitize 済み
      memberSummary: {
        memberId: string;
        publicHandle: string | null;
        publishState: string;
        isDeleted: boolean;
      };
    }>,
    nextCursor: string | null,
    appliedFilters: { status: "pending", type: string }
  }
  ```
- **ordering**: `created_at ASC, note_id ASC`（FIFO）
- **PII sanitize**: `email | phone | name | first_name | last_name | address | birthday | tel | kana` キーは responsessから除去

#### `POST /admin/requests/:noteId/resolve`
- **body**: `{ resolution: "approve" | "reject", resolutionNote?: string }`（resolutionNote は max 500 文字）
- **status**:
  - 200: 成功
  - 400: body/path validation 失敗
  - 401: 未認証
  - 404: noteId 不在
  - 409: 既に resolved/rejected（楽観ロック）
  - 422: visibility approve で `desiredState` が public/member_only/hidden 以外
- **body SSOT**: `packages/shared/src/schemas/admin/admin-request-resolve.ts`

### admin auth gate
- `apps/api` 側: `requireAdmin` middleware（JWT 検証 + role check）
- `apps/web` 側: admin layout (`/admin/*`) + admin proxy `/api/admin/*` 経由のみ。直接 D1 アクセスは不変条件 #5 で禁止

### D1 transaction (atomicity)
`c.env.DB.batch([...])` 単一トランザクションで以下を実行する。approve path は batch 前に `member_status` の存在を preflight し、欠落時は 404 `member_status_not_found` で note を pending のまま残す。

**approve + visibility_request:**
```sql
-- (1) member_status を更新（admin_member_notes が pending である場合のみ）
UPDATE member_status
SET publish_state = ?, updated_at = ?
WHERE member_id = (
  SELECT member_id FROM admin_member_notes
  WHERE note_id = ? AND request_status = 'pending'
);

-- (2) note を resolved 化（楽観ロック）
UPDATE admin_member_notes
SET request_status = 'resolved',
    resolved_at = ?,
    resolved_by_admin_id = ?,
    body = body || ?  -- "[resolved] <note>"
WHERE note_id = ? AND request_status = 'pending';
```

**approve + delete_request:**
```sql
-- (1) member_status.is_deleted = 1
UPDATE member_status
SET is_deleted = 1, updated_at = ?
WHERE member_id = (SELECT ... pending);

-- (2) deleted_members へ INSERT
INSERT INTO deleted_members (member_id, reason, deleted_at) VALUES (?, ?, ?);

-- (3) note を resolved 化（同上）
```

**reject:**
```sql
UPDATE admin_member_notes
SET request_status = 'rejected', resolved_at = ?, resolved_by_admin_id = ?, body = body || ?
WHERE note_id = ? AND request_status = 'pending';
```

### 楽観ロック / 二重 resolve
- 最終 UPDATE の `meta.changes === 0` → 409 を返す
- サブクエリ `WHERE member_id = (SELECT ... WHERE request_status = 'pending')` が member_status と note の整合を保証
- レース条件: 2 admin が同時に resolve しても、後勝ちは 409、先勝ちはそのまま resolved 化

### audit
- `audit_log` INSERT は state update と同じ `DB.batch()` に入れる。audit insert が失敗した場合、request resolve も commit しない。
- action は `admin.request.approve` / `admin.request.reject`。
- `AuditTargetType` enum に `admin_member_note` がないため `targetType: "member"` に丸める。`after_json.noteId` で原典追跡可能

### web 側
- server: `apps/web/app/(admin)/admin/requests/page.tsx` で `fetchAdmin<AdminRequestsApiResponse>` 経由 fetch
- client: `RequestQueuePanel` で type タブ / list / detail / confirmation modal
- pagination: `nextCursor` がある場合は「次のページ」ボタンで `cursor` query を付けて遷移する
- mutation: `resolveAdminRequest(noteId, body)` → admin proxy 経由
- 409 toast「他の管理者が既に処理済み」+ `router.refresh()` で list 再読込
- 破壊的操作（特に delete_request）は modal の `role="alert"` で警告

### Shared contract
- Resolve body は `packages/shared/src/schemas/admin/admin-request-resolve.ts` の `adminRequestResolveBodySchema` を SSOT とする。
- apps/api route と apps/web admin client は `AdminRequestResolveBody` / schema を共有し、`resolutionNote` max 500 と extra key reject を同じ契約で扱う。

### Phase 11 visual evidence
- Local screenshot files are not present in `outputs/phase-11/` because capture requires an authenticated admin session plus seeded D1 request rows.
- Current Phase 11 status is `completed_with_delegated_visual_gate`: API/repository/UI component tests passed locally, while actual screenshots are delegated to canonical workflow `docs/30-workflows/issue-399-admin-queue-resolve-staging-visual-evidence/`.
- The capture plan remains in `outputs/phase-11/screenshot-plan.json`; metadata is recorded in `outputs/phase-11/phase11-capture-metadata.json`.
- Follow-up workflow `issue-399-admin-queue-resolve-staging-visual-evidence` provides the staging fixture (`apps/api/migrations/seed/issue-399-admin-queue-staging-seed.sql`), env-guarded scripts (`scripts/staging/seed-issue-399.sh` / `cleanup-issue-399.sh`), and the capture runbook (`docs/30-workflows/issue-399-admin-queue-resolve-staging-visual-evidence/runbook.md`). Once the staging cycle runs, the redacted screenshots will land in `docs/30-workflows/issue-399-admin-queue-resolve-staging-visual-evidence/outputs/phase-11/screenshots/` and metadata in the same directory's `phase11-capture-metadata.json`, closing the visual gate.

### test commands
```bash
mise exec -- pnpm exec vitest run apps/api/src/repository/__tests__/adminNotes.test.ts
mise exec -- pnpm exec vitest run apps/api/src/routes/admin/requests.test.ts
mise exec -- pnpm exec vitest run apps/web/src/components/admin/__tests__/RequestQueuePanel.test.tsx
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

### edge cases
| ケース | 処理 |
|--------|------|
| visibility approve で desiredState 不正 | 422（D1 batch 実行前に validate） |
| delete approve で対象が既に is_deleted=1 | サブクエリガードで note pending のみ更新。既に削除済 member は再 delete されない（idempotent） |
| 二重 resolve | 楽観ロックで 409 |
| 未知 noteId | 事前 SELECT で 404 |
| resolutionNote > 500 文字 | zod validation で 400 |
| network error | client 側 toast 表示、再試行可能 |

### 不変条件遵守
- ✅ #4: `admin_member_notes` のみで管理。Google Form schema (`member_identities`) は触らない
- ✅ #5: D1 アクセスは `apps/api` 内のみ。web は admin proxy 経由
- ✅ #11: profile 本文 mutation を作っていない（status 操作のみ）
- ✅ #13: tag 直接更新 mutation を作っていない
