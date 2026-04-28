# Phase 3 — 設計レビュー main

## 5 軸サマリー

| 軸 | 結果 | 主な根拠 |
| -- | ---- | -------- |
| 整合性 | PASS | regex / front matter / CLI 引数が `fragment-schema.md` / `render-api.md` / `main.md` で一致 |
| 完全性 | PASS | 受入条件 8 項目すべて設計成果物に反映済（Phase 11 計画化を含む） |
| 実現性 | PASS | nonce 衝突期待値 ≈ 1.16×10⁻⁴／path 上限 240 byte は NTFS 互換 |
| 運用性 | PASS | render の擬似 timestamp 戦略が「ISO → date → mtime」の 3 段 fallback |
| セキュリティ・安全性 | PASS | `--out` tracked canonical 拒否（exit 2）／front matter 不正 fail-fast（exit 1） |

## 4 条件レビュー

| 条件 | 評価 | コメント |
| ---- | ---- | -------- |
| 価値性 | PASS | 4 worktree 並列衝突が物理的に 0 件になる／blame は `git mv` で連続性維持 |
| 実現性 | PASS | render LoC ≈ 250／単純 readdir + sort で実装可能 |
| 整合性 | PASS | 状態所有権 5 層（Store / Helper / Engine / Bridge / Guard）で閉じている |
| 運用性 | PASS | 4 worktree smoke は `bash scripts/new-worktree.sh verify/a2-{1..4}` で再現可能 |

## nonce 衝突確率（数値検証）

- 8 hex = 32 bit
- 秒間 1000 ファイル想定 → 同秒同 branch 期待衝突 ≈ `1000² / 2^33 ≈ 1.16×10⁻⁴`
- 安全マージン: retry 3 回で実用上 0 に収束（`(1.16e-4)^3 ≈ 1.56e-12`）

## legacy include window 30 日の妥当性

- 通常運用: 30 日以内の活動を集約 view から参照可能
- 30 日超の履歴が必要な場合: `--include-legacy` を指定し、`_legacy*.md` を直接 `git log --follow` で参照する手順を [`fragment-runbook.md`](../phase-6/fragment-runbook.md) に補記する

## ドッグフーディング観点

- `aiworkflow-requirements/LOGS.md` → `LOGS/_legacy.md`（schema/render API でカバー）
- `task-specification-creator/SKILL-changelog.md` → `changelog/_legacy.md`（同上）

## Go/No-Go

- MAJOR: 0 件
- MINOR: 0 件（log_usage.js writer 残存は Phase 9 で検出 → Phase 10 で未タスク化）
- INFO: 1 件（30 日超 legacy の運用手順を Phase 6 runbook に追記）
- 判定: **GO** → Phase 4 着手可
