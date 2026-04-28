# Phase 01: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-husky-rejection-adr |
| Phase | 1 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | documentation |

## 目的

ADR-0001「Git hook ツールに lefthook を採用、husky を不採用」を独立化するための要件を確定し、後続 Phase の設計入力（必須記載項目・派生元・受入条件）を一意に固定する。

## 実行タスク

- 派生元（task-git-hooks-lefthook-and-post-merge の Phase 2 design ADR-01 / Phase 3 review 第5節 / Phase 12 unassigned-task-detection B-2）から ADR 化対象の判断テキストを抽出する。
- ADR 集約場所候補（`doc/decisions/` 新設 / `doc/00-getting-started-manual/decisions/` 既存配下）を整理し、判断材料を要件として記録する。
- ADR-0001 の必須セクション（Context / Decision / Consequences / Alternatives Considered / References）と、不採用比較対象（husky / pre-commit / native git hooks）を要件化する。
- 受入条件 AC-1〜AC-6 を Phase 1 出力で確定し、index.md / artifacts.json と一致させる。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/completed-tasks/task-husky-rejection-adr.md`
- `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md`
- `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-3/review.md`
- `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/unassigned-task-detection.md`
- `lefthook.yml`
- `doc/00-getting-started-manual/lefthook-operations.md`
- `CLAUDE.md`

## 依存成果物

- なし（開始 Phase）

## 実行手順

1. 参照資料を読み、ADR 化対象の判断テキスト・派生元の所在を確認する。
2. ADR 集約先候補（新設 / 既存）を列挙し、命名規約 `NNNN-<slug>.md` の採用方針を要件化する。
3. ADR 必須セクションと比較対象（husky / pre-commit / native git hooks）を Phase 1 成果物に明記する。
4. 受入条件 AC-1〜AC-6 を index.md / artifacts.json と突合し齟齬を排除する。
5. commit / push / PR 作成は行わず、Phase 13 のユーザー承認待ちを維持する。

## 多角的チェック観点（AIが判断）

- 矛盾なし: 本 Phase の要件が index.md / artifacts.json の AC と衝突しない。
- 漏れなし: ADR 必須セクション・比較対象・派生元参照が Phase 1 成果物に列挙されている。
- 整合性あり: docs-only / NON_VISUAL の分類、用語、ファイル名を統一する。
- 依存関係整合: Phase 2 設計 / Phase 3 設計レビューに渡す入力が一意に決まっている。

## サブタスク管理

| サブタスク | 状態 | 証跡 |
| --- | --- | --- |
| 派生元判断テキストの抽出 | completed | outputs/phase-1/main.md |
| ADR 集約先候補の整理 | completed | outputs/phase-1/main.md |
| ADR 必須セクション・比較対象の確定 | completed | outputs/phase-1/main.md |
| 受入条件 AC-1〜AC-6 の整合性確認 | completed | outputs/phase-1/main.md |
| 承認前禁止事項確認 | pending_user_approval | Phase 13 user_approval_required |

## 成果物

- `outputs/phase-1/main.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは Phase 11 の docs walkthrough（リンク検証・ADR 単独可読性）で代替する。Phase 1 では要件側の入力固定のみを担う。

## 完了条件

- [ ] 要件定義の成果物が artifacts.json と一致する。
- [ ] docs-only / NON_VISUAL の分類が崩れていない。
- [ ] ADR 必須セクション・比較対象・派生元参照が Phase 1 成果物に明記されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

## タスク100%実行確認【必須】

- [ ] 実行タスクを確認した。
- [ ] 参照資料と成果物を照合した。
- [ ] docs-only / NON_VISUAL 境界を維持した。
- [ ] commit / push / PR 作成を行っていない。

## 次Phase

- Phase 2「設計」へ Phase 1 成果物を入力として引き継ぐ。
- Phase 13 はユーザー承認待ちであり、承認なしに commit / push / PR 作成へ進まない。
