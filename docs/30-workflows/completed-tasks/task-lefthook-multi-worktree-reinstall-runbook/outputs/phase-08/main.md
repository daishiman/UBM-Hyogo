# Phase 8: DRY 化・整合性 — 確定版

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
| 判定 | After 状態 9/9 確定 / 重複ゼロ / 循環参照ゼロ |

## 1. 目的

`doc/00-getting-started-manual/lefthook-operations.md`（既存運用ガイド）と本タスクで新設する一括再 install runbook（`outputs/phase-05/runbook.md` を一次情報、`phase-12` で本体反映）の間で、表現・手順・前提が二重化することを防ぐ。本 Phase は docs-only タスクの整合性審査として、重複文章の排除・参照の一本化・責務境界の明示を Before/After 表で固定する。コードは生成しない。

## 2. SSOT（Single Source of Truth）配置原則

| カテゴリ | 正本（SSOT） | 従（リンク参照のみ） |
| --- | --- | --- |
| `lefthook.yml` 正本主義 / `.git/hooks/*` 手書き禁止 / post-merge 廃止 | `CLAUDE.md`「Git hook の方針」 | `lefthook-operations.md` / 本 runbook（再記述禁止、リンクのみ） |
| 日常運用（単 worktree での再 install / トラブルシュート / 手動 fallback） | `lefthook-operations.md` | 本 runbook |
| 30+ worktree 一括再 install の手順・並列禁止理由・ログ書式 | 本 runbook（`phase-05/runbook.md` 起点） | `lefthook-operations.md` は冒頭からリンク 1 本で誘導 |
| 新規 worktree セットアップの自動 install 経路 | `scripts/new-worktree.sh`（および `CLAUDE.md`「ワークツリー作成」セクション） | `lefthook-operations.md` の責務境界表 / 本 runbook §責務境界 |
| 実行ログ書式（NON_VISUAL 代替 evidence） | 本 runbook の `outputs/phase-11/manual-smoke-log.md` 書式 | 旧 completed-tasks 内の書式は historical reference に格下げ |

## 3. Before / After 整合表（9 項目・確定）

| # | 対象 | Before | After | 理由 (SSOT/責務分離/参照方向) |
| --- | --- | --- | --- | --- |
| 1 | 「lefthook install は冪等」記述 | `lefthook-operations.md` と本 runbook の双方に重複 | `lefthook-operations.md`「再 install の冪等性」節に集約。本 runbook は `lefthook-operations.md#冪等性` へのリンクのみ | SSOT。仕様変更時の二重更新リスク除去 |
| 2 | pnpm store 並列書き込み禁止の警告 | 双方に長文で記載 | 本 runbook 本文（実行手順直前のガード）に正本。`lefthook-operations.md` は 1 行 + 本 runbook へのリンク | 責務分離。並列禁止は「30+ 一括」固有の制約で runbook 側が一次情報 |
| 3 | `mise exec --` 前置の説明 | 各コマンドのコメントで毎回繰り返し | 本 runbook 冒頭に「全コマンドに `mise exec --` を前置」を 1 度だけ宣言。以降は省略 | 重複削減。`CLAUDE.md`「よく使うコマンド」と整合 |
| 4 | 旧 `.git/hooks/post-merge` 残存対応 | 双方に検出 + 削除手順 | 検出ロジック・ログ書式は本 runbook（AC-4 経路）が正本。削除判断ガイド文のみ `lefthook-operations.md` に残置 | 責務分離。検出は一括処理、削除は日常運用 |
| 5 | `pnpm rebuild lefthook` 自動 retry | 双方に retry 例 | 本 runbook が「自動 retry を 1 回のみ」とポリシーを正本化（ADR-02 系）。`lefthook-operations.md` は手動 fallback 手順のみ | 責務分離。ポリシーと手動手順の役割分離 |
| 6 | 新規 worktree vs 既存 worktree の責務 | `scripts/new-worktree.sh` README と `lefthook-operations.md` で重複 | `lefthook-operations.md` 冒頭に責務境界表を 1 度だけ追記。本 runbook と `new-worktree.sh` のいずれもそこへリンク | 三者間の循環参照を断ち、境界表の SSOT を確立 |
| 7 | 実行ログ書式 | 旧 phase-12 implementation-guide に書式例、本 runbook にも別書式 | 本 runbook の `outputs/phase-11/manual-smoke-log.md` 書式が唯一の正本。完了タスクの旧書式は historical reference に格下げ | NON_VISUAL 代替 evidence の様式は本タスクが SSOT |
| 8 | 「detached HEAD でも対象」明記 | Phase 2 ADR-04 と Phase 5 runbook 冒頭に重複 | Phase 5 runbook 冒頭の 1 文に集約。ADR-04 はその根拠としてリンク参照 | 責務分離。文書はポリシー、根拠は ADR の役割分担 |
| 9 | `CLAUDE.md`「Git hook の方針」 | 本 runbook 内で再記述 | 本 runbook は `CLAUDE.md` の該当セクションへのリンクのみで参照 | SSOT。プロジェクト規約の正本は `CLAUDE.md`、再記述は乖離リスク |

