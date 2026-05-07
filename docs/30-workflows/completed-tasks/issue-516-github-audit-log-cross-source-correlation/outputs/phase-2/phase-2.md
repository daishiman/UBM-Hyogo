# Phase 2 出力: アーキテクチャ設計

## モジュール配置

```
apps/api/src/audit-correlation/
  types.ts         # 型定義 (Phase 3 契約)
  errors.ts        # AuditFetchAuthError / FingerprintInputEmptyError
  redact.ts        # redact + computeFingerprint (Web Crypto)
  github-fetch.ts  # /orgs/{org}/audit-log client
  correlate.ts    # timeline merge + severity 判定
  index.ts        # barrel export
  __tests__/
    redact.test.ts
    correlate.test.ts
    github-fetch.test.ts
    contract.test.ts

scripts/audit-correlation/
  run.sh           # CLI wrapper (bash → node tsx)
  runner.ts        # node entry: fixture を読み engine を起動
  grep-gate.sh     # 出力 JSON の PII 検査
  fixtures/
    github-workflow-run-success.json
    github-org-update-member.json
    cloudflare-login-fail.json
    cloudflare-token-rotate.json
    edge-empty.json
    edge-rate-limit.json
  __tests__/
    grep-gate.bats
    runner-determinism.bats

.github/workflows/audit-correlation-verify.yml

docs/runbooks/audit-correlation.md
```

## データフロー

```
[GitHub /orgs/{org}/audit-log]  --(fetch)-->  rawGitHubEvents[]
[Cloudflare audit logs (#408)]  --(read)-->   rawCloudflareEvents[]
           ↓                                          ↓
    redact() + fingerprint()                  redact() + fingerprint()
           ↓                                          ↓
    normalizedGitHub[]   ──────correlate()────── normalizedCloudflare[]
                                  ↓
                       CorrelatedFinding[] (timeline merge)
                                  ↓
                     runbook trigger / evidence emit (JSON stdout)
```

## 外部接続点
- GitHub REST: `GET /orgs/{org}/audit-log?per_page=100&phrase=...`
  - pagination: `Link: rel="next"` 解釈
  - rate limit: 429 で `Retry-After` 尊重 + 指数 backoff (max 3 回)
  - 認証: `Authorization: token <PAT>` (PAT は log/error に絶対出さない)
- Cloudflare 側: Issue #408 の正規化済み出力。本タスクは fixture 駆動のみ。

## ストレージ判断: stateless
- D1 への書き込みなし。stdout JSON のみ。
- 永続化が必要になった時点で別タスク（unassigned-task）として follow-up 設計。
- 理由: incident dry-run / fixture verify が目的、長期保管は対象外。

## ワークフロー名衝突確認
既存: `cf-audit-log-monitor.yml`, `cf-audit-log-monitor-watchdog.yml` 等。
新規: `audit-correlation-verify.yml` → 衝突なし（`ls .github/workflows/` 確認済）。

## モジュール独立性
- `apps/api/src/audit-correlation/` は Hono ルートから独立した pure module
- cron / on-demand / 将来の Worker endpoint いずれからも呼び出し可能
- 入力は引数のみ（環境変数読み込みは呼び出し側）→ test 容易性確保
