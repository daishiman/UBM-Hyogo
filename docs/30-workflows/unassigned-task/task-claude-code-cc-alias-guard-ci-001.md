# cc alias guard の CI/pre-commit 化 - タスク指示書

## メタ情報

```yaml
issue_number: unassigned
```

## メタ情報

| 項目         | 内容                                                                  |
| ------------ | --------------------------------------------------------------------- |
| タスクID     | task-claude-code-cc-alias-guard-ci-001                                |
| タスク名     | cc alias guard の CI/pre-commit 化                                    |
| 分類         | 品質保証 / 開発環境                                                   |
| 対象機能     | `cc` alias 重複検出の自動化                                           |
| 優先度       | MEDIUM                                                                |
| 見積もり規模 | 小規模                                                                |
| ステータス   | 未実施                                                                |
| 発見元       | task-claude-code-permissions-apply-001 Phase 12                       |
| 発見日       | 2026-04-28                                                            |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-claude-code-permissions-apply-001` で `cc` alias を `~/.config/zsh/conf.d/79-aliases-tools.zsh` に正準化し、TC-R-01 として `grep -nE '^alias cc=' <定義ファイル>` で alias 重複が 0 行であることを手動確認した。現状 TC-R-01 は manual smoke log に残るのみで、次回の zsh 設定変更（新規 alias 追加 / 別 conf.d ファイル新設 / dotfiles 流入）で重複 alias が再発しても自動検出できない。

### 1.2 問題点・課題

- 重複 alias が発生すると、`cc` の効果が予測不能になり `--dangerously-skip-permissions` 付きの正準形が読み込まれない可能性がある
- 重複は `type cc` の表示順依存となり、再現条件が分かりにくく事故の検知が遅れる
- TC-R-01 を将来の作業者が手動で再実行することは現実的でない（手順を覚えていない / 忘れる）
- backup ファイル（`*.bak.*`）を grep 対象に含めると false positive が起き、既存運用と矛盾する

### 1.3 放置した場合の影響

- bypassPermissions モードが効かないまま気付かず、permission prompt が再出現してフローが中断する
- 旧 alias が優先された場合、`--dangerously-skip-permissions` が外れ deny の評価軸が変わる可能性がある
- `task-claude-code-permissions-apply-001` で確立した正準形が静かに侵食される

---

## 2. 何を達成するか（What）

### 2.1 目的

`cc` alias の重複検出を CI または pre-commit で恒常化し、TC-R-01 と同等以上の検証を人手介在なしで毎回実行できる状態にする。

### 2.2 最終ゴール

- `^alias cc=` が backup ファイルを除いて 1 件だけ存在することを検証するスクリプトが存在する
- pre-commit または CI の zsh job に組み込まれ、PR / commit 時に自動実行される
- `~/.config/zsh/conf.d/79-aliases-tools.zsh` が存在しない環境では skip 理由を明示して exit 0 する
- 異常系（alias 2 件以上）で確実に FAIL として検出される

### 2.3 スコープ

#### 含むもの

- `^alias cc=` を対象 zsh 設定群から検索するスクリプトの新規作成
- backup (`*.bak.*`) を検出対象から除外するロジック
- 対象ファイル不在時の skip 仕様（理由を stderr / log に明示）
- pre-commit (`lefthook.yml`) または CI job への組み込み
- `task-claude-code-permissions-apply-001/outputs/phase-11/manual-smoke-log.md` の TC-R-01 と同等以上の検証カバレッジ

#### 含まないもの

- `cc` alias 以外（`claude` 本体 alias / 他 tool alias）の重複検出
- zsh 設定全体の lint 化
- alias 値そのものの正準形検証（→ 必要なら別タスク）
- ユーザー側 `~/.zshrc` の自動修復

### 2.4 成果物

- alias guard スクリプト（`scripts/` 配下を想定）
- pre-commit / CI への統合差分
- 実行ログサンプル（PASS / FAIL / SKIP の 3 ケース）
- README または `doc/00-getting-started-manual/` 配下の運用メモ追記（必要時）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-claude-code-permissions-apply-001` の Phase 4（`cc` alias 正準化）が完了している
- `lefthook.yml` が hook の正本として機能している（`CLAUDE.md` 参照）
- 検証対象のホスト環境ファイルパスが `~/.config/zsh/conf.d/79-aliases-tools.zsh` であることが確定している

### 3.2 依存タスク

- `task-claude-code-permissions-apply-001`（完了済み・正準形を入力として参照）

### 3.3 必要な知識

- zsh alias 解決順序と複数 conf.d ファイルの読み込み挙動
- `grep -nE` / `find` による backup 除外パターン
- lefthook のローカル hook 定義
- GitHub Actions の matrix job / shell job 構成

### 3.4 推奨アプローチ

スクリプトは依存ゼロで shell 1 ファイルにまとめる（zsh / bash どちらでも実行可能）。pre-commit と CI どちらを正本にするかは、ローカル開発で事故を防ぐ重要度を踏まえ pre-commit を一次線、CI を二次線とする 2 層構成を推奨する。`task-claude-code-permissions-apply-001` の TC-R-01 をそのままスクリプト化して exit code を返す形が最小実装。

---

## 4. 実行手順

### Phase構成

1. 検査要件の確定とテスト設計
2. guard スクリプトの実装
3. pre-commit / CI への組込み
4. 動作検証と運用メモ整備

### Phase 1: 検査要件の確定とテスト設計

#### 目的

TC-R-01 を自動化するための入出力契約を確定する。

#### 手順

1. 検査対象ファイルパスとパターン（`^alias cc=`）を明文化
2. backup 除外パターン（`*.bak.*`）を明文化
3. PASS / FAIL / SKIP の exit code（例: 0 / 1 / 0 + warning）を決定
4. テスト fixture（alias 0 件 / 1 件 / 2 件 / backup 混入）を設計

