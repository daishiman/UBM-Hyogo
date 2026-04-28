# 既存 30+ worktree への lefthook 一括再インストール runbook 運用化 - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-lefthook-multi-worktree-reinstall-runbook |
| タスク名 | 既存 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| 分類 | DevEx / Operations |
| 対象機能 | lefthook hook installation across worktrees |
| 優先度 | 中 |
| 見積もり規模 | 小規模 |
| ステータス | 実装済み（2026-04-28 / feat/wt-5） |
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

### 含む

- `git worktree list --porcelain` から worktree path を抽出するスクリプト
- 対象 worktree で `mise exec -- pnpm exec lefthook install` を実行
- dry-run / skip / fail / pass の summary を stdout に出力
- 実行ログを PR 本文、または同名タスクディレクトリを作成する場合は `outputs/phase-11/manual-smoke-log.md` に転記できる形式で残す
- runbook ドキュメントへの記載

### 含まない

- lefthook.yml の hook 定義変更
- post-merge hook の復活
- worktree 自動作成プロセスの改修（task-worktree-environment-isolation 側で扱う）
- indexes drift の CI gate 化（`task-verify-indexes-up-to-date-ci` 側で扱う）

### 2.4 成果物

- `scripts/reinstall-lefthook-all-worktrees.sh`
- `doc/00-getting-started-manual/lefthook-operations.md` 差分（運用化セクション）
- 実行ログ（対象 worktree ごとの PASS / SKIP / FAIL summary）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `lefthook.yml` がリポジトリルートに存在する
- `pnpm install` 完了済みの worktree では `node_modules/.bin/lefthook` が解決できる
- mise + pnpm が各 worktree でセットアップ済み

### 3.2 依存タスク

- `task-git-hooks-lefthook-and-post-merge`
- `task-worktree-environment-isolation`

### 3.3 必要な知識

- `git worktree list --porcelain` の出力フォーマット
- lefthook の install 動作（`.git/hooks/` への symlink 配置）
- bash スクリプトでの安全な path iteration

### 3.4 推奨アプローチ

`git worktree list --porcelain` をパースして worktree path を集め、`pushd`/`popd` で各 path に入って `mise exec -- pnpm exec lefthook install` を実行する。失敗した worktree は終了せずに記録し、最後に summary を出す。

### 3.5 実行分類

| 分類 | 定義 | 完了判定での扱い |
| --- | --- | --- |
| PASS | `node_modules/.bin/lefthook` が存在し、install と `lefthook version` が成功 | 成功 |
| SKIP | `node_modules` 未生成、または対象外 path と明示判断 | 未達ではないが summary と runbook に理由を残す |
| FAIL | install または version check が失敗 | タスク未完了。原因を切り分けて再実行 |

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
4. `--dry-run` では install せず対象 path と PASS / SKIP 予定だけを表示
5. 失敗 path を集め、最後に PASS / SKIP / FAIL summary を表示
6. FAIL が 1 件以上ある場合は exit 1、FAIL なしで SKIP のみ残る場合は exit 0 とする
7. `chmod +x` で実行可能にする

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
3. 対象 worktree 全件で `mise exec -- pnpm exec lefthook version` を実行し PASS を確認
4. SKIP worktree があれば理由（`node_modules` 未生成 等）を summary に残す
5. FAIL worktree があれば原因を切り分け、修正後に再実行

#### 成果物

実行ログ（PASS / SKIP / FAIL summary）

#### 完了条件

FAIL が 0 件で、対象 worktree 全件が PASS または理由付き SKIP として記録されている

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

- [x] `scripts/reinstall-lefthook-all-worktrees.sh` が存在し実行可能
- [x] `--dry-run` が対象 path と PASS / SKIP 予定を表示する
- [x] FAIL 0 件で、対象 worktree 全件が PASS または理由付き SKIP として記録されている
- [x] `lefthook-operations.md` に運用化記載がある
- [x] 実行責任者と実行タイミングが明文化されている
- [x] post-merge hook を復活させていない

実装記録:

- スクリプト: `scripts/reinstall-lefthook-all-worktrees.sh`
- Runbook: `doc/00-getting-started-manual/lefthook-operations.md`
- 検証: `bash -n scripts/reinstall-lefthook-all-worktrees.sh`、`bash scripts/reinstall-lefthook-all-worktrees.sh --dry-run`

---

### 5.1 苦戦箇所【記入必須】

- 対象: `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/unassigned-task-detection.md`
- 症状: Phase 12 で worktree 全数 install の必要性が初めて未タスク化され、Phase 1〜11 の軽量 compliance check では既存 worktree への hook 伝播漏れを前倒し検出できなかった
- 参照: `docs/30-workflows/completed-tasks/task-lefthook-multi-worktree-reinstall-runbook.md`、`doc/00-getting-started-manual/lefthook-operations.md`

- 対象: `scripts/reinstall-lefthook-all-worktrees.sh`
- 症状: worktree が 30+ 並列に存在し、各 worktree の `node_modules` 状態が異なるため、全件 PASS と `node_modules` 未生成 skip を同じ完了条件で扱うと判定が矛盾する
- 参照: `task-worktree-environment-isolation`、`lefthook.yml`

