# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-backoffice-api-endpoints |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

採用案 A を実装する手順を runbook + 擬似コードで固定する。本タスクは spec_created なのでコードを書かないが、後続実装タスクが順番通りに迷わず実装できる粒度の placeholder を残す。

## Runbook

### Step 1: admin gate middleware

1. `apps/api/src/middleware/admin-gate.ts` を作成
2. session middleware を通過した後の `c.get('user').email` を `admin_users` repository に問い合わせる
3. 不一致 → 403 + `{ code: 'NOT_ADMIN' }`、memberId 等を一切露出しない
4. 一致 → `c.set('admin', adminUser)` を注入

### Step 2: audit-trail middleware

1. `apps/api/src/middleware/audit-trail.ts` を作成
2. handler 完了後に `c.req.method !== 'GET'` のみ `audit_log.record({ action, target, who })` を呼ぶ
3. action は handler が `c.set('auditAction', '...')` で前置宣言

### Step 3: router mount

1. `apps/api/src/routes/admin/index.ts` で `app.use('/admin/*', sessionMiddleware, adminGateMiddleware, auditTrailMiddleware)` を install
2. その後に各 sub-router を `app.route('/admin/dashboard', dashboardRouter)` 等で mount
3. PATCH /admin/members/:memberId/profile / PATCH /admin/members/:memberId/tags を絶対に mount しない

### Step 4: handler 実装（18 endpoint）

1. dashboard / members / member detail（read）
2. status / notes / delete / restore（mutation）
3. tag queue resolve
4. schema diff / aliases
5. meetings / attendance
6. sync trigger

### Step 5: services

1. `services/admin-view-model-builder.ts`: dashboard / list / detail を組成、削除済み除外、notes 含有制御
2. `services/sync-job-launcher.ts`: hasActive / append、cron worker 連携
3. `services/admin-mutation-helpers.ts`: status 更新 + audit を 1 transaction で

### Step 6: test 走らせる

- `pnpm --filter api test admin/*.test.ts` で全 18 endpoint test pass
- authz test が全 pass するまで Phase 6 に進まない

## 擬似コード

```ts
// apps/api/src/middleware/admin-gate.ts (placeholder)
export const adminGateMiddleware: MiddlewareHandler = async (c, next) => {
  const user = c.get('user');
  if (!user?.email) {
    return c.json({ code: 'UNAUTHENTICATED' }, 401);
  }
  const adminUser = await adminUsersRepo.findByEmail(user.email);
  if (!adminUser) {
    return c.json({ code: 'NOT_ADMIN' }, 403);
  }
  c.set('admin', adminUser);
  return next();
};

// apps/api/src/routes/admin/dashboard.ts (placeholder)
export const dashboardRouter = new Hono()
  .get('/', async (c) => {
    const view = await adminViewModelBuilder.dashboard();
    return c.json<AdminDashboardResponse>(view);
  });

// apps/api/src/routes/admin/members/patch-status.ts (placeholder)
export const patchMemberStatusHandler: Handler = async (c) => {
  const memberId = c.req.param('memberId');
  const body = await PatchMemberStatusBodySchema.parseAsync(await c.req.json());
  c.set('auditAction', 'admin.member.status.update');
  c.set('auditTarget', memberId);
  const status = await adminMutationHelpers.updateMemberStatus(memberId, body);
  return c.json({ memberId, ...status });
};

// apps/api/src/routes/admin/tags/queue.ts (placeholder)
export const resolveTagQueueHandler: Handler = async (c) => {
  const queueId = c.req.param('queueId');
  const body = await ResolveTagQueueBodySchema.parseAsync(await c.req.json());
  c.set('auditAction', 'admin.tag.queue.resolve');
  c.set('auditTarget', queueId);
  const result = await tagQueueRepo.resolve(queueId, body.tagCodes, body.resolverNote);
  return c.json({ queueId, status: 'resolved', appliedTags: result.appliedTags });
};

// apps/api/src/routes/admin/meetings/attendance.ts (placeholder)
export const postAttendanceHandler: Handler = async (c) => {
  const sessionId = c.req.param('sessionId');
  const body = await PostAttendanceBodySchema.parseAsync(await c.req.json());
  const memberStatus = await memberStatusRepo.findByMemberId(body.memberId);
  if (memberStatus?.isDeleted) {
    return c.json({ code: 'DELETED_MEMBER' }, 422);
  }
  try {
    const att = await attendanceRepo.add(sessionId, body.memberId);
    c.set('auditAction', 'admin.attendance.add');
    c.set('auditTarget', `${sessionId}:${body.memberId}`);
    return c.json({ sessionId, memberId: body.memberId, attendedAt: att.attendedAt }, 201);
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return c.json({ code: 'DUPLICATE_ATTENDANCE' }, 409);
    }
    throw e;
  }
};

// apps/api/src/routes/admin/sync.ts (placeholder)
export const syncSchemaHandler: Handler = async (c) => {
  const active = await syncJobsRepo.findActive('schema_sync');
  if (active) {
    return c.json({ code: 'SYNC_ALREADY_RUNNING', activeJobId: active.jobId }, 409);
  }
  const jobId = await syncJobsRepo.append({ type: 'schema_sync', status: 'queued' });
  c.set('auditAction', 'admin.sync.schema.trigger');
  c.set('auditTarget', jobId);
  return c.json({ jobId, status: 'queued', startedAt: new Date().toISOString() }, 202);
};
```

