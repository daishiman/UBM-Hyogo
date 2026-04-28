# tmux 設定テンプレートの配布手段確定 - タスク指示書

## メタ情報

```yaml
issue_number: 136
```


## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | ut-worktree-004-tmux-config-distribution                                      |
| タスク名     | tmux 設定テンプレートの配布手段確定                                           |
| 分類         | ドキュメント                                                                  |
| 対象機能     | worktree ごとの tmux 環境分離（個人 `~/.tmux.conf` 連携）                     |
| 優先度       | 低                                                                            |
| 見積もり規模 | 小規模                                                                        |
| ステータス   | 未実施                                                                        |
| 発見元       | task-worktree-environment-isolation Phase 2 §2.3                              |
| 発見日       | 2026-04-28                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

task-worktree-environment-isolation Phase 2 §2.3 において、tmux サーバー単位で共有される global 環境変数と `update-environment` の挙動が、worktree 間の環境差リーク（`UBM_WT_*` の混入や `SSH_AUTH_SOCK` 以外の変数が新セッションへ伝播する事象）の主因であることが特定された。これに対する設計上の対策として「`update-environment` を最小化する」スニペットおよび `tmux new-session -e ...` で per-session env を注入するラッパーが提示されている。

しかし `~/.tmux.conf` は開発者個人ファイルでありリポジトリ管理外であるため、該当スニペットを「どう各開発者の手元に届けるか」という配布手段が未確定のまま残っている。Phase 12 の unassigned-task-detection.md §1.4 (UT-D) にて、この配布手段確定が独立タスクとして識別された。

### 1.2 問題点・課題

- `~/.tmux.conf` がリポジトリ管理外のため、Phase 2 §2.3 の `set-option -g update-environment "SSH_AUTH_SOCK SSH_CONNECTION DISPLAY"` スニペットを開発者へ伝達する経路が無い
- 配布手段の選択肢（dotfiles リポジトリ誘導 / docs テンプレ提示のみ / setup スクリプト提供）について判断基準が文書化されていない
- 結果として worktree 切替時に tmux global env からの変数リークが残存する可能性がある
- AI エージェントが「個人設定ファイルへの依存」を勝手に強制セットアップへ昇格させるリスクがある

### 1.3 放置した場合の影響

- worktree 並列作業時の環境変数混線が tmux 経由で再発する
- Phase 2 §2.3 の検証コマンド（`tmux show-environment -g | grep '^UBM_WT_'` が空）が成立しないユーザーが残る
- 個人設定ファイルに対する方針が曖昧なまま、他の個人設定（zsh, vim 等）でも同じ判断ミスを繰り返す

---

## 2. 何を達成するか（What）

### 2.1 目的

`~/.tmux.conf` への配布手段（dotfiles 誘導 / docs テンプレ提示のみ / setup スクリプト提供）の方針を確定し、Phase 2 §2.3 のスニペットを正本ドキュメントに「opt-in でコピー可能なテンプレ」として掲載する。

### 2.2 最終ゴール

- 配布手段の方針が docs に明記されている（採用方針 + 不採用案の根拠）
- `update-environment` 最小化スニペットが `CLAUDE.md` または `docs/00-getting-started-manual/` 配下にコピー可能な形で掲載されている
- `tmux new-session -e ...` ラッパーの利用例が同所に掲載されている
- 「個人設定ファイル依存はテンプレ提供 + opt-in を原則化」が方針として記載されている

### 2.3 スコープ

#### 含むもの

- 配布手段 3 案（dotfiles / docs テンプレ / setup スクリプト）の比較と選定
- 採用方針の docs 化（`CLAUDE.md` または `docs/00-getting-started-manual/` 配下）
- `update-environment` 最小化スニペットの掲載
- per-session env 注入ラッパー（`tmux new-session -e ...`）の利用例掲載
- opt-in 原則の明記

#### 含まないもの

- `scripts/new-worktree.sh` 本体への tmux 統合実装（UT-B 担当）
- dotfiles リポジトリそのものの新規作成
- 自動セットアップスクリプトの実装（採用された場合でも別タスク化）
- zsh / vim 等他の個人設定ファイルへの方針拡張

### 2.4 成果物

