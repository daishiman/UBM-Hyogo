import { fetchSheetRows } from "./sheets-client";
import { generateResponseId, mapRowToSheetRow } from "./mapper";
import type { Env, SyncResult, TriggerType } from "./types";

function uuid(): string {
  return crypto.randomUUID();
}

async function upsertRow(
  db: D1Database,
  responseId: string,
  row: ReturnType<typeof mapRowToSheetRow>,
): Promise<"upserted" | "skipped"> {
  const result = await db
    .prepare(
      `INSERT INTO member_responses (
        response_id, response_email, submitted_at,
        full_name, nickname, location, birth_date, occupation, hometown,
        ubm_zone, ubm_membership_type, ubm_join_date,
        business_overview, skills, challenges, can_provide,
        hobbies, recent_interest, motto, other_activities,
        url_website, url_facebook, url_instagram, url_threads,
        url_youtube, url_tiktok, url_x, url_blog, url_note, url_linkedin, url_others,
        self_introduction, public_consent, rules_consent,
        updated_at
      ) VALUES (
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        datetime('now')
      )
      ON CONFLICT(response_id) DO UPDATE SET
        response_email = excluded.response_email,
        full_name = excluded.full_name,
        nickname = excluded.nickname,
        location = excluded.location,
        birth_date = excluded.birth_date,
        occupation = excluded.occupation,
        hometown = excluded.hometown,
        ubm_zone = excluded.ubm_zone,
        ubm_membership_type = excluded.ubm_membership_type,
        ubm_join_date = excluded.ubm_join_date,
        business_overview = excluded.business_overview,
        skills = excluded.skills,
        challenges = excluded.challenges,
        can_provide = excluded.can_provide,
        hobbies = excluded.hobbies,
        recent_interest = excluded.recent_interest,
        motto = excluded.motto,
        other_activities = excluded.other_activities,
        url_website = excluded.url_website,
        url_facebook = excluded.url_facebook,
        url_instagram = excluded.url_instagram,
        url_threads = excluded.url_threads,
        url_youtube = excluded.url_youtube,
        url_tiktok = excluded.url_tiktok,
        url_x = excluded.url_x,
        url_blog = excluded.url_blog,
        url_note = excluded.url_note,
        url_linkedin = excluded.url_linkedin,
        url_others = excluded.url_others,
        self_introduction = excluded.self_introduction,
        public_consent = excluded.public_consent,
        rules_consent = excluded.rules_consent,
        updated_at = datetime('now')`,
    )
    .bind(
      responseId, row.responseEmail, row.submittedAt,
      row.fullName ?? null, row.nickname ?? null, row.location ?? null,
      row.birthDate ?? null, row.occupation ?? null, row.hometown ?? null,
      row.ubmZone ?? null, row.ubmMembershipType ?? null, row.ubmJoinDate ?? null,
      row.businessOverview ?? null, row.skills ?? null, row.challenges ?? null, row.canProvide ?? null,
      row.hobbies ?? null, row.recentInterest ?? null, row.motto ?? null, row.otherActivities ?? null,
      row.urlWebsite ?? null, row.urlFacebook ?? null, row.urlInstagram ?? null, row.urlThreads ?? null,
      row.urlYoutube ?? null, row.urlTiktok ?? null, row.urlX ?? null,
      row.urlBlog ?? null, row.urlNote ?? null, row.urlLinkedin ?? null, row.urlOthers ?? null,
      row.selfIntroduction ?? null, row.publicConsent ?? "unknown", row.rulesConsent ?? "unknown",
    )
    .run();

  return result.meta.changes > 0 ? "upserted" : "skipped";
}

async function writeAuditLog(
  db: D1Database,
  runId: string,
  trigger: TriggerType,
  startedAt: string,
  result: Partial<SyncResult>,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO sync_audit
        (run_id, trigger_type, started_at, finished_at, rows_fetched, rows_upserted, rows_skipped, status, error_reason)
       VALUES (?, ?, ?, datetime('now'), ?, ?, ?, ?, ?)
       ON CONFLICT(run_id) DO UPDATE SET
        finished_at = datetime('now'),
        rows_fetched = excluded.rows_fetched,
        rows_upserted = excluded.rows_upserted,
        rows_skipped = excluded.rows_skipped,
        status = excluded.status,
        error_reason = excluded.error_reason`,
    )
    .bind(
      runId, trigger, startedAt,
      result.rowsFetched ?? 0,
      result.rowsUpserted ?? 0,
      result.rowsSkipped ?? 0,
      result.status ?? "failure",
      result.errorReason ?? null,
    )
    .run();
}

export async function runSync(env: Env, trigger: TriggerType): Promise<SyncResult> {
  const runId = uuid();
  const startedAt = new Date().toISOString();
  let rowsFetched = 0;
  let rowsUpserted = 0;
  let rowsSkipped = 0;

  try {
    const rawRows = await fetchSheetRows(env.GOOGLE_SERVICE_ACCOUNT_JSON, env.SHEET_ID);
    rowsFetched = rawRows.length;

    for (const raw of rawRows) {
      const row = mapRowToSheetRow(raw);
      if (!row.responseEmail || !row.submittedAt) {
        rowsSkipped++;
        continue;
      }
      const responseId = await generateResponseId(row.responseEmail, row.submittedAt);
      const outcome = await upsertRow(env.DB, responseId, row);
      outcome === "upserted" ? rowsUpserted++ : rowsSkipped++;
    }

    const result: SyncResult = {
      runId, triggerType: trigger,
      rowsFetched, rowsUpserted, rowsSkipped,
      status: "success",
    };
    await writeAuditLog(env.DB, runId, trigger, startedAt, result);
    return result;
  } catch (err) {
    const errorReason = err instanceof Error ? err.message : String(err);
    const result: SyncResult = {
      runId, triggerType: trigger,
      rowsFetched, rowsUpserted, rowsSkipped,
      status: "failure", errorReason,
    };
    await writeAuditLog(env.DB, runId, trigger, startedAt, result);
    return result;
  }
}

// backfill: 全件 truncate-and-reload（冪等性確保、不変条件 7）
export async function runBackfill(env: Env): Promise<SyncResult> {
  await env.DB.prepare("DELETE FROM member_responses").run();
  return runSync(env, "backfill");
}
