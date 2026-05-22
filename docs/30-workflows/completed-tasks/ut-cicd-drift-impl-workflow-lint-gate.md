# UT-CICD-DRIFT-IMPL-WORKFLOW-LINT-GATE

```yaml
issue_number: 290
task_id: UT-CICD-DRIFT-IMPL-WORKFLOW-LINT-GATE
task_name: Workflow lint gate with actionlint and yamllint
category: 改善
target_feature: GitHub Actions workflow validation
priority: 中
scale: 小規模
status: consumed
source_phase: UT-CICD-DRIFT Phase 12
created_date: 2026-04-29
dependencies: [#58]
canonical_workflow: docs/30-workflows/issue-290-workflow-lint-gate/
consumed_by: docs/30-workflows/issue-290-workflow-lint-gate/
consumed_date: 2026-05-17
```

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | UT-CICD-DRIFT-IMPL-WORKFLOW-LINT-GATE |
| 親タスク | UT-CICD-DRIFT |
| 起源 drift | Phase 11 / 12 review: `yamllint` / `actionlint` 未導入 |
| workflow_state | implemented_local_evidence_captured |
| 優先度 | MEDIUM |
| 分類 | impl-required（workflow lint gate 導入） |
| 起票日 | 2026-04-29 |

## 親タスク背景

UT-CICD-DRIFT の Phase 11 では `yamllint` / `actionlint` がローカル未導入で N/A となった。docs-only smoke としては許容したが、workflow topology drift の再発防止には YAML / GitHub Actions 構文を CI で検査する gate が必要。

## 1. なぜこのタスクが必要か（Why）

手動列挙の workflow lint は、新規 workflow 追加時に対象漏れを起こす。UT-CICD-DRIFT Phase 11/12 では `actionlint` / `yamllint` が N/A 扱いになり、workflow topology drift を構造的に止める gate が不足していた。

## 2. 何を達成するか（What）

`.github/workflows/*.yml` 全件を actionlint で検査し、ローカル再現コマンド、yamllint 採否記録、復旧 runbook、aiworkflow 正本同期を同一 wave で揃える。

## 3. どのように実行するか（How）

既存 `workflow-shell-lint` job を拡張し、`package.json#observation:lint` を同じ actionlint version / glob scope に同期する。yamllint は不採用 decision として記録し、GitHub Actions runtime evidence は Phase 13 user gate に残す。

## 範囲

1. `.github/workflows/*.yml` を対象に `actionlint` を実行する CI gate または既存 workflow job を追加する。
2. `yamllint` 採用可否を判断し、採用時は workflow YAML 用の最小ルールを固定する。
3. ローカル復旧手順を `deployment-gha.md` または workflow runbook に記録する。

## 不変条件 reaffirmation

| # | 不変条件 | 適用 |
| --- | --- | --- |
| #5 / #6 | 影響なし | workflow 構文検査のみ |

## 4. 実行手順

1. `.github/workflows/ci.yml` の actionlint download を `1.7.7` 固定にする。
2. `workflow-shell-lint` の actionlint 対象を `.github/workflows/*.yml` にする。
3. `package.json#observation:lint` を同じ version / glob scope にする。
4. 全件 actionlint で露出した既存 workflow shellcheck 指摘を最小修正する。
5. runbook、yamllint decision、Phase 11/12 evidence、aiworkflow 正本を同一 wave で更新する。

## 受入条件

- [x] AC-1: PR で `.github/workflows/*.yml` の構文検査が実行される
- [x] AC-2: `actionlint` 未導入環境でも CI 上で検査結果を確認できる
- [x] AC-3: `yamllint` を採用しない場合は理由が記録される

Close-out: `docs/30-workflows/issue-290-workflow-lint-gate/` が canonical workflow。GitHub Actions runtime evidence、commit、push、PR は Phase 13 user gate として残る。

## 5. 完了条件チェックリスト

- [x] `.github/workflows/ci.yml` が actionlint `1.7.7` + `.github/workflows/*.yml` を使う
- [x] `pnpm observation:lint` が同じ version / glob scope を使う
- [x] `docs/30-workflows/runbooks/workflow-lint-local-recovery.md` が存在する
- [x] `outputs/phase-02/yamllint-decision.md` が存在する
- [x] source task が consumed trace と canonical workflow pointer を持つ

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

## 6. 検証方法

```bash
pnpm observation:lint
node .claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js --workflow docs/30-workflows/issue-290-workflow-lint-gate --check-existence
node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/30-workflows/issue-290-workflow-lint-gate
node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js --target-file docs/30-workflows/unassigned-task/ut-cicd-drift-impl-workflow-lint-gate.md --json
```

期待: 全て exit 0。GitHub Actions runtime evidence は Phase 13 user gate。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| `.yaml` workflow が将来追加されても `.yml` glob に入らない | 現状 `.yaml` は 0 件。追加時は AC と glob を同一 wave で更新する |
| branch protection required context を無承認で変更する | 今回は mutation しない。Phase 13 user gate に残す |
| yamllint 導入が GitHub Actions 表現でノイズを増やす | actionlint を primary gate とし、yamllint は不採用 decision に固定する |

## スコープ

### 含む

- `.github/workflows/ci.yml` の既存 `workflow-shell-lint` job を actionlint `1.7.7` + `.github/workflows/*.yml` に拡張する。
- `package.json` の `pnpm observation:lint` を同じ version / glob scope に同期する。
- `docs/30-workflows/runbooks/workflow-lint-local-recovery.md` と `outputs/phase-02/yamllint-decision.md` を canonical evidence として残す。

### 含まない

- branch protection required context 変更。ユーザー承認後の別 governance operation として扱う。
- GitHub Actions runtime evidence の取得。commit / push / PR が必要なため Phase 13 user gate。
- deploy target 変更、Discord 通知実装。

| 含む | 含まない |
| --- | --- |
| workflow lint gate、ローカル復旧手順、採否記録 | deploy target 変更、branch protection の直接適用、Discord 通知実装 |

## 委譲先 / 関連

- 関連: UT-CICD-DRIFT (親)
- 関連: UT-GOV-001（required status checks へ採用する場合に同期）
- Canonical workflow: `docs/30-workflows/issue-290-workflow-lint-gate/`
- 消費状態: Issue #290 workflow lint gate として同一 wave で仕様・実装・evidence・aiworkflow 正本へ昇格済み。commit / push / PR と GitHub Actions runtime evidence は user approval 後。

## 8. 参照情報

- `docs/30-workflows/issue-290-workflow-lint-gate/`
- `docs/30-workflows/runbooks/workflow-lint-local-recovery.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-290-workflow-lint-gate-2026-05.md`

## 9. 備考

この未タスクは Issue #290 workflow lint gate として consumed。ファイルは履歴 trace として `unassigned-task/` に残し、Phase 13 の commit / push / PR はユーザー承認後に行う。
