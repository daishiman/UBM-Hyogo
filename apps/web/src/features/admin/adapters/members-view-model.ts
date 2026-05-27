// followup-001 T-5.2: 既存 API レスポンスからプロトタイプ準拠 ViewModel を additive 派生する adapter。
// - 既存 `AdminMemberListItem` / `AdminMemberDetailView` は破壊しない（読み取りのみ）。
// - 新規 endpoint / D1 schema 変更は無し。すべて `answers_json` / `audit[]` / `summary` からの派生。
import type {
  AdminMemberListItem,
  AdminMemberDetailView,
} from "@ubm-hyogo/shared";

export interface Tag {
  readonly code: string;
  readonly label: string;
}

const HUE_COUNT = 360;

/** memberId から決定論的に hue (0..359) を派生。avatar 色付け用。 */
export function stringHashHue(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h % HUE_COUNT;
}

export interface MemberListRow extends AdminMemberListItem {
  readonly occupation?: string;
  readonly ubmZone?: string | null;
  readonly ubmMembershipType?: string | null;
  readonly tags: Array<Tag>;
  readonly updatedAt: string;
  readonly hue: number;
}

export interface AdapterContext {
  /** member_id => tag list の join 結果。未指定なら空配列。 */
  readonly tagStore?: ReadonlyMap<string, ReadonlyArray<Tag>>;
  /** API 側から提供される派生 summary（list endpoint 拡張時用、無ければ undefined） */
  readonly summaryStore?: ReadonlyMap<
    string,
    {
      occupation?: string;
      ubmZone?: string;
      ubmMembershipType?: string;
      updatedAt?: string;
    }
  >;
}

export function toMemberListRow(
  item: AdminMemberListItem,
  ctx: AdapterContext = {},
): MemberListRow {
  const summary = ctx.summaryStore?.get(item.memberId);
  const tags = ctx.tagStore?.get(item.memberId) ?? item.tags ?? [];
  const occupation = summary?.occupation ?? item.occupation;
  const ubmZone = summary?.ubmZone ?? item.ubmZone;
  const ubmMembershipType = summary?.ubmMembershipType ?? item.ubmMembershipType;
  const {
    occupation: _itemOccupation,
    ubmZone: _itemUbmZone,
    ubmMembershipType: _itemUbmMembershipType,
    tags: _itemTags,
    updatedAt: _itemUpdatedAt,
    ...baseItem
  } = item;
  return {
    ...baseItem,
    tags: [...tags],
    updatedAt: summary?.updatedAt ?? _itemUpdatedAt ?? item.lastSubmittedAt,
    hue: stringHashHue(item.memberId),
    ...(occupation !== undefined ? { occupation } : {}),
    ...(ubmZone !== undefined ? { ubmZone } : {}),
    ...(ubmMembershipType !== undefined ? { ubmMembershipType } : {}),
  };
}

export interface MemberDetail {
  readonly view: AdminMemberDetailView;
  readonly responseId: string;
  readonly submittedAt: string;
  readonly location?: string | undefined;
  readonly occupation?: string | undefined;
  readonly ubmZone?: string | null | undefined;
  readonly ubmMembershipType?: string | null | undefined;
  readonly businessOverview?: string | undefined;
  readonly tags: ReadonlyArray<Tag>;
  readonly hue: number;
  readonly updatedAt: string;
  readonly deletedAt?: string | undefined;
  readonly deletedReason?: string | undefined;
}

/**
 * audit[] から最新の mutation 発生時刻を取り出す。
 * 不在時は fallback として profile.lastSubmittedAt を採用。
 */
export function deriveUpdatedAt(view: AdminMemberDetailView): string {
  const ats = view.audit
    .map((a) => a.occurredAt)
    .filter((v): v is string => typeof v === "string" && v.length > 0);
  if (ats.length === 0) return view.profile.lastSubmittedAt;
  return ats.reduce((max, cur) => (cur > max ? cur : max));
}

/** audit log から「削除」アクションの発生時刻と理由（note）を引く。 */
function deriveDeletedMeta(view: AdminMemberDetailView): {
  deletedAt?: string | undefined;
  deletedReason?: string | undefined;
} {
  if (!view.status.isDeleted) return {};
  const deletion = [...view.audit]
    .reverse()
    .find((a) => /delete|deleted|deactivate/i.test(a.action));
  if (!deletion) return {};
  return {
    deletedAt: deletion.occurredAt,
    deletedReason: deletion.note ?? undefined,
  };
}

export function toMemberDetail(
  view: AdminMemberDetailView,
  ctx: AdapterContext = {},
): MemberDetail {
  const profile = view.profile;
  const summary = profile.summary;
  const memberId = view.identityMemberId;
  const tags = ctx.tagStore?.get(memberId) ?? profile.tags.map((t) => ({ code: t.code, label: t.label }));
  return {
    view,
    responseId: profile.responseId,
    submittedAt: profile.lastSubmittedAt,
    location: summary.location,
    occupation: summary.occupation,
    ubmZone: summary.ubmZone,
    ubmMembershipType: summary.ubmMembershipType,
    // businessOverview は MemberProfile.summary には存在しないため、
    // 既存 API endpoint surface のみを使う制約のもとでは undefined fallback。
    businessOverview: undefined,
    tags,
    hue: stringHashHue(memberId),
    updatedAt: deriveUpdatedAt(view),
    ...deriveDeletedMeta(view),
  };
}
