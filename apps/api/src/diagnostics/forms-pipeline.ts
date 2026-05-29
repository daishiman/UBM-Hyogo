import { Hono } from "hono";
import {
  requireAdmin,
  type RequireAuthVariables,
} from "../middleware/require-admin";
import type { Env } from "../env";
import { normalizeIso } from "../routes/admin/_shared";
import { getMemberDiagnosis } from "./member-diagnosis";
import {
  FormsPipelineSnapshotSchema,
  type FormsPipelineSnapshot,
} from "./schema";

interface CountRow {
  formResponses: number;
  responseFields: number;
  members: number;
  memberIdentities: number;
}

interface SyncJobRow {
  job_id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  error_json: string | null;
  metrics_json: string | null;
}

interface VisibilityRow {
  totalMembers: number;
  publicConsentTrue: number;
  publishedTrue: number;
  visibleOnPublicDirectory: number;
}

interface IdentityHealthRow {
  totalIdentities: number;
  identitiesWithoutMember: number;
  membersWithoutIdentity: number;
}

const toNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const hasText = (value: string | undefined): boolean =>
  typeof value === "string" && value.trim().length > 0;

const normalizeSyncStatus = (
  status: string,
): "success" | "error" | "running" | "aborted" => {
  if (status === "succeeded") return "success";
  if (status === "failed") return "error";
  if (status === "aborted") return "aborted";
  return "running";
};

const readResponsesFetched = (metricsJson: string | null): number => {
  if (!metricsJson) return 0;
  try {
    const parsed = JSON.parse(metricsJson) as Record<string, unknown>;
    return toNumber(
      parsed["responsesFetched"] ??
        parsed["fetched"] ??
        parsed["inserted"] ??
        parsed["updated"] ??
        parsed["processed"],
    );
  } catch {
    return 0;
  }
};

const readErrorMessage = (errorJson: string | null): string | null => {
  if (!errorJson) return null;
  try {
    const parsed = JSON.parse(errorJson) as Record<string, unknown>;
    const message = parsed["message"] ?? parsed["error"] ?? parsed["code"];
    return typeof message === "string" ? message : "sync error";
  } catch {
    return "sync error";
  }
};

export const deriveFormsPipelineHypotheses = (input: {
  readonly counts: CountRow;
  readonly latestSyncRuns: ReadonlyArray<{ status: string }>;
  readonly aliasPendingCount: number;
  readonly publicVisibility: VisibilityRow & {
    readonly allHiddenByPublishState: boolean;
  };
  readonly identityHealth: IdentityHealthRow;
}): FormsPipelineSnapshot["hypothesisFlags"] => {
  const hasSuccessfulRun = input.latestSyncRuns.some(
    (run) => run.status === "success",
  );
  const allCompletedRunsFailed =
    input.latestSyncRuns.length > 0 &&
    input.latestSyncRuns.every(
      (run) => run.status === "error" || run.status === "aborted",
    );
  return {
    H1_ingestNeverRanOrAllErrors:
      input.counts.formResponses === 0 ||
      input.latestSyncRuns.length === 0 ||
      (!hasSuccessfulRun && allCompletedRunsFailed),
    H2_identityMismatchSuspected:
      input.identityHealth.identitiesWithoutMember > 0 ||
      input.identityHealth.membersWithoutIdentity > 0,
    H3_allHiddenByPublishState: input.publicVisibility.allHiddenByPublishState,
    H4_aliasPendingNonZero: input.aliasPendingCount > 0,
  };
};

