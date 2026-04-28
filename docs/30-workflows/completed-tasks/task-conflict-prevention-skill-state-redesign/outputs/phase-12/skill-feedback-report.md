# Skill Feedback Report

本タスクで使用した skill (task-specification-creator / aiworkflow-requirements) について、
ドッグフーディングの観点で観測された課題と改善提案を記録する。

## 使用 skill

| skill | 用途 |
| --- | --- |
| task-specification-creator | 13 phase 仕様書テンプレ・index 構造・artifacts.json 規約 |
| aiworkflow-requirements | 既存仕様参照・LOGS / SKILL の正本ルール |

## 観測された課題

### 課題 1: SKILL.md 自体の肥大化（ドッグフーディング案件）

- `task-specification-creator/SKILL.md` は本タスクの A-3（Progressive Disclosure）対象そのもの
- skill 自身が 200 行を超える状態で「200 行未満を推奨」しているのは矛盾
- 並列改修時に局所的衝突が発生する hot spot

### 課題 2: changelog が append-only で衝突源

- `task-specification-creator/SKILL-changelog.md` も `aiworkflow-requirements/LOGS.md` と同様
- 各 worktree が末尾に追記 → 3-way merge で衝突
- 本タスクの A-2 fragment 化対象に **skill 自身も含めるべき**

### 課題 3: LOGS が共有 ledger

- `aiworkflow-requirements/LOGS.md` は複数の skill 利用者が同時追記する典型的衝突源
- skill 利用ガイド側も「fragment で書く」ことを規約化すべき

## 改善提案

| # | 提案 | 適用先 | 関連施策 |
| --- | --- | --- | --- |
| F-1 | `task-specification-creator/SKILL.md` を A-3 ルールに従い分割 | skill 自身 | A-3 |
| F-2 | `task-specification-creator/SKILL-changelog.md` を fragment 化 | skill 自身 | A-2 |
| F-3 | `aiworkflow-requirements/LOGS.md` を fragment 化（最優先） | skill 自身 | A-2 |
| F-4 | `indexes/keywords.json` 等を `.gitignore` 化、hook で再生成 | skill 自身 | A-1 |
| F-5 | skill 改修ガイドに「fragment で書け」「200 行を超えたら分割」を明記 | SKILL.md / references | A-2 / A-3 |

## 推奨アクション

- 本タスクの A-1〜B-1 実装タスク（`unassigned-task-detection.md` T-1〜T-4）の **対象に skill 自身を含める**
- skill 自身に施策を適用することで、今後の skill 改修 PR の衝突率が定量的に下がるか観測
- 観測指標: 「PR レビュー時の merge conflict 発生率」（A-1〜B-1 適用前後 30 日比較）

## 結論

改善点 5 件（F-1〜F-5）。いずれも本タスクの 4 施策を skill 自身にも適用することで解消可能。
独立した skill 改修タスクは起票せず、T-1〜T-4 のスコープに含める方針で進める。
