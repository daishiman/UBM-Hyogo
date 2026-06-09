// GET /public/members/:memberId use-case (04a)
// 公開フィルタ EXISTS → 0 件なら 404 (AC-4)。view converter で leak 二重チェック。

import type { RepositoryProviderCtx } from "../../repository/_shared/provider-context";
import { ApiError } from "@ubm-hyogo/shared/errors";

import {
  ATTENDANCE_PAGE_DEFAULT_LIMIT,
  type AttendanceProvider,
} from "../../repository/attendance";
import { findCurrentResponse } from "../../repository/responses";
import { listFieldsByResponseId } from "../../repository/responseFields";
import { listFieldOverridesByMemberId } from "../../repository/memberFieldOverrides";
import { resolveFieldPrecedence } from "../_shared/field-precedence";
import { listFieldsByVersion } from "../../repository/schemaQuestions";
import { getStatus } from "../../repository/status";
import { existsPublicMember } from "../../repository/publicMembers";
import { createWriteTagNoteProviderBundle } from "../../middleware/repository-providers";
import type { MemberTagsProvider } from "../../repository/_shared/provider-context";
import {
  toPublicMemberProfile,
  type PublicMemberProfileResponse,
} from "../../view-models/public/public-member-profile-view";

export interface GetPublicMemberProfileDeps {
  ctx: RepositoryProviderCtx;
  memberTagsProvider?: MemberTagsProvider;
  // issue-1029: 公開 gate 通過後にのみ呼ぶ presigned photoUrl resolver（optional）。
  // route 層が R2 presign を構築して DI する。未注入 / 写真未登録 / presign 失敗時は undefined（fail-soft）。
  resolvePhotoUrl?: (memberId: string) => Promise<string | undefined>;
}

const parseJson = (raw: string | null): unknown => {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const requireAttendanceProvider = (
  ctx: RepositoryProviderCtx,
): AttendanceProvider => {
  const provider = ctx.var.attendanceProvider;
  if (!provider) {
    throw new Error("attendanceProvider not bound to context");
  }
  return provider;
};

export const getPublicMemberProfileUseCase = async (
  memberId: string,
  deps: GetPublicMemberProfileDeps,
): Promise<PublicMemberProfileResponse> => {
  const { ctx } = deps;
  const memberTagsProvider =
    deps.memberTagsProvider ?? createWriteTagNoteProviderBundle(ctx).memberTagsProvider;

  // 公開フィルタ EXISTS で不適格を 404 で隠蔽 (R-1 / AC-4)。
  const exists = await existsPublicMember(ctx, memberId);
  if (!exists) throw new ApiError({ code: "UBM-1404" });

  const status = await getStatus(ctx, memberId as never);
  if (!status) throw new ApiError({ code: "UBM-1404" });

  const response = await findCurrentResponse(ctx, memberId as never);
  if (!response) throw new ApiError({ code: "UBM-1404" });

  // issue-1029: 公開 gate 通過後にのみ photoUrl を解決する（gate 不通過 member の写真漏れ防止 / AC-4・AC-6）。
  const photoUrl = deps.resolvePhotoUrl
    ? await deps.resolvePhotoUrl(memberId)
    : undefined;

  const attendanceProvider = requireAttendanceProvider(ctx);
  const [fieldRows, overrideRows, tagRows, schemaRows, attendancePage] =
    await Promise.all([
      listFieldsByResponseId(ctx, response.response_id as never),
      listFieldOverridesByMemberId(ctx, memberId as never),
      memberTagsProvider.listTagsByMemberId(memberId as never),
      listFieldsByVersion(ctx, response.form_id, response.revision_id),
      attendanceProvider.findByMemberId(memberId as never, {
        limit: ATTENDANCE_PAGE_DEFAULT_LIMIT,
      }),
    ]);

  // L1 admin override を表示値にマージ（AC-6・公開詳細）。override 済みフィールドが最優先。
  const mergedFields = resolveFieldPrecedence(fieldRows, overrideRows);

  return toPublicMemberProfile({
    member: { memberId },
    status: {
      publicConsent: status.public_consent,
      publishState: status.publish_state,
      isDeleted: status.is_deleted === 1,
    },
    fields: mergedFields.map((f) => ({
      stableKey: f.stable_key,
      value: parseJson(f.value_json),
    })),
    schemaFields: schemaRows.map((s) => ({
      stableKey: String(s.stableKey),
      visibility: s.visibility,
      sectionKey: s.sectionKey,
      sectionTitle: s.sectionTitle,
      label: s.label,
      kind: s.kind,
      position: s.position,
    })),
    attendance: [...attendancePage.records],
    attendanceMeta: {
      hasMore: attendancePage.hasMore,
      nextCursor: attendancePage.nextCursor,
    },
    tags: tagRows.map((t) => ({
      code: t.code,
      label: t.label,
      category: t.category,
    })),
    photoUrl,
  });
};
