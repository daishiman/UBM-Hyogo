// 07a: tag_assignment_queue resolve workflow の入力 zod schema。
// 仕様: docs/30-workflows/02-application-implementation/07a-parallel-tag-assignment-queue-resolve-workflow/phase-02.md
//
// discriminatedUnion で confirmed / rejected を排他的に受ける:
//   - confirmed: tagCodes.length >= 1
//   - rejected:  reason.length >= 1（空文字は route の zod validation で 400 へ）
import { z } from "zod";

export const TagQueueResolveBody = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("confirmed"),
    tagCodes: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    action: z.literal("rejected"),
    reason: z.string().min(1),
  }),
]);

export type TagQueueResolveBody = z.infer<typeof TagQueueResolveBody>;
