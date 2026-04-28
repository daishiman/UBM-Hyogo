# Phase 11: 手動 smoke ログ枠 — task-worktree-environment-isolation

## 0. 証跡方針

本タスクは `visualEvidence = NON_VISUAL`。証跡は **terminal output（標準出力・標準エラー）** と **file diff / file content** のみを採用し、screenshot は採用しない。各 EV について以下を記録欄に貼ること。

- 実行コマンド（コピー&ペースト可能形）
- 標準出力 / 標準エラー（必要に応じて整形）
- ファイル内容を確認する場合は `cat` / `find` の出力、または `git diff` の出力

---

## 1. 実行環境記録欄

実行者が手動 smoke を実施する直前に以下を記録する。

| 項目 | 値（記録欄） |
| --- | --- |
| 実施日時（ISO8601, UTC） | `_____` |
| 実施者 | `_____` |
| OS | macOS （バージョン: `_____`） / Linux（distro: `_____`） |
| Shell | zsh / bash（バージョン: `_____`） |
| tmux バージョン（tmux 利用時のみ） | `tmux -V` → `_____` |
| `flock(1)` の有無 | `command -v flock` → `_____`（あり / なし） |
| Node バージョン | `mise exec -- node --version` → `_____` |
| pnpm バージョン | `mise exec -- pnpm --version` → `_____` |
| リポジトリ root | `git rev-parse --show-toplevel` → `_____` |
| ワークツリー path | `_____` |

> NOTE: macOS で `flock` が無い場合、AC-3 は §3.5 mkdir フォールバックで検証する（Phase 10 go-no-go の条件）。

---

## 2. EV-1: skill symlink ゼロ確認（AC-1）

### 手順

```bash
cd "$(git rev-parse --show-toplevel)"
find .claude/skills -maxdepth 3 -type l \
  -exec sh -c 'for p; do printf "%s -> %s\n" "$p" "$(readlink "$p")"; done' sh {} +
find .claude/skills -type l | wc -l
```

### 期待結果

- 1 行目: 何も出力されない（symlink がインベントリに 0 件）
- 2 行目: `0`（空白あり）

### 記録欄

```
$ find .claude/skills -maxdepth 3 -type l -exec sh -c 'for p; do printf "%s -> %s\n" "$p" "$(readlink "$p")"; done' sh {} +
（出力を貼る）

$ find .claude/skills -type l | wc -l
（出力を貼る）
```

判定: PASS / FAIL（`_____`）

---

## 3. EV-2: tmux global へのリーク無し（AC-2）

### 手順

```bash
tmux show-environment -g | grep -E '^UBM_WT_' || echo '(no UBM_WT_* in global)'
```

### 期待結果

- `(no UBM_WT_* in global)` が出力される（grep にマッチなし）。

### 記録欄

```
$ tmux show-environment -g | grep -E '^UBM_WT_' || echo '(no UBM_WT_* in global)'
（出力を貼る）
```

判定: PASS / FAIL（`_____`）

---

## 4. EV-3: tmux session-scope に env が 3 件注入（AC-2）

### 前提

`scripts/new-worktree.sh --with-tmux` 等で tmux session を作成済み、もしくは以下のコマンドで手動作成。

```bash
SLUG="ev3-smoke"
WT_PATH="$(pwd)"
tmux new-session -d -s "ubm-${SLUG}" -c "$WT_PATH" \
  -e "UBM_WT_PATH=$WT_PATH" \
  -e "UBM_WT_BRANCH=feat/ev3-smoke" \
  -e "UBM_WT_SESSION=ubm-${SLUG}"
```

### 手順

```bash
tmux show-environment -t "ubm-${SLUG}" | grep -E '^UBM_WT_' | wc -l
tmux show-environment -t "ubm-${SLUG}" | grep -E '^UBM_WT_'
```

### 期待結果

- 1 行目: `3`
- 2 行目: `UBM_WT_PATH=...`, `UBM_WT_BRANCH=...`, `UBM_WT_SESSION=ubm-ev3-smoke` の 3 行

### 後始末

```bash
tmux kill-session -t "ubm-${SLUG}" 2>/dev/null || true
```

### 記録欄

