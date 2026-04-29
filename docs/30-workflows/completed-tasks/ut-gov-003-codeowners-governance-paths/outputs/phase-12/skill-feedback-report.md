# Skill feedback report — UT-GOV-003 CODEOWNERS

> **改善点なしでも出力必須**ルール適用。3 観点（task-specification-creator skill / aiworkflow-requirements skill / docs 整備）を必ず記載。

## 観点 1: task-specification-creator skill

| 項目 | 内容 |
| --- | --- |
| 観察 | NON_VISUAL governance タスクで Phase 11 が「実 PR を作らずに smoke コマンド系列を仕様レベル固定する」用途に分岐できた。`phase-template-phase11.md` の docs-only / spec_created 構造と、本タスクのような「実装タスクだが仕様書整備に閉じる」中間ケースの両方が同じテンプレで扱えた。 |
| 改善提案 | 「実装タスクだが本ワークフローでは仕様書整備に閉じる」という中間ケース用の Phase 11 サブテンプレを追加候補。現状は docs-only テンプレを流用しているが、`status: NOT EXECUTED — 実適用 PR で実走` を明示するセクションがテンプレに無いため、各タスクで毎回手書きしている。 |
| 検証コマンド改善 | Phase 11 の `screenshots/` 不在チェック（`test ! -d`）はテンプレに含まれているが、CODEOWNERS 系タスク特有の「`gh api .../codeowners/errors` の期待 JSON `{"errors": []}` が manual-smoke-log.md に明記されているか」の grep 検証は本タスクで独自追加した。governance 系サブテンプレ化候補。 |

## 観点 2: aiworkflow-requirements skill

| 項目 | 内容 |
| --- | --- |
| 観察 | `references/` 配下に governance / branch-protection / CODEOWNERS の section が**現状ない**可能性が高い（UT-GOV-005 で扱われる予定）。本タスクの Step 1-A 判定で「該当なら追記」「該当なしなら申し送り」の二段判定が必要だった。 |
| 改善提案 | `references/governance.md`（仮称）を `references/` に新設し、CODEOWNERS / branch-protection / required status checks をまとめて扱う section を作る案。UT-GOV-005 で実現される見込みのため、本タスクでは申し送りに留める。 |
| keywords 整備 | `keywords.json` に `codeowners` / `governance` / `code-owner-reviews` が登録されていれば、UT-GOV 系タスク間の参照が容易になる。Progressive Disclosure 経路として整備候補（UT-GOV-005 と統合）。 |

## 観点 3: docs 整備（CLAUDE.md / README / docs/）

| 項目 | 内容 |
| --- | --- |
| 観察 | `doc/` `docs/` 表記揺れが本リポジトリで実存し、`docs/00-getting-started-manual/` と `docs/30-workflows/` の 2 系統が**役割が異なる**形で並存している。単純な一括置換は NG であり、本タスクでは実フォルダ rename を保留した。 |
| 改善提案 | `rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git' -g '!.worktrees'` 相当の lint を pre-commit (lefthook) または CI gate に追加し、新規 commit で「`doc/` 始まりのリンク」が再導入されることを未然に防ぐ。ただし実フォルダ `docs/00-getting-started-manual/` への正当な参照を許可する allow-list が必要。 |
| ドキュメント構造改善 | CLAUDE.md「主要ディレクトリ」表に `doc/` `docs/` 2 系統の役割明示行を追加し、新規 contributor が表記揺れと誤認しないようにする案。本 PR の Phase 12 system-spec-update-summary.md §Step 1-B 追記候補 diff として記載済。 |

## サマリー

| 観点 | 改善提案件数 |
| --- | --- |
| task-specification-creator skill | 2 件（中間ケースサブテンプレ / governance 系検証 grep） |
| aiworkflow-requirements skill | 2 件（governance.md 新設 / keywords 整備） |
| docs 整備 | 2 件（`doc/` lint / CLAUDE.md 役割明示） |

> 改善点なしの観点は無し。全 3 観点で改善提案を抽出済み。
