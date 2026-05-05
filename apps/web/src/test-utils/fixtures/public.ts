import type { z } from "zod";

import {
  FormPreviewViewZ,
  PublicMemberListItemZ,
  PublicStatsViewZ,
} from "@ubm-hyogo/shared";

type PublicMemberListItem = z.infer<typeof PublicMemberListItemZ>;
type PublicStatsView = z.infer<typeof PublicStatsViewZ>;
type FormPreviewView = z.infer<typeof FormPreviewViewZ>;

export function buildMember(
  overrides: Partial<PublicMemberListItem> = {},
): PublicMemberListItem {
  return {
    memberId: "mem-001",
    fullName: "山田 太郎",
    nickname: "taro",
    occupation: "エンジニア",
    location: "兵庫県神戸市",
    ubmZone: "Kobe",
    ubmMembershipType: "regular",
    ...overrides,
  };
}

export function buildStats(
  overrides: Partial<PublicStatsView> = {},
): PublicStatsView {
  return {
    memberCount: 120,
    publicMemberCount: 80,
    zoneBreakdown: [
      { zone: "Kobe", count: 50 },
      { zone: "Himeji", count: 40 },
      { zone: "Amagasaki", count: 30 },
    ],
    membershipBreakdown: [{ type: "regular", count: 100 }],
    meetingCountThisYear: 6,
    recentMeetings: [],
    lastSync: {
      schemaSync: "ok",
      responseSync: "ok",
      schemaSyncFinishedAt: "2026-05-01T00:00:00.000Z",
      responseSyncFinishedAt: "2026-05-01T00:00:00.000Z",
    },
    generatedAt: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

type FormField = FormPreviewView["fields"][number];

export function buildFormField(overrides: Partial<FormField> = {}): FormField {
  return {
    formId: "form-1",
    revisionId: "rev-1",
    schemaHash: "hash-1",
    stableKey: "section-a:field-1",
    questionId: "q1",
    itemId: "i1",
    sectionKey: "section-a",
    sectionTitle: "セクションA",
    label: "氏名",
    kind: "shortText",
    position: 0,
    required: true,
    visibility: "public",
    searchable: true,
    source: "forms",
    status: "active",
    choiceLabels: [],
    ...overrides,
  } as FormField;
}

export function buildPreview(
  overrides: Partial<FormPreviewView> = {},
): FormPreviewView {
  return {
    manifest: {
      formId: "form-1",
      title: "UBM 兵庫支部会 入会フォーム",
      revisionId: "rev-1",
      schemaHash: "hash-1",
      state: "active",
      syncedAt: "2026-05-01T00:00:00.000Z",
      sourceUrl: "https://example.com/form",
      fieldCount: 0,
      unknownFieldCount: 0,
    },
    fields: [],
    sectionCount: 6,
    fieldCount: 0,
    responderUrl: "https://example.com/respond",
    ...overrides,
  };
}
