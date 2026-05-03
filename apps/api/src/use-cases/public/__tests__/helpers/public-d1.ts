// UT-08A-01: public use-case と route handler の unit test 用 D1 mock。
// 仕様書 docs/30-workflows/ut-08a-01-public-use-case-coverage-hardening/index.md 主要シグネチャに準拠。
// 各 SQL を fragment match で dispatch し、PublicD1MockOptions の fixture を返す。
// queryLog を渡すと実行 SQL を呼び出し側で検証でき、mock が暗黙に通した query drift を検出できる。

import type { D1Database } from "@cloudflare/workers-types";

export interface PublicD1MockOptions {
  latestVersion?: unknown | null;
  schemaFields?: unknown[];
  publicMembers?: unknown[];
  publicMemberCount?: number;
  responseFieldsByResponseId?: Record<string, unknown[]>;
  memberStatusById?: Record<string, unknown | null>;
  currentResponseByMemberId?: Record<string, unknown | null>;
  tagsByMemberId?: Record<string, unknown[]>;
  meetings?: unknown[];
  syncJobs?: Partial<Record<"schema_sync" | "response_sync", unknown | null>>;
  failOnSql?: RegExp | string;
  queryLog?: string[];
}

interface PreparedRow {
  response_id?: string;
  stable_key?: string;
  value_json?: string | null;
}

const matchesFail = (sql: string, opt: RegExp | string | undefined): boolean => {
  if (!opt) return false;
  return typeof opt === "string" ? sql.includes(opt) : opt.test(sql);
};

const isEligibleStatus = (s: Record<string, unknown> | null | undefined): boolean =>
  !!s &&
  s["public_consent"] === "consented" &&
  s["publish_state"] === "public" &&
  s["is_deleted"] === 0;

const aggregateByStableKey = (
  options: PublicD1MockOptions,
  stableKey: string,
): Array<{ value: string | null; cnt: number }> => {
  const fields = options.responseFieldsByResponseId ?? {};
  const members = (options.publicMembers ?? []) as Array<Record<string, unknown>>;
  const counts = new Map<string, number>();
  for (const m of members) {
    const rid = String(m["current_response_id"] ?? "");
    const rows = (fields[rid] ?? []) as PreparedRow[];
    for (const f of rows) {
      if (f.stable_key !== stableKey) continue;
      const key = f.value_json ?? "__null__";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries()).map(([value, cnt]) => ({
    value: value === "__null__" ? null : value,
    cnt,
  }));
};

class MockStmt {
  private bindings: unknown[] = [];

  constructor(
    private readonly sql: string,
    private readonly options: PublicD1MockOptions,
  ) {}

  bind(...values: unknown[]): MockStmt {
    this.bindings = values;
    return this;
  }

  private throwIfFailing(): void {
    if (matchesFail(this.sql, this.options.failOnSql)) {
      throw new Error(`MockD1Failure: ${this.sql.slice(0, 80)}`);
    }
  }

  async first<T = unknown>(): Promise<T | null> {
    this.throwIfFailing();
    const sql = this.sql;

    if (sql.includes("FROM schema_versions") && sql.includes("state = 'active'")) {
      return (this.options.latestVersion ?? null) as T | null;
    }

    if (sql.includes("FROM member_status") && sql.includes("WHERE member_id = ?1")) {
      const key = String(this.bindings[0]);
      return (this.options.memberStatusById?.[key] ?? null) as T | null;
    }

    if (
      sql.includes("FROM member_responses mr") &&
      sql.includes("JOIN member_identities mi") &&
      sql.includes("mi.member_id = ?1")
    ) {
      const key = String(this.bindings[0]);
      return (this.options.currentResponseByMemberId?.[key] ?? null) as T | null;
    }

    if (sql.includes("SELECT 1 AS hit FROM member_status s")) {
      const key = String(this.bindings[0]);
      const status = this.options.memberStatusById?.[key] as
        | Record<string, unknown>
        | null
        | undefined;
      return isEligibleStatus(status) ? ({ hit: 1 } as T) : null;
    }

    if (sql.includes("COUNT(DISTINCT mi.member_id) AS cnt")) {
      return ({ cnt: this.options.publicMemberCount ?? 0 } as T);
    }

    if (
      sql.includes("COUNT(*) AS cnt FROM member_status s") &&
      sql.includes("JOIN member_identities mi")
    ) {
      return ({ cnt: this.options.publicMemberCount ?? 0 } as T);
    }

    if (sql.includes("COUNT(*) AS cnt FROM member_identities")) {
      return ({ cnt: (this.options.publicMembers ?? []).length } as T);
    }

    if (
      sql.includes("COUNT(*) AS cnt FROM meeting_sessions") &&
      sql.includes("held_on >=")
    ) {
      const start = String(this.bindings[0] ?? "");
      const end = String(this.bindings[1] ?? "");
      const meetings = (this.options.meetings ?? []) as Array<Record<string, unknown>>;
      const cnt = meetings.filter((m) => {
        const held = String(m["held_on"] ?? m["heldOn"] ?? "");
        return held >= start && held < end;
      }).length;
      return ({ cnt } as T);
    }

    if (
      sql.includes("FROM sync_jobs WHERE job_type = ?1") &&
      sql.includes("LIMIT 1")
    ) {
      const jobType = String(this.bindings[0]);
      const job =
        jobType === "schema_sync" || jobType === "response_sync"
          ? this.options.syncJobs?.[jobType]
          : null;
      return (job ?? null) as T | null;
    }

    return null;
  }

  async all<T = unknown>(): Promise<{ results: T[] }> {
    this.throwIfFailing();
    const sql = this.sql;

    if (sql.includes("FROM schema_questions") && sql.includes("WHERE revision_id = ?")) {
      return { results: (this.options.schemaFields ?? []) as T[] };
    }

    if (
      sql.includes("FROM response_fields") &&
      sql.includes("WHERE response_id = ?1")
    ) {
      const key = String(this.bindings[0]);
      return {
        results: (this.options.responseFieldsByResponseId?.[key] ?? []) as T[],
      };
    }

    if (
      sql.includes("FROM member_tags mt") &&
      sql.includes("JOIN tag_definitions td") &&
      sql.includes("mt.member_id = ?1")
    ) {
      const key = String(this.bindings[0]);
      return { results: (this.options.tagsByMemberId?.[key] ?? []) as T[] };
    }

    if (sql.includes("SELECT mi.member_id, mi.current_response_id")) {
      return { results: (this.options.publicMembers ?? []) as T[] };
    }

    if (
      sql.includes("rf.value_json AS value") &&
      sql.includes("rf.stable_key = ?")
    ) {
      const stableKey = String(this.bindings[this.bindings.length - 1]);
      return {
        results: aggregateByStableKey(this.options, stableKey) as T[],
      };
    }

    if (
      sql.includes("FROM meeting_sessions") &&
      sql.includes("ORDER BY held_on DESC")
    ) {
      const limit = Number(this.bindings[this.bindings.length - 1] ?? 0);
      const meetings = (this.options.meetings ?? []) as Array<Record<string, unknown>>;
      return { results: meetings.slice(0, limit) as T[] };
    }

    return { results: [] };
  }

  async run(): Promise<{
    success: boolean;
    meta: { changes: number; last_row_id: number };
  }> {
    this.throwIfFailing();
    return { success: true, meta: { changes: 0, last_row_id: 0 } };
  }
}

export const createPublicD1Mock = (options: PublicD1MockOptions = {}): D1Database => {
  const db = {
    prepare: (sql: string) => {
      options.queryLog?.push(sql);
      return new MockStmt(sql, options);
    },
    exec: async () => ({ count: 0, duration: 0 }),
    batch: async () => [],
    dump: async () => new ArrayBuffer(0),
  };
  return db as unknown as D1Database;
};

// 共通 fixture builder。テスト側で必要部分だけ override する想定。
export const buildSchemaVersionRow = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  form_id: "form-test",
  revision_id: "rev-1",
  schema_hash: "hash-1",
  state: "active",
  synced_at: "2026-01-01T00:00:00.000Z",
  source_url: "https://example.test/forms/test",
  field_count: 1,
  unknown_field_count: 0,
  ...overrides,
});

