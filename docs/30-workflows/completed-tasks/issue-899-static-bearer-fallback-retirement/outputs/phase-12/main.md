# Phase 12 Main — issue-899-static-bearer-fallback-retirement

## タスク要約

issue #899「静的 bearer fallback 撤去（mint 方式恒久化）」の **実装仕様書**。`.github/workflows/runtime-smoke-staging.yml` に残存する静的 `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` の job.env inject、mint step の `if` guard、`mask staging credentials` step の `static-fallback` 分岐、`RUNTIME_SMOKE_FRESHNESS_ENFORCE: '0'` warn-only env を全て物理撤去し、mint 経路へ一本化する。前提タスク #916（`STAGING_AUTH_SECRET` provisioning + mint path smoke green）完了後に実装 PR を作成する。

## 成果物

- 仕様書 13 phase（`outputs/phase-1..13/phase-N.md`）
- strict 7 outputs（本 dir）
- `artifacts.json`（workflow_state=`spec_created` / gates: Gate-A pending / Gate-B pending）

## 実装対象（本 wave は仕様書作成のみ・コード変更なし）

| 区分   | パス                                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------------------- |
| EDIT   | `.github/workflows/runtime-smoke-staging.yml`                                                                  |
| EDIT   | `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` |
| EDIT   | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md`               |
| DELETE | GitHub Environment secret `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER`（user-gated `gh secret delete`）        |

## 状態

- workflow_state: `spec_created`（implementation pending / NON_VISUAL）
- Gate-A: pending（実装 PR で workflow/runbook/SSOT compliance を確定）
- Gate-B: pending（実装 PR merge 後の minted-only smoke green + physical secret delete で確定）
- issue #899: クローズ維持
- 前提 #916: 未完了（完了確認後に実装 PR をマージ）
