# staging-mint-bearer-env-contract-guard

`staging-mint-bearer-env-contract-guard` を `implemented_local_evidence_captured / implementation / NON_VISUAL / staging_runtime_pending_user_gate` として同期。

`mint-staging-bearers.mts` の必須 env 契約を role-scoped 化し、`--roles admin` では ME 系 env を要求しない。新規 `verify-mint-env-contract.mts` + `verify-mint-env-contract.yml` で workflow step env / `--roles` / provision secret 集合の drift を PR/push で検出する。`runtime-smoke-staging.yml` の bulk-tag mint step は `--roles admin` + degrade marker skip に整合し、`provision-staging-secrets.sh` は JWT-mint secret 集合へ更新。

Evidence: focused Vitest 27 PASS、`verify-mint-env-contract` PASS、`bash -n` PASS、shellcheck PASS、actionlint PASS、typecheck PASS、lint PASS。staging deploy / real secret mutation / required status check 登録 / commit / push / PR は user-gated。
