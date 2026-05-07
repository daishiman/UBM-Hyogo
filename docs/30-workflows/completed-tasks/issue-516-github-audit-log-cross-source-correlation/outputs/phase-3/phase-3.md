# Phase 3 出力: 詳細設計 / インタフェース契約

## 型定義（`apps/api/src/audit-correlation/types.ts`）

phase-03.md に従い以下を確定:

- `FingerprintHash` (branded string, 64 hex)
- `FingerprintVersion = 1`
- `CorrelationKey { fingerprintHash, fingerprintVersion }`
- `RawGitHubAuditEvent { action, actor, actor_ip?, user_agent?, created_at, org, repo?, external_identity_nameid? }`
- `RawCloudflareAuditEvent { action: { type }, actor: { email?, ip? }, when, resource?, user_agent? }`
- `NormalizedAuditEvent extends CorrelationKey { source, eventType, occurredAt, actorDomain?, ipPrefix?, userAgentBucket? }`
- `CorrelatedFinding { correlationKey, events[], severity, reason }`

## 関数シグネチャ

```ts
fetchGitHubAuditEvents(opts: GitHubFetchOpts): Promise<ReadonlyArray<RawGitHubAuditEvent>>
redactGitHub(ev, opts: RedactOpts): Promise<NormalizedAuditEvent>
redactCloudflare(ev, opts: RedactOpts): Promise<NormalizedAuditEvent>
computeFingerprint(input: FingerprintInput, salt: string): Promise<FingerprintHash>
correlate(github[], cloudflare[]): ReadonlyArray<CorrelatedFinding>
```

## redaction ルール表

| 入力 | 出力 | 保存可否 |
| --- | --- | --- |
| `actor_email` (full) | `actorDomain` のみ | local-part は hash 入力にのみ使用 |
| `actor_ip` | `ipPrefix` (/24 or /48) | full IP 禁止 |
| `user_agent` | `userAgentBucket` | full UA 禁止 |
| `external_identity_nameid` | `actorDomain` 抽出のみ | 平文禁止 |

## エラー処理境界
- 401/403 → `AuditFetchAuthError`（PAT 値は含めない）
- 429 → `Retry-After` + 指数 backoff（max 3 回 / base 1s）
- fingerprint 入力全 undefined → `FingerprintInputEmptyError`
- correlate 入力 0 件 → 空配列返却（throw しない）

## merge アルゴリズム
1. `Map<FingerprintHash, NormalizedAuditEvent[]>` に GitHub / Cloudflare 両 source を投入
2. 各 group 内 `occurredAt` 昇順ソート
3. severity 判定:
   - **HIGH**: 同 fingerprint で「権限変更系イベント (`org.update_member` / `account.member_role_change`)」+「IP prefix 変化」が 5 分（300_000ms）以内に共起
   - **MEDIUM**: 単独 source のみで権限変更系イベント
   - **LOW**: それ以外

## MVP 境界
- 実装: fixture 駆動 correlation engine、redact / fingerprint / severity、GitHub fetch contract test (msw)
- 対象外: production live 接続、実 PAT/salt 登録、Cloudflare Worker endpoint 追加、branch protection 実設定
