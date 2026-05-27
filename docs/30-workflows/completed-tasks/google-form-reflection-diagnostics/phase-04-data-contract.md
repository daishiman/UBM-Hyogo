---
phase: 4
title: データ契約 — diagnostics API zod schema (SSOT)
workflow_id: google-form-reflection-diagnostics
status: spec_created
---

# Phase 4 — データ契約

[実装区分: 実装仕様書]

## 1. SSOT 原則

本 Phase 4 で定義する zod schema を、`apps/api` 実装と `apps/web` 受信側の型 SSOT とする。`apps/api/src/diagnostics/forms-pipeline.ts` が schema を export し、`apps/web/src/features/admin/diagnostics/types.ts` は同一 shape を **コピー** で持つ (cross-package import の Workers bundle 互換性のため)。drift 防止は contract spec で担保する。

## 2. `FormsPipelineSnapshot`

### 2.1 zod schema (TypeScript 表記)

```ts
import { z } from 'zod';

export const SyncRunStatusSchema = z.enum(['success', 'error', 'running', 'aborted']);

export const SyncRunSummarySchema = z.object({
  id: z.string(),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().nullable(),
  status: SyncRunStatusSchema,
  responsesFetched: z.number().int().nonnegative(),
  errorMessage: z.string().nullable(),
});

export const SecretsReadinessSchema = z.object({
  googleServiceAccountEmail: z.boolean(),
  googlePrivateKey: z.boolean(),
  googleFormId: z.boolean(),
  authSecret: z.boolean(),
});

export const PublicVisibilityCountsSchema = z.object({
  totalMembers: z.number().int().nonnegative(),
  publicConsentTrue: z.number().int().nonnegative(),
  publishedTrue: z.number().int().nonnegative(),
  visibleOnPublicDirectory: z.number().int().nonnegative(),
  allHiddenByPublishState: z.boolean(),
});

export const IdentityHealthSchema = z.object({
  totalIdentities: z.number().int().nonnegative(),
  identitiesWithoutMember: z.number().int().nonnegative(),
  membersWithoutIdentity: z.number().int().nonnegative(),
});

export const HypothesisFlagsSchema = z.object({
  H1_ingestNeverRanOrAllErrors: z.boolean(),
  H2_identityMismatchSuspected: z.boolean(),
  H3_allHiddenByPublishState: z.boolean(),
  H4_aliasPendingNonZero: z.boolean(),
});

export const FormsPipelineSnapshotSchema = z.object({
  capturedAt: z.string().datetime(),
  counts: z.object({
    formResponses: z.number().int().nonnegative(),
    responseFields: z.number().int().nonnegative(),
    members: z.number().int().nonnegative(),
    memberIdentities: z.number().int().nonnegative(),
  }),
  latestSyncRuns: z.array(SyncRunSummarySchema).max(10),
  secretsReadiness: SecretsReadinessSchema,
  aliasPendingCount: z.number().int().nonnegative(),
  publicVisibility: PublicVisibilityCountsSchema,
  identityHealth: IdentityHealthSchema,
  hypothesisFlags: HypothesisFlagsSchema,
});

export type FormsPipelineSnapshot = z.infer<typeof FormsPipelineSnapshotSchema>;
```

### 2.2 H1 ケース response 例

```json
{
  "capturedAt": "2026-05-26T03:15:00.000Z",
  "counts": { "formResponses": 0, "responseFields": 0, "members": 12, "memberIdentities": 12 },
  "latestSyncRuns": [],
  "secretsReadiness": {
    "googleServiceAccountEmail": false,
    "googlePrivateKey": false,
    "googleFormId": true,
    "authSecret": true
  },
  "aliasPendingCount": 0,
  "publicVisibility": {
    "totalMembers": 12, "publicConsentTrue": 8, "publishedTrue": 8,
    "visibleOnPublicDirectory": 8, "allHiddenByPublishState": false
  },
  "identityHealth": { "totalIdentities": 12, "identitiesWithoutMember": 0, "membersWithoutIdentity": 0 },
  "hypothesisFlags": {
    "H1_ingestNeverRanOrAllErrors": true,
    "H2_identityMismatchSuspected": false,
    "H3_allHiddenByPublishState": false,
    "H4_aliasPendingNonZero": false
  }
}
```

