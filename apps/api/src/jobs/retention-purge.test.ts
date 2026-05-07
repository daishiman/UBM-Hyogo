// Issue #402: retention purge job のユニットテスト。
// 軽量な in-memory D1 fake で SQL を文字列ディスパッチし、対象テーブルの mutation/select を再現する。

import { beforeEach, describe, expect, it } from "vitest";
import { resolveRetentionPurgeOptions, runRetentionPurge } from "./retention-purge";
import { RETENTION_DAYS, RETENTION_POLICY_VERSION } from "../services/retention-policy";

interface DeletedRow {
  member_id: string;
  deleted_at: string;
  deleted_by: string;
  reason: string;
  purged_at: string | null;
  retention_policy_version: string | null;
}
interface IdentityRow {
  member_id: string;
  response_email: string;
}
interface StatusRow {
  member_id: string;
}
interface ResponseRow {
  response_id: string;
  response_email: string;
}
interface FieldRow {
  response_id: string;
  stable_key: string;
}
interface SectionRow {
  response_id: string;
  section_key: string;
}
interface AuditRow {
  audit_id: string;
  action: string;
  target_type: string;
  target_id: string;
  after_json: string;
  created_at: string;
}

class RetentionFakeD1 {
  deletedMembers: DeletedRow[] = [];
  identities: IdentityRow[] = [];
  statuses: StatusRow[] = [];
  responses: ResponseRow[] = [];
  fields: FieldRow[] = [];
  sections: SectionRow[] = [];
  audit: AuditRow[] = [];

  prepare(sql: string) {
    return new RetentionFakeStmt(this, sql);
  }
  async exec() {
    return { count: 0, duration: 0 };
  }
  async batch<T>(stmts: ReadonlyArray<{ run(): Promise<T> }>): Promise<T[]> {
    const out: T[] = [];
    for (const s of stmts) out.push(await s.run());
    return out;
  }
}

class RetentionFakeStmt {
  private bindings: unknown[] = [];
  constructor(
    private readonly db: RetentionFakeD1,
    private readonly sql: string,
  ) {}
  bind(...values: unknown[]): this {
    this.bindings = values;
    return this;
  }
  async first<T = unknown>(): Promise<T | null> {
    return runFirst<T>(this.db, this.sql, this.bindings);
  }
  async all<T = unknown>(): Promise<{ results: T[] }> {
    return { results: runAll<T>(this.db, this.sql, this.bindings) };
  }
  async run() {
    const changes = runMutation(this.db, this.sql, this.bindings);
    return { success: true as const, meta: { changes, last_row_id: 0 } };
  }
}

