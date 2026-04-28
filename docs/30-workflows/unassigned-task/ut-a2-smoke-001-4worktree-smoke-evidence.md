# 4 worktree smoke 実機検証 - タスク指示書

## メタ情報

```yaml
issue_number: 162
```


## メタ情報

| 項目         | 内容                                              |
| ------------ | ------------------------------------------------- |
| タスクID     | ut-a2-smoke-001                                   |
| タスク名     | 4 worktree smoke 実機検証                         |
| 分類         | 検証                                              |
| 対象機能     | skill ledger A-2 fragment 化（aiworkflow-requirements / automation-30 / github-issue-manager / int-test-skill 等） |
| 優先度       | 中                                                |
| 見積もり規模 | 小規模                                            |
| ステータス   | 未実施                                            |
| 発見元       | task-skill-ledger-a2-fragment Phase 11 / Phase 12 |
| 発見日       | 2026-04-28                                        |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

skill ledger A-2 fragment 化の主目的は「4 worktree から並列に LOGS / changelog / lessons-learned へ追記しても同一バイト位置 conflict を 0 件にする」ことである。task-skill-ledger-a2-fragment Phase 11 までで fragment 化スクリプトと証跡フォーマットの固定までは完了しているが、実 worktree を 4 本起こして main へ順次 merge する smoke は未実施のまま残っている。

### 1.2 問題点・課題

- 単体テストでは worktree 環境特有の path / merge 挙動（`.git/worktrees/` 配下の HEAD 解決、index 競合、mtime 解釈差）を再現できない
- fragment ファイル名は理論上一意でも、実際の `git merge` で同一ディレクトリ内 add/add conflict が起きないかは実機でしか確認できない
- `pnpm skill:logs:render` が 4 entry を timestamp 降順で正しく並べるかも実機検証が必要

### 1.3 放置した場合の影響

- 並列開発時に skill ledger の追記が conflict し、本来の目的（並列追記安全性）が達成されないまま運用が始まる
- 後発タスクで fragment 設計の前提が壊れていることが事故的に発見され、ロールバックコストが増大する
- A-2 の成果物としての完結性が証跡上担保されない

---

## 2. 何を達成するか（What）

### 2.1 目的

4 本の smoke worktree から fragment を生成して main へ順次 merge し、conflict 0 件と render 結果の正しさを実機で証跡として残す。

### 2.2 最終ゴール

- smoke worktree 4 本（feat/smoke-a2-1 〜 feat/smoke-a2-4）が作成され、各 worktree から fragment が生成される
- 4 本を main へ順次 merge した結果、`git ls-files --unmerged` が 0 行
- `pnpm skill:logs:render --skill aiworkflow-requirements` が 4 entry を timestamp 降順で表示する
- 証跡が `outputs/phase-11/4worktree-smoke-evidence.md` の手順に沿って保存されている

### 2.3 スコープ

#### 含むもの

- smoke worktree 4 本作成 → fragment 生成 → main へ順次 merge → conflict 0 件確認
- `pnpm skill:logs:render --skill aiworkflow-requirements` に 4 entry が timestamp 降順表示されること
- 証跡を `outputs/phase-11/4worktree-smoke-evidence.md` の手順に沿って保存

#### 含まないもの

- CI guard 追加（UT-A2-CI-001 で別管理）
- A-1 / A-3 / B-1 の実装

### 2.4 成果物

- smoke 実行ログ（4 worktree の作成・fragment 生成・merge 結果）
- `git ls-files --unmerged` 出力（0 行であること）
- `pnpm skill:logs:render` の出力ログ
- `outputs/phase-11/4worktree-smoke-evidence.md` への追記または更新

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- task-skill-ledger-a2-fragment Phase 11 までが main にマージ済み
- `.claude/skills/aiworkflow-requirements/scripts/log_usage.js` が動作する状態
- `pnpm skill:logs:render` が利用可能

### 3.2 依存タスク

- task-skill-ledger-a2-fragment Phase 11（fragment 化実装）
- task-skill-ledger-a2-fragment Phase 12（unassigned-task 検出）

### 3.3 必要な知識

