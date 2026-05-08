# Phase 2: 設計

[実装区分: 実装仕様書]

## 設計方針

`attendanceProviderMiddleware` を壊さず、Phase 3 ADR で確定した 6 provider だけを追加する。provider は repository 関数の薄い束に留め、DI container・service locator・global singleton は導入しない。

## 確定移行セット

| provider | scope |
| --- | --- |
| `adminNotesProvider` | self request と admin request/member-note 系の note read/write |
| `auditLogProvider` | request / note / tag workflow の append と `/admin/audit` read-only browsing |
| `notificationOutboxProvider` | admin request resolve 後の best-effort enqueue と dispatch tick の outbox operations |
| `tagDefinitionsProvider` | `tagQueueResolve` unknown-tag / code lookup |
| `tagQueueProvider` | resolve / retry / DLQ state transition に必要な queue operations |
| `memberTagsProvider` | `tagQueueResolve` 専用の confirmed tag attach helper のみ。一般 route write method は載せない |

## 型設計

`apps/api/src/repository/_shared/provider-context.ts`:

```ts
export type WriteTagNoteProviderVariables = {
  adminNotesProvider: AdminNotesProvider;
  auditLogProvider: AuditLogProvider;
  notificationOutboxProvider: NotificationOutboxRepository;
  tagDefinitionsProvider: TagDefinitionsProvider;
  tagQueueProvider: TagQueueProvider;
  memberTagsProvider: MemberTagsProvider;
};

export type RepositoryProviderVariables =
  AttendanceProviderVariables & Partial<WriteTagNoteProviderVariables>;

export type WriteTagNoteProviderCtx = DbCtx & {
  readonly var: WriteTagNoteProviderVariables;
};
```

各 provider 未注入時の helper:

```ts
export function requireProvider<T>(provider: T | undefined, name: string): T {
  if (!provider) throw new Error(`${name} not bound to context`);
  return provider;
}
```

`RepositoryProviderVariables` は既存 route が段階的に middleware を mount できるよう `Partial` を維持する。provider を使う service / workflow の入口では `requireProvider` を通して `WriteTagNoteProviderCtx` 相当に narrow し、実処理内では required provider として扱う。

## provider factory

```ts
export const createAdminNotesProvider = (c: DbCtx): AdminNotesProvider => ({
  create: (input) => create(c, input),
  findById: (noteId) => findById(c, noteId),
  listPendingRequests: (input) => listPendingRequests(c, input),
  hasPendingRequest: (memberId, type) => hasPendingRequest(c, memberId, type),
  findLatestPendingByMemberAndType: (memberId, type) =>
    findLatestPendingByMemberAndType(c, memberId, type),
  markResolved: (noteId, actorId) => markResolved(c, noteId, actorId),
  markRejected: (noteId, actorId, reason) => markRejected(c, noteId, actorId, reason),
});
```

`auditLog` / `tagDefinitions` / `tagQueue` / `memberTags` も同じ構造にする。`notificationOutbox` は既存 `createOutboxRepository(c)` を provider としてそのまま使う。

Phase 3 の判定では上記 6 provider を確定移行セットとする。これ以外の repository は本タスクでは型に追加しない。

## middleware

`apps/api/src/middleware/repository-providers.ts`:

```ts
export const writeTagNoteProviderMiddleware: MiddlewareHandler<{
  Bindings: RepositoryProviderEnv;
  Variables: RepositoryProviderVariables & { ctx?: DbCtx };
}> = async (c, next) => {
  const existing = c.get("ctx");
  const dbCtx = existing ?? makeCtx({ DB: c.env.DB });
  c.set("adminNotesProvider", createAdminNotesProvider(dbCtx));
  c.set("auditLogProvider", createAuditLogProvider(dbCtx));
  c.set("notificationOutboxProvider", createOutboxRepository(dbCtx));
  c.set("tagDefinitionsProvider", createTagDefinitionsProvider(dbCtx));
  c.set("tagQueueProvider", createTagQueueProvider(dbCtx));
  c.set("memberTagsProvider", createMemberTagsProvider(dbCtx));
  await next();
};
```

## call site 設計

- `/me/*`: `memberSelfRequestQueue` の入力を `WriteTagNoteProviderCtx` に変更し、`adminNotesProvider` / `auditLogProvider` を使う。
- `/admin/requests`: `listPendingRequests` / note resolve / outbox enqueue を provider 経由にする。既存 `outboxFactory` deps は provider mock で置換し、段階移行後に削除できる。
- `/admin/member-notes`: note CRUD と audit append を provider 経由にする。
- `/admin/audit`: `auditLogProvider.listFiltered` を使う。
- `/admin/tags-queue`: `tagQueueResolve(c.var provider ctx, input)` に変更する。
- `tagQueueResolve`: `findTagDefinitionByCode` / `getStatus` / member tag insert / audit insert のうち本タスク対象 provider を注入する。`status` repository は今回対象外なので direct call を維持してよい。

## scheduled workflow provider path

Hono `c.var` が存在しない scheduled workflow は、route と同じ provider interface を受け取る明示 bundle で実行する。

