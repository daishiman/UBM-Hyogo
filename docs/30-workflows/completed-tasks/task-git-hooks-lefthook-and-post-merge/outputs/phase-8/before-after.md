# Phase 8 — Before / After

## Status

completed

## 概要

旧運用（`.git/hooks/*` 直書き + post-merge 自動再生成）から、新運用（`lefthook.yml` 集約 + 通知 read-only）への移植を表形式で整理する。

## 1. 設定ファイル（yaml 1 本）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| Hook の install 経路 | 開発者が手動コピー / `cp scripts/hooks/* .git/hooks/` | `pnpm install` 後の `prepare` script で `lefthook install` 自動実行 | idempotent な install。新規 worktree でも自動配置される。 |
| `.git/hooks/*` の編集ポリシー | 直接編集される（運用上の手書き） | lefthook の生成物として手動編集禁止。ヘッダ行で lefthook 由来を識別可能 | 派生物の編集禁止により設定ドリフトを防止。 |

## 2. shell スクリプト（移植 2 本）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `pre-commit`（branch ↔ task-dir 整合チェック） | `.git/hooks/pre-commit` 内に inline shell | `scripts/hooks/staged-task-dir-guard.sh` にスクリプト化し、`lefthook.yml :: pre-commit :: staged-task-dir-guard` から呼ぶ | 同等ロジックをスクリプト化。yaml inline を避け diff 粒度を確保（ADR-03）。 |
| `post-merge`（後半・stale worktree 通知） | `.git/hooks/post-merge` 後半に inline shell（前半の indexes 再生成と密結合） | `scripts/hooks/stale-worktree-notice.sh post-merge` に分離し、引数で hook 種別を受け取る | 前半（書き込み副作用）と後半（read-only 通知）を分離。後半のみ残す。 |

## 3. post-merge `indexes/*.json` 再生成（削除）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` の再生成 | `.git/hooks/post-merge` が `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` を無条件で実行 | **post-merge からは呼ばない**。明示コマンド `pnpm indexes:rebuild` で開発者がオプトイン実行 | merge=ours で温存したい indexes が即再生成され、無関係 PR に diff (~600 行) が混入するため。直近 PR #125 / #127 で実測。 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` の再生成 | 同上（post-merge で連動再生成） | 同上（明示コマンドのみ） | 上に同じ。 |
| 古い indexes が main にマージされるリスク | post-merge 任せで保証なし | CI 側 `verify-indexes-up-to-date` job で HEAD と diff し fail させる（派生タスク化、Phase 12 unassigned-task-detection） | authoritative ゲートを CI に移動。local hook は速度のための補助に格下げ。 |
| `generate-index.js` への依存 | post-merge から強制呼び出し | post-merge からは呼ばない（依存切離し）。skill 側からは引き続き利用可能 | hook と skill の責務分離。lefthook lane に node 呼び出しを残さない。 |

## 4. 補助運用

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `scripts/new-worktree.sh` | `pnpm install` までで終了 | 末尾で `pnpm install` 実行時に `prepare` script 経由で `lefthook install` が走る（追加コマンド不要） | 新規 worktree 作成時に hook 配置忘れを構造的に防ぐ。 |
| `lefthook-local.yml` | 存在しない | `.gitignore` に追加し、開発者個別の override を許容 | 個別チューニングを正本 yaml に混入させない。 |
| `package.json` scripts | `prepare` 未定義 / `indexes:rebuild` 未定義 | `prepare: lefthook install` / `indexes:rebuild: node ...generate-index.js` を追加 | install 自動化と再生成オプトインの両立。 |
