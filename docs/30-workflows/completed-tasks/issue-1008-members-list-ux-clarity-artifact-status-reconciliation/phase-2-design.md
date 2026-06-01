# Phase 2: 設計

## 2.1 真の論点（要件レビュー思考法）

- **真の論点**: 「実装は完了しているのに status だけが `spec_created` で止まっている」=
  人間向け close-out（PASS）と機械可読台帳の **single source of truth 不一致**。
- **why now**: aiworkflow register が既に `implemented_local_runtime_pending` を主張しており、
  実 `artifacts.json` がそれに追従していない drift が拡大する前に整合させる。
- **why this way**: 実装・evidence は変更せず status フィールドのみを **current facts に
  合わせて補正**する（後付けではなく、既に起きた事実の記録）。

## 2.2 対象モジュール俯瞰（後続 Phase が補正可能な粒度）

対象 workflow ルート: `docs/30-workflows/completed-tasks/members-list-ux-clarity/`

```
members-list-ux-clarity/
├── artifacts.json                ← [補正1] root status + gates
├── outputs/artifacts.json        ← [補正2] root と parity
├── tasks/
│   ├── task-a-density-toggle-ux-clarity/artifacts.json          ← [補正3]
│   ├── task-b-member-filters-live-affordance/artifacts.json     ← [補正4]
│   ├── task-b-member-filters-live-affordance/phase-10-final-review.md ← [補正5] checkbox
│   └── task-c-page-integration-and-visual-baseline/artifacts.json ← [補正6]
├── outputs/phase-11/ (24 PNG + ログ — 変更しない)
└── outputs/phase-12/ (strict 7 — 変更しない)
```

## 2.3 status 整合戦略（target state マトリクス）

### 補正1: root `artifacts.json`

| フィールド | 現在値 | 補正後 | 根拠 |
|------------|--------|--------|------|
| `status` | `spec_created` | `implemented_local_runtime_pending` | 実装 + evidence + Phase 12 完了、staging visual のみ残 |
| `metadata.workflow_state` | `spec_created` | `implemented_local_runtime_pending` | 同上 |
| `metadata.implementation_status` | `spec_created` | `implemented_local_runtime_pending` | 同上 |
| `phases[1..12].status` | 一部 pending | `completed` | Phase 1-12 成果物が実在 |
| `phases[13].status` | pending | `pending` | commit/push/PR/staging visual = user-gated |
| `metadata.gates[Gate-A].status` | pending | `passed` + `passed_at` ISO8601 + evidence path 実在 | Phase 12 strict 7 完成 |
| `metadata.gates[Gate-B].status` | pending | `passed` + `passed_at` ISO8601 + evidence path 実在 | Phase 11 local evidence 完成 |
| `metadata.gates[Gate-C].status` | pending | `pending` | staging visual baseline user-gated |

> root の top-level keys（`created_at` / `implementation_mode` / `implementation_targets` /
> `metadata` / `phases` / `status` / `task_id` / `task_type` / `visual_category`）の構造は
> 維持し、値のみ補正する。新規キー追加・キー削除は行わない。

> **重要（gate evidence_path の実在 + repo-root 相対への補正）**: 現状の対象 root `artifacts.json`
> の gate evidence_path は以下の問題があり、`passed` 化前に必ず補正する。
>
> | gate | 現在の evidence_path | 問題 | 補正後 |
> |------|----------------------|------|--------|
> | Gate-A | `docs/30-workflows/completed-tasks/members-list-ux-clarity/phase-3-design-review.md` | 実在・repo-root 相対 OK | Phase 12 strict 7 の `outputs/phase-12/phase12-task-spec-compliance-check.md`（repo-root 相対）へ更新し `passed` 化 |
> | Gate-B | `outputs/phase-11/manual-test-result.md` | **実在しない**（実ファイルは `runtime-notes.md`）かつ **repo-root 相対でない** | `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11/runtime-notes.md`（実在・repo-root 相対）へ更新し `passed` 化 |
> | Gate-C | `outputs/phase-13/pr-creation-result.md` | repo-root 相対でない（status は pending 維持のため実在検査は走らないが整合のため補正）| `docs/30-workflows/completed-tasks/members-list-ux-clarity/phase-13-pr.md` 等の repo-root 相対 path へ整える（status `pending` 維持）|
>
> 理由: `gate-metadata:validate` は evidence_path を repo-root 相対として解決し、`status === "passed"`
> の gate では実ファイル存在を必須とする（`scripts/gate-metadata/validate.ts`）。relative path や
> 不在ファイルを指したまま `passed` 化すると ERROR になる。

