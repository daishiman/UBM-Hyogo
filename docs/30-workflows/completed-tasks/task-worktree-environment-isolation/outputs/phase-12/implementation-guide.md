# Implementation Guide — task-worktree-environment-isolation

本ガイドは Phase 1〜11 の決定事項を「中学生でも読める Part 1」と「実装者向け Part 2」の二段で再構成したもの。コード変更は本 Phase では行わず、**後続実装タスクが本ガイドだけを見れば再現できる** ことを目標とする。

---

## Part 1: 初学者向け（中学生レベル）

なぜこの決まりが必要かというと、机を分けても道具やメモが混ざると別の人の作業を壊してしまうから。
何をするかというと、机ごとに道具を置き直し、同じ本を同時に取らないように錠前をかける。

### 1.1 比喩で理解する worktree

git worktree は、**一つのリポジトリの中で「複数の机」を同時に持てる仕組み** と考えるとわかりやすい。

- 一つの大きな図書館（リポジトリ本体）に、机が複数並んでいる。
- 机ごとに違う本（ブランチ）を広げて作業できる。
- どの机もしまわれている本棚（`.git`）は同じだが、机の上（作業ファイル）はそれぞれ独立している。

### 1.2 なぜ worktree を「分ける」必要があるのか

机を複数並べたとき、もし **隣の机のペンや消しゴムが机をまたいで勝手に動く** と、自分の作業が汚れて困る。worktree でも同じことが起きる。

- 隣の作業中の人が下書きしたメモ（環境変数）が、自分の机にもいつの間にか置かれている。
- 自分が「定規」と思って取った道具が、実は隣の机の物だった（symlink 経由で他リポジトリのスキルを掴んでしまう）。
- 同じ本を二人が同時に取ろうとして、本が破れる（同じブランチ名で同時に worktree を作ろうとして git が壊れる）。

これらが「混線（こんせん）」と呼ばれる現象。本タスクは **机と机の間に仕切り板を立てる** ための仕様書。

### 1.3 tmux と shell の混線とは

#### tmux の混線（電話の親子機の比喩）

tmux は **親機（サーバー）と子機（セッション）が複数つながった電話** に似ている。
親機にメッセージを録音すると、後からつながった子機すべてに同じメッセージが流れる。
これが「グローバル環境変数」。机 A で録音したメッセージが机 B にも流れて、机 B では「あれ、自分はこんなこと言ってない」となる。

対策は **「親機にはメッセージを録音せず、子機ごとに個別メモを渡す」**。具体的には `tmux -e KEY=VALUE` でセッション固有の環境変数だけを使う。

#### shell の混線（バトンの比喩）

ターミナルで `Cmd+T` を押して新しいタブを開くと、親タブの状態が「バトン」のように渡される。
このバトンには `PATH`（コマンドの探し場所）や `MISE_ENV`（Node のバージョン情報）が入っている。
別の机に移動したのに古いバトンを持ったままだと、その机のルール（Node 24）と違う道具（Node 18）でビルドしてしまう。

対策は **机に着いたら必ずバトンを置き直す**。`hash -r` でコマンドの記憶を消し、`mise install` でその机用の Node を入れ直す。

### 1.4 まとめ（中学生向け 3 行）

1. 机を分けるだけでは足りない。**机の上の道具と引き出し（環境変数・スキル定義）も分ける**。
2. 同じ本を二人で取らないように **錠前（lock ファイル）** をかける。
3. 作業の前後に「**この机ではこの道具を使う**」と毎回確認する手順を固定する。

### 今回作ったもの

今回は実際のスクリプトをまだ直さず、後で迷わず直せるように「設計図」と「点検表」を作った。

| 作ったもの | 中身 |
| --- | --- |
| 設計図 | 机ごとの道具、電話の親子機、錠前の使い方を決めた |
| 点検表 | 本当に混線しないかを後で確認するコマンド一覧 |
| 申し送り | 実際にスクリプトを直す後続タスク |

---

## Part 2: 技術者向け

### TypeScript 契約

本タスクは shell / docs の設計だが、後続実装タスクで検証結果を扱う場合の型契約を以下に固定する。

```ts
export type WorktreeEvidenceId = "EV-1" | "EV-2" | "EV-3" | "EV-4" | "EV-5" | "EV-6" | "EV-7";

export interface WorktreeLockOwner {
  pid: string;
  host: string;
  ts: string;
  wt: string;
}

export interface WorktreeIsolationEvidence {
  id: WorktreeEvidenceId;
  command: string;
  expected: string;
  actual?: string;
  status: "pending" | "pass" | "fail";
}
```

### CLIシグネチャ

