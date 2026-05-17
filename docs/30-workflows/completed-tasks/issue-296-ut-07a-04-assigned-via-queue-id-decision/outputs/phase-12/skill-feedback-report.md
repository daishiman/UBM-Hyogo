# Phase 12 skill-feedback-report - UT-07A-04

## 対象 skill

- `aiworkflow-requirements`
- `task-specification-creator`

## feedback 1: schema drift の早期 ADR 化を運用ルール化

### 観測

07a タスクで仕様 (`tag_code, assigned_via_queue_id`) と実装 (`tag_id, source, assigned_by`) の drift が発生したが、closure 時点で ADR 起票がされず、UT-07A-04 として 1 サイクル遅延した。

### Routing

**completed (same-cycle promotion)**: `aiworkflow-requirements` の `references/database-implementation-core.md` に「schema drift を検出した場合、closure 前に ADR 起票 or 起票タスクを `unassigned-task/` に作成すること」を明文化した。

## feedback 2: completed-tasks 配下への back-link 追記ポリシー

### 観測

closure 後の親タスクの `unassigned-task-detection.md` に、後発 ADR からの back-link を追記する運用が明文化されていない。本タスクでは行末への補足追記で対応するが、ルールが曖昧。

### Routing

**completed (same-cycle promotion)**: `task-specification-creator` の `references/phase-12-spec.md` に「completed-tasks 配下への追記は脚注 / 行末補足のみ可。本文の破壊的編集は禁止」を明文化した。

## feedback 3: docs-only タスクの CONST_005 変形ルール

### 観測

CONST_005 は関数シグネチャ・テスト・実行コマンドを要求するが、docs-only タスクではこれらが該当しない。本タスクでは grep verification コマンドへの置き換えで対応した。

### Routing

**completed (same-cycle promotion)**: `task-specification-creator` の `references/phase-12-spec.md` に「CONST_004 docs-only 例外時、CONST_005 は grep / git diff 検証コマンドで代替する」変形ルールを明文化した。

## Phase 12 実行時に記録

- skill PR 起票要否: 不要。今回の仕様改善サイクルで owning skill references へ直接反映済み。
