# System Spec Update Summary — issue-899-static-bearer-fallback-retirement

## Step 1-A: 直接更新する system spec / 正本ドキュメント

| パス                                                                                                | 更新内容                                                                          |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `.github/workflows/runtime-smoke-staging.yml`                                                       | job.env / mint step / mask step / freshness step の物理撤去・簡素化（Phase 2 § 1）|
| `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | 後方互換 fallback / 即時運用復旧 section 削除、物理削除手順 + minted-only 運用追記（Phase 2 § 2）|
| `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md`   | §6 恒久化導線「fallback 撤去（#899）」状態を「完了済み」へ更新（Phase 2 § 3）   |

## Step 1-B: canonical-mirror parity

本タスクは spec mirror（CLAUDE.md / `apps/*/CLAUDE.md`）への直接影響なし。SSOT は `bearer-lifecycle-ssot.md` のみ。

## Step 1-C: artifacts 同期

`artifacts.json` `metadata.implementation_files` に上 3 file を列挙済み。`outputs/artifacts.json` は root mirror として追加済み。`gates` は実装 PR 着手前のため `pending`。

## Step 1-D: aiworkflow 正本索引同期

本仕様書 root は `task-workflow-active.md` / `quick-reference.md` / `resource-map.md` / artifact inventory / changelog / LOGS に同 wave で登録済み。実装対象 3 file の実編集は #916 完了後の user-gated 実装 PR に限定する。

## Step 2: 新規 IF

| 項目                                              | 状態                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| 新規 public IF                                    | なし（workflow_call IF 不変）                                       |
| 削除 IF                                           | job.env レベルの `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` inject |
| 削除 env                                          | `RUNTIME_SMOKE_FRESHNESS_ENFORCE`                                   |
| 追加 fail-fast                                    | mint step 冒頭の `STAGING_AUTH_SECRET` 必須化 guard                 |
| `RUNTIME_SMOKE_AUTH_PATH` 値域                    | `minted`（理論上 `static-fallback` 不可達、defensive `unknown` のみ）|

## Step 3: ドキュメント整合性

- `CLAUDE.md` の「Cloudflare 系 CLI 実行ルール」「シークレット管理」section と矛盾なし
- `lefthook.yml` / `verify-pr-ready.sh` への影響なし
- 既存 `runtime-smoke-staging-mint-recurrence-fix` workflow root の `SKILL.md` / `LOGS.md` への波及は SSOT §6 状態更新のみ