```bash
bash scripts/new-worktree.sh <branch> [--with-tmux] [--audit]
UBM_LOCK_MODE=mkdir bash scripts/new-worktree.sh <branch>
UBM_LOCK_MODE=flock bash scripts/new-worktree.sh <branch>
```

### 使用例

```bash
bash scripts/new-worktree.sh feat/worktree-isolation --audit
bash scripts/new-worktree.sh feat/worktree-isolation --with-tmux
```

### エラーハンドリング

| エラー | 扱い |
| --- | --- |
| 同名 branch の lock 取得失敗 | 待機せず exit 75。`owner` を stderr に出す |
| stale lock | 同一 host かつ pid 不在の場合だけ削除して再取得 |
| tmux session 既存 | 再利用せず exit 1 |
| untracked skill symlink | `git rm` ではなく `rm` で削除 |

### エッジケース

| ケース | 方針 |
| --- | --- |
| macOS で `flock(1)` がない | `mkdir` lockdir を正本にする |
| 日本語 path | lockdir 名は ASCII slug、`owner.wt` だけ UTF-8 path を保持 |
| 長い branch 名 | `<prefix-55>-<sha8>` に切り詰める |
| 秒単位 timestamp の `WT_NAME` 衝突 | `task-${BRANCH_SLUG}-wt` を基本形にし、既存時だけ乱数を足す |

### 設定項目と定数一覧

| 名前 | 値/形式 | 説明 |
| --- | --- | --- |
| `LOCK_DIR` | `${REPO_ROOT}/.worktrees/.locks` | lockdir 親ディレクトリ |
| `LOCK_PATH` | `${LOCK_DIR}/${BRANCH_SLUG}.lockdir` | branch ごとの排他 lock |
| `owner` | `pid` / `host` / `ts` / `wt` | stale 判定用 metadata |
| `UBM_LOCK_MODE` | `mkdir` / `flock` | default は `mkdir` |
| `UBM_WT_*` | `PATH` / `BRANCH` / `SESSION` | tmux session-scoped env |

### テスト構成

| 層 | 対象 |
| --- | --- |
| Phase 4 | branch slug、stale lock、macOS find 互換、tmux env のテスト設計 |
| Phase 11 | EV-1〜EV-7 の NON_VISUAL evidence 取得テンプレート |
| 後続実装タスク | `scripts/new-worktree.sh` 実測、同名並列起動、tmux opt-in、symlink audit |

### 2.1 設計決定 D-1〜D-4 の実装ポイント

#### D-1: skill symlink 撤去（AC-1）

| 観点 | 指示 |
| --- | --- |
| インベントリ取得 | macOS/BSD find 互換の `find .claude/skills -maxdepth 3 -type l -exec sh -c 'for p; do printf "%s -> %s\n" "$p" "$(readlink "$p")"; done' sh {} +` を実行し、Phase 11 ログに保存 |
| 撤去手段 | tracked symlink は `git rm`、untracked symlink は `rm` で除去。撤去後は **実ファイルコミット** または **グローバル `~/.claude/skills/` 単独配置** のいずれか |
| 検証 | `find .claude/skills -type l \| wc -l` が `0` |
| Rollback | インベントリ出力を元に `ln -s` で再作成可能。実装は別タスク（git-hooks）の pre-commit hook で再発防止 |

#### D-2: tmux session-scoped state（AC-2）

```tmux
# ~/.tmux.conf に追記する想定（実装は別タスク）
set-option -g update-environment "SSH_AUTH_SOCK SSH_CONNECTION DISPLAY"
```

```bash
# new-worktree.sh の --with-tmux フラグで実行
SLUG="$(branch_slug "$BRANCH")"
tmux new-session -d -s "ubm-${SLUG}" -c "$WT_PATH" \
  -e "UBM_WT_PATH=$WT_PATH" \
  -e "UBM_WT_BRANCH=$BRANCH" \
  -e "UBM_WT_SESSION=ubm-${SLUG}"
```

注意: 同名セッションが既存の場合は `tmux has-session -t "ubm-${SLUG}"` で検出して即時 exit。再利用は禁止。

#### D-3: gwt-auto lock（AC-3）

`scripts/new-worktree.sh` の **冒頭（`git fetch origin main` の前）** に挿入する。

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
      echo "ERROR: branch '${BRANCH}' is already being created" >&2
      cat "$LOCK_PATH/owner" >&2 || true
      exit 75
    fi
  else
    echo "ERROR: branch '${BRANCH}' is already being created" >&2
    exit 75
  fi
fi

printf 'pid=%s\nhost=%s\nts=%s\nwt=%s\n' \
  "$$" "$(hostname)" "$(date -u +%FT%TZ)" "$WT_PATH" > "$LOCK_PATH/owner"