- `scripts/new-worktree.sh` の使い方
- git worktree の HEAD 解決と merge 挙動
- fragment ファイル命名規則（timestamp + worktree id 由来の一意 path）
- `pnpm skill:logs:render` の表示仕様（mtime / front-matter のどちらで並べているか）

### 3.4 推奨アプローチ

4 worktree を順番ではなく可能な限り並行で fragment 生成 → merge を行い、実運用に近い競合状況を再現する。merge 順は固定せず、各 worktree から main への push 順で実施する。証跡は単一 markdown に時系列で追記し、後追いで参照可能にする。

---

## 4. 実行手順

### Phase構成

1. smoke worktree 4 本作成
2. fragment 生成と push
3. main への順次 merge
4. render 検証と証跡確定

### Phase 1: smoke worktree 4 本作成

#### 目的

並列追記の起点となる worktree を 4 本確保する。

#### 手順

1. `bash scripts/new-worktree.sh feat/smoke-a2-1`
2. `bash scripts/new-worktree.sh feat/smoke-a2-2`
3. `bash scripts/new-worktree.sh feat/smoke-a2-3`
4. `bash scripts/new-worktree.sh feat/smoke-a2-4`

#### 成果物

`.worktrees/` 配下に 4 ディレクトリ

#### 完了条件

`git worktree list` で 4 本が確認できる

### Phase 2: fragment 生成と push

#### 目的

各 worktree から aiworkflow-requirements の LOGS / changelog / lessons-learned に fragment を 1 件ずつ追記する。

#### 手順

1. 各 worktree で `node .claude/skills/aiworkflow-requirements/scripts/log_usage.js` 等を実行して fragment を生成
2. 生成された fragment を commit
3. `git push origin feat/smoke-a2-N`

#### 成果物

各 worktree のコミットと push ログ

#### 完了条件

4 worktree すべてに fragment コミットが存在する

### Phase 3: main への順次 merge

#### 目的

並列起源の fragment が同一バイト位置で衝突しないことを実機で確認する。

#### 手順

1. main を更新し、feat/smoke-a2-1 から feat/smoke-a2-4 まで順次 merge
2. 各 merge 後に `git ls-files --unmerged` を実行
3. conflict が出た場合は症状を即時に苦戦箇所欄へ記録

#### 成果物

merge ログと `git ls-files --unmerged` の出力

#### 完了条件

`git ls-files --unmerged` が全 merge 後 0 行

### Phase 4: render 検証と証跡確定

#### 目的

`pnpm skill:logs:render` の出力で 4 entry が timestamp 降順に並ぶことを確認し、証跡を確定する。

#### 手順

1. `pnpm skill:logs:render --skill aiworkflow-requirements` を実行
2. 4 entry が timestamp 降順で表示されることを目視確認
3. 出力ログを `outputs/phase-11/4worktree-smoke-evidence.md` の手順に沿って保存
4. smoke worktree 4 本を後片付け（`git worktree remove`）

#### 成果物

render ログと evidence markdown

#### 完了条件

evidence markdown に 4 entry の表示結果と merge 結果が時系列で記録されている

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] smoke worktree 4 本を作成し fragment を生成・push できた
- [ ] main への 4 連続 merge 後 `git ls-files --unmerged` が 0 行
- [ ] `pnpm skill:logs:render --skill aiworkflow-requirements` が 4 entry を timestamp 降順で表示
- [ ] `outputs/phase-11/4worktree-smoke-evidence.md` に証跡が保存されている

### 品質要件

- [ ] merge 過程で手動 conflict 解消が一度も発生しなかった
- [ ] render 並びが安定している（複数回実行しても順序が変わらない）

### ドキュメント要件

- [ ] evidence markdown に実行コマンド / 出力 / merge 結果が時系列で残っている
- [ ] 苦戦箇所が発生した場合は本ファイル §9 にも反映済み

---

## 苦戦箇所

> task-skill-ledger-a2-fragment Phase 1〜12 outputs（implementation-guide.md / runbook.md / fragment-runbook.md / skill-feedback-report.md）から想定される苦戦箇所を記録する。

