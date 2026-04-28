# Phase 5 成果物 — A-1 実装ランブック総括

## 位置付け

Phase 5 は A-1「自動生成 ledger を gitignore 化」を **別タスクの実装担当者** が
そのまま着手できるレベルの **手順書** として提供する。
本タスク (`task-conflict-prevention-skill-state-redesign`) は **docs-only** であり、
コード・hook・`.gitignore` への実変更は **行わない**。

## 実装委譲先

| 区分 | 委譲先タスク (仮称) | 範囲 |
| --- | --- | --- |
| 実装 | `task-skill-ledger-a1-gitignore` | 本フェーズ runbook の Step 1〜4 を実行 |
| 検証 | 同上 (Phase 11 を踏襲) | Phase 4 C-3 の手動再現 |

## 成果物 index

| ファイル | 役割 |
| --- | --- |
| `gitignore-runbook.md` | A-1 実装手順書（patch / hook / untrack / 検証 / rollback） |
| `main.md` (本ファイル) | 概観・委譲方針 |

## 範囲確認

- 含む: `.gitignore` 追記内容、untrack 手順、hook ガード疑似コード、検証コマンド、ロールバック
- 含まない: 実 hook 実装コード、CI への組込み、Cloudflare 側設定

## 重要ガード

- `LOGS.md` を A-2 移行 **前** に gitignore 化してはならない（履歴を失う）
- gitignore 対象は「自動再生成される派生物」に限定する
- worktree-local cache パスは A-1 実装タスクで決定（未確定）

## 後続 Phase との関係

| Phase | 関係 |
| --- | --- |
| Phase 4 C-3 | A-1 適用後の検証ケース |
| Phase 11 | C-3 を手動実行し証跡化 |
| Phase 12 | system-spec-update に「自動生成 ledger は git 非管理」を追記 |
