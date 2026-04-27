import type { ResponseEmail, ResponseId, StableKey } from "../../branded";
import type { AnswerValue } from "../common";

export interface FormResponseAnswer {
  stableKey: StableKey;
  value: AnswerValue;
}

export interface MemberResponse {
  responseId: ResponseId;
  formId: string;
  revisionId: string;
  schemaHash: string;
  responseEmail: ResponseEmail | null;
  submittedAt: string;
  editResponseUrl: string | null;
  answersByStableKey: Record<string, AnswerValue>;
  rawAnswersByQuestionId: Record<string, unknown>;
  extraFields: Record<string, unknown>;
  unmappedQuestionIds: string[];
  searchText: string;
}
