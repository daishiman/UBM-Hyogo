import { describe, it, expect, beforeEach } from "vitest";
import { MockStore, createMockDbCtx } from "../__fixtures__/d1mock";
import {
  MEMBER_IDENTITY_1,
  MEMBER_IDENTITY_2,
  MEMBER_IDENTITY_DELETED,
  MEMBER_STATUS_CONSENTED,
  MEMBER_STATUS_NOT_CONSENTED,
  MEMBER_STATUS_DELETED,
  MEMBER_RESPONSE_1,
  MEMBER_RESPONSE_2,
  MEMBER_RESPONSE_3,
  RESPONSE_SECTIONS_R001,
  RESPONSE_FIELDS_R001,
  FIELD_VISIBILITY_M001,
  TAG_DEFINITIONS,
  MEMBER_TAGS_M001,
} from "../__fixtures__/members.fixture";
import {
  buildPublicMemberProfile,
  buildMemberProfile,
  buildAdminMemberDetailView,
  buildPublicMemberListItems,
} from "../_shared/builder";
import { asMemberId, asAdminId } from "../_shared/brand";
import type { AttendanceProvider, AttendanceRecord } from "../attendance";
import type { MemberId } from "../_shared/brand";

const stubProvider = (
  data: Record<string, AttendanceRecord[]>,
): AttendanceProvider => ({
  async findByMemberIds(ids) {
    const out = new Map<MemberId, AttendanceRecord[]>();
    for (const id of ids) {
      const recs = data[id as unknown as string];
      if (recs) out.set(id, recs);
    }
    return out;
  },
});

