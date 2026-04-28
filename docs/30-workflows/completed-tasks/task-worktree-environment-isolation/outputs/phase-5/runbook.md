# Phase 5: 実装ランブック — task-worktree-environment-isolation

> **重要**: 本書は **後続実装タスクが参照する手順書**である。本タスク (`task-worktree-environment-isolation`) は docs-only / spec_created であり、本 Phase でコード変更・`git commit` / `git push` / PR 作成は **行わない**。本書の手順を実行するのは、後続の実装系タスク（命名候補: `task-worktree-environment-isolation-impl` 等）に切り出されたときである。

---

## 0. 事前確認

### 0.1 環境前提

| 項目 | 期待 |
| --- | --- |
| OS | macOS（Darwin 25.x 以上）/ Linux 主要 distro |
| Shell | zsh / bash 双方を想定 |
| Tooling | `git` 2.40+, `mise`, `pnpm` 10, `tmux`（任意）, `op`（任意） |
| リポジトリ | UBM-Hyogo monorepo、`.worktrees/` 配下に新規 worktree を作成可能 |

### 0.2 スナップショット取得（必須・冒頭で実行）

実装着手前に **現状の状態**を保存する。これは Rollback の起点でもある。

```bash
REPO_ROOT="$(git rev-parse --show-toplevel)"
SNAP_DIR="${REPO_ROOT}/.worktrees/.snapshots/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$SNAP_DIR"

# skill symlink インベントリ
find .claude/skills -maxdepth 3 -type l \
  -exec sh -c 'for p; do printf "%s -> %s\n" "$p" "$(readlink "$p")"; done' sh {} + \
  > "$SNAP_DIR/skills.symlinks.before" || true

# tmux 環境スナップショット
( tmux show-environment -g 2>/dev/null || echo "<no tmux server>" ) \
  > "$SNAP_DIR/tmux.global.before"
tmux list-sessions -F '#{session_name}' 2>/dev/null \
  > "$SNAP_DIR/tmux.sessions.before" || true

# .gitignore スナップショット
cp .gitignore "$SNAP_DIR/gitignore.before"

echo "Snapshot saved to $SNAP_DIR"
```

---

## 1. 全体フロー

```
[0] スナップショット取得
  └─[1] D-1 skill symlink 撤去
        └─[2] D-2 tmux session-scoped state 設定
              └─[3] D-3 gwt-auto lock 実装（mkdir デフォルト / flock opt-in）
                    └─[4] D-4 shell state 分離
                          └─[5] scripts/new-worktree.sh 改修
                                └─[6] .gitignore 確認
                                      └─[7] 既存 worktree 遡及
                                            └─[8] 検証（Phase 4 test-matrix）
                                                  └─[9] PR 作成（後続タスクの責務）
```

---

## 2. D-1: skill symlink 撤去

### 2.1 手順

```bash
# (1) インベントリは §0.2 のテンプレートで取得する
cat "$SNAP_DIR/skills.symlinks.before"

# (2) 撤去（worktree 内のローカル symlink のみ対象。実ディレクトリは触らない）
while IFS= read -r line; do
  link_path="${line%% -> *}"
  [ -L "$link_path" ] && git rm "$link_path"
done < "$SNAP_DIR/skills.symlinks.before"

# (3) 検証
test "$(find .claude/skills -type l | wc -l)" -eq 0
```

### 2.2 撤去後の代替

- **方針 A（推奨デフォルト）**: skill はホスト側 `~/.claude/skills/` のみに置く。Claude Code の harness 側がグローバルスキルを解決する。
- **方針 B**: worktree ごとに必要な skill は **実ファイルコピー**で配置し、`git add` で版管理する。

### 2.3 対応テストケース

T-1-1 / T-1-2 / T-1-3（Phase 4 test-matrix.md §1）

---

## 3. D-2: tmux session-scoped state

### 3.1 既存セッションの cleanup（C-3 対応）

汚染された既存 session は **破棄して作り直す**。

```bash
# (1) 不要な session を kill
tmux kill-session -t <old-session> 2>/dev/null || true

# (2) どうしてもクリーンにしたい場合は server ごと再起動（要確認）
# tmux kill-server   # 全 session 停止につき注意
```

### 3.2 server 設定の最小化

`~/.tmux.conf` に以下を追記（環境共通設定。worktree commit 対象外）。

