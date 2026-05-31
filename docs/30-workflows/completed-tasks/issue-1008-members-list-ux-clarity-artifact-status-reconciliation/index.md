# issue-1008-members-list-ux-clarity-artifact-status-reconciliation

> Source issue: https://github.com/daishiman/UBM-Hyogo/issues/1008 (**CLOSED** のまま — close 状態を変更せずにローカル補正のみ実施)
> Branch (proposed): `refactor/issue-1008-members-list-ux-clarity-artifact-status-reconciliation`
> 実装区分: **ドキュメントのみ** (CONST_004 例外条件該当)
> 状態: `implemented_local_evidence_captured`
> 作成日: 2026-05-30
> taskType: `docs-only`
> visualEvidence: `NON_VISUAL`
> implementation_mode: `verify_existing`

## 実装区分の判定根拠（CONST_004）

> **判定**: `[実装区分: ドキュメントのみ]`

本タスクの成果は **`apps/` 配下のアプリケーションコードを一切変更しない**。対象は
`docs/30-workflows/completed-tasks/members-list-ux-clarity/` 配下の **workflow tracking
JSON メタデータ（`artifacts.json` の `status` / `workflow_state` / `implementation_status`
/ `phases[].status`）と Phase 10 レビュー文書の checkbox** の整合補正のみである。

| CONST_004 判定軸 | 本タスクの該当性 |
|------------------|------------------|
| ファイル変更・関数追加・API 変更・データモデル変更が含意されるか | **No** — JSON status フィールドと markdown checkbox の補正のみ |
| 「動作させる」「改善する」「修正する」等コード変更なしで達成不可能な目的があるか | **No** — 対象実装（`DensityToggle.client.tsx` の `sublabel` 等）は既に commit `37fe488e8` でマージ済み・動作済み |
| 純粋にドキュメント・調査・合意形成で完結するか | **Yes** — 機械可読 status と人間向け Phase 12 PASS 判定の乖離解消が全スコープ |

> よってデフォルトの「実装仕様書」ではなく「ドキュメントのみ仕様書」として作成する。
> ただし CONST_005 の必須項目（変更対象ファイル一覧・入出力定義・検証コマンド・DoD）は
> docs-only でも省略せず本仕様書で埋める。

## 目的

`members-list-ux-clarity` workflow の **人間向け Phase 12 close-out（PASS 判定）と機械可読
`artifacts.json` status の乖離を解消** し、台帳・dashboard 集計・後続 close-out audit が
矛盾なく完了タスクとして扱える状態にする。

## 調査による issue の最新コード最適化（2026-05-30）

issue #1008（2026-05-28 起票・2026-05-30 CLOSED）は root / outputs の `artifacts.json` 2
ファイルのみに言及していたが、最新コード（commit `7f6b51b27` 時点）の徹底調査で **元 issue
記述より広い乖離**が判明したため、根本解決のためスコープを以下へ最適化する。

| # | 乖離箇所（実測） | 元 issue 言及 | 本タスクで対応 |
|---|------------------|----------------|----------------|
| 1 | root `artifacts.json`: `workflow_state` / `implementation_status` = `spec_created`、phases 3 completed / 10 pending | ✅ あり | ✅ |
| 2 | `outputs/artifacts.json`: root と同一 `spec_created`（parity は保たれているが両方未補正） | ✅ あり | ✅ |
| 3 | **sub-task A/B/C `artifacts.json` が全て `spec_created`**。Task B のみ Phase 1-10 が completed で root と矛盾 | ⚠️ 部分言及（"一部 sub task"） | ✅（最適化で明示） |
| 4 | **Task B `phase-10-final-review.md` の AC checkbox 10 件が ☐ のまま** | ✅ あり（Phase 10 AC ずれ） | ✅ |
| 5 | aiworkflow-requirements register / inventory が `implemented_local_runtime_pending` を記載 → 実 `artifacts.json` の `spec_created` と乖離 | ❌ なし | ✅（最適化で追加） |

> 元 issue が参照する worktree path `task-20260528-120728-wt-8` は既に prune 済みで陳腐化して
> いる。本タスクは現行 worktree（`task-20260530-141233-wt-11`）の実ファイルを正本とする。

## なぜこの問題が他タスクで解決していないか