describe("builder", () => {
  let store: MockStore;
  let ctx: ReturnType<typeof createMockDbCtx>;

  beforeEach(() => {
    store = new MockStore();
    // 全テーブルのデータを設定
    store.memberIdentities = [
      { ...MEMBER_IDENTITY_1 },
      { ...MEMBER_IDENTITY_2 },
      { ...MEMBER_IDENTITY_DELETED },
    ];
    store.memberStatus = [
      { ...MEMBER_STATUS_CONSENTED },
      { ...MEMBER_STATUS_NOT_CONSENTED },
      { ...MEMBER_STATUS_DELETED },
    ];
    store.memberResponses = [
      { ...MEMBER_RESPONSE_1 },
      { ...MEMBER_RESPONSE_2 },
      { ...MEMBER_RESPONSE_3 },
    ];
    store.responseSections = [...RESPONSE_SECTIONS_R001.map((r) => ({ ...r }))];
    store.responseFields = [...RESPONSE_FIELDS_R001.map((r) => ({ ...r }))];
    store.memberFieldVisibility = [...FIELD_VISIBILITY_M001.map((r) => ({ ...r }))];
    store.tagDefinitions = [...TAG_DEFINITIONS.map((r) => ({ ...r }))];
    store.memberTags = [...MEMBER_TAGS_M001.map((r) => ({ ...r }))];
    ctx = createMockDbCtx(store);
  });

  describe("buildPublicMemberProfile", () => {
    it("公開同意済み・公開状態の会員のプロフィールを構築できる", async () => {
      const result = await buildPublicMemberProfile(ctx, asMemberId("m_001"));
      expect(result).not.toBeNull();
      expect(result?.memberId).toBe("m_001");
      expect(result?.summary.fullName).toBe("山田 太郎");
    });

    it("is_deleted=1 の会員は null を返す（不変条件 #11）", async () => {
      const result = await buildPublicMemberProfile(ctx, asMemberId("m_003"));
      expect(result).toBeNull();
    });

    it("public_consent != 'consented' の会員は null を返す", async () => {
      const result = await buildPublicMemberProfile(ctx, asMemberId("m_002"));
      expect(result).toBeNull();
    });

    it("publish_state != 'public' の会員は null を返す", async () => {
      // m_002 は publish_state = 'member_only'
      const result = await buildPublicMemberProfile(ctx, asMemberId("m_002"));
      expect(result).toBeNull();
    });

    it("visibility='admin' のフィールドは PublicMemberProfile に含まれない", async () => {
      const result = await buildPublicMemberProfile(ctx, asMemberId("m_001"));
      expect(result).not.toBeNull();
      // publicSections のフィールドに admin_note_field が含まれていないことを確認
      const allFields = result!.publicSections.flatMap((s) => s.fields);
      const adminFieldKeys = allFields.map((f) => f.stableKey);
      expect(adminFieldKeys).not.toContain("admin_note_field");
    });

    it("visibility='member' のフィールドも PublicMemberProfile に含まれない", async () => {
      const result = await buildPublicMemberProfile(ctx, asMemberId("m_001"));
      expect(result).not.toBeNull();
      const allFields = result!.publicSections.flatMap((s) => s.fields);
      const fieldKeys = allFields.map((f) => f.stableKey);
      expect(fieldKeys).not.toContain("nickname"); // nickname は member visibility
    });

    it("PublicMemberProfile にはタグ情報が含まれる", async () => {
      const result = await buildPublicMemberProfile(ctx, asMemberId("m_001"));
      expect(result).not.toBeNull();
      expect(result?.tags).toHaveLength(1);
      expect(result?.tags[0]?.code).toBe("engineer");
    });

    it("存在しない member_id では null を返す", async () => {
      const result = await buildPublicMemberProfile(ctx, asMemberId("nonexistent"));
      expect(result).toBeNull();
    });
  });

  describe("buildMemberProfile", () => {
    it("本人用プロフィールを構築できる", async () => {
      const result = await buildMemberProfile(ctx, asMemberId("m_001"));
      expect(result).not.toBeNull();
      expect(result?.memberId).toBe("m_001");
      expect(result?.responseEmail).toBe("user1@example.com");
    });

    it("visibility=public と member のフィールドを含む", async () => {
      const result = await buildMemberProfile(ctx, asMemberId("m_001"));
      expect(result).not.toBeNull();
      const allFields = result!.sections.flatMap((s) => s.fields);
      const fieldKeys = allFields.map((f) => f.stableKey);
      expect(fieldKeys).toContain("fullName"); // public
      expect(fieldKeys).toContain("nickname"); // member
    });

    it("visibility='admin' のフィールドは MemberProfile に含まれない", async () => {
      const result = await buildMemberProfile(ctx, asMemberId("m_001"));
      expect(result).not.toBeNull();
      const allFields = result!.sections.flatMap((s) => s.fields);
      const fieldKeys = allFields.map((f) => f.stableKey);
      expect(fieldKeys).not.toContain("admin_note_field");
    });

    it("is_deleted=1 の会員は null を返す", async () => {
      const result = await buildMemberProfile(ctx, asMemberId("m_003"));
      expect(result).toBeNull();
    });

    it("publicConsent と rulesConsent が含まれる", async () => {
      const result = await buildMemberProfile(ctx, asMemberId("m_001"));
      expect(result?.publicConsent).toBe("consented");
      expect(result?.rulesConsent).toBe("consented");
    });

    it("attendanceProvider 未注入時は attendance:[] のフォールバックを返す（02a 互換）", async () => {
      const result = await buildMemberProfile(ctx, asMemberId("m_001"));
      expect(result?.attendance).toEqual([]);
    });

    it("attendanceProvider 注入時は実データが MemberProfile に注入される", async () => {
      const provider = stubProvider({
        m_001: [{ sessionId: "s_001", title: "総会", heldOn: "2026-01-15" }],
      });
      const result = await buildMemberProfile(ctx, asMemberId("m_001"), {
        attendanceProvider: provider,
      });
      expect(result?.attendance).toEqual([
        { sessionId: "s_001", title: "総会", heldOn: "2026-01-15" },
      ]);
    });
  });

  describe("buildAdminMemberDetailView", () => {
    it("管理者用詳細ビューを構築できる", async () => {
      const adminNotes = [
        {
          actor: asAdminId("admin_001"),
          action: "status_change",
          occurredAt: "2026-01-01T00:00:00Z",
          note: "公開状態に変更",
        },
      ];
      const result = await buildAdminMemberDetailView(
        ctx,
        asMemberId("m_001"),
        adminNotes,
      );
      expect(result).not.toBeNull();
      expect(result?.identityMemberId).toBe("m_001");
    });

    it("全 visibility のフィールドを含む（admin フィールドも含む）", async () => {
      const result = await buildAdminMemberDetailView(
        ctx,
        asMemberId("m_001"),
        [],
      );
      expect(result).not.toBeNull();
      const allFields = result!.profile.sections.flatMap((s) => s.fields);
      const fieldKeys = allFields.map((f) => f.stableKey);
      expect(fieldKeys).toContain("fullName");
      expect(fieldKeys).toContain("nickname");
      expect(fieldKeys).toContain("admin_note_field");
    });

    it("adminNotes が audit フィールドに反映される", async () => {
      const adminNotes = [
        {
          actor: asAdminId("admin_001"),
          action: "delete",
          occurredAt: "2026-01-01T00:00:00Z",
          note: "退会申請",
        },
      ];
      const result = await buildAdminMemberDetailView(
        ctx,
        asMemberId("m_001"),
        adminNotes,
      );
      expect(result?.audit).toHaveLength(1);
      expect(result?.audit[0]?.action).toBe("delete");
    });

    it("adminNotes は引数として受け取り、PublicMemberProfile には含まれない（不変条件 #12）", async () => {
      // PublicMemberProfile を取得して adminNotes が含まれないことを確認
      const publicProfile = await buildPublicMemberProfile(ctx, asMemberId("m_001"));
      expect(publicProfile).not.toBeNull();
      // PublicMemberProfile には audit フィールドが存在しない
      expect("audit" in (publicProfile ?? {})).toBe(false);
    });

    it("削除済み会員の詳細も取得できる（admin は削除済みを参照可能）", async () => {
      const result = await buildAdminMemberDetailView(
        ctx,
        asMemberId("m_003"),
        [],
      );
      expect(result).not.toBeNull();
      expect(result?.status.isDeleted).toBe(true);
    });

    it("attendanceProvider 注入時は admin profile.attendance に実データが注入される", async () => {
      const provider = stubProvider({
        m_001: [
          { sessionId: "s_002", title: "理事会", heldOn: "2026-02-10" },
          { sessionId: "s_001", title: "新年会", heldOn: "2026-01-05" },
        ],
      });
      const result = await buildAdminMemberDetailView(
        ctx,
        asMemberId("m_001"),
        [],
        { attendanceProvider: provider },
      );
      expect(result?.profile.attendance).toHaveLength(2);
      expect(result?.profile.attendance[0]?.sessionId).toBe("s_002");
    });
  });

  describe("buildPublicMemberListItems", () => {
    it("公開可能な会員のみリストに含む", async () => {
      const result = await buildPublicMemberListItems(ctx, [
        asMemberId("m_001"),
        asMemberId("m_002"),
        asMemberId("m_003"),
      ]);
      // m_001 のみ公開可能（m_002 は非同意、m_003 は削除済み）
      expect(result).toHaveLength(1);
      expect(result[0]?.memberId).toBe("m_001");
    });

    it("空配列を渡すと空配列を返す", async () => {
      const result = await buildPublicMemberListItems(ctx, []);
      expect(result).toHaveLength(0);
    });

    it("リストアイテムに必要なフィールドが含まれる", async () => {
      const result = await buildPublicMemberListItems(ctx, [asMemberId("m_001")]);
      expect(result).toHaveLength(1);
      expect(result[0]?.fullName).toBe("山田 太郎");
      expect(result[0]?.occupation).toBe("エンジニア");
      expect(result[0]?.location).toBe("兵庫県神戸市");
    });

    it("複数 member_id を固定回数のバッチクエリで組み立てる", async () => {
      const queries: string[] = [];
      const originalPrepare = ctx.db.prepare.bind(ctx.db);
      ctx.db.prepare = ((sql: string) => {
        queries.push(sql);
        return originalPrepare(sql);
      }) as typeof ctx.db.prepare;

      const result = await buildPublicMemberListItems(ctx, [
        asMemberId("m_001"),
        asMemberId("m_002"),
        asMemberId("m_003"),
      ]);

      expect(result).toHaveLength(1);
      expect(queries).toHaveLength(3);
      expect(queries.some((sql) => sql.includes("member_id IN"))).toBe(true);
      expect(queries.some((sql) => sql.includes("response_id IN"))).toBe(true);
    });
  });
});
