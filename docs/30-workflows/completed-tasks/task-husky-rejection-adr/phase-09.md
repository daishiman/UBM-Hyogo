# Phase 09: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-husky-rejection-adr |
| Phase | 9 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | documentation |

## 目的

Phase 8 リファクタリング後の ADR-0001 とその関連ドキュメント群に対し、文書としての品質ゲート（リンク有効性・重複記述排除・派生元との整合・命名規約遵守）を一括適用し、Phase 10 最終レビューに進める品質に達していることを保証する。

## 実行タスク

- ADR-0001 内および派生元 design.md / review.md からの backlink がすべて有効（相対パス・アンカー）であることを quality-gate.md にチェックリスト化して検証する。
- ADR-0001 と派生元ドキュメント間で重複している記述を抽出し、ADR-0001 単独可読性を保ちつつ重複を排除する方針を確定する。
- 命名規約 `NNNN-<slug>.md` に対する ADR-0001 のファイル名 / ディレクトリ配置の遵守状況を確認する。
- `lefthook.yml` および `doc/00-getting-started-manual/lefthook-operations.md` と ADR-0001 の Decision / Consequences が矛盾しないか機械的に突合する。
- AC-1〜AC-6 ごとに品質ゲート結果を pass / fail / 要修正で記録し、fail があれば差し戻し条件を quality-gate.md に明記する。
- main.md に品質ゲート全体結果のサマリと Phase 10 最終レビューへの引継ぎ事項を残す。

## 参照資料

- Phase 1 成果物（`outputs/phase-1/main.md`）
- Phase 2 成果物（`outputs/phase-2/main.md`, `outputs/phase-2/design.md`）
- Phase 3 成果物（`outputs/phase-3/main.md`, `outputs/phase-3/review.md`）
- Phase 4 成果物（`outputs/phase-4/main.md`, `outputs/phase-4/test-matrix.md`）
- Phase 5 成果物（`outputs/phase-5/main.md`, `outputs/phase-5/runbook.md`）
- Phase 6 成果物（`outputs/phase-6/main.md`, `outputs/phase-6/failure-cases.md`）
- Phase 7 成果物（`outputs/phase-7/main.md`, `outputs/phase-7/coverage.md`）
- Phase 8 成果物（`outputs/phase-8/main.md`, `outputs/phase-8/before-after.md`）
- `.claude/skills/task-specification-creator/SKILL.md`
- `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md`
- `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-3/review.md`
- `lefthook.yml`
- `doc/00-getting-started-manual/lefthook-operations.md`

## 依存成果物

- Phase 1: `outputs/phase-1/main.md`
- Phase 2: `outputs/phase-2/main.md`, `outputs/phase-2/design.md`
- Phase 3: `outputs/phase-3/main.md`, `outputs/phase-3/review.md`
- Phase 4: `outputs/phase-4/main.md`, `outputs/phase-4/test-matrix.md`
- Phase 5: `outputs/phase-5/main.md`, `outputs/phase-5/runbook.md`
- Phase 6: `outputs/phase-6/main.md`, `outputs/phase-6/failure-cases.md`
- Phase 7: `outputs/phase-7/main.md`, `outputs/phase-7/coverage.md`
- Phase 8: `outputs/phase-8/main.md`, `outputs/phase-8/before-after.md`

## 実行手順

1. Phase 8 成果物を入力として読み、品質ゲート対象（リンク・重複・命名規約・一次資料整合）を quality-gate.md に列挙する。
2. ADR-0001 / 派生元 backlink を相対パスとアンカーレベルで検証し、結果を quality-gate.md に記録する。
3. ADR-0001 と派生元ドキュメント間の重複記述を抽出し、排除方針（要約化 / 参照化）を確定する。
4. 命名規約 `NNNN-<slug>.md` の遵守状況、配置ディレクトリ、見出しレベルの整合を確認する。
5. `lefthook.yml` / `lefthook-operations.md` と ADR-0001 の Decision / Consequences の突合結果を quality-gate.md に記録する。
6. AC-1〜AC-6 を pass / fail / 要修正で評定し、main.md に総括と Phase 10 への引継ぎを記述する。
7. commit / push / PR 作成は行わず、Phase 13 のユーザー承認待ちを維持する。

## 多角的チェック観点（AIが判断）

- 矛盾なし: 品質ゲート結果が Phase 1〜Phase 8 の成果物と矛盾しない。
- 漏れなし: リンク・重複・命名規約・一次資料整合の 4 観点すべてに評定がある。
- 整合性あり: ADR-0001 と `lefthook.yml` / `lefthook-operations.md` の記述が齟齬なく接続している。
- 依存関係整合: Phase 10 最終レビューへ渡す残課題・差し戻し条件が一意に定義されている。

## サブタスク管理

| サブタスク | 状態 | 証跡 |
| --- | --- | --- |
| backlink 有効性検証 | completed | outputs/phase-9/quality-gate.md |
| 重複記述の排除方針確定 | completed | outputs/phase-9/quality-gate.md |
| 命名規約遵守の確認 | completed | outputs/phase-9/quality-gate.md |
| 一次資料との整合突合 | completed | outputs/phase-9/quality-gate.md |
| AC-1〜AC-6 の評定記録 | completed | outputs/phase-9/quality-gate.md |
| 承認前禁止事項確認 | pending_user_approval | Phase 13 user_approval_required |

## 成果物

- `outputs/phase-9/main.md`
- `outputs/phase-9/quality-gate.md`

## 統合テスト連携

docs-only / NON_VISUAL のため統合テストは Phase 11 の docs walkthroughで代替する。Phase 9 の quality-gate.md は Phase 11 リンクチェックリスト・manual-smoke-logの直接入力となる。

## 完了条件

- [ ] 品質保証成果物が artifacts.json と一致する。
- [ ] リンク・重複・命名規約・一次資料整合の 4 観点すべてが quality-gate.md に記録されている。
- [ ] AC-1〜AC-6 のすべてに pass / fail / 要修正のいずれかが付与されている。
- [ ] fail / 要修正があれば差し戻し条件が main.md / quality-gate.md に明記されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

## タスク100%実行確認【必須】

- [ ] 実行タスクを確認した。
- [ ] 参照資料と成果物を照合した。
- [ ] docs-only / NON_VISUAL 境界を維持した。
- [ ] commit / push / PR 作成を行っていない。

## 次Phase

- Phase 10「最終レビュー」へ Phase 9 成果物を入力として引き継ぐ。
- Phase 13 はユーザー承認待ちであり、承認なしに commit / push / PR 作成へ進まない。
