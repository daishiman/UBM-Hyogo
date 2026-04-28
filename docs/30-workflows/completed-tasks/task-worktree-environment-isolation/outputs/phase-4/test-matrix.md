# Phase 4: テスト観点マトリクス — task-worktree-environment-isolation

ID 規約: `T-<AC番号>-<連番>` または `T-X-<連番>`（横断ケース）。

凡例:

- 種別: `manual-smoke`（手動コマンド実行）/ `link-check`（docs リンク整合）/ `design-review`（設計レビュー時の確認項目）
- 判定: 終了コード・`wc -l`・`grep` ヒット数・ファイル存在など決定論的指標で記述

---

## 1. AC-1: skill symlink 撤去方針

| ID | 観点 | 種別 | 前提 | 手順 | 期待出力 | 失敗時判定 |
| --- | --- | --- | --- | --- | --- | --- |
| T-1-1 | 撤去前インベントリ取得が完了する | manual-smoke | worktree 直下 | `find .claude/skills -maxdepth 3 -type l -exec sh -c 'for p; do printf "%s -> %s\n" "$p" "$(readlink "$p")"; done' sh {} + > /tmp/skills.before` | exit 0、ファイル生成成功 | exit ≠ 0 または stderr に permission error |
| T-1-2 | 撤去後 symlink がゼロ件 | manual-smoke | T-1-1 後に撤去実行済 | `find .claude/skills -type l \| wc -l` | `0` | 出力が `0` 以外 |
| T-1-3 | 実ディレクトリ skill が残存 | manual-smoke | 同上 | `ls -d .claude/skills/aiworkflow-requirements .claude/skills/task-specification-creator` | 両ディレクトリが存在 | いずれかで `ls: ... No such file` |
| T-1-4 | Rollback コマンドが docs に存在 | design-review | runbook.md レビュー | `grep -n 'ln -s' outputs/phase-5/runbook.md` | 1 件以上ヒット | ヒット 0 件 |
| T-1-5 | 方針 A / 方針 B の選択基準が明文化 | design-review | design.md §1.2 確認 | 文書精読 | 「グローバル参照」「実ファイルコピー」両方の使用条件が記載 | 片方しか書かれていない |

---

## 2. AC-2: tmux session-scoped state

| ID | 観点 | 種別 | 前提 | 手順 | 期待出力 | 失敗時判定 |
| --- | --- | --- | --- | --- | --- | --- |
| T-2-1 | global env に `UBM_WT_*` がリークしていない | manual-smoke | tmux server 起動済 | `tmux show-environment -g \| grep -E '^UBM_WT_' \|\| true` | 何も出力されない | `UBM_WT_PATH` 等が出力 |
| T-2-2 | session env に 3 変数が注入される | manual-smoke | `tmux new-session -d -s ubm-test -e UBM_WT_PATH=/tmp/x -e UBM_WT_BRANCH=feat/x -e UBM_WT_SESSION=ubm-test` | `tmux show-environment -t ubm-test \| grep -E '^UBM_WT_' \| wc -l` | `3` | `3` 以外 |
| T-2-3 | `update-environment` が必要最小限 | manual-smoke | tmux 起動済 | `tmux show-options -g update-environment` | `SSH_AUTH_SOCK SSH_CONNECTION DISPLAY` のみ | 余分な変数を含む |
| T-2-4 | 同名 session 再作成は明示エラー | manual-smoke | T-2-2 の session 残存 | `tmux new-session -d -s ubm-test` | exit ≠ 0、stderr に "duplicate session" 系メッセージ | exit 0（黙って継続） |
| T-2-5 | 既存セッションの cleanup 手順が docs に記載 | design-review | runbook.md レビュー | `grep -n 'tmux kill-session\|kill-server' outputs/phase-5/runbook.md` | 1 件以上ヒット | ヒット 0 件（C-3 申し送り未消化） |

---

## 3. AC-3: gwt-auto lock

### 3.1 mkdir lockdir 正本 / flock optional（C-1）

| ID | 観点 | 種別 | 前提 | 手順 | 期待出力 | 失敗時判定 |
| --- | --- | --- | --- | --- | --- | --- |
| T-3-1 | mkdir lockdir 取得成功 | manual-smoke | lockdir 不在 | runbook §lock 取得スクリプトを実行 | exit 0、`.worktrees/.locks/<slug>-<sha8>.lockdir/owner` 生成 | exit ≠ 0 または owner 無し |
| T-3-2 | mkdir lockdir 競合即時失敗 | manual-smoke | T-3-1 の lockdir 保持中 | 別シェルで同じ lock を取得試行 | exit 75、stderr に branch 名 | 待機（block）してしまう / exit 0 |
| T-3-3 | flock 不在環境でも動作 | manual-smoke | `command -v flock` が失敗 | runbook §mkdir lockdir 実行 | exit 0、`<slug>-<sha8>.lockdir/owner` 生成 | flock 必須で失敗 |
| T-3-4 | stale owner 判定 | manual-smoke | 同一hostの pid 不在 owner | stale として削除可能 | host一致 + pid不在のみ削除 | host不一致を削除 |
| T-3-5 | runbook が mkdir 正本を明記 | design-review | runbook.md レビュー | `grep -nE 'mkdir.*lockdir|flock.*optional' outputs/phase-5/runbook.md` | 両キーワードが出現 | 正本が曖昧 |
| T-3-6 | 選択基準が明文化（C-1） | design-review | runbook.md レビュー | 文書精読 | 「macOS 標準は mkdir 方式、flock は optional」記述あり | 選択基準が曖昧 |

