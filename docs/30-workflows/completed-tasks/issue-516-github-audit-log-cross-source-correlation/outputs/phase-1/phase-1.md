# Phase 1 出力: redact-safe join key SSOT 確定

## 決定事項 1: hash algo / version
- algo: `SHA-256`（Web Crypto API `crypto.subtle.digest('SHA-256', ...)`）
- 出力: 64 hex 文字
- `fingerprintVersion`: 初期値 `1`（algo / 入力組合せ変更時に増分）

## 決定事項 2: salt 管理
- 変数: `AUDIT_CORRELATION_SALT`
- 注入経路: 1Password `op://CloudflareSecurity/AuditCorrelationSalt/value` → Cloudflare Secrets / `scripts/with-env.sh`
- per-environment（staging / production で別値）
- リポジトリ・ログ・error message に salt 値を絶対に出力しない

## 決定事項 3: fingerprint 入力組合せ（Phase 1 改訂）

仕様書 phase-01.md の素案では `email|ip|ua` を hash 入力としていたが、HIGH severity ロジック「同 fingerprint 内で IP prefix が急変したら HIGH」と矛盾する（IP が hash に含まれると IP 変化で別 group になる）ため、**改訂版 SSOT** を以下のとおり確定した:

- email がある場合: `canonical = "email|${localPart}|${domain}"`（actor identity が join key）
- email が無い場合: `canonical = "network|${ipPrefix}|${uaBucket}"`（fallback）
- 全要素 undefined → `FingerprintInputEmptyError`
- payload: `${salt}|${canonical}` → `SHA-256` → 64 hex
- `normalizedActorEmail`: email の local-part のみ `lower(trim)`、domain は別保存項目 `actorDomain` に保持（hash 入力には domain も使うが、平文 PII としては domain のみ保存可）
- `truncatedIpPrefix`: IPv4 `/24` / IPv6 `/48`（NormalizedAuditEvent.ipPrefix として保持。HIGH 判定の IP 急変検知に使用）
- `userAgentBucket`: `chrome|safari|firefox|edge|curl|gha-runner|other` の 7 種ラベル

これにより同一 actor の IP 変化を 1 group 内で観測でき、HIGH severity 判定が論理一貫する。

## 決定事項 4: 保存可 / 不可リスト

| 項目 | 保存可否 | 備考 |
| --- | --- | --- |
| secret 値 (PAT / salt) | ✗ | 絶対禁止 |
| full IP (v4 / v6) | ✗ | prefix のみ可 |
| full User-Agent | ✗ | bucket のみ可 |
| actor_email local-part 平文 | ✗ | hash 入力にのみ使用 |
| `actorDomain` | ✓ | email の `@` 以降 |
| `ipPrefix` (/24 or /48) | ✓ | |
| `userAgentBucket` | ✓ | 6 種ラベル |
| `fingerprintHash` (64 hex) | ✓ | redact-safe join key |
| `fingerprintVersion` | ✓ | algo 互換管理 |
| event timestamp / type | ✓ | |

## 決定事項 5: GitHub Org Owner 権限前提
- 必須 scope: `audit_log` (PAT)
- 1Password: `op://CloudflareSecurity/GitHubAuditPAT/credential`
- 本タスク MVP では PAT は使わない（fixture 駆動 verify のみ）
- live wiring は follow-up（unassigned-task として起票）

## 決定事項 6: GO 判定
GO（Phase 2 着手可）。理由:
- redact-safe join key 仕様確定
- salt 管理経路（1Password / per-env）確定
- PII 非保存ポリシー確定
- 親タスクの「join key を失う手戻り」原因が解消（local-part のみ hash 入力に使用、domain は別保存）
