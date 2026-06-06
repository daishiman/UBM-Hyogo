# System Spec Update Summary

本タスクは `implemented_local_evidence_captured / implementation / NON_VISUAL` として、実コード・生成物・focused evidence を本 wave で反映した。commit / push / PR と実 D1 への seed apply は user-gated。

## Step 1-A: 完了タスク記録

| 項目 | 値 |
| --- | --- |
| Task ID | TASK-TEST-ACCOUNTS-SEED-001 |
| 完了内容 | 10 member + 3 admin test account seed SSOT、SQL/cleanup/manifest generator、committed generated artifacts、local/staging apply CLI、Playwright storage-state mint helper、focused tests |
| 実コード完了 | 完了（local evidence captured） |

## Step 1-B: 実装状況テーブル

| 対象 | 状態 |
| --- | --- |
| `apps/api/src/testing/test-accounts/catalog.ts` | implemented |
| `apps/api/src/testing/test-accounts/build-seed-sql.ts` | implemented |
| `apps/api/src/testing/test-accounts/index.ts` | implemented |
| `apps/api/migrations/seed/test-accounts-seed.sql` | generated + committed artifact |
| `apps/api/migrations/seed/test-accounts-cleanup.sql` | generated + committed artifact |
| `apps/api/migrations/seed/test-accounts.manifest.json` | generated + committed artifact |
| `scripts/gen-test-accounts-seed.mjs` | implemented; `--check` drift guard PASS |
| `scripts/seed-test-accounts.sh` | implemented; local/staging only, production rejected |
| `apps/web/playwright/scripts/mint-test-account-storage-state.ts` | implemented; manifest-driven JWT storage-state helper |
| `apps/api/src/testing/test-accounts/__tests__/*.spec.ts` | PASS（2 files / 6 tests） |
| `apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts` | PASS（1 file / 4 tests） |

workflow_state は全体として `implemented_local_evidence_captured`。Gate-A=passed（spec review）、Gate-B=passed（local implementation evidence）、Gate-C=pending（commit / push / PR / seed apply user-gated）。

## Step 1-C: 関連タスク

| 関連 | 関係 | 重複 |
| --- | --- | --- |
| `issue-399-admin-queue-staging-seed.sql` | seed/cleanup/syntax spec のパターン先例 | なし（issue-399 は admin queue staging seed・本タスクは member/admin テストアカウント網羅 seed） |
| `signSessionJwt` (`@ubm-hyogo/shared`) | storage-state mint の既存 JWT helper | なし（新規 auth surface は追加しない） |
| `setupD1()` | in-memory D1 focused evidence | なし（既存 test fixture 再利用） |

## Step 2: 新規インターフェース sync 判定

**判定: sync 済み**

新規 public API endpoint / D1 schema / migration / secret は追加しない。一方で、test fixture seed の workflow 契約として `TestMemberAccount` / `TestAdminAccount` / manifest JSON / `scripts/seed-test-accounts.sh` の運用境界が fix したため、aiworkflow-requirements へ以下を同期した。

- `references/task-workflow-active.md`
- `indexes/quick-reference.md`
- `indexes/resource-map.md`
- `references/workflow-test-accounts-seed-spec-artifact-inventory.md`

## Contract Impact

既存 D1 tables のみ利用し、production seed apply は CLI で構造的に拒否する。apps/web の Playwright mint helper は manifest JSON と `AUTH_SECRET` だけを使い、D1 へ直接アクセスしない。
