export type SecurityHeaderMode = "report-only" | "enforce";

export interface SecurityHeaderConfig {
  cspMode: SecurityHeaderMode;
  apiBaseUrl: string;
  authOrigin: string;
  nonce?: string;
}

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
  ].join("; ");

export const buildSecurityHeaders = (cfg: SecurityHeaderConfig): Headers => {
  const headers = new Headers();
  const cspHeaderName =
    cfg.cspMode === "enforce"
      ? "Content-Security-Policy"
      : "Content-Security-Policy-Report-Only";

  headers.set(cspHeaderName, buildCspDirective(cfg));
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