export async function getFormsPipelineSnapshot(
  env: Pick<
    Env,
    | "DB"
    | "GOOGLE_SERVICE_ACCOUNT_EMAIL"
    | "GOOGLE_PRIVATE_KEY"
    | "FORMS_SA_EMAIL"
    | "FORMS_SA_KEY"
    | "GOOGLE_FORM_ID"
    | "FORM_ID"
    | "AUTH_SECRET"
  >,
): Promise<FormsPipelineSnapshot> {
  const counts = (await env.DB.prepare(
    `SELECT
      (SELECT COUNT(*) FROM member_responses) AS formResponses,
      (SELECT COUNT(*) FROM response_fields) AS responseFields,
      (SELECT COUNT(*) FROM members) AS members,
      (SELECT COUNT(*) FROM member_identities) AS memberIdentities`,
  ).first<CountRow>()) ?? {
    formResponses: 0,
    responseFields: 0,
    members: 0,
    memberIdentities: 0,
  };

  const syncRows = await env.DB.prepare(
    `SELECT job_id, started_at, finished_at, status, error_json, metrics_json
     FROM sync_jobs
     WHERE job_type IN ('response_sync', 'forms_response_sync')
     ORDER BY started_at DESC
     LIMIT 10`,
  ).all<SyncJobRow>();
  const latestSyncRuns = (syncRows.results ?? []).map((row) => ({
    id: row.job_id,
    startedAt: normalizeIso(row.started_at),
    finishedAt: row.finished_at ? normalizeIso(row.finished_at) : null,
    status: normalizeSyncStatus(row.status),
    responsesFetched: readResponsesFetched(row.metrics_json),
    errorMessage: readErrorMessage(row.error_json),
  }));

  const aliasRow = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM schema_diff_queue WHERE status = 'queued'",
  ).first<{ n: number }>();
  const aliasPendingCount = aliasRow?.n ?? 0;

  const visibility = (await env.DB.prepare(
    `SELECT
      COUNT(mi.member_id) AS totalMembers,
      SUM(CASE WHEN ms.public_consent = 'consented' THEN 1 ELSE 0 END) AS publicConsentTrue,
      SUM(CASE WHEN ms.publish_state IN ('public', 'published') THEN 1 ELSE 0 END) AS publishedTrue,
      SUM(CASE
        WHEN COALESCE(ms.is_deleted, 0) = 0
          AND ms.public_consent = 'consented'
          AND ms.publish_state IN ('public', 'published')
        THEN 1 ELSE 0 END) AS visibleOnPublicDirectory
     FROM member_status ms
     LEFT JOIN member_identities mi ON mi.member_id = ms.member_id`,
  ).first<VisibilityRow>()) ?? {
    totalMembers: 0,
    publicConsentTrue: 0,
    publishedTrue: 0,
    visibleOnPublicDirectory: 0,
  };
  const publicVisibility = {
    totalMembers: toNumber(visibility.totalMembers),
    publicConsentTrue: toNumber(visibility.publicConsentTrue),
    publishedTrue: toNumber(visibility.publishedTrue),
    visibleOnPublicDirectory: toNumber(visibility.visibleOnPublicDirectory),
    allHiddenByPublishState:
      toNumber(visibility.totalMembers) > 0 &&
      toNumber(visibility.visibleOnPublicDirectory) === 0,
  };

  const identityHealth = (await env.DB.prepare(
    `SELECT
      (SELECT COUNT(*) FROM member_identities) AS totalIdentities,
      (SELECT COUNT(*) FROM member_identities mi
        LEFT JOIN member_responses mr ON mr.response_id = mi.current_response_id
        WHERE mr.response_id IS NULL) AS identitiesWithoutMember,
      (SELECT COUNT(*) FROM member_status ms
        LEFT JOIN member_identities mi ON mi.member_id = ms.member_id
        WHERE mi.member_id IS NULL) AS membersWithoutIdentity`,
  ).first<IdentityHealthRow>()) ?? {
    totalIdentities: 0,
    identitiesWithoutMember: 0,
    membersWithoutIdentity: 0,
  };

  // breakdown counts (consent / publish_state)
  const consentRow = (await env.DB.prepare(
    `SELECT
      SUM(CASE WHEN public_consent = 'consented' THEN 1 ELSE 0 END) AS consented,
      SUM(CASE WHEN public_consent = 'declined' THEN 1 ELSE 0 END) AS declined,
      SUM(CASE WHEN public_consent IS NULL OR public_consent NOT IN ('consented','declined') THEN 1 ELSE 0 END) AS unknown
      FROM member_status`,
  ).first<{ consented: number; declined: number; unknown: number }>()) ?? {
    consented: 0,
    declined: 0,
    unknown: 0,
  };
  const publicConsentBreakdown = {
    consented: toNumber(consentRow.consented),
    declined: toNumber(consentRow.declined),
    unknown: toNumber(consentRow.unknown),
  };

  const publishRow = (await env.DB.prepare(
    `SELECT
      SUM(CASE WHEN publish_state = 'public' THEN 1 ELSE 0 END) AS p_public,
      SUM(CASE WHEN publish_state = 'member_only' THEN 1 ELSE 0 END) AS p_member_only,
      SUM(CASE WHEN publish_state = 'hidden' THEN 1 ELSE 0 END) AS p_hidden,
      SUM(CASE WHEN publish_state = 'published' THEN 1 ELSE 0 END) AS p_legacy_published,
      SUM(CASE WHEN publish_state = 'private' THEN 1 ELSE 0 END) AS p_legacy_private
      FROM member_status`,
  ).first<{
    p_public: number;
    p_member_only: number;
    p_hidden: number;
    p_legacy_published: number;
    p_legacy_private: number;
  }>()) ?? {
    p_public: 0,
    p_member_only: 0,
    p_hidden: 0,
    p_legacy_published: 0,
    p_legacy_private: 0,
  };
  const publishStateBreakdown = {
    public: toNumber(publishRow.p_public),
    member_only: toNumber(publishRow.p_member_only),
    hidden: toNumber(publishRow.p_hidden),
    legacy_published: toNumber(publishRow.p_legacy_published),
    legacy_private: toNumber(publishRow.p_legacy_private),
  };

  // visiblePublicCount aligns with /api/public/members boundary.
  const visibleRow = await env.DB.prepare(
    `SELECT COUNT(*) AS n
     FROM member_status s
     WHERE s.public_consent = 'consented'
       AND s.publish_state = 'public'
       AND s.is_deleted = 0
       AND NOT EXISTS (
         SELECT 1 FROM identity_aliases ia
         WHERE ia.source_member_id = s.member_id
       )`,
  ).first<{ n: number }>();
  const visiblePublicCount = toNumber(visibleRow?.n);

  // lastSuccessfulSyncAt (accept both `success` and `succeeded`)
  const lastSyncRow = await env.DB.prepare(
    `SELECT MAX(finished_at) AS t
     FROM sync_jobs
     WHERE job_type IN ('response_sync', 'forms_response_sync')
       AND status IN ('success', 'succeeded')`,
  ).first<{ t: string | null }>();
  const lastSuccessfulSyncAt = lastSyncRow?.t ? normalizeIso(lastSyncRow.t) : null;

  // totals
  const totalsRow = (await env.DB.prepare(
    `SELECT
      (SELECT COUNT(*) FROM member_identities) AS memberIdentities,
      (SELECT COUNT(*) FROM member_responses) AS memberResponses,
      (SELECT COUNT(*) FROM member_status) AS memberStatus`,
  ).first<{
    memberIdentities: number;
    memberResponses: number;
    memberStatus: number;
  }>()) ?? { memberIdentities: 0, memberResponses: 0, memberStatus: 0 };
  const totals = {
    memberIdentities: toNumber(totalsRow.memberIdentities),
    memberResponses: toNumber(totalsRow.memberResponses),
    memberStatus: toNumber(totalsRow.memberStatus),
  };

  const snapshot = {
    capturedAt: new Date().toISOString(),
    counts: {
      formResponses: toNumber(counts.formResponses),
      responseFields: toNumber(counts.responseFields),
      members: toNumber(counts.members),
      memberIdentities: toNumber(counts.memberIdentities),
    },
    latestSyncRuns,
    secretsReadiness: {
      googleServiceAccountEmail:
        hasText(env.GOOGLE_SERVICE_ACCOUNT_EMAIL) || hasText(env.FORMS_SA_EMAIL),
      googlePrivateKey:
        hasText(env.GOOGLE_PRIVATE_KEY) || hasText(env.FORMS_SA_KEY),
      googleFormId: hasText(env.GOOGLE_FORM_ID) || hasText(env.FORM_ID),
      authSecret: hasText(env.AUTH_SECRET),
    },
    aliasPendingCount,
    publicVisibility,
    identityHealth: {
      totalIdentities: toNumber(identityHealth.totalIdentities),
      identitiesWithoutMember: toNumber(identityHealth.identitiesWithoutMember),
      membersWithoutIdentity: toNumber(identityHealth.membersWithoutIdentity),
    },
    hypothesisFlags: deriveFormsPipelineHypotheses({
      counts,
      latestSyncRuns,
      aliasPendingCount,
      publicVisibility,
      identityHealth,
    }),
    publicConsentBreakdown,
    publishStateBreakdown,
    visiblePublicCount,
    lastSuccessfulSyncAt,
    totals,
    diagnosis: buildDiagnosisSummary({
      hypothesisFlags: deriveFormsPipelineHypotheses({
        counts,
        latestSyncRuns,
        aliasPendingCount,
        publicVisibility,
        identityHealth,
      }),
      visiblePublicCount,
      publishStateBreakdown,
      publicConsentBreakdown,
    }),
  };

  return FormsPipelineSnapshotSchema.parse(snapshot);
}

