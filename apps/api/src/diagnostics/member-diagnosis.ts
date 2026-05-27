import type { Env } from "../env";
import { normalizeIso } from "../routes/admin/_shared";
import { MemberDiagnosisSchema, type MemberDiagnosis } from "./schema";

const EXPECTED_FIELD_COUNT = 31;

interface MemberRow {
  member_id: string;
  response_email: string | null;
  current_response_id: string | null;
  public_consent: string | null;
  rules_consent: string | null;
  publish_state: string | null;
  is_deleted: number | null;
}

const toBooleanConsent = (value: string | null): boolean | null => {
  if (value === "consented") return true;
  if (value === "declined") return false;
  return null;
};

export async function getMemberDiagnosis(
  env: Pick<Env, "DB">,
  memberId: string,
): Promise<MemberDiagnosis | null> {
  const row = await env.DB.prepare(
    `WITH target(member_id) AS (
       SELECT member_id FROM member_identities WHERE member_id = ?1
       UNION
       SELECT member_id FROM member_status WHERE member_id = ?1
     )
     SELECT target.member_id, mi.response_email, mi.current_response_id,
            ms.public_consent, ms.rules_consent, ms.publish_state, ms.is_deleted
     FROM target
     LEFT JOIN member_identities mi ON mi.member_id = target.member_id
     LEFT JOIN member_status ms ON ms.member_id = target.member_id`,
  )
    .bind(memberId)
    .first<MemberRow>();
  if (!row) return null;

  const fieldRow = row.current_response_id
    ? await env.DB.prepare(
        "SELECT COUNT(*) AS n FROM response_fields WHERE response_id = ?1",
      )
        .bind(row.current_response_id)
        .first<{ n: number }>()
    : null;
  const responseFieldCount = fieldRow?.n ?? 0;

  const missingRows = row.current_response_id
    ? await env.DB.prepare(
        `SELECT sq.stable_key
         FROM schema_questions sq
         WHERE sq.stable_key IS NOT NULL
           AND sq.stable_key <> 'unknown'
           AND sq.revision_id = (
             SELECT mr.revision_id
             FROM member_responses mr
             WHERE mr.response_id = ?1
           )
           AND NOT EXISTS (
             SELECT 1
             FROM response_fields rf
             WHERE rf.response_id = ?1
               AND rf.stable_key = sq.stable_key
           )
         ORDER BY sq.position ASC
         LIMIT 31`,
      )
        .bind(row.current_response_id)
        .all<{ stable_key: string }>()
    : { results: [] };

  const published =
    row.publish_state === "public" || row.publish_state === "published";
  const visibleOnPublicDirectory =
    row.is_deleted !== 1 && row.public_consent === "consented" && published;
  const identityMissing = !row.response_email || !row.current_response_id;

  const diagnosis = {
    capturedAt: normalizeIso(new Date().toISOString()),
    memberId: row.member_id,
    identityMatches: {
      byEmail: Boolean(row.response_email),
      byExternalId: Boolean(row.current_response_id),
      matchedFormResponseId: row.current_response_id,
    },
    responseFieldCount,
    expectedFieldCount: EXPECTED_FIELD_COUNT,
    missingFieldKeys: (missingRows.results ?? []).map((r) => r.stable_key),
    consent: {
      publicConsent: toBooleanConsent(row.public_consent),
      rulesConsent: toBooleanConsent(row.rules_consent),
    },
    publishState: {
      published,
      visibleOnPublicDirectory,
    },
    hypothesisFlags: {
      H2_identityMissing: identityMissing,
      H3_hiddenByConsentOrPublish: !visibleOnPublicDirectory,
      H4_missingFieldsNonEmpty:
        !identityMissing &&
        (responseFieldCount < EXPECTED_FIELD_COUNT ||
          (missingRows.results ?? []).length > 0),
    },
  };

  return MemberDiagnosisSchema.parse(diagnosis);
}
