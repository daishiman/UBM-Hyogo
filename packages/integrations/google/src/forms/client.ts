import type { FormSchema, MemberResponse } from "@ubm-hyogo/shared";

import { createTokenSource, type AuthDeps, type ServiceAccountEnv } from "./auth";
import { RetryableError, withBackoff, type BackoffOptions } from "./backoff";
import {
  mapFormResponse,
  mapFormSchema,
  type RawForm,
  type RawFormResponse,
} from "./mapper";

export interface GoogleFormsClient {
  getForm(formId: string): Promise<FormSchema>;
  listResponses(
    formId: string,
    opts?: { pageToken?: string; since?: string },
  ): Promise<{ responses: MemberResponse[]; nextPageToken?: string }>;
}

export interface FormsClientDeps {
  fetchImpl?: typeof fetch;
  authDeps: AuthDeps;
  backoff?: Partial<BackoffOptions>;
  baseUrl?: string;
  schemaHash?: (raw: RawForm) => string;
  now?: () => Date;
  questionIdToStableKey?: (
    raw: RawForm,
  ) => Record<string, string> | Promise<Record<string, string>>;
}

export const FORMS_BASE_URL = "https://forms.googleapis.com/v1";

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

async function fetchJson(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
): Promise<unknown> {
  const res = await fetchImpl(url, init);
  if (RETRYABLE_STATUS.has(res.status)) {
    throw new RetryableError(
      `forms-api: retryable status ${res.status}`,
      res.status,
    );
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`forms-api: ${res.status} ${res.statusText} — ${body}`);
  }
  return res.json();
}

function defaultSchemaHash(raw: RawForm): string {
  const items = (raw.items ?? []).map((it) => `${it.itemId ?? ""}:${it.title ?? ""}`).join("|");
  let h = 0;
  for (let i = 0; i < items.length; i += 1) {
    h = (h * 31 + items.charCodeAt(i)) | 0;
  }
  return `sha-${(h >>> 0).toString(16)}`;
}

function defaultQuestionIdMap(raw: RawForm): Record<string, string> {
  const map: Record<string, string> = {};
  for (const item of raw.items ?? []) {
    const qid = item.questionItem?.question?.questionId;
    if (!qid || !item.title) continue;
    map[qid] = (raw.items ?? []).find((it) => it === item)?.title ?? qid;
  }
  return map;
}

export function createGoogleFormsClient(
  env: ServiceAccountEnv,
  deps: FormsClientDeps,
): GoogleFormsClient {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const baseUrl = deps.baseUrl ?? FORMS_BASE_URL;
  const tokenSource = createTokenSource(env, deps.authDeps);
  const schemaHashFn = deps.schemaHash ?? defaultSchemaHash;
  const now = deps.now ?? (() => new Date());
  const qidMapFn = deps.questionIdToStableKey ?? ((raw: RawForm) => {
    const map: Record<string, string> = {};
    for (const item of raw.items ?? []) {
      const qid = item.questionItem?.question?.questionId;
      if (qid && item.title) map[qid] = item.title;
    }
    return map;
  });

  async function authedFetch(url: string): Promise<unknown> {
    return withBackoff(async () => {
      const token = await tokenSource.getAccessToken();
      return fetchJson(fetchImpl, url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
    }, deps.backoff);
  }

  return {
    async getForm(formId) {
      const raw = (await authedFetch(`${baseUrl}/forms/${formId}`)) as RawForm;
      return mapFormSchema({
        raw,
        schemaHash: schemaHashFn(raw),
        syncedAt: now().toISOString(),
      });
    },
    async listResponses(formId, opts = {}) {
      const params = new URLSearchParams();
      if (opts.pageToken) params.set("pageToken", opts.pageToken);
      if (opts.since) params.set("filter", `timestamp >= ${opts.since}`);
      const qs = params.toString();
      const url = `${baseUrl}/forms/${formId}/responses${qs ? `?${qs}` : ""}`;
      const raw = (await authedFetch(url)) as {
        responses?: RawFormResponse[];
        nextPageToken?: string;
      };
      const formRaw = (await authedFetch(`${baseUrl}/forms/${formId}`)) as RawForm;
      const questionIdToStableKey = await qidMapFn(formRaw);
      const responses = (raw.responses ?? []).map((r) =>
        mapFormResponse({
          raw: r,
          formId,
          revisionId: formRaw.revisionId ?? "unknown",
          schemaHash: schemaHashFn(formRaw),
          questionIdToStableKey,
        }),
      );
      return raw.nextPageToken
        ? { responses, nextPageToken: raw.nextPageToken }
        : { responses };
    },
  };
}

export { defaultSchemaHash, defaultQuestionIdMap };