export function buildDiagnosisSummary(input: {
  readonly hypothesisFlags: FormsPipelineSnapshot["hypothesisFlags"];
  readonly visiblePublicCount: number;
  readonly publishStateBreakdown: FormsPipelineSnapshot["publishStateBreakdown"];
  readonly publicConsentBreakdown: FormsPipelineSnapshot["publicConsentBreakdown"];
}): string {
  const reasons: string[] = [];
  if (input.hypothesisFlags.H1_ingestNeverRanOrAllErrors) {
    reasons.push("H1: ingest が成功していない可能性");
  }
  if (input.hypothesisFlags.H2_identityMismatchSuspected) {
    reasons.push("H2: identity と member_status の整合が崩れている可能性");
  }
  if (input.hypothesisFlags.H3_allHiddenByPublishState) {
    reasons.push("H3: publish_state が全件非公開の可能性");
  }
  if (input.hypothesisFlags.H4_aliasPendingNonZero) {
    reasons.push("H4: schema_diff_queue 残件があり alias 未反映の可能性");
  }
  if (input.visiblePublicCount === 0 && reasons.length === 0) {
    if (input.publicConsentBreakdown.consented === 0) {
      reasons.push("公開同意ユーザーが存在しない");
    } else if (
      input.publishStateBreakdown.public === 0 &&
      input.publishStateBreakdown.legacy_published > 0
    ) {
      reasons.push("legacy publish_state='published' のみで canonical 'public' が 0 件");
    }
  }
  if (reasons.length === 0) {
    return `visible=${input.visiblePublicCount}: 既知の仮説に該当する異常は検出されませんでした。`;
  }
  return `visible=${input.visiblePublicCount}: ${reasons.join(" / ")}`;
}

export function createDiagnosticsRouter() {
  const app = new Hono<{
    Bindings: Env;
    Variables: RequireAuthVariables;
  }>();

  app.use("*", requireAdmin);

  app.get("/forms-pipeline", async (c) => {
    const snapshot = await getFormsPipelineSnapshot(c.env);
    return c.json(snapshot, 200);
  });

  app.get("/member/:memberId", async (c) => {
    const diagnosis = await getMemberDiagnosis(c.env, c.req.param("memberId"));
    if (!diagnosis) {
      return c.json({ ok: false, error: "not found" }, 404);
    }
    return c.json(diagnosis, 200);
  });

  return app;
}