```
$ tmux show-environment -t "ubm-${SLUG}" | grep -E '^UBM_WT_' | wc -l
（出力を貼る）

$ tmux show-environment -t "ubm-${SLUG}" | grep -E '^UBM_WT_'
（出力を貼る）
```

判定: PASS / FAIL（`_____`）

---

## 5. EV-4: lock 競合で後発が即時失敗（AC-3）

### 手順（2 ターミナル）

ターミナル A:

```bash
bash scripts/new-worktree.sh feat/ev4-smoke
```

ターミナル B（A の lock 取得直後にすぐ実行）:

```bash
bash scripts/new-worktree.sh feat/ev4-smoke ; echo "exit=$?"
```

### 期待結果

- ターミナル A: 通常通り完了。
- ターミナル B: `ERROR: branch 'feat/ev4-smoke' is already being created by another process` を含むエラー、`exit=75`。

### 記録欄

```
[ターミナル A] 出力
（貼る）

[ターミナル B] 出力
（貼る、exit code を含む）
```

判定: PASS / FAIL（`_____`）

> NOTE: macOS で `flock(1)` が無い環境では mkdir フォールバック方式での挙動を確認する（メッセージ文言は同等であること）。

---

## 6. EV-5: lock メタ情報フォーマット（AC-3）

### 手順

EV-4 実行直後（ターミナル B が exit する前）に別ターミナルで:

```bash
cat .worktrees/.locks/feat-ev4-smoke-<sha8>.lockdir/owner
```

### 期待結果

4 行で以下のキーを含む（順序は問わない）:

```
pid=<PID>
host=<hostname>
ts=<ISO8601 UTC>
wt=<worktree path>
```

### 記録欄

```
$ cat .worktrees/.locks/feat-ev4-smoke-<sha8>.lockdir/owner
（出力を貼る）
```

判定: PASS / FAIL（`_____`）

---

## 7. EV-6: worktree 作成成功（AC-1〜AC-3 共通）

### 手順

```bash
git worktree list
git worktree list | grep "feat/ev4-smoke" || echo "(not found)"
```

### 期待結果

- 一覧に `feat/ev4-smoke` を含む worktree path が存在する。

### 記録欄

```
$ git worktree list
（出力を貼る）
```

判定: PASS / FAIL（`_____`）

---

## 8. EV-7: mise / Node バージョン確認（D-4 shell state）

### 手順

```bash
cd .worktrees/<EV-4 で作成された wt-name>
mise exec -- node --version
mise exec -- pnpm --version
```

### 期待結果

- node: `v24.x.x`（`.mise.toml` 固定）
- pnpm: `10.x.x`

### 記録欄

```
$ mise exec -- node --version
（出力を貼る）

$ mise exec -- pnpm --version
（出力を貼る）
```

判定: PASS / FAIL（`_____`）

---

## 9. baseline / cleanup（C-3 対応）

Phase 3 C-3「既存 tmux セッションの env 汚染」確認用 baseline 取得。

```bash
# baseline
tmux list-sessions 2>/dev/null || echo "(no tmux server)"
tmux show-environment -g 2>/dev/null | wc -l

# 不要セッションのクリーンアップ（必要時のみ）
# tmux kill-session -t <name>
```

### 記録欄

```
（baseline / cleanup の実施記録を貼る）
```

---

## 10. 全体サマリ

| EV | AC 紐付け | 判定 |
| --- | --- | --- |
| EV-1 | AC-1 | `_____` |
| EV-2 | AC-2 | `_____` |
| EV-3 | AC-2 | `_____` |
| EV-4 | AC-3 | `_____` |
| EV-5 | AC-3 | `_____` |
| EV-6 | AC-1〜AC-3 共通 | `_____` |
| EV-7 | D-4（shell state） | `_____` |

総合判定: PASS / FAIL / N/A (docs-only のため後続実装タスクで実施) — `_____`

---

## 11. 申し送り

- 本ファイルは docs-only タスクのテンプレートである。実出力は後続実装タスク（task-worktree-environment-isolation の実装系派生 / lefthook タスク等）の Phase 11 で記録する。
- 記録欄が空のままでも本タスクの Phase 11 完了条件としては成立する（docs-only / NON_VISUAL のため、手順固定が完了基準）。
