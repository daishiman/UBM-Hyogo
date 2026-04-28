# failure-cases — task-worktree-environment-isolation

Phase 2 設計（D-1〜D-4 / EV-1〜EV-7）に対する **異常系・境界条件**の網羅集。各ケースは「前提 / 再現手順 / 期待動作 / 検出手段 / 関連 AC・EV」で構成する。

実機確認は Phase 11 手動テストで行い、ログを `outputs/phase-11/manual-smoke-log.md` に貼る。

---

## F-1: `flock(1)` 不在環境（macOS 素の状態）

### 前提
- macOS で `brew install util-linux` が未実施。
- `which flock` が空、または `command -v flock` が exit 1。

### 再現手順
```bash
# 1. flock を一時的に PATH から外す（テスト目的）
PATH="$(echo "$PATH" | tr ':' '\n' | grep -v util-linux | paste -sd ':' -)" \
  bash scripts/new-worktree.sh feat/test-flock-absent
```

### 期待動作
- `scripts/new-worktree.sh` は冒頭で `command -v flock` を確認し、不在なら **`mkdir` ベースのフォールバック**（Phase 2 §3.5）に自動切替する。
- 標準エラーに `WARN: flock(1) not found, falling back to mkdir-based lock` を出す。
- 後続処理（worktree 作成 / mise install / pnpm install）は通常通り完了する。

### 検出手段
- `bash scripts/new-worktree.sh feat/test-flock-absent 2>&1 | grep -F 'mkdir-based lock'`
- 作成後 `ls .worktrees/.locks/` に `<slug>.lockdir` が **存在しない**こと（`trap` で削除済み）。

### 関連
- AC-3 / EV-4 / EV-5
- リスク: 「macOS で `flock(1)` が無い」

---

## F-2: 日本語パス配下での lock パス破綻

### 前提
- リポジトリ実体が `/Users/dm/dev/dev/個人開発/UBM-Hyogo/` に存在。
- worktree も `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/<wt>` に作られる。

### 再現手順
```bash
cd "/Users/dm/dev/dev/個人開発/UBM-Hyogo"
bash scripts/new-worktree.sh feat/日本語ブランチ-test
```

### 期待動作
- **slug は ASCII 化される**（Phase 2 §3.1: `tr -cd '[:alnum:]-_'`）。
  日本語ブランチ名は `[:alnum:]` でマルチバイトを除去、もしくはハッシュ短縮で ASCII slug にフォールバックする。
- lock パスは `.worktrees/.locks/feat-test-<sha8>.lockdir/owner` 等の **ASCII のみ**で確定する。
- リポジトリパスに含まれる `個人開発` はクォートで保護され、`flock` / `mkdir` 共に成功する。

### 検出手段
- `ls -1 .worktrees/.locks/` の出力が ASCII のみであること。
- `bash -x scripts/new-worktree.sh ...` のトレースで lock パスがクォート展開されていることを目視確認。

### 関連
- AC-3 / EV-5
- リスク: 「日本語パス（`個人開発`）で lock パスが破綻」

---

## F-3: tmux 多重 attach による env 漏れ

### 前提
- 既存 tmux セッション `ubm-feat-a` が稼働し、global env に `UBM_WT_PATH=/path/to/wt-A` が残っている（過去の汚染を再現）。
- 別 worktree wt-B 用に新セッション `ubm-feat-b` を作ろうとする。

### 再現手順
```bash
# 汚染状態を再現
tmux set-environment -g UBM_WT_PATH /path/to/wt-A

# 新セッションを正規手順で作成
tmux new-session -d -s ubm-feat-b -c "$WT_B_PATH" \
  -e "UBM_WT_PATH=$WT_B_PATH" \
  -e "UBM_WT_BRANCH=feat/b" \
  -e "UBM_WT_SESSION=ubm-feat-b"

# attach して環境変数確認
tmux attach -t ubm-feat-b
echo "$UBM_WT_PATH"
```

### 期待動作
- `tmux show-environment -t ubm-feat-b | grep UBM_WT_PATH` が **`$WT_B_PATH`**（session-scoped 値）を返す。
- global の汚染値は session-scoped で **上書きされる**。
- Phase 2 §2.2-3 の `update-environment` 設定により、`UBM_WT_*` は client env に伝播しない（`SSH_AUTH_SOCK` 等のみ伝播）。

### 検出手段
- `tmux show-environment -g | grep -E '^UBM_WT_' | wc -l` が `0` であること（EV-2）。
- `tmux show-environment -t ubm-feat-b | grep -E '^UBM_WT_' | wc -l` が `3`（EV-3）。
- 異常時: 値が `wt-A` のままなら **`tmux kill-server` で全消去 → 再作成**を runbook 指示に従い実施。

### 関連
- AC-2 / EV-2 / EV-3
- リスク: 「tmux 既存セッションへの後付けで env が汚染」

---

## F-4: 既存 skill symlink が残存

