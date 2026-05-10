import { describe, expectTypeOf, it } from 'vitest';
import type {
  CorrelatedFinding,
  CorrelationKey,
  FingerprintHash,
  NormalizedAuditEvent,
  RawCloudflareAuditEvent,
  RawGitHubAuditEvent,
} from '../types';

describe('audit-correlation type contract', () => {
  it('FingerprintHash is a branded string', () => {
    expectTypeOf<FingerprintHash>().toMatchTypeOf<string>();
  });
  it('CorrelationKey shape', () => {
    expectTypeOf<CorrelationKey>().toHaveProperty('fingerprintHash');
    expectTypeOf<CorrelationKey>().toHaveProperty('fingerprintVersion');
  });
  it('NormalizedAuditEvent extends CorrelationKey + source/eventType/occurredAt', () => {
    expectTypeOf<NormalizedAuditEvent>().toMatchTypeOf<CorrelationKey>();
    expectTypeOf<NormalizedAuditEvent>().toHaveProperty('source');
    expectTypeOf<NormalizedAuditEvent>().toHaveProperty('eventType');
    expectTypeOf<NormalizedAuditEvent>().toHaveProperty('occurredAt');
  });
  it('CorrelatedFinding has events array and severity', () => {
    expectTypeOf<CorrelatedFinding>().toHaveProperty('events');
    expectTypeOf<CorrelatedFinding>().toHaveProperty('severity');
  });
  it('Raw events expose raw PII fields (must be redacted before persistence)', () => {
    expectTypeOf<RawGitHubAuditEvent>().toHaveProperty('actor_ip');
    expectTypeOf<RawCloudflareAuditEvent>().toHaveProperty('actor');
  });
});