```tmux
# session-scoped 環境変数を attach 時に上書きさせない
set-option -g update-environment "SSH_AUTH_SOCK SSH_CONNECTION DISPLAY"
```

設定読み込み:

```bash
tmux source-file ~/.tmux.conf
tmux show-options -g update-environment
# => "SSH_AUTH_SOCK SSH_CONNECTION DISPLAY"
```

### 3.3 session 作成ラッパー（docs サンプル）

`scripts/new-worktree.sh` の `--with-tmux` 経路で呼び出す想定。

```bash
SLUG="$(slug_of_branch "$BRANCH")"   # §4.4 関数を参照
tmux has-session -t "ubm-${SLUG}" 2>/dev/null && {
  echo "ERROR: tmux session 'ubm-${SLUG}' already exists" >&2
  exit 1
}
tmux new-session -d -s "ubm-${SLUG}" -c "$WT_PATH" \
  -e "UBM_WT_PATH=$WT_PATH" \
  -e "UBM_WT_BRANCH=$BRANCH" \
  -e "UBM_WT_SESSION=ubm-${SLUG}"
```

### 3.4 対応テストケース

T-2-1 / T-2-2 / T-2-3 / T-2-4 / T-2-5（Phase 4 test-matrix.md §2）

---

## 4. D-3: gwt-auto lock

### 4.1 デフォルト実装: mkdir 方式（macOS 標準で動作）

```bash
acquire_lock_mkdir() {
  local slug="$1"
  local lock_dir="${REPO_ROOT}/.worktrees/.locks"
  local lockdir="${lock_dir}/${slug}.lockdir"
  mkdir -p "$lock_dir"
  if ! mkdir "$lockdir" 2>/dev/null; then
    if [ -f "${lockdir}/owner" ]; then
      local owner_host owner_pid
      owner_host="$(awk -F= '$1=="host"{print $2}' "${lockdir}/owner")"
      owner_pid="$(awk -F= '$1=="pid"{print $2}' "${lockdir}/owner")"
      if [ "$owner_host" = "$(hostname)" ] && [ -n "$owner_pid" ] && ! kill -0 "$owner_pid" 2>/dev/null; then
        rm -rf "$lockdir"
        mkdir "$lockdir" || exit 75
      else
        echo "ERROR: lock held for branch slug='${slug}' at ${lockdir}" >&2
        cat "${lockdir}/owner" >&2
        exit 75
      fi
    else
      echo "ERROR: lock held for branch slug='${slug}' at ${lockdir}" >&2
      exit 75
    fi
  fi
  printf 'pid=%s\nhost=%s\nts=%s\nwt=%s\n' \
    "$$" "$(hostname)" "$(date -u +%FT%TZ)" "$WT_PATH" \
    > "${lockdir}/owner"
  # shellcheck disable=SC2064
  trap "rm -rf '${lockdir}'" EXIT
}
```

### 4.2 opt-in: flock 方式（util-linux 導入時）

```bash
acquire_lock_flock() {
  local slug="$1"
  local lock_dir="${REPO_ROOT}/.worktrees/.locks"
  local lock_file="${lock_dir}/${slug}.lock"
  mkdir -p "$lock_dir"
  exec 9>"$lock_file"
  if ! flock -n 9; then
    echo "ERROR: branch slug='${slug}' already being created" >&2
    cat "$lock_file" >&2 || true
    exit 75
  fi
  printf 'pid=%s\nhost=%s\nts=%s\nwt=%s\n' \
    "$$" "$(hostname)" "$(date -u +%FT%TZ)" "$WT_PATH" >&9
  # 異常終了時は kernel が自動解放、ファイルは残骸として残るが次回 flock -n 成功で上書き
  trap 'flock -u 9; rm -f "$lock_file"' EXIT
}
```

### 4.3 系統選択ロジック（C-1 対応・推奨はデフォルト mkdir）

```bash
acquire_lock() {
  local slug="$1"
  if [ "${UBM_LOCK_MODE:-mkdir}" = "flock" ] && command -v flock >/dev/null 2>&1; then
    acquire_lock_flock "$slug"
  else
    acquire_lock_mkdir "$slug"
  fi
}
```

判断基準:

- 既定は **mkdir 方式**: macOS 標準で依存追加なし、原子的、Phase 4 T-3-3/T-3-4 で検証可能。
- `UBM_LOCK_MODE=flock` を設定し、かつ `flock(1)` がインストール済みの場合のみ flock 方式に切替。

