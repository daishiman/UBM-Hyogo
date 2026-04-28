# Phase 11: 手動テスト（NON_VISUAL / docs-only walkthrough）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 自動生成 skill ledger の gitignore 化 (skill-ledger-a1-gitignore) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動テスト（spec walkthrough） |
| 作成日 | 2026-04-28 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| タスク種別 | **docs-only / NON_VISUAL / infrastructure_governance** |
| user_approval_required | false |

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- **taskType: docs-only**
- 判定理由:
  - 本ワークフローは「タスク仕様書作成」までを成果物とする docs-only タスクであり、UI / Renderer / 画面遷移の差分は一切発生しない。
  - 実 `.gitignore` 適用 / `git rm --cached` 実行 / hook 配置は Phase 5 以降の別 PR で行う前提のため、本 Phase で触る実体は markdown / artifacts.json のみ。
  - したがって screenshot による視覚証跡は不要。`.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` の代替 evidence プレイブックを適用する。
- **`outputs/phase-11/screenshots/` ディレクトリは作成しない**（NON_VISUAL のため `.gitkeep` 含め一切作らない）。
- **本 Phase は「実地操作不可」**: 4 worktree 並列再生成 smoke / `git rm --cached` 実走 / hook idempotency 検証は本ワークフローのスコープ外であり、Phase 5 以降の実装 PR で実走される。本 Phase ではコマンド系列の仕様レベル固定と spec walkthrough のみを行う。

## 必須 outputs（docs-only / spec_created Phase 11 の代替証跡 3 点）

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-11/main.md` | Phase 11 walkthrough のトップ index。NON_VISUAL 代替 evidence プレイブック（L1/L2/L3/L4）の適用結果を記録 |
| `outputs/phase-11/manual-smoke-log.md` | 4 worktree 並列再生成 smoke の実行コマンド一覧（status: NOT EXECUTED — Phase 5 以降の別 PR で実走） |
| `outputs/phase-11/link-checklist.md` | 仕様書間の参照リンク健全性チェック（index.md / phase-NN.md / outputs / 上流 runbook） |

## 目的

Phase 1〜10 で固定された仕様（base case = gitignore + untrack + hook 冪等化）に対し、docs-only / NON_VISUAL 代替 evidence プレイブックを適用して spec walkthrough を実施し、以下を確定する。

1. 仕様書の自己完結性（前提・AC・成果物パス）が満たされている
2. 4 worktree 並列再生成 smoke のコマンド系列が Phase 2 で固定された通りに manual-smoke-log.md で再現可能な形に展開されている
3. 全リンク（index.md ↔ phase-NN.md ↔ outputs ↔ 上流 runbook）が健全である
4. NON_VISUAL の限界（runtime / 並列性 / file system race）を明示し、保証できない範囲を Phase 12 unassigned-task-detection.md へ申し送る

依存成果物として Phase 6 の fail path、Phase 7 の coverage map、Phase 8 の DRY 化方針、Phase 9 の品質保証、Phase 10 の GO/NO-GO 判定を確認し、本 Phase 11 は実走ではなく walkthrough とコマンド仕様固定に限定する。

## 実行タスク

1. NON_VISUAL 代替 evidence 差分表（L1/L2/L3/L4）を `outputs/phase-11/main.md` に作成する（完了条件: 4 階層が漏れなく記述）。
2. 4 worktree 並列再生成 smoke のコマンド一覧を `outputs/phase-11/manual-smoke-log.md` に NOT EXECUTED ステータスで列挙する（完了条件: Phase 2 §smoke コマンド系列が網羅されている）。
3. spec walkthrough を実施し、phase-01〜phase-13 / index.md / artifacts.json / outputs/* 間の参照リンクを `outputs/phase-11/link-checklist.md` に記録する（完了条件: 全リンクが OK / Broken で表記されている）。
4. 「実地操作不可」を `main.md` 冒頭に明記する（完了条件: docs-only / NON_VISUAL / spec_created の 3 ラベル明示）。
5. 保証できない範囲（hook 実行時 race / `pnpm indexes:rebuild` 失敗時挙動 / `git merge --no-ff` での実派生物 conflict）を Phase 12 申し送り候補として列挙する（完了条件: 最低 3 項目）。

## NON_VISUAL 代替 evidence の 4 階層（本タスク適用版）

| 階層 | 代替手段 | 何を保証するか | 何を保証できないか（→ 申し送り先） |
| --- | --- | --- | --- |
| **L1: 型** | `.gitignore` に追記する glob パターンの shell-glob 構文検証（`git check-ignore -v <path>` の dry walkthrough） | glob が target ファイル系列にマッチする「型」 | 実 untrack 後の hook 再生成挙動 |
| **L2: lint / boundary** | `lefthook.yml` の post-commit / post-merge guard が「tracked canonical を書かない」boundary になっていることを spec レベルで読み取り検証 | hook の「書込先 = 派生物のみ」境界の静的整合 | 実走時のファイルシステム race / idempotency |
| **L3: in-memory test** | 4 worktree 並列再生成 smoke の **コマンド系列を仕様レベルで固定**（manual-smoke-log.md に NOT EXECUTED で列挙） | 「再現する手順」の網羅性 | 並列実行下の OS-level lock / inode 衝突 |
| **L4: 意図的 violation snippet** | わざと `LOGS.md`（A-2 で fragment 化される正本）を target glob に含めてしまうケースを spec walkthrough で red 確認 | 「赤がちゃんと赤になる」(A-2 未完了下での履歴喪失検出) | （L4 自体は green 保証ではない） |

## 4 worktree 並列再生成 smoke コマンド系列（NOT EXECUTED）

> 本 Phase では実走しない。Phase 5 実装ランブックの完了後に別 PR で走らせる前提。
> ここで列挙するのはコマンドの「仕様レベル固定」のみであり、実行ログは取得しない。

```bash
# (1) 4 worktree を新規作成（既存ベース main 同期込み）
bash scripts/new-worktree.sh feat/skill-ledger-smoke-1
bash scripts/new-worktree.sh feat/skill-ledger-smoke-2
bash scripts/new-worktree.sh feat/skill-ledger-smoke-3
bash scripts/new-worktree.sh feat/skill-ledger-smoke-4