function normalize(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

function isDue(row: DeletedRow, retentionDays: number, nowIso: string): boolean {
  if (row.purged_at !== null) return false;
  const due = new Date(row.deleted_at).getTime() + retentionDays * 86400000;
  return due <= new Date(nowIso).getTime();
}

function runFirst<T>(db: RetentionFakeD1, sql: string, b: unknown[]): T | null {
  const s = normalize(sql);
  if (/FROM member_identities WHERE member_id = \?1/i.test(s)) {
    const r = db.identities.find((x) => x.member_id === b[0]);
    return (r ? { response_email: r.response_email } : null) as T | null;
  }
  if (/SELECT 1 AS one FROM member_status WHERE member_id = \?1/i.test(s)) {
    return (db.statuses.find((x) => x.member_id === b[0])
      ? ({ one: 1 } as unknown as T)
      : null);
  }
  if (/COUNT\(\*\) AS cnt FROM member_responses WHERE response_email = \?1/i.test(s)) {
    const cnt = db.responses.filter((x) => x.response_email === b[0]).length;
    return { cnt } as unknown as T;
  }
  return null;
}

function runAll<T>(db: RetentionFakeD1, sql: string, b: unknown[]): T[] {
  const s = normalize(sql);
  if (/SELECT member_id, deleted_at FROM deleted_members/i.test(s)) {
    const retentionDays = Number(b[0]);
    const nowIso = String(b[1]);
    const limit = Number(b[2]);
    return [...db.deletedMembers]
      .filter((r) => isDue(r, retentionDays, nowIso))
      .sort((a, c) => a.deleted_at.localeCompare(c.deleted_at))
      .slice(0, limit)
      .map((r) => ({ member_id: r.member_id, deleted_at: r.deleted_at })) as T[];
  }
  return [];
}

function runMutation(db: RetentionFakeD1, sql: string, b: unknown[]): number {
  const s = normalize(sql);
  if (/DELETE FROM response_fields WHERE response_id IN/i.test(s)) {
    const email = b[0];
    const ids = new Set(
      db.responses.filter((x) => x.response_email === email).map((x) => x.response_id),
    );
    const before = db.fields.length;
    db.fields = db.fields.filter((f) => !ids.has(f.response_id));
    return before - db.fields.length;
  }
  if (/DELETE FROM response_sections WHERE response_id IN/i.test(s)) {
    const email = b[0];
    const ids = new Set(
      db.responses.filter((x) => x.response_email === email).map((x) => x.response_id),
    );
    const before = db.sections.length;
    db.sections = db.sections.filter((f) => !ids.has(f.response_id));
    return before - db.sections.length;
  }
  if (/DELETE FROM member_responses WHERE response_email = \?1/i.test(s)) {
    const before = db.responses.length;
    db.responses = db.responses.filter((x) => x.response_email !== b[0]);
    return before - db.responses.length;
  }
  if (/DELETE FROM member_identities WHERE member_id = \?1/i.test(s)) {
    const before = db.identities.length;
    db.identities = db.identities.filter((x) => x.member_id !== b[0]);
    return before - db.identities.length;
  }
  if (/DELETE FROM member_status WHERE member_id = \?1/i.test(s)) {
    const before = db.statuses.length;
    db.statuses = db.statuses.filter((x) => x.member_id !== b[0]);
    return before - db.statuses.length;
  }
  if (/UPDATE deleted_members SET purged_at = \?2/i.test(s)) {
    const memberId = b[0];
    const purgedAt = String(b[1]);
    const version = String(b[2]);
    const r = db.deletedMembers.find(
      (x) => x.member_id === memberId && x.purged_at === null,
    );
    if (!r) return 0;
    r.purged_at = purgedAt;
    r.retention_policy_version = version;
    return 1;
  }
  if (/INSERT INTO audit_log/i.test(s)) {
    db.audit.push({
      audit_id: String(b[0]),
      action: "retention_purge",
      target_type: "member",
      target_id: String(b[1]),
      after_json: String(b[2]),
      created_at: String(b[3]),
    });
    return 1;
  }
  return 0;
}

function seed(db: RetentionFakeD1) {
  // 期限到来 (200 日前削除)
  db.deletedMembers.push({
    member_id: "m-due",
    deleted_at: "2025-10-19T00:00:00.000Z",
    deleted_by: "admin@example.test",
    reason: "user request",
    purged_at: null,
    retention_policy_version: null,
  });
  db.identities.push({ member_id: "m-due", response_email: "due@example.test" });
  db.statuses.push({ member_id: "m-due" });
  db.responses.push(
    { response_id: "r-due-1", response_email: "due@example.test" },
    { response_id: "r-due-2", response_email: "due@example.test" },
  );
  db.fields.push(
    { response_id: "r-due-1", stable_key: "name" },
    { response_id: "r-due-2", stable_key: "phone" },
  );
  db.sections.push({ response_id: "r-due-1", section_key: "s1" });

  // 期限未到来 (10 日前削除)
  db.deletedMembers.push({
    member_id: "m-fresh",
    deleted_at: "2026-04-26T00:00:00.000Z",
    deleted_by: "admin@example.test",
    reason: "fresh",
    purged_at: null,
    retention_policy_version: null,
  });
  db.identities.push({ member_id: "m-fresh", response_email: "fresh@example.test" });
  db.statuses.push({ member_id: "m-fresh" });
  db.responses.push({ response_id: "r-fresh-1", response_email: "fresh@example.test" });
}

const NOW = new Date("2026-05-06T00:00:00.000Z");

describe("runRetentionPurge", () => {
  let db: RetentionFakeD1;
  beforeEach(() => {
    db = new RetentionFakeD1();
    seed(db);
  });

  it("dry-run mode は副作用ゼロで対象のみ返す", async () => {
    const env = { DB: db as unknown as D1Database };
    const before = JSON.stringify({
      identities: db.identities,
      statuses: db.statuses,
      responses: db.responses,
      fields: db.fields,
      sections: db.sections,
      deletedMembers: db.deletedMembers,
      audit: db.audit,
    });
    const report = await runRetentionPurge(env, { mode: "dry-run", now: NOW });
    expect(report.mode).toBe("dry-run");
    expect(report.targets.map((t) => t.memberId)).toEqual(["m-due"]);
    expect(report.applied).toEqual([]);
    expect(report.errors).toEqual([]);
    expect(report.targets[0].childCounts).toEqual({
      memberResponses: 2,
      memberIdentities: 1,
      memberStatus: 1,
    });
    const after = JSON.stringify({
      identities: db.identities,
      statuses: db.statuses,
      responses: db.responses,
      fields: db.fields,
      sections: db.sections,
      deletedMembers: db.deletedMembers,
      audit: db.audit,
    });
    expect(after).toBe(before);
  });

  it("apply mode は対象 row を物理削除し tombstone を更新する", async () => {
    const env = { DB: db as unknown as D1Database };
    const report = await runRetentionPurge(env, { mode: "apply", now: NOW });
    expect(report.applied.map((a) => a.memberId)).toEqual(["m-due"]);
    expect(report.errors).toEqual([]);
    expect(db.identities.find((x) => x.member_id === "m-due")).toBeUndefined();
    expect(db.statuses.find((x) => x.member_id === "m-due")).toBeUndefined();
    expect(db.responses.filter((x) => x.response_email === "due@example.test")).toEqual(
      [],
    );
    expect(db.fields).toEqual([]);
    expect(db.sections).toEqual([]);
    const tomb = db.deletedMembers.find((x) => x.member_id === "m-due");
    expect(tomb?.purged_at).toBe(NOW.toISOString());
    expect(tomb?.retention_policy_version).toBe(RETENTION_POLICY_VERSION);
  });

  it("期限未到来 row は対象外で残る", async () => {
    const env = { DB: db as unknown as D1Database };
    const report = await runRetentionPurge(env, { mode: "apply", now: NOW });
    expect(report.targets.map((t) => t.memberId)).not.toContain("m-fresh");
    expect(db.identities.find((x) => x.member_id === "m-fresh")).toBeDefined();
    expect(db.responses.find((x) => x.response_id === "r-fresh-1")).toBeDefined();
    expect(
      db.deletedMembers.find((x) => x.member_id === "m-fresh")?.purged_at,
    ).toBeNull();
  });

  it("audit_log 行に PII（email / reason 本文）を含めない", async () => {
    const env = { DB: db as unknown as D1Database };
    await runRetentionPurge(env, { mode: "apply", now: NOW });
    expect(db.audit).toHaveLength(1);
    const audit = db.audit[0];
    expect(audit.action).toBe("retention_purge");
    expect(audit.target_id).toBe("m-due");
    expect(audit.after_json).not.toContain("due@example.test");
    expect(audit.after_json).not.toContain("user request");
    const parsed = JSON.parse(audit.after_json);
    expect(parsed).toEqual({
      member_id: "m-due",
      purged_at: NOW.toISOString(),
      retention_policy_version: RETENTION_POLICY_VERSION,
    });
  });

  it("既に purged_at が入っている row は重複処理しない（idempotent）", async () => {
    db.deletedMembers[0].purged_at = "2026-04-30T00:00:00.000Z";
    db.deletedMembers[0].retention_policy_version = RETENTION_POLICY_VERSION;
    const env = { DB: db as unknown as D1Database };
    const report = await runRetentionPurge(env, { mode: "apply", now: NOW });
    expect(report.targets).toEqual([]);
    expect(report.applied).toEqual([]);
    expect(db.audit).toEqual([]);
  });

  it("limit で対象 row の処理上限を制御できる", async () => {
    db.deletedMembers.push({
      member_id: "m-due-2",
      deleted_at: "2025-10-20T00:00:00.000Z",
      deleted_by: "admin@example.test",
      reason: "second",
      purged_at: null,
      retention_policy_version: null,
    });
    const env = { DB: db as unknown as D1Database };
    const report = await runRetentionPurge(env, {
      mode: "dry-run",
      limit: 1,
      now: NOW,
    });
    expect(report.targets).toHaveLength(1);
    expect(report.targets[0].memberId).toBe("m-due");
  });

  it("deletedAtPlus180DaysAt は deleted_at + 180 日に等しい", async () => {
    const env = { DB: db as unknown as D1Database };
    const report = await runRetentionPurge(env, { mode: "dry-run", now: NOW });
    const t = report.targets[0];
    const expected = new Date(
      new Date(t.deletedAt).getTime() + RETENTION_DAYS * 86400000,
    ).toISOString();
    expect(t.deletedAtPlus180DaysAt).toBe(expected);
  });
});

describe("resolveRetentionPurgeOptions", () => {
  it("未設定時は dry-run に倒す", () => {
    expect(resolveRetentionPurgeOptions({})).toEqual({ mode: "dry-run" });
  });

  it("apply は明示設定時のみ返す", () => {
    expect(
      resolveRetentionPurgeOptions({
        RETENTION_PURGE_MODE: "apply",
        RETENTION_PURGE_LIMIT: "1",
      }),
    ).toEqual({ mode: "apply", limit: 1 });
  });

  it("off は job を起動しない", () => {
    expect(resolveRetentionPurgeOptions({ RETENTION_PURGE_MODE: "off" })).toBeNull();
  });

  it("不正な mode / limit は fail-closed", () => {
    expect(() =>
      resolveRetentionPurgeOptions({ RETENTION_PURGE_MODE: "production" }),
    ).toThrow(/RETENTION_PURGE_MODE/);
    expect(() =>
      resolveRetentionPurgeOptions({
        RETENTION_PURGE_MODE: "apply",
        RETENTION_PURGE_LIMIT: "0",
      }),
    ).toThrow(/RETENTION_PURGE_LIMIT/);
  });
});
