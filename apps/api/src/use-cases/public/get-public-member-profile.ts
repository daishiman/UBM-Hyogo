// GET /public/members/:memberId use-case (04a)
// 公開フィルタ EXISTS → 0 件なら 404 (AC-4)。view converter で leak 二重チェック。

import type { DbCtx } from "../../repository/_shared/db";
import { ApiError } from "@ubm-hyogo/shared/errors";

import { findCurrentResponse } from "../../repository/responses";
import { listFieldsByResponseId } from "../../repository/responseFields";
import { listTagsByMemberId } from "../../repository/memberTags";
import { listFieldsByVersion } from "../../repository/schemaQuestions";
import { getStatus } from "../../repository/status";
import { existsPublicMember } from "../../repository/publicMembers";
import {
  toPublicMemberProfile,
  type PublicMemberProfileResponse,
} from "../../view-models/public/public-member-profile-view";

export interface GetPublicMemberProfileDeps {
  ctx: DbCtx;
}

const parseJson = (raw: string | null): unknown => {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const getPublicMemberProfileUseCase = async (
  memberId: string,
  deps: GetPublicMemberProfileDeps,
): Promise<PublicMemberProfileResponse> => {
  const { ctx } = deps;

  // 公開フィルタ EXISTS で不適格を 404 で隠蔽 (R-1 / AC-4)。
  const exists = await existsPublicMember(ctx, memberId);
  if (!exists) throw new ApiError({ code: "UBM-1404" });

  const status = await getStatus(ctx, memberId as never);
  if (!status) throw new ApiError({ code: "UBM-1404" });

  const response = await findCurrentResponse(ctx, memberId as never);
  if (!response) throw new ApiError({ code: "UBM-1404" });

  const [fieldRows, tagRows, schemaRows] = await Promise.all([
    listFieldsByResponseId(ctx, response.response_id as never),
    listTagsByMemberId(ctx, memberId as never),
    listFieldsByVersion(ctx, response.form_id, response.revision_id),
  ]);

  return toPublicMemberProfile({
    member: { memberId },
    status: {
      publicConsent: status.public_consent,
      publishState: status.publish_state,
      isDeleted: status.is_deleted === 1,
    },
    fields: fieldRows.map((f) => ({
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
    tags: tagRows.map((t) => ({
      code: t.code,
      label: t.label,
      category: t.category,
    })),
  });
};
