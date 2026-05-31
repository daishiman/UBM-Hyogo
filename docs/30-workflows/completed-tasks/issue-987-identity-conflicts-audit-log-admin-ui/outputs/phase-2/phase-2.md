# Phase 2: 設計

## 目的

Phase 1 で固定したスコープ（dismiss を merge と対称化して audit_log に記録する）について、依存トポロジ・新シグネチャ・D1 batch 構造・audit_log 列マッピング・before/after_json 構造・merge との対称性・既存コンポーネント再利用・エラーハンドリング・SubAgent lane / validation path を設計する。

---

## 1. topology（依存トポロジ）

```
[ apps/web /admin/audit UI ]   ← 変更なし（再利用のみ）
        │  GET /admin/audit-logs?action=identity.dismiss&targetId=...
        ▼
[ apps/api route ]  routes/admin/identity-conflicts.ts
   POST /identity-conflicts/:id/dismiss
        │  dismissIdentityConflict(ctx, source, target, actorAdminId, actorAdminEmail, reason)
        ▼
[ apps/api repository ]  repository/identity-conflict.ts
   dismissIdentityConflict()
        │  db.batch([ upsert dismissals, insert audit_log ])
        ▼
[ Cloudflare D1 ]
   identity_conflict_dismissals  +  audit_log
```

- 依存方向: UI（web） → route（api） → repository（api） → D1。逆流なし。
- 変更が触れる層: **route + repository の 2 層のみ**（api 内に閉じる）。UI 層は不変。
- 不変条件: D1 アクセスは `apps/api` 限定（CLAUDE.md #5）を維持。`identity-conflict.ts` は `identity-merge.ts` から `redactIdentityReason` を import する（repository 内の横参照のみ）。

---

## 2. `dismissIdentityConflict()` の新シグネチャ

### Before（現状）

```ts
export async function dismissIdentityConflict(
  c: DbCtx,
  source: string,
  target: string,
  actorAdminId: string,
  reason: string,
): Promise<{ dismissedAt: string }>;
```

### After（設計）

```ts
export async function dismissIdentityConflict(
  c: DbCtx,
  source: string,
  target: string,
  actorAdminId: string,
  actorAdminEmail: string | null, // ← 新規追加（actorAdminId の直後）
  reason: string,
): Promise<{ dismissedAt: string }>; // 戻り値は不変
```

- 引数順序: merge の呼び出し規約（`actorAdminId` の直後に `actorAdminEmail`）に合わせ、`actorAdminEmail` を `actorAdminId` と `reason` の間に挿入する。
- 戻り値 `{ dismissedAt }` は **不変**（AC-6: endpoint surface 維持）。

---

## 3. D1 batch 構造

```ts
const dismissalId = crypto.randomUUID();
const auditLogId = crypto.randomUUID();
const dismissedAt = new Date().toISOString();
const reasonRedacted = redactIdentityReason(reason);
const beforeJson = JSON.stringify({
  sourceMemberId: source,
  targetMemberId: target,
});
const afterJson = JSON.stringify({
  dismissalId,
  dismissedAt,
});

const stmts = [
  // stmt1: 既存 upsert ロジックをそのまま prepare 化（ON CONFLICT 維持）
  c.db.prepare(
    `INSERT INTO identity_conflict_dismissals
       (dismissal_id, source_member_id, candidate_target_member_id,
        dismissed_by, reason, dismissed_at)
     VALUES (?1,?2,?3,?4,?5,?6)
     ON CONFLICT(source_member_id, candidate_target_member_id)
       DO UPDATE SET dismissal_id = excluded.dismissal_id,
                     dismissed_by = excluded.dismissed_by,
                     reason = excluded.reason,
                     dismissed_at = excluded.dismissed_at`,
  ).bind(dismissalId, source, target, actorAdminId, reasonRedacted, dismissedAt),

  // stmt2: audit_log INSERT（新規）
  c.db.prepare(
    `INSERT INTO audit_log
       (audit_id, actor_id, actor_email, action, target_type, target_id,
        before_json, after_json, created_at)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)`,
  ).bind(
    auditLogId,
    actorAdminId,
    actorAdminEmail ?? null,
    "identity.dismiss" as AuditAction, // または auditAction("identity.dismiss")
    "member",
    target,           // ← target_id = candidate target member（merge と統一: §6 参照）
    beforeJson,
    afterJson,
    dismissedAt,
  ),
];

if (typeof c.db.batch !== "function") {
  throw new DismissAtomicBatchUnavailable();
}
await c.db.batch(stmts);

return { dismissedAt };
```

