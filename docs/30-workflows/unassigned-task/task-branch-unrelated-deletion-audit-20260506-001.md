# ブランチ混入削除差分の監査と復元判断 - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-branch-unrelated-deletion-audit-20260506-001 |
| タスク名 | ブランチ混入削除差分の監査と復元判断 |
| 分類 | branch hygiene / documentation integrity |
| 対象機能 | 09b-A以外の `docs/30-workflows/` 大量削除差分 |
| 優先度 | 高 |
| 見積もり規模 | 中規模 |
| ステータス | unassigned |
| issue_number | #496 |
| 発見元 | 09b-A close-out branch status verification |
| 発見日 | 2026-05-06 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL（git diff / workflow inventory） |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

09b-A のレビューと改善中に `git status` を確認したところ、09b-Aとは別の workflow root に大量の削除差分が存在していた。対象には `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/` と `docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/` が含まれる。

この削除差分は09b-AのSentry/Slack runtime smoke実装とは独立しており、今回サイクルで勝手に復元または確定削除するとユーザー作業を壊す可能性がある。

### 1.2 問題点・課題

- 09b-Aの差分と無関係な削除が同一ブランチに混在している
- 削除が意図的な完了移動、整理、または事故なのか判定できない
- このままPR化すると、observability smokeのレビューに大量の別件削除が混ざる
- `completed-tasks/` への移動条件を満たした削除なのか、単純な消失なのか追跡が必要

### 1.3 放置した場合の影響

- PR reviewer が09b-Aの本質的差分を確認しづらくなる
- 完了済みworkflowの履歴やPhase evidenceが失われる可能性がある
- 意図しない削除がmainへ入ると、後続タスクやIssue同期の参照が壊れる

---

## 2. 何を達成するか（What）

### 2.1 目的

現在のブランチに混在している09b-A外の削除差分を監査し、削除維持・completed-tasks移動・復元・別ブランチ分離のいずれが正しいかを決定する。

### 2.2 最終ゴール

- 削除対象ディレクトリごとに「意図的削除 / 完了移動漏れ / 誤削除 / 別ブランチ対象」を分類
- 誤削除ならユーザー承認のうえ復元、完了移動漏れなら `completed-tasks/` へ整合的に移動
- 09b-A PRに不要な削除差分を混ぜない方針を確定
- 参照切れがあれば aiworkflow indexes / task-workflow docs を更新

### 2.3 スコープ

#### 含むもの

- `git status --short` / `git diff --name-status` による削除差分一覧化
- 削除対象workflowのPhase-12完了状況確認
- `docs/30-workflows/completed-tasks/` 移動済み重複の確認
- aiworkflow / task index からの参照確認
- ユーザー判断が必要な削除の整理

#### 含まないもの

- ユーザー承認なしの `git checkout --` / `git restore` 実行
- 09b-A runtime smoke route の再設計
- commit / PR / push

### 2.4 成果物

- 削除差分監査レポート
- 必要な復元または移動の実施差分
- 参照切れがあった場合の修正差分

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 作業開始前に最新の `git status --short` を保存する
- 09b-A由来の変更と既存ユーザー変更を混同しない
- 破壊的な復元コマンドはユーザー承認後にのみ実行する

### 3.2 実行手順

1. 削除差分を一覧化する。
   ```bash
   git diff --name-status -- docs/30-workflows | awk '$1 == "D" { print $2 }'
   ```
2. workflow root ごとに集計する。
3. 各workflowについて、`completed-tasks/` 配下の同名ディレクトリ有無を確認する。
4. `rg` で削除対象名への参照を検索する。
5. Phase-12成果物の有無と完了移動条件を確認する。
6. 分類結果をユーザーへ提示し、復元・維持・移動の判断を確定する。
7. 承認済みの範囲だけ復元または移動し、参照切れを更新する。

### 3.3 受入条件 (AC)

- AC-1: 09b-A外の削除差分がworkflow root単位で一覧化されている
- AC-2: 各削除差分に分類と判断根拠がある
- AC-3: 誤削除の可能性があるものはユーザー承認なしに復元・削除確定していない
- AC-4: 参照切れが検出された場合は修正済み、またはユーザー判断待ちとして明記されている
- AC-5: 09b-AのPR差分から別件削除を混ぜない方針が確定している

---

## 4. 苦戦箇所 / 学んだこと

### 4.1 git status のノイズが大きく、09b-Aの完了判定を曇らせた

09b-Aの実装・仕様更新自体は小さく閉じられるが、同一worktreeに別件の大量削除が混在していたため、`git diff --stat` だけではタスク完了状況を誤判定しやすい。workflow root単位で差分を分類する必要がある。

### 4.2 ユーザー変更を勝手に戻せない

削除差分が事故に見えても、ユーザーが意図的に整理している可能性がある。破壊的な復元を自動実行せず、監査タスクとして切り出すのが安全。

### 4.3 完了移動と削除は見た目が似ている

`docs/30-workflows/` 直下から消える点は同じだが、完了移動なら `completed-tasks/` に履歴が残る。単純削除と移動済みを分けて確認しないと、Phase evidence を失う。

---

## 5. リスクと対策

| リスク | 対策 |
| --- | --- |
| ユーザーの意図的削除を復元してしまう | 復元は承認後に限定する |
| 誤削除を見逃す | workflow root単位で削除数と参照を確認する |
| completed-tasks移動済みを誤って二重化する | 同名ディレクトリ存在確認を先に行う |
| 09b-A PRに別件差分が混ざる | PR前に差分をタスク別に分離する |
| 参照切れが残る | `rg` で workflow slug を検索する |

---

## 6. 検証方法

### 6.1 実行コマンド

```bash
git status --short
git diff --name-status -- docs/30-workflows
find docs/30-workflows/completed-tasks -maxdepth 1 -type d | sort
rg -n "ci-test-recovery-coverage-80-2026-05-04|issue-419-pages-project-dormant-delete-after-355" docs .claude
```

### 6.2 期待結果

| 検査項目 | 期待値 |
| --- | --- |
| 削除差分一覧 | workflow root単位で分類済み |
| completed-tasks重複 | 有無が明記済み |
| 参照検索 | 参照切れなし、または修正対象として記録済み |
| 復元/移動 | ユーザー承認済み範囲のみ実施 |

---

## 7. 依存関係

| 種別 | 対象 | 関係性 |
| --- | --- | --- |
| relates-to | 09b-A branch close-out | 09b-A差分から別件削除を分離するための監査 |
| relates-to | task-workflow-active | 削除対象がactive/current扱いなら仕様更新が必要 |
| blocks | clean PR creation | 別件削除を含めるか分離するか決まるまでPR作成判断が曖昧 |
