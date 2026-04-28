# Phase 2: 設計詳細 — task-worktree-environment-isolation

## 0. 設計範囲と対応マップ

| 受け入れ条件 | 設計セクション | 主要決定 |
| --- | --- | --- |
| AC-1 skill symlink 撤去方針 | §1 | D-1 |
| AC-2 tmux session-scoped state | §2 | D-2 |
| AC-3 gwt-auto lock | §3 | D-3 |
| AC-4 NON_VISUAL evidence | §6 | D-5 |
| （横断）shell state 分離 | §4 | D-4 |
| （横断）`scripts/new-worktree.sh` 改修方針 | §5 | D-3 / D-4 派生 |

---

## 1. skill symlink 撤去方針（AC-1 / D-1）

### 1.1 現状分析

Claude Code のスキル定義は `.claude/skills/<name>/` に配置される。worktree を作成すると `git worktree add` は通常ファイルをコピーするが、symlink はリンクのまま引き継がれる。これにより以下が起きる。

- ホスト側のグローバルスキル（`~/.claude/skills/...`）を **worktree 内に symlink** している場合、worktree A での修正が worktree B にも即時反映される。
- 別プロジェクトの skill が誤って `.claude/skills/<name>` に linked されていると、本リポジトリの spec と不整合を起こす。

### 1.2 撤去方針

1. **インベントリ取得**: 撤去前に macOS/BSD find 互換の `find .claude/skills -maxdepth 3 -type l -exec sh -c 'for p; do printf "%s -> %s\n" "$p" "$(readlink "$p")"; done' sh {} +` を実行し、結果を `outputs/phase-11/manual-smoke-log.md` に保存する。
2. **撤去**: tracked symlink は `git rm`、untracked symlink は `rm` で除去する。実ディレクトリは削除対象にしない。
3. **代替手段の選択**:
   - **方針 A（推奨デフォルト）**: skill はグローバル `~/.claude/skills/` 側のみに置き、worktree 側にはエントリを置かない。Claude Code の起動時に harness 側がグローバルスキルを解決する。
   - **方針 B**: worktree ごとにスキルが必要な場合は **実ファイルコピー**で配置し、symlink を一切使わない。バージョンは `git` で管理する。
4. **撤去後の検証**: `find .claude/skills -type l | wc -l` が `0` であることを確認。

### 1.3 影響範囲

- `.claude/skills/aiworkflow-requirements/`, `.claude/skills/task-specification-creator/` 等は **実ディレクトリ**としてコミット済みのため影響なし。
- ローカル開発者個別に作成した symlink のみ撤去対象。

### 1.4 Rollback

撤去前のインベントリ（`§1.2-1`）から `ln -s` で復元可能。Rollback 手順は `outputs/phase-5/runbook.md` で別途定める。

---

## 2. tmux session-scoped state（AC-2 / D-2）

### 2.1 設計概要

tmux はサーバー単位で global env を共有し、`update-environment` で attach 時に client env を上書きする。worktree 混線の主因はこの global env と update-environment にある。

### 2.2 設計

1. **per-session 環境変数の命名規約**:
   - `UBM_WT_PATH=/.../.worktrees/<wt-name>`
   - `UBM_WT_BRANCH=<branch>`
   - `UBM_WT_SESSION=<tmux session name>`
2. **session 命名**: `ubm-<branch-slug>` 形式。`branch-slug` は §3.2 の `branch_slug()` を正本とし、tmux session 名も lockdir 名も同じ値を使う。
3. **tmux 設定（docs サンプルとして提示、実装は別タスク）**:
   ```tmux
   # update-environment から worktree 依存変数を除外
   set-option -g update-environment "SSH_AUTH_SOCK SSH_CONNECTION DISPLAY"
   ```
4. **new-session ラッパー手順**:
   ```bash
   tmux new-session -d -s "ubm-${SLUG}" -c "$WT_PATH" \
     -e "UBM_WT_PATH=$WT_PATH" \
     -e "UBM_WT_BRANCH=$BRANCH" \
     -e "UBM_WT_SESSION=ubm-${SLUG}"
   ```
   `-e` でセッション固有 env を注入し、global env には書き込まない。
5. **既存セッション再利用は禁止**: 同名セッションが既に存在する場合は明示エラーで終了する。

### 2.3 検証

