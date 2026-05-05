import { z } from "zod";

export const adminRequestResolveBodySchema = z.object({
  resolution: z.enum(["approve", "reject"]),
  resolutionNote: z.string().max(500).optional(),
}).strict();

export type AdminRequestResolveBody = z.infer<typeof adminRequestResolveBodySchema>;
