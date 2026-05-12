// @vitest-environment node
// task-spec-2d-contract-stage-2:
// 2a/2b/2c Playwright spec が `page.route()` で返す UI fixture object と、
// `apps/api` 側 route の zod schema が drift していないことを CI で機械検証する
// pure unit contract test。DB / Network / FS / Cloudflare binding を一切触らない。
import { describe, it, expect, expectTypeOf } from "vitest";
import {
  MergeIdentityRequestZ,
  MergeIdentityResponseZ,
  DismissIdentityConflictRequestZ,
  DismissIdentityConflictResponseZ,
  IdentityConflictRowZ,
  ListIdentityConflictsResponseZ,
  adminRequestResolveBodySchema,
} from "@ubm-hyogo/shared";
import { AdminRequestsListResponseZ, ListRequestsQueryZ } from "../requests";
import { AdminAuditListResponseZ, ListAuditQueryZ } from "../audit";
import { DeleteBodyZ } from "../member-delete";

// --- fixture objects (inline, `as const`) ---
const adminRequestItem = {
  noteId: "note_001",
  memberId: "m_001",
  noteType: "visibility_request" as const,
  requestStatus: "pending" as const,
  requestedAt: "2026-05-11T00:00:00.000Z",
  requestedReason: null,
  requestedPayload: { desiredState: "public" },
  memberSummary: {
    memberId: "m_001",
    publicHandle: "alpha",
    publishState: "public",
    isDeleted: false,
  },
} as const;

const adminRequestsListResponse = {
  ok: true as const,
  items: [adminRequestItem],
  nextCursor: null,
  appliedFilters: { status: "pending" as const, type: "visibility_request" as const },
} as const;

const requestResolveApproveBody = { resolution: "approve" as const } as const;
const requestResolveRejectBody = {
  resolution: "reject" as const,
  resolutionNote: "duplicate",
} as const;

const identityConflictItem = {
  conflictId: "ic_001",
  sourceMemberId: "m_002",
  candidateTargetMemberId: "m_001",
  matchedFields: ["name", "affiliation"] as const,
  detectedAt: "2026-05-11T00:00:00.000Z",
  responseEmailMasked: "u***@example.com",
  syncJobId: null,
} as const;

const mergeRequestBody = {
  targetMemberId: "m_001",
  reason: "同一人物確定",
} as const;

const mergeResponseBody = {
  mergedAt: "2026-05-11T00:00:00.000Z",
  targetMemberId: "m_001",
  archivedSourceMemberId: "m_002",
  auditId: "audit_001",
} as const;

const dismissRequestBody = { reason: "別人と判明" } as const;
const dismissResponseBody = { dismissedAt: "2026-05-11T00:00:00.000Z" } as const;

const memberDeleteBody = { reason: "退会希望" } as const;
const memberDeleteResponse = {
  id: "m_001",
  isDeleted: true as const,
  deletedAt: "2026-05-11T00:00:00.000Z",
} as const;

const auditEntry = {
  auditId: "audit_001",
  actorId: "admin_001",
  actorEmail: "admin@example.test",
  action: "admin.member.deleted" as const,
  targetType: "member",
  targetId: "m_001",
  maskedBefore: { is_deleted: 0 },
  maskedAfter: { is_deleted: 1 },
  parseError: false,
  createdAt: "2026-05-11T00:00:00.000Z",
} as const;

const auditListResponse = {
  ok: true as const,
  items: [auditEntry],
  nextCursor: null,
  appliedFilters: {
    action: "admin.member.deleted",
    actorEmail: null,
    targetType: null,
    targetId: null,
    from: null,
    to: null,
    limit: 50,
  },
} as const;

// --- describe / test ---

describe("GET /admin/requests", () => {
  it("query schema が UI fixture を parse できる", () => {
    expect(() =>
      ListRequestsQueryZ.parse({ status: "pending", type: "visibility_request" }),
    ).not.toThrow();
  });

  it("response items[] shape が route response schema と同型", () => {
    expect(() => AdminRequestsListResponseZ.parse(adminRequestsListResponse)).not.toThrow();
  });
});

describe("POST /admin/requests/:noteId/resolve", () => {
  it("approve body parse", () => {
    expect(() => adminRequestResolveBodySchema.parse(requestResolveApproveBody)).not.toThrow();
  });

  it("reject + note body parse", () => {
    expect(() => adminRequestResolveBodySchema.parse(requestResolveRejectBody)).not.toThrow();
  });

  it("失敗系: 不正 resolution は throw", () => {
    expect(() => adminRequestResolveBodySchema.parse({ resolution: "unknown" })).toThrow();
  });
});

describe("GET /admin/identity-conflicts", () => {
  it("items[] が IdentityConflictRowZ と同型", () => {
    expect(() => IdentityConflictRowZ.parse(identityConflictItem)).not.toThrow();
  });

  it("list response 全体が ListIdentityConflictsResponseZ と同型", () => {
    expect(() =>
      ListIdentityConflictsResponseZ.parse({
        items: [identityConflictItem],
        nextCursor: null,
      }),
    ).not.toThrow();
  });
});

describe("POST /admin/identity-conflicts/:id/merge", () => {
  it("request body parse", () => {
    expect(() => MergeIdentityRequestZ.parse(mergeRequestBody)).not.toThrow();
  });

  it("失敗系: reason 空は throw", () => {
    expect(() =>
      MergeIdentityRequestZ.parse({ targetMemberId: "m_001", reason: "" }),
    ).toThrow();
  });

  it("response body parse", () => {
    expect(() => MergeIdentityResponseZ.parse(mergeResponseBody)).not.toThrow();
  });
});

describe("POST /admin/identity-conflicts/:id/dismiss", () => {
  it("request body parse", () => {
    expect(() => DismissIdentityConflictRequestZ.parse(dismissRequestBody)).not.toThrow();
  });

  it("失敗系: reason 空は throw", () => {
    expect(() => DismissIdentityConflictRequestZ.parse({ reason: "" })).toThrow();
  });

  it("response body parse", () => {
    expect(() => DismissIdentityConflictResponseZ.parse(dismissResponseBody)).not.toThrow();
  });
});

describe("POST /admin/members/:memberId/delete", () => {
  it("request body parse", () => {
    expect(() => DeleteBodyZ.parse(memberDeleteBody)).not.toThrow();
  });

  it("失敗系: reason 空は throw", () => {
    expect(() => DeleteBodyZ.parse({ reason: "" })).toThrow();
  });

  it("失敗系: reason 欠落は throw", () => {
    expect(() => DeleteBodyZ.parse({})).toThrow();
  });

  it("失敗系: reason 501 文字は throw", () => {
    expect(() => DeleteBodyZ.parse({ reason: "a".repeat(501) })).toThrow();
  });

  it("response shape が UI fixture と同型 (type-level)", () => {
    expectTypeOf<typeof memberDeleteResponse>().toMatchTypeOf<{
      id: string;
      isDeleted: true;
      deletedAt: string;
    }>();
  });
});

describe("GET /admin/audit", () => {
  it("query schema が UI fixture を parse できる", () => {
    expect(() =>
      ListAuditQueryZ.parse({ action: "admin.member.deleted", limit: 50 }),
    ).not.toThrow();
  });

  it("失敗系: actorEmail が email 形式でない場合 throw", () => {
    expect(() => ListAuditQueryZ.parse({ actorEmail: "not-email" })).toThrow();
  });

  it("audit response shape が route response schema と同型", () => {
    expect(() => AdminAuditListResponseZ.parse(auditListResponse)).not.toThrow();
  });
});
