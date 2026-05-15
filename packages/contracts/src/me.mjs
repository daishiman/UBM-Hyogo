import { z } from "zod";

const ZoneZ = z.enum(["Kobe", "Himeji"]);
const MembershipZ = z.enum(["regular", "honorary"]);

export const MeResponseZ = z
  .object({
    user: z
      .object({
        memberId: z.string().min(1),
        responseId: z.string().min(1),
        email: z.string().email(),
        isAdmin: z.boolean(),
        authGateState: z.enum(["active", "rules_declined", "deleted"]),
      })
      .passthrough(),
    authGateState: z.enum(["active", "rules_declined", "deleted"]),
  })
  .passthrough();

const PendingRequestZ = z
  .object({
    queueId: z.string(),
    status: z.literal("pending"),
    createdAt: z.string(),
  })
  .passthrough();

export const MeProfileResponseZ = z
  .object({
    profile: z
      .object({
        sections: z.array(z.unknown()),
        attendance: z.array(z.unknown()),
        attendanceMeta: z
          .object({
            hasMore: z.boolean(),
            nextCursor: z.string().nullable(),
          })
          .passthrough(),
      })
      .passthrough(),
    statusSummary: z
      .object({
        publicConsent: z.string(),
        rulesConsent: z.string(),
        publishState: z.string(),
        isDeleted: z.boolean(),
      })
      .passthrough(),
    editResponseUrl: z.string().nullable(),
    fallbackResponderUrl: z.string(),
    pendingRequests: z
      .object({
        visibility: PendingRequestZ.optional(),
        delete: PendingRequestZ.optional(),
      })
      .passthrough(),
  })
  .passthrough();

export const VisibilityRequestBodyZ = z
  .object({
    desiredState: z.enum(["hidden", "public"]).optional(),
    reason: z.string().max(500).optional(),
  })
  .passthrough();

export const DeleteRequestBodyZ = z
  .object({
    reason: z.string().max(500).optional(),
  })
  .passthrough();

export const MeQueueAcceptedResponseZ = z
  .object({
    queueId: z.string(),
    type: z.enum(["visibility_request", "delete_request"]),
    status: z.literal("pending"),
    createdAt: z.string(),
  })
  .passthrough();

export { ZoneZ, MembershipZ };