`members-list-ux-clarity` の実装コード（`DensityToggle.client.tsx` の `sublabel` 等）・Phase 11
evidence（24 PNG + focused vitest / playwright ログ）・Phase 12 strict 7 成果物はいずれも
commit `37fe488e8`「feat(members): メンバー一覧のUX明確化 (#1009)」で**追加・マージ済み**だが、
その際 `artifacts.json` は `spec_created` のまま登録された。以降のコミットに status 補正は
存在しない（`git log -- docs/30-workflows/completed-tasks/members-list-ux-clarity/` で確認）。
したがって本 reconciliation は本サイクルで実施し、issue #1008 の close 状態は変更しない。

## 確定整合先（target state）

実装・evidence・Phase 12 が完了し、残る user-gated 作業は staging visual baseline のみであるため、
`issue-976` 等の既存完了タスクと同じ `implemented_local_runtime_pending` 境界へ揃える。

| 対象 | Before | After |
|------|--------|-------|
| root `artifacts.json` `status`/`workflow_state`/`implementation_status` | `spec_created` | `implemented_local_runtime_pending` |
| root `phases[]` Phase 1-12 | 3 completed / 残り pending | Phase 1-12 = `completed` |
| root `phases[]` Phase 13 | pending | `pending`（user-gated 維持） |
| root `metadata.gates` Gate-A / Gate-B | (Gate metadata 未整備) | `passed`（evidence path 実在） |
| root `metadata.gates` Gate-C | pending | `pending`（staging visual baseline user-gated） |
| `outputs/artifacts.json` | root と同一 `spec_created` | root と byte 同期 |
| sub-task A/B/C `artifacts.json` | `spec_created` | 実体に沿って `completed`（Phase 1-12）/ Phase 13 pending |
| Task B `phase-10-final-review.md` AC checkbox 10 件 | ☐ | ☑ |

## 不変条件

- CLAUDE.md #5: D1 直接アクセス禁止（本タスクは docs のみ・無関係だが維持）
- CLAUDE.md #8: `*.spec.{ts,tsx}` のみ（本タスクはテスト追加なし）
- **apps/ 配下のアプリケーションコードを一切変更しない**（docs-only）
- Phase 13（commit / push / PR / staging visual baseline）は user-gated として `pending` を維持
- `members-list-ux-clarity` の実装内容・evidence ファイルの中身は変更しない（status フィールドのみ補正）

## Phase 一覧

| Phase | ファイル | 概要 |
|------|---------|------|
| 1 | `phase-1-requirements.md` | 要件 / AC / スコープ / docs-only 分類 |
| 2 | `phase-2-design.md` | status 整合戦略 / target state マトリクス / parity 設計 |
| 3 | `phase-3-design-review.md` | 自己レビュー / リスク / 4条件評価 |
| 4 | `phase-4-test-plan.md` | 検証計画（jq / diff / rg gate）|
| 5 | `phase-5-implementation.md` | 変更対象ファイル一覧 / 補正手順 / 疑似 diff |
| 6 | `phase-6-test-additions.md` | 追加検証ケース（parity / gate-metadata）|
| 7 | `phase-7-coverage.md` | 検証カバレッジ（対象 status フィールド網羅）|
| 8 | `phase-8-refactor.md` | リファクタ範囲（docs-only のため最小）|
| 9 | `phase-9-qa.md` | QA コマンド一式 |
| 10 | `phase-10-final-review.md` | セルフレビュー / acceptance |
| 11 | `phase-11-manual-test.md` | NON_VISUAL 証跡（実地操作不可・自動検証代替）|
| 12 | `phase-12-documentation.md` | aiworkflow 反映 / strict 7 |
| 13 | `phase-13-pr.md` | PR title / body（user-gated）|

## 成果物ディレクトリ

```
docs/30-workflows/completed-tasks/issue-1008-members-list-ux-clarity-artifact-status-reconciliation/
├── index.md
├── artifacts.json
├── phase-1-requirements.md … phase-13-pr.md
└── outputs/
    ├── artifacts.json
    ├── phase-11/manual-test-result.md
    └── phase-12/
        ├── implementation-guide.md
        ├── system-spec-update-summary.md
        ├── documentation-changelog.md
        ├── unassigned-task-detection.md
        ├── skill-feedback-report.md
        └── phase12-task-spec-compliance-check.md
```
