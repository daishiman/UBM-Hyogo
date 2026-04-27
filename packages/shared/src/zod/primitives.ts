import { z } from "zod";

export const NonEmptyStringZ = z.string().min(1);
export const ShortTextZ = z.string().min(1).max(200);
export const ParagraphZ = z.string().min(1).max(4000);
export const UrlZ = z.string().url();
export const Iso8601Z = z.string().datetime({ offset: true });
export const StableKeyZ = z.string().min(1).max(64);
export const EmailZ = z.string().email();

export const FieldKindZ = z.enum([
  "shortText",
  "paragraph",
  "date",
  "radio",
  "checkbox",
  "dropdown",
  "url",
  "unknown",
]);

export const FieldVisibilityZ = z.enum(["public", "member", "admin"]);
export const PublishStateZ = z.enum(["public", "member_only", "hidden"]);
export const SchemaStateZ = z.enum(["active", "superseded", "pending_review"]);
export const FieldStatusZ = z.enum(["active", "inactive", "pending"]);
export const FieldSourceZ = z.enum(["forms", "admin", "derived"]);
export const TagSourceZ = z.enum(["rule", "ai", "manual"]);
export const ConsentStatusZ = z.enum(["consented", "declined", "unknown"]);
export const AuthGateStateValueZ = z.enum([
  "input",
  "sent",
  "unregistered",
  "rules_declined",
  "deleted",
]);

export const AnswerValueZ = z.union([
  z.string(),
  z.array(z.string()),
  z.number(),
  z.boolean(),
  z.object({
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
  }),
  z.null(),
]);
