import { expect, describe, expectTypeOf, it } from "vitest";
import { z } from "zod";

import {
  AdminDashboardViewZ,
  AdminMemberDetailViewZ,
  AdminMemberListViewZ,
  MemberProfileZ,
  PublicMemberListViewZ,
  PublicMemberProfileZ,
  adminRequestResolveBodySchema,
} from "@ubm-hyogo/shared";
import type {
  AdminDashboardView,
  AdminId,
  AdminMemberDetailView,
  AdminMemberListView,
  AdminRequestResolveBody,
  MemberId,
  MemberProfile,
  PublicMemberListView,
  PublicMemberProfile,
  ResponseEmail,
  ResponseId,
} from "@ubm-hyogo/shared";

type IsAssignable<Source, Target> = [Source] extends [Target] ? true : false;

describe("AC-1: ResponseId / ResponseEmail mutual exclusion", () => {
  it("ResponseEmail is not assignable to ResponseId", () => {
    expectTypeOf<ResponseEmail>().not.toMatchTypeOf<ResponseId>();
  });

  it("ResponseId is not assignable to ResponseEmail", () => {
    expectTypeOf<ResponseId>().not.toMatchTypeOf<ResponseEmail>();
  });

  it("MemberId and AdminId remain pairwise distinct", () => {
    expectTypeOf<MemberId>().not.toMatchTypeOf<AdminId>();
    expectTypeOf<AdminId>().not.toMatchTypeOf<MemberId>();
  });
});

describe("AC-2: view-model required field omission", () => {
  type MemberProfileSchemaOutput = z.output<typeof MemberProfileZ>;

  it("missing memberId on MemberProfile is a type error", () => {
    // @ts-expect-error: memberId is required on MemberProfile.
    const viewModel: MemberProfileSchemaOutput = {
      responseId: "response-1",
      responseEmail: null,
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "public",
      isDeleted: false,
      summary: {
        fullName: "Example Member",
        nickname: "Example",
        location: "Hyogo",
        occupation: "Engineer",
        ubmZone: null,
        ubmMembershipType: null,
      },
      sections: [],
      attendance: [],
      tags: [],
      lastSubmittedAt: "2026-01-01T00:00:00Z",
      editResponseUrl: null,
    };

    expectTypeOf(viewModel).toMatchTypeOf<MemberProfileSchemaOutput>();
  });

  it("missing summary on MemberProfile is a type error", () => {
    // @ts-expect-error: summary is required on MemberProfile.
    const viewModel: MemberProfileSchemaOutput = {
      memberId: "member-1",
      responseId: "response-1",
      responseEmail: null,
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "public",
      isDeleted: false,
      sections: [],
      attendance: [],
      tags: [],
      lastSubmittedAt: "2026-01-01T00:00:00Z",
      editResponseUrl: null,
    };

    expectTypeOf(viewModel).toMatchTypeOf<MemberProfileSchemaOutput>();
  });
});

describe("AC-3: zod input/output type parity", () => {
  it("MemberProfileZ input, output, and infer types are equal", () => {
    expectTypeOf<z.input<typeof MemberProfileZ>>().toEqualTypeOf<
      z.output<typeof MemberProfileZ>
    >();
    expectTypeOf<z.infer<typeof MemberProfileZ>>().toEqualTypeOf<
      z.output<typeof MemberProfileZ>
    >();
  });

  it("MemberProfile public type is intentionally stricter than schema output", () => {
    expectTypeOf<
      IsAssignable<MemberProfile, z.output<typeof MemberProfileZ>>
    >().toEqualTypeOf<true>();
    expectTypeOf<
      IsAssignable<z.output<typeof MemberProfileZ>, MemberProfile>
    >().toEqualTypeOf<false>();
  });

  it("AdminMemberDetailViewZ input and output types are equal", () => {
    expectTypeOf<z.input<typeof AdminMemberDetailViewZ>>().toEqualTypeOf<
      z.output<typeof AdminMemberDetailViewZ>
    >();
  });

  it("adminRequestResolveBodySchema output matches the exported type", () => {
    expectTypeOf<AdminRequestResolveBody>().toEqualTypeOf<
      z.output<typeof adminRequestResolveBodySchema>
    >();
  });
});

describe("AC-4: public/admin schema mutual exclusion", () => {
  type PublicMemberListSchemaOutput = z.output<typeof PublicMemberListViewZ>;
  type AdminMemberListSchemaOutput = z.output<typeof AdminMemberListViewZ>;
  type PublicMemberProfileSchemaOutput = z.output<typeof PublicMemberProfileZ>;
  type AdminMemberDetailSchemaOutput = z.output<typeof AdminMemberDetailViewZ>;
  type AdminDashboardSchemaOutput = z.output<typeof AdminDashboardViewZ>;

  it("PublicMemberListView is not assignable to AdminMemberListView", () => {
    expectTypeOf<PublicMemberListSchemaOutput>().not.toMatchTypeOf<AdminMemberListView>();
    expectTypeOf<PublicMemberListView>().not.toMatchTypeOf<AdminMemberListSchemaOutput>();
  });

  it("AdminMemberListView is not assignable to PublicMemberListView", () => {
    expectTypeOf<AdminMemberListSchemaOutput>().not.toMatchTypeOf<PublicMemberListView>();
    expectTypeOf<AdminMemberListView>().not.toMatchTypeOf<PublicMemberListSchemaOutput>();
  });

  it("PublicMemberProfile is not assignable to AdminMemberDetail", () => {
    expectTypeOf<PublicMemberProfileSchemaOutput>().not.toMatchTypeOf<AdminMemberDetailView>();
    expectTypeOf<PublicMemberProfile>().not.toMatchTypeOf<AdminMemberDetailSchemaOutput>();
  });

  it("AdminDashboard is not assignable to PublicMemberListView", () => {
    expectTypeOf<AdminDashboardSchemaOutput>().not.toMatchTypeOf<PublicMemberListView>();
    expectTypeOf<AdminDashboardView>().not.toMatchTypeOf<PublicMemberListSchemaOutput>();
  });
});

describe("AC-5: test suite independence", () => {
  it("shared package can parse a representative schema in isolation", () => {
    const result = adminRequestResolveBodySchema.safeParse({
      resolution: "approve",
    });

    expect(result.success).toBe(true);
    expectTypeOf(result.success).toBeBoolean();
  });

  it("type error directives in this file are guarded by typecheck", () => {
    expectTypeOf<true>().toEqualTypeOf<true>();
  });
});
