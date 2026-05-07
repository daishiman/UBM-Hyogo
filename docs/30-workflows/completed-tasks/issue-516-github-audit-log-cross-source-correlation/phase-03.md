# Phase 3: 詳細設計 / インタフェース契約 / 型定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| Source | `outputs/phase-3/phase-3.md` |
| 区分 | 設計（型シグネチャを後続実装の契約として確定） |
| 想定所要 | 0.5 人日 |

## 目的

`apps/api/src/audit-correlation/` の TypeScript 型定義と関数シグネチャを契約として確定し、Phase 4 のテスト / Phase 5 の実装が同じ契約に収束するようにする。

## 実行タスク

1. **型定義（`apps/api/src/audit-correlation/types.ts`）**

```ts
export type FingerprintHash = string & { readonly __brand: 'FingerprintHash' }; // 64 hex chars
export type FingerprintVersion = 1;

export interface CorrelationKey {
  readonly fingerprintHash: FingerprintHash;
  readonly fingerprintVersion: FingerprintVersion;
}

export interface RawGitHubAuditEvent {
  readonly action: string;          // e.g. "workflows.completed_workflow_run"
  readonly actor: string;           // login (NOT email)
  readonly actor_ip?: string;       // raw — must be redacted before persistence
  readonly user_agent?: string;     // raw — must be redacted before persistence
  readonly created_at: number;      // unix ms
  readonly org: string;
  readonly repo?: string;
  readonly external_identity_nameid?: string; // email-like, may contain PII
}

export interface RawCloudflareAuditEvent {
  readonly action: { type: string };
  readonly actor: { email?: string; ip?: string };
  readonly when: string;            // ISO8601
  readonly resource?: { type: string; id?: string };
  readonly user_agent?: string;
}

export interface NormalizedAuditEvent extends CorrelationKey {
  readonly source: 'github' | 'cloudflare';
  readonly eventType: string;
  readonly occurredAt: number;       // unix ms (UTC)
  readonly actorDomain?: string;
  readonly ipPrefix?: string;        // /24 or /48
  readonly userAgentBucket?: string; // labeled bucket only
}

export interface CorrelatedFinding {
  readonly correlationKey: CorrelationKey;
  readonly events: ReadonlyArray<NormalizedAuditEvent>; // timeline-sorted
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly reason: string;           // human-readable summary
}
```

2. **関数シグネチャ**

```ts
// github-fetch.ts
export interface GitHubFetchOpts {
  since: Date;
  until: Date;
  orgSlug: string;
  pat: string; // never logged
}
export function fetchGitHubAuditEvents(opts: GitHubFetchOpts): Promise<ReadonlyArray<RawGitHubAuditEvent>>;

// redact.ts
export interface RedactOpts { salt: string; }
export function redactGitHub(ev: RawGitHubAuditEvent, opts: RedactOpts): Promise<NormalizedAuditEvent>;
export function redactCloudflare(ev: RawCloudflareAuditEvent, opts: RedactOpts): Promise<NormalizedAuditEvent>;
export function computeFingerprint(input: { emailLocalPart?: string; ipPrefix?: string; uaBucket?: string }, salt: string): Promise<FingerprintHash>;

// correlate.ts
export function correlate(github: ReadonlyArray<NormalizedAuditEvent>, cloudflare: ReadonlyArray<NormalizedAuditEvent>): ReadonlyArray<CorrelatedFinding>;
```

3. **redaction ルール表**

| 入力フィールド | 出力 | 保存可否 |
| --- | --- | --- |
| `actor_email` (full) | `actorDomain` のみ | local-part は hash 入力にのみ使用 |
| `actor_ip` | `ipPrefix`（/24 or /48） | 完全 IP 保存禁止 |
| `user_agent` | `userAgentBucket`（"chrome/desktop" 等） | 完全文字列保存禁止 |
| `external_identity_nameid` | `actorDomain` 抽出のみ | 平文禁止 |

4. **エラー処理境界**
   - GitHub 401/403: 即時 throw `AuditFetchAuthError`（PAT scope 不足 / Org Owner 権限なし）。
   - GitHub 429: exponential backoff（最大 3 回）。
   - 不正 fingerprint 入力（全 undefined）: throw `FingerprintInputEmptyError`。
   - correlate 入力 0 件: 空配列を返す（throw しない）。

5. **今回 MVP 境界**
   - 実装対象: fixture 駆動 correlation engine、redaction / fingerprint / severity 判定、GitHub fetch client の interface + 401/429/pagination contract test。
   - 実装対象外: production GitHub audit log live 接続、Cloudflare Worker endpoint、実 PAT / salt 登録、branch protection 実設定。
   - live wiring follow-up へ渡すもの: `fetchGitHubAuditEvents` の contract と dry-run runbook。実環境 credential mutation は Phase 13 後の user gate まで禁止。

6. **merge アルゴリズム**
   - GitHub events と Cloudflare events を `correlationKey.fingerprintHash` で `Map` join。
   - 各 group 内で `occurredAt` 昇順ソート。
   - `severity` 判定: HIGH = GitHub 側 `org.update_member` / `account.member_role_change` の権限変更 + Cloudflare 側 `actor_ip` 急変が同 fingerprint で 5 分以内に共起。詳細は Phase 5 で実装。

## 統合テスト連携

Phase 4 で上記関数シグネチャに対する契約テスト（TC-RED-01〜TC-RED-08）を作成。

## 参照資料

- Phase 1 / Phase 2 outputs
- GitHub REST API audit-log response sample
- Cloudflare audit log normalized schema（Issue #408: `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/`）

## 成果物

- `outputs/phase-3/phase-3.md`（上記型 / シグネチャ / redaction ルール / エラー境界 / merge アルゴリズムを記述）

## 完了条件（DoD）

- [ ] 上記 4 型（`CorrelationKey` / `Raw*` / `NormalizedAuditEvent` / `CorrelatedFinding`）が確定。
- [ ] 5 関数シグネチャ（`fetchGitHubAuditEvents` / `redactGitHub` / `redactCloudflare` / `computeFingerprint` / `correlate`）が確定。
- [ ] redaction ルール表が完成。
- [ ] エラー処理境界（401 / 429 / 入力空）が明文化。
- [ ] fixture-only MVP と live wiring follow-up の境界が明文化。
