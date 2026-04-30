# task-utgov001-references-reflect-001

## メタ情報

```yaml
issue_number: 303
task_id: task-utgov001-references-reflect-001
task_name: Reflect UT-GOV-001 second-stage applied branch protection into aiworkflow-requirements
category: 改善
target_feature: GitHub branch protection governance
priority: 高
scale: 小規模
status: 未実施
```

| 項目 | 値 |
| --- | --- |
| タスクID | task-utgov001-references-reflect-001 |
| タスク名 | Reflect UT-GOV-001 second-stage applied branch protection into aiworkflow-requirements |
| 分類 | 改善 |
| 対象機能 | GitHub branch protection governance |
| 発見元 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-12/unassigned-task-detection.md |
| ステータス | 未実施 |
| 優先度 | 高 |
| 見積もり規模 | 小規模 |
| taskType | docs-only / NON_VISUAL |
| 依存 | UT-GOV-001 second-stage reapply Phase 13 applied GET evidence |

## 実装ガイド

### Part 1: 中学生でもわかる説明

なぜ必要か: GitHub に設定された本当のルールと、手元の説明書がずれると、次の人が古い説明書を信じて作業してしまいます。たとえば、学校の校則が変わったのに掲示板が古いままだと、みんなが間違った準備をしてしまいます。

何をするか: Phase 13 で取得した GitHub の実際の設定を見て、aiworkflow-requirements の仕様書と索引に同じ内容を反映します。

### Part 2: 技術者向け

- 入力正本: `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-13/branch-protection-applied-{dev,main}.json`
- 反映候補: `.claude/skills/aiworkflow-requirements/references/`、`indexes/resource-map.md`、`indexes/quick-reference.md`、`references/task-workflow-active.md`
- 禁止: Phase 13 evidence がない状態で expected contexts から推測反映しない
- 完了時: `system-spec-update-summary.md` 相当の記録を本タスク成果物に残し、GitHub GET 由来であることを明記する

## 苦戦箇所【記入必須】

- 対象: `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-12/system-spec-update-summary.md`
- 症状: Phase 12 時点では実 PUT が未承認のため、aiworkflow-requirements に final applied state を書くと推測記録になる。`expected-contexts-{dev,main}.json` と `applied-{dev,main}.json` の責務を分けないと正本が曖昧になる。
- 参照: `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-12/implementation-guide.md`

## スコープ

### 含む

- Phase 13 の `branch-protection-applied-{dev,main}.json` を正本入力として読む
- `.claude/skills/aiworkflow-requirements/references/` の最適な仕様へ dev / main branch protection final state を反映する
- indexes / quick-reference / resource-map / task-workflow-active を必要に応じて同期する
- 反映元が GitHub GET evidence であることを変更履歴に明記する

### 含まない

- GitHub branch protection PUT
- commit / push / PR の自動実行
- Phase 13 applied evidence がない状態での推測反映

## リスクと対策

| リスク | 対策 |
| --- | --- |
| expected contexts を final applied state と誤認する | `branch-protection-applied-{dev,main}.json` の存在と `required_status_checks.contexts` を先に検証する |
| `.claude` 正本と `.agents` mirror がドリフトする | 正本更新後に mirror 方針を確認し、必要な同期対象を changelog に列挙する |
| resource-map / quick-reference の索引漏れ | `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` を実行し、差分を確認する |

## 検証方法

```bash
jq '.required_status_checks.contexts | sort' docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-13/branch-protection-applied-dev.json
jq '.required_status_checks.contexts | sort' docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-13/branch-protection-applied-main.json
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js
rg -n "UT-GOV-001|branch protection|contexts" .claude/skills/aiworkflow-requirements/references .claude/skills/aiworkflow-requirements/indexes
```

期待: references と indexes が同じ final state を指し、task-workflow-active と矛盾しない。

## 完了条件

- GitHub GET evidence 由来の contexts と six-value governance check が仕様書に反映されている
- 反映先と task-workflow-active / resource-map の参照が矛盾しない

## 1. なぜこのタスクが必要か（Why）

Phase 13 applied GET evidence が出る前に final state を書くと推測反映になるため。

## 2. 何を達成するか（What）

GitHub GET 由来の branch protection final state を aiworkflow-requirements に反映する。

## 3. どのように実行するか（How）

applied JSON を読み、contexts と six-value governance check を references / indexes へ同期する。

## 4. 実行手順

Phase 13 evidence 確認、反映先選定、仕様更新、index 再生成、mirror diff の順で実行する。

## 5. 完了条件チェックリスト

- [ ] applied GET evidence が存在する
- [ ] references と indexes が同期済み

## 6. 検証方法

上記 `## 検証方法` の jq / generate-index / rg を実行する。

## 7. リスクと対策

上記 `## リスクと対策` の表を適用する。

## 8. 参照情報

- `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/`

## 9. 備考

commit / push / PR はユーザー指示があるまで実行しない。
