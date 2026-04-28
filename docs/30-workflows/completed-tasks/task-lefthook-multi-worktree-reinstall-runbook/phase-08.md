# Phase 8: DRY 化・整合性

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化・整合性 |
| 作成日 | 2026-04-28 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |
| タスク分類 | docs-only / runbook-spec（NON_VISUAL） |

## 目的

`doc/00-getting-started-manual/lefthook-operations.md`（既存運用ガイド）と本タスクで新設する一括再 install runbook の間で、表現・手順・前提が二重化することを防ぐ。本 Phase は docs-only の整合性審査として、重複文章の排除・参照の一本化・責務境界の明示を Before/After 表で固定する。コードは生成しない。

## 評価観点

| 観点 | 内容 |
| --- | --- |
| 単一情報源 (SSOT) | 同じ手順・同じ警告は片側にのみ書き、もう片側はリンクで参照する |
| 責務分離 | `lefthook-operations.md` = 日常運用 / 本 runbook = 30+ worktree の遡及一括再 install |
| 参照方向 | runbook → `lefthook-operations.md` への片方向参照（循環禁止） |
| 用語統一 | 「逐次」「並列禁止」「prunable 除外」「mise exec --」の表記を完全一致 |
| 不変条件継承 | CLAUDE.md「`lefthook.yml` 正本主義」「`.git/hooks/*` 手書き禁止」「post-merge 廃止」を片側に集約 |

## Before / After 整合表

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 「lefthook install は冪等」記述 | `lefthook-operations.md` と本 runbook の双方に重複して説明 | `lefthook-operations.md` 側の 1 箇所に集約。runbook からは「冪等性は lefthook-operations.md `<section>` 参照」とリンク化 | SSOT。仕様変更時の二重更新リスクを除去 |
| pnpm store 並列書き込み禁止の警告 | 双方に長文で記載 | runbook 本文（実行手順の直前）に正本を置き、`lefthook-operations.md` は 1 行 + runbook へのリンクで参照 | 並列禁止は「30+ worktree を回す」runbook 固有の制約であり runbook 側が一次情報 |
| `mise exec --` 前置の説明 | runbook 各コマンドのコメントで毎回繰り返し | runbook 冒頭に「全コマンドに `mise exec --` を前置」を 1 度だけ宣言し、以降のコマンド例ではコメント省略 | 重複削減。CLAUDE.md「よく使うコマンド」と整合 |
| 旧 `.git/hooks/post-merge` 残存対応 | `lefthook-operations.md` のトラブルシュート章に手動削除手順、runbook にも同等の説明 | 検出ロジック・ログ書式は runbook の正本、削除判断のガイド文だけ `lefthook-operations.md` に残す | 検出は一括処理の文脈、削除は日常運用の文脈に分離 |
| `pnpm rebuild lefthook` 自動 retry | runbook と `lefthook-operations.md` 双方に retry 例 | runbook が「自動 retry を 1 回」とポリシーを正本化。`lefthook-operations.md` は手動 fallback の手順のみ残す | ポリシー（ADR-02 系）と手動手順の役割分離 |
| 新規 worktree vs 既存 worktree の責務 | `scripts/new-worktree.sh` README と `lefthook-operations.md` で重複説明 | `lefthook-operations.md` の冒頭に責務境界表を一度だけ追記し、runbook と new-worktree.sh のいずれもそこへリンク | 三者間の循環参照を断ち、境界表の SSOT を定める |
| 実行ログ書式 | 旧 phase-12 implementation-guide に書式例、本 runbook にも別書式 | 本 runbook の `outputs/phase-11/manual-smoke-log.md` 書式が唯一の正本。完了タスクの旧書式は historical reference に格下げ | NON_VISUAL 代替 evidence の様式は本タスクが SSOT |
| 「detached HEAD でも対象」明記 | Phase 2 ADR-04 と Phase 5 runbook 冒頭に重複 | Phase 5 runbook 冒頭の 1 文に集約し、ADR-04 はその根拠として参照 | 文書はポリシー、根拠は ADR の役割分担 |
| CLAUDE.md「Git hook の方針」 | runbook 内で再記述 | runbook は CLAUDE.md セクションへのリンクのみで参照 | プロジェクト規約の SSOT は CLAUDE.md。再記述は乖離リスク |

## 検証手順

1. `lefthook-operations.md` と本 runbook を並べて diff し、上表 9 項目が After 列の状態に一致しているか目視確認する。
2. 「逐次」「並列禁止」「prunable」「mise exec --」を全文 grep し、定義の正本が 1 箇所に集約されていることを確認する。
3. `lefthook-operations.md` から本 runbook へのリンク、本 runbook から `lefthook-operations.md` へのリンクが片方向であることを確認する（双方向の手順本体記載がないこと）。
4. CLAUDE.md「Git hook の方針」「indexes 再生成は post-merge から廃止」表現を runbook 内で再記述していないことを確認する。
5. Before/After 表の「理由」列が SSOT・責務分離・参照方向のいずれか 1 つ以上に紐づいているかをセルフレビューする。

## 完了条件

- 上記 Before/After 表の 9 項目が全て After 状態で本 runbook / `lefthook-operations.md` に反映されている
- 重複記述ゼロ（同一手順が 2 箇所以上に書かれていないこと）
- 参照は片方向のみで、循環参照が無い
- 用語表記（逐次 / 並列禁止 / prunable / mise exec --）が完全一致
- CLAUDE.md の方針記述を runbook 内で複製していない

## Phase 9 への引き渡し

- DRY 化済みの runbook 本文が line budget 内に収まることの確認依頼
- 内部リンクの dead link 検証対象（runbook → `lefthook-operations.md` / runbook → CLAUDE.md / runbook → `scripts/new-worktree.sh`）
- mirror parity 観点（同一情報の二重化が再発していないかの最終チェック）
