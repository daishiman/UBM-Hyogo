import type { CorrelatedFinding } from './types';

export type RunbookAnchor =
  | 'permission-change-with-ip-shift'
  | 'token-rotate-without-permission-change'
  | 'login-fail-burst'
  | 'unknown';

export function pickRunbookAnchor(finding: CorrelatedFinding): RunbookAnchor {
  const events = finding.events;
  const hasPermChange = events.some(
    (e) =>
      (e.source === 'github' &&
        (e.eventType === 'org.update_member' ||
          e.eventType === 'account.member_role_change' ||
          e.eventType === 'org.update_member_repository_permission' ||
          e.eventType === 'org.add_member' ||
          e.eventType === 'org.remove_member')) ||
      (e.source === 'cloudflare' && e.eventType === 'member_role_change'),
  );
  const hasTokenRotate = events.some(
    (e) => e.source === 'cloudflare' && e.eventType === 'token_rotate',
  );
  const hasLoginFail = events.some(
    (e) => e.source === 'cloudflare' && e.eventType === 'login_fail',
  );

  if (finding.severity === 'HIGH' && hasPermChange) return 'permission-change-with-ip-shift';
  if (hasTokenRotate && !hasPermChange) return 'token-rotate-without-permission-change';
  if (hasLoginFail) return 'login-fail-burst';
  return 'unknown';
}

export function buildRunbookUrl(baseUrl: string, anchor: RunbookAnchor): string {
  const trimmed = baseUrl.replace(/[#?].*$/, '').replace(/\/+$/, '');
  return `${trimmed}#${anchor}`;
}
