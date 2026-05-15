// @vitest-environment node
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  DismissIdentityConflictRequestZ,
  DismissIdentityConflictResponseZ,
  IdentityConflictRowZ,
  ListIdentityConflictsResponseZ,
  MergeIdentityRequestZ,
  MergeIdentityResponseZ,
  adminRequestResolveBodySchema,
} from "@ubm-hyogo/shared";
import { ListAuditQueryZ, type ListAuditResponse } from "../audit";
import { DeleteBodyZ } from "../member-delete";
import {
  ListRequestsQueryZ,
  type ListRequestsResponse,
  type ResolveRequestResponse,
} from "../requests";

const adminRequestItem = {
  noteId: "note_001",
  memberId: "m_001",
  noteType: "visibility_request",
  requestStatus: "pending",
  requestedAt: "2026-05-10T00:00:00.000Z",
  requestedReason: "公開状態を変更したい",
  requestedPayload: { desiredState: "hidden" },
  memberSummary: {
    memberId: "m_001",
    publicHandle: null,
    publishState: "public",
    isDeleted: false,
  },
} as const;

const adminRequestsResponse = {
  ok: true,
  items: [adminRequestItem],
  nextCursor: null,
  appliedFilters: { status: "pending", type: "visibility_request" },
} satisfies ListRequestsResponse;

const identityConflictItem = {
  conflictId: "m_source__m_target",
  sourceMemberId: "m_source",
  candidateTargetMemberId: "m_target",
  matchedFields: ["name", "affiliation"],
  detectedAt: "2026-05-10T00:00:00.000Z",
  responseEmailMasked: "n***@example.com",
  syncJobId: null,
} as const;

const mergeResponseBody = {
  mergedAt: "2026-05-10T00:00:00.000Z",
  targetMemberId: "m_target",
  archivedSourceMemberId: "m_source",
  auditId: "audit_001",
} as const;

const memberDeleteResponse = {
  id: "m_001",
  isDeleted: true,
  deletedAt: "2026-05-10T00:00:00.000Z",
} as const;

const resolveResponse = {
  ok: true,
  noteId: "note_001",
  requestStatus: "resolved",
  resolvedAt: "2026-05-10T00:00:00.000Z",
  resolvedByAdminId: "admin_001",
  memberAfter: { memberId: "m_001", publishState: "hidden", isDeleted: false },
  retentionPurgeScheduledAt: null,
} satisfies ResolveRequestResponse;

const auditEntry = {
  auditId: "audit_001",
  actorId: "admin_001",
  actorEmail: "admin@example.com",
  action: "admin.member.deleted",
  targetType: "member",
  targetId: "m_001",
  maskedBefore: null,
  maskedAfter: { isDeleted: true },
  parseError: false,
  createdAt: "2026-05-10T00:00:00.000Z",
} as const;

const auditResponse = {
  ok: true,
  items: [auditEntry],
  nextCursor: null,
  appliedFilters: {
    action: "admin.member.deleted",
    actorEmail: "admin@example.com",
    targetType: "member",
    targetId: "m_001",
    from: null,
    to: null,
    limit: 50,
  },
} satisfies ListAuditResponse;

describe("GET /admin/requests", () => {
  it("query schema parses the Stage 2 UI fixture filter", () => {
    expect(() =>
      ListRequestsQueryZ.parse({
        status: "pending",
        type: "visibility_request",
        limit: "50",
      }),
    ).not.toThrow();
  });

  it("rejects missing request type", () => {
    expect(() => ListRequestsQueryZ.parse({ status: "pending" })).toThrow();
  });

  it("response envelope stays compatible with the admin requests route", () => {
    expectTypeOf<typeof adminRequestsResponse>().toMatchTypeOf<ListRequestsResponse>();
  });
});

