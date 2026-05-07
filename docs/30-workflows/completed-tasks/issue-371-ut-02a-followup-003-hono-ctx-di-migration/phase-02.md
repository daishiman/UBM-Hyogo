# Phase 2: 設計

実装区分: 実装仕様書

## 2.1 全体構成

```
HTTP request
  └─ Hono app (me / admin/members)
       ├─ session-guard middleware  (既存)
       ├─ require-admin middleware  (admin のみ、既存)
       ├─ attendanceProviderMiddleware  ★ 新設
       │     c.set("attendanceProvider", createAttendanceProvider(dbCtx))
       └─ route handler
             └─ buildMemberProfile(providerCtx, mid)   ← deps 引数なし
                    └─ fetchAttendanceFor(mid, c.var.attendanceProvider)
                          provider undefined → throw
```

## 2.2 新規 / 変更ファイル一覧（CONST_005）

| # | パス | 種別 | 概要 |
| --- | --- | --- | --- |
| F1 | `apps/api/src/middleware/repository-providers.ts` | 新規 | `attendanceProviderMiddleware` / `RepositoryProviderVariables` を export |
| F2 | `apps/api/src/middleware/repository-providers.test.ts` | 新規 | middleware 単体テスト |
| F3 | `apps/api/src/repository/_shared/builder.ts` | 編集 | `deps?` 削除、`c.var.attendanceProvider` 解決、fallback throw 化、`RepositoryProviderCtx` 合成型追加（既存 `DbCtx` は変更しない） |
| F4 | `apps/api/src/repository/_shared/builder.test.ts` | 編集 | mock 注入を `c.var.attendanceProvider` set に統一 |
| F5 | `apps/api/src/repository/__tests__/builder.test.ts` | 編集 | 同上 |
| F6 | `apps/api/src/routes/me/index.ts` | 編集 | middleware 結線、call site から `{ attendanceProvider }` 削除、`Variables` 型合成 |
| F7 | `apps/api/src/routes/admin/members.ts` | 編集 | 同上 |
| F8 | （任意）`apps/api/src/middleware/types.ts` | 新規 or 既存編集 | 横断的 Variables 集約（既存ファイルがあれば編集、なければ F1 内に同梱） |

## 2.3 主要シグネチャ

```ts
// F1: apps/api/src/middleware/repository-providers.ts
import type { MiddlewareHandler } from "hono";
import { createAttendanceProvider } from "../repository/attendance";
import type { AttendanceProvider } from "../repository/attendance";

export type RepositoryProviderVariables = {
  attendanceProvider: AttendanceProvider;
};

export const attendanceProviderMiddleware: MiddlewareHandler<{
  Bindings: { DB: D1Database };
  Variables: RepositoryProviderVariables;
}> = async (c, next) => {
  const dbCtx = c.get("ctx");
  c.set("attendanceProvider", createAttendanceProvider(dbCtx));
  await next();
};
```

```ts
// F3: apps/api/src/repository/_shared/builder.ts (差分方針)
import type { DbCtx } from "./db";
import type { RepositoryProviderVariables } from "../../middleware/repository-providers";

type RepositoryProviderCtx = DbCtx & {
  var: RepositoryProviderVariables;
};

const fetchAttendanceFor = async (
  mid: MemberId,
  provider: AttendanceProvider | undefined,
): Promise<AttendanceRecord[]> => {
  if (!provider) {
    throw new Error(
      "attendanceProvider not bound to context",
    );
  }
  const map = await provider.findByMemberIds([mid]);
  return [...(map.get(mid) ?? [])];
};

export async function buildMemberProfile(
  c: RepositoryProviderCtx,
  mid: MemberId,
): Promise<MemberProfile | null> {
  // ...既存ロジック維持...
  const [, , , , attendance] = await Promise.all([
    /* 他 */,
    fetchAttendanceFor(mid, c.var.attendanceProvider),
  ]);
}

export async function buildAdminMemberDetailView(
  c: RepositoryProviderCtx,
  mid: MemberId,
  adminNotes: Array<{ actor: AdminId; action: string; occurredAt: string; note: string | null }>,
): Promise<AdminMemberDetailView | null> {
  // 同上
}
```

```ts
// F6: apps/api/src/routes/me/index.ts (差分方針)
import { attendanceProviderMiddleware, type RepositoryProviderVariables } from "../../middleware/repository-providers";

const app = new Hono<{
  Bindings: MeRouteEnv;
  Variables: SessionGuardVariables & RepositoryProviderVariables;
}>();

app.use("*", attendanceProviderMiddleware);

// route handler:
const dbCtx = c.get("ctx");
const profile = await buildMemberProfile(
  { ...dbCtx, var: { attendanceProvider: c.var.attendanceProvider } },
  user.memberId,
);  // deps 引数を削除
```

```ts
// F7: apps/api/src/routes/admin/members.ts (差分方針)
import { attendanceProviderMiddleware, type RepositoryProviderVariables } from "../../middleware/repository-providers";

// app generic に Variables 合成し、admin gate 後段で middleware 結線
app.use("*", attendanceProviderMiddleware);

// route handler:
const dbCtx = c.get("ctx");
const view = await buildAdminMemberDetailView(
  { ...dbCtx, var: { attendanceProvider: c.var.attendanceProvider } },
  mid,
  adminAudit,
);  // deps 引数を削除
```

## 2.4 入力 / 出力 / 副作用

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `attendanceProviderMiddleware` | Hono context | next 呼び出し | `c.set("attendanceProvider", ...)` |
| `buildMemberProfile` | `c, mid` | `MemberProfile | null` | なし（read only） |
| `buildAdminMemberDetailView` | `c, mid, adminNotes` | `AdminMemberDetailView | null` | なし |
| `fetchAttendanceFor` | `mid, provider` | `AttendanceRecord[]` | provider 未注入時 throw |

## 2.5 結線順序ルール

1. session-guard / require-admin（既存 auth 系）
2. **attendanceProviderMiddleware**（auth が決まった後で provider を bind）
3. route handler

理由: future の provider に「current admin だけが見られる X」が混入した際にも auth の後段に置くポリシーで一貫させる。

## 2.6 後続フェーズ引き渡し

- Phase 3: 3 alternatives ADR
- Phase 4: テスト戦略（mock 注入経路、provider 未注入時 throw 検証 等）