## Sanity check

- [ ] PATCH /admin/members/:memberId/profile が router に mount されていない
- [ ] PATCH /admin/members/:memberId/tags が router に mount されていない
- [ ] GET /admin/members レスポンス型に notes プロパティがない
- [ ] schema 変更 endpoint が `/admin/schema/diff` と `/admin/schema/aliases` のみ
- [ ] POST attendance が削除済み会員で 422 を返す path がある
- [ ] POST attendance が UNIQUE 違反で 409 を返す path がある
- [ ] sync trigger が 202 + jobId を返し、active 中は 409
- [ ] 全 mutation で auditAction が context にセットされる

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | 管理操作 |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | tag queue |
| 必須 | doc/00-getting-started-manual/specs/07-edit-delete.md | status / delete |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | runbook の異常系検証 |
| Phase 7 | AC matrix の row を runbook step と紐付け |
| Phase 8 | middleware 共通化を DRY 化で評価 |

## 多角的チェック観点（不変条件マッピング）

- #4 / #11: PATCH 系 module を Sanity check で禁止
- #12: handler が response 型に notes を含めない
- #13: tag PATCH を Sanity check で禁止
- #14: schema 変更 endpoint を 2 本に集約
- #15: attendance 409 / 422 path を Sanity check

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | runbook 6 step 確定 | 5 | pending | outputs/phase-05/runbook.md |
| 2 | 擬似コード 主要 5 endpoint | 5 | pending | outputs/phase-05/pseudocode.md |
| 3 | sanity check | 5 | pending | 8 項目 |
| 4 | apps/api/src 配置確認 | 5 | pending | path レベルで一意 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | Phase 5 主成果物 |
| ドキュメント | outputs/phase-05/runbook.md | 6 step 詳細 |
| ドキュメント | outputs/phase-05/pseudocode.md | 主要 endpoint placeholder |
| メタ | artifacts.json | Phase 5 を completed に更新 |

## 完了条件

- [ ] 6 step が順序付きで記述
- [ ] 主要 endpoint の擬似コードが配置
- [ ] Sanity check 8 項目が pass する設計
- [ ] 上流 02b / 02c / 03a / 03b の helper 名が runbook 内に登場

## タスク100%実行確認【必須】

- 全実行タスク completed
- 全成果物配置済み
- 全完了条件チェック
- artifacts.json の Phase 5 を completed に更新

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ事項: runbook の step ごとに失敗系シナリオを洗い出す
- ブロック条件: 擬似コードに PATCH /admin/members/:memberId/profile or tags が紛れていれば次 Phase に進まない
