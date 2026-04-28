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

  it("create で note を追加", async () => {
    const created = await adminNotes.create(env.ctx, {
      memberId: asMemberId("m_010"),
      body: "新規メモ",
      createdBy: adminEmail("owner@example.com"),
    });
    expect(created.body).toBe("新規メモ");
    const found = await adminNotes.findById(env.ctx, created.noteId);
    expect(found?.body).toBe("新規メモ");
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
