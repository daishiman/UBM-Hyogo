# Documentation Changelog

| Date | File | Change |
| --- | --- | --- |
| 2026-05-16 | `index.md` | root state、Phase 11/12 境界、allowlist contract 方針へ更新 |
| 2026-05-16 | `outputs/phase-01/requirements.md` | AC-03/04 を allowlist env-required 方式へ統一 |
| 2026-05-16 | `outputs/phase-02/design.md` | `--env/--required` CLI 案を撤回し、現行 allowlist 方式へ統一 |
| 2026-05-16 | `outputs/phase-02/design.md` | env-required の stdout unresolved output / exit code 仕様を実装に同期 |
| 2026-05-16 | `outputs/phase-05/implementation-spec.md` | 実装手順を allowlist env-required + runtime inline check 維持へ再構成 |
| 2026-05-16 | `artifacts.json`, `outputs/artifacts.json` | root / outputs mirror ledger を追加 |
| 2026-05-16 | `runbooks/incident-2026-05-16.md` | Phase 2 で宣言した incident runbook を実体化。secret 値は記録せず canonical provisioning runbook への参照に限定 |
| 2026-05-16 | `outputs/phase-11/main.md` | ローカル deterministic evidence の実行結果、exit code、実 gate の欠落 JSON 結果を追記 |
| 2026-05-16 | `outputs/phase-12/implementation-guide.md` | NON_VISUAL Phase 11 evidence 参照と runtime pending/user-gated 境界を追記 |
| 2026-05-16 | `outputs/phase-12/*` | strict 7 close-out files を追加 |
| 2026-05-16 | `.claude/skills/aiworkflow-requirements/{SKILL.md,indexes/resource-map.md,indexes/quick-reference.md,references/task-workflow-active.md,references/deployment-secrets-management.md,references/deployment-gha.md,lessons-learned/lessons-learned-ci-env-secret-inventory-and-preflight-gate-2026-05.md,changelog/20260516-runtime-smoke-staging-secrets-restore.md}` | aiworkflow same-wave sync を追加。`env=...;required=...` を Environment 必須 contract として正本化 |
