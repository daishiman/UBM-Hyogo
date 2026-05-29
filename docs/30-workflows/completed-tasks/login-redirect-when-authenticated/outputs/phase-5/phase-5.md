# Phase 5 — 実装（TDD Green）

## 1. 新規ファイル一覧

| # | パス                                              | 種別 | 目的                                  |
| - | ------------------------------------------------- | ---- | ------------------------------------- |
| 1 | `apps/web/src/lib/url/safe-next.ts`               | 新規 | 純関数 `safeNext`                     |
| 2 | `apps/web/src/lib/url/__tests__/safe-next.spec.ts`| 新規 | Phase 4 で記述                        |
| 3 | `apps/web/app/login/page.tsx`                     | 編集 | session check + redirect 追加         |
| 4 | `apps/web/app/login/__tests__/page.spec.tsx`      | 編集 or 新規 | Phase 4 ケース 4 件                |

## 2. `safe-next.ts` 実装

```ts
// apps/web/src/lib/url/safe-next.ts
import { isSafeInternalRedirect } from "./safe-redirect";

const MAX_NEXT_LENGTH = 256;

export const safeNext = (raw: unknown): string | null => {
  if (typeof raw !== "string") return null;
  if (raw.length === 0 || raw.length > MAX_NEXT_LENGTH) return null;
  if (raw.includes(":")) return null;
  if (!isSafeInternalRedirect(raw)) return null;
  return raw;
};
```

副作用なし / throw なし。既存 `isSafeInternalRedirect` を再利用し、`/login` 自己ループ拒否を分裂させない。

## 3. `page.tsx` 編集 diff

```diff
+import { redirect } from "next/navigation";
+
+import { getSession } from "../../src/lib/session";
 import { parseLoginQuery } from "../../src/lib/url/login-query";
+import { safeNext } from "../../src/lib/url/safe-next";
 import { LoginCard } from "./_components/LoginCard";
 ...

 export default async function LoginPage({ searchParams }: LoginPageProps) {
   const raw = (await searchParams) ?? {};
+  const session = await getSession();
+  if (session) {
+    const nextRaw = raw["next"];
+    const next = safeNext(Array.isArray(nextRaw) ? nextRaw[0] : nextRaw);
+    redirect(next ?? "/profile");
+  }
   const q = parseLoginQuery(raw);
   ...
 }
```

## 4. 実装手順（順序）

1. `safe-next.ts` を作成（Phase 4 spec が green になる）
2. `safe-next.spec.ts` を実行 → 10/10 PASS 確認
3. `page.tsx` 編集
4. `page.spec.tsx` 更新 → TC-1〜TC-4 PASS 確認
5. `pnpm typecheck` / `pnpm lint` green 確認

## 5. ローカル検証

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/lib/url/__tests__/safe-next.spec.ts \
  apps/web/app/login/__tests__/page.spec.tsx
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 6. DoD（Phase 5）

- [ ] `safeNext` 10/10 PASS
- [ ] `/login` page.spec.tsx 4/4 PASS（TC-1〜TC-4）
- [ ] typecheck green
- [ ] lint green

## 7. 注意

- `redirect()` は throw 経由で制御を奪う。後続の `parseLoginQuery` 等は logged-in 経路では実行されない。
- `getSession()` 内部例外は既存挙動（null 返却）に委譲。本タスクで try/catch しない。
