import type {
  FormFieldDefinition,
  FormManifest,
  FormSchema,
  MemberResponse,
} from "@ubm-hyogo/shared";
import {
  asResponseEmail,
  asResponseId,
  asStableKey,
  FormSchemaZ,
  MemberResponseZ,
} from "@ubm-hyogo/shared";

export interface RawForm {
  formId: string;
  info?: { title?: string; documentTitle?: string };
  revisionId?: string;
  responderUri?: string;
  items?: RawFormItem[];
}

export interface RawFormItem {
  itemId?: string;
  title?: string;
  description?: string;
  questionItem?: {
    question?: {
      questionId?: string;
      required?: boolean;
      choiceQuestion?: { options?: Array<{ value?: string }> };
    };
  };
  pageBreakItem?: { title?: string };
  sectionHeaderItem?: { title?: string };
}

export interface RawFormResponse {
  responseId?: string;
  createTime?: string;
  lastSubmittedTime?: string;
  respondentEmail?: string;
  formId?: string;
  answers?: Record<
    string,
    {
      questionId?: string;
      textAnswers?: { answers?: Array<{ value?: string }> };
    }
  >;
}

const STABLE_KEY_BY_LABEL: Record<string, string> = {
  "お名前（フルネーム）": "fullName",
  "あだ名・ニックネーム": "nickname",
  "お住まい（都道府県・市区町村）": "location",
  生年月日: "birthDate",
  "職業・仕事内容": "occupation",
  出身地: "hometown",
  UBM区画: "ubmZone",
  UBM参加ステータス: "ubmMembershipType",
  "UBMに入会・参加した時期": "ubmJoinDate",
  ビジネス概要: "businessOverview",
  "得意分野・スキル": "skills",
  "現在の課題・相談したいこと": "challenges",
  "提供できること・協力できること": "canProvide",
  "趣味・好きなこと": "hobbies",
  最近ハマっていること: "recentInterest",
  "座右の銘・大切にしている言葉": "motto",
  仕事以外の活動: "otherActivities",
  "ホームページ URL": "urlWebsite",
  "Facebook URL": "urlFacebook",
  "Instagram URL": "urlInstagram",
  "Threads URL": "urlThreads",
  "YouTube URL": "urlYoutube",
  "TikTok URL": "urlTiktok",
  "X URL": "urlX",
  "ブログ URL": "urlBlog",
  "note URL": "urlNote",
  "LinkedIn URL": "urlLinkedin",
  "その他の SNS・URL": "urlOthers",
  "自己紹介・一言メッセージ": "selfIntroduction",
  "ホームページへの掲載に同意しますか？": "publicConsent",
  "勧誘ルール・免責事項への同意": "rulesConsent",
};

function deriveStableKey(label: string | undefined): string {
  if (!label) return "unknown";
  return STABLE_KEY_BY_LABEL[label] ?? slugify(label);
}

function slugify(label: string): string {
  return label
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_]/g, "")
    .toLowerCase()
    .slice(0, 64) || "unknown";
}

function detectKind(item: RawFormItem): FormFieldDefinition["kind"] {
  if (item.questionItem?.question?.choiceQuestion) return "radio";
  if (item.pageBreakItem) return "unknown";
  return "shortText";
}

export interface MapFormSchemaInput {
  raw: RawForm;
  schemaHash: string;
  syncedAt: string;
}

export function mapFormSchema(input: MapFormSchemaInput): FormSchema {
  const { raw, schemaHash, syncedAt } = input;
  const items = raw.items ?? [];
  const fields: FormFieldDefinition[] = items.map((item, position) => {
    const stableKey = asStableKey(deriveStableKey(item.title));
    const choiceLabels =
      item.questionItem?.question?.choiceQuestion?.options?.map(
        (opt, optPosition) => ({
          rawLabel: opt.value ?? "",
          normalizedValue: slugify(opt.value ?? ""),
          position: optPosition,
          active: true,
        }),
      ) ?? [];
    return {
      formId: raw.formId,
      revisionId: raw.revisionId ?? "unknown",
      schemaHash,
      stableKey,
      questionId: item.questionItem?.question?.questionId ?? null,
      itemId: item.itemId ?? null,
      sectionKey: "section",
      sectionTitle: item.sectionHeaderItem?.title ?? "",
      label: item.title ?? "",
      kind: detectKind(item),
      position,
      required: item.questionItem?.question?.required ?? false,
      visibility: "public",
      searchable: true,
      source: "forms" as const,
      status: "active" as const,
      choiceLabels,
    };
  });
  const manifest: FormManifest = {
    formId: raw.formId,
    title: raw.info?.title ?? raw.info?.documentTitle ?? "",
    revisionId: raw.revisionId ?? "unknown",
    schemaHash,
    state: "active",
    syncedAt,
    sourceUrl: raw.responderUri ?? `https://docs.google.com/forms/d/${raw.formId}`,
    fieldCount: fields.length,
    unknownFieldCount: fields.filter((f) => f.stableKey === asStableKey("unknown")).length,
  };
  const candidate = { manifest, fields };
  return FormSchemaZ.parse(candidate) as FormSchema;
}

export interface MapFormResponseInput {
  raw: RawFormResponse;
  formId: string;
  revisionId: string;
  schemaHash: string;
  questionIdToStableKey: Record<string, string>;
}

export function mapFormResponse(input: MapFormResponseInput): MemberResponse {
  const { raw, formId, revisionId, schemaHash, questionIdToStableKey } = input;
  const answersByStableKey: Record<string, string | string[] | null> = {};
  const rawAnswersByQuestionId: Record<string, unknown> = {};
  const unmappedQuestionIds: string[] = [];

  for (const [questionId, payload] of Object.entries(raw.answers ?? {})) {
    rawAnswersByQuestionId[questionId] = payload;
    const stableKey = questionIdToStableKey[questionId];
    const values = payload.textAnswers?.answers
      ?.map((a) => a.value)
      .filter((v): v is string => typeof v === "string") ?? [];
    if (!stableKey) {
      unmappedQuestionIds.push(questionId);
      continue;
    }
    answersByStableKey[stableKey] = values.length <= 1 ? values[0] ?? null : values;
  }

  const candidate = {
    responseId: raw.responseId ?? "",
    formId,
    revisionId,
    schemaHash,
    responseEmail: raw.respondentEmail ?? null,
    submittedAt: raw.lastSubmittedTime ?? raw.createTime ?? "1970-01-01T00:00:00Z",
    editResponseUrl: null,
    answersByStableKey,
    rawAnswersByQuestionId,
    extraFields: {},
    unmappedQuestionIds,
    searchText: Object.values(answersByStableKey)
      .flat()
      .filter((v): v is string => typeof v === "string")
      .join(" "),
  };
  const parsed = MemberResponseZ.parse(candidate);
  return {
    ...parsed,
    responseId: asResponseId(parsed.responseId),
    responseEmail:
      parsed.responseEmail === null ? null : asResponseEmail(parsed.responseEmail),
  } as MemberResponse;
}