### 3.2 解放・stale 判定

| ID | 観点 | 種別 | 前提 | 手順 | 期待出力 | 失敗時判定 |
| --- | --- | --- | --- | --- | --- | --- |
| T-3-7 | 正常終了で lock 解放 | manual-smoke | mkdir lockdir | スクリプトを `set -e` で完走 | lockdir が削除され、再取得が成功 | 取得失敗 |
| T-3-8 | 異常終了後の stale lock 判定 | manual-smoke | mkdir lockdir | 子プロセスを `kill -9` した後、owner を確認 | 同一host + pid不在なら削除可能 | host不一致を削除 |
| T-3-9 | lock メタ情報 4 行 | manual-smoke | T-3-1 後 | `awk -F= '{print $1}' .worktrees/.locks/<slug>-<sha8>.lockdir/owner \| sort -u` | `host`, `pid`, `ts`, `wt` の 4 キー | キー欠落 |

### 3.3 BRANCH_SLUG 境界値（C-5）

| ID | 観点 | 種別 | 入力 | 期待出力 | 失敗時判定 |
| --- | --- | --- | --- | --- | --- |
| T-3-10 | 通常 ascii ブランチ | manual-smoke | `feat/my-feature` | slug=`feat-my-feature-<sha8>`（64 以下） | slug 生成失敗、`/` 残存、hash 欠落 |
| T-3-11 | 最大長 64 文字ちょうど | manual-smoke | 64 文字のブランチ名 | slug は `<prefix-55>-<sha8>` 形式で 64 文字以下 | slug が 64 文字を超過 |
| T-3-12 | 最大長 65 文字（超過） | manual-smoke | 65 文字 | slug は `<prefix-55>-<sha8>` 形式で 64 文字以下 | slug が 64 文字を超過、hash 欠落 |
| T-3-13 | 記号混入 `feat/foo@2026!` | manual-smoke | 同左 | slug=`feat-foo2026-<sha8>`（許可外記号除去 + hash） | 記号が残る、hash 欠落 |
| T-3-14 | 大文字 `Feature/X` | manual-smoke | 同左 | slug=`feature-x-<sha8>`（小文字化 + hash） | runbook と挙動不一致 |
| T-3-15 | 空ブランチ名 | manual-smoke | `""` | exit ≠ 0、usage 表示 | 空 slug で lock 作成 |

### 3.4 日本語パス耐性（要件 §9 / C-3 関連）

| ID | 観点 | 種別 | 前提 | 手順 | 期待出力 | 失敗時判定 |
| --- | --- | --- | --- | --- | --- | --- |
| T-3-16 | REPO_ROOT に `個人開発` 等のマルチバイトを含む | manual-smoke | 現環境 (`/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/...`) | T-3-1 と同じ | exit 0、lock パスが期待値、`cat` で文字化けなし | パス展開エラー / クォート漏れ |
| T-3-17 | lock メタ `wt=` フィールドに日本語パス保存 | manual-smoke | 同上 | `grep ^wt= .worktrees/.locks/<slug>.lockdir/owner` | UTF-8 のまま `個人開発` を含む | 文字化け / `?` 置換 |

### 3.5 二系統テストの判定基準まとめ

- flock 系統: `flock -n` exit code (`1` = 失敗 / `0` = 成功) と `EXIT trap` の `flock -u` 呼出で判定。
- mkdir 系統: `mkdir` 自体の exit code (`0` 成功 / `1` 既存) で判定。`rmdir` を `EXIT trap` で必ず呼ぶ。

---

## 4. 横断（shell state / scripts/new-worktree.sh）

