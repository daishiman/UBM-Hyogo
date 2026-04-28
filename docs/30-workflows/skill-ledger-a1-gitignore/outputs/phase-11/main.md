# Phase 11: 手動テスト結果（NON_VISUAL / docs-only walkthrough）

## ラベル

- **taskType**: docs-only
- **visualEvidence**: NON_VISUAL
- **state**: spec_created
- **実地操作**: 不可（本ワークフローは仕様書作成までで完結。実 `.gitignore` 適用 / `git rm --cached` / hook 配置 / 4 worktree 並列再生成 smoke は Phase 5 以降の別 PR で実走）

## 実施概要

| 項目 | 内容 |
| --- | --- |
| 実施日時 | 2026-04-28 |
| 実施者 | Claude Code（worktree branch: 現行 worktree 名） |
| 実施方式 | spec walkthrough + NON_VISUAL 代替 evidence プレイブック L1〜L4 適用 |
| screenshot | **作成しない**（NON_VISUAL のため `outputs/phase-11/screenshots/` ディレクトリ不在） |
| 主証跡ソース | spec walkthrough + 仕様書間リンク健全性 + コマンド系列の仕様レベル固定 |

## NON_VISUAL 代替 evidence 差分表

| Phase 11 シナリオ | 元前提 | 代替手段 | カバー範囲 | 申し送り先 |
| --- | --- | --- | --- | --- |
| S-1: `.gitignore` glob match 確認 | 実 `git check-ignore -v <path>` 実走 | **L1 型**: glob 構文 spec walkthrough（`/.claude/skills/*/indexes/keywords.json` 等の shell-glob 文法整合確認） | glob が target ファイル系列にマッチする「型」 | Phase 5 実走 PR で `git check-ignore -v` 実行 |
| S-2: hook が canonical を書かない境界確認 | lefthook 実行 + 実ファイル監視 | **L2 lint-boundary**: `lefthook.yml` の post-commit / post-merge guard を spec レベルで読解（「派生物のみ書込・存在 → スキップ」の冪等パターン整合確認） | hook の書込先 boundary の静的整合 | T-6 hooks 実装 PR の hook 単体テスト |
| S-3: 4 worktree 並列再生成 smoke | 実 worktree 作成 + 並列 rebuild + merge | **L3 in-memory test**: コマンド系列を `manual-smoke-log.md` で NOT EXECUTED 列挙（再現手順の網羅性確認） | 「再現手順」の網羅性 | Phase 5 実装ランブック完了後の実走 PR |
| S-4: A-2 未完了下の履歴喪失検出 | 実シナリオ再現 | **L4 意図的 violation**: わざと `LOGS.md`（A-2 fragment 化対象正本）を target glob に含める仮説で red 確認の spec walkthrough | 「赤がちゃんと赤になる」（順序事故が検出可能であること） | Phase 3 NO-GO 条件として固定済み |

## 4 階層が保証する範囲 / 保証できない範囲

| 階層 | 保証 | 保証できない（→ 申し送り） |
| --- | --- | --- |
| L1 型 | shell-glob 構文 / target 系列マッチ | 実 untrack 後の hook 再生成挙動 |
| L2 lint-boundary | hook 書込境界の静的整合 | 実走時 file system race / inode 衝突 / idempotency |
| L3 in-memory test | コマンド系列の網羅性 | 並列実行下の OS-level lock |
| L4 violation | 「赤になる」確認（順序事故検出） | green 保証ではない |

## 保証できない範囲（Phase 12 unassigned-task-detection.md への申し送り候補）

1. **hook 実行時の file system race**: 4 worktree 並列で `pnpm indexes:rebuild` が同一 inode を書き込む際の挙動。Phase 5 実走 PR で観測する。
2. **`pnpm indexes:rebuild` 失敗時の派生物部分書込**: 中断時に半端な JSON が残る場合のリカバリ手順。Phase 5 / 11 実走で確認。
3. **`git merge --no-ff` での実派生物 conflict 件数**: 仕様レベルでは「期待値 0」と固定したが、実走で 1 件でも出れば Phase 2 設計に差し戻し。

## ウォークスルーシナリオ発見事項

| # | シナリオ | 発見事項 | 分類 | 対応方針 |
| - | -------- | -------- | ---- | -------- |
| 1 | S-1 (L1) | glob は git glob 文法（先頭 `/` で repo root 起点）であることを Part 2 implementation-guide でも再掲する必要あり | Note | Phase 12 implementation-guide Part 2 に追記 |
| 2 | S-3 (L3) | smoke コマンドで `wait` 後の return code を集約しないと並列失敗が検出できない | Note | Phase 5 runbook に `wait $pid && wait $pid2` の return code 確認を追加 |
| 3 | S-4 (L4) | A-2 未完了下で `LOGS.md` を target に誤って含めると履歴喪失。Phase 1/2/3 で 3 重明記済 | Info | 既対応 |

## 必須 outputs リンク

- [manual-smoke-log.md](manual-smoke-log.md) — 4 worktree 並列再生成 smoke 手順（NOT EXECUTED）
- [link-checklist.md](link-checklist.md) — 仕様書間リンク健全性チェック

## NON_VISUAL のため screenshot 不要を明記

本タスクは UI 差分なし、Cloudflare Workers / D1 / Renderer に一切触らない docs-only タスク。screenshot は作成しない。`outputs/phase-11/screenshots/` ディレクトリは存在しない（`.gitkeep` も含めて作らない）。

## 完了確認

- [x] 代替 evidence 差分表（L1/L2/L3/L4）記載
- [x] 保証できない範囲を 3 項目以上列挙
- [x] manual-smoke-log.md / link-checklist.md へのリンク
- [x] 「実地操作不可」「NON_VISUAL のため screenshot 不要」を明記
- [x] L4（意図的 violation）を 1 件実施（A-2 未完了下の履歴喪失 = red 確認）

## 次 Phase 引き継ぎ

- Phase 12 unassigned-task-detection.md に「保証できない範囲 3 項目」を current 区分で記録（または Phase 5 実走 PR への申し送りとして整理）
- Phase 12 implementation-guide.md Part 2 に「git glob 文法（先頭 `/` の意味）」「smoke の `wait` return code 集約」を追記
