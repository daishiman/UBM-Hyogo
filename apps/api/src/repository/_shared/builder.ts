// ビュー組み立てモジュール
// 複数テーブルのデータを組み合わせて ViewModel を構築する
// 不変条件 #12: adminNotes は引数で受け取り、PublicMemberProfile には含めない

import type { DbCtx } from "./db";
import type { MemberId } from "./brand";
import { asMemberId, asResponseId, asResponseEmail, asStableKey } from "./brand";
import type {
  MemberProfile,
  MemberProfileSection,
  MemberProfileSectionField,
  MemberProfileSummary,
  PublicMemberProfile,
  PublicMemberListItem,
  AdminMemberDetailView,
  AdminId,
  ConsentStatus,
  PublishState,
  FieldVisibility,
  AnswerValue,
} from "@ubm-hyogo/shared";
import { findMemberById } from "../members";
import { listMembersByIds } from "../members";
import { getStatus, listStatusesByMemberIds } from "../status";
import { findCurrentResponse, listResponsesByIds } from "../responses";
import { listSectionsByResponseId } from "../responseSections";
import { listFieldsByResponseId } from "../responseFields";
import { listVisibilityByMemberId } from "../fieldVisibility";
import { listTagsByMemberId, listTagsByMemberIds } from "../memberTags";
import {
  defaultMetadataResolver,
  UNKNOWN_SECTION_KEY,
  UNKNOWN_SECTION_TITLE,
  type MetadataResolver,
  type ResolveError,
  type SectionKey,
} from "./metadata";
import type { AttendanceProvider, AttendanceRecord } from "../attendance";

// AttendanceProvider 未注入時のフォールバック（02a 互換）
// 本タスク (ut-02a-attendance-profile-integration) の routes 側では provider を必ず注入する。
const fetchAttendanceFor = async (
  mid: MemberId,
  provider: AttendanceProvider | undefined,
): Promise<AttendanceRecord[]> => {
  if (!provider) return [];
  const map = await provider.findByMemberIds([mid]);
  return [...(map.get(mid) ?? [])];
};

// フィールドの可視性マップを構築するヘルパー
function buildVisibilityMap(
  rows: Array<{ stable_key: string; visibility: string }>,
): Map<string, FieldVisibility> {
  const map = new Map<string, FieldVisibility>();
  for (const row of rows) {
    const v = row.visibility as FieldVisibility;
    map.set(row.stable_key, v);
  }
  return map;
}

// answersJson からサマリーを取得するヘルパー
function extractSummary(answersJson: string): MemberProfileSummary {
  let answers: Record<string, unknown> = {};
  try {
    answers = JSON.parse(answersJson) as Record<string, unknown>;
  } catch {
    // パース失敗時はデフォルト値を使用
  }
  return {
    fullName: (answers["fullName"] as string) ?? "",
    nickname: (answers["nickname"] as string) ?? "",
    location: (answers["location"] as string) ?? "",
    occupation: (answers["occupation"] as string) ?? "",
    ubmZone: (answers["ubmZone"] as string | null) ?? null,
    ubmMembershipType: (answers["ubmMembershipType"] as string | null) ?? null,
  };
}

export interface SectionBuildDiagnostics {
  unknownStableKeys: string[];
  errors: ResolveError[];
}

export interface SectionBuildResult {
  sections: MemberProfileSection[];
  diagnostics: SectionBuildDiagnostics;
}

