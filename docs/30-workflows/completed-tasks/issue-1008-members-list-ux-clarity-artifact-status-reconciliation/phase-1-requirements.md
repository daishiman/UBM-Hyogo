# Phase 1: 要件定義

## メタ情報

| 項目 | 内容 |
|------|------|
| task_id | issue-1008-members-list-ux-clarity-artifact-status-reconciliation |
| source_issue | https://github.com/daishiman/UBM-Hyogo/issues/1008（CLOSED 維持）|
| taskType | docs-only |
| 実装区分 | **ドキュメントのみ**（CONST_004 例外。判定根拠は index.md 参照）|
| implementation_mode | `verify_existing`（対象実装は merge 済み・status のみ補正）|
| visualEvidence | NON_VISUAL |
| 優先度 | 中 |
| 規模 | 小規模 |

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|----------|------|------|
| current branch に実装が存在する | **Yes**（`members-list-ux-clarity` 実装は commit `37fe488e8` でマージ済み）| Phase 5 = 実装ではなく status 補正の diff 確認 |
| upstream（dev）にマージ済み | **Yes**（`origin/dev` = HEAD = commit `7f6b51b27`、対象は `completed-tasks/` 配下に存在）| 再実装不要。status 整合のみ |
| 前提タスク（依存）が完了済み | **Yes**（`members-list-ux-clarity` の Phase 12 strict 7 / Phase 11 evidence 完成）| 依存解消タスク不要 |

> upstream マージ済みのため Phase 5 冒頭は「差分確認」セクションとし、実装の代わりに
> JSON status フィールドの補正内容を diff として定義する。

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`members-list-ux-clarity` は実装コード（`apps/web/src/components/public/DensityToggle.client.tsx`
の `sublabel` 等）・Phase 11 evidence（24 PNG + focused vitest / playwright ログ）・Phase 12
strict 7 成果物がすべて commit `37fe488e8`「feat(members): メンバー一覧のUX明確化 (#1009)」で
追加・マージ済みである。しかしその際 `artifacts.json` は `spec_created` のまま登録され、以降の
コミットに status 補正は存在しない。

### 1.2 問題点・課題（最新コード実測）

| # | 乖離 | 実測値 |
|---|------|--------|
| 1 | root `artifacts.json` の `workflow_state` / `implementation_status` | `spec_created`（phases: 3 completed / 10 pending）|
| 2 | `outputs/artifacts.json` | root と同一 `spec_created`（両方未補正）|
| 3 | sub-task A/B/C `artifacts.json` | 全て `spec_created`。Task B のみ Phase 1-10 が completed で root と矛盾 |
| 4 | Task B `phase-10-final-review.md` AC checkbox | 10 件全て ☐（未チェック）|
| 5 | aiworkflow-requirements register / inventory | `implemented_local_runtime_pending` を記載 → 実 `artifacts.json` の `spec_created` と乖離 |

### 1.3 放置した場合の影響

- 完了タスク dashboard / 集計で `members-list-ux-clarity` が未完了扱いになる。
- Phase 12 の PASS 判定と機械可読 status が矛盾し、後続 close-out audit が余分な手戻りを起こす。
- aiworkflow register（`implemented_local_runtime_pending`）と実ファイル（`spec_created`）の
  drift が拡大し、`verify:phase12-compliance` の status consistency セクションで矛盾検出される。

## 2. 何を達成するか（What）

### 2.1 目的

`members-list-ux-clarity` の人間向け Phase 12 close-out（PASS）と機械可読 `artifacts.json`
status を一致させ、完了タスクとして矛盾なく扱える状態にする。

### 2.2 受入条件（Acceptance Criteria）

- **AC-1**: root `artifacts.json` の `status` / `metadata.workflow_state` / `implementation_status`
  が `implemented_local_runtime_pending` へ揃う。
- **AC-2**: root `artifacts.json` の Phase 1-12 `status` が `completed`、Phase 13 が `pending`（user-gated）になる。
- **AC-3**: `outputs/artifacts.json` が root `artifacts.json` と整合（parity）する。
- **AC-4**: sub-task A/B/C `artifacts.json` が実体に沿って整合し、root との矛盾が解消する。
- **AC-5**: Task B `phase-10-final-review.md` の AC checkbox 10 件が ☑（PASS）になる。
- **AC-6**: root `metadata.gates` で Gate-A / Gate-B が `passed`（evidence path 実在）、Gate-C が `pending`（staging visual baseline user-gated）になる。
- **AC-7**: aiworkflow-requirements register / inventory の `members-list-ux-clarity` 記述が実 `artifacts.json` と一致する。
- **AC-8**: `gate-metadata:validate` が members-list-ux-clarity artifacts に対して ERROR 0 になる。

### 2.3 成果物（本仕様書が指示する補正対象ファイル）

| パス | 変更種別 |
|------|----------|
| `docs/30-workflows/completed-tasks/members-list-ux-clarity/artifacts.json` | 編集（status / gates）|
| `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/artifacts.json` | 編集（parity）|
| `docs/30-workflows/completed-tasks/members-list-ux-clarity/tasks/task-a-density-toggle-ux-clarity/artifacts.json` | 編集（status）|
| `docs/30-workflows/completed-tasks/members-list-ux-clarity/tasks/task-b-member-filters-live-affordance/artifacts.json` | 編集（status）|
| `docs/30-workflows/completed-tasks/members-list-ux-clarity/tasks/task-c-page-integration-and-visual-baseline/artifacts.json` | 編集（status）|
| `docs/30-workflows/completed-tasks/members-list-ux-clarity/tasks/task-b-member-filters-live-affordance/phase-10-final-review.md` | 編集（checkbox）|
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` 他 register | 確認（既に `implemented_local_runtime_pending` 記載なら no-op）|

## 3. スコープ

### 含む

- 上記 6 ファイルの status / checkbox 整合補正
- root ↔ outputs artifacts parity 確認
- aiworkflow-requirements register との整合確認

### 含まない

- `apps/` 配下のアプリケーションコード変更（**禁止**）
- `members-list-ux-clarity` の実装内容・evidence ファイル中身の変更
- commit / push / PR（user-gated / Phase 13）
- issue #1008 の状態変更（CLOSED のまま維持）

## 4. CONST_007 スコープ完結性

本タスクは「members-list-ux-clarity の artifacts status 整合」という単一責務で、補正対象
6 ファイル全てを **本実行サイクルの 1 サイクル内で完了できる**。先送り
（別 PR / バックログ）は発生しない。分割もしない（並列化の必要がない小規模 docs-only）。

## 5. 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
|----------|------|------|
| gate-metadata | `.claude/skills/aiworkflow-requirements/references/gate-metadata.md` | `metadata.gates[]` 構造・status enum・evidence_path 規約 |
| task-workflow-active | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active/completed workflow register |
| workflow-members-list-ux-clarity-artifact-inventory | `.claude/skills/aiworkflow-requirements/references/workflow-members-list-ux-clarity-artifact-inventory.md` | 対象 workflow の artifact inventory |

### 既存パターン

- 整合先 state の正本例: `docs/30-workflows/completed-tasks/issue-976-admin-fetch-service-binding/artifacts.json`（`implemented_local_runtime_pending` + Gate-A/B passed + Gate-C pending）
- skill lessons: `[Feedback TASK-UI-04]`（実装完了後に `artifacts.json` status が `spec_created` のまま放置される漏れパターン）
