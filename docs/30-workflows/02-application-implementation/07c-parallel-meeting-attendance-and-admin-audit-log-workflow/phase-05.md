# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-parallel-meeting-attendance-and-admin-audit-log-workflow |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 作成日 | 2026-04-26 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

Phase 4 の verify suite を満たす実装手順を runbook + 擬似コードで記述する。本タスクは spec_created なのでコードは書かないが、後続実装者が手順通りに進めれば AC を満たす擬似コードと sanity check を残す。

## 実行タスク

- [ ] runbook (`outputs/phase-05/runbook.md`) を 6 ステップで記述
- [ ] Hono handler の擬似コードを 3 endpoint 分記述
- [ ] audit hook middleware の擬似コードを記述
- [ ] sanity check（curl + wrangler d1 execute）を runbook 末尾に記述

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | endpoint signature |
| 必須 | outputs/phase-04/main.md | verify suite |
| 必須 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | wrangler 操作 |

## runbook（6 ステップ）

### Step 1: D1 migration 確認

```bash
# 02b で migration 済みのはずだが確認
wrangler d1 migrations list ubm-hyogo-db --local
# 期待: member_attendance に uq_member_attendance を含む migration が apply 済み
# 未 apply なら 02b へ差し戻し
```

### Step 2: action enum と payload 型を `packages/shared` に追加

```ts
// packages/shared/src/audit/actions.ts (placeholder)
export const ADMIN_AUDIT_ACTIONS = [
  'member.status.update', 'member.note.create', 'member.note.update',
  'member.delete', 'member.restore',
  'attendance.add', 'attendance.remove',
  'tag.queue.resolve', 'schema.alias.assign',
  'sync.schema.run', 'sync.responses.run',
] as const
export type AdminAuditAction = typeof ADMIN_AUDIT_ACTIONS[number]
```

### Step 3: audit hook middleware 実装

```ts
// apps/api/src/middleware/auditHook.ts (擬似コード)
import { createMiddleware } from 'hono/factory'

export function auditHook(action: AdminAuditAction) {
  return createMiddleware(async (c, next) => {
    const before = c.get('auditBefore')  // route handler が SET
    await next()
    if (c.res.status >= 200 && c.res.status < 300) {
      const after = c.get('auditAfter')
      const targetId = c.get('auditTargetId')
      const targetType = c.get('auditTargetType')
      const session = c.get('session')  // 05a admin gate がセット
      await c.var.repo.auditLog.insert({
        actorAdminUserId: session.adminUserId,
        action,
        targetType,
        targetId,
        payload: JSON.stringify({ before, after, request: c.get('auditRequest') }),
        occurredAt: new Date().toISOString(),
      })
    }
  })
}
```

### Step 4: attendance endpoints 実装

```ts
// apps/api/src/routes/admin/meetings.ts (擬似コード)
admin.post('/meetings/:sessionId/attendance',
  adminGate(),
  auditHook('attendance.add'),
  async (c) => {
    const sessionId = c.req.param('sessionId')
    const { memberId, attendedAt, note } = AttendanceCreateRequestSchema.parse(await c.req.json())
    c.set('auditTargetType', 'attendance')
    c.set('auditTargetId', `${sessionId}:${memberId}`)
    c.set('auditRequest', { memberId, attendedAt, note })
    try {
      const row = await c.var.repo.attendance.insert({ sessionId, memberId, attendedAt, note })
      c.set('auditBefore', null)
      c.set('auditAfter', row)
      return c.json(row, 201)
    } catch (e) {
      if (isUniqueViolation(e)) {
        const existing = await c.var.repo.attendance.findOne(sessionId, memberId)
        return c.json({ error: 'attendance_already_recorded', existing }, 409)
      }
      throw e
    }
  }
)

admin.delete('/meetings/:sessionId/attendance/:memberId',
  adminGate(),
  auditHook('attendance.remove'),
  async (c) => {
    const sessionId = c.req.param('sessionId')
    const memberId = c.req.param('memberId')
    const before = await c.var.repo.attendance.findOne(sessionId, memberId)
    if (!before) return c.json({ error: 'attendance_not_found' }, 404)
    await c.var.repo.attendance.delete(sessionId, memberId)
    c.set('auditTargetType', 'attendance')
    c.set('auditTargetId', `${sessionId}:${memberId}`)
    c.set('auditBefore', before)
    c.set('auditAfter', null)
    return c.json({ ok: true })
  }
)

admin.get('/meetings/:sessionId/attendance/candidates',
  adminGate(),
  async (c) => {
    const candidates = await c.var.svc.attendanceCandidates(c.req.param('sessionId'))
    return c.json(candidates)
  }
)
```

