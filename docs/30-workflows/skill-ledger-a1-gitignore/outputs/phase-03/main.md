# Phase 3 成果物 — 設計レビュー

## 1. 代替案比較

| 案 | 概要 | 利点 | 欠点 |
| --- | --- | --- | --- |
| A (base) | gitignore + untrack + hook 冪等化 | コスト最小、ロールバック 1〜2 コミット、lefthook と整合 | A-2 完了必須 |
| B | hook 単独で再生成（gitignore せず） | 順序事故リスク低 | tracked のままで conflict 本質的に減らない（価値性 MAJOR） |
| C | skill ledger を別 submodule に切り出す | 完全分離 | 開発フロー全面再設計（実現性 MAJOR） |
| D | `derived-artifacts` ブランチで派生物管理 | 履歴保持 | 常時 2 ブランチ意識（運用性 MAJOR） |

## 2. 評価マトリクス

| 観点 | A (base) | B | C | D |
| --- | --- | --- | --- | --- |
| 価値性 | PASS | MAJOR | PASS | PASS |
| 実現性 | PASS | PASS | MAJOR | MINOR |
| 整合性 | PASS | PASS | MAJOR | MINOR |
| 運用性 | PASS | MINOR | MAJOR | MAJOR |
| 責務境界 | PASS | MINOR | PASS | MINOR |
| 依存タスク順序 | PASS | PASS | N/A | N/A |
| 価値とコスト | PASS | MINOR | MAJOR | MINOR |
| ロールバック | PASS | PASS | MAJOR | MINOR |
| 状態所有権 | PASS | MINOR | PASS | MINOR |

## 3. PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | 4 条件 + 5 観点を満たす。Phase 4 へ進める |
| MINOR | 警告。Phase 5 / 11 / 12 で補足対応が必要だが、Phase 4 移行は許可 |
| MAJOR | block。Phase 4 へ進めない。Phase 2 へ差し戻すか、open question として MVP 外明示 |

## 4. base case 最終判定: PASS（with notes）

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 4 worktree 並列で派生物 conflict 0 件化 |
| 実現性 | PASS | `.gitignore` / `git rm --cached` / hook ガードはすべて既存技術 |
| 整合性 | PASS | 不変条件 #5 を侵害しない、派生物 / 正本境界を強化 |
| 運用性 | PASS | lefthook 経由の hook 配置、1〜2 コミットロールバック |
| 責務境界 | PASS | hook は派生物のみ生成 |
| 依存タスク順序 | PASS（with notes） | A-2 必須前提、3 重明記済み |
| 価値とコスト | PASS | `.gitignore` 1 ファイル + 数 untrack + hook 数行 |
| ロールバック設計 | PASS | `revert(skill): re-track A-1 ledger files` |
| 状態所有権 | PASS | hook = 派生物のみ境界 |

**notes:**
1. A-2 完了確認は Phase 5 着手前の必須ゲート。
2. T-6 (hook 本体) 未実装なら lane 3 は最小限の存在チェックガードに留める。
3. 4 worktree smoke は Phase 11 で実走。コマンド系列は Phase 2 で固定済み。

## 5. 着手可否ゲート: GO

### GO 条件（充足）

- [x] 代替案 4 案以上比較
- [x] base case PASS（with notes）
- [x] MAJOR ゼロ
- [x] MINOR は対応 Phase（5 / 11 / 12）指定
- [x] open question 全件 Phase 振り分け済み

### NO-GO 条件（重複明記 3/3）

- **A-2 が completed でない** ← 履歴喪失事故の主要因
- 4 条件のいずれかに MAJOR
- hook が canonical を書く設計
- ロールバック 3 コミット以上要求
- target globs に `LOGS.md` 本体含む

## 6. open question

| # | 質問 | 受け皿 Phase |
| --- | --- | --- |
| 1 | T-6 未着手時の lane 3 踏み込み度 | Phase 5 |
| 2 | 4 worktree smoke 失敗時の切り分け手順 | Phase 11 |
| 3 | 案 C（submodule 化）の将来導入時期 | Phase 12 unassigned |
| 4 | A-1 → B-1 順序の固定 | Phase 12 |

## 7. Phase 4 への引き渡し

- 採用 base case = 案 A
- lane 1〜4 を Phase 4 のテスト戦略対象に
- notes 3 件、open question 4 件を該当 Phase に register
- A-2 completed 確認は Phase 5 着手前に再実施
