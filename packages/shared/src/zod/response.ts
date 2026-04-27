import { z } from "zod";

import { AnswerValueZ, EmailZ, Iso8601Z, StableKeyZ } from "./primitives";

export const FormResponseAnswerZ = z.object({
  stableKey: StableKeyZ,
  value: AnswerValueZ,
});

export const MemberResponseZ = z.object({
  responseId: z.string().min(1),
  formId: z.string().min(1),
  revisionId: z.string().min(1),
  schemaHash: z.string().min(1),
  responseEmail: EmailZ.nullable(),
  submittedAt: Iso8601Z,
  editResponseUrl: z.string().url().nullable(),
  answersByStableKey: z.record(z.string(), AnswerValueZ),
  rawAnswersByQuestionId: z.record(z.string(), z.unknown()),
  extraFields: z.record(z.string(), z.unknown()),
  unmappedQuestionIds: z.array(z.string()),
  searchText: z.string(),
});

export type MemberResponseZodInput = z.input<typeof MemberResponseZ>;
export type MemberResponseZodOutput = z.output<typeof MemberResponseZ>;
