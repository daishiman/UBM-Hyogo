# Phase 1: 要件定義

## 目的

UT coverage wave-2 完了後の残 gap を layer 別に可視化し、wave-3 roadmap として確定するための要件・スコープ・AC を確定する。`artifacts.json.metadata.visualEvidence = NON_VISUAL` を Phase 1 完了条件として固定する。

## 真の論点

- 「unassigned-task-detection ゼロ」と「coverage 数値ゼロ gap」の二層性をどこで吸収するか（→ wave 横断の roadmap layer を確立）
- wave 単位（並列実装タスク群）と layer 単位（admin / public / shared / api）の不整合を集計テンプレートでどう橋渡しするか
- NON_VISUAL coverage backlog（integration / e2e 委譲箇所）を wave-2 各タスクから集約する単一の場所をどこに置くか

## 4 条件評価

| 条件 | 内容 |
| --- | --- |
| 価値 | wave-3 計画の input として layer × coverage 数値 + gap + backlog を一元化、属人化排除 |
| 実現 | `vitest --coverage` 実行 + markdown 集計 + indexes 再生成のみ。新規 CI / コード追加なし |
| 整合 | aiworkflow-requirements active workflow 索引に wave-3 roadmap を追加し SSOT に整合 |
| 運用 | `pnpm indexes:rebuild` で drift 0、CI gate `verify-indexes-up-to-date` で恒久検査 |

## 変更対象ファイル一覧（CONST_005）

| パス | 変更種別 | 備考 |
| --- | --- | --- |
| docs/30-workflows/ut-coverage-2026-05-wave/wave-3-roadmap.md | 新規 | 最終成果物 |
| .claude/skills/aiworkflow-requirements/references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md | 編集 | wave-3 roadmap link 追加 |
| .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | 編集 | active workflow 索引追加 |
| .claude/skills/aiworkflow-requirements/indexes/* | 再生成 | `pnpm indexes:rebuild` |

## 入力 / 出力 / 副作用

- 入力: 元 unassigned-task spec、wave-2 5 タスクの skill-feedback-report / phase-12 implementation-guide
- 出力: `outputs/phase-01/main.md`（要件確定記録）
- 副作用: なし（読み取りのみ）

## artifacts.json metadata

```json
{
  "taskType": "implementation",
  "visualEvidence": "NON_VISUAL",
  "workflow_state": "spec_created"
}
```

## AC（再掲）

index.md AC-1〜AC-5 を本 Phase で確定する。

## テスト方針

NON_VISUAL。要件確定の妥当性は (a) AC-1〜5 と Phase 構成の対応表が漏れなく成立、(b) 元 unassigned-task spec の AC と等価以上、で検証する。

## ローカル実行・検証コマンド

```bash
test -f docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/index.md
test -f docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/artifacts.json
```

## 完了条件 / DoD

- [ ] AC-1〜5 と Phase 構成の対応表が `outputs/phase-01/main.md` に記載されている
- [ ] artifacts.json metadata に `taskType` / `visualEvidence` / `workflow_state` が確定
- [ ] 不変条件 #1〜#7 への影響なし（roadmap markdown は schema を固定しない）と確認
- [ ] 既存 `docs/30-workflows/unassigned-task/ut-web-cov-05-followup-post-wave2-gap-analysis.md` を削除・移動しないことを記録

## 出力

- outputs/phase-01/main.md

## 参照資料

- docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/index.md
- docs/30-workflows/unassigned-task/ut-web-cov-05-followup-post-wave2-gap-analysis.md
- CLAUDE.md

## メタ情報

- Phase: 1
- taskType: implementation
- visualEvidence: NON_VISUAL

## 実行タスク

- AC-1〜AC-5、scope、metadata を確定する。

## 成果物/実行手順

- `outputs/phase-01/main.md` を作成し、AC と Phase 構成の対応を記録する。

## 統合テスト連携

- NON_VISUAL。Phase 11 の runtime evidence で検証する。
