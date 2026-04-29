# Phase 5 — Pseudocode (実コードに収束済)

実装は `apps/api/src/routes/me/index.ts` を参照。以下は要点のみ。

```ts
// sessionGuard
const session = await deps.resolveSession(c.req.raw);
if (!session) return c.json({ code: "UNAUTHENTICATED" }, 401);
const [identity, status] = await Promise.all([findIdentityByMemberId(...), getStatus(...)]);
if (!identity || !status) return c.json({ code: "UNAUTHENTICATED" }, 401);
if (status.is_deleted === 1) return c.json({ code: "DELETED", authGateState: "deleted" }, 410);
const authGateState = status.rules_consent === "consented" ? "active" : "rules_declined";
const isAdmin = (await findAdminByEmail(...))?.active === true;
c.set("user", { memberId, responseId, email, isAdmin, authGateState });
c.set("ctx", ctx);
```

```ts
// POST /me/visibility-request
const parsed = MeVisibilityRequestBodyZ.safeParse(await c.req.json().catch(() => null));
if (!parsed.success) return c.json({ code: "INVALID_REQUEST", issues }, 422);
if (await memberSelfRequestQueue.hasPending(ctx, memberId, "visibility_request"))
  return c.json({ code: "DUPLICATE_PENDING_REQUEST" }, 409);
const result = await memberSelfRequestQueue.appendVisibility({ ... });
return c.json(result, 202);
```