- `CLAUDE.md` または `docs/00-getting-started-manual/` 配下の追記差分
- 配布手段選定根拠を含む短い決定記録
- スニペットコピー後の検証コマンド（Phase 2 §2.3 の `tmux show-environment` 系）の掲載

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Phase 2 §2.3 設計が確定済み（本タスク開始時点で確定）
- `update-environment` 最小化スニペットの内容が design.md §2.3 に存在する

### 3.2 依存タスク

- task-worktree-environment-isolation Phase 2 完了（前提）
- UT-B（`scripts/new-worktree.sh` 改修）とは独立。先後関係なし

### 3.3 必要な知識

- tmux の `update-environment` / `set-option -g` / `new-session -e` セマンティクス
- 個人設定ファイルとリポジトリ管理ファイルの境界
- opt-in / opt-out の文書化原則

### 3.4 推奨アプローチ

3 案を比較表で提示し、最小コストで「再発防止」と「個人設定への非侵襲」の両立が可能な「docs テンプレ提示のみ + opt-in」を初手として採用する。dotfiles 誘導は将来オプションとして残し、setup スクリプトは個人設定書き換えを伴うため非採用根拠を明記する。

---

## 4. 実行手順

### Phase構成

1. 配布手段 3 案の比較
2. 採用方針の決定
3. テンプレスニペットの docs 掲載
4. 検証コマンド掲載と相互参照

### Phase 1: 配布手段 3 案の比較

#### 目的

dotfiles 誘導 / docs テンプレ提示のみ / setup スクリプトの 3 案を比較し、コスト・侵襲性・opt-in 適合度を評価する。

#### 手順

1. 各案について「導入コスト」「個人設定への侵襲度」「opt-in 適合度」「配布精度」を表で整理
2. 不採用案には不採用根拠を明記

#### 成果物

3 案比較表

#### 完了条件

3 案について評価軸 4 つすべてに記載がある

### Phase 2: 採用方針の決定

#### 目的

採用案を 1 つに確定する。

#### 手順

1. Phase 1 の比較表をもとに採用案を選定
2. 「個人設定ファイルへの依存はテンプレ提供 + opt-in を原則化」を方針として明文化
3. 不採用案の今後の扱い（保留 / 却下）を記述

#### 成果物

採用方針記述

#### 完了条件

採用案が 1 つ確定し、不採用案の扱いが明記されている

### Phase 3: テンプレスニペットの docs 掲載

#### 目的

Phase 2 §2.3 のスニペットをコピー可能な形で正本に掲載する。

#### 手順

1. 掲載先を `CLAUDE.md` か `docs/00-getting-started-manual/` のいずれかに確定
2. `set-option -g update-environment "SSH_AUTH_SOCK SSH_CONNECTION DISPLAY"` を fenced code block で掲載
3. `tmux new-session -e UBM_WT_PATH=... -e UBM_WT_BRANCH=... -e UBM_WT_SESSION=...` の利用例を併記
4. 「opt-in」であることと、適用しない場合の挙動（global env リーク残存）を明記

#### 成果物

docs 追記差分

#### 完了条件

スニペットが fenced code block でコピー可能、opt-in 注記あり

### Phase 4: 検証コマンド掲載と相互参照

#### 目的

スニペット適用後の検証手段を docs 利用者が単独で実行できるようにする。

#### 手順

1. `tmux show-environment -g | grep -E '^UBM_WT_' | wc -l` が `0` になることを掲載
2. `tmux show-environment -t ubm-<slug> | grep -E '^UBM_WT_' | wc -l` が `3` になることを掲載
3. Phase 2 §2.3（design.md）への相互リンクを記載

#### 成果物

検証コマンド節

#### 完了条件

利用者が docs のみで検証完了できる

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] 配布手段 3 案の比較が docs に存在する
- [ ] 採用方針が 1 案に確定し、不採用案の根拠が記載されている
- [ ] `update-environment` 最小化スニペットが `CLAUDE.md` または `docs/00-getting-started-manual/` に掲載されている
- [ ] `tmux new-session -e ...` 利用例が掲載されている
- [ ] opt-in 原則と「個人設定ファイル依存はテンプレ + opt-in」方針が明記されている

### 品質要件

- [ ] markdown lint がエラー無し（プロジェクトの慣例に準拠）
- [ ] スニペットがコピー後そのまま `~/.tmux.conf` に貼れる形式（不要な装飾なし）