- fragment 化の単体テストと証跡フォーマット固定までは Phase 11 で完了したが、4 worktree を実際に起こして main へ順次 merge する smoke は実機環境依存（`.git/worktrees/` 配下の HEAD 解決・index 競合・mtime 解釈差）が大きく、A-2 本体スコープから切り出さざるを得なかった。
- fragment ファイル名は理論上 `<timestamp>-<branch>-<nonce>.md` で一意でも、実 `git merge` 時の add/add conflict 検出は実機 smoke でしか確認できず、Phase 11 evidence で 4 連 merge を時系列に取る運用が想定される苦戦点。
- `pnpm skill:logs:render` の並び基準が mtime と front-matter timestamp のどちらを一次キーにしているかで render 順序が揺れる可能性があり、Phase 4 で複数回実行して安定性を担保する追加検証が必要になる。
- smoke worktree 4 本の後片付け（`git worktree remove`）漏れで `.worktrees/` が肥大化しやすく、Phase 4 の最終手順に必須ステップとして明記する運用整備が想定苦戦箇所として残る。

---

## 6. 検証方法

### テストケース

- 4 worktree から並列に fragment を生成しても fragment path が衝突しない
- 4 worktree を main へ順次 merge しても add/add conflict が発生しない
- render 出力が timestamp 降順で安定する

### 検証手順

```bash
bash scripts/new-worktree.sh feat/smoke-a2-1
bash scripts/new-worktree.sh feat/smoke-a2-2
bash scripts/new-worktree.sh feat/smoke-a2-3
bash scripts/new-worktree.sh feat/smoke-a2-4
git ls-files --unmerged
pnpm skill:logs:render --skill aiworkflow-requirements
```

---

## 7. リスクと対策

| リスク                                                              | 影響度 | 発生確率 | 対策                                                                 |
| ------------------------------------------------------------------- | ------ | -------- | -------------------------------------------------------------------- |
| 理論上は一意 path でも、実際の worktree 作成・merge 手順で環境依存の失敗が残る | 中     | 中       | smoke 実行ログを evidence に時系列で残し、再現手順を即座に共有       |
| mtime 解釈差で render 並びが揺れる                                  | 中     | 中       | render の並び基準を確認し、front-matter の timestamp を一次キーにする |
| smoke worktree の後片付け漏れで `.worktrees/` が肥大化              | 低     | 中       | Phase 4 の最後に `git worktree remove` を必須手順として明記          |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/task-skill-ledger-a2-fragment/outputs/phase-11/4worktree-smoke-evidence.md`
- `docs/30-workflows/task-skill-ledger-a2-fragment/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/task-skill-ledger-a2-fragment/outputs/phase-12/implementation-guide.md`
- `.claude/skills/aiworkflow-requirements/scripts/log_usage.js`

### 参考資料

- A-2 fragment 化の目的: 4 worktree 並列追記での同一バイト位置 conflict 0 件

---

## 9. 備考

### 苦戦箇所【記入必須】

> task-skill-ledger-a2-fragment 実装時に気づいた具体的困難点を記録する。

| 項目     | 内容                                                                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | fragment 化の単体テストと証跡フォーマット固定までは完了したが、4 worktree を実際に起こして main へ順次 merge する smoke が未実行のまま残った                          |
| 原因     | 単体テストでは worktree 環境特有の path / merge 挙動（`.git/worktrees/` 配下の HEAD 解決、index 競合、mtime 解釈差）を再現できず、smoke は実機でしか担保できないため  |
| 対応     | A-2 本体の実装スコープからは smoke 実機検証を切り出し、本 unassigned-task として独立タスク化した。実施タイミングは A-2 マージ後の最初の余裕枠で確保する方針          |
| 再発防止 | fragment 設計を伴う今後のタスクでは、Phase 11 で「単体テスト」と「実 worktree smoke」を別 Phase として切り分け、Phase 11 完了条件に smoke 実機検証を含める運用に変更   |

### レビュー指摘の原文（該当する場合）

```
task-skill-ledger-a2-fragment Phase 12 unassigned-task-detection.md にて 4 worktree smoke 実機検証を未実施タスクとして識別
```

### 補足事項

CI guard 追加（UT-A2-CI-001）は本タスクとは別管理。本タスクはあくまで「実機 smoke 1 回分の証跡取得」に絞り、恒常的なガードは別タスクで扱う。smoke 完了後は `.worktrees/` 配下の smoke worktree を `git worktree remove` で確実に後片付けすること。
