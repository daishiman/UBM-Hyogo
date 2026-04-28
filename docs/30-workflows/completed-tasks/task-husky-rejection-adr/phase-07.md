# Phase 07: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-husky-rejection-adr |
| Phase | 7 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | documentation |

## 目的

Phase 4 で設計したテストマトリクスと Phase 6 で拡充した失敗シナリオに対する検証実施結果を集約し、AC-1〜AC-6 のカバレッジ表を coverage.md に確定する。docs-only / NON_VISUAL のため、カバレッジは ADR 単独可読性 / リンク整合性 / 必須セクション充足 / 一次資料追跡可能性 / backlink 有効性 / 既存 hook 構成との非矛盾の観点で評価し、未カバー項目を Phase 11 docs walkthroughへ確実に引き渡す。

## 実行タスク

- AC-1〜AC-6 を行、Phase 4 テストマトリクスの検証項目 ID と Phase 6 失敗シナリオ S-1〜S-5 を列とするカバレッジ表を coverage.md に作成する。
- 各セルに「カバー済 / 未カバー / Phase 11 へ委譲」のステータスと証跡（成果物パス・検証手段）を記録する。
- 未カバー項目がある場合、Phase 11 docs walkthrough（manual-smoke-log.md）への引き継ぎ ID を coverage.md に明記する。
- AC-5（ADR 単独可読性）と AC-6（既存 `lefthook.yml` / `doc/00-getting-started-manual/lefthook-operations.md` との非矛盾）について、Phase 3 review.md / Phase 6 failure-cases.md S-5 の検証結果を統合する。
- カバレッジ表のサマリ（カバー率 / 残課題件数 / Phase 11 委譲件数）を coverage.md 冒頭に記載する。

## 参照資料

- Phase 1 成果物（`outputs/phase-1/main.md`）
- Phase 2 成果物（`outputs/phase-2/main.md`, `outputs/phase-2/design.md`）
- Phase 3 成果物（`outputs/phase-3/main.md`, `outputs/phase-3/review.md`）
- Phase 4 成果物（`outputs/phase-4/main.md`, `outputs/phase-4/test-matrix.md`）
- Phase 5 成果物（`outputs/phase-5/main.md`, `outputs/phase-5/runbook.md`）
- Phase 6 成果物（`outputs/phase-6/main.md`, `outputs/phase-6/failure-cases.md`）
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `lefthook.yml`
- `doc/00-getting-started-manual/lefthook-operations.md`

## 依存成果物

- Phase 1: `outputs/phase-1/main.md`
- Phase 2: `outputs/phase-2/main.md`, `outputs/phase-2/design.md`
- Phase 3: `outputs/phase-3/main.md`, `outputs/phase-3/review.md`
- Phase 4: `outputs/phase-4/main.md`, `outputs/phase-4/test-matrix.md`
- Phase 5: `outputs/phase-5/main.md`, `outputs/phase-5/runbook.md`
- Phase 6: `outputs/phase-6/main.md`, `outputs/phase-6/failure-cases.md`

## 実行手順

1. Phase 1〜6 成果物を読み、テストマトリクスと失敗シナリオの検証状況を整理する。
2. AC-1〜AC-6 を行、Phase 4 検証項目 ID と Phase 6 失敗シナリオ ID を列とするカバレッジ表雛形を coverage.md に作成する。
3. 各セルに「カバー済 / 未カバー / Phase 11 へ委譲」のステータスと証跡（成果物パス・検証手段）を記入する。
4. 未カバー項目があれば Phase 11 docs walkthroughへの引き継ぎ ID を割り当てる。
5. AC-5 / AC-6 のレビュー結果（Phase 3 review.md / Phase 6 S-5）を統合し、カバレッジ表に反映する。
6. カバレッジ表のサマリ（カバー率 / 残課題件数 / Phase 11 委譲件数）を coverage.md 冒頭に記載する。
7. coverage.md と本 Phase main.md を artifacts.json の outputs と一致させ、commit / push / PR 作成は行わず、Phase 13 のユーザー承認待ちを維持する。

## 多角的チェック観点（AIが判断）

- 矛盾なし: カバレッジ表の判定が Phase 4 テストマトリクス / Phase 6 失敗シナリオと矛盾しない。
- 漏れなし: AC-1〜AC-6 全行に対し、Phase 4 検証項目 ID / Phase 6 失敗シナリオ ID 全列のステータスが埋まっている。
- 整合性あり: 「Phase 11 へ委譲」項目が Phase 11 docs walkthroughの引き継ぎ ID と一致する。
- 依存関係整合: 残課題件数が Phase 11 / Phase 12 で消化可能な粒度に整理されている。

## サブタスク管理

| サブタスク | 状態 | 証跡 |
| --- | --- | --- |
| カバレッジ表雛形作成 | completed | outputs/phase-7/coverage.md |
| ステータス・証跡の記入 | completed | outputs/phase-7/coverage.md |
| Phase 11 引き継ぎ ID 割り当て | completed | outputs/phase-7/coverage.md |
| AC-5 / AC-6 レビュー結果統合 | completed | outputs/phase-7/coverage.md |
| サマリ（カバー率・残課題件数）記載 | completed | outputs/phase-7/coverage.md |
| 承認前禁止事項確認 | pending_user_approval | Phase 13 user_approval_required |

## 成果物

- `outputs/phase-7/main.md`
- `outputs/phase-7/coverage.md`

## 統合テスト連携

docs-only / NON_VISUAL のため統合テストは Phase 11 の docs walkthroughで代替する。Phase 7 カバレッジ表で「Phase 11 へ委譲」と判定された項目は Phase 11 manual-smoke-log.md に必ず登録される前提で記述する。

## 完了条件

- [ ] カバレッジ確認の成果物が artifacts.json と一致する。
- [ ] AC-1〜AC-6 全てに対するカバレッジ表が coverage.md に揃っている。
- [ ] 未カバー項目があれば Phase 11 docs walkthroughへの引き継ぎ ID が割り当てられている。
- [ ] サマリ（カバー率 / 残課題件数 / Phase 11 委譲件数）が coverage.md 冒頭に記載されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

## タスク100%実行確認【必須】

- [ ] 実行タスクを確認した。
- [ ] 参照資料と成果物を照合した。
- [ ] docs-only / NON_VISUAL 境界を維持した。
- [ ] commit / push / PR 作成を行っていない。

## 次Phase

- Phase 8「リファクタリング」へ Phase 7 成果物を入力として引き継ぐ。
- Phase 13 はユーザー承認待ちであり、承認なしに commit / push / PR 作成へ進まない。
