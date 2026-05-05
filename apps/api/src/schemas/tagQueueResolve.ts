// Backward-compatible API-local alias. The canonical contract lives in packages/shared.
import {
  tagQueueResolveBodySchema,
  type TagQueueResolveBody as SharedTagQueueResolveBody,
} from "@ubm-hyogo/shared";

export const TagQueueResolveBody = tagQueueResolveBodySchema;
export type TagQueueResolveBody = SharedTagQueueResolveBody;
