# 2026-05-16 runtime-smoke-staging-secrets-restore

`runtime-smoke-staging-secrets-restore` を `implemented_local_evidence_captured / implementation / NON_VISUAL / runtime_pending user-gated` として同期。

- `scripts/ci/verify-env-secrets.sh` が allowlist の `env=<ENV>;required=<CSV>;reason=<REASON>` contract を読み、GitHub Environment secret name-only inventory と照合する。
- `env=...;required=...` は mute ではなく Environment scope 必須 secret contract。Repository-scoped secret では満たさない。
- `scripts/ci/verify-env-secrets.allowlist` に `staging-runtime-smoke` 必須 4 secret を追加。
- `scripts/ci/__tests__/verify-env-secrets.spec.sh` に env-required 欠落 / 全件登録ケースを追加。
- `docs/30-workflows/runtime-smoke-staging-secrets-restore/runbooks/incident-2026-05-16.md` を追加し、secret 値を記録せず canonical provisioning runbook へ誘導する。
- Phase 11 に `verify-env-secrets.spec.sh` PASS、artifacts parity、strict 7 inventory、実 `pull_request` event gate の欠落 JSON を記録。
- `runtime-smoke-staging.yml` の inline value check は runtime job 最終防御として維持。
- GitHub Environment secret mutation、runtime workflow rerun、commit、push、PR は user-gated。
