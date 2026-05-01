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

// response_sections + response_fields からセクション一覧を組み立てるヘルパー
function buildSections(
  sections: Array<{ section_key: string; section_title: string; position: number }>,
  fields: Array<{ stable_key: string; value_json: string | null }>,
  visibilityMap: Map<string, FieldVisibility>,
  allowedVisibilities: FieldVisibility[],
): MemberProfileSection[] {
  // フィールドをセクションキーに分類するためのマップ（この実装ではsection_keyをstable_keyのプレフィックスとして扱う）
  // 実際のスキーマでは response_fields と response_sections は response_id でのみ関連付けられる
  // ここでは全フィールドを最初のセクション、またはデフォルトセクションに配置する簡略実装
  const filteredFields: MemberProfileSectionField[] = [];

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

    filteredFields.push({
      stableKey: asStableKey(sk),
      label: sk, // ラベルは schema_questions から取得するが、ここでは簡略化
      value,
      kind: "shortText",
      visibility,
      source: "forms",
    });
  }

  if (sections.length === 0 && filteredFields.length > 0) {
    return [
      {
        key: "default",
        title: "プロフィール",
        fields: filteredFields,
      },
    ];
  }

  return sections.map((s) => ({
    key: s.section_key,
    title: s.section_title,
    fields: filteredFields, // 簡略化: 全フィールドを各セクションに含める（実際は section_key によるフィルタが必要）
  }));
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
  const publicSections = buildSections(sections, fields, visibilityMap, ["public"]);

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
  const memberSections = buildSections(sections, fields, visibilityMap, ["public", "member"]);

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
  const adminSections = buildSections(sections, fields, visibilityMap, ["public", "member", "admin"]);

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