- `tmux show-environment -g | grep -E '^UBM_WT_' | wc -l` が `0`
- `tmux show-environment -t ubm-<slug> | grep -E '^UBM_WT_' | wc -l` が `3`

---

## 3. gwt-auto lock（AC-3 / D-3）

### 3.1 lockdir 位置

- パス: `${REPO_ROOT}/.worktrees/.locks/<branch-prefix>-<sha8>.lockdir`
- ディレクトリは `mkdir -p` で作成、`.gitignore` で除外（`.worktrees/` は既に除外想定）。
- slug 規則: branch 名を ASCII 正規化し、`<prefix-55>-<sha8>` にする。同一 prefix の長い branch でも衝突させない。

### 3.2 取得・解放フロー

```bash
branch_slug() {
  local normalized hash prefix
  normalized="$(printf '%s' "$1" | tr '[:upper:]/_' '[:lower:]--' | tr -cd 'a-z0-9-')"
  hash="$(printf '%s' "$1" | shasum -a 256 | awk '{print substr($1,1,8)}')"
  prefix="$(printf '%s' "$normalized" | cut -c1-55)"
  printf '%s-%s\n' "${prefix:-branch}" "$hash"
}

LOCK_DIR="${REPO_ROOT}/.worktrees/.locks"
BRANCH_SLUG="$(branch_slug "$BRANCH")"
LOCK_PATH="${LOCK_DIR}/${BRANCH_SLUG}.lockdir"
mkdir -p "$LOCK_DIR"

if ! mkdir "$LOCK_PATH" 2>/dev/null; then
  if [ -f "$LOCK_PATH/owner" ]; then
    owner_host="$(awk -F= '$1=="host"{print $2}' "$LOCK_PATH/owner")"
    owner_pid="$(awk -F= '$1=="pid"{print $2}' "$LOCK_PATH/owner")"
    if [ "$owner_host" = "$(hostname)" ] && [ -n "$owner_pid" ] && ! kill -0 "$owner_pid" 2>/dev/null; then
      rm -rf "$LOCK_PATH"
      mkdir "$LOCK_PATH" || exit 75
    else
      echo "ERROR: branch '${BRANCH}' is already being created by another process" >&2
      cat "$LOCK_PATH/owner" >&2 || true
      exit 75
    fi
  else
    echo "ERROR: branch '${BRANCH}' is already being created by another process" >&2
    exit 75
  fi
fi

printf 'pid=%s\nhost=%s\nts=%s\nwt=%s\n' \
  "$$" "$(hostname)" "$(date -u +%FT%TZ)" "$WT_PATH" > "$LOCK_PATH/owner"
trap 'rm -rf "$LOCK_PATH"' EXIT
```

### 3.3 競合検出と stale 判定

- `mkdir` 失敗 → 待機せず即時 exit 75。
- stale 判定: `owner` の `host` が現在 host と一致し、かつ `kill -0 <pid>` が失敗する場合だけ削除可能。
- host が異なる場合は共有ファイルシステム上の別プロセスの可能性があるため自動削除しない。

### 3.4 解放

- 正常終了: `trap EXIT` で lockdir を削除。
- 異常終了: lockdir が残るため、次回起動時は stale 判定を行う。

### 3.5 macOS 互換性

`flock(1)` は macOS 標準にないため、正本は `mkdir` lockdir 方式とする。Linux などで `flock` を使う場合も optional 実装に留め、仕様上の受入条件は lockdir 方式で満たす。

---

## 4. shell state 分離（D-4）

### 4.1 PROMPT / PATH / 環境変数の per-worktree 化

1. **入場時のリセット**: `cd "$WT_PATH"` 直後に以下を必須化。
   ```bash
   mise trust --quiet
   mise install --quiet
   hash -r              # PATH キャッシュクリア
   ```
2. **PATH 重複防止**: ターミナルタブ派生時に `PATH` の前置 `mise shims` が累積しないよう、`mise activate` の代わりに `mise exec --` 経由を推奨（`CLAUDE.md` の既存運用と整合）。
3. **PROMPT 識別子**: zsh の `PROMPT` または `precmd` で `[wt:<name>]` を表示するスニペットを docs に提示（強制ではない、推奨）。
4. **direnv 連携**: `.envrc` を使う場合はワークツリーごとに `direnv allow` が必要であることを runbook に記載。

### 4.2 1Password 連携の維持

