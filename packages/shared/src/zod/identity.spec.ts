import { describe, expect, it } from "vitest";

import {
  DeletedMemberRecordZ,
  MeetingSessionZ,
  MemberAttendanceZ,
  MemberIdentityZ,
  MemberStatusRecordZ,
  MemberTagZ,
  TagAssignmentQueueItemZ,
  TagDefinitionZ,
} from "./identity";

const baseIdentity = {
  memberId: "m_1",
  responseEmail: "x@example.com",
  currentResponseId: "r_1",
  firstResponseId: "r_0",
  lastSubmittedAt: "2026-04-30T00:00:00Z",
  createdAt: "2026-04-29T00:00:00Z",
  updatedAt: "2026-04-30T00:00:00Z",
};

describe("identity zod schemas", () => {
  it("MemberIdentityZ accepts a valid record", () => {
    expect(MemberIdentityZ.parse(baseIdentity).memberId).toBe("m_1");
  });

  it("MemberIdentityZ rejects empty memberId", () => {
    expect(() => MemberIdentityZ.parse({ ...baseIdentity, memberId: "" })).toThrow();
  });

  it("MemberStatusRecordZ accepts valid status", () => {
    const record = MemberStatusRecordZ.parse({
      memberId: "m_1",
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "public",
      isDeleted: false,
      hiddenReason: null,
      lastNotifiedAt: null,
      updatedAt: "2026-04-30T00:00:00Z",
      updatedBy: null,
    });
    expect(record.publicConsent).toBe("consented");
  });

  it("DeletedMemberRecordZ requires deletedBy", () => {
    expect(() =>
      DeletedMemberRecordZ.parse({
        memberId: "m_1",
        deletedAt: "2026-04-30T00:00:00Z",
        deletedBy: "",
        reason: "x",
      }),
    ).toThrow();
  });

  it("MeetingSessionZ accepts a valid session", () => {
    const s = MeetingSessionZ.parse({
      sessionId: "s_1",
      title: "kickoff",
      heldOn: "2026-04-30",
      note: null,
      createdAt: "2026-04-30T00:00:00Z",
      createdBy: "admin_1",
    });
    expect(s.sessionId).toBe("s_1");
  });

  it("MemberAttendanceZ accepts a valid attendance", () => {
    expect(
      MemberAttendanceZ.parse({
        memberId: "m_1",
        sessionId: "s_1",
        assignedAt: "2026-04-30T00:00:00Z",
        assignedBy: "admin_1",
      }).memberId,
    ).toBe("m_1");
  });

  it("TagDefinitionZ accepts a valid tag", () => {
    expect(
      TagDefinitionZ.parse({
        tagId: "t_1",
        code: "tag-a",
        label: "Tag A",
        category: "general",
        sourceStableKeys: ["fullName"],
        active: true,
      }).code,
    ).toBe("tag-a");
  });

  it("MemberTagZ enforces confidence range", () => {
    expect(() =>
      MemberTagZ.parse({
        memberId: "m_1",
        tagId: "t_1",
        source: "rule",
        confidence: 1.5,
        assignedAt: "2026-04-30T00:00:00Z",
        assignedBy: null,
      }),
    ).toThrow();
  });

  it("TagAssignmentQueueItemZ enforces enum status", () => {
    expect(() =>
      TagAssignmentQueueItemZ.parse({
        queueId: "q_1",
        memberId: "m_1",
        responseId: "r_1",
        status: "bogus",
        suggestedTags: [],
        reason: null,
        createdAt: "2026-04-30T00:00:00Z",
        updatedAt: "2026-04-30T00:00:00Z",
      }),
    ).toThrow();
  });
});