### 前提
- 過去に開発者が `ln -s ~/.claude/skills/foo .claude/skills/foo` を実行していた。
- 撤去方針（Phase 2 §1.2）が未適用の worktree。

### 再現手順
```bash
# 残存検出
find .claude/skills -maxdepth 3 -type l \
  -exec sh -c 'for p; do printf "%s -> %s\n" "$p" "$(readlink "$p")"; done' sh {} +
```

### 期待動作
- 検出された symlink は **インベントリログ**として `outputs/phase-11/manual-smoke-log.md` に保存（Phase 2 §1.2-1）。
- 撤去手順（`git rm <symlink>` または `unlink`）を docs に従って実行。
- 撤去後 `find .claude/skills -type l | wc -l` が `0`（EV-1）。

### 検出手段
- 自動検出: 後続タスク `task-git-hooks-lefthook-and-post-merge` の pre-commit フックで `find -type l` を確認（Phase 2 §7 で申し送り済み）。
- 手動検出: 上記 `find` コマンドの目視確認。

### 関連
- AC-1 / EV-1
- リスク: 「skill symlink を撤去すると既存ワークフローが壊れる」（インベントリ取得で緩和）

---

## F-5: `mise install` 未実施の worktree

### 前提
- `scripts/new-worktree.sh` を経由せずに `git worktree add` 直叩きで worktree を作成（CLAUDE.md 非推奨経路）。
- `.mise.toml` は worktree に存在するが、`mise install` が未実行。

### 再現手順
```bash
git worktree add -b feat/raw .worktrees/feat-raw origin/main
cd .worktrees/feat-raw
node --version    # ホストの Node が出る（v24 とは限らない）
mise exec -- node --version  # ここでようやく v24
```

### 期待動作
- shell state 分離方針（Phase 2 §4.1）に従い、`scripts/new-worktree.sh` 経由なら自動で `mise install` が走る。
- 直叩きで作った worktree では **`mise exec -- pnpm install` が失敗 or 警告**する手順を docs に明記し、開発者が気づける。
- runbook では「直叩きでなく必ず `scripts/new-worktree.sh` を使う」を明示する。

### 検出手段
- `mise exec -- node --version` の出力が `v24.x.x` であることを EV-7 で確認。
- 一致しない場合: `mise install` 未実施が確定。

### 関連
- AC-4 / EV-7
- 関連リスク: shell state の継承（CLAUDE.md「shell state の継承」項）

---

## F-6: lock 取得失敗時の挙動

### 前提
- ターミナル A で `bash scripts/new-worktree.sh feat/x` を実行中（lock 保持）。
- ターミナル B で同名ブランチを同時実行。

### 再現手順
```bash
# Terminal A
bash scripts/new-worktree.sh feat/x &
A_PID=$!

# Terminal B（即座に）
bash scripts/new-worktree.sh feat/x ; echo "exit=$?"
```

### 期待動作
- ターミナル B は **待たずに即時終了**する（Phase 2 §3.2 の `flock -n` / mkdir 原子性）。
- exit code は `75`（EX_TEMPFAIL）。
- 標準エラーに以下が出る:
  ```
  ERROR: branch 'feat/x' is already being created by another process
  pid=<A_PID>
  host=<hostname>
  ts=<UTC>
  wt=<worktree path>
  ```
- ターミナル A の処理はそのまま継続し、最終的に lock を解放する（`trap EXIT` / `flock -u` / `rm -f`）。
- A 終了後に再度 B を実行すると正常成功（または「既に worktree 存在」のエラー、これは別系統）。

### 検出手段
- exit code が `75`（EV-4）。
- `cat .worktrees/.locks/feat-x-<sha8>.lockdir/owner` が PID/host/ts/wt の 4 行（EV-5、A 実行中の瞬間のみ）。
- A 終了後: `flock -n` 成功 → lock ファイルは残存可（メタ情報は次回上書き）、もしくは `rm -f` 済み。

### 関連
- AC-3 / EV-4 / EV-5
- リスク: 「lock ファイル孤児化（hostname 異なる NFS など）」 → ローカル開発のみサポートで緩和（runbook 明記）

---

## 網羅性チェック

| Phase 1/2 由来リスク | カバー |
| --- | --- |
| skill symlink 撤去で既存ワークフローが壊れる | F-4 |
| macOS で flock(1) が無い | F-1 |
| 日本語パスで lock パスが破綻 | F-2 |
| tmux 既存セッション env 汚染 | F-3 |
| lock ファイル孤児化 / 競合 | F-6 |
| mise / shell state の継承ずれ | F-5 |
| 開発者が独自に skill symlink を再導入 | F-4（lefthook 申し送り） |
| 1Password トークンが親シェルから漏れる | （別タスク `task-claude-code-permissions-decisive-mode` に申し送り） |

最後の 1 件は本タスクのスコープ外（Phase 1 §2.2 / Phase 2 §4.2 で `unset` 言及）であり、failure case として詳細化しない。