`scripts/with-env.sh` / `scripts/cf.sh` は worktree 内で動くため変更不要。ただし shell の `OP_SERVICE_ACCOUNT_TOKEN` が親シェルから引き継がれるケースを排除するため、Claude Code 起動前に `unset OP_SERVICE_ACCOUNT_TOKEN` するスニペットを docs サンプルに含める。

---

## 5. `scripts/new-worktree.sh` 改修方針

### 5.1 変更点（後続実装タスク向けの指示書）

| 区分 | 変更 |
| --- | --- |
| 追加 | §3 の lock 取得処理を冒頭に挿入 |
| 追加 | `BRANCH_SLUG` の生成ロジック（正規化 prefix + sha8）を関数化 |
| 追加 | symlink インベントリ取得（§1.2-1）を `--audit` フラグ付き時のみ実行 |
| 追加 | tmux session 自動作成は **opt-in**（`--with-tmux` フラグ）、デフォルト挙動は不変 |
| 不変 | `git worktree add -b "$BRANCH" "$WT_PATH" origin/main` |
| 不変 | `mise install` / `pnpm install` の順序 |

### 5.2 後方互換性

- 既存の呼び出し `bash scripts/new-worktree.sh feat/foo` は引き続き同じ結果になる（lock のみ追加、エラー時のみ早期終了）。
- 出力末尾の「✅ ワークツリー作成完了」ブロックの体裁は維持する。

---

## 6. NON_VISUAL evidence の取得手順（AC-4 / D-5）

Phase 11 で再現する手順。各コマンドの標準出力を `outputs/phase-11/manual-smoke-log.md` に貼る。

| 証跡 | コマンド | 期待 |
| --- | --- | --- |
| EV-1 skill symlink ゼロ | `find .claude/skills -type l \| wc -l` | `0` |
| EV-2 tmux global にリーク無し | `tmux show-environment -g \| grep -E '^UBM_WT_' \|\| true` | 何も出力されない |
| EV-3 tmux session-scope 注入 | `tmux show-environment -t ubm-<slug> \| grep -E '^UBM_WT_' \| wc -l` | `3` |
| EV-4 lock 競合即時失敗 | `bash scripts/new-worktree.sh feat/x` を 2 ターミナルで同時起動 | 後発が exit 75 |
| EV-5 lock メタ情報 | `cat .worktrees/.locks/feat-x-<sha8>.lockdir/owner` | `pid=` `host=` `ts=` `wt=` 4 行 |
| EV-6 worktree 作成成功 | `git worktree list` | 新 worktree が一覧に存在 |
| EV-7 mise バージョン | `mise exec -- node --version` | `v24.x.x` |

---

## 7. リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| macOS で `flock(1)` が無い | §3.5 フォールバック (mkdir) を併記。Phase 4 テスト設計で両方を扱う |
| 日本語パス（`個人開発`）で lock パスが破綻 | slug は ASCII のみ、lock ファイル名は branch 由来で path 不問 |
| 開発者が独自に skill symlink を再導入 | `.gitignore` ではなく `lefthook` の pre-commit で `find -type l` を検出する案を `task-git-hooks-lefthook-and-post-merge` に申し送り |
| tmux ユーザーがそもそも tmux を使わない | tmux 設計は opt-in。`--with-tmux` フラグなしでは何も起きない |
| 1Password トークンが親シェルから漏れる | §4.2 の `unset` を docs で明記。実装は別タスク（permissions decisive mode 系）と連携 |
| lock ファイル孤児化（hostname 異なる NFS など） | NFS は想定外。ローカル開発のみサポートと runbook に明記 |

---

## 8. 受け入れ条件への対応マトリクス

| AC | 対応セクション | 検証コマンド |
| --- | --- | --- |
| AC-1 skill symlink 撤去 | §1 | EV-1 |
| AC-2 tmux session-scoped state | §2 | EV-2, EV-3 |
| AC-3 gwt-auto lock | §3, §5 | EV-4, EV-5 |
| AC-4 NON_VISUAL evidence | §6 全体 | EV-1〜EV-7 |

---

## 9. 後続 Phase への申し送り

- Phase 3 レビューでは §8 マトリクスを起点に整合性を確認する。
- Phase 4 テスト設計では §3.5 の二系統（flock / mkdir）を分岐ケースとして扱う。
- Phase 5 ランブックでは §5.1 を実装変更点としてそのまま転記する。
- Phase 11 手動テストでは §6 EV-1〜EV-7 をログ化する。