// response_sections + response_fields から canonical metadata 経由で section を組み立てる。
// resolver が unknown を返した stable_key は __unknown__ section へ隔離し、diagnostics で観測可能にする。
export function buildSectionsWithDiagnostics(
  sections: Array<{ section_key: string; section_title: string; position: number }>,
  fields: Array<{ stable_key: string; value_json: string | null }>,
  visibilityMap: Map<string, FieldVisibility>,
  allowedVisibilities: FieldVisibility[],
  resolver: MetadataResolver,
): SectionBuildResult {
  // 提供された response_sections の順序情報を尊重しつつ、resolver の section ordering を補完する。
  const titleByKey = new Map<SectionKey, string>();
  const positionByKey = new Map<SectionKey, number>();
  for (const s of sections) {
    titleByKey.set(s.section_key, s.section_title);
    positionByKey.set(s.section_key, s.position);
  }
  for (const s of resolver.listSections()) {
    if (!titleByKey.has(s.key)) titleByKey.set(s.key, s.title);
    if (!positionByKey.has(s.key)) positionByKey.set(s.key, s.position);
  }

  const fieldsByKey = new Map<SectionKey, MemberProfileSectionField[]>();
  const diagnostics: SectionBuildDiagnostics = {
    unknownStableKeys: [],
    errors: [],
  };
  const ensure = (key: SectionKey): MemberProfileSectionField[] => {
    let bucket = fieldsByKey.get(key);
    if (!bucket) {
      bucket = [];
      fieldsByKey.set(key, bucket);
    }
    return bucket;
  };

  for (const field of fields) {
    const sk = field.stable_key;
    const visibility = visibilityMap.get(sk) ?? "member";
    if (!allowedVisibilities.includes(visibility)) continue;

    let value: AnswerValue = null;
    if (field.value_json !== null) {
      try {
        value = JSON.parse(field.value_json) as AnswerValue;
      } catch {
        value = field.value_json;
      }
    }

    const sectionResult = resolver.resolveSectionKey(sk);
    const kindResult = resolver.resolveFieldKind(sk);
    const labelResult = resolver.resolveLabel(sk);

    for (const result of [sectionResult, kindResult, labelResult]) {
      if (!result.ok) {
        diagnostics.errors.push(result.error);
        if (
          result.error.kind === "unknownStableKey" &&
          !diagnostics.unknownStableKeys.includes(result.error.stableKey)
        ) {
          diagnostics.unknownStableKeys.push(result.error.stableKey);
        }
      }
    }

    const targetSection: SectionKey = sectionResult.ok
      ? sectionResult.value
      : UNKNOWN_SECTION_KEY;
    if (!titleByKey.has(targetSection)) {
      titleByKey.set(targetSection, UNKNOWN_SECTION_TITLE);
      positionByKey.set(targetSection, Number.MAX_SAFE_INTEGER);
    }

    const kind = kindResult.ok ? kindResult.value : "unknown";
    // label は resolver 経由のみ採用する（stable_key 流用を禁止 / drift 時は空文字で露出を防ぐ）
    const label = labelResult.ok ? labelResult.value : "";

    ensure(targetSection).push({
      stableKey: asStableKey(sk),
      label,
      value,
      kind,
      visibility,
      source: "forms",
    });
  }

  const orderedKeys = [...fieldsByKey.keys()].sort((a, b) => {
    const pa = positionByKey.get(a) ?? Number.MAX_SAFE_INTEGER;
    const pb = positionByKey.get(b) ?? Number.MAX_SAFE_INTEGER;
    return pa - pb;
  });

  return {
    sections: orderedKeys.map((key) => ({
      key,
      title: titleByKey.get(key) ?? UNKNOWN_SECTION_TITLE,
      fields: fieldsByKey.get(key) ?? [],
    })),
    diagnostics,
  };
}

export function buildSections(
  sections: Array<{ section_key: string; section_title: string; position: number }>,
  fields: Array<{ stable_key: string; value_json: string | null }>,
  visibilityMap: Map<string, FieldVisibility>,
  allowedVisibilities: FieldVisibility[],
  resolver: MetadataResolver,
): MemberProfileSection[] {
  return buildSectionsWithDiagnostics(sections, fields, visibilityMap, allowedVisibilities, resolver).sections;
}

/**
 * 公開用メンバープロフィールを組み立てる
 * 以下の場合は null を返す:
 * - is_deleted = 1
 * - public_consent != 'consented'
 * - publish_state != 'public'
 */
export async function buildPublicMemberProfile(
  c: DbCtx,
  mid: MemberId,
): Promise<PublicMemberProfile | null> {
  const [identity, status] = await Promise.all([
    findMemberById(c, mid),
    getStatus(c, mid),
  ]);

  if (!identity || !status) return null;
  if (status.is_deleted === 1) return null;
  if (status.public_consent !== "consented") return null;
  if (status.publish_state !== "public") return null;

  const response = await findCurrentResponse(c, mid);
  if (!response) return null;

  const responseId = asResponseId(response.response_id);
  const [sections, fields, visibilityRows, tags] = await Promise.all([
    listSectionsByResponseId(c, responseId),
    listFieldsByResponseId(c, responseId),
    listVisibilityByMemberId(c, mid),
    listTagsByMemberId(c, mid),
  ]);

  const visibilityMap = buildVisibilityMap(visibilityRows);

  // public profile には visibility='public' のフィールドのみ含める
  const publicSections = buildSections(sections, fields, visibilityMap, ["public"], defaultMetadataResolver);

  const summary = extractSummary(response.answers_json);

  return {
    memberId: asMemberId(identity.member_id),
    summary,
    publicSections,
    tags: tags.map((t) => ({
      code: t.code,
      label: t.label,
      category: t.category,
    })),
  };
}

/**
 * 会員本人用のプロフィールを組み立てる
 * visibility=public または member のフィールドを含む
 */