- `reasonRedacted` は `identity_conflict_dismissals.reason` にのみ使う。`audit_log.after_json` は dismissal metadata のみに限定し、自由記述 reason を含めない。
- `AuditAction` brand は `as AuditAction` または `_shared/brand.ts` の `auditAction("identity.dismiss")`。merge は `as AuditAction` 形式のため、対称性のため `as AuditAction` を採用する（どちらでも可、Phase 3 で確認）。

---

## 4. audit_log INSERT 列マッピング表

| audit_log 列 | 設定値 | 由来 |
| ------------ | ------ | ---- |
| `audit_id` | `crypto.randomUUID()`（`auditLogId`） | 新規生成 |
| `actor_id` | `actorAdminId` | 既存引数 |
| `actor_email` | `actorAdminEmail ?? null` | **新規引数**（route で `user.email ?? null`） |
| `action` | `'identity.dismiss'`（`AuditAction` brand） | 命名規則: ドット区切り小文字 |
| `target_type` | `'member'` | merge と統一 |
| `target_id` | `target`（candidate target member id） | merge と統一（§6） |
| `before_json` | `JSON.stringify({ sourceMemberId, targetMemberId })` | §5 |
| `after_json` | `JSON.stringify({ dismissalId, dismissedAt })` | §5 |
| `created_at` | `dismissedAt`（ISO 8601） | merge は `mergedAt` を使用、対称 |

---

## 5. before_json / after_json 構造定義

### before_json

```jsonc
{
  "sourceMemberId": "<source>", // dismiss 対象 conflict の source
  "targetMemberId": "<target>"  // 候補ターゲット member
}
```

- 目的: merge の audit payload と同じ field 名で「どの source / target 関係を却下したか」を特定できる。`/admin/audit` の `targetId` フィルタ（= `target`）と併用すると target member 単位で絞り込める。

### after_json

```jsonc
{
  "dismissalId": "<uuid>", // 生成された dismissal レコード ID
  "dismissedAt": "<ISO>"   // 却下時刻
}
```

- 目的: 却下の結果 metadata を記録。`reason` は audit_log payload に入れず、PII 混入を防ぐ。

---

## 6. merge との対称性比較表

| 観点 | merge（`mergeIdentities`） | dismiss（本タスク後） | 対称性 |
| ---- | -------------------------- | --------------------- | ------ |
| atomicity | `db.batch([3 stmt])` | `db.batch([2 stmt])` | ✅ 同パターン |
| audit_log INSERT | あり（`identity.merge`） | あり（`identity.dismiss`） | ✅ |
| actor_email 受け渡し | endpoint → repo（`user.email ?? null`） | endpoint → repo（`user.email ?? null`） | ✅ |
| `target_type` | `'member'` | `'member'` | ✅ |
| `target_id` | `targetMemberId`（候補ターゲット） | `target`（候補ターゲット） | ✅ 統一 |
| before_json | `{sourceMemberId, targetMemberId, syncJobId}` | `{sourceMemberId, targetMemberId}` | ✅ field 名を統一 |
| after_json | `{aliasId, auditId, mergedAt}` | `{dismissalId, dismissedAt}` | ✅ reason は audit_log から除外 |
| reason redact | `redactIdentityReason()` | `redactIdentityReason()` | ✅ 同関数再利用 |
| batch 非対応 throw | `MergeAtomicBatchUnavailable` | `DismissAtomicBatchUnavailable` | ✅ 同パターン |
| `created_at` | `mergedAt` | `dismissedAt` | ✅ 操作時刻 |

> `target_id` の意味統一: merge / dismiss ともに **「候補ターゲット member（target）」** を `target_id` に格納する。これにより `/admin/audit` の `targetId` フィルタで同一 member に対する merge / dismiss 両操作を横断閲覧できる。

