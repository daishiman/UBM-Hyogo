# Phase 5: 実装ランブック詳細（6 step）

> Phase 5 サブ成果物。各 step に必要なコマンドと sanity チェックを記録する。

## step 1: package init

```bash
mkdir -p packages/shared/src/{branded,types,zod,utils,test}
mkdir -p packages/integrations/google/src/{forms,test}
pnpm -F @ubm-hyogo/shared init -y
pnpm -F @ubm-hyogo/integrations-google init -y
```

sanity:
- `mise exec -- pnpm -w typecheck` PASS（empty barrel 状態）

## step 2: branded type 7 種

ファイル: `packages/shared/src/branded/index.ts`

```ts
type Brand<T, B> = T & { readonly __brand: B };
export type MemberId = Brand<string, "MemberId">;
export type ResponseId = Brand<string, "ResponseId">;
export type ResponseEmail = Brand<string, "ResponseEmail">;
export type StableKey = Brand<string, "StableKey">;
export type SessionId = Brand<string, "SessionId">;
export type TagId = Brand<string, "TagId">;
export type AdminId = Brand<string, "AdminId">;

export const asMemberId = (s: string): MemberId => s as MemberId;
// 各 branded 用の as* を export
```

sanity:
- type-level test: `MemberId` を `ResponseId` に代入 → tsc error

## step 3: 型 4 層

ファイル: `packages/shared/src/types/{schema,response,identity,viewmodel}/index.ts`

```ts
// schema
export interface FormSchema { formId: string; title: string; sections: FormSection[]; }

// response
export interface FormResponse {
  responseId: ResponseId;
  responseEmail: ResponseEmail;
  submittedAt: string;
  answers: FormResponseAnswer[];
}

// identity
export interface MemberIdentity {
  memberId: MemberId;
  responseEmail: ResponseEmail;
  currentResponseId?: ResponseId;
}

// viewmodel（10 種）
export interface PublicStatsView { memberCount: number; ... }
// ... PublicMemberListView / PublicMemberProfile / FormPreviewView /
//     SessionUser / MemberProfile / AdminDashboardView /
//     AdminMemberListView / AdminMemberDetailView / AuthGateState
```

sanity:
- `tsc --noEmit` PASS
- `04-types.md` の全型を grep してカバー確認

## step 4: zod schema + consent normalizer

ファイル: `packages/shared/src/zod/{primitives,field,schema,response,identity,viewmodel}/`、`packages/shared/src/utils/consent.ts`

```ts
// zod/field/*
import { z } from "zod";
export const FieldNameZ = z.string().min(1).max(100);
export const FieldEmailZ = z.string().email();
// 31 項目分

// zod/response/*
export const FormResponseZ = z.object({
  responseId: z.string().brand<"ResponseId">(),
  responseEmail: z.string().email().brand<"ResponseEmail">(),
  submittedAt: z.string().datetime(),
  answers: z.array(FormResponseAnswerZ),
});

// utils/consent.ts
export const normalizeConsent = (raw: Record<string, unknown>) => ({
  publicConsent: !!(raw.publicConsent ?? raw.public_consent ?? raw.shareInfo),
  rulesConsent: !!(raw.rulesConsent ?? raw.rules_consent ?? raw.agreeRules),
});
```

sanity:
- `mise exec -- pnpm -F @ubm-hyogo/shared test` PASS
- 31 fixture parse 成功

## step 5: Forms client

ファイル: `packages/integrations/google/src/forms/{auth,client,backoff,mapper}.ts`

```ts
// auth.ts
export async function getAccessToken(env: { FORMS_SA_KEY: string; FORMS_SA_EMAIL: string }) {
  const jwt = await signJwt(
    { iss: env.FORMS_SA_EMAIL,
      scope: "https://www.googleapis.com/auth/forms.responses.readonly",
      aud: TOKEN_ENDPOINT,
      exp: now + 3600 },
    env.FORMS_SA_KEY
  );
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    body: new URLSearchParams({ grant_type: "...:jwt-bearer", assertion: jwt }),
  });
  return (await res.json()).access_token;
}

// client.ts
export const createGoogleFormsClient = (env): GoogleFormsClient => ({
  async getForm(formId) { /* fetch + backoff + mapper */ },
  async listResponses(formId, opts) { /* fetch + pagination + backoff + mapper */ },
});

// backoff.ts
export async function withBackoff<T>(
  fn: () => Promise<T>,
  opts = { maxRetry: 5, baseMs: 200 }
): Promise<T> {
  // exponential backoff
}
```

sanity:
- `mise exec -- pnpm -F @ubm-hyogo/integrations-google test` PASS
- mock 429 → retry 2 回で 200 を返す

## step 6: boundary lint

ファイル: `scripts/lint-boundaries.mjs`

`@ubm-hyogo/integrations-google` を禁止対象として追加。`apps/web` から import すると exit code != 0。

sanity:
- `mise exec -- pnpm -w lint` PASS
- 試しに `apps/web` から `@ubm-hyogo/integrations-google` を import → fail

## 全体 sanity（Phase 完了条件）

```bash
mise exec -- pnpm -w typecheck && \
mise exec -- pnpm -w lint && \
mise exec -- pnpm -w test
```

実行結果: vitest 130 件 PASS、typecheck PASS、lint PASS。