### ドキュメント要件

- [ ] design.md §2.3 への相互リンクあり
- [ ] Phase 12 unassigned-task-detection.md §1.4 (UT-D) との対応が明記されている

---

## 6. 検証方法

### テストケース

- スニペット未適用の場合、`tmux show-environment -g | grep '^UBM_WT_'` に出力が残ること（負例）
- スニペット適用 + ラッパー利用後、global は空、session 側に 3 件入ること（正例）

### 検証手順

```bash
# 適用前
tmux show-environment -g | grep -E '^UBM_WT_' | wc -l

# ~/.tmux.conf にスニペットを追記し tmux kill-server 後
tmux show-environment -g | grep -E '^UBM_WT_' | wc -l    # 期待: 0
tmux show-environment -t ubm-<slug> | grep -E '^UBM_WT_' | wc -l   # 期待: 3
```

---

## 7. リスクと対策

| リスク                                                                 | 影響度 | 発生確率 | 対策                                                                            |
| ---------------------------------------------------------------------- | ------ | -------- | ------------------------------------------------------------------------------- |
| docs テンプレのみだと開発者が適用し忘れる                              | 中     | 中       | 適用しない場合の挙動と検証コマンドを併記し、opt-in 判断材料を充実させる         |
| 将来「自動セットアップしてほしい」要求が出て setup スクリプト案が再燃 | 低     | 中       | Phase 1 の比較表に不採用根拠を残し、再評価時の論点を docs 化                    |
| AI エージェントが個人設定ファイルを勝手に書き換える                    | 高     | 低       | 「個人設定ファイル依存はテンプレ提供 + opt-in を原則化」を方針として明記する    |
| dotfiles 案採用時にリポジトリが新規必要となり配布が重くなる            | 中     | 低       | 初手は docs テンプレ案、dotfiles は将来オプションとして保留                     |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/task-worktree-environment-isolation/outputs/phase-12/unassigned-task-detection.md` §1.4 UT-D
- `docs/30-workflows/task-worktree-environment-isolation/outputs/phase-2/design.md` §2.3（tmux session-scoped state）
- `CLAUDE.md`（掲載先候補）
- `docs/00-getting-started-manual/`（掲載先候補）

### 参考資料

- tmux man page: `update-environment`, `new-session -e`
- task-claude-code-permissions-decisive-mode（担当先候補：dev-environment 派生）

---

## 9. 備考

### 苦戦箇所【記入必須】

> task-worktree-environment-isolation 実行中に気づいた具体的困難点を記録する。

| 項目     | 内容                                                                                                                                                  |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | tmux 設定差分の伝達手段が不明確で、worktree 切替時の環境差（global env からの `UBM_WT_*` リーク）が残った                                             |
| 原因     | `~/.tmux.conf` が個人ファイルでリポジトリ管理外のため、Phase 2 §2.3 のスニペットを開発者へ届ける配布手段の方針が未決定だった                          |
| 対応     | 本タスクのスコープは設定スニペットの docs 化のみとし、配布手段（dotfiles / docs / setup スクリプト）の確定は本タスクで方針決定までに留める            |
| 再発防止 | 個人設定ファイルへの依存はテンプレ提供 + opt-in を原則化し、`CLAUDE.md` または `docs/00-getting-started-manual/` で正本化する                         |

### レビュー指摘の原文（該当する場合）

```
Phase 12 unassigned-task-detection.md §1.4 UT-D:
「~/.tmux.conf は開発者個人ファイルでありリポジトリ管理外。配布手段
（dotfiles リポジトリへの誘導 / docs テンプレ提示のみ等）を別途決定する必要がある」
推奨実装概要: update-environment 最小化スニペットを CLAUDE.md または
docs/00-getting-started-manual/ にテンプレ掲載
```

### 補足事項

担当先候補は `task-claude-code-permissions-decisive-mode` 内の dev-environment 派生 もしくは新規タスクとして起票する。本タスクは docs-only であり、`scripts/new-worktree.sh` 本体の tmux 統合（UT-B）とは独立して進められる。dotfiles リポジトリ案は初手では採用しないが、将来 dev 環境テンプレ群が増えた段階で再評価する余地を残す。
