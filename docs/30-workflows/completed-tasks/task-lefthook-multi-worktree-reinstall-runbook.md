# 既存 30+ worktree への lefthook 一括再インストール runbook 運用化 - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-lefthook-multi-worktree-reinstall-runbook |
| タスク名 | 既存 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| 分類 | DevEx / Operations |
| 対象機能 | lefthook hook installation across worktrees |
| 優先度 | Medium |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | task-git-hooks-lefthook-and-post-merge Phase 12 |
| 発見日 | 2026-04-28 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`git worktree list` で 30+ 件の worktree が並列に存在している。lefthook の `prepare` script は各 worktree の `pnpm install` 初回実行時にしか自動配置されないため、すでに `node_modules` を持つ既存 worktree には新しい `lefthook.yml` の hook が伝播しない可能性がある。Phase 5 runbook で詳細化されたが、実行責任者と実行記録の運用が未確定のまま残っている。

### 1.2 問題点・課題

- post-merge を廃止した今、lefthook が確実に各 worktree に install されないと hook 層がスキップされる
- 既存 worktree への一括 install は人手依存で、忘却リスクが高い
- 「誰が」「いつ」「どの worktree に」install したかの記録が無く、実施抜けの監査ができない

### 1.3 放置した場合の影響

- 古い hook（または hook 無し）の worktree から PR が出て、pre-commit / commit-msg gate がスキップされる
- lefthook.yml 改定後の品質ゲートが部分的にしか効かない
- post-merge 廃止と相まって、品質保証が CI のみに依存し、ローカル早期検出の価値が消える

---

## 2. 何を達成するか（What）

### 2.1 目的

既存 30+ worktree に対して `lefthook install` を一巡させる runbook と一括スクリプトを正本化し、運用に組み込む。

### 2.2 最終ゴール

- `scripts/reinstall-lefthook-all-worktrees.sh` が存在し、全 worktree を巡回 install できる
- `doc/00-getting-started-manual/lefthook-operations.md` に実行責任者と実行タイミングが明記されている
- 各 worktree で `lefthook version` が PASS することが検証されている

### 2.3 スコープ

#### 含むもの

- `git worktree list --porcelain` から worktree path を抽出するスクリプト
- 各 worktree で `mise exec -- lefthook install` を実行
- 実行ログを stdout に出力（実施記録に転用可能）
- runbook ドキュメントへの記載

#### 含まないもの

- lefthook.yml の hook 定義変更
- post-merge hook の復活
- worktree 自動作成プロセスの改修（task-worktree-environment-isolation 側で扱う）

### 2.4 成果物

- `scripts/reinstall-lefthook-all-worktrees.sh`
- `doc/00-getting-started-manual/lefthook-operations.md` 差分（運用化セクション）
- 実行ログ（全 worktree で `lefthook version` PASS）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `lefthook.yml` がリポジトリルートに存在する
- `pnpm install` 完了済みの worktree では `node_modules/.bin/lefthook` が解決できる
- mise + pnpm が各 worktree でセットアップ済み

### 3.2 依存タスク

- `task-git-hooks-lefthook-and-post-merge`

### 3.3 必要な知識

- `git worktree list --porcelain` の出力フォーマット
- lefthook の install 動作（`.git/hooks/` への symlink 配置）
- bash スクリプトでの安全な path iteration

### 3.4 推奨アプローチ

`git worktree list --porcelain` をパースして worktree path を集め、`pushd`/`popd` で各 path に入って `lefthook install` を実行する。失敗した worktree は終了せずに記録し、最後に summary を出す。

---

## 4. 実行手順

### Phase構成

1. 現存 worktree 一覧の取得
2. 一括 install スクリプト作成
3. 実行と検証
4. 運用化（ドキュメント反映）

### Phase 1: 現存 worktree 一覧の取得

#### 目的

対象 worktree の総数と path を確定する。

#### 手順

1. `git worktree list` を実行し件数を確認
2. `git worktree list --porcelain | grep '^worktree '` で path を抽出
3. `node_modules` の有無を確認し install 対象を確定

#### 成果物

worktree path 一覧と件数メモ

#### 完了条件

30+ 件の worktree path が一覧化されている

### Phase 2: 一括 install スクリプト作成

#### 目的

冪等に再実行できる一括 install スクリプトを正本化する。

#### 手順

1. `scripts/reinstall-lefthook-all-worktrees.sh` を作成
2. `git worktree list --porcelain` から path を読み取る
3. 各 path で `mise exec -- pnpm exec lefthook install` を実行
4. 失敗 path を集め、最後に summary を表示
5. `chmod +x` で実行可能にする