### 4.4 BRANCH_SLUG 生成（C-5 境界値対応）

```bash
slug_of_branch() {
  local raw="$1"
  [ -z "$raw" ] && { echo "ERROR: empty branch name" >&2; exit 64; }
  local normalized hash prefix
  normalized="$(printf '%s' "$raw" | tr '[:upper:]/_' '[:lower:]--' | tr -cd 'a-z0-9-')"
  hash="$(printf '%s' "$raw" | shasum -a 256 | awk '{print substr($1,1,8)}')"
  prefix="$(printf '%s' "$normalized" | cut -c1-55)"
  printf '%s-%s' "${prefix:-branch}" "$hash"
}
```

この slug は lockdir と tmux session の両方で使う。`WT_NAME` も秒単位 timestamp ではなく `task-${slug}-wt` を基本形とし、既存パスがある場合は後続に短い乱数または `mktemp -d` 相当を付与して path 衝突を避ける。

### 4.5 対応テストケース

T-3-1〜T-3-17（Phase 4 test-matrix.md §3）

---

## 5. D-4: shell state 分離

### 5.1 worktree 入場時の必須リセット

`scripts/new-worktree.sh` の終端で出力する案内に以下を追加（既存 cd 後に実行）。

```bash
cd "$WT_PATH"
unset OP_SERVICE_ACCOUNT_TOKEN  # 親シェルからの 1Password トークン継承を遮断
hash -r                          # PATH キャッシュクリア
mise trust --quiet
mise install --quiet
```

### 5.2 PROMPT 識別子（任意）

`~/.zshrc` への追記サンプル（commit 対象外）:

```zsh
precmd_ubm_wt() {
  local rel="${PWD#${HOME}/}"
  case "$rel" in
    *.worktrees/*) export PS1_WT_TAG="[wt:${PWD##*/}] " ;;
    *)             export PS1_WT_TAG="" ;;
  esac
}
typeset -ga precmd_functions
precmd_functions+=(precmd_ubm_wt)
PROMPT='${PS1_WT_TAG}'$PROMPT
```

### 5.3 direnv 連携

`.envrc` を使う場合は worktree ごとに `direnv allow` を必須とする。runbook 利用者へ案内するのみ。

### 5.4 対応テストケース

T-X-2 / T-X-3（Phase 4 test-matrix.md §4）

---

## 6. `scripts/new-worktree.sh` への変更手順

### 6.1 変更点（design.md §5.1 を転記）

| 区分 | 変更 | 場所 |
| --- | --- | --- |
| 追加 | `slug_of_branch` 関数定義 | 関数ブロック先頭 |
| 追加 | `acquire_lock` 呼び出し | `git fetch origin main` の直前 |
| 追加 | `unset OP_SERVICE_ACCOUNT_TOKEN` / `hash -r` | `cd "$WT_PATH"` 直後 |
| 追加 | `--with-tmux` opt-in フラグの引数解析 | `BRANCH=` の前 |
| 追加 | `--audit` opt-in フラグでの symlink インベントリ表示 | 末尾 |
| 不変 | `git worktree add -b "$BRANCH" "$WT_PATH" origin/main` | そのまま |
| 不変 | `mise install` / `pnpm install` の順序 | そのまま |
| 不変 | 「✅ ワークツリー作成完了」ブロックの体裁 | そのまま（後方互換） |

### 6.2 適用例（diff の趣旨のみ・実コードは後続タスクで作成）

```bash
# 旧
BRANCH="${1:?ブランチ名を指定してください}"
REPO_ROOT="$(git rev-parse --show-toplevel)"
...
git worktree add -b "$BRANCH" "$WT_PATH" origin/main

# 新（趣旨）
WITH_TMUX=0; AUDIT=0
while [ $# -gt 0 ]; do
  case "$1" in
    --with-tmux) WITH_TMUX=1; shift ;;
    --audit)     AUDIT=1; shift ;;
    *) BRANCH="$1"; shift ;;
  esac
done
: "${BRANCH:?ブランチ名を指定してください}"
REPO_ROOT="$(git rev-parse --show-toplevel)"
SLUG="$(slug_of_branch "$BRANCH")"
acquire_lock "$SLUG"
git fetch origin main
git worktree add -b "$BRANCH" "$WT_PATH" origin/main
```

### 6.3 対応テストケース

