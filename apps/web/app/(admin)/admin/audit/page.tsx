// 07c-followup-003: /admin/audit read-only browsing UI.
import { fetchAdmin } from "../../../../src/lib/admin/server-fetch";
import { AuditLogPanel, type AuditSearchValues } from "../../../../src/components/admin/AuditLogPanel";
import type { AdminAuditListResponse } from "../../../../src/lib/admin/types";

export const dynamic = "force-dynamic";

const toSingle = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export function jstLocalToUtcIso(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return undefined;
  const [, y, mo, d, h, mi] = m;
  return new Date(
    Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h) - 9, Number(mi), 0, 0),
  ).toISOString();
}

function buildAuditApiPath(values: AuditSearchValues): string {
  const params = new URLSearchParams();
  const set = (key: string, value: string | undefined) => {
    const trimmed = value?.trim();
    if (trimmed) params.set(key, trimmed);
  };
  set("action", values.action);
  set("actorEmail", values.actorEmail?.toLowerCase());
  set("targetType", values.targetType);
  set("targetId", values.targetId);
  set("from", jstLocalToUtcIso(values.fromLocal));
  set("to", jstLocalToUtcIso(values.toLocal));
  set("limit", values.limit);
  set("cursor", values.cursor);
  const qs = params.toString();
  return `/admin/audit${qs ? `?${qs}` : ""}`;
}

const withValue = (
  target: Record<string, string>,
  key: string,
  value: string | undefined,
) => {
  if (value !== undefined) target[key] = value;
};

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const rawValues: Record<string, string> = { limit: toSingle(sp["limit"]) ?? "50" };
  withValue(rawValues, "action", toSingle(sp["action"]));
  withValue(rawValues, "actorEmail", toSingle(sp["actorEmail"]));
  withValue(rawValues, "targetType", toSingle(sp["targetType"]));
  withValue(rawValues, "targetId", toSingle(sp["targetId"]));
  withValue(rawValues, "fromLocal", toSingle(sp["from"]));
  withValue(rawValues, "toLocal", toSingle(sp["to"]));
  withValue(rawValues, "cursor", toSingle(sp["cursor"]));
  const values = rawValues as AuditSearchValues;

  let data: AdminAuditListResponse | null = null;
  let error: string | undefined;
  try {
    data = await fetchAdmin<AdminAuditListResponse>(buildAuditApiPath(values));
  } catch (e) {
    error = e instanceof Error ? e.message : "unknown error";
  }

  return error ? (
    <AuditLogPanel data={data} values={values} error={error} />
  ) : (
    <AuditLogPanel data={data} values={values} />
  );
}