export async function buildMemberProfile(
  c: DbCtx,
  mid: MemberId,
  deps?: { attendanceProvider?: AttendanceProvider },
): Promise<MemberProfile | null> {
  const [identity, status] = await Promise.all([
    findMemberById(c, mid),
    getStatus(c, mid),
  ]);

  if (!identity || !status) return null;
  if (status.is_deleted === 1) return null;

  const response = await findCurrentResponse(c, mid);
  if (!response) return null;

  const responseId = asResponseId(response.response_id);
  const [sections, fields, visibilityRows, tags, attendance] = await Promise.all([
    listSectionsByResponseId(c, responseId),
    listFieldsByResponseId(c, responseId),
    listVisibilityByMemberId(c, mid),
    listTagsByMemberId(c, mid),
    fetchAttendanceFor(mid, deps?.attendanceProvider),
  ]);

  const visibilityMap = buildVisibilityMap(visibilityRows);

  // member profile には visibility=public または member のフィールドを含める
  const memberSections = buildSections(sections, fields, visibilityMap, ["public", "member"], defaultMetadataResolver);

  const summary = extractSummary(response.answers_json);

  return {
    memberId: asMemberId(identity.member_id),
    responseId: responseId,
    responseEmail: asResponseEmail(identity.response_email),
    publicConsent: status.public_consent as ConsentStatus,
    rulesConsent: status.rules_consent as ConsentStatus,
    publishState: status.publish_state as PublishState,
    isDeleted: status.is_deleted === 1,
    summary,
    sections: memberSections,
    attendance,
    tags: tags.map((t) => ({
      code: t.code,
      label: t.label,
      category: t.category,
      source: t.source as "rule" | "ai" | "manual",
    })),
    lastSubmittedAt: response.submitted_at,
    editResponseUrl: response.edit_response_url,
  };
}

/**
 * 管理者用の会員詳細ビューを組み立てる
 * 全 visibility のフィールドを含む
 * adminNotes は引数で受け取る（不変条件 #12）
 * PublicMemberProfile や MemberProfile には adminNotes を含めない
 */
export async function buildAdminMemberDetailView(
  c: DbCtx,
  mid: MemberId,
  adminNotes: Array<{
    actor: AdminId;
    action: string;
    occurredAt: string;
    note: string | null;
  }>,
  deps?: { attendanceProvider?: AttendanceProvider },
): Promise<AdminMemberDetailView | null> {
  const [identity, status] = await Promise.all([
    findMemberById(c, mid),
    getStatus(c, mid),
  ]);

  if (!identity || !status) return null;

  const response = await findCurrentResponse(c, mid);
  if (!response) return null;

  const responseId = asResponseId(response.response_id);
  const [sections, fields, visibilityRows, tags, attendance] = await Promise.all([
    listSectionsByResponseId(c, responseId),
    listFieldsByResponseId(c, responseId),
    listVisibilityByMemberId(c, mid),
    listTagsByMemberId(c, mid),
    fetchAttendanceFor(mid, deps?.attendanceProvider),
  ]);

  const visibilityMap = buildVisibilityMap(visibilityRows);

  // admin view には全 visibility のフィールドを含める
  const adminSections = buildSections(sections, fields, visibilityMap, ["public", "member", "admin"], defaultMetadataResolver);

  const summary = extractSummary(response.answers_json);

  const profile: MemberProfile = {
    memberId: asMemberId(identity.member_id),
    responseId: responseId,
    responseEmail: asResponseEmail(identity.response_email),
    publicConsent: status.public_consent as ConsentStatus,
    rulesConsent: status.rules_consent as ConsentStatus,
    publishState: status.publish_state as PublishState,
    isDeleted: status.is_deleted === 1,
    summary,
    sections: adminSections,
    attendance,
    tags: tags.map((t) => ({
      code: t.code,
      label: t.label,
      category: t.category,
      source: t.source as "rule" | "ai" | "manual",
    })),
    lastSubmittedAt: response.submitted_at,
    editResponseUrl: response.edit_response_url,
  };

  return {
    identityMemberId: asMemberId(identity.member_id),
    identityEmail: asResponseEmail(identity.response_email),
    status: {
      publicConsent: status.public_consent as ConsentStatus,
      rulesConsent: status.rules_consent as ConsentStatus,
      publishState: status.publish_state as PublishState,
      isDeleted: status.is_deleted === 1,
    },
    profile,
    audit: adminNotes,
  };
}

/**
 * 公開用メンバーリストアイテムをバッチ組み立てする
 * is_deleted=1 または public_consent!='consented' または publish_state!='public' の会員は除外
 */
export async function buildPublicMemberListItems(
  c: DbCtx,
  mids: MemberId[],
): Promise<PublicMemberListItem[]> {
  if (mids.length === 0) return [];

  const [identities, statuses] = await Promise.all([
    listMembersByIds(c, mids),
    listStatusesByMemberIds(c, mids),
  ]);
  const statusByMemberId = new Map(statuses.map((s) => [s.member_id, s]));

  const publicIdentities = identities.filter((identity) => {
    const status = statusByMemberId.get(identity.member_id);
    return (
      status !== undefined &&
      status.is_deleted !== 1 &&
      status.public_consent === "consented" &&
      status.publish_state === "public"
    );
  });

  const responseIds = publicIdentities.map((identity) =>
    asResponseId(identity.current_response_id),
  );
  const responses = await listResponsesByIds(c, responseIds);
  const responseById = new Map(responses.map((r) => [r.response_id, r]));

  return publicIdentities.flatMap((identity) => {
    const response = responseById.get(identity.current_response_id);
    if (!response) return [];
    const summary = extractSummary(response.answers_json);
    return [
      {
        memberId: asMemberId(identity.member_id),
        fullName: summary.fullName,
        nickname: summary.nickname,
        occupation: summary.occupation,
        location: summary.location,
        ubmZone: summary.ubmZone,
        ubmMembershipType: summary.ubmMembershipType,
      },
    ];
  });
}