T-X-1（後方互換）、T-3-1〜T-3-17（lock 系）

---

## 7. `.gitignore` 確認手順（C-2 対応）

```bash
# (1) `.worktrees/` 全体が ignore されているか確認
grep -E '^\.worktrees/?$|^\.worktrees$' .gitignore || echo "MISSING"

# (2) 不足していれば追記（後続実装タスクの commit 対象に含める）
if ! grep -qE '^\.worktrees/?$|^\.worktrees$' .gitignore; then
  printf '\n# git worktree 配置先（lock / snapshot 含む）\n.worktrees/\n' >> .gitignore
fi

# (3) lock 関連が誤コミットされていないか確認
git ls-files .worktrees/.locks 2>/dev/null | wc -l   # 期待: 0
git ls-files .worktrees/.snapshots 2>/dev/null | wc -l # 期待: 0
```

### 7.1 対応テストケース

T-X-4 / T-X-5

---

## 8. 既存 worktree への遡及手順（C-6 対応）

既に作成済みの `.worktrees/<old>` を本設計に揃えたい場合の手順。

```bash
for wt in .worktrees/*/; do
  [ -d "$wt" ] || continue
  pushd "$wt" >/dev/null
    # (a) skill symlink 撤去
    while IFS= read -r l; do
      [ -L "$l" ] && git rm "$l"
    done < <(find .claude/skills -maxdepth 3 -type l)
    # (b) shell state リセット案内（手動）
    echo "[REMINDER] $wt: run 'unset OP_SERVICE_ACCOUNT_TOKEN; hash -r; mise install --quiet'"
  popd >/dev/null
done
```

tmux session を遡及する場合は §3.1 の cleanup を流用し、対応する worktree ごとに新規 session を作り直す。

### 8.1 対応テストケース

T-X-6

---

## 9. ロールバック手順

### 9.1 D-1（skill symlink 撤去）の rollback

```bash
# §0.2 で取得した SNAP_DIR/skills.symlinks.before を使う
while IFS= read -r line; do
  link_path="${line%% -> *}"
  target="${line##* -> }"
  [ -e "$link_path" ] || ln -s "$target" "$link_path"
done < "$SNAP_DIR/skills.symlinks.before"
```

### 9.2 D-2（tmux）の rollback

`~/.tmux.conf` の `update-environment` 行を変更前に戻し `tmux source-file ~/.tmux.conf` する。session は `tmux kill-session -t ubm-<slug>` で破棄。

### 9.3 D-3（lock）の rollback

`scripts/new-worktree.sh` を変更前のバージョン（git で確認）に戻す。残骸 lock は `rm -rf .worktrees/.locks/`。

### 9.4 D-4（shell state）の rollback

シェル設定ファイル側の追記を取り消し、ターミナル再起動。

### 9.5 `.gitignore` の rollback

`SNAP_DIR/gitignore.before` から復元。

```bash
cp "$SNAP_DIR/gitignore.before" .gitignore
```

---

## 10. 検証（Phase 4 test-matrix.md と対応）

実装完了後、後続タスクで以下を実行し `outputs/phase-11/manual-smoke-log.md` に記録する。

| 検証 | 参照 |
| --- | --- |
| AC-1 | T-1-1 / T-1-2 / T-1-3 |
| AC-2 | T-2-1 / T-2-2 / T-2-3 / T-2-4 |
| AC-3（lock） | T-3-1 / T-3-2 / T-3-3 / T-3-4 / T-3-7 / T-3-8 / T-3-9 |
| AC-3（slug 境界） | T-3-10 / T-3-11 / T-3-12 / T-3-13 / T-3-14 / T-3-15 |
| AC-3（日本語パス） | T-3-16 / T-3-17 |
| AC-4 evidence | T-4-1〜T-4-7 |
| 横断 | T-X-1〜T-X-6 |

---

## 11. 本タスクでの commit / push / PR 取扱い

- 本タスク (`task-worktree-environment-isolation`) は **docs-only / spec_created**。
- 本ランブックの §1〜§9 で示すコード変更・ファイル変更の **実装は後続タスクで実施**する。
- 本タスクのスコープでは `git commit` / `git push` / PR 作成は行わない（Phase 13 でユーザー承認を得たうえで docs のみ確定する）。
- 後続実装タスクが立ち上がる際は本ランブックを変更不可の入力として参照し、変更が必要なら別タスク仕様を起票してから着手する。
