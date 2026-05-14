# Phase 12 Task Spec Compliance Check — issue-617-ci-test-time-reduction-split

## Summary verdict

`completed (implemented_local_runtime_pending)`。実コード変更（`vitest.{,d1.}config.ts` / `apps/{api,web}/package.json` / `scripts/coverage-{guard.sh,merge.mjs}` / `scripts/__tests__/coverage-merge.test.mjs` / `.github/workflows/ci.yml`）はローカルに反映済みで、typecheck / lint / coverage-merge unit test / `vitest list` 経由の disjoint 検証はすべてローカル PASS。CI matrix wall-clock 計測と full shard coverage は PR push 後の CI runtime に依存するため `runtime_pending` として残存。`workflow_state = implemented_local_runtime_pending`、Phase 1-10/12 `completed`、Phase 11 `runtime_pending`、Phase 13 `blocked_pending_user_approval`。

## Changed-files classification

| 分類 | 件数 | 代表ファイル |
| --- | --- | --- |
| 仕様書（Phase 1-13 + index） | 14 | `docs/30-workflows/issue-617-ci-test-time-reduction-split/{index.md, phase-*.md}` |
| artifacts.json | 2 | `docs/30-workflows/issue-617-ci-test-time-reduction-split/{artifacts.json, outputs/artifacts.json}` |
| Phase 11 evidence | 4 | `outputs/phase-11/{main,before-after,link-checklist,manual-smoke-log}.md` |
| Phase 12 strict 7 files | 7 | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| apps/* / packages/* runtime code | 0 | 本タスクは CI / vitest config / scripts のみ変更（apps ランタイムは無変更） |
| vitest config | 2 | `vitest.config.ts`, `vitest.d1.config.ts` |
| pkg scripts | 2 | `apps/api/package.json`, `apps/web/package.json` |
| coverage tooling | 3 | `scripts/coverage-guard.sh`, `scripts/coverage-merge.mjs`, `scripts/__tests__/coverage-merge.test.mjs` |
| CI workflow | 1 | `.github/workflows/ci.yml` |
| skill / system spec | aiworkflow-requirements 同期分のみ | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` |

## `workflow_state` and phase status consistency

- `artifacts.json` の `metadata.workflow_state = implemented_local_runtime_pending`、`evidence_state = LOCAL_EVIDENCE_PARTIAL_CI_RUNTIME_PENDING`
- Phase 1-10 / Phase 12: `completed`
- Phase 11: `runtime_pending`（CI wall-clock evidence は PR push 後に取得）
- Phase 13: `blocked_pending_user_approval`
- `metadata.gates`: Gate-A `pending`（spec_review user 承認待ち）、Gate-B `pending`（CI wall-clock evidence pending）、Gate-C `pending`（CI green pending）、Gate-D `pending`（PR approval pending）
- root `artifacts.json` と `outputs/artifacts.json` の metadata / gates / phases は full mirror parity

## Phase 11 evidence file inventory

| ファイル | 状態 | 用途 |
| --- | --- | --- |
| `outputs/phase-11/main.md` | ✅ | Phase 11 evidence index |
| `outputs/phase-11/before-after.md` | ✅（CI 計測の TBD 行あり） | CI wall-clock 計測 before/after。runtime evidence は PR push 後に追記 |
| `outputs/phase-11/link-checklist.md` | ✅ | spec ↔ 実装 ↔ evidence のリンク健全性チェック |
| `outputs/phase-11/manual-smoke-log.md` | ✅ | ローカル smoke 実行ログ（typecheck / lint / coverage-merge test / vitest list disjoint） |

CI matrix wall-clock 計測のみ `runtime_pending`。PR CI runtime 完了後に `before-after.md` の TBD 行を更新し Gate-B を `passed` に昇格させる。

## Phase 12 strict 7 file inventory

| # | ファイル | 状態 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | ✅ |
| 2 | `outputs/phase-12/implementation-guide.md` | ✅ |
| 3 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | ✅（本ファイル） |
| 4 | `outputs/phase-12/system-spec-update-summary.md` | ✅ |
| 5 | `outputs/phase-12/skill-feedback-report.md` | ✅ |
| 6 | `outputs/phase-12/unassigned-task-detection.md` | ✅ |
| 7 | `outputs/phase-12/documentation-changelog.md` | ✅ |

## Skill/reference/system spec same-wave sync

- `aiworkflow-requirements`: `references/task-workflow-active.md` に Issue #617 エントリ追加済み（`implemented_local_runtime_pending`）。`indexes/{keywords.json, resource-map.md, topic-map.md}` は `pnpm indexes:rebuild` 経由で再生成済み
- `task-specification-creator`: 既存 `phase12-compliance-check-template.md` / `artifact-definition.json` テンプレートに準拠。skill 側の変更不要
- system spec（`docs/00-getting-started-manual/specs/*.md`）: CI / vitest split は外部仕様に出ない実装詳細のため変更なし
- consumed unassigned-task: `docs/30-workflows/unassigned-task/task-issue-577-followup-003-test-grouping-by-d1-usage.md`（historical #618 expanded consumed として `artifacts.json.metadata.source_unassigned_task` に明示）

## Runtime or user-gated boundary

本サイクルで実行済（ローカル PASS）:

- 全実装コード変更（`vitest.{,d1.}config.ts` / `apps/{api,web}/package.json` / `scripts/coverage-{guard.sh,merge.mjs}` / `.github/workflows/ci.yml`）
- 追加テスト `scripts/__tests__/coverage-merge.test.mjs` + fixtures の `node --test` PASS
- `pnpm install` / `typecheck` / `lint` ローカル PASS
- `vitest list` ベースで unit/d1 disjoint 検証（intersection=0、union=138）
- `coverage-guard.sh` CLI 検証（`--group` artifact-only / `--no-run` aggregate threshold）PASS

本サイクルで未実行（user-gated runtime / Phase 13 ユーザー承認後）:

- CI run による matrix wall-clock 計測（`outputs/phase-11/before-after.md` の TBD 行）
- D1 / web / packages full coverage 実行（PR CI shard 経由で取得）
- branch protection mutation（本設計では不要 — `coverage-gate` context 名維持）
- PR merge / dev → main 昇格

## Archive/delete stale-reference gate

- 本 wave で削除 / archive されるワークフロー root: なし
- 既存 root への live inventory 参照: 影響なし（新規追加のみ）
- `unassigned-task/task-issue-577-followup-003-test-grouping-by-d1-usage.md` は本タスクの source として consume 済み（`artifacts.json.metadata.source_unassigned_task`）。skill SSOT 上の参照は historical changelog として残置
- skill `aiworkflow-requirements` indexes / quick-reference / resource-map に stale reference は発生しない（再生成済み）

## Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | `completed (implemented_local_runtime_pending)` | shard は artifact 生成確認のみ、aggregate `coverage-gate --no-run` が 80% 判定を担う。state / scope / evidence wording は `runtime_pending` で統一済み |
| 漏れなし | `completed (local scope)` | Phase 11/12 strict outputs / full artifacts mirror / 実コード変更 / 追加テストを同サイクルで同期。CI wall-clock は user-gated runtime pending として明示 |
| 整合性あり | `completed (implemented_local_runtime_pending)` | root / outputs artifacts、`metadata.gates`、aiworkflow ledgers、Phase 11/12 が同じ状態語彙に統一。`coverage-gate` required context 名は `dev` / `main` 双方の branch protection と一致 |
| 依存関係整合 | `completed (implemented)` | Issue #617 (closed) は `Refs` のみで参照、unassigned task 起票元（#577 followup-003 expanded #618）は同一 wave で consume |

## 既知 issue

`apps/api/src/notification-mail-config.spec.ts` の Vite SSR transform fetch timeout は unit shard の並列実行で表面化したため、同サイクルで `test:coverage:unit` に `--maxWorkers=1 --minWorkers=1` を追加して CI shard failure を避ける。
