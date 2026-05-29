# task-members-list-ux-clarity-phase-artifact-reconciliation-001 - タスク仕様書

## メタ情報

```yaml
issue_number: 1008
task_id: task-members-list-ux-clarity-phase-artifact-reconciliation-001
task_name: members-list-ux-clarity Phase artifacts status 整合補正
category: リファクタリング
target_feature: docs/30-workflows/completed-tasks/members-list-ux-clarity
priority: 中
scale: 小規模
status: 未実施
source_phase: Phase 12 / close-out audit
created_date: 2026-05-28
dependencies:
  - docs/30-workflows/completed-tasks/members-list-ux-clarity/
spec_path: docs/30-workflows/unassigned-task/task-members-list-ux-clarity-phase-artifact-reconciliation-001.md
```

| 項目 | 内容 |
| --- | --- |
| タスクID | task-members-list-ux-clarity-phase-artifact-reconciliation-001 |
| タスク名 | members-list-ux-clarity Phase artifacts status 整合補正 |
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`members-list-ux-clarity` は Phase 12 strict 7、Phase 11 local evidence、aiworkflow-requirements 同期が存在する。一方、root `artifacts.json` と一部 sub task `artifacts.json` は `spec_created` / `pending` のまま残っており、Phase 12 の PASS 判定と機械可読 status が一致していない。

### 1.2 問題点・課題

- root artifacts が `spec_created` のままだと、完了タスク移動や dashboard 集計で未完了扱いになる。
- Task B の Phase 10 AC check 欄など、文書上の checkbox と Phase 12 PASS がずれている。
- `outputs/artifacts.json` と root `artifacts.json` の parity が壊れやすい。

### 1.3 放置した場合の影響

completed-tasks 移動後に active workflow register / artifact inventory / path reference が矛盾し、後続PRの close-out audit が余分な手戻りを起こす。

---

## 2. 何を達成するか（What）

### 2.1 目的

`members-list-ux-clarity` の人間向け Phase 12 close-out と機械可読 artifacts status を一致させる。

### 2.2 最終ゴール

- root と outputs の `artifacts.json` が `implemented_local_runtime_pending` 相当へ揃う。
- Phase 1-12 の status が実体に沿って completed になる。
- user-gated な commit / push / PR / staging visual baseline は pending として残る。

### 2.3 成果物

- `docs/30-workflows/completed-tasks/members-list-ux-clarity/artifacts.json`
- `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/artifacts.json`
- 必要に応じた sub task artifacts / final review checkbox 補正

---

## 3. 実行条件

### 3.1 前提条件

- Phase 12 strict 7 が存在すること。
- completed-tasks へ移動する場合は、移動前後の path reference を同時に更新すること。

### 3.2 依存タスク

- `members-list-ux-clarity` Phase 12 strict 7

---

## 4. 完了条件

- `jq` で root / outputs artifacts の workflow_state と phase statuses が一致する。
- Phase 13 だけが user-gated pending として残る。
- aiworkflow-requirements index / artifact inventory が移動後 path を参照する。

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260528-120728-wt-8/docs/30-workflows/completed-tasks/members-list-ux-clarity/artifacts.json`
- 症状: Phase 12 成果物は揃っているが、root artifacts の `workflow_state` と `phases[].status` が `spec_created` / `pending` のまま残り、Phase 12 PASS 判定と機械可読状態が矛盾した。
- 参照: `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-12/phase12-task-spec-compliance-check.md`, `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

## リスクと対策

| リスク | 対策 |
| --- | --- |
| Phase 13 user-gated 境界まで completed にしてしまう | Phase 13 は commit / push / PR / staging visual baseline pending として明示的に残す |
| 移動後に旧 path reference が残る | `rg -n "docs/30-workflows/completed-tasks/members-list-ux-clarity"` で全参照を確認し、必要箇所だけ completed path に更新する |
| artifacts.json と outputs/artifacts.json が diverge する | 同一内容に揃えてから `diff -u` で確認する |

## 検証方法

### 単体検証

```bash
jq '.metadata.workflow_state, [.phases[] | select(.phase <= 12) | .status] | unique' docs/30-workflows/completed-tasks/members-list-ux-clarity/artifacts.json
diff -u docs/30-workflows/completed-tasks/members-list-ux-clarity/artifacts.json docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/artifacts.json
```

期待: workflow_state が local implementation 済み境界を示し、Phase 1-12 が completed、root / outputs artifacts が一致する。

### 統合検証

```bash
rg -n "docs/30-workflows/completed-tasks/members-list-ux-clarity" docs/30-workflows .claude/skills/aiworkflow-requirements
```

期待: completed-tasks 移動後は、正本 register / artifact inventory が移動後 path を参照する。

## スコープ

### 含む

- `members-list-ux-clarity` artifacts status 補正
- root / outputs artifacts parity
- 移動後 path reference 補正

### 含まない

- commit / push / PR
- staging visual baseline 更新
- 実装コードの追加変更
