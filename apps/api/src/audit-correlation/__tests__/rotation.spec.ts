import { describe, expect, it } from 'vitest';
import { correlate } from '../correlate';
import { computeFingerprint, redactGitHub, redactCloudflare } from '../redact';
import type {
  FingerprintHash,
  NormalizedAuditEvent,
  RawCloudflareAuditEvent,
  RawGitHubAuditEvent,
} from '../types';

const SALT_OLD = 'salt-v1-old';
const SALT_NEW = 'salt-v2-new';

const ghEv: RawGitHubAuditEvent = {
  action: 'org.update_member',
  actor: 'attacker-login',
  actor_ip: '203.0.113.45',
  user_agent: 'Mozilla/5.0 Chrome/120.0',
  created_at: 1_700_000_000_000,
  org: 'daishiman',
  external_identity_nameid: 'Bob.Smith@example.com',
};
// occurredAt を ghEv.created_at + 60s に揃える (HIGH 連続性 5min 窓内)
const CF_WHEN_MS = 1_700_000_000_000 + 60_000;
const cfEv: RawCloudflareAuditEvent = {
  action: { type: 'login_fail' },
  actor: { email: 'Bob.Smith@example.com', ip: '198.51.100.7' },
  when: new Date(CF_WHEN_MS).toISOString(),
  user_agent: 'curl/8.5',
};

describe('rotation: dual-hash mode (rotation 期間中)', () => {
  it('AUDIT_CORRELATION_SALT_PREVIOUS 設定時は v1 + v2 両方の fingerprint を出力する', async () => {
    const out = await redactGitHub(ghEv, { salt: SALT_NEW, previousSalt: SALT_OLD });
    expect(out.fingerprintVersion).toBe(2);
    expect(out.fingerprintHashes?.v1).toBeDefined();
    expect(out.fingerprintHashes?.v2).toBeDefined();
    expect(out.fingerprintHashes!.v1).not.toBe(out.fingerprintHashes!.v2);
    expect(out.fingerprintHash).toBe(out.fingerprintHashes!.v2);
  });

  it('dual-hash 出力に salt literal が含まれない (grep gate)', async () => {
    const out = await redactGitHub(ghEv, { salt: SALT_NEW, previousSalt: SALT_OLD });
    const json = JSON.stringify(out);
    expect(json).not.toContain(SALT_OLD);
    expect(json).not.toContain(SALT_NEW);
  });
});

describe('rotation: single-hash mode (rotation 終了後)', () => {
  it('previousSalt 未設定時は v2 のみを出力する', async () => {
    const out = await redactCloudflare(cfEv, { salt: SALT_NEW });
    expect(out.fingerprintVersion).toBe(2);
    expect(out.fingerprintHashes?.v1).toBeUndefined();
    expect(out.fingerprintHashes?.v2).toBeDefined();
    expect(out.fingerprintHash).toBe(out.fingerprintHashes!.v2);
  });

  it('previousSalt が salt と同値なら v1 計算を行わない (no-op rotation)', async () => {
    const out = await redactGitHub(ghEv, { salt: SALT_NEW, previousSalt: SALT_NEW });
    expect(out.fingerprintHashes?.v1).toBeUndefined();
    expect(out.fingerprintHashes?.v2).toBeDefined();
  });
});

describe('rotation: rollback (新 salt に戻す)', () => {
  it('rollback 後の hash は元の v1 期 single-hash と同一', async () => {
    const beforeRotate = await redactGitHub(ghEv, { salt: SALT_OLD });
    const afterRollback = await redactGitHub(ghEv, { salt: SALT_OLD });
    expect(afterRollback.fingerprintHash).toBe(beforeRotate.fingerprintHash);
  });
});