### Step 5: candidates resolver

```ts
// apps/api/src/services/attendanceCandidates.ts (擬似コード)
export async function attendanceCandidates(sessionId: string, db: D1Database) {
  const rows = await db.prepare(`
    SELECT m.id AS memberId, r.fullName, r.zone, ms.participationStatus AS status
    FROM members m
    JOIN member_status ms ON ms.member_id = m.id
    LEFT JOIN member_responses r ON r.id = m.current_response_id
    WHERE ms.is_deleted = 0  -- 不変条件 #7 / #15: 削除済み除外
      AND m.id NOT IN (SELECT member_id FROM member_attendance WHERE meeting_session_id = ?)
    ORDER BY r.fullName
  `).bind(sessionId).all()
  return rows.results
}
```

### Step 6: 既存 admin endpoints へ audit hook 注入

| 既存 endpoint | action | targetType |
| --- | --- | --- |
| PATCH /admin/members/:memberId/status | member.status.update | member |
| POST /admin/members/:memberId/notes | member.note.create | member |
| PATCH /admin/members/:memberId/notes/:noteId | member.note.update | member |
| POST /admin/members/:memberId/delete | member.delete | member |
| POST /admin/members/:memberId/restore | member.restore | member |
| POST /admin/tags/queue/:queueId/resolve | tag.queue.resolve | tag_queue |
| POST /admin/schema/aliases | schema.alias.assign | schema_alias |
| POST /admin/sync/schema | sync.schema.run | sync_job |
| POST /admin/sync/responses | sync.responses.run | sync_job |

## sanity check

```bash
# 1. local D1 起動
pnpm --filter @ubm/api dev

# 2. attendance 1 回目（201 期待）
curl -X POST http://localhost:8787/admin/meetings/s1/attendance \
  -H "Cookie: ${ADMIN_SESSION}" \
  -H "Content-Type: application/json" \
  -d '{"memberId":"m1"}'

# 3. attendance 2 回目（409 期待）
curl -X POST http://localhost:8787/admin/meetings/s1/attendance \
  -H "Cookie: ${ADMIN_SESSION}" \
  -H "Content-Type: application/json" \
  -d '{"memberId":"m1"}'

# 4. audit_log 確認
wrangler d1 execute ubm-hyogo-db --local \
  --command="SELECT action, target_id FROM audit_log ORDER BY occurred_at DESC LIMIT 5"
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | runbook の各ステップで起こりうる failure を異常系検証へ |
| Phase 7 | AC マトリクスの実装列に上記擬似コードをマッピング |
| 下流 08a | contract test が本 runbook の挙動を expect |

## 多角的チェック観点

- 不変条件 **#5** adminGate() を全 endpoint に必須付与（理由: 認可漏れ防止）
- 不変条件 **#6** D1 アクセスは repository / service 経由のみ（理由: apps/web から直接呼ばない）
- 不変条件 **#7** candidates resolver で `is_deleted=0` を WHERE（理由: 削除済み非表示）
- 不変条件 **#11** profile 編集 endpoint を実装しない（理由: route 一覧に含めない）
- 不変条件 **#15** DB UNIQUE + 409 + 既存 row 返却（理由: idempotent retry を可能に）
- a11y / 無料枠: 1 操作 2 writes、`audit_log` index で履歴 SELECT 高速

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | runbook 記述 | 5 | pending | 6 ステップ |
| 2 | 擬似コード記述 | 5 | pending | hook + 3 endpoint + resolver |
| 3 | sanity check 記述 | 5 | pending | curl + wrangler |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | runbook 本文 |
| ドキュメント | outputs/phase-05/runbook.md | step 詳細 |
| メタ | artifacts.json | phase 5 status |

## 完了条件

- [ ] runbook 6 ステップ記述
- [ ] 擬似コード（hook + 3 endpoint + resolver）記述
- [ ] sanity check が実行可能形式

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] 多角的チェック観点記述済み
- [ ] artifacts.json の phase 5 を completed

## 次 Phase

- 次: Phase 6 (異常系検証)
- 引き継ぎ: 6 ステップ runbook、想定 failure
- ブロック条件: 擬似コード未完なら Phase 6 不可