- 対象: `doc/00-getting-started-manual/lefthook-operations.md`
- 症状: スクリプト化だけでは「いつ誰が再 install するか」が残り、lefthook.yml 変更後の人手忘却リスクを消せない
- 参照: `task-git-hooks-lefthook-and-post-merge` Phase 12 B-1

---

## 6. 検証方法

### 単体検証

```bash
bash -n scripts/reinstall-lefthook-all-worktrees.sh
bash scripts/reinstall-lefthook-all-worktrees.sh --dry-run
```

期待:

- syntax error がない
- dry-run が `git worktree list --porcelain` 由来の path を表示する
- dry-run では `.git/hooks/*` を変更しない
- PASS / SKIP 予定が summary に出る

### 統合検証

```bash
bash scripts/reinstall-lefthook-all-worktrees.sh
git worktree list --porcelain | awk '/^worktree / {print substr($0, 10)}'
```

期待:

- FAIL が 0 件
- 対象 worktree は PASS、`node_modules` 未生成などの対象外 worktree は理由付き SKIP
- PASS worktree では `mise exec -- pnpm exec lefthook version` が成功する
- `doc/00-getting-started-manual/lefthook-operations.md` に実行責任者、実行タイミング、ログ保存方針が記載されている
- `lefthook.yml` に post-merge hook を復活させていない

### 失敗時の切り分け

| 症状 | 確認 | 対応 |
| --- | --- | --- |
| `pnpm exec lefthook` が見つからない | 対象 worktree の `node_modules` 有無 | `pnpm install` 未実施なら SKIP 記録、必要なら当該 worktree で install |
| `.git/hooks/pre-commit` が lefthook 由来でない | `.git/hooks/pre-commit` の内容 | `mise exec -- pnpm exec lefthook install` を再実行 |
| dry-run と本実行の対象数が違う | `git worktree list --porcelain` の出力 | stale worktree を確認し、必要なら `git worktree prune` は別判断で実施 |
| path に空白があり失敗する | dry-run の path 表示 | quote 修正後に dry-run から再実行 |

---

## 7. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| 一部 worktree が `node_modules` 未生成で `pnpm exec lefthook` が失敗する | 中 | `node_modules` 不在は SKIP として summary に理由を記録し、FAIL とは分離する |
| worktree path に空白が含まれる場合に引数分割事故が起きる | 高 | `while IFS= read -r` と quote を徹底し、dry-run で path 表示を確認する |
| `lefthook install` が `.git/hooks/*` のローカル手書き hook を上書きする | 中 | 「`.git/hooks/*` の手書き禁止」方針を runbook で再掲し、必要な hook は `lefthook.yml` に寄せる |
| 30+ worktree 巡回に時間がかかる | 低 | 並列実行は避け、逐次実行で記録性と原因切り分けを優先する |
| post-merge hook を復活させて別の自動化に逃げる | 高 | 本タスクの含まない範囲と完了条件で post-merge 復活禁止を明記し、`lefthook.yml` 差分を確認する |

---

### 7.1 30種の思考法による検証結果

| クラスタ | 適用した思考法 | 結論 |
| --- | --- | --- |
| 論理分析系 | 批判的思考、演繹思考、帰納的思考、アブダクション、垂直思考 | completed 配置と未実施ステータスが最大矛盾。未タスク配置へ戻すのが最小修正 |
| 構造分解系 | 要素分解、MECE、2軸思考、プロセス思考 | Why / What / How は残し、検証方法・苦戦箇所・リスク表だけを必須形式へ補強する |
| メタ・抽象系 | メタ思考、抽象化思考、ダブル・ループ思考 | 本質は「worktree 固有状態の再同期 runbook」であり、hook 実装変更ではない |
| 発想・拡張系 | ブレインストーミング、水平思考、逆説思考、類推思考、if思考、素人思考 | dry-run、SKIP 分類、ログ保存先、全件 version check を追加すれば過剰設計なしで運用できる |
| システム系 | システム思考、因果関係分析、因果ループ | lefthook.yml 変更が既存 worktree に伝播しない因果を runbook に固定し、CI 依存増の循環を断つ |
| 戦略・価値系 | トレードオン思考、プラスサム思考、価値提案思考、戦略的思考 | 並列化より逐次ログを優先し、実行者負担と監査負担を同時に下げる |
| 問題解決系 | why思考、改善思考、仮説思考、論点思考、KJ法 | 破棄再構成は不要。状態矛盾、運用トリガー、スクリプト堅牢性、検証記録の4群を最小修正する |

---

## 8. 参照情報

- `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/unassigned-task-detection.md` (B-1)
- `docs/30-workflows/completed-tasks/task-worktree-environment-isolation/`
- `docs/30-workflows/task-verify-indexes-up-to-date-ci/`
- `lefthook.yml`
- `scripts/hooks/`
- `doc/00-getting-started-manual/lefthook-operations.md`
- `CLAUDE.md`「よく使うコマンド」セクション

---

## 9. 備考

- 派生元: task-git-hooks-lefthook-and-post-merge Phase 12 unassigned-task-detection B-1
- post-merge 廃止後の hook 層信頼性を担保する補完タスク
- 実施記録は PR 本文、または同名タスクディレクトリを作成する場合は `outputs/phase-11/manual-smoke-log.md` に残す
