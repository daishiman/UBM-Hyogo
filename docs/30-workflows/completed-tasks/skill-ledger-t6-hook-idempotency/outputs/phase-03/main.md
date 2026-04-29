# Phase 3 成果物 — 設計レビュー（T-6 hook 冪等化）

## 1. 代替案比較

### 案 A: hook 単独冪等化

`git add` 系を hook 内で禁止し、派生物存在時は再生成スキップのみ。シンプルだが、`pnpm indexes:rebuild` 途中失敗で部分書き込み JSON が残ると、次回 hook の存在チェックが誤って成立し破損 JSON を温存する弱点がある（**運用性 MINOR**）。

### 案 B: pre-commit でのみガード

pre-commit でのみ派生物のステージ除外を行う。現行 post-merge は stale 通知のみだが、pre-commit だけでは将来の hook drift と明示 rebuild 失敗を同時に検出できない（**価値性 MAJOR**）。

### 案 C: アプリ側で完全静的化

派生物そのものを生成しない設計に変更。skill ledger の生成パイプラインを根本から書き直す必要があり、MVP スコープ外（**実現性 MAJOR**）。

### 案 D: A + 部分 JSON リカバリ（base case = 採用）

案 A に加え、`pnpm indexes:rebuild` 失敗時の `jq -e . || rm` ループを Phase 5 ランブックに含める。`wait $PID` 個別集約と組み合わせて並列失敗の証跡を確実に取得できる。9 観点すべて PASS。

## 2. 評価マトリクス

| 観点 | 案 A | 案 B | 案 C | 案 D (base) |
| --- | --- | --- | --- | --- |
| 価値性（unmerged=0 化） | PASS | MAJOR | PASS | PASS |
| 実現性 | PASS | PASS | MAJOR | PASS |
| 整合性 | PASS | MINOR | MAJOR | PASS |
| 運用性 | MINOR | MINOR | MAJOR | PASS |
| 責務境界 | PASS | MINOR | PASS | PASS |
| 依存タスク順序 | PASS | PASS | N/A | PASS |
| 価値とコスト | PASS | MINOR | MAJOR | PASS |
| ロールバック設計 | PASS | PASS | MAJOR | PASS |
| 状態所有権 | PASS | MINOR | PASS | PASS |

## 3. 採用結論

base case = **案 D（hook 単独冪等化 + 部分 JSON リカバリ）**。
9 観点すべて PASS、ロールバック 1 コミット粒度、`wait $PID` 個別集約と合わせて AC-4 / AC-6 / AC-7 を一括検証可能。案 C は将来拡張余地として Phase 12 unassigned-task-detection.md に候補列挙のみ。

## 4. PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | 4 条件 + 5 観点を満たす。Phase 4 へ進める |
| MINOR | Phase 5 / 11 / 12 で補足対応が必要。Phase 4 への移行は許可 |
| MAJOR | block。Phase 2 へ差し戻すか、open question として MVP スコープ外に明確化 |

## 5. base case 最終判定

**PASS（with notes）**

notes:
1. A-2（Issue #130）completed の再確認が Phase 5 着手前の必須 gate。
2. 部分 JSON リカバリは `jq -e . || rm` ループで実装し Phase 5 ランブックに固定。
3. 4 worktree smoke は Phase 11 で実走。コマンド系列は Phase 2 で `wait $PID` 個別集約付きで仕様レベル固定済み。

## 6. 着手可否ゲート

### GO 条件

- 代替案 4 案以上比較済み: ✓
- base case 全観点 PASS（with notes）: ✓
- MAJOR ゼロ: ✓
- MINOR の対応 Phase 指定: ✓
- open question Phase 振り分け済み: ✓

### NO-GO 条件（重複明記 3/3）

- **A-2（Issue #130）が completed でない** ← 履歴喪失事故の主要因
- A-1（Issue #129）が completed でない
- hook が `git add` 系を呼ぶ設計が残っている
- ロールバックが 2 コミット以上を要求している
- smoke 系列に `wait $PID` 個別集約が欠落している

## 7. open question

| # | 質問 | 受け皿 Phase |
| --- | --- | --- |
| 1 | リカバリループを hook 内 / `pnpm indexes:rebuild` 内部のどちらに置くか | Phase 5 |
| 2 | 4 worktree smoke が I/O 飽和した場合の対応 | Phase 11 |
| 3 | 案 C（静的化）の将来導入時期 | Phase 12 unassigned |
| 4 | hook 内 `git add` 残留検出を CI で静的検査するか | Phase 9 |

## 8. 結論

base case = 案 D を **PASS（with notes）** で確定。Phase 4（テスト戦略）へ進むことを承認する。ただし Phase 5 以降の実装フェーズ着手前に A-2 / A-1 completed を再確認すること。
