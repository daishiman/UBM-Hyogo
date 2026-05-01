# TASK-SPEC-PHASE-FILENAME-DETECTION-001

```yaml
issue_number: 341
task_id: TASK-SPEC-PHASE-FILENAME-DETECTION-001
task_name: task-specification-creator Phase file detection hardening
category: 改善
target_feature: task-specification-creator workflow evidence detection
priority: 中
scale: 小規模
status: 未実施
source_phase: UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC Phase 12
created_date: 2026-05-01
dependencies: []
```

## メタ情報

| 項目 | 内容 |
| --- | --- |
| task_id | TASK-SPEC-PHASE-FILENAME-DETECTION-001 |
| 種別 | skill improvement / docs tooling |
| 起点 | UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC Phase 12 review |
| workflow_state | spec_created |
| 優先度 | Medium |
| 状態 | unassigned |
| 正本仕様 | `.claude/skills/task-specification-creator/` |

## 背景

`task-specification-creator` の LOGS で、`phase-01.md` 形式の Phase ファイル検出が弱く、index / evidence 生成時に phase outputs を見落とす可能性があると記録された。今回の `UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC` は root 直下の `phase-01.md` から `phase-13.md` と `outputs/phase-*/main.md` を併用しているため、固定的に `outputs/phase-*/main.md` だけを探す実装やレビュー手順では Phase 完了判定がずれる。

## 対応方針

1. `phase-01.md` から `phase-13.md` と `outputs/phase-*/main.md` の両方を検出対象にする。
2. root / outputs `artifacts.json` の `phases[].file` / `outputs[]` を優先し、ファイル名の固定推測だけに依存しない。
3. Phase 12 compliance check に、検出結果の実測値を残す。
4. `references/phase-12-documentation-guide.md` または該当 script / reference に、root Phase file と outputs Phase artifact の二系統を扱う運用を明記する。

## 受入条件

- [ ] AC-1: task-specification-creator の該当 reference または script が更新される。
- [ ] AC-2: 既存 workflow で `phase-01.md` 系が検出できることを smoke で確認する。
- [ ] AC-3: `outputs/phase-12/phase12-task-spec-compliance-check.md` の確認項目に、root Phase file と outputs artifact の両方が記録される。
- [ ] AC-4: skill feedback / LOGS に再発防止の記録が残る。

## Phase 実行方針

| Phase | 要点 |
| --- | --- |
| Phase 1 | 対象 script / reference / evidence 生成箇所を棚卸しし、編集対象を限定する |
| Phase 2 | `artifacts.json` 優先、root `phase-XX.md` fallback、`outputs/phase-XX/main.md` fallback の順序を設計する |
| Phase 3 | 既存 workflow 3 件以上で file layout を比較する |
| Phase 4 | smoke 対象と期待結果を定義する |
| Phase 5 | 変更手順と rollback を記録する |
| Phase 6 | 検出漏れ・二重検出・completed-tasks 移動後 path drift の失敗ケースを整理する |
| Phase 7 | AC-1 から AC-4 の判定表を作る |
| Phase 8 | 仕様または script を実装する |
| Phase 9 | 追加コストなしを確認する |
| Phase 10 | go / no-go を判定する |
| Phase 11 | smoke 結果を NON_VISUAL evidence として残す |
| Phase 12 | implementation-guide / system-spec-update-summary / unassigned-task-detection / skill-feedback を作成する |
| Phase 13 | ユーザー承認後に commit / PR を実行する |

## 苦戦箇所【記入必須】

- 対象: `.claude/skills/task-specification-creator/LOGS/_legacy.md`
- 症状: `phase-01.md` 形式の root Phase file と `outputs/phase-*/main.md` 形式の成果物が混在し、Phase 12 close-out review で「Phase ファイル未検出」と誤判定しやすい。
- 参照: `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-observability-matrix-sync/outputs/phase-12/skill-feedback-report.md`
- 対象: `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-observability-matrix-sync/artifacts.json`
- 症状: root / outputs の `artifacts.json` を見ずにファイル名だけで判定すると、completed-tasks へ移動済みの旧 workflow と現行 workflow を取り違える。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| `phase-01.md` 系 workflow を未完了と誤判定する | `artifacts.json` の phase file 宣言を第一優先にし、root Phase file と outputs artifact の両方を検出する |
| completed-tasks 移動後に旧パスを正本として扱う | `indexes/resource-map.md` と workflow root の実在パスを smoke に含める |
| script 変更で既存 `outputs/phase-*/main.md` 系の検出が壊れる | 既存 layout と root phase layout の両方を対象に回帰 smoke を実行する |

## 検証方法

### 単体検証

```bash
rg -n "phase-01.md|outputs/phase-|artifacts.json|phase12-task-spec-compliance" .claude/skills/task-specification-creator
```

期待: 対象 reference / script に root Phase file と outputs artifact の二系統が明記されている。

### 統合検証

```bash
find docs/30-workflows/completed-tasks/ut-cicd-drift-impl-observability-matrix-sync -maxdepth 3 -type f | sort | rg 'phase-0[1-9]\\.md|phase-1[0-3]\\.md|outputs/phase-[0-9]+/main\\.md|outputs/phase-12/phase12-task-spec-compliance-check\\.md'
```

期待: root `phase-01.md` から `phase-13.md` と outputs 配下の Phase 成果物が同時に検出される。

## スコープ（含む/含まない）

| 含む | 含まない |
| --- | --- |
| task-specification-creator の Phase file 検出ルール補強、smoke evidence、LOGS / skill feedback 更新 | 既存 workflow の内容修正、completed-tasks の再分類、GitHub Actions workflow lint gate 実装 |

## 委譲先 / 関連

- 起点: `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-observability-matrix-sync/`
- 関連: `docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-WORKFLOW-LINT-GATE.md`
- 関連: `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md`
