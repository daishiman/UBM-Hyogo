# Documentation Changelog

## 2026-05-24 — awshh-followup-003-csp-reporting-endpoints 仕様書作成（implemented_local_evidence_captured）

### 追加

- `docs/30-workflows/completed-tasks/awshh-followup-003-csp-reporting-endpoints/` 一式（index.md / artifacts.json / phase-01..13.md / outputs/phase-01..13/main.md / outputs/phase-11/evidence/.gitkeep / outputs/phase-12/ 7 ファイル）
- issue #868（CLOSED）の実装仕様書。受信先 = Sentry CSP security endpoint に確定。

### consumed trace

- `docs/30-workflows/completed-tasks/unassigned-task/awshh-followup-003-reporting-endpoints.md` を本 workflow が吸収（CONSUMED）。

### 本サイクルで変更済み

- `apps/web/src/lib/security-headers.ts` / `apps/web/src/lib/env.ts` / `apps/web/middleware.ts`  / `apps/web/src/lib/security-headers.spec.ts`

### 不変条件

- apps/api / D1 unchanged（#5）。env は getEnv/getPublicEnv 経由（env アクセス不変条件）。Issue #868 CLOSED 維持。
