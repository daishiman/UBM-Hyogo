# UT-CICD-DRIFT-IMPL-WORKFLOW-LINT-GATE

```yaml
issue_number: 290
task_id: UT-CICD-DRIFT-IMPL-WORKFLOW-LINT-GATE
task_name: Workflow lint gate with actionlint and yamllint
category: 改善
target_feature: GitHub Actions workflow validation
priority: 中
scale: 小規模
status: 未実施
source_phase: UT-CICD-DRIFT Phase 12
created_date: 2026-04-29
dependencies: [#58]
```

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | UT-CICD-DRIFT-IMPL-WORKFLOW-LINT-GATE |
| 親タスク | UT-CICD-DRIFT |
| 起源 drift | Phase 11 / 12 review: `yamllint` / `actionlint` 未導入 |
| workflow_state | spec_created |
| 優先度 | MEDIUM |
| 分類 | impl-required（workflow lint gate 導入） |
| 起票日 | 2026-04-29 |

## 親タスク背景

UT-CICD-DRIFT の Phase 11 では `yamllint` / `actionlint` がローカル未導入で N/A となった。docs-only smoke としては許容したが、workflow topology drift の再発防止には YAML / GitHub Actions 構文を CI で検査する gate が必要。

## 範囲

1. `.github/workflows/*.yml` を対象に `actionlint` を実行する CI gate または既存 workflow job を追加する。
2. `yamllint` 採用可否を判断し、採用時は workflow YAML 用の最小ルールを固定する。
3. ローカル復旧手順を `deployment-gha.md` または workflow runbook に記録する。

## 不変条件 reaffirmation

| # | 不変条件 | 適用 |
| --- | --- | --- |
| #5 / #6 | 影響なし | workflow 構文検査のみ |

## 受入条件

- [ ] AC-1: PR で `.github/workflows/*.yml` の構文検査が実行される
- [ ] AC-2: `actionlint` 未導入環境でも CI 上で検査結果を確認できる
- [ ] AC-3: `yamllint` を採用しない場合は理由が記録される

## 苦戦箇所【記入必須】

- `actionlint` は GitHub Actions 固有の文脈を検査できる一方、ローカル導入状況に依存すると Phase 11 のように N/A になりやすい。
- `yamllint` は一般 YAML として有用だが、GitHub Actions 独自表現と衝突する可能性がある。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| workflow YAML の構文事故がレビューでしか検出されない | CI gate に `actionlint` を追加し、PR で必ず検出する |
| `yamllint` の過剰ルールで既存 workflow がノイズだらけになる | 最小ルールから開始し、採用しない場合は `actionlint` を primary gate とする |

## 検証方法

- `actionlint .github/workflows/*.yml`
- `yamllint .github/workflows/`（採用時）
- `rg -n "actionlint|yamllint|workflow lint" .github/workflows .claude/skills/aiworkflow-requirements docs/30-workflows`

## スコープ（含む/含まない）

| 含む | 含まない |
| --- | --- |
| workflow lint gate、ローカル復旧手順、採否記録 | deploy target 変更、branch protection の直接適用、Discord 通知実装 |

## 委譲先 / 関連

- 関連: UT-CICD-DRIFT (親)
- 関連: UT-GOV-001（required status checks へ採用する場合に同期）