describe("POST /admin/requests/:noteId/resolve", () => {
  it("parses approve bodies", () => {
    expect(() => adminRequestResolveBodySchema.parse({ resolution: "approve" })).not.toThrow();
  });

  it("parses reject bodies with a resolution note", () => {
    expect(() =>
      adminRequestResolveBodySchema.parse({
        resolution: "reject",
        resolutionNote: "本人確認できないため",
      }),
    ).not.toThrow();
  });

  it("rejects unknown resolution values", () => {
    expect(() => adminRequestResolveBodySchema.parse({ resolution: "unknown" })).toThrow();
  });

  it("response envelope stays compatible with the resolve route", () => {
    expectTypeOf<typeof resolveResponse>().toMatchTypeOf<ResolveRequestResponse>();
  });
});

describe("GET /admin/identity-conflicts", () => {
  it("parses identity conflict row fixtures", () => {
    expect(() => IdentityConflictRowZ.parse(identityConflictItem)).not.toThrow();
  });

  it("parses list responses with nullable cursors", () => {
    expect(() =>
      ListIdentityConflictsResponseZ.parse({
        items: [identityConflictItem],
        nextCursor: null,
      }),
    ).not.toThrow();
  });
});

describe("POST /admin/identity-conflicts/:id/merge", () => {
  it("parses merge request bodies", () => {
    expect(() =>
      MergeIdentityRequestZ.parse({
        targetMemberId: "m_target",
        reason: "同一人物と判断したため",
      }),
    ).not.toThrow();
  });

  it("rejects blank merge reasons", () => {
    expect(() =>
      MergeIdentityRequestZ.parse({
        targetMemberId: "m_target",
        reason: "",
      }),
    ).toThrow();
  });

  it("parses the shared merge response shape", () => {
    expect(() => MergeIdentityResponseZ.parse(mergeResponseBody)).not.toThrow();
  });
});

describe("POST /admin/identity-conflicts/:id/dismiss", () => {
  it("parses dismiss request bodies", () => {
    expect(() =>
      DismissIdentityConflictRequestZ.parse({ reason: "別人と確認したため" }),
    ).not.toThrow();
  });

  it("rejects blank dismiss reasons", () => {
    expect(() => DismissIdentityConflictRequestZ.parse({ reason: "" })).toThrow();
  });

  it("parses dismiss responses", () => {
    expect(() =>
      DismissIdentityConflictResponseZ.parse({
        dismissedAt: "2026-05-10T00:00:00.000Z",
      }),
    ).not.toThrow();
  });
});

describe("POST /admin/members/:memberId/delete", () => {
  it("parses member delete request bodies", () => {
    expect(() => DeleteBodyZ.parse({ reason: "退会希望のため" })).not.toThrow();
  });

  it("rejects blank delete reasons", () => {
    expect(() => DeleteBodyZ.parse({ reason: "" })).toThrow();
  });

  it("rejects missing delete reasons", () => {
    expect(() => DeleteBodyZ.parse({})).toThrow();
  });

  it("rejects delete reasons longer than 500 characters", () => {
    expect(() => DeleteBodyZ.parse({ reason: "a".repeat(501) })).toThrow();
  });

  it("response item shape stays compatible with the member delete UI fixture", () => {
    expectTypeOf<typeof memberDeleteResponse>().toMatchTypeOf<{
      id: string;
      isDeleted: true;
      deletedAt: string;
    }>();
  });
});

describe("GET /admin/audit", () => {
  it("query schema parses audit filters", () => {
    expect(() =>
      ListAuditQueryZ.parse({
        action: "admin.member.deleted",
        actorEmail: "admin@example.com",
        targetType: "member",
        limit: "50",
      }),
    ).not.toThrow();
  });

  it("rejects invalid actor email filters", () => {
    expect(() => ListAuditQueryZ.parse({ actorEmail: "not-email" })).toThrow();
  });

  it("response envelope stays compatible with the audit route", () => {
    expectTypeOf<typeof auditResponse>().toMatchTypeOf<ListAuditResponse>();
  });
});
