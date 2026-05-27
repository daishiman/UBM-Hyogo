import { z } from "zod";

export const SyncRunSummarySchema = z.object({
  id: z.string(),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().nullable(),
  status: z.enum(["success", "error", "running", "aborted"]),
  responsesFetched: z.number().int().nonnegative(),
  errorMessage: z.string().nullable(),
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
  secretsReadiness: z.object({
    googleServiceAccountEmail: z.boolean(),
    googlePrivateKey: z.boolean(),
    googleFormId: z.boolean(),
    authSecret: z.boolean(),
  }),
  aliasPendingCount: z.number().int().nonnegative(),
  publicVisibility: z.object({
    totalMembers: z.number().int().nonnegative(),
    publicConsentTrue: z.number().int().nonnegative(),
    publishedTrue: z.number().int().nonnegative(),
    visibleOnPublicDirectory: z.number().int().nonnegative(),
    allHiddenByPublishState: z.boolean(),
  }),
  identityHealth: z.object({
    totalIdentities: z.number().int().nonnegative(),
    identitiesWithoutMember: z.number().int().nonnegative(),
    membersWithoutIdentity: z.number().int().nonnegative(),
  }),
  hypothesisFlags: z.object({
    H1_ingestNeverRanOrAllErrors: z.boolean(),
    H2_identityMismatchSuspected: z.boolean(),
    H3_allHiddenByPublishState: z.boolean(),
    H4_aliasPendingNonZero: z.boolean(),
  }),
});

export type FormsPipelineSnapshot = z.infer<
  typeof FormsPipelineSnapshotSchema
>;

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

