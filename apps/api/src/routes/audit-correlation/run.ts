import { Hono } from 'hono';
import { runCorrelation, type AuditCorrelationRuntimeEnv } from '../../audit-correlation/run-correlation';

function isTimingSafeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < b.length; i++) diff |= (a.charCodeAt(i) || 0) ^ b.charCodeAt(i);
  return diff === 0;
}

export const auditCorrelationRunRoute = new Hono<{ Bindings: AuditCorrelationRuntimeEnv }>();

auditCorrelationRunRoute.post('/run', async (c) => {
  const tokenEnv = c.env.AUDIT_CORRELATION_INTERNAL_TOKEN ?? '';
  if (!tokenEnv) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  const auth = c.req.header('authorization') ?? '';
  const expected = `Bearer ${tokenEnv}`;
  if (!isTimingSafeEqual(auth, expected)) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  try {
    const result = await runCorrelation({ env: c.env });
    return c.json(result, 200);
  } catch (e: unknown) {
    const name = (e as { name?: string } | null)?.name ?? 'unknown';
    console.error('audit-correlation run failed', { name });
    return c.json({ error: 'internal_error' }, 503);
  }
});
