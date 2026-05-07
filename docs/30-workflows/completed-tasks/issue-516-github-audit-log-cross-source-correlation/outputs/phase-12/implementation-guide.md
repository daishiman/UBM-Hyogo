# Implementation Guide — Issue #516 Cross-Source Audit Log Correlation

## Part 1: 中学生レベル

学校で「同じ人が別々の場所で同じ時間に変な行動をしたか」を調べる場面を考える。名前や住所をそのまま貼り出すと危ないので、先生だけが同じ人だと分かる合い言葉に変えてから、職員室の記録と門の記録を見比べる。

Issue #516 でやることも同じ。メールアドレス、IP アドレス、使った道具の細かい名前はそのまま保存しない。代わりに `fingerprintHash` という照合用の印を作り、Cloudflare の記録と GitHub の記録を安全に並べて見る。

| 用語 | 日常語 |
| --- | --- |
| fingerprintHash | 本人を直接書かない照合用の印（SHA-256 ハッシュ） |
| salt | 印を他人に推測されにくくする追加の合い言葉（環境ごとに別） |
| audit log | 出入りや操作の記録 |
| correlation | 別々の記録を見比べてつなげること |
| severity HIGH | 同じ人が短時間に違う場所から権限変更をした「危ない兆候」 |
| fixture | 練習用に作ったサンプル記録 |

## Part 2: 技術者レベル

### 変更点サマリ

- **`apps/api/src/audit-correlation/`** (新規・6 files + 4 tests)
  - `types.ts`: `FingerprintHash` (branded) / `RawGitHubAuditEvent` / `RawCloudflareAuditEvent` / `NormalizedAuditEvent` / `CorrelatedFinding` / `Severity` / `FingerprintInput` / `GitHubFetchOpts`
  - `errors.ts`: `AuditFetchAuthError` / `FingerprintInputEmptyError` / `AuditFetchRateLimitError`
  - `redact.ts`: `normalizeEmail` / `truncateIp` (IPv4 /24, IPv6 /48) / `bucketUserAgent` (7 ラベル) / `computeFingerprint` (Web Crypto SHA-256) / `redactGitHub` / `redactCloudflare`
  - `github-fetch.ts`: `fetchGitHubAuditEvents` (`/orgs/{org}/audit-log`, pagination via `Link: rel="next"`, 401 → `AuditFetchAuthError`, 429 → `Retry-After` + 指数 backoff max 3 回, PAT は error/log に絶対出さない)
  - `correlate.ts`: `correlate(github[], cloudflare[])` — fingerprint で group, occurredAt 昇順 sort, severity 判定 (HIGH/MEDIUM/LOW)
  - `index.ts`: barrel export
  - `__tests__/redact.test.ts` / `correlate.test.ts` / `github-fetch.test.ts` / `contract.test.ts` — vitest 26 件

- **`scripts/audit-correlation/`** (新規・3 scripts + 6 fixtures + 2 bats)
  - `run.sh`: CLI wrapper (引数: `--github` / `--cloudflare` / `--salt` / `--out`)。local esbuild binary mismatch 時のみ `pnpm dlx tsx@4.21.0` fallback。
  - `runner.ts`: node tsx entry (apps/api 関数を呼び出し JSON 出力)
  - `grep-gate.sh`: 出力 JSON の PII / secret 検出（完全 IPv4 / 完全 IPv6 / 完全 email / `User-Agent: ...` / `ghp_*` / `github_pat_*` / salt literal）
  - `fixtures/`: github-org-update-member / github-workflow-run-success / cloudflare-login-fail / cloudflare-token-rotate / edge-empty / edge-rate-limit
  - `__tests__/grep-gate.bats` (9 tests) / `__tests__/runner-determinism.bats` (3 tests)

- **`.github/workflows/audit-correlation-verify.yml`** (新規) — typecheck → lint → vitest → bats → shellcheck → actionlint
- **`.github/CODEOWNERS`** — 3 行追加 (`apps/api/src/audit-correlation/**`, `scripts/audit-correlation/**`, `.github/workflows/audit-correlation-verify.yml`)
- **`docs/runbooks/audit-correlation.md`** (新規) — HIGH alert 6 ステップ runbook + salt rotation 手順 + Cloudflare Secrets 登録手順 (live wiring follow-up 用)
- **`.claude/skills/aiworkflow-requirements/references/audit-correlation.md`** (新規 SSOT) + indexes 4 ファイル更新

### 関数シグネチャ
```ts
export function redactGitHub(ev: RawGitHubAuditEvent, opts: RedactOpts): Promise<NormalizedAuditEvent>;
export function redactCloudflare(ev: RawCloudflareAuditEvent, opts: RedactOpts): Promise<NormalizedAuditEvent>;
export function computeFingerprint(input: FingerprintInput, salt: string): Promise<FingerprintHash>;
export function correlate(
  github: ReadonlyArray<NormalizedAuditEvent>,
  cloudflare: ReadonlyArray<NormalizedAuditEvent>,
): ReadonlyArray<CorrelatedFinding>;
export function fetchGitHubAuditEvents(opts: GitHubFetchOpts): Promise<ReadonlyArray<RawGitHubAuditEvent>>;
```

### redact-safe join key 設計

Phase 1 SSOT で確定 (phase-01 改訂):
- `canonical = "email|<localPart>|<domain>"` (email がある場合) または `"network|<ipPrefix>|<uaBucket>"` (fallback)
- `payload = "<salt>|<canonical>"` → `crypto.subtle.digest("SHA-256", payload)` → 64 hex
- `fingerprintVersion = 1`（algo / 入力組合せ変更時に増分）
- 仕様素案では `email|ip|ua` を hash 入力にしていたが、HIGH severity の「IP 急変検知」と矛盾するため email-based 方式へ改訂（同一 actor の IP 変化を 1 group 内で観測可能）

### HIGH severity 判定ロジック

```
group = events grouped by fingerprintHash (sorted by occurredAt asc)
if group has cross-source permission change events
   AND (last - first) ≤ 5 min
   AND ipPrefix set size ≥ 2
   → HIGH ("cross-source permission change with IP prefix change within 5 minutes")
elif group has any permission change event
   → MEDIUM
else
   → LOW
```

### 既知の限界 / Out of scope

- production GitHub `/orgs/{org}/audit-log` への live 接続（fixture-only MVP）
- Cloudflare Worker への live audit-correlation endpoint 追加
- D1 永続化（stateless 設計）
- branch protection への `audit-correlation-verify / verify` 必須登録
- 実 `AUDIT_CORRELATION_SALT` / `GITHUB_AUDIT_PAT` 登録（user gate 後の follow-up）

### follow-up TODO（unassigned-task として起票候補）

1. live wiring: Cloudflare Worker endpoint で GitHub fetch + 定期 correlation
2. branch protection: `audit-correlation-verify / verify` を required status check に登録
3. salt rotation 自動化（`fingerprintVersion=2` への移行）
4. D1 schema 設計（incident 永続化が必要になった時点で）

### スクリーンショット

NON_VISUAL タスクのため添付なし（visualEvidence=NON_VISUAL）。代替 evidence: `outputs/phase-11/` の typecheck.log / lint.log / test.log / build.log / bats.log / shellcheck.log / grep-gate.log / high-alert-sample.json。