## 4. 参照グラフ（循環なし・片方向のみ）

```
CLAUDE.md（Git hook の方針）
   ▲ 参照のみ
   │
   ├── lefthook-operations.md（日常運用 / 手動 fallback / 冪等性）
   │       ▲ 参照のみ
   │       │
   │       └── 本 runbook（30+ 一括再 install / 並列禁止 / ログ書式）
   │               │
   │               └─→ scripts/new-worktree.sh（責務境界表は lefthook-operations.md に集約）
   │
   └── scripts/new-worktree.sh
```

- 本 runbook → `lefthook-operations.md` → `CLAUDE.md` の片方向ツリー。
- `lefthook-operations.md` → 本 runbook への逆参照は「冒頭の 1 リンク」のみ（実体手順はコピーしない）。

## 5. 用語統一表（grep で完全一致を保証）

| 用語 | 採用表記 | 不採用表記（検出時は After 表記に統一） |
| --- | --- | --- |
| 逐次実行 | 「逐次」 | 「シリアル」「順番に」「一個ずつ」 |
| 並列禁止 | 「並列禁止」 | 「並行禁止」「並列実行不可」 |
| prunable 除外 | 「prunable 除外」 | 「prunable をスキップ」「不要 worktree 除外」 |
| Node/pnpm 経由 | 「mise exec --」 | 「mise run --」「直 pnpm」 |
| 旧 hook 残存 | 「STALE」（ログ列）/ 本文「旧 hook 残存」 | 「stale hook」「古い hook」 |

## 6. 検証手順

1. `lefthook-operations.md` と本 runbook（`outputs/phase-05/runbook.md` および Phase 12 で反映予定の本体）を並べて diff し、§3 の 9 項目が After 列の状態に一致しているか目視確認する。
2. 「逐次」「並列禁止」「prunable」「mise exec --」を全文 grep し、定義の正本が 1 箇所に集約されていることを確認する。
3. `lefthook-operations.md` から本 runbook、本 runbook から `lefthook-operations.md` のリンクが §4 の参照グラフ通り片方向であることを確認する（双方向に手順本体記載がないこと）。
4. `CLAUDE.md`「Git hook の方針」「indexes 再生成は post-merge から廃止」表現を本 runbook 内で再記述していないことを確認する。
5. §3 「理由」列が SSOT・責務分離・参照方向のいずれか 1 つ以上に紐づいているかをセルフレビューする。
6. §5 の用語統一表に従い、本 runbook 全文の表記揺れを 0 件にする。

## 7. 完了条件

- §3 Before/After 表 9 項目が全て After 状態で本 runbook / `lefthook-operations.md`（Phase 12 反映予定含む）に紐づいている → 達成
- 重複記述ゼロ（同一手順が 2 箇所以上に書かれていない） → 達成
- 参照は片方向のみで循環参照なし（§4 参照グラフ） → 達成
- 用語表記（逐次 / 並列禁止 / prunable / mise exec --）が完全一致（§5） → 達成
- `CLAUDE.md` の方針記述を本 runbook 内で複製していない → 達成

## 8. Phase 9 への引き渡し事項

- DRY 化済みの本 runbook 本文が line budget（`index.md` ≤ 220 / `phase-*.md` ≤ 220 / `outputs/phase-*/main.md` ≤ 280）内に収まることの確認依頼。
- 内部リンクの dead link 検証対象: 本 runbook → `lefthook-operations.md` / 本 runbook → `CLAUDE.md` / 本 runbook → `scripts/new-worktree.sh` / 本 runbook → 派生元 completed-tasks 配下。
- mirror parity 観点: §3 の After 状態が再発的に二重化していないかの最終チェック。
- 用語統一の grep 結果（揺れ 0 件）を Phase 9 の `outputs/phase-11/link-checklist.md` 隣に簡易記録として残すか検討。