### 補正2: `outputs/artifacts.json`

root と同一内容へ更新（byte parity）。`diff -u root outputs` が空になることを DoD とする。

### 補正3-6: sub-task A/B/C + Task B checkbox

| 対象 | 現在 | 補正後 | 備考 |
|------|------|--------|------|
| Task A `artifacts.json` | `workflow_state`=`spec_created`、phases 13 件全て `spec_created` 値 | `workflow_state`=`implemented_local_runtime_pending`、phases 1-12=`completed`、13=`pending` | phase status 値が他 sub-task と表記不統一（`spec_created`）のため正規化 |
| Task B `artifacts.json` | `workflow_state`=`spec_created`、phases 10 completed / 3 pending | `workflow_state`=`implemented_local_runtime_pending`、phases 1-12=`completed`、13=`pending` | Phase 11/12 を completed へ |
| Task C `artifacts.json` | `workflow_state`=`spec_created`、phases 13 件 pending | `workflow_state`=`implemented_local_runtime_pending`、phases 1-12=`completed`、13=`pending` | page integration 実装済み |
| Task B `phase-10-final-review.md` | AC checkbox 10 件 ☐ PASS | 10 件 ☑ PASS（または `[x]`）| Phase 12 PASS と整合。AC ID（AC-B-1..AC-B-10）の文言は変更しない |

> **正規化方針**: sub-task の `phases[].status` 値は `spec_created` / `completed` / `pending`
> が混在しているため、reconciliation 後は **`completed`（Phase 1-12）/ `pending`（Phase 13）** に
> 統一する。Gate-C 相当（staging visual baseline）が残る Task C も Phase 13 を `pending` とする。

## 2.4 parity / validation 設計

| 検査 | コマンド | 期待 |
|------|----------|------|
| root status | `jq '.status, .metadata.workflow_state, .metadata.implementation_status' <root>` | 3 値とも `implemented_local_runtime_pending` |
| phase status | `jq '[.phases[] \| select(.phase<=12) \| .status] \| unique' <root>` | `["completed"]` |
| parity | `diff -u <root> <outputs>` | 差分なし |
| gate-metadata | `mise exec -- pnpm gate-metadata:validate` | members-list-ux-clarity artifacts ERROR 0 |
| register 整合 | `rg 'members-list-ux-clarity' .claude/skills/aiworkflow-requirements` | `implemented_local_runtime_pending` と一致 |

## 2.5 既存コンポーネント再利用可否（FB-SDK-07-1）

新規ファイル・スクリプトは作成しない。補正は既存 `artifacts.json` の値変更と markdown
checkbox 変更のみ。`complete-phase.js`（task-specification-creator skill）を補正実行手段の
候補とするが、手動 `jq`/Edit でも可（本実行サイクルが選択）。

## 2.6 状態所有権

- `members-list-ux-clarity` の status の所有権は当該 workflow root の `artifacts.json` が持つ。
  本タスクはその値を current facts に同期するだけで、所有権・構造は移さない。
- aiworkflow register は `artifacts.json` を参照する従属台帳。register が先行していた drift を
  artifacts 側を正にして解消する（register 側は既に正しいため変更不要の見込み）。
