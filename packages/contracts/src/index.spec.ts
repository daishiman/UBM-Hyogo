import { describe, expect, it } from "vitest";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — package exports plain ESM .mjs without .d.ts
import { schemas, fixtures } from "./index.mjs";

describe("packages/contracts: zod schema self-test", () => {
  describe("MeResponseZ", () => {
    it("valid fixture が parse 成功する", () => {
      expect(() => schemas.MeResponseZ.parse(fixtures.me.meResponse)).not.toThrow();
    });
    it("user 欠落で parse 失敗する", () => {
      expect(() => schemas.MeResponseZ.parse({ authGateState: "active" })).toThrow();
    });
  });

  describe("MeProfileResponseZ", () => {
    it("valid fixture が parse 成功する", () => {
      expect(() => schemas.MeProfileResponseZ.parse(fixtures.me.meProfileResponse)).not.toThrow();
    });
  });

  describe("PublicMemberListZ", () => {
    it("valid fixture で parse 成功する", () => {
      expect(() => schemas.PublicMemberListZ.parse(fixtures.public.memberList)).not.toThrow();
    });
    it("items 空でも parse 成功する", () => {
      expect(() => schemas.PublicMemberListZ.parse({ items: [], total: 0 })).not.toThrow();
    });
  });

  describe("PublicStatsZ", () => {
    it("valid fixture で parse 成功する", () => {
      expect(() => schemas.PublicStatsZ.parse(fixtures.public.stats)).not.toThrow();
    });
  });

  describe("PublicFormPreviewZ", () => {
    it("valid fixture で parse 成功する", () => {
      expect(() => schemas.PublicFormPreviewZ.parse(fixtures.public.formPreview)).not.toThrow();
    });
  });

  describe("AdminMemberListZ", () => {
    it("valid fixture で parse 成功する", () => {
      expect(() => schemas.AdminMemberListZ.parse(fixtures.admin.memberList)).not.toThrow();
    });
    it("total が string だと parse 失敗する", () => {
      expect(() =>
        schemas.AdminMemberListZ.parse({
          total: "NaN",
          members: [],
        }),
      ).toThrow();
    });
  });

  describe("AdminDashboardZ", () => {
    it("valid fixture で parse 成功する", () => {
      expect(() => schemas.AdminDashboardZ.parse(fixtures.admin.dashboard)).not.toThrow();
    });
  });

  describe("IdentityConflictListZ", () => {
    it("valid fixture で parse 成功する", () => {
      expect(() => schemas.IdentityConflictListZ.parse(fixtures.identityConflicts.list)).not.toThrow();
    });
  });

  describe("MergeIdentityRequestZ", () => {
    it("valid body で parse 成功する", () => {
      expect(() =>
        schemas.MergeIdentityRequestZ.parse(fixtures.identityConflicts.mergeRequest),
      ).not.toThrow();
    });
    it("targetMemberId 欠落で parse 失敗する", () => {
      expect(() => schemas.MergeIdentityRequestZ.parse({ reason: "x" })).toThrow();
    });
  });

  describe("MergeIdentityResponseZ", () => {
    it("valid fixture で parse 成功する", () => {
      expect(() =>
        schemas.MergeIdentityResponseZ.parse(fixtures.identityConflicts.mergeResponse),
      ).not.toThrow();
    });
  });

  describe("DismissIdentityConflictRequestZ", () => {
    it("valid body で parse 成功する", () => {
      expect(() =>
        schemas.DismissIdentityConflictRequestZ.parse(fixtures.identityConflicts.dismissRequest),
      ).not.toThrow();
    });
  });

  describe("AdminAuditListZ", () => {
    it("valid fixture で parse 成功する", () => {
      expect(() => schemas.AdminAuditListZ.parse(fixtures.admin.auditList)).not.toThrow();
    });
  });

  describe("AC-4 fixtures invariants", () => {
    it("members が 3 件である", () => {
      expect(fixtures.public.memberList.items.length).toBe(3);
    });
    it("zone が 2 種 (Kobe / Himeji) を含む", () => {
      const zones = new Set(
        fixtures.public.memberList.items.map((m: { ubmZone: string }) => m.ubmZone),
      );
      expect(zones).toEqual(new Set(["Kobe", "Himeji"]));
    });
    it("membership が 2 種 (regular / honorary) を含む", () => {
      const types = new Set(
        fixtures.public.memberList.items.map((m: { ubmMembershipType: string }) => m.ubmMembershipType),
      );
      expect(types).toEqual(new Set(["regular", "honorary"]));
    });
    it("tag facet が 2 件 (ABC法 / DEF法) である", () => {
      expect(fixtures.admin.tagFacets).toEqual(expect.arrayContaining(["ABC法", "DEF法"]));
      expect(fixtures.admin.tagFacets.length).toBe(2);
    });
    it("negative query が canonical 値 zzz_no_match_zzz である", () => {
      expect(fixtures.public.negativeQuery).toBe("zzz_no_match_zzz");
    });
  });
});
