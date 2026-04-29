// 04b: /me/* endpoint の zod schema
// 不変条件 #7: SessionUser は memberId と responseId を別フィールドで保持する。
// 不変条件 #12: GET 系 response 型に admin_member_notes 由来のキーを露出させない。
//   - notes / adminNotes プロパティを strict() で禁止する。
import { z } from "zod";
import { MemberProfileZ } from "@ubm-hyogo/shared";

// GET /me
// 注: shared/zod/viewmodel の SessionUserZ.authGateState は AuthGateStateValueZ
// (input/sent/unregistered/rules_declined/deleted) を取る一方、本タスクの AC-7 では
// active/rules_declined/deleted の 3 状態を返す。view model 互換性のため response は
// "active|rules_declined|deleted" を独立に定義する。
const MeSessionUserZ = z
  .object({
    memberId: z.string().min(1),
    responseId: z.string().min(1),
    email: z.string().email(),
    isAdmin: z.boolean(),
    authGateState: z.enum(["active", "rules_declined", "deleted"]),
  })
  .strict();

export const MeSessionResponseZ = z
  .object({
    user: MeSessionUserZ,
    authGateState: z.enum(["active", "rules_declined", "deleted"]),
  })
  .strict();

export type MeSessionResponse = z.infer<typeof MeSessionResponseZ>;

// GET /me/profile
export const MeProfileResponseZ = z
  .object({
    profile: MemberProfileZ,
    statusSummary: z.object({
      publicConsent: z.enum(["consented", "declined", "unknown"]),
      rulesConsent: z.enum(["consented", "declined", "unknown"]),
      publishState: z.enum(["public", "hidden", "member_only"]),
      isDeleted: z.literal(false),
    }),
    editResponseUrl: z.string().url().nullable(),
    fallbackResponderUrl: z.string().url(),
  })
  .strict();

export type MeProfileResponse = z.infer<typeof MeProfileResponseZ>;

// POST /me/visibility-request
export const MeVisibilityRequestBodyZ = z
  .object({
    desiredState: z.enum(["hidden", "public"]),
    reason: z.string().max(500).optional(),
  })
  .strict();

export type MeVisibilityRequestBody = z.infer<typeof MeVisibilityRequestBodyZ>;

// POST /me/delete-request
export const MeDeleteRequestBodyZ = z
  .object({
    reason: z.string().max(500).optional(),
  })
  .strict();

export type MeDeleteRequestBody = z.infer<typeof MeDeleteRequestBodyZ>;

// POST 系 共通 response
export const MeQueueAcceptedResponseZ = z
  .object({
    queueId: z.string().min(1),
    type: z.enum(["visibility_request", "delete_request"]),
    status: z.literal("pending"),
    createdAt: z.string().min(1),
  })
  .strict();

export type MeQueueAcceptedResponse = z.infer<typeof MeQueueAcceptedResponseZ>;
