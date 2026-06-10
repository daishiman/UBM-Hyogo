# 2026-06-08 issue-1146 verify-no-localhost-bake required status check

`issue-1146-verify-no-localhost-bake-required-status-check` を `implemented_local_runtime_pending / implementation / NON_VISUAL / branch_protection_pending_user_gate` として同期した。

## 変更点

- `.github/workflows/verify-no-localhost-bake.yml` の `on.pull_request.paths` を除去し、required status check 登録後に全 PR で status を返すよう常時実行化した。
- `scripts/verify-no-localhost-bake.sh` / `scripts/verify-no-localhost-bake.spec.ts` の grep LOGIC は不変。
- CLOSED Issue #1146 recovery workflow root、Phase 12 strict 7、source proto-spec consumed pointer を整合。
- aiworkflow artifact inventory / resource-map / quick-reference / task-workflow-active / SKILL-changelog を同一 wave 反映。

## 検証

- actionlint 1.7.7 PASS
- `mise exec -- pnpm vitest run scripts/verify-no-localhost-bake.spec.ts` PASS（1 file / 2 tests）
- `bash scripts/verify-no-localhost-bake.sh --src-only` PASS
- `bash scripts/verify-no-localhost-bake.sh --self-test` PASS

## User-Gated

dev/main branch protection `gh api -X PUT`、after evidence、commit、push、PR、Issue mutation は未実行。
