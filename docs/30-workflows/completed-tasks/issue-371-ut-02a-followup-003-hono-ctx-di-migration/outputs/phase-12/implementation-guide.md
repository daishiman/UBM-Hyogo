# Implementation Guide

## Part 1: 中学生レベル

これまで「どのテストデータを使うか」をお店で言うときに、注文するたびに毎回伝えていた。
これからは入口で店員さんに一度だけ伝えれば、その後の注文に自動でついてくる仕組みに変える。
引数（注文の付け足し）が減るので、メニューが増えても注文の手間が増えない。
もし入口で言い忘れたら、お店は「忘れてるよ」と即座に返す。黙って空っぽを返さない。

| 用語 | 日常語での言い換え |
| --- | --- |
| builder | 注文を組み立てる係 |
| provider | 必要な材料を持ってくる係 |
| Hono context | 入口で渡す共通メモ |
| middleware | 入口で準備する係 |
| fallback | 困った時の仮の返事 |

## Part 2: 技術者レベル

### Target API

Old:

```ts
buildMemberProfile(c, mid, deps?)
buildAdminMemberDetailView(c, mid, adminNotes, deps?)
```

New:

```ts
buildMemberProfile(c, mid)
buildAdminMemberDetailView(c, mid, adminNotes)
```

### Provider Path

```ts
app.use("*", attendanceProviderMiddleware)
```

The middleware builds the provider from the existing `DbCtx` and binds it to Hono variables:

```ts
const dbCtx = c.get("ctx")
c.set("attendanceProvider", createAttendanceProvider(dbCtx))
```

The existing `DbCtx` remains `readonly db`. Attendance builders use a composed context:

```ts
type RepositoryProviderCtx = DbCtx & {
  var: RepositoryProviderVariables
}
```

Builders resolve:

```ts
const provider = c.var.attendanceProvider
```

If the provider is missing, throw exactly:

```ts
throw new Error("attendanceProvider not bound to context")
```

### Type Boundary

Add or reuse a narrow variable type:

```ts
type RepositoryProviderVariables = {
  attendanceProvider: AttendanceProvider
}
```

Route `Variables` should combine this with the existing session/admin guard variables. Do not widen global Hono variables beyond the routes that need this provider.

### Verification

The implementation cycle created Phase 11 logs for typecheck, lint, test, build, and grep gates. With those logs present, this workflow is `implemented-local / code evidence captured / runtime smoke pending`.

### Edge Cases

| Case | Expected behavior |
| --- | --- |
| `attendanceProvider` missing from builder context | Throw `Error("attendanceProvider not bound to context")`; do not return `attendance: []` silently |
| Upstream `ctx` already exists (sessionGuard path) | `attendanceProviderMiddleware` reuses `c.get("ctx")` and does not create a second DB context |
| Upstream `ctx` absent (admin route path) | middleware creates `DbCtx` from `c.env.DB` and binds the provider |
| `AttendanceProvider.findByMemberIds()` returns no row | `attendance` is an empty array from the provider result, not from missing-provider fallback |
| Public profile builders | unchanged; they continue to accept plain `DbCtx` and do not require `var.attendanceProvider` |

### Configurable Parameters / Constants

| Name | Location | Value / contract |
| --- | --- | --- |
| Hono variable key | `apps/api/src/repository/_shared/provider-context.ts` | `attendanceProvider` |
| Middleware export | `apps/api/src/middleware/repository-providers.ts` | `attendanceProviderMiddleware` |
| Missing-provider error | `apps/api/src/repository/_shared/builder.ts` | `attendanceProvider not bound to context` |
| Provider source | `apps/api/src/repository/attendance.ts` | `createAttendanceProvider(dbCtx)` |
| DB binding | route `Bindings` | `DB: D1Database` |
