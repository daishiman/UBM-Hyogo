// 03b: sync-forms-responses 用の最小限 D1 fake。
// SQL を細かく解釈せず、必要な行/メタを直接保持する。
// 各 prepare(sql).bind(...).run()/first()/all() を sql 文の含む文字列でディスパッチする。

export interface FakeRow {
  [key: string]: unknown;
}

export class FakeD1 {
  syncJobs: FakeRow[] = [];
  syncLocks: FakeRow[] = [];
  identities: FakeRow[] = [];
  status: FakeRow[] = [];
  responses: FakeRow[] = [];
  responseFields: FakeRow[] = [];
  schemaDiff: FakeRow[] = [];
  tagQueue: FakeRow[] = [];

  prepare(sql: string): FakeStmt {
    return new FakeStmt(this, sql);
  }
  async exec(_sql: string): Promise<{ count: number; duration: number }> {
    return { count: 0, duration: 0 };
  }
  async batch<T = unknown>(
    statements: ReadonlyArray<{ run(): Promise<T> }>,
  ): Promise<T[]> {
    const out: T[] = [];
    for (const s of statements) out.push(await s.run());
    return out;
  }
}

export class FakeStmt {
  private bindings: unknown[] = [];
  constructor(
    private readonly db: FakeD1,
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
  async run(): Promise<{
    success: boolean;
    meta: { changes: number; last_row_id: number };
  }> {
    const changes = runMutation(this.db, this.sql, this.bindings);
    return { success: true, meta: { changes, last_row_id: 0 } };
  }
}

function runFirst<T>(db: FakeD1, sql: string, b: unknown[]): T | null {
  const s = sql.replace(/\s+/g, " ").trim();
  if (/FROM sync_jobs/i.test(s) && /WHERE job_id = \?1/i.test(s)) {
    const r = db.syncJobs.find((r) => r["job_id"] === b[0]);
    if (!r) return null;
    if (/SELECT status FROM/i.test(s))
      return { status: r["status"] } as unknown as T;
    return mapJobRow(r) as unknown as T;
  }
  if (
    /FROM sync_jobs/i.test(s) &&
    (/response_sync/i.test(s) || /job_type = \?1/i.test(s)) &&
    /ORDER BY started_at DESC/i.test(s)
  ) {
    const jobType = /job_type = \?1/i.test(s) ? b[0] : "response_sync";
    const ordered = [...db.syncJobs]
      .filter((r) => {
        if (r["job_type"] !== jobType || r["status"] !== "succeeded") {
          return false;
        }
        if (!/skipped/i.test(s)) return true;
        try {
          return JSON.parse(String(r["metrics_json"] ?? "{}")).skipped !== true;
        } catch {
          return true;
        }
      })
      .sort((a, b2) => String(b2["started_at"]).localeCompare(String(a["started_at"])));
    const r = ordered[0];
    return r ? ({ metricsJson: r["metrics_json"] } as unknown as T) : null;
  }
  if (/FROM member_identities/i.test(s) && /response_email = \?1/i.test(s)) {
    const r = db.identities.find((r) => r["response_email"] === b[0]);
    return (r as unknown as T) ?? null;
  }
  if (/FROM member_identities/i.test(s) && /member_id = \?1/i.test(s)) {
    const r = db.identities.find((r) => r["member_id"] === b[0]);
    return (r as unknown as T) ?? null;
  }
  if (/FROM member_status/i.test(s) && /member_id = \?1/i.test(s)) {
    const r = db.status.find((r) => r["member_id"] === b[0]);
    return (r as unknown as T) ?? null;
  }
  if (/FROM member_responses/i.test(s) && /response_id = \?1/i.test(s)) {
    const r = db.responses.find((r) => r["response_id"] === b[0]);
    return (r as unknown as T) ?? null;
  }
  if (/FROM schema_diff_queue/i.test(s) && /diff_id = \?/i.test(s)) {
    const r = db.schemaDiff.find((r) => r["diff_id"] === b[0]);
    return (r as unknown as T) ?? null;
  }
  // 07a hook: enqueueTagCandidate が呼ぶ確認クエリ群
  if (/FROM member_tags/i.test(s) && /WHERE member_id = \?/i.test(s)) {
    return null;
  }
  if (/FROM tag_assignment_queue/i.test(s) && /idempotency_key = \?/i.test(s)) {
    const r = db.tagQueue.find((r) => r["idempotency_key"] === b[0]);
    return (r as unknown as T) ?? null;
  }
  if (/FROM tag_assignment_queue/i.test(s) && /WHERE member_id = \?/i.test(s)) {
    const r = db.tagQueue.find(
      (r) =>
        r["member_id"] === b[0] &&
        (r["status"] === "queued" || r["status"] === "reviewing"),
    );
    return (r as unknown as T) ?? null;
  }
  return null;
}

function runAll<T>(db: FakeD1, sql: string, b: unknown[]): T[] {
  const s = sql.replace(/\s+/g, " ").trim();
  if (/FROM sync_jobs/i.test(s)) {
    // 03b-followup-006: cap-alert detector SQL を再現する。
    // SELECT job_id, started_at, COALESCE(json_extract(metrics_json,'$.writeCapHit'),0) AS writeCapHit
    if (
      /\$\.writeCapHit/.test(s) &&
      /WHERE job_type = \?1/i.test(s)
    ) {
      const jobType = b[0];
      const limit = typeof b[1] === "number" ? b[1] : Number(b[1]);
      const filtered = db.syncJobs
        .filter((r) => {
          if (r["job_type"] !== jobType) return false;
          return true;
        })
        .sort((a, c) => {
          const sa = String(a["started_at"]);
          const sb = String(c["started_at"]);
          if (sa !== sb) return sb.localeCompare(sa);
          return String(c["job_id"]).localeCompare(String(a["job_id"]));
        });
      const rows = filtered.slice(0, Number.isFinite(limit) ? limit : filtered.length).map((r) => {
        let writeCapHit: number = 0;
        try {
          const m = JSON.parse(String(r["metrics_json"] ?? "{}"));
          writeCapHit = m.writeCapHit === true || m.writeCapHit === 1 ? 1 : 0;
        } catch {
          writeCapHit = 0;
        }
        return {
          job_id: r["job_id"],
          started_at: r["started_at"],
          writeCapHit,
        };
      });
      return rows as unknown as T[];
    }
    return db.syncJobs.map(mapJobRow) as unknown as T[];
  }
  if (/FROM member_responses/i.test(s)) return db.responses as unknown as T[];
  if (/FROM response_fields/i.test(s)) return db.responseFields as unknown as T[];
  return [];
}

function runMutation(db: FakeD1, sql: string, b: unknown[]): number {
  const s = sql.replace(/\s+/g, " ").trim();

  // sync_jobs INSERT (start)
  if (/INSERT INTO sync_jobs/i.test(s)) {
    db.syncJobs.push({
      job_id: b[0],
      job_type: b[1],
      started_at: b[2],
      status: "running",
      metrics_json: "{}",
      finished_at: null,
      error_json: null,
    });
    return 1;
  }
  // sync_jobs UPDATE succeeded/failed
  if (/UPDATE sync_jobs SET status = 'succeeded'/i.test(s)) {
    const finishedAt = b[0];
    const metrics = b[1];
    const jobId = b[2];
    const j = db.syncJobs.find((r) => r["job_id"] === jobId && r["status"] === "running");
    if (!j) return 0;
    j["status"] = "succeeded";
    j["finished_at"] = finishedAt;
    j["metrics_json"] = metrics;
    return 1;
  }
  if (/UPDATE sync_jobs SET status = 'failed'/i.test(s)) {
    const finishedAt = b[0];
    const errJson = b[1];
    const jobId = b[2];
    const j = db.syncJobs.find((r) => r["job_id"] === jobId && r["status"] === "running");
    if (!j) return 0;
    j["status"] = "failed";
    j["finished_at"] = finishedAt;
    j["error_json"] = errJson;
    return 1;
  }

  // sync_locks DELETE expired
  if (/DELETE FROM sync_locks/i.test(s) && /expires_at < \?2/i.test(s)) {
    const id = b[0];
    const cutoff = String(b[1]);
    db.syncLocks = db.syncLocks.filter(
      (l) => !(l["id"] === id && String(l["expires_at"]) < cutoff),
    );
    return 0;
  }
  if (/DELETE FROM sync_locks/i.test(s) && /holder = \?2/i.test(s)) {
    const id = b[0];
    const holder = b[1];
    const before = db.syncLocks.length;
    db.syncLocks = db.syncLocks.filter(
      (l) => !(l["id"] === id && l["holder"] === holder),
    );
    return before - db.syncLocks.length;
  }
  if (/INSERT INTO sync_locks/i.test(s)) {
    if (db.syncLocks.find((l) => l["id"] === b[0])) {
      throw new Error("UNIQUE constraint failed: sync_locks.id");
    }
    db.syncLocks.push({
      id: b[0],
      acquired_at: b[1],
      expires_at: b[2],
      holder: b[3],
      trigger_type: b[4],
    });
    return 1;
  }

  // member_identities INSERT/UPSERT (members.upsertMember)
  if (/INSERT INTO member_identities/i.test(s)) {
    const memberId = b[0];
    const idx = db.identities.findIndex((r) => r["member_id"] === memberId);
    if (idx >= 0) {
      db.identities[idx] = {
        ...db.identities[idx],
        response_email: b[1],
        current_response_id: b[2],
        last_submitted_at: b[4],
        updated_at: new Date().toISOString(),
      };
    } else {
      db.identities.push({
        member_id: b[0],
        response_email: b[1],
        current_response_id: b[2],
        first_response_id: b[3],
        last_submitted_at: b[4],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    return 1;
  }
  if (/UPDATE member_identities/i.test(s)) {
    const memberId = b[0];
    const r = db.identities.find((r) => r["member_id"] === memberId);
    if (!r) return 0;
    r["current_response_id"] = b[1];
    r["last_submitted_at"] = b[2];
    return 1;
  }

  // member_responses upsert
  if (/INSERT INTO member_responses/i.test(s)) {
    const idx = db.responses.findIndex((r) => r["response_id"] === b[0]);
    const row: FakeRow = {
      response_id: b[0],
      form_id: b[1],
      revision_id: b[2],
      schema_hash: b[3],
      response_email: b[4],
      submitted_at: b[5],
      edit_response_url: b[6],
      answers_json: b[7],
      raw_answers_json: b[8],
      extra_fields_json: b[9],
      unmapped_question_ids_json: b[10],
      search_text: b[11],
    };
    if (idx >= 0) db.responses[idx] = row;
    else db.responses.push(row);
    return 1;
  }

  // response_fields upsert
  if (/INSERT INTO response_fields/i.test(s)) {
    const idx = db.responseFields.findIndex(
      (r) => r["response_id"] === b[0] && r["stable_key"] === b[1],
    );
    const row: FakeRow = {
      response_id: b[0],
      stable_key: b[1],
      value_json: b[2],
      raw_value_json: b[3],
    };
    if (idx >= 0) db.responseFields[idx] = row;
    else db.responseFields.push(row);
    return 1;
  }

  // member_status upsert (consent)
  if (/INSERT INTO member_status/i.test(s)) {
    const memberId = b[0];
    const idx = db.status.findIndex((r) => r["member_id"] === memberId);
    if (/public_consent = excluded.public_consent/i.test(s)) {
      if (idx >= 0) {
        db.status[idx] = {
          ...db.status[idx],
          public_consent: b[1],
          rules_consent: b[2],
          updated_at: new Date().toISOString(),
        };
      } else {
        db.status.push({
          member_id: b[0],
          public_consent: b[1],
          rules_consent: b[2],
          publish_state: "member_only",
          is_deleted: 0,
          updated_at: new Date().toISOString(),
        });
      }
    }
    return 1;
  }

  // 07a hook: enqueueTagCandidate が createIdempotent から呼ぶ INSERT
  if (/INSERT INTO tag_assignment_queue/i.test(s)) {
    const idempotencyKey = b[5];
    if (
      idempotencyKey != null &&
      db.tagQueue.find((r) => r["idempotency_key"] === idempotencyKey)
    ) {
      throw new Error("UNIQUE constraint failed: idx_tag_queue_idempotency");
    }
    const nowIso = new Date().toISOString();
    db.tagQueue.push({
      queue_id: b[0],
      member_id: b[1],
      response_id: b[2],
      suggested_tags_json: b[3],
      reason: b[4],
      idempotency_key: idempotencyKey,
      status: "queued",
      created_at: nowIso,
      updated_at: nowIso,
      attempt_count: 0,
      last_error: null,
      next_visible_at: null,
      dlq_at: null,
    });
    return 1;
  }

  // schema_diff_queue insert
  if (/INSERT INTO schema_diff_queue/i.test(s)) {
    if (db.schemaDiff.find((r) => r["diff_id"] === b[0])) {
      throw new Error("UNIQUE constraint failed: schema_diff_queue");
    }
    // partial UNIQUE on question_id WHERE status='queued'
    if (
      b[3] !== null &&
      db.schemaDiff.find(
        (r) => r["question_id"] === b[3] && r["status"] === "queued",
      )
    ) {
      throw new Error("UNIQUE constraint failed: idx_schema_diff_queue_question_open");
    }
    db.schemaDiff.push({
      diff_id: b[0],
      revision_id: b[1],
      type: b[2],
      question_id: b[3],
      stable_key: b[4],
      label: b[5],
      suggested_stable_key: b[6],
      status: "queued",
      resolved_by: null,
      resolved_at: null,
      created_at: new Date().toISOString(),
    });
    return 1;
  }

  return 0;
}

function mapJobRow(r: FakeRow): FakeRow {
  return {
    jobId: r["job_id"],
    jobType: r["job_type"],
    status: r["status"],
    startedAt: r["started_at"],
    finishedAt: r["finished_at"],
    metricsJson: r["metrics_json"] ?? "{}",
    errorJson: r["error_json"] ?? null,
  };
}
