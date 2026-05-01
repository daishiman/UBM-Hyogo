// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "./_setup";
import * as adminNotes from "../adminNotes";
import { adminEmail } from "../_shared/brand";
import { asMemberId } from "@ubm-hyogo/shared";
import { seedAdminNotes } from "../__fixtures__/admin.fixture";

describe("adminNotes (CRUD)", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await env.loadFixtures([seedAdminNotes]);
  });

  it("listByMemberId で対象 member の notes を取得", async () => {
    const rows = await adminNotes.listByMemberId(env.ctx, asMemberId("m_001"));
    expect(rows.length).toBe(1);
    expect(rows[0]!.body).toBe("初回コンタクト OK");
  });

  it("AC-4 / AC-6: listByMemberId は対象 member だけを返し、未知 member は空配列", async () => {
    const rows = await adminNotes.listByMemberId(env.ctx, asMemberId("m_001"));
    expect(rows).toHaveLength(1);
    expect(rows.every((row) => row.memberId === "m_001")).toBe(true);
    expect(rows.map((row) => row.body)).not.toContain("要フォロー");

    await expect(
      adminNotes.listByMemberId(env.ctx, asMemberId("m_unknown")),
    ).resolves.toEqual([]);
  });

  it("AC-5: listByMemberId は created_at DESC で返す", async () => {
    await env.ctx.db
      .prepare(
        `INSERT INTO admin_member_notes
         (note_id, member_id, body, created_by, updated_by, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?4, ?5, ?5),
                (?6, ?2, ?7, ?4, ?4, ?8, ?8)`,
      )
      .bind(
        "note_old",
        "m_010",
        "old note",
        "owner@example.com",
        "2026-04-01T00:00:00Z",
        "note_new",
        "new note",
        "2026-04-03T00:00:00Z",
      )
      .run();

    const rows = await adminNotes.listByMemberId(env.ctx, asMemberId("m_010"));
    expect(rows.map((row) => row.noteId)).toEqual(["note_new", "note_old"]);
  });

  it("create で note を追加", async () => {
    const created = await adminNotes.create(env.ctx, {
      memberId: asMemberId("m_010"),
      body: "新規メモ",
      createdBy: adminEmail("owner@example.com"),
    });
    expect(created.body).toBe("新規メモ");
    expect(created.noteType).toBe("general");
    const found = await adminNotes.findById(env.ctx, created.noteId);
    expect(found?.body).toBe("新規メモ");
    expect(found?.noteType).toBe("general");
  });

  it("create で visibility/delete request type を保持し pending 判定できる", async () => {
    const memberId = asMemberId("m_010");
    expect(
      await adminNotes.hasPendingRequest(env.ctx, memberId, "visibility_request"),
    ).toBe(false);

    const created = await adminNotes.create(env.ctx, {
      memberId,
      body: JSON.stringify({ reason: "一時停止", payload: null }),
      createdBy: adminEmail("owner@example.com"),
      noteType: "visibility_request",
    });

    expect(created.noteType).toBe("visibility_request");
    expect(created.requestStatus).toBe("pending");
    expect(created.resolvedAt).toBeNull();
    expect(created.resolvedByAdminId).toBeNull();
    expect(
      await adminNotes.hasPendingRequest(env.ctx, memberId, "visibility_request"),
    ).toBe(true);
    expect(
      await adminNotes.hasPendingRequest(env.ctx, memberId, "delete_request"),
    ).toBe(false);

    const latest = await adminNotes.findLatestByMemberAndType(
      env.ctx,
      memberId,
      "visibility_request",
    );
    expect(latest?.noteId).toBe(created.noteId);
  });

  it("AC-1: general 行は request_status / resolved_at / resolved_by_admin_id 全て NULL", async () => {
    const created = await adminNotes.create(env.ctx, {
      memberId: asMemberId("m_010"),
      body: "汎用メモ",
      createdBy: adminEmail("owner@example.com"),
    });
    expect(created.noteType).toBe("general");
    expect(created.requestStatus).toBeNull();
    expect(created.resolvedAt).toBeNull();
    expect(created.resolvedByAdminId).toBeNull();
    const fetched = await adminNotes.findById(env.ctx, created.noteId);
    expect(fetched?.requestStatus).toBeNull();
  });

  it("AC-4: markResolved で pending → resolved に遷移し metadata が記録される", async () => {
    const memberId = asMemberId("m_010");
    const created = await adminNotes.create(env.ctx, {
      memberId,
      body: "視認停止依頼",
      createdBy: adminEmail("owner@example.com"),
      noteType: "visibility_request",
    });
    const before = Date.now();
    const result = await adminNotes.markResolved(
      env.ctx,
      created.noteId,
      "adm_owner",
    );
    expect(result).toBe(created.noteId);

    const after = await adminNotes.findById(env.ctx, created.noteId);
    expect(after?.requestStatus).toBe("resolved");
    expect(after?.resolvedByAdminId).toBe("adm_owner");
    expect(after?.resolvedAt).not.toBeNull();
    expect(after?.resolvedAt ?? 0).toBeGreaterThanOrEqual(before);
    // hasPendingRequest は resolved 行を false として扱う（AC-3）
    expect(
      await adminNotes.hasPendingRequest(env.ctx, memberId, "visibility_request"),
    ).toBe(false);
  });

  it("AC-4: general 行への markResolved は null（UPDATE 0 件）", async () => {
    const created = await adminNotes.create(env.ctx, {
      memberId: asMemberId("m_010"),
      body: "汎用",
      createdBy: adminEmail("owner@example.com"),
    });
    expect(
      await adminNotes.markResolved(env.ctx, created.noteId, "adm_owner"),
    ).toBeNull();
    const after = await adminNotes.findById(env.ctx, created.noteId);
    expect(after?.requestStatus).toBeNull();
  });

  it("AC-5: markRejected で pending → rejected に遷移し reason が body 末尾に追記される", async () => {
    const memberId = asMemberId("m_010");
    const created = await adminNotes.create(env.ctx, {
      memberId,
      body: "退会希望",
      createdBy: adminEmail("owner@example.com"),
      noteType: "delete_request",
    });
    const result = await adminNotes.markRejected(
      env.ctx,
      created.noteId,
      "adm_owner",
      "本人確認できず",
    );
    expect(result).toBe(created.noteId);

    const after = await adminNotes.findById(env.ctx, created.noteId);
    expect(after?.requestStatus).toBe("rejected");
    expect(after?.resolvedByAdminId).toBe("adm_owner");
    expect(after?.body).toContain("退会希望");
    expect(after?.body).toContain("[rejected] 本人確認できず");
  });

  it("AC-5: markRejected は UPDATE 時点の body に reason を追記する", async () => {
    const created = await adminNotes.create(env.ctx, {
      memberId: asMemberId("m_010"),
      body: "初期本文",
      createdBy: adminEmail("owner@example.com"),
      noteType: "delete_request",
    });
    await env.ctx.db
      .prepare("UPDATE admin_member_notes SET body = body || ?1 WHERE note_id = ?2")
      .bind("\n追記済みメモ", created.noteId)
      .run();

    expect(
      await adminNotes.markRejected(
        env.ctx,
        created.noteId,
        "adm_owner",
        "対象外",
      ),
    ).toBe(created.noteId);
    const after = await adminNotes.findById(env.ctx, created.noteId);
    expect(after?.body).toContain("初期本文");
    expect(after?.body).toContain("追記済みメモ");
    expect(after?.body).toContain("[rejected] 対象外");
  });

  it("AC-6: resolved 行への再 markResolved / markRejected は null（pending ガード）", async () => {
    const created = await adminNotes.create(env.ctx, {
      memberId: asMemberId("m_010"),
      body: "stop",
      createdBy: adminEmail("owner@example.com"),
      noteType: "visibility_request",
    });
    expect(
      await adminNotes.markResolved(env.ctx, created.noteId, "adm_owner"),
    ).toBe(created.noteId);

    expect(
      await adminNotes.markResolved(env.ctx, created.noteId, "adm_owner"),
    ).toBeNull();
    expect(
      await adminNotes.markRejected(
        env.ctx,
        created.noteId,
        "adm_owner",
        "後出し",
      ),
    ).toBeNull();
  });

  it("AC-7: resolved 行のみ存在する member は再度 hasPendingRequest=false で再申請可能", async () => {
    const memberId = asMemberId("m_010");
    const first = await adminNotes.create(env.ctx, {
      memberId,
      body: "1回目",
      createdBy: adminEmail("owner@example.com"),
      noteType: "visibility_request",
    });
    await adminNotes.markResolved(env.ctx, first.noteId, "adm_owner");
    expect(
      await adminNotes.hasPendingRequest(env.ctx, memberId, "visibility_request"),
    ).toBe(false);
    // 再申請の INSERT が pending として通る
    const second = await adminNotes.create(env.ctx, {
      memberId,
      body: "2回目",
      createdBy: adminEmail("owner@example.com"),
      noteType: "visibility_request",
    });
    expect(second.requestStatus).toBe("pending");
    expect(
      await adminNotes.hasPendingRequest(env.ctx, memberId, "visibility_request"),
    ).toBe(true);
  });

  it("markResolved / markRejected: 未知 id は null", async () => {
    expect(
      await adminNotes.markResolved(env.ctx, "note_unknown", "adm_owner"),
    ).toBeNull();
    expect(
      await adminNotes.markRejected(
        env.ctx,
        "note_unknown",
        "adm_owner",
        "x",
      ),
    ).toBeNull();
  });

  it("update で body を変更", async () => {
    const u = await adminNotes.update(
      env.ctx,
      "note_001",
      "更新後本文",
      adminEmail("owner@example.com"),
    );
    expect(u?.body).toBe("更新後本文");
    expect(u?.updatedBy).toBe("owner@example.com");
  });

  it("update で未知 id は null", async () => {
    const u = await adminNotes.update(
      env.ctx,
      "note_unknown",
      "x",
      adminEmail("owner@example.com"),
    );
    expect(u).toBeNull();
  });

  it("remove で削除し、再取得は null", async () => {
    expect(await adminNotes.remove(env.ctx, "note_002")).toBe(true);
    expect(await adminNotes.findById(env.ctx, "note_002")).toBeNull();
  });

  it("remove で未知 id は false", async () => {
    expect(await adminNotes.remove(env.ctx, "note_unknown")).toBe(false);
  });

  // AC-2 構造防衛: PublicMemberProfile / MemberProfile に adminNotes プロパティが無い
  // ことを type-level で検証（コンパイルが通れば OK）。
  it("AC-2: PublicMemberProfile / MemberProfile に adminNotes が混入しない（型不在）", () => {
    type ViewModelKeys = keyof import("@ubm-hyogo/shared").PublicMemberProfile;
    type MemberProfileKeys = keyof import("@ubm-hyogo/shared").MemberProfile;
    const _check: Exclude<ViewModelKeys, "memberId" | "summary" | "publicSections" | "tags"> extends never ? true : false = true;
    const _memberCheck: "adminNotes" extends MemberProfileKeys ? false : true = true;
    expect(_check).toBe(true);
    expect(_memberCheck).toBe(true);
  });
});
