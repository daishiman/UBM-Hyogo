# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | hook 冪等化と 4 worktree 並列 smoke 実走 (skill-ledger-t6-hook-idempotency) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-29 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | completed |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |

## 目的

Phase 1 / 2 の要件と設計を、代替案比較・4 条件・A-2 完了 gate・skill-ledger 正本仕様との整合でレビューし、Phase 4 以降へ進める base case を確定する。

## 実行タスク

1. 代替案 4 案を PASS / MINOR / MAJOR で評価する。
2. A-2 completed を NO-GO 条件として明記する。
3. Phase 4 開始条件と Phase 13 blocked 条件を定義する。
4. 4 条件（価値性 / 実現性 / 整合性 / 運用性）を再判定する。

## NO-GO 条件（A-2 完了必須）— 重複明記 3/3

> **A-2（task-skill-ledger-a2-fragment / Issue #130）が completed でない場合、Phase 5 以降の hook 実装へ進まない。**
> 本ワークフローの仕様書整備は進められるが、実 hook 差分の適用は A-2 completed 確認後に限定する。

## 代替案レビュー

| 案 | 内容 | 判定 | 根拠 |
| --- | --- | --- | --- |
| A | hook 単独冪等化 | MINOR | `git add` 循環は止まるが部分 JSON リカバリが不足 |
| B | pre-commit でのみガード | MAJOR | 現行 post-merge は stale 通知のみだが、pre-commit だけでは将来の hook drift と明示 rebuild 失敗を同時に検出できない |
| C | アプリ側で完全静的化 | MAJOR | hook 経路の運用課題に対して過剰で、生成 resilience を失う |
| D | hook 冪等化 + 部分 JSON リカバリ + 二段 smoke | PASS with notes | AC-1〜AC-11 を最小複雑性で満たす base case |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 派生物 merge conflict 0 化と hook 再 add 循環防止に直結 |
| 実現性 | PASS | lefthook / shell / jq / git の既存運用だけで完結 |
| 整合性 | PASS | A-1 / A-2 / B-1 の責務境界と矛盾しない |
| 運用性 | PASS | 2 worktree 事前 smoke から 4 worktree full smoke へ段階化し、失敗原因を分離できる |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-01.md | 要件・AC |
| 必須 | docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-02.md | 設計・lane |
| 必須 | .claude/skills/aiworkflow-requirements/references/skill-ledger-fragment-spec.md | A-2 正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/skill-ledger-gitignore-policy.md | A-1 正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/skill-ledger-gitattributes-policy.md | B-1 正本 |

## 実行手順

1. Phase 1 / 2 の AC と設計要素を一覧化する。
2. 代替案 A〜D を比較し、MAJOR の戻り先を明示する。
3. base case D を Phase 4 以降の入力として固定する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | AC-1〜AC-11 と base case D をテスト観点へ渡す |
| Phase 5 | A-2 completed gate と hook 実装境界を渡す |
| Phase 10 | MINOR / MAJOR が残っていないことを再確認 |
| Phase 13 | ユーザー承認なしに PR 作成しない blocked 条件を渡す |

## 多角的チェック観点（AIが判断）

- simpler alternative は案 A〜C として検討済み。
- A-2 未完了時の実装着手は NO-GO。
- base case D は AC-1〜AC-11 を満たし、過剰なアプリ改修を含まない。

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | 代替案 4 案比較 | completed | D を base case |
| 2 | NO-GO 条件明記 | completed | 3 重明記の 3 箇所目 |
| 3 | 4 条件評価 | completed | 全 PASS |
| 4 | Phase 4 / 13 gate 定義 | completed | Phase 13 は承認必須 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| レビュー | outputs/phase-03/main.md | 代替案比較・NO-GO 条件・4 条件評価 |
| メタ | artifacts.json | Phase 3 状態の更新（completed） |

## 完了条件

- [x] 代替案 4 案が PASS / MINOR / MAJOR で評価されている
- [x] base case D が PASS with notes として確定している
- [x] A-2 completed が NO-GO 条件として明記されている
- [x] 4 条件が全 PASS である

## タスク100%実行確認【必須】

- [x] 全実行タスク（4 件）が completed
- [x] 成果物が `outputs/phase-03/main.md` として配置済み
- [x] Phase 4 へ渡す base case が明確

## 次Phase

- 次 Phase: 4 (テスト戦略)
- ブロック条件: base case D に MAJOR が発生、または A-2 completed を確認できないまま Phase 5 実装に進もうとする場合