```ts
export type WriteTagNoteProviderBundle = WriteTagNoteProviderVariables;

export const createWriteTagNoteProviderBundle = (ctx: DbCtx): WriteTagNoteProviderBundle => ({
  adminNotesProvider: createAdminNotesProvider(ctx),
  auditLogProvider: createAuditLogProvider(ctx),
  notificationOutboxProvider: createOutboxRepository(ctx),
  tagDefinitionsProvider: createTagDefinitionsProvider(ctx),
  tagQueueProvider: createTagQueueProvider(ctx),
  memberTagsProvider: createMemberTagsProvider(ctx),
});
```

`tagQueueRetryTick` / `notificationDispatchTick` は Hono ctx を要求せず、`WriteTagNoteProviderBundle` または個別 provider を引数で受け取る。

## dependency matrix

| 共有モジュール | 用途 | owner | co-owner | 同期タイミング |
| --- | --- | --- | --- | --- |
| `apps/api/src/repository/_shared/provider-context.ts` | provider ctx / bundle 型 | Issue #532 implementation | Issue #371 Hono ctx DI migration | 実装 wave 冒頭 |
| `apps/api/src/middleware/repository-providers.ts` | Hono middleware bind | Issue #532 implementation | Issue #371 Hono ctx DI migration | middleware 追加時 |
| `apps/api/src/workflows/tagQueueResolve.ts` | tag provider consumer | Issue #532 implementation | tag queue workflow owners | focused tests 前 |
| `apps/api/src/repository/memberTags.ts` | workflow-scoped write helper | Issue #532 implementation | member tags read-only test owner | type-level test 前 |

## validation matrix

| Command | Purpose | Expected |
| --- | --- | --- |
| `rg --files apps/api/src | rg 'repository/(adminNotes|auditLog|notificationOutbox|tagDefinitions|tagQueue|memberTags)|routes/(me|admin)|workflows/(tagQueue|notification)'` | 既存パス実在確認 | target files exist |
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | provider type compatibility | exit 0 |
| `mise exec -- pnpm --filter @ubm-hyogo/api lint` | lint gate | exit 0 |
| `mise exec -- pnpm --filter @ubm-hyogo/api test -- repository-providers routes/me routes/admin/requests routes/admin/member-notes routes/admin/audit workflows/tagQueueResolve workflows/tagQueueRetryTick workflows/notificationDispatchTick` | focused behavior | exit 0 |
| `mise exec -- pnpm --filter @ubm-hyogo/api test` | package regression | exit 0 |
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | read-only type boundary | exit 0 |
| `bash scripts/coverage-guard.sh --package @ubm-hyogo/api` | coverage guard | exit 0 |
| `rg -n "repository/(adminNotes|auditLog|notificationOutbox|tagDefinitions|tagQueue|memberTags)" apps/api/src/routes apps/api/src/workflows apps/api/src/use-cases` | direct import gate | no unapproved route/workflow imports |
| `rg -n "deps\\?|container|serviceLocator|globalProvider|\\?\\? \\[\\]|\\|\\| \\[\\]" apps/api/src` | fallback / over-abstraction gate | no task-introduced hits |

## 完了条件

- [x] 主要 provider interface と middleware signature が仕様化されている。
- [x] route/workflow ごとの入力型と副作用が明確である。
- [x] 既存 response shape と D1 schema への非変更が明記されている。
- [x] focused changed-path tests / typecheck / lint / grep gates は PASS として記録済み。
- [ ] full coverage threshold は PR 前 verification debt。`docs/30-workflows/unassigned-task/task-issue-532-api-full-coverage-rerun-miniflare-port-exhaustion-001.md` を完了または blocker 記録してから PR 作成へ進む。`coverage-guard.sh --package -hyogo/api` は PASS/NO-OP であり threshold PASS とは扱わない。

## メタ情報

- task_id: issue-532-extend-ctx-injection-to-write-tag-note-providers
- taskType: implementation
- visualEvidence: NON_VISUAL
- state: implemented-local

## 目的

Issue #371 の Hono ctx provider pattern を write/tag/note repository へ必要最小限で展開するため、この Phase の判断・作業・証跡を固定する。

## 実行タスク

- Phase 本文の判断を確認する。
- 関連する証跡・完了条件を更新する。
- 後続 Phase との依存を確認する。

## 参照資料

- `index.md`
- `artifacts.json`
- `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-03/adr-di-strategy.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 実行手順

1. 対象ファイルと依存関係を確認する。
2. Phase 固有の判断を本文に反映する。
3. 完了条件と成果物の整合を確認する。

## 成果物

- この Phase の Markdown 本文。
- 必要な場合は `outputs/phase-N/` 配下の補助証跡。

## タスク100%実行確認【必須】

- [x] 仕様作成 wave と実装 evidence wave の境界を明記した。
- [x] commit / push / PR は実行していない。

## 次Phase

- 次の Phase は `artifacts.json` の phase order に従う。

## 統合テスト連携

- NON_VISUAL API/internal refactor のため、focused tests、typecheck、lint、coverage guard、grep gate を Phase 11 evidence に集約する。

## 多角的チェック観点（AIが判断）

- 30種思考法の compact evidence に基づき、矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## サブタスク管理

- 本 workflow 内で完結する改善は同一 cycle で反映する。未タスク化は技術的・整合性的に分離が必要な場合だけ行う。
