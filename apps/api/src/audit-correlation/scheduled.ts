import { runCorrelation, type AuditCorrelationRuntimeEnv } from './run-correlation';

export function scheduledAuditCorrelation(
  env: AuditCorrelationRuntimeEnv,
  ctx: { waitUntil(p: Promise<unknown>): void },
): void {
  ctx.waitUntil(
    runCorrelation({ env }).catch((e: unknown) => {
      const name = (e as { name?: string } | null)?.name ?? 'unknown';
      // 値・stack は出さない。次 cron cycle (15 分後) で自動再試行に任せる。
      console.error('audit-correlation scheduled failed', { name });
    }),
  );
}
