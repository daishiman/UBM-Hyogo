# Implementation guide

## Part 1: 中学生レベルの説明

このタスクは、staging という本番前の確認環境で本当に動くかを確かめるための手順書です。学校行事でたとえると、本番の発表会の前に体育館でリハーサルをして、音響、照明、入退場、先生の確認を一つずつ記録する作業です。まだ実行していないので、今は「確認待ち」です。ユーザーが G1、G2、G3、G4 を別々に承認したあとだけ、deploy、D1、Forms sync、PR 作成を進めます。

専門用語の意味:

| 用語 | 中学生向けの意味 |
| --- | --- |
| staging | 本番前に試す練習用の環境 |
| deploy | 新しい版を練習用の環境へ置くこと |
| D1 | Cloudflare 上のデータベース |
| Forms sync | Google Forms の設問や回答をアプリ側へ取り込むこと |
| evidence | 後で確認できる証拠ファイル |
| G1-G4 | 危ない操作をまとめて進めないための4つの確認ゲート |

## Part 2: Technical guide

Canonical root: `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/`

Runtime evidence root: `outputs/phase-11/evidence/`

Runtime contract:

```ts
type RuntimeGate = "G1" | "G2" | "G3" | "G4";

type RuntimeEvidenceStatus =
  | "PENDING_RUNTIME_EVIDENCE"
  | "runtime_evidence_captured"
  | "runtime_evidence_failed";

type StagingScreenshotName =
  | "public-members-staging.png"
  | "login-staging.png"
  | "me-staging.png"
  | "admin-staging.png";
```

Execution order:

1. Preflight: `bash scripts/cf.sh whoami`
2. G1: staging API/Web deploy
3. G2: D1 migrations list, schema parity, staging apply only if pending exists and approved
4. G3: Forms schema/responses sync, D1 sync_jobs/audit dump
5. Visual smoke and wrangler tail
6. Phase 12 status update
7. G4: commit / push / PR after explicit approval

Current status: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`. Runtime PASS is not claimed in this file.

Visual evidence references after Phase 11 runtime:

- `outputs/phase-11/evidence/screenshots/public-members-staging.png`
- `outputs/phase-11/evidence/screenshots/login-staging.png`
- `outputs/phase-11/evidence/screenshots/me-staging.png`
- `outputs/phase-11/evidence/screenshots/admin-staging.png`

CLI/API signature examples:

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "PRAGMA table_info(member_responses)"
```

Error handling and edge cases:

| Case | Handling |
| --- | --- |
| G1 deploy fails | Save stderr, keep previous version id, stop before G2 |
| D1 pending is non-zero | Ask for G2 approval before apply; record skip reason if not applied |
| Forms quota is exhausted | Save 429 evidence and stop before claiming runtime PASS |
| Screenshot contains PII | Redact or recapture; do not commit the raw image |
| `wrangler tail` cannot stay open | Save unavailable reason in `wrangler-tail/api-30min.log` |

Configuration constants:

| Name | Value |
| --- | --- |
| staging API Worker | `ubm-hyogo-api-staging` |
| staging Web Worker | `ubm-hyogo-web-staging` |
| staging D1 | `ubm-hyogo-db-staging` |
| staging D1 id | `990e5d6c-51eb-4826-9c13-c0ae007d5f46` |
| approval policy | `independent_per_gate_no_bundled_no_reverse_no_blanket_consent` |
