# Workflow Artifact Inventory: Issue #1146 verify-no-localhost-bake required status check

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1146-verify-no-localhost-bake-required-status-check/` |
| status | `implemented_local_runtime_pending / implementation / NON_VISUAL / branch_protection_pending_user_gate` |
| Issue | #1146 CLOSED 維持（`Refs #1146` のみ。reopen / comment / state mutation なし） |
| parent workflow | `docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/` |
| source proto-spec | `docs/30-workflows/unassigned-task/staging-api-url-and-session-recovery-followup-002-verify-no-localhost-bake-required-status-check.md`（consumed pointer 追記済み・削除禁止） |
| purpose | `verify-no-localhost-bake` CI workflow を dev/main required status check として登録可能にし、localhost / loopback API URL の再焼き込みを merge 時点で防ぐ |
| local implementation | `.github/workflows/verify-no-localhost-bake.yml` の `on.pull_request.paths` ブロックを除去し、required context が全 PR で status を返すよう常時実行化 |
| invariant | `scripts/verify-no-localhost-bake.sh` / `scripts/verify-no-localhost-bake.spec.ts` の grep LOGIC は不変。apps/api / apps/web runtime code / D1 / Google Form / public API surface は不変 |
| local evidence | actionlint 1.7.7 PASS、`mise exec -- pnpm vitest run scripts/verify-no-localhost-bake.spec.ts` 2 tests PASS、`bash scripts/verify-no-localhost-bake.sh --src-only` PASS、`bash scripts/verify-no-localhost-bake.sh --self-test` PASS |
| user gate | dev/main branch protection `gh api -X PUT`、after evidence、commit、push、PR、Issue mutation |

## Root-Cause Notes

- The source proto-spec assumed stale required contexts (`audit-correlation-verify` / `verify-design-tokens` / `playwright-smoke`), while current dev/main branch protection uses `ci` / `Validate Build` / `coverage-gate` / `lighthouse-ci` / `e2e-tests-coverage-gate`.
- A required status check must always produce a status. Keeping `on.pull_request.paths` would make non-matching PRs wait forever for `verify-no-localhost-bake`, so the workflow trigger change is part of the local implementation, not a docs-only change.
- Branch protection mutation remains user-gated because it is an irreversible governance operation.

## Lessons Learned

| # | Lesson | How to apply |
| --- | --- | --- |
| L-I1146-001 | paths-filter footgun: `on.pull_request.paths` を持つ workflow を required status check に登録すると、対象 path を触らない PR は GitHub が `Expected — Waiting for status` で永久ブロックする。required check 候補化は「常時 status を返す」ことが前提。 | required status check 化を検討する workflow は、登録 PUT 前に `on.pull_request.paths` の有無を確認する。フィルタがあれば除去して常時実行化し（grep / 検査 LOGIC 本体は不変）、既存 required check 全 workflow（ci / validate-build / e2e-tests / lighthouse）が no-paths である慣習に揃える。 |
| L-I1146-002 | proto-spec の前提（登録済み context 集合）が stale だった。unassigned proto-spec は `audit-correlation-verify` / `verify-design-tokens` / `playwright-smoke` を登録済みと仮定していたが、実測 dev/main は `ci` / `Validate Build` / `coverage-gate` / `lighthouse-ci` / `e2e-tests-coverage-gate`。proto-spec を鵜呑みにすると drift した PUT payload を作る。 | governance mutation 系 spec は着手時に `gh api repos/{owner}/{repo}/branches/{dev,main}/protection --jq '.required_status_checks.contexts'` で実測 context を再取得し、それを正本とする。proto-spec の context 集合は参考値扱い。 |
| L-I1146-003 | 実装区分の判定: 「grep LOGIC 不変」だけを見て docs-only と誤判定しかけたが、required check 化のために workflow trigger（paths 除去）の code 変更が必須 → `.github/workflows/*.yml` への diff が出るため 実装仕様書 が正。 | 「検査ロジック本体は不変」でも CI/CD 設定ファイル（yml）への code 変更が伴うなら docs-only ではなく 実装仕様書。implementationDivision は「触る成果物に code 変更が含まれるか」で判定する。 |
| L-I1146-004 | 並行 close-out: skill 同期検証セッション中に別の claude セッション（並行プロセス多数）が workflow root を `docs/30-workflows/` から `completed-tasks/` へ移動し、全ポインタ（artifacts.json canonical_root / consumed pointer canonical_workflow / artifact-inventory workflow root）を completed-tasks へ書換 + indexes 再生成まで完了させていた。 | 移動を検知しても即 revert しない。台帳指向（artifacts.json / consumed pointer / artifact-inventory / skill indexes の dangling 有無）が completed-tasks で一貫しているかを検証し、一貫していれば先行 close-out の完成形として尊重する。phase12 gate を新パスで再実行し `hasCompletedTasksAncestor:true` / `ok:true` を確認する。 |