export const buildSchemaQuestionRow = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  question_pk: "q-pk-1",
  revision_id: "rev-1",
  stable_key: "fullName",
  question_id: "q-1",
  item_id: null,
  section_key: "section-1",
  section_title: "セクション 1",
  label: "氏名",
  kind: "shortText",
  position: 1,
  required: 1,
  visibility: "public",
  searchable: 1,
  status: "active",
  choice_labels_json: "[]",
  ...overrides,
});

export const buildMemberStatusRow = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  member_id: "m-1",
  public_consent: "consented",
  rules_consent: "consented",
  publish_state: "public",
  is_deleted: 0,
  hidden_reason: null,
  last_notified_at: null,
  updated_by: null,
  updated_at: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

export const buildMemberResponseRow = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  response_id: "r-1",
  form_id: "form-test",
  revision_id: "rev-1",
  schema_hash: "hash-1",
  response_email: "user@example.test",
  submitted_at: "2026-01-01T00:00:00.000Z",
  edit_response_url: null,
  answers_json: "{}",
  raw_answers_json: "{}",
  extra_fields_json: "{}",
  unmapped_question_ids_json: "[]",
  search_text: "",
  ...overrides,
});

export const buildResponseFieldRow = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  response_id: "r-1",
  stable_key: "fullName",
  value_json: JSON.stringify("テスト 太郎"),
  raw_value_json: null,
  ...overrides,
});

export const buildPublicMemberRow = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  member_id: "m-1",
  current_response_id: "r-1",
  last_submitted_at: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

export const buildSyncJobRow = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  jobId: "job-1",
  jobType: "schema_sync",
  status: "succeeded",
  startedAt: "2026-01-01T00:00:00.000Z",
  finishedAt: "2026-01-01T00:01:00.000Z",
  metricsJson: "{}",
  errorJson: null,
  ...overrides,
});

export const buildMeetingRow = (
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  session_id: "s-1",
  title: "定例会 1",
  held_on: "2026-03-15",
  note: null,
  created_at: "2026-03-01T00:00:00.000Z",
  created_by: "admin",
  ...overrides,
});
