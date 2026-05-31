# Phase 5: 実装（status 補正手順）

> docs-only タスクのため「実装」= `artifacts.json` の status フィールド補正と markdown checkbox 補正。
> `apps/` 配下のアプリケーションコードは一切変更しない。

## 5.1 差分確認（P50 upstream マージ済み前提）

`members-list-ux-clarity` の実装コード・evidence・Phase 12 strict 7 は commit `37fe488e8`
「feat(members): メンバー一覧のUX明確化 (#1009)」で既に dev にマージ済みである。本 Phase は
再実装ではなく、その後 `spec_created` のまま放置された status の補正のみを行う。

```bash
# 対象 workflow が completed-tasks/ 配下に存在し、実装 commit がマージ済みであることを確認
git log --oneline -- docs/30-workflows/completed-tasks/members-list-ux-clarity/ | head -5
ls docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-12/
find docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11 -iname '*.png' | wc -l   # 27
```

- 期待: phase-12 strict 7 ファイル群が実在、phase-11 PNG が 27 件、`outputs/phase-11/runtime-notes.md` + `evidence/focused-component-tests.log` が実在。

## 5.2 補正手段

各 `artifacts.json` の値変更は手動 `Edit`（exact string replace）または `jq` で行う。
`tasks/task-specification-creator` skill の `complete-phase.js` も補正実行手段の候補だが、
本タスクは値の点修正であり、`Edit` 手動を第一手段とする。markdown checkbox は `Edit` で置換する。

## 5.3 補正対象ごとの before → after 疑似 diff

### 補正1: root `artifacts.json`

```diff
- "status": "spec_created",
+ "status": "implemented_local_runtime_pending",

  "metadata": {
-   "workflow_state": "spec_created",
-   "implementation_status": "spec_created",
+   "workflow_state": "implemented_local_runtime_pending",
+   "implementation_status": "implemented_local_runtime_pending",

  "gates": [
    {
      "gate_id": "Gate-A",
-     "status": "pending",
-     "passed_at": null,
+     "status": "passed",
+     "passed_at": "2026-05-30T00:00:00Z",
      "evidence_path": "docs/30-workflows/completed-tasks/members-list-ux-clarity/phase-3-design-review.md",
    },
    {
      "gate_id": "Gate-B",
-     "status": "pending",
-     "passed_at": null,
-     "evidence_path": "outputs/phase-11/manual-test-result.md",
+     "status": "passed",
+     "passed_at": "2026-05-30T00:00:00Z",
+     "evidence_path": "outputs/phase-11/runtime-notes.md",
    },
    {
      "gate_id": "Gate-C",
      "status": "pending",      // 不変（staging visual baseline user-gated）
      "passed_at": null,
    }
  ]

  "phases": [
-   { "phase": 4, ..., "status": "pending", ... },  // Phase 4..12 を completed へ
+   { "phase": 4, ..., "status": "completed", ... },
    // Phase 5,6,7,8,9,10,11,12 も同様に "pending" → "completed"
    { "phase": 13, ..., "status": "pending", ... }  // 不変（user-gated）
  ]
```

> Phase 1-3 は既に `completed`。補正対象は Phase 4-12 の 9 件（`pending`→`completed`）。Phase 13 は `pending` 維持。
> **Gate-B evidence_path の補正理由**: 現 path `outputs/phase-11/manual-test-result.md` は不在。`passed` 化には実在 path が必須のため、実在する `outputs/phase-11/runtime-notes.md` に差し替える。

### 補正2: `outputs/artifacts.json`

root と byte parity になるよう、補正1 と同一内容を適用する。

```bash
# 補正1 適用後、root を outputs にコピーして parity を確定する手段（推奨）
cp docs/30-workflows/completed-tasks/members-list-ux-clarity/artifacts.json \
   docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/artifacts.json
diff -u docs/30-workflows/completed-tasks/members-list-ux-clarity/artifacts.json \
        docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/artifacts.json   # 差分なし
```

> root と outputs は補正前から同一内容（両方 `spec_created`）。補正後も byte 一致を維持する。

### 補正3: Task A `artifacts.json`

```diff
- "status": "spec_created",
+ "status": "implemented_local_runtime_pending",
  "metadata": {
-   "workflow_state": "spec_created",
-   "implementation_status": "spec_created",
+   "workflow_state": "implemented_local_runtime_pending",
+   "implementation_status": "implemented_local_runtime_pending",
  }
  "phases": [
-   { "phase": 1..12, ..., "status": "spec_created", ... }
+   { "phase": 1..12, ..., "status": "completed", ... }
-   { "phase": 13, ..., "status": "spec_created", ... }
+   { "phase": 13, ..., "status": "pending", ... }
  ]
```

> Task A は phase status が全 13 件 `spec_created` 値で他 sub-task と表記不統一。Phase 1-12 を `completed`、Phase 13 を `pending` へ正規化する。

### 補正4: Task B `artifacts.json`

```diff
- "status": "spec_created",
+ "status": "implemented_local_runtime_pending",
  "metadata": {
-   "workflow_state": "spec_created",
-   "implementation_status": "spec_created",
+   "workflow_state": "implemented_local_runtime_pending",
+   "implementation_status": "implemented_local_runtime_pending",
  }
  "phases": [
    // Phase 1-10 は既に "completed"（不変）
-   { "phase": 11, ..., "status": "pending", ... },
-   { "phase": 12, ..., "status": "pending", ... },
+   { "phase": 11, ..., "status": "completed", ... },
+   { "phase": 12, ..., "status": "completed", ... },
    { "phase": 13, ..., "status": "pending", ... }  // 不変（user-gated）
  ]
```

> Task B は Phase 1-10 が既に `completed`。補正対象は Phase 11/12（`pending`→`completed`）。Phase 13 は `pending` 維持。

### 補正5: Task B `phase-10-final-review.md` AC checkbox

```diff
- | AC-B-1 hint + aria-describedby | TC-B-MF-01 | ☐ PASS |
+ | AC-B-1 hint + aria-describedby | TC-B-MF-01 | ☑ PASS |
  // AC-B-2 .. AC-B-10 も同様に "☐ PASS" → "☑ PASS"（計 10 件）
```

> AC ID（AC-B-1..AC-B-10）の文言・検証手段列は変更しない。チェックボックス記号 `☐`→`☑` のみ。
> § 4 DoD の `- [ ]` 3 件は本タスクの補正対象外（AC 行の `☐ PASS` 10 件のみ補正）。

### 補正6: Task C `artifacts.json`

```diff
- "status": "spec_created",
+ "status": "implemented_local_runtime_pending",
  "metadata": {
-   "workflow_state": "spec_created",
-   "implementation_status": "spec_created",
+   "workflow_state": "implemented_local_runtime_pending",
+   "implementation_status": "implemented_local_runtime_pending",
  }
  "phases": [
-   { "phase": 1..12, ..., "status": "pending", ... }
+   { "phase": 1..12, ..., "status": "completed", ... }
    { "phase": 13, ..., "status": "pending", ... }  // 不変（user-gated）
  ]
```

> Task C は phase status が全 13 件 `pending`。page integration 実装済みのため Phase 1-12 を `completed`、Phase 13 を `pending` へ正規化する。

### 補正7（確認・原則 no-op）: aiworkflow register / inventory

```bash
rg 'members-list-ux-clarity' .claude/skills/aiworkflow-requirements/references/task-workflow-active.md
rg 'members-list-ux-clarity' .claude/skills/aiworkflow-requirements/references/workflow-members-list-ux-clarity-artifact-inventory.md
```

> register / inventory は既に `implemented_local_runtime_pending` を記載している見込み。補正後の artifacts と一致すれば no-op。drift があった場合のみ register 側を artifacts に合わせる。

## 5.4 新規作成 / 編集ファイル一覧（RT-03 必須）

| パス | 種別 | 補正内容 |
|------|------|----------|
| `docs/30-workflows/completed-tasks/members-list-ux-clarity/artifacts.json` | 編集 | status 3 / phases 4-12 / Gate-A,B passed + Gate-B evidence_path |
| `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/artifacts.json` | 編集 | root と byte parity |
| `docs/30-workflows/completed-tasks/members-list-ux-clarity/tasks/task-a-density-toggle-ux-clarity/artifacts.json` | 編集 | status 3 / phases 1-12 completed / 13 pending |
| `docs/30-workflows/completed-tasks/members-list-ux-clarity/tasks/task-b-member-filters-live-affordance/artifacts.json` | 編集 | status 3 / phases 11-12 completed |
| `docs/30-workflows/completed-tasks/members-list-ux-clarity/tasks/task-b-member-filters-live-affordance/phase-10-final-review.md` | 編集 | AC checkbox 10 件 ☐→☑ |
| `docs/30-workflows/completed-tasks/members-list-ux-clarity/tasks/task-c-page-integration-and-visual-baseline/artifacts.json` | 編集 | status 3 / phases 1-12 completed / 13 pending |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 確認（条件付き編集）| register が artifacts と一致するか rg 確認。drift 時のみ補正 |
| `.claude/skills/aiworkflow-requirements/references/workflow-members-list-ux-clarity-artifact-inventory.md` | 確認（条件付き編集）| inventory が artifacts と一致するか rg 確認。drift 時のみ補正 |

> **新規作成ファイルは 0 件**（本仕様書 Phase 4-9 等の docs を除く）。全て既存ファイルの値編集。

## 5.5 apps/ 変更ゼロの明記

本 Phase の全補正は `docs/30-workflows/` および（条件付きで）`.claude/skills/` 配下のみ。
`apps/` `packages/` 配下のアプリケーションコードは一切変更・作成しない。
補正完了後に `git status --porcelain apps/ packages/` が空であることを Phase 9 で検証する。

## 5.6 DoD（Definition of Done）

- [ ] root `artifacts.json` の status 3 フィールド = `implemented_local_runtime_pending`（VC-1）
- [ ] root Phase 1-12 = `completed` / Phase 13 = `pending`（VC-2 / VC-3）
- [ ] root Gate-A/B = `passed` + ISO8601 `passed_at` + evidence 実在 / Gate-C = `pending`（VC-5/6/7）
- [ ] `outputs/artifacts.json` が root と parity（VC-4）
- [ ] sub-task A/B/C が status 整合（VC-8）
- [ ] Task B `phase-10-final-review.md` の AC checkbox 10 件が ☑（VC-9）
- [ ] `mise exec -- pnpm gate-metadata:validate` ERROR 0（VC-10）
- [ ] register / inventory と artifacts が一致（VC-11）
- [ ] `git status --porcelain apps/ packages/` が空（apps/ 変更ゼロ）
