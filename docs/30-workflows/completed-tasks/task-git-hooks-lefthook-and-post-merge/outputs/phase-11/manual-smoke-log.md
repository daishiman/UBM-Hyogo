# Phase 11 — manual-smoke-log.md

## Status

completed

## 使い方

本タスク（`feat/git-hooks-lefthook` 等）の検証担当者が、ワークツリーで以下手順を順に実行し、各ステップの「期待出力」と実際の出力を照合する。stdout / `git status` の結果を **そのままテキストとして** 「実測」欄に貼り付ける。本ファイルは実行ログのテンプレートとして再利用される（コミット時は実測欄を埋めた状態でコミット）。

> **screenshot は不要**。hook 出力は CLI テキストに閉じる（`outputs/phase-11/main.md` 証跡メタ参照）。

## 環境前提

| 項目 | 値 |
| --- | --- |
| Node | 24.x（mise 経由） |
| pnpm | 10.x（mise 経由） |
| OS | macOS / Linux（zsh / bash） |
| 検証 worktree | `feat/git-hooks-lefthook` 系の任意の worktree |

## Step 1: lefthook install の自動化確認

```bash
mise exec -- pnpm install
```

**期待出力（要旨）:**

- `prepare` script が走り、`lefthook install` のメッセージが流れる

**確認コマンド:**

```bash
head -3 .git/hooks/pre-commit
head -3 .git/hooks/post-merge
```

**期待:** 各 hook ファイルの先頭に `# LEFTHOOK file. DON'T EDIT.` 等の lefthook 由来ヘッダが含まれる。

**実測:** _（ここに実出力を貼る）_

---

## Step 2: lefthook run pre-commit dry-run

```bash
mise exec -- pnpm lefthook run pre-commit --all-files
```

**期待:** `staged-task-dir-guard` lane が実行され exit 0（branch ↔ task-dir が整合している場合）。整合しない場合は fail_text のメッセージが出る。

**実測:** _（ここに実出力を貼る）_

---

## Step 3: post-merge で indexes diff が出ないこと

```bash
git status                                  # 事前 clean 確認
git merge origin/main --no-edit             # main を取り込み
git status                                  # 事後 clean 確認
ls -la .claude/skills/aiworkflow-requirements/indexes/
git diff --name-only HEAD@{1} HEAD          # 直前 merge の差分
```

**期待:**

- `git merge` 後の `git status` が `nothing to commit, working tree clean`
- `indexes/keywords.json` / `indexes/topic-map.md` が **diff に含まれない**
- post-merge 通知（stale worktree info）が stdout に出る（read-only）

**実測:** _（ここに実出力を貼る）_

---

## Step 4: 明示 rebuild のみ indexes が更新される

```bash
mise exec -- pnpm indexes:rebuild
git status
```

**期待:** `indexes/*.json` / `topic-map.md` が更新差分として現れる（明示実行したときのみ）。

**実測:** _（ここに実出力を貼る）_

---

## Step 5: 既存 worktree 一括再 install

```bash
for wt in $(git worktree list --porcelain | awk '/^worktree /{print $2}'); do
  if [ -d "$wt/.git" ] || [ -f "$wt/.git" ]; then
    ( cd "$wt" && mise exec -- pnpm lefthook install ) || echo "skip: $wt"
  fi
done
```

**期待:** prunable / detached HEAD は skip。残り全件で `synced hooks` 等のメッセージ。失敗 0 件。

**実測:** _（ここに実出力を貼る）_

---

## Step 6: `generate-index.js` 依存切離し grep

```bash
grep -nE '(generate-index|aiworkflow-requirements/scripts)' lefthook.yml scripts/hooks/*.sh || echo OK
```

**期待:** `OK`（ヒット 0 件）。hook 経路から `generate-index.js` への参照が完全に切れている。

**実測:** _（ここに実出力を貼る）_

---

## 完了判定

全 Step の「期待」と「実測」が一致した場合のみ Phase 11 を完了扱いとする。1 つでも乖離があれば Phase 5 runbook / Phase 8 before-after に差し戻す。
