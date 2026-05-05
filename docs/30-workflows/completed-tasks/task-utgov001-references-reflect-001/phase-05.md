# Phase 5: 仕様反映実行

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-utgov001-references-reflect-001 |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 仕様反映実行 |
| 作成日 | 2026-05-01 |
| 前 Phase | 4 |
| 次 Phase | 6 |
| 状態 | spec_created |

## 目的

fresh GET evidence に基づき、aiworkflow-requirements へ branch protection final state を反映する手順を定義する。

## 実行タスク

1. fresh GET evidence を取得し、placeholderを置き換える。
2. `deployment-branch-strategy.md` の current applied / pending apply 表現を整理する。
3. `quick-reference.md` / `resource-map.md` / `task-workflow-active.md` を同期する。
4. `.agents` mirror 方針を確認し、同期対象か対象外かを `outputs/phase-05/update-runbook.md` に明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 4 | phase-04.md | 検証コマンド |
| 正本 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | 更新対象 |
| 索引 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | 更新対象 |
| 索引 | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | 更新対象 |

## 実行手順

### ステップ 1: Fresh GET

`gh api` で dev/main の branch protection を取得し、`outputs/phase-13/branch-protection-applied-{dev,main}.json` に保存する。保存後、`required_status_checks.contexts` と6軸状態を `outputs/phase-05/current-facts.md` に転記する。

### ステップ 2: 正本更新

`deployment-branch-strategy.md` は current applied と draft/pending を分離する。GitHub GET で得られた実値が期待3 contextsと違う場合、期待値ではなく実値を current facts に書く。

### ステップ 3: 索引同期

`quick-reference.md` と `resource-map.md` は、反映先と evidence path を同じ表現に揃える。Issue #303は `Refs #303` として記録する。

## 統合テスト連携

Phase 6で異常系、Phase 9で全コマンド再実行を行う。

## 多角的チェック観点

- `expected-contexts-*` 由来の値を current applied に混入させない。
- `enforce_admins`、required status checks、pull request review、restrictions、linear history、force push の6軸がGitHub実値と違う場合、差分として明示する。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | fresh GET取得 | pending |
| 2 | references更新 | pending |
| 3 | indexes更新 | pending |
| 4 | mirror確認 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/update-runbook.md | 実行手順 |
| ドキュメント | outputs/phase-05/current-facts.md | GitHub GET 実値 |

## 完了条件

- [ ] fresh GET evidence が保存されている
- [ ] current facts と期待値の差分が記録されている
- [ ] aiworkflow-requirements更新対象が実更新されている
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] `outputs/phase-05/update-runbook.md` を作成
- [ ] `artifacts.json` の Phase 5 状態を更新

## 次Phase

Phase 6: 異常系検証
