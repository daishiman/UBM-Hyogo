# Phase 2 — Endpoint 仕様 (zod schema 詳細)

実体は `apps/api/src/routes/me/schemas.ts` を参照。

## GET /me

```ts
const MeSessionUserZ = z.object({
  memberId: z.string().min(1),
  responseId: z.string().min(1),
  email: z.string().email(),
  isAdmin: z.boolean(),
  authGateState: z.enum(["active", "rules_declined", "deleted"]),
}).strict();

export const MeSessionResponseZ = z.object({
  user: MeSessionUserZ,
  authGateState: z.enum(["active", "rules_declined", "deleted"]),
}).strict();
```

- 401: `{ code: "UNAUTHENTICATED" }`
- 410: `{ code: "DELETED", authGateState: "deleted" }`

## GET /me/profile

```ts
export const MeProfileResponseZ = z.object({
  profile: MemberProfileZ,
  statusSummary: z.object({
    publicConsent: z.enum(["consented","declined","unknown"]),
    rulesConsent: z.enum(["consented","declined","unknown"]),
    publishState: z.enum(["public","hidden","member_only"]),
    isDeleted: z.literal(false),
  }),
  editResponseUrl: z.string().url().nullable(),
  fallbackResponderUrl: z.string().url(),
}).strict();
```

- `notes` / `adminNotes` キー禁止 (strict + MemberProfileZ.strict)。

## POST /me/visibility-request

```ts
export const MeVisibilityRequestBodyZ = z.object({
  desiredState: z.enum(["hidden", "public"]),
  reason: z.string().max(500).optional(),
}).strict();
```

response 202: `MeQueueAcceptedResponseZ` ({ queueId, type: 'visibility_request', status: 'pending', createdAt })

- 409: `{ code: "DUPLICATE_PENDING_REQUEST" }`
- 422: `{ code: "INVALID_REQUEST", issues }`
- 429: `{ code: "RATE_LIMITED", retryAfter }` + `Retry-After` header
- 403: `{ code: "RULES_NOT_ACCEPTED" }`

## POST /me/delete-request

```ts
export const MeDeleteRequestBodyZ = z.object({
  reason: z.string().max(500).optional(),
}).strict();
```

response 202 / 409 / 422 / 429 / 403 は visibility-request と同様。
