# U-LFT-07 既存 worktree 一括 reinstall の運用化 - タスク指示書

## メタ情報

| 項目         | 内容                                                                |
| ------------ | ------------------------------------------------------------------- |
| タスクID     | U-LFT-07                                                            |
| タスク名     | 既存 worktree 一括 reinstall の運用化（責任者・記録管理・通知連携） |
| 分類         | 運用 / SOP 整備                                                     |
| 対象機能     | `scripts/reinstall-lefthook-all-worktrees.sh` / lefthook 運用       |
| 優先度       | 中 (MEDIUM)                                                         |
| 見積もり規模 | 小規模                                                              |
| ステータス   | 未実施                                                              |
| 発見元       | task-git-hooks-lefthook-and-post-merge lessons B-1                  |
| 発見日       | 2026-04-28                                                          |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`scripts/reinstall-lefthook-all-worktrees.sh` は実装済みだが、`lefthook.yml` / `package.json` の `prepare` script を変更した際に「誰が・いつ・どの worktree に」reinstall を実施したかの運用が未定義。lessons B-1 で運用化が申し送られている。

### 1.2 問題点・課題

- 実行責任者ローテーションが未定義のため、変更後の reinstall が抜ける可能性がある。
- 実行記録の中央台帳がないため、worktree 間の hook 同期状態が確認できない。
- 通知連携（Slack / Issue 等）が無く、変更告知が周知されない。

### 1.3 放置した場合の影響

- 一部 worktree のみ古い hook で動作し、commit ブロック有無の差分が発生する。
- main 直 commit ブロック等のセキュリティ系 hook が一部 worktree で抜けるリスク。

---

## 2. 何を達成するか（What）

### 2.1 目的

`reinstall-lefthook-all-worktrees.sh` をトリガとする SOP（実行責任者・実行記録・通知）を文書化し、lefthook.yml / prepare 変更時に確実に reinstall が完了する状態にする。

### 2.2 最終ゴール

- 実行 SOP（手順 / 責任者 / 記録方法 / 通知方法）が文書化されている。
- 変更時のチェックリストに reinstall 実行が組み込まれている。

### 2.3 スコープ

#### 含むもの

- 実行責任者（solo 開発につき本人 1 ローテだが、明文化）
- 実行記録の保存先決定（runbook 追記 / Issue ラベル等）
- 通知連携の運用設計（必要最低限）
- `lefthook.yml` / `package.json#prepare` 変更時のチェックリスト

#### 含まないもの

- スクリプト実装変更（既に存在）
- 自動化（CI 化はスコープ外、必要なら別タスク）

### 2.4 成果物

- `doc/00-getting-started-manual/lefthook-operations.md` への SOP 追記、または専用 runbook

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `scripts/reinstall-lefthook-all-worktrees.sh` が動作する
- `doc/00-getting-started-manual/lefthook-operations.md` が存在する

### 3.2 依存タスク

- なし

### 3.3 推奨アプローチ

1. 既存 runbook にセクション追加（実行 SOP / 記録 / 通知）。
2. `lefthook.yml` / `package.json#prepare` 変更時のチェックリストを CONTRIBUTING 相当箇所に追記。
3. 実行記録のテンプレ（日時 / 対象 worktree 数 / 結果）を提示。

---

## 4. 完了条件

- [ ] SOP が runbook に追記されている
- [ ] 実行責任者・記録方法・通知方法が明記されている
- [ ] lefthook.yml / prepare 変更時のチェックリストが整備されている

---

## 5. 関連仕様書リンク

- `scripts/reinstall-lefthook-all-worktrees.sh`
- `doc/00-getting-started-manual/lefthook-operations.md`
- `docs/30-workflows/completed-tasks/task-lefthook-multi-worktree-reinstall-runbook.md`
- task-git-hooks-lefthook-and-post-merge lessons B-1

---

## 6. 引き継ぎ先

lefthook 運用ドキュメント保守の継続タスクとして取り込み。
