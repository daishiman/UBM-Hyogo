import { z } from "zod";

export const tagQueueResolveBodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("confirmed"),
    tagCodes: z.array(z.string().min(1)).min(1),
  }).strict(),
  z.object({
    action: z.literal("rejected"),
    reason: z.string().min(1),
  }).strict(),
]);

export type TagQueueResolveBody = z.infer<typeof tagQueueResolveBodySchema>;