#### 成果物

`scripts/reinstall-lefthook-all-worktrees.sh`

#### 完了条件

スクリプトが乾式実行（dry-run）でエラーなく対象 path を列挙できる

### Phase 3: 実行と検証

#### 目的

全 worktree で lefthook hook が install されたことを確認する。

#### 手順

1. `bash scripts/reinstall-lefthook-all-worktrees.sh` を実行
2. 各 worktree の `.git/hooks/pre-commit` が lefthook 由来であることを確認
3. 任意の worktree で `mise exec -- pnpm exec lefthook version` を実行し PASS を確認
4. 失敗 worktree があれば原因（`node_modules` 未生成 等）を切り分けて再実行

#### 成果物

実行ログ（PASS / FAIL summary）

#### 完了条件

全 worktree で `lefthook version` が PASS する

### Phase 4: 運用化（ドキュメント反映）

#### 目的

実行責任者と実行タイミングを正本ドキュメントに固定する。

#### 手順

1. `doc/00-getting-started-manual/lefthook-operations.md` に「既存 worktree への一括 install」セクションを追加
2. 実行タイミング（lefthook.yml 改定時 / 新 hook 追加時）を明記
3. CLAUDE.md「よく使うコマンド」セクションへの導線を確認
4. 必要なら README へのリンクを追加

#### 成果物

ドキュメント差分

#### 完了条件

新規参加者が runbook だけで一括 install を再現できる

---

## 5. 完了条件チェックリスト

- [ ] `scripts/reinstall-lefthook-all-worktrees.sh` が存在し実行可能
- [ ] 全 worktree で `lefthook version` PASS
- [ ] `lefthook-operations.md` に運用化記載がある
- [ ] 実行責任者と実行タイミングが明文化されている
- [ ] post-merge hook を復活させていない

---

## 6. 苦戦箇所と将来知見

### 6.1 Phase 12 で初めて発覚するパターン

各 Phase 完了時に軽量な compliance check（「この Phase の成果物が他の前提を壊していないか」の即時検査）が無いため、Phase 1〜11 で分散した baseline 候補（worktree 全数 install の必要性 等）が Phase 12 の unassigned-task-detection で初めて束になって検出される。今後は Phase 完了時に「この Phase が前提とする運用が既存環境で成立しているか」の 1 項目チェックを足すことで前倒し検出できる。

### 6.2 worktree 並列構造に固有の事情

worktree が 30+ 並列に存在することは `task-worktree-environment-isolation` 由来であり、各 worktree が独立 `node_modules` を持つ設計になっている。lefthook の `prepare` 自動 install が走るのは初回 `pnpm install` 時のみで、すでに依存解決済みの worktree には新規 hook 定義が伝播しない。「lefthook.yml を編集したら一括 install が必須」という非自明な依存関係を runbook に明記する必要がある。

### 6.3 人手依存と忘却リスク

既存 worktree に対する一括 install は本質的に人手依存になりやすく、忘却リスクが高い。スクリプト化だけでは不十分で、「いつ実行すべきか」のトリガー条件（lefthook.yml の変更を含む PR がマージされた直後 等）を runbook 側に固定し、レビュー時のチェック項目に組み込むことで再発を抑える。長期的には CI 上の一括 install 検証 job 化も検討余地がある（ただし worktree は CI に存在しないため、検証は「ローカル運用責任」の範囲に閉じる）。

---

## 7. リスクと対策

- 一部 worktree が `node_modules` 未生成の場合、`pnpm exec lefthook` が失敗する → スクリプト側で `node_modules` 不在を skip 扱いにし summary に記録
- worktree path に空白が含まれる場合の引数事故 → `while IFS= read -r` + 適切な quote で対処
- `lefthook install` が `.git/hooks/*` を上書きすることでローカル独自 hook を消す → 「`.git/hooks/*` の手書き禁止」方針を runbook で再掲
- 30+ worktree 巡回の実行時間 → 並列実行は避け、逐次で記録性を優先

---

## 8. 参照情報

- `docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/unassigned-task-detection.md` (B-1)
- `lefthook.yml`
- `scripts/hooks/`
- `doc/00-getting-started-manual/lefthook-operations.md`
- `CLAUDE.md`「よく使うコマンド」セクション

---

## 9. 備考

- 派生元: task-git-hooks-lefthook-and-post-merge Phase 12 unassigned-task-detection B-1
- post-merge 廃止後の hook 層信頼性を担保する補完タスク
- 実施記録は PR 本文または `docs/30-workflows/` 配下の運用ログに残すことを推奨
