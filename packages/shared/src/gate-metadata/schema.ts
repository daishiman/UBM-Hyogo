import { z } from "zod";

export const GateStatusEnum = z.enum(["pending", "passed", "failed", "waived"]);
export type GateStatus = z.infer<typeof GateStatusEnum>;

export const GateIdSchema = z.string().regex(/^Gate-[A-Z](-[A-Z0-9]+)*$/);
export const GateEvidencePathSchema = z
  .string()
  .min(1)
  .refine((p) => !p.startsWith("/") && !p.includes("\\"), {
    message: "evidence_path must be a repo-root relative POSIX path",
  })
  .refine((p) => !p.split("/").includes(".."), {
    message: "evidence_path must not contain path traversal",
  });
export const GateApproverSchema = z.string().regex(
  /^(CODEOWNERS:[A-Za-z0-9._/-]+|[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)$/,
);

export const GateEntrySchema = z
  .object({
    gate_id: GateIdSchema,
    status: GateStatusEnum,
    passed_at: z.string().datetime({ offset: true }).nullable(),
    evidence_path: GateEvidencePathSchema,
    approver: GateApproverSchema,
    notes: z.string().optional(),
  })
  .refine((g) => g.status !== "passed" || g.passed_at !== null, {
    message: 'passed_at must be set when status === "passed"',
    path: ["passed_at"],
  })
  .refine((g) => g.status === "passed" || g.passed_at === null, {
    message: 'passed_at must be null unless status === "passed"',
    path: ["passed_at"],
  });

export type GateEntry = z.infer<typeof GateEntrySchema>;

export const GatesArraySchema = z.array(GateEntrySchema);
export type GatesArray = z.infer<typeof GatesArraySchema>;
