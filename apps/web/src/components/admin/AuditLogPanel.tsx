import Link from "next/link";
import type { AdminAuditListItem, AdminAuditListResponse } from "../../lib/admin/types";

export interface AuditSearchValues {
  readonly action?: string;
  readonly actorEmail?: string;
  readonly targetType?: string;
  readonly targetId?: string;
  readonly fromLocal?: string;
  readonly toLocal?: string;
  readonly limit?: string;
  readonly cursor?: string;
}

const JST_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const PII_KEY_PATTERN =
  /(^|_|\b)(email|mail|phone|tel|mobile|address|addr|name|fullname|firstname|lastname|displayname|kana|postal|zip)(_|$|\b)/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s().-]{8,}$/;

const isPiiKey = (key: string): boolean => {
  const normalized = key.toLowerCase().replace(/[-_\s]/g, "");
  return PII_KEY_PATTERN.test(key) || normalized.includes("name");
};

const maskString = (value: string): string => {
  if (EMAIL_PATTERN.test(value)) return "[masked-email]";
  if (PHONE_PATTERN.test(value)) return "[masked-phone]";
  return "[masked]";
};

export function maskAuditJson(value: unknown, key = ""): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    if (isPiiKey(key) || EMAIL_PATTERN.test(value) || PHONE_PATTERN.test(value)) {
      return maskString(value);
    }
    return value;
  }
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => maskAuditJson(v, key));
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([k, v]) => [
      k,
      isPiiKey(k) ? maskAuditJson(String(v), k) : maskAuditJson(v, k),
    ]),
  );
}

export function summarizeAuditJson(value: unknown): string {
  if (value === null || value === undefined) return "なし";
  if (Array.isArray(value)) return `${value.length} items`;
  if (typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>);
    if (keys.length === 0) return "empty object";
    return keys.slice(0, 4).join(", ") + (keys.length > 4 ? ` +${keys.length - 4}` : "");
  }
  return typeof value;
}

export function formatJst(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${JST_FORMATTER.format(date)} JST`;
}

export function maskAuditText(value: string | null | undefined, key: string): string {
  if (!value) return "system";
  const masked = maskAuditJson(value, key);
  return typeof masked === "string" ? masked : "[masked]";
}

export function buildAuditHref(values: AuditSearchValues, cursor?: string | null): string {
  const params = new URLSearchParams();
  const set = (key: string, value: string | undefined | null) => {
    const trimmed = value?.trim();
    if (trimmed) params.set(key, trimmed);
  };
  set("action", values.action);
  set("actorEmail", values.actorEmail);
  set("targetType", values.targetType);
  set("targetId", values.targetId);
  set("from", values.fromLocal);
  set("to", values.toLocal);
  set("limit", values.limit);
  set("cursor", cursor);
  const qs = params.toString();
  return `/admin/audit${qs ? `?${qs}` : ""}`;
}

function JsonDisclosure({ label, value }: { readonly label: string; readonly value: unknown }) {
  const safeValue = maskAuditJson(value);
  const json = JSON.stringify(safeValue, null, 2);
  return (
    <details>
      <summary>
        {label}: {summarizeAuditJson(safeValue)}
      </summary>
      <pre data-testid={`${label}-json`}>{json}</pre>
    </details>
  );
}

function AuditRow({ item }: { readonly item: AdminAuditListItem }) {
  const beforeValue = item.maskedBefore ?? item.beforeJson ?? null;
  const afterValue = item.maskedAfter ?? item.afterJson ?? null;
  return (
    <tr>
      <td>
        <time dateTime={item.createdAt}>{formatJst(item.createdAt)}</time>
        <br />
        <code>{item.auditId}</code>
      </td>
      <td>
        <strong>{item.action}</strong>
        <br />
        <span>{maskAuditText(item.actorEmail, "actorEmail")}</span>
      </td>
      <td>
        <span>{item.targetType ?? "-"}</span>
        <br />
        <code>{item.targetId ?? "-"}</code>
      </td>
      <td>
        <JsonDisclosure label="before" value={beforeValue} />
        <JsonDisclosure label="after" value={afterValue} />
        {item.parseError ? <p role="note">JSON parse warning: {item.parseError}</p> : null}
      </td>
    </tr>
  );
}

export function AuditLogPanel({
  data,
  values,
  error,
}: {
  readonly data: AdminAuditListResponse | null;
  readonly values: AuditSearchValues;
  readonly error?: string;
}) {
  const items = data?.items ?? [];
  return (
    <section aria-labelledby="admin-audit-h" data-component="admin-audit">
      <header>
        <h1 id="admin-audit-h">監査ログ</h1>
      </header>

      <form
        action="/admin/audit"
        aria-label="監査ログフィルター"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          alignItems: "end",
          marginBottom: 20,
        }}
      >
        <label>
          action
          <input name="action" defaultValue={values.action ?? ""} placeholder="attendance.add" />
        </label>
        <label>
          actorEmail
          <input name="actorEmail" defaultValue={values.actorEmail ?? ""} inputMode="email" />
        </label>
        <label>
          targetType
          <input name="targetType" defaultValue={values.targetType ?? ""} placeholder="meeting" />
        </label>
        <label>
          targetId
          <input name="targetId" defaultValue={values.targetId ?? ""} />
        </label>
        <label>
          from (JST)
          <input name="from" type="datetime-local" defaultValue={values.fromLocal ?? ""} />
        </label>
        <label>
          to (JST)
          <input name="to" type="datetime-local" defaultValue={values.toLocal ?? ""} />
        </label>
        <label>
          limit
          <select name="limit" defaultValue={values.limit ?? "50"}>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </label>
        <div>
          <button type="submit">検索</button>
          <Link href="/admin/audit" data-role="reset">
            リセット
          </Link>
        </div>
      </form>

      {error ? <p role="alert">監査ログを読み込めませんでした: {error}</p> : null}
      {!error && items.length === 0 ? (
        <div data-component="empty-state">該当する監査ログはありません。</div>
      ) : null}

      {items.length > 0 ? (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  <th scope="col">日時 / ID</th>
                  <th scope="col">action / actor</th>
                  <th scope="col">target</th>
                  <th scope="col">JSON</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <AuditRow key={item.auditId} item={item} />
                ))}
              </tbody>
            </table>
          </div>
          <nav aria-label="監査ログページ送り">
            {data?.nextCursor ? (
              <Link href={buildAuditHref(values, data.nextCursor)}>次のページ</Link>
            ) : (
              <span>次のページはありません</span>
            )}
          </nav>
        </>
      ) : null}
    </section>
  );
}
