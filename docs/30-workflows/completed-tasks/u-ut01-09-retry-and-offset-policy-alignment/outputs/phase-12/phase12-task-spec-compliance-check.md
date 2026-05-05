# Phase 12 (6/6): Task Spec Compliance Check

> ステータス: spec_created / docs-only / NON_VISUAL
> 本タスクが task-specification-creator skill の Phase 12 要件、および本仕様書の不変条件・スコープを充足しているかの最終チェック。

---

## 1. workflow_state / docs-only / NON_VISUAL チェック

| 項目 | 期待値 | 実測 | 判定 |
| --- | --- | --- | --- |
| metadata.workflow_state | spec_created | spec_created | PASS |
| metadata.docsOnly | true | true | PASS |
| metadata.visualEvidence | NON_VISUAL | NON_VISUAL | PASS |
| metadata.taskType | docs-only | docs-only | PASS |
| github_issue_state | CLOSED（保管設計記録）| CLOSED | PASS |

## 2. Phase outputs 完備チェック

| Phase | 期待 outputs | 配置確認 |
| --- | --- | --- |
| 1 | main.md | OK |
| 2 | canonical-retry-offset-decision.md, migration-impact-evaluation.md | OK |
| 3 | main.md | OK |
| 4 | test-strategy.md | OK |
| 5 | ut09-handover-runbook.md | OK |
| 6 | failure-cases.md | OK |
| 7 | ac-matrix.md | OK |
| 8 | main.md | OK |
| 9 | quota-worst-case-calculation.md | OK |
| 10 | go-no-go.md | OK |
| 11 | main.md, manual-smoke-log.md, link-checklist.md | OK |
| 12 | main.md, implementation-guide.md, system-spec-update-summary.md, documentation-changelog.md, unassigned-task-detection.md, skill-feedback-report.md, phase12-task-spec-compliance-check.md | OK |
| 13 | （PR 作成、本タスクではユーザ実行）| N/A |

## 3. AC1-AC6 充足チェック（Phase 7 マトリクスの再確認）

| AC | 判定 |
| --- | --- |
| AC1 | PASS |
| AC2 | PASS |
| AC3 | PASS |
| AC4 | PASS |
| AC5 | PASS |
| AC6 | PASS |

## 4. 不変条件チェック

| 不変条件 | 判定 |
| --- | --- |
| #1 schema をコードに固定しすぎない | PASS（本タスクは設計判断のみ）|
| #5 D1 アクセスは apps/api 限定 | PASS（`processed_offset` 列の物理 migration は apps/api/migrations/ 内）|
| #6 GAS prototype を本番昇格しない | PASS（影響なし）|

## 5. スコープ違反チェック

| 違反候補 | 確認結果 |
| --- | --- |
| コード変更（apps/, packages/） | なし |
| migration 作成・apply | なし（机上評価のみ）|
| wrangler 直接実行 | なし |
| commit / push / PR | なし（PR は Phase 13 でユーザ実行）|
| `completed-tasks/` 配下の編集 | なし（申し送りのみ）|
| 平文 `.env` への秘密情報書込 | なし |

## 6. same-wave sync ルール

Wave 1 内に同期対象の wave-mate なし（本タスクは独立 wave 1 内 single）。

## 7. 二重 ledger 同期

`sync_log` 論理 ↔ `sync_job_logs` 物理の二重 ledger は、本タスクで `processed_offset` 採用を確定したことで mapping の漏れが解消される。物理発行は U-UT01-07 / UT-09 へ移譲。

## 8. spec_created / docs-only / NON_VISUAL 取り扱い

- Phase 11 が NON_VISUAL 縮約（main / smoke-log / link-checklist の 3 ファイル）で完了
- Phase 4 / Phase 9 の検証スイート / quota 算定はすべて机上
- 物理検証は UT-09 実装タスクへ移譲

## 9. validate-phase-output / verify-all-specs 実行確認

本タスク内で `complete-phase.js` 等の framework runner は実行しない（spec 内コマンドはあくまで参考）。validate / verify は CI gate で別途実行される想定。

## 10. 最終判定

| 観点 | 判定 |
| --- | --- |
| Phase 1-12 outputs 全配置 | PASS |
| AC1-AC6 全 PASS | PASS |
| 不変条件遵守 | PASS |
| スコープ違反なし | PASS |
| open question 受け皿明示 | PASS（Phase 12 unassigned-task-detection.md）|

→ **本タスク Phase 12 まで完了。Phase 13 PR 作成はユーザ実行。**

## 11. 完了条件チェック

- [x] workflow_state = spec_created
- [x] docs-only / NON_VISUAL 整合
- [x] Phase 1-12 outputs 完備
- [x] Phase 12 main.md 配置
- [x] AC1-AC6 全 PASS
- [x] 不変条件遵守
- [x] スコープ違反なし
- [x] 二重 ledger / same-wave / spec_created ルール遵守