# (2) 各 worktree で並列に派生物再生成
( cd .worktrees/<smoke-1> && mise exec -- pnpm indexes:rebuild ) &
( cd .worktrees/<smoke-2> && mise exec -- pnpm indexes:rebuild ) &
( cd .worktrees/<smoke-3> && mise exec -- pnpm indexes:rebuild ) &
( cd .worktrees/<smoke-4> && mise exec -- pnpm indexes:rebuild ) &
wait

# (3) 4 worktree を main へ no-ff merge
git -C .worktrees/<smoke-1> checkout main
git -C .worktrees/<smoke-1> merge --no-ff feat/skill-ledger-smoke-1
git -C .worktrees/<smoke-2> checkout main
git -C .worktrees/<smoke-2> merge --no-ff feat/skill-ledger-smoke-2
git -C .worktrees/<smoke-3> checkout main
git -C .worktrees/<smoke-3> merge --no-ff feat/skill-ledger-smoke-3
git -C .worktrees/<smoke-4> checkout main
git -C .worktrees/<smoke-4> merge --no-ff feat/skill-ledger-smoke-4

# (4) 派生物由来の conflict が 0 件であることを確認
git ls-files --unmerged | wc -l
# 期待値: 0
```

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-02.md | smoke コマンド系列の正本 |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-03.md | open question #2（smoke 失敗時切り分け）の受け皿 |
| 必須 | .claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md | L1〜L4 プレイブックの正本 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase11.md | docs-only / spec_created Phase 11 必須 3 outputs |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-11.md | NON_VISUAL Phase 11 構造例 |

## 実行手順

1. NON_VISUAL 代替 evidence の 4 階層を `outputs/phase-11/main.md` へ記録する。
2. 4 worktree smoke コマンド系列を `manual-smoke-log.md` に NOT EXECUTED として記録する。
3. `link-checklist.md` で index / phase / outputs / 上流 runbook の参照を確認する。

## 統合テスト連携

本 Phase は docs-only のため smoke を実走しない。Phase 5 以降の実装 PR で T4 として同じコマンド系列を実走する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| walkthrough | outputs/phase-11/main.md | NON_VISUAL 代替 evidence の記録 |
| smoke log | outputs/phase-11/manual-smoke-log.md | 4 worktree smoke の NOT EXECUTED コマンド系列 |
| link check | outputs/phase-11/link-checklist.md | 仕様書間リンク確認 |

## 完了条件

- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 ファイルが揃っている
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）
- [ ] NON_VISUAL 代替 evidence 差分表（L1/L2/L3/L4）が `main.md` に記載
- [ ] 4 worktree 並列再生成 smoke のコマンド系列が `manual-smoke-log.md` に NOT EXECUTED ステータスで網羅
- [ ] spec walkthrough のリンク健全性が `link-checklist.md` に OK/Broken で記録
- [ ] 「実地操作不可」が `main.md` 冒頭で明記されている
- [ ] 保証できない範囲が Phase 12 申し送り候補として最低 3 項目列挙

## 検証コマンド

```bash
# 必須 3 ファイルの存在
ls docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-11/
# main.md / manual-smoke-log.md / link-checklist.md の 3 件のみ

# screenshots/ が存在しないこと
test ! -d docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-11/screenshots && echo OK

# 「NOT EXECUTED」が manual-smoke-log.md に明記されていること
rg -n "NOT EXECUTED" docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-11/manual-smoke-log.md
```

## 苦戦防止メモ

1. **screenshots/ を作らない**: NON_VISUAL タスクで `.gitkeep` を作ると validator が VISUAL と誤判定する。
2. **「実走した」と書かない**: 本 Phase は spec walkthrough。manual-smoke-log.md には必ず `NOT EXECUTED` ステータスを残す。
3. **runtime 振る舞いまでカバーしたと主張しない**: L1〜L3 は型 / boundary / in-memory までしか保証しない。並列 race や inode 衝突は Phase 5 実走 PR の責務。
4. **L4（意図的 violation）の省略禁止**: A-2 未完了下での履歴喪失リスクが「赤になる」ことを spec walkthrough 上で必ず確認する。

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - L3/L4 で発見した「保証できない範囲」を `unassigned-task-detection.md` に転記
  - smoke コマンド系列を `implementation-guide.md` Part 2 に再掲
  - link-checklist.md の Broken 項目があれば Phase 12 で同 sprint 修正
- ブロック条件:
  - `screenshots/` ディレクトリが誤って作成されている
  - manual-smoke-log.md が「実走済」と誤記している
  - link-checklist.md が空（spec walkthrough 未実施）