| ID | 観点 | 種別 | 前提 | 手順 | 期待出力 | 失敗時判定 |
| --- | --- | --- | --- | --- | --- | --- |
| T-X-1 | `scripts/new-worktree.sh` 後方互換 | manual-smoke | 既存呼出 `bash scripts/new-worktree.sh feat/foo` | 旧来通り実行 | 終了メッセージ「✅ ワークツリー作成完了」が表示 | 体裁変更で外部スクリプトが壊れる |
| T-X-2 | `mise exec -- node --version` が v24 系 | manual-smoke | worktree 内 | 同左 | `v24.x.x` | 別バージョン（親シェルから漏洩） |
| T-X-3 | `OP_SERVICE_ACCOUNT_TOKEN` の継承無し | manual-smoke | 親で `export OP_SERVICE_ACCOUNT_TOKEN=dummy` した上で worktree に入る | runbook の `unset` 推奨手順実行後 `printenv OP_SERVICE_ACCOUNT_TOKEN` | 何も表示されない（exit 1） | 値が継承されている |
| T-X-4 | `.gitignore` に `.worktrees/` が記載 | manual-smoke | リポジトリ root | `grep -E '^\.worktrees/?\$\|^\.worktrees$' .gitignore` | 1 件以上ヒット | ヒット 0 件（C-2 申し送り未消化） |
| T-X-5 | `.worktrees/.locks/` が誤コミットされていない | manual-smoke | 同上 | `git ls-files .worktrees/.locks 2>/dev/null \| wc -l` | `0` | 1 件以上 |
| T-X-6 | 既存 worktree への遡及手順が docs にある | design-review | runbook.md レビュー | `grep -n '既存 worktree\|遡及' outputs/phase-5/runbook.md` | 1 件以上 | ヒット 0 件（C-6 申し送り未消化） |

---

## 5. AC-4: NON_VISUAL evidence の再現性

design.md §6 EV-1〜EV-7 をそのままケース化する。

| ID | EV | 種別 | コマンド | 期待 | 失敗時判定 |
| --- | --- | --- | --- | --- | --- |
| T-4-1 | EV-1 | manual-smoke | `find .claude/skills -type l \| wc -l` | `0` | 0 以外 |
| T-4-2 | EV-2 | manual-smoke | `tmux show-environment -g \| grep -E '^UBM_WT_' \|\| true` | 出力なし | 出力あり |
| T-4-3 | EV-3 | manual-smoke | `tmux show-environment -t ubm-<slug> \| grep -E '^UBM_WT_' \| wc -l` | `3` | 3 以外 |
| T-4-4 | EV-4 | manual-smoke | `bash scripts/new-worktree.sh feat/x` を 2 端末で同時起動 | 後発が exit 75 | 後発 exit 0（並走成功してしまう）／待機 |
| T-4-5 | EV-5 | manual-smoke | `cat .worktrees/.locks/feat-x-<sha8>.lockdir/owner` | `pid=`/`host=`/`ts=`/`wt=` の 4 行 | 行数不足 |
| T-4-6 | EV-6 | manual-smoke | `git worktree list` | 新 worktree が一覧に存在 | 不在 |
| T-4-7 | EV-7 | manual-smoke | `mise exec -- node --version` | `v24.x.x` | 異バージョン |

---

## 6. docs-only / NON_VISUAL 検証手段の整理

| 検証カテゴリ | 本タスクでの扱い |
| --- | --- |
| 単体テスト | 対象外（コード実装が後続タスク） |
| 統合テスト | 対象外（同上） |
| E2E / UI | 対象外（NON_VISUAL） |
| 手動 smoke | §1〜§5 の `manual-smoke` を Phase 11 で実行 |
| リンク整合 | `outputs/phase-11/link-checklist.md` で `index.md` ↔ `phase-N.md` ↔ `outputs/phase-N/*` の双方向リンクを検査 |
| 設計レビュー | §1〜§4 の `design-review` 行を Phase 10 / Phase 11 で確認 |

---

## 7. 失敗時の総合判定基準

- いずれかの **AC 直接対応ケース（T-1-2 / T-2-1 / T-2-2 / T-3-1 / T-3-2 / T-4-1〜T-4-5）** が失敗した場合、Phase 9 品質ゲートを **NG** とし Phase 5 へ差し戻す。
- 横断ケース（T-X-*）失敗は Phase 5 ランブックの修正で吸収可能。Phase 12 documentation update で確実に解消すること。
- 設計レビュー項目（design-review）失敗は Phase 5 ランブック未完成のサインであり、`outputs/phase-5/runbook.md` の追記で解消する。

---

## 8. 申し送り消化チェック（Phase 3 → Phase 4）

| 申し送り ID | 内容 | 対応ケース |
| --- | --- | --- |
| C-1 | flock / mkdir 二系統 | T-3-1〜T-3-6 |
| C-2 | `.gitignore` 確認 | T-X-4, T-X-5（runbook 側で実手順を記述） |
| C-3 | tmux baseline / cleanup | T-2-5 |
| C-5 | `BRANCH_SLUG` 境界値 | T-3-10〜T-3-15 |
| C-6 | 既存 worktree 遡及 | T-X-6（runbook 側で実手順を記述） |
| C-4 | 個別 symlink 再導入検出 | 本タスク対象外、`task-git-hooks-lefthook-and-post-merge` へ申し送り済み |
