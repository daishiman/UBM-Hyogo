export type SecurityHeaderMode = "report-only" | "enforce";

export interface SecurityHeaderConfig {
  cspMode: SecurityHeaderMode;
  apiBaseUrl: string;
  authOrigin: string;
  nonce?: string;
  reportEndpoint?: string;
}

export const CSP_REPORT_GROUP = "csp-endpoint";
export const CSP_REPORT_MAX_AGE_SECONDS = 10886400;

const PERMISSIONS_POLICY_DIRECTIVES = [
  "accelerometer=()",
  "camera=()",
  "geolocation=()",
  "gyroscope=()",
  "magnetometer=()",
  "microphone=()",
  "payment=()",
  "usb=()",
] as const;

const trimmed = (value: string | undefined): string | undefined => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

export const buildSentryCspReportUrl = (
  dsn: string | undefined,
): string | undefined => {
  const normalized = trimmed(dsn);
  if (!normalized) return undefined;

  try {
    const url = new URL(normalized);
    const publicKey = url.username;
    const projectId = url.pathname.replace(/^\/+|\/+$/g, "");
    if (!publicKey || !projectId) return undefined;
    return `${url.protocol}//${url.host}/api/${projectId}/security/?sentry_key=${publicKey}`;
  } catch {
    return undefined;
  }
};

export const buildReportingEndpointsHeader = (
  cfg: SecurityHeaderConfig,
): string | null => {
  const endpoint = trimmed(cfg.reportEndpoint);
  return endpoint ? `${CSP_REPORT_GROUP}="${endpoint}"` : null;
};

export const buildReportToHeader = (cfg: SecurityHeaderConfig): string | null => {
  const endpoint = trimmed(cfg.reportEndpoint);
  if (!endpoint) return null;

  return JSON.stringify({
    group: CSP_REPORT_GROUP,
    max_age: CSP_REPORT_MAX_AGE_SECONDS,
    endpoints: [{ url: endpoint }],
    include_subdomains: true,
  });
};

export const buildCspDirective = (cfg: SecurityHeaderConfig): string =>
  [
    "default-src 'self'",
    cfg.nonce
      ? `script-src 'self' 'nonce-${cfg.nonce}' 'strict-dynamic'`
      : "script-src 'self'",
    cfg.nonce ? `style-src 'self' 'nonce-${cfg.nonce}'` : "style-src 'self'",
    cfg.nonce
      ? `style-src-elem 'self' 'nonce-${cfg.nonce}'`
      : "style-src-elem 'self'",
    ["style-src-attr ", "'unsafe", "-inline'"].join(""),
    "img-src 'self' data: https:",
    `connect-src 'self' ${cfg.apiBaseUrl} ${cfg.authOrigin}`,
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    `form-action 'self' ${cfg.authOrigin}`,
    ...(trimmed(cfg.reportEndpoint)
      ? [
          `report-to ${CSP_REPORT_GROUP}`,
          `report-uri ${trimmed(cfg.reportEndpoint)}`,
        ]
      : []),
  ].join("; ");

export const buildSecurityHeaders = (cfg: SecurityHeaderConfig): Headers => {
  const headers = new Headers();
  const cspHeaderName =
    cfg.cspMode === "enforce"
      ? "Content-Security-Policy"
      : "Content-Security-Policy-Report-Only";

  headers.set(cspHeaderName, buildCspDirective(cfg));
  const reportingEndpoints = buildReportingEndpointsHeader(cfg);
  if (reportingEndpoints) {
    headers.set("Reporting-Endpoints", reportingEndpoints);
  }
  const reportTo = buildReportToHeader(cfg);
  if (reportTo) {
    headers.set("Report-To", reportTo);
  }
  headers.set("Permissions-Policy", PERMISSIONS_POLICY_DIRECTIVES.join(", "));
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");

  return headers;
};

export const applySecurityHeaders = <T extends Response>(
  response: T,
  cfg: SecurityHeaderConfig,
): T => {
  const securityHeaders = buildSecurityHeaders(cfg);
  securityHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });
  return response;
};
