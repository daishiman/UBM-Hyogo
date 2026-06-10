# issue-1146 verify-no-localhost-bake を dev/main の required status check に登録

**[実装区分: 実装仕様書]**（CONST_004 default。後述の根本最適化により `.github/workflows/verify-no-localhost-bake.yml` への code 変更を含むため docs-only ではなく実装仕様書とする）

| 項目 | 内容 |
| --- | --- |
| ステータス | `implemented_local_runtime_pending`（Phase 1-13 タスク仕様書作成 + local yml 実装 + local verification 完了 / mutation・PR は user-gated） |
| GitHub Issue | [#1146](https://github.com/daishiman/UBM-Hyogo/issues/1146)（[FU-SASR-002]・**CLOSED 維持**・reopen しない・`Refs #1146` のみ） |
| 親 workflow | `docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/`（Phase 10 §MINOR M-2 発見元） |
| 消費元 proto-spec | `docs/30-workflows/unassigned-task/staging-api-url-and-session-recovery-followup-002-verify-no-localhost-bake-required-status-check.md`（consumed pointer 追記済・削除禁止） |
| 生成パターン | Closed Issue Canonical Workflow Root Recovery + Governance Mutation（branch protection PUT） |
| 分類 | CI ガバナンス / branch protection（`required_status_checks.contexts`） |
| 視覚証跡 | NON_VISUAL |

---

## 1 行サマリ

既存の `verify-no-localhost-bake` CI workflow を `dev` / `main` の required status check として merge ブロックに強制する。ただし現状のまま登録すると `pull_request.paths` フィルタにより非 web PR が永久 pending block になるため、**根本対策として `verify-no-localhost-bake.yml` の `pull_request.paths` フィルタを除去して常時実行化**し（grep LOGIC は不変）、その上で実測の既存 context を保持したまま `verify-no-localhost-bake` を branch 別 PUT で追加する。

## 調査結論（issue が古い / 別タスクで解決済みかの確認）

| 確認項目 | 結果 |
| --- | --- |
| gate 本体（`verify-no-localhost-bake.yml` / `.sh` / `.spec.ts`）の存在 | **存在し landed 済**（親 workflow・commits 8f7d4faca / 6aee9fcba） |
| `dev` required_status_checks.contexts | `["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate"]` → `verify-no-localhost-bake` **不在** |
| `main` required_status_checks.contexts | 同上 → **不在** |
| 別タスク / PR での解決 | `git log --all --grep=localhost-bake` は gate 実装 commit のみ。required check 登録は未実施 |
| **結論** | **issue #1146 は未解決。実行が必要。** ただし proto-spec の前提（登録済 context 集合）が stale なため現コードへ最適化して再設計した |

## 根本最適化 2 点（最新コード確認に基づく）

1. **proto-spec の context 集合が stale**: proto-spec は `audit-correlation-verify` / `verify-design-tokens` / `playwright-smoke` を登録済みと仮定していたが、実測の `dev` / `main` contexts は `ci` / `Validate Build` / `coverage-gate` / `lighthouse-ci` / `e2e-tests-coverage-gate`。本 spec は実測 context を正本とする。
2. **paths-filter footgun（根本問題）**: `verify-no-localhost-bake.yml` は `on.pull_request.paths` フィルタ付き。required status check は「常に走らない」と GitHub が `Expected — Waiting for status` で永久ブロックする。既存 required check 全 workflow（`ci` / `validate-build` / `e2e-tests` / `lighthouse`）は paths フィルタを持たず常時実行であることを確認済み。→ `verify-no-localhost-bake.yml` も `pull_request.paths` を除去して常時実行化する（grep LOGIC 不変）。

## Phase 一覧

| Phase | ファイル | 状態 |
| --- | --- | --- |
| 1 要件定義 | [phase-1-requirements.md](phase-1-requirements.md) | implemented_local_runtime_pending |
| 2 設計 | [phase-2-design.md](phase-2-design.md) | implemented_local_runtime_pending |
| 3 設計レビュー | [phase-3-design-review.md](phase-3-design-review.md) | implemented_local_runtime_pending |
| 4 テスト作成 | [phase-4-test-plan.md](phase-4-test-plan.md) | implemented_local_runtime_pending |
| 5 実装 | [phase-5-implementation.md](phase-5-implementation.md) | implemented_local_runtime_pending |
| 6 テスト拡充 | [phase-6-test-additions.md](phase-6-test-additions.md) | implemented_local_runtime_pending |
| 7 カバレッジ確認 | [phase-7-coverage.md](phase-7-coverage.md) | implemented_local_runtime_pending |
| 8 リファクタリング | [phase-8-refactor.md](phase-8-refactor.md) | implemented_local_runtime_pending |
| 9 品質保証 | [phase-9-qa.md](phase-9-qa.md) | implemented_local_runtime_pending |
| 10 最終レビュー | [phase-10-final-review.md](phase-10-final-review.md) | implemented_local_runtime_pending |
| 11 手動テスト | [phase-11-manual-test.md](phase-11-manual-test.md) | implemented_local_runtime_pending |
| 12 ドキュメント同期 | [phase-12-documentation.md](phase-12-documentation.md) | implemented_local_runtime_pending |
| 13 PR作成 | [phase-13-pr.md](phase-13-pr.md) | pending_user_approval |

## user-gated 境界

`.github/workflows/verify-no-localhost-bake.yml` の paths-filter 除去 edit は local 実装済み。`gh api -X PUT` branch protection mutation（dev / main）/ commit / push / PR（base dev, Refs #1146）は user 明示承認後にのみ実行する。read-only branch-protection GET evidence は pre-gate で取得可能。
