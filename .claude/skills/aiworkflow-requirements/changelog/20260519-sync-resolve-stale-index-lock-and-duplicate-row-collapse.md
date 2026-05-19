# dev sync — sync:resolve stale `index.lock` 復旧 / 既存行と重複する HEAD 行の畳み込み (2026-05-19)

`fix/parallel-i06-root-error-focus` に `origin/dev` を取り込んだ際、`pnpm sync:resolve` の途中失敗で `index.lock` が残置され、再実行が継続的に失敗した。さらに 3-way diff block の HEAD 行が、コンフリクト直前の already-merged 行と意味重複する pattern が発生した。

## 発生 conflict
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json` / `indexes/topic-map.md` — resolver の union / `--ours + rebuild` 既知 path（自動解消）
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md`
  - 3-way diff block 2 箇所（line 24-31, 90-97）。HEAD 側に i06 行、dev 側に i07 更新行を追加
  - **HEAD の i06 行は、conflict ブロック直前（line 23 / line 89）に既出**で、worktree のローカル feature commit が同情報を再付与したことによる意味重複

## 発生事象
1. 初回 `pnpm sync:resolve` 実行中に `--ours` 適用直前で fatal: `Unable to create '.../index.lock': File exists.`
2. 別 git 操作の痕跡なし。残置 lock は前 resolver 自身の中断によるもの
3. `pnpm sync:resolve` 再実行可能だが、`index.lock` が消えないと derived files の checkout が `--ours` 適用に失敗し続ける

## 解消経路
1. **stale index.lock 除去**: `GITDIR=$(git rev-parse --git-dir); rm -f "$GITDIR/index.lock"` を実行（worktree の場合 `.git` はファイルなので `git rev-parse --git-dir` 経由必須）
2. `pnpm sync:resolve` 再実行 → union / `--ours` path は自動完了、`improvements/integration-fixes/index.md` のみ unhandled に残置
3. **重複行 collapse**: HEAD ブロックが既出行と意味重複する場合は **dev 側のみを採用し HEAD ブロックを破棄**（行レベル `git diff dev...HEAD` で既出を grep 検証）
4. `git add -A` → `git commit -m "merge: sync <branch> with dev"`
5. `pnpm indexes:rebuild` → `pnpm typecheck` → `pnpm lint`

## 再確認した不変
- worktree 配下では `.git` はテキストファイル (`gitdir: ...`) のため、stale lock の path は `git rev-parse --git-dir` 経由で解決する。`.git/index.lock` 直書きは worktree で動かない
- 3-way diff block の HEAD 行が already-merged region と重複する場合、L-DEVSYNC-012「両側採用」を機械適用すると行が二重化する。**HEAD ブロックの各行を conflict 直前の merged 領域に対し grep で重複検出してから採用判断**する
- `pnpm sync:resolve` が unhandled として残す系（lessons-learned / improvements docs）は手動解消後、必ず `pnpm indexes:rebuild` を続行する

## 適用先
- このスキル: `references/task-workflow-active.md` の dev sync section に worktree stale lock 復旧手順を追記候補（運用 SOP として既存 lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md に L-DEVSYNC-019 を増設）
- `task-specification-creator` skill: 並列 changelog を追加し、duplicate-row collapse 判定基準を共有
