import { buildRunbookUrl, pickRunbookAnchor } from './runbook-url';
import type { CorrelatedFinding, NormalizedAuditEvent } from './types';

export interface SlackNotifyOpts {
  readonly webhookUrl: string;
  readonly runbookBaseUrl: string;
  readonly environment: 'development' | 'staging' | 'production';
  readonly fetchImpl?: typeof fetch;
}

export interface SlackNotifyResult {
  readonly attempted: number;
  readonly succeeded: number;
}

interface SlackPayload {
  text: string;
  blocks: ReadonlyArray<unknown>;
}

function pickPrimary(events: ReadonlyArray<NormalizedAuditEvent>): NormalizedAuditEvent {
  return events[0]!;
}

export function buildSlackPayload(
  finding: CorrelatedFinding,
  opts: { runbookBaseUrl: string; environment: SlackNotifyOpts['environment'] },
): SlackPayload {
  const primary = pickPrimary(finding.events);
  const prefix = finding.correlationKey.fingerprintHash.slice(0, 8);
  const observedAtIso = new Date(primary.occurredAt).toISOString();
  const anchor = pickRunbookAnchor(finding);
  const runbookUrl = buildRunbookUrl(opts.runbookBaseUrl, anchor);
  const summary =
    `[${opts.environment}] HIGH audit-correlation finding ` +
    `fp=${prefix} type=${primary.eventType} domain=${primary.actorDomain ?? 'n/a'} ` +
    `ipPrefix=${primary.ipPrefix ?? 'n/a'} ua=${primary.userAgentBucket ?? 'n/a'} at=${observedAtIso}`;
  return {
    text: summary,
    blocks: [
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Severity*\n${finding.severity}` },
          { type: 'mrkdwn', text: `*Environment*\n${opts.environment}` },
          { type: 'mrkdwn', text: `*Event Type*\n${primary.eventType}` },
          { type: 'mrkdwn', text: `*Fingerprint*\n${prefix}` },
          { type: 'mrkdwn', text: `*Actor Domain*\n${primary.actorDomain ?? 'n/a'}` },
          { type: 'mrkdwn', text: `*IP Prefix*\n${primary.ipPrefix ?? 'n/a'}` },
          { type: 'mrkdwn', text: `*UA Bucket*\n${primary.userAgentBucket ?? 'n/a'}` },
          { type: 'mrkdwn', text: `*Observed At*\n${observedAtIso}` },
          { type: 'mrkdwn', text: `*Reason*\n${finding.reason}` },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Open Runbook' },
            url: runbookUrl,
          },
        ],
      },
    ],
  };
}

export async function notifyHighFindingsToSlack(
  findings: ReadonlyArray<CorrelatedFinding>,
  opts: SlackNotifyOpts,
): Promise<SlackNotifyResult> {
  const high = findings.filter((f) => f.severity === 'HIGH');
  if (high.length === 0) return { attempted: 0, succeeded: 0 };
  const fetchImpl = opts.fetchImpl ?? fetch;
  let succeeded = 0;
  for (const finding of high) {
    const payload = buildSlackPayload(finding, {
      runbookBaseUrl: opts.runbookBaseUrl,
      environment: opts.environment,
    });
    try {
      const res = await fetchImpl(opts.webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) succeeded += 1;
      else console.error('audit-correlation slack notify non-ok', { status: res.status });
    } catch (e) {
      console.error('audit-correlation slack notify failed', {
        name: (e as { name?: string } | null)?.name ?? 'unknown',
      });
    }
  }
  return { attempted: high.length, succeeded };
}
