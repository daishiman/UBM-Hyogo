# Phase 03: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-git-hooks-lefthook-and-post-merge |
| Phase | 3 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| workflow | implementation |

## 目的

Git hook 層を lefthook に統一し、post-merge の意図しない再生成を止める。

## 実行タスク

- 設計レビュー の成果物を implementation 境界で作成する。
- skill 定義、artifacts.json、本文の表記を一致させる。
- Phase 13 はユーザー承認待ちを維持する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `scripts/new-worktree.sh`
- `scripts/cf.sh`

## 依存成果物

- Phase 1: `outputs/phase-1/main.md`
- Phase 2: `outputs/phase-2/main.md`, `outputs/phase-2/design.md`

## 実行手順

1. 参照資料を読み、Phase 固有の入力と制約を確認する。
2. artifacts.json の outputs 定義と実ファイルを照合する。
3. outputs/phase-* の成果物を確認し、implementation / NON_VISUAL 境界を維持する。
4. commit / push / PR 作成は行わず、Phase 13 のユーザー承認待ちを維持する。

## 多角的チェック観点（AIが判断）

- 矛盾なし: 本 Phase の状態、成果物、完了条件が index.md と artifacts.json と衝突しない。
- 漏れなし: task-specification-creator の共通骨格と Phase 固有成果物を満たす。
- 整合性あり: implementation / NON_VISUAL の分類、用語、ファイル名を統一する。
- 依存関係整合: 前 Phase の完了を入力にし、次 Phase へ渡す成果物を明示する。

## サブタスク管理

| サブタスク | 状態 | 証跡 |
| --- | --- | --- |
| Phase 仕様確認 | completed | 本ファイル |
| outputs 突合 | completed | artifacts.json / outputs/artifacts.json |
| NON_VISUAL 境界確認 | completed | outputs/phase-* |
| 承認前禁止事項確認 | completed | Phase 13 user_approval_required |

## 成果物

- `outputs/phase-3/main.md`
- `outputs/phase-3/review.md`

## 統合テスト連携

本タスクは implementation / NON_VISUAL のため、統合テストは本タスクのCLIゲートで検証する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [x] 設計レビュー の成果物が artifacts.json と一致する。
- [x] implementation / NON_VISUAL の分類が崩れていない。
- [x] ユーザー承認なしの commit / push / PR 作成を行わない。

## タスク100%実行確認【必須】

- [x] 実行タスクを確認した。
- [x] 参照資料と成果物を照合した。
- [x] implementation / NON_VISUAL 境界を維持した。
- [x] commit / push / PR 作成を行っていない。

## 次Phase

- Phase 13 までは artifacts.json の依存順に進行済み。
- Phase 13 はユーザー承認待ちであり、承認なしに commit / push / PR 作成へ進まない。