trap 'rm -rf "$LOCK_PATH"' EXIT
```

`.gitignore` に `/.worktrees/` が既に含まれていることを Phase 5 ランブックで確認する（C-2）。

#### D-4: shell state 分離

```bash
# worktree 入場時の必須テンプレ（runbook に明記）
cd "$WT_PATH"
unset OP_SERVICE_ACCOUNT_TOKEN   # 親シェルからの漏れ防止
hash -r                          # PATH キャッシュクリア
mise trust --quiet
mise install --quiet
```

`mise activate` ではなく `mise exec --` 経由で常に実行（CLAUDE.md 既存運用と整合）。

### 2.2 EV-1〜EV-7 の証跡取得手順

| 証跡 | コマンド | 期待出力 | 取得タイミング |
| --- | --- | --- | --- |
| EV-1 | `find .claude/skills -type l \| wc -l` | `0` | symlink 撤去後 |
| EV-2 | `tmux show-environment -g \| grep -E '^UBM_WT_' \|\| true` | 何も出ない | tmux 設定変更後 |
| EV-3 | `tmux show-environment -t ubm-<slug> \| grep -E '^UBM_WT_' \| wc -l` | `3` | new-worktree --with-tmux 後 |
| EV-4 | 2 ターミナルで同時に `bash scripts/new-worktree.sh feat/x` | 後発が exit 75 | lock 実装後 |
| EV-5 | `cat .worktrees/.locks/feat-x-<sha8>.lockdir/owner` | `pid=` `host=` `ts=` `wt=` 4 行 | EV-4 と同時 |
| EV-6 | `git worktree list` | 新 worktree が一覧に存在 | new-worktree 成功後 |
| EV-7 | `mise exec -- node --version` | `v24.x.x` | 入場時 |

すべて `outputs/phase-11/manual-smoke-log.md` に貼り付ける。

### 2.3 `scripts/new-worktree.sh` の変更箇所

| 行（現状） | 変更 |
| --- | --- |
| L7 直後 | `BRANCH_SLUG` 生成 + lock 取得（D-3 のスニペット）を挿入 |
| WT path 決定 | `WT_NAME="task-${BRANCH_SLUG}-wt"` を基本形とし、既存パスがある場合だけ短い乱数または `mktemp -d` 相当で衝突回避 |
| L18 `git fetch origin main` | 不変 |
| L21 `git worktree add -b` | 不変 |
| L25 `cd "$WT_PATH"` | 不変 |
| L28-34 mise/pnpm install | 直前に `unset OP_SERVICE_ACCOUNT_TOKEN; hash -r` を追加（D-4） |
| 末尾 | `--with-tmux` フラグの opt-in 処理を追加（D-2、デフォルトは現挙動維持） |
| 末尾 | `--audit` フラグで `find .claude/skills -type l` を実行する分岐を追加（D-1 補助） |

後方互換性: `bash scripts/new-worktree.sh feat/foo` は引き続き同じ結果になる（lock 取得が追加されるが、同名ブランチ並列起動時のみエラー）。

### 2.4 failure-cases への対処（Phase 6 連携）

| ケース | 対処 |
| --- | --- |
| `flock(1)` が無い macOS 環境 | 正本が mkdir lockdir のため追加依存なし。`flock` は Linux での optional 案内のみ |
| 同名ブランチで並列起動 | 後発が exit 75 + stderr に既存 lock のメタ情報出力 |
| 日本語パス（`個人開発/`）で lock パス展開 | lockdir 名は `BRANCH_SLUG`（ASCII のみ）由来。クォートは `"$LOCK_PATH"` で確実化 |
| `BRANCH_SLUG` が 64 文字超のブランチ | `<prefix-55>-<sha8>` で切り詰め、同一prefix衝突を回避 |
| stale lockdir | `trap` で削除。kill -9 等で残存した場合は owner の host / pid を確認し、同一hostかつpid不在のときだけ `rm -rf .worktrees/.locks/<slug>-<sha8>.lockdir` |
| tmux 既存セッション汚染 | 既存セッションは破棄して再作成。Phase 11 baseline 取得 → kill → new-session の手順を `manual-smoke-log.md` に固定 |

### 2.5 後続実装タスクへの引き渡し

- 本タスクは **docs-only**。`scripts/new-worktree.sh` の編集・コミットは行わない。
- 実装は `task-git-hooks-lefthook-and-post-merge`（symlink 検出 hook）と、別途切られる「new-worktree.sh 改修タスク」で行う（[`unassigned-task-detection.md`](./unassigned-task-detection.md) 参照）。
- 本ガイドのスニペットは **そのままコピペで動く前提** で書いてあるため、実装タスク側は文言改変を最小限にすること。
