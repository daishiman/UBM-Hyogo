import type { AuditLogEvent } from "./types.ts";

interface CfAuditLogResponse {
  result: AuditLogEvent[];
  result_info?: { cursor?: string | null };
}

export interface FetchAuditLogsOptions {
  accountId: string;
  token: string;
  since: Date;
  until: Date;
  perPage?: number;
  fetchFn?: typeof fetch;
}

export async function* fetchAuditLogs(
  opts: FetchAuditLogsOptions,
): AsyncIterable<AuditLogEvent> {
  const fetchImpl = opts.fetchFn ?? fetch;
  const base = `https://api.cloudflare.com/client/v4/accounts/${opts.accountId}/audit_logs`;
  let cursor: string | null = null;
  do {
    const url = new URL(base);
    url.searchParams.set("since", opts.since.toISOString());
    url.searchParams.set("until", opts.until.toISOString());
    url.searchParams.set("per_page", String(opts.perPage ?? 1000));
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${opts.token}` },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`CF audit_logs ${res.status} ${body}`);
    }
    const json = (await res.json()) as CfAuditLogResponse;
    for (const ev of json.result) yield ev;
    cursor = json.result_info?.cursor ?? null;
  } while (cursor);
}