### 2.3 H3 ケース response 例

```json
{
  "capturedAt": "2026-05-26T03:20:00.000Z",
  "counts": { "formResponses": 45, "responseFields": 1395, "members": 12, "memberIdentities": 12 },
  "latestSyncRuns": [
    { "id": "run_001", "startedAt": "2026-05-26T03:00:00.000Z", "finishedAt": "2026-05-26T03:00:12.000Z", "status": "success", "responsesFetched": 45, "errorMessage": null }
  ],
  "secretsReadiness": { "googleServiceAccountEmail": true, "googlePrivateKey": true, "googleFormId": true, "authSecret": true },
  "aliasPendingCount": 0,
  "publicVisibility": {
    "totalMembers": 12, "publicConsentTrue": 0, "publishedTrue": 0,
    "visibleOnPublicDirectory": 0, "allHiddenByPublishState": true
  },
  "identityHealth": { "totalIdentities": 12, "identitiesWithoutMember": 0, "membersWithoutIdentity": 0 },
  "hypothesisFlags": {
    "H1_ingestNeverRanOrAllErrors": false,
    "H2_identityMismatchSuspected": false,
    "H3_allHiddenByPublishState": true,
    "H4_aliasPendingNonZero": false
  }
}
```

## 3. `MemberDiagnosis`

### 3.1 zod schema

```ts
export const MemberDiagnosisSchema = z.object({
  capturedAt: z.string().datetime(),
  memberId: z.string(),
  identityMatches: z.object({
    byEmail: z.boolean(),
    byExternalId: z.boolean(),
    matchedFormResponseId: z.string().nullable(),
  }),
  responseFieldCount: z.number().int().nonnegative(),
  expectedFieldCount: z.literal(31),
  missingFieldKeys: z.array(z.string()),
  consent: z.object({
    publicConsent: z.boolean().nullable(),
    rulesConsent: z.boolean().nullable(),
  }),
  publishState: z.object({
    published: z.boolean(),
    visibleOnPublicDirectory: z.boolean(),
  }),
  hypothesisFlags: z.object({
    H2_identityMissing: z.boolean(),
    H3_hiddenByConsentOrPublish: z.boolean(),
    H4_missingFieldsNonEmpty: z.boolean(),
  }),
});

export type MemberDiagnosis = z.infer<typeof MemberDiagnosisSchema>;
```

### 3.2 H2 ケース response 例

```json
{
  "capturedAt": "2026-05-26T03:25:00.000Z",
  "memberId": "mem_abc",
  "identityMatches": { "byEmail": false, "byExternalId": false, "matchedFormResponseId": null },
  "responseFieldCount": 0,
  "expectedFieldCount": 31,
  "missingFieldKeys": ["name","kana","email","..."],
  "consent": { "publicConsent": null, "rulesConsent": null },
  "publishState": { "published": false, "visibleOnPublicDirectory": false },
  "hypothesisFlags": {
    "H2_identityMissing": true,
    "H3_hiddenByConsentOrPublish": false,
    "H4_missingFieldsNonEmpty": false
  }
}
```

## 4. boolean-only secrets readiness 不変条件

`SecretsReadinessSchema` の全フィールドは `boolean` のみ。実値 / 末尾 4 桁 / 投入日時等は **絶対に含めない**。実装側で `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID` の presence を boolean 化して判定するだけ。contract spec でこれを assert する。

## 5. error response

| code | 状況 |
| --- | --- |
| 401 | 未認証 |
| 403 | 認証済みだが non-admin |
| 404 | `/admin/diagnostics/member/:id` で id が存在しない |
| 500 | D1 query 例外 (実装側で zod parse 失敗時も 500 に倒す) |

すべて `{ error: { code: string, message: string } }` の既存 admin error envelope に揃える。