#### 成果物

検査仕様メモ + fixture 一覧

#### 完了条件

入出力契約と fixture が一意に決まっている

### Phase 2: guard スクリプトの実装

#### 目的

検査仕様に従う最小スクリプトを作成する。

#### 手順

1. shell スクリプト（`scripts/check-cc-alias-uniqueness.sh` を想定）を新規作成
2. 対象ファイル不在時は skip 理由を出力し exit 0
3. backup 除外で `^alias cc=` を grep し件数を判定
4. 1 件で PASS、2 件以上で FAIL、0 件で WARN（要件に従い決定）

#### 成果物

実装済みスクリプト

#### 完了条件

Phase 1 fixture すべてで期待 exit code が得られる

### Phase 3: pre-commit / CI への組込み

#### 目的

ローカルと CI の両方で自動実行されるようにする。

#### 手順

1. `lefthook.yml` の pre-commit に script を登録
2. GitHub Actions の workflow に同 script の job を追加
3. 既存 hook / job との順序・依存を整理

#### 成果物

更新済み `lefthook.yml` と CI workflow 差分

#### 完了条件

PR を起こした際に CI で当該 step が実行される

### Phase 4: 動作検証と運用メモ整備

#### 目的

3 ケース（PASS / FAIL / SKIP）の挙動を実環境で確認し、運用上の注意点を記録する。

#### 手順

1. 正常系 commit を実行し PASS ログを取得
2. 一時的に重複 alias を入れて FAIL ログを取得
3. 対象ファイルを退避させて SKIP ログを取得
4. 運用メモ（README または `doc/00-getting-started-manual/`）に追記

#### 成果物

実行ログ 3 ケース + 運用メモ

#### 完了条件

3 ケースすべての挙動が仕様どおり

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] 正常系（alias 1 件）で PASS する
- [ ] 異常系（alias 2 件以上）で FAIL する
- [ ] backup (`*.bak.*`) が検出対象から除外される
- [ ] 対象ファイル不在時に skip 理由を明示して exit 0
- [ ] pre-commit と CI のいずれかで自動実行される

### 品質要件

- [ ] スクリプトが shell 互換（bash/zsh）で動作する
- [ ] `task-claude-code-permissions-apply-001` の TC-R-01 と同等以上のカバレッジ
- [ ] false positive が 0（backup 混入時にも誤検出しない）

### ドキュメント要件

- [ ] 運用メモが `doc/00-getting-started-manual/` 配下または README に追記
- [ ] PASS / FAIL / SKIP の挙動例がログとして残る

---

## 6. 検証方法

### テストケース

| TC ID  | 内容                                            | 期待                                |
| ------ | ----------------------------------------------- | ----------------------------------- |
| TC-A-01 | alias 1 件のみ                                  | PASS / exit 0                        |
| TC-A-02 | alias 2 件以上                                  | FAIL / exit 1                        |
| TC-A-03 | backup ファイルにのみ alias が複数              | PASS（backup 除外）                  |
| TC-A-04 | 対象ファイル不在                                | SKIP（exit 0 + 理由 stderr）        |

### 検証手順

```bash
bash scripts/check-cc-alias-uniqueness.sh
grep -nE '^alias cc=' ~/.config/zsh/conf.d/*.zsh 2>/dev/null \
  | grep -v '\.bak\.'
```

---

## 7. リスクと対策

| リスク                                              | 影響度 | 発生確率 | 対策                                                            |
| --------------------------------------------------- | ------ | -------- | --------------------------------------------------------------- |
| 検出漏れ（別 conf.d ファイル追加で alias 増殖）     | 中     | 中       | スクリプトは `~/.config/zsh/conf.d/*.zsh` 全体を対象にする      |
| backup 除外パターン誤りで false positive            | 中     | 低       | Phase 1 fixture に backup 混入ケースを必須化                    |
| CI ジョブが他者環境で fail（パス差異）              | 低     | 中       | 対象ファイル不在時は skip でフォールバック                      |
| pre-commit が遅くなりコミット体験を損なう           | 低     | 低       | shell 1 ファイル / 依存ゼロで軽量化                             |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/completed-tasks/task-claude-code-permissions-apply-001.md`
- `docs/30-workflows/task-claude-code-permissions-apply-001/outputs/phase-11/manual-smoke-log.md`
- `doc/00-getting-started-manual/lefthook-operations.md`
- `doc/00-getting-started-manual/claude-code-config.md`

### 参考資料

- zsh manual: alias resolution
- lefthook documentation

---

## 9. 備考

### 苦戦箇所【記入必須】

> `task-claude-code-permissions-apply-001` Phase 11 由来。

| 項目     | 内容                                                                                                                          |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 症状     | TC-R-01 を完了条件に据えたが、自動実行されないため次回の設定変更で再発検知が遅れる懸念が残った                                |
| 原因     | 元タスクは「実反映」までをスコープとし、CI/pre-commit 化は別タスクへ切り出された                                              |
| 対応     | manual smoke log に TC-R-01 を残しつつ本タスクとして自動化を切り出した                                                        |
| 再発防止 | guard を pre-commit/CI に組込み、定義ファイル変更時に必ず実行される状態にする                                                 |

### レビュー指摘の原文（該当する場合）

```
task-claude-code-permissions-apply-001 Phase 12 review
TC-R-01 の自動化を別タスクとして分離する
```

### 補足事項

- 本タスクは `task-claude-code-permissions-apply-001` の保守タスクであり、依存タスクは完了済み
- `cc` alias 以外の検証は別途必要に応じて切り出すこと