describe('rotation: v1 + v2 mix の同一 actor merge', () => {
  it('v1 旧 record と v2 新 record が同一 actor に統合される (HIGH 連続性)', async () => {
    // 旧 salt 期に永続化された record (legacy v1: fingerprintHashes 未設定)
    const v1Hash = await computeFingerprint(
      { emailLocalPart: 'bob.smith', emailDomain: 'example.com' },
      SALT_OLD,
    );
    const legacyV1: NormalizedAuditEvent = {
      fingerprintHash: v1Hash,
      fingerprintVersion: 1,
      source: 'github',
      eventType: 'org.update_member',
      occurredAt: 1_700_000_000_000,
      actorDomain: 'example.com',
      ipPrefix: '203.0.113.0/24',
    };
    // rotation 期間中に取得された新 record (v2 dual-hash)
    const newDual = await redactCloudflare(cfEv, { salt: SALT_NEW, previousSalt: SALT_OLD });

    expect(newDual.fingerprintHashes!.v1).toBe(v1Hash);

    const result = correlate([legacyV1], [newDual]);
    expect(result.length).toBe(1);
    expect(result[0].events.length).toBe(2);
    expect(result[0].correlationKey.fingerprintVersion).toBe(2);
    expect(result[0].correlationKey.fingerprintHash).toBe(newDual.fingerprintHashes!.v2);
    // cross-source + IP 急変 → HIGH
    expect(result[0].severity).toBe('HIGH');
  });

  it('v2 のみの異なる actor は別グループ', async () => {
    const a = await redactGitHub(ghEv, { salt: SALT_NEW });
    const otherCf: RawCloudflareAuditEvent = {
      ...cfEv,
      actor: { email: 'other@example.com', ip: '10.0.0.1' },
    };
    const b = await redactCloudflare(otherCf, { salt: SALT_NEW });
    const result = correlate([a], [b]);
    expect(result.length).toBe(2);
  });
});

describe('rotation: dual-hash 計算コストは rotation 終了後ゼロ (永続的 dual-hash 防止)', () => {
  it('previousSalt 未設定時に v1 hash が undefined を維持する', async () => {
    const out = await redactGitHub(ghEv, { salt: SALT_NEW });
    expect(out.fingerprintHashes?.v1).toBeUndefined();
  });
});

describe('rotation: HIGH alert 連続性しきい値 (≥ 99%)', () => {
  it('rotation 直前/直後の同一 actor 100 件で 100% merge される', async () => {
    const events: NormalizedAuditEvent[] = [];
    for (let i = 0; i < 50; i++) {
      const v1 = await computeFingerprint(
        { emailLocalPart: `user${i}`, emailDomain: 'example.com' },
        SALT_OLD,
      );
      events.push({
        fingerprintHash: v1,
        fingerprintVersion: 1,
        source: 'github',
        eventType: 'org.update_member',
        occurredAt: 1_700_000_000_000 + i,
        actorDomain: 'example.com',
        ipPrefix: '203.0.113.0/24',
      } as NormalizedAuditEvent);
    }
    const cfEvents: NormalizedAuditEvent[] = [];
    for (let i = 0; i < 50; i++) {
      const v1 = await computeFingerprint(
        { emailLocalPart: `user${i}`, emailDomain: 'example.com' },
        SALT_OLD,
      );
      const v2 = await computeFingerprint(
        { emailLocalPart: `user${i}`, emailDomain: 'example.com' },
        SALT_NEW,
      );
      cfEvents.push({
        fingerprintHash: v2,
        fingerprintVersion: 2,
        fingerprintHashes: { v1, v2 } as { v1: FingerprintHash; v2: FingerprintHash },
        source: 'cloudflare',
        eventType: 'login_fail',
        occurredAt: 1_700_000_000_000 + i + 60_000,
        actorDomain: 'example.com',
        ipPrefix: '198.51.100.0/24',
      } as NormalizedAuditEvent);
    }
    const result = correlate(events, cfEvents);
    // 同一 actor 50 人それぞれが 1 つの finding に統合される
    expect(result.length).toBe(50);
    for (const f of result) {
      expect(f.events.length).toBe(2);
    }
  });
});