---

## 7. 既存コンポーネント再利用確認（FB-SDK-07-1）

| 再利用対象 | 内容 | 新規実装 |
| ---------- | ---- | -------- |
| `/admin/audit` UI（`AuditLogPanel.tsx` + `page.tsx`） | `action` 自由入力（placeholder="attendance.add"）+ actorEmail/targetType/targetId/期間フィルタを既備 → `action=identity.dismiss` で時系列閲覧・絞り込み可能 | **ゼロ** |
| `redactIdentityReason()`（identity-merge.ts） | PII redact 関数 | 既存 import |
| `auditAction` / `AuditAction`（_shared/brand.ts） | audit action brand | 既存利用 |
| `audit_log` テーブル（0003_auth_support.sql） | 監査ログ列 | スキーマ変更ゼロ |
| `db.batch` atomicity パターン（identity-merge.ts） | トランザクション骨格 | パターン踏襲 |

→ **新規 UI ゼロ・新規マイグレーションゼロ**。品質・アクセシビリティ・HIG 準拠は既存 `/admin/audit` レベルをそのまま継承する。

---

## 8. エラーハンドリング

| 状況 | 挙動 | 層 |
| ---- | ---- | -- |
| source / target member 不在 | `DismissIdentityNotFound(memberId)` を throw。route は 404 `MEMBER_NOT_FOUND` へ変換し、dismissal / audit_log は書かない | repository / route |
| `db.batch` 非対応環境 | `DismissAtomicBatchUnavailable` を throw（merge の `MergeAtomicBatchUnavailable` と同パターン。同じ Error 基底を踏襲） | repository |
| batch 内 D1 制約違反 | merge と異なり dismissals は upsert（ON CONFLICT）で衝突しないため、追加の制約 catch は原則不要。想定外エラーは route へ rethrow | repository |
| dismiss endpoint での `DismissAtomicBatchUnavailable` | 既存 endpoint surface を壊さない範囲で error handling（500 系へ。merge endpoint の既存方針に整合させる。新規 error code を surface に追加しない） | route |
| 不正 conflictId | 既存 `parseConflictId` の `BAD_CONFLICT_ID`（400）を維持 | route（不変） |
| reason バリデーション | 既存 `DismissIdentityConflictRequestZ.safeParse`（400）を維持 | route（不変） |

- `DismissAtomicBatchUnavailable` は `apps/api/src/repository/identity-conflict.ts` に定義する（merge は identity-merge.ts に `MergeAtomicBatchUnavailable` を持つため、同一 repository ファイルに置く対称配置）。
- `DismissIdentityNotFound` は `apps/api/src/repository/identity-conflict.ts` に定義し、merge の `MergeIdentityNotFound` と同じ 404 surface にそろえる。

---

## 9. SubAgent lane と validation path

### 実装 lane（3 並列以下）

| lane | 担当 | 出力 |
| ---- | ---- | ---- |
| lane-A（repository） | `dismissIdentityConflict()` の batch 化・audit_log INSERT・`DismissAtomicBatchUnavailable` 追加 | `identity-conflict.ts` 差分 |
| lane-B（route） | dismiss endpoint で `user.email ?? null` 引数追加・error handling | `identity-conflicts.ts` 差分 |
| lane-C（test） | RED→GREEN テスト（audit_log 記録 / atomicity / actorAdminEmail / batch 非対応 throw / endpoint surface 回帰） | `*.spec.ts` / `*.contract.spec.ts` |

- lane-A → lane-B（シグネチャ確定後に呼び出し側）の順依存。lane-C は lane-A/B と並行設計し、validation で直列に締める。

### validation path（直列）

```
pnpm typecheck
  → pnpm lint
  → vitest（identity-conflict 関連 spec を targeted run）
  → node scripts/validate-phase-output.js docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui
```

- targeted run: メモリ制約に配慮し、`identity-conflict` / `identity-conflicts` を含む spec ファイルに限定して vitest を実行する（Phase 1 [FB-UI-02-2] 事前列挙）。
