# Phase 04: テスト設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-husky-rejection-adr |
| Phase | 4 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | documentation |

## 目的

Phase 3 で確定した設計レビュー結果を基に、ADR-0001 が満たすべき検証項目をテストマトリクスとして設計する。docs-only / NON_VISUAL タスクであるため、検証は ADR 単独可読性 / リンク整合性 / 必須セクション充足 / Alternatives Considered の一次資料追跡可能性 / backlink リンク有効性に集約し、Phase 7 のカバレッジ確認 / Phase 11 の docs walkthroughで実施可能な粒度に落とし込む。

## 実行タスク

- AC-1〜AC-6 を行、検証観点（必須セクション充足 / リンク整合性 / 単独可読性 / 一次資料追跡 / backlink / 既存 hook 構成との非矛盾）を列とするテストマトリクスを設計する。
- 各セルに検証手段（目視レビュー / リンクチェッカ / 一次資料との突合 / `lefthook.yml` との突合）を割り当てる。
- ADR-0001 ファイル単独で読んだ際に「Context / Decision / Consequences / Alternatives Considered / References」全てが揃っているかを確認する自己完結性チェック項目を test-matrix.md に列挙する。
- husky / pre-commit / native git hooks 各々の不採用理由が Alternatives Considered から一次資料（派生元 design.md / review.md / `lefthook.yml`）まで追跡可能であることを検証する手順を明記する。
- backlink 追加箇所（Phase 2 design ADR-01 セクション末尾 / Phase 3 review 第5節末尾）から ADR-0001 への相対リンクが解決することを確認する手順を明記する。
- Phase 7 カバレッジ確認 / Phase 11 docs walkthroughへ引き渡す検証項目 ID を採番する。

## 参照資料

- Phase 1 成果物（`outputs/phase-1/main.md`）
- Phase 2 成果物（`outputs/phase-2/main.md`, `outputs/phase-2/design.md`）
- Phase 3 成果物（`outputs/phase-3/main.md`, `outputs/phase-3/review.md`）
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md`
- `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-3/review.md`
- `lefthook.yml`
- `doc/00-getting-started-manual/lefthook-operations.md`

## 依存成果物

- Phase 1: `outputs/phase-1/main.md`
- Phase 2: `outputs/phase-2/main.md`, `outputs/phase-2/design.md`
- Phase 3: `outputs/phase-3/main.md`, `outputs/phase-3/review.md`

## 実行手順

1. Phase 1〜3 成果物を読み、AC と設計レビュー所見を突合する。
2. AC-1〜AC-6 を行とするテストマトリクス雛形を test-matrix.md に作成する。
3. 各 AC に対し検証観点・検証手段・期待結果・証跡となる成果物を割り当てる。
4. ADR 単独可読性チェック項目（必須セクション充足 / 用語自己完結 / 派生元への外部依存なし）を Phase 3 review.md のチェックリスト初版から取り込み、test-matrix.md に統合する。
5. backlink リンクの相対パス解決検証手順を明記し、Phase 11 docs walkthroughへの引き継ぎ ID を付与する。
6. test-matrix.md と本 Phase main.md を artifacts.json の outputs と一致させる。
7. commit / push / PR 作成は行わず、Phase 13 のユーザー承認待ちを維持する。

## 多角的チェック観点（AIが判断）

- 矛盾なし: テストマトリクスが Phase 1 要件 / Phase 2 設計 / Phase 3 レビューと矛盾しない。
- 漏れなし: AC-1〜AC-6 全てに対する検証観点・手段・期待結果が割り当てられている。
- 整合性あり: docs-only / NON_VISUAL 境界を維持し、自動テストではなく手動レビュー粒度で記述されている。
- 依存関係整合: Phase 7 カバレッジ確認 / Phase 11 docs walkthroughへ渡す検証項目 ID が一意に採番されている。

## サブタスク管理

| サブタスク | 状態 | 証跡 |
| --- | --- | --- |
| テストマトリクス雛形作成 | completed | outputs/phase-4/test-matrix.md |
| 検証観点・手段・期待結果の割り当て | completed | outputs/phase-4/test-matrix.md |
| ADR 単独可読性チェック項目統合 | completed | outputs/phase-4/test-matrix.md |
| backlink リンク解決検証手順の明記 | completed | outputs/phase-4/test-matrix.md |
| 検証項目 ID 採番 | completed | outputs/phase-4/test-matrix.md |
| 承認前禁止事項確認 | pending_user_approval | Phase 13 user_approval_required |

## 成果物

- `outputs/phase-4/main.md`
- `outputs/phase-4/test-matrix.md`

## 統合テスト連携

docs-only / NON_VISUAL のため統合テストは Phase 11 の docs walkthroughで代替する。Phase 4 で設計するテストマトリクスは Phase 7 カバレッジ確認の検証対象であり、Phase 11 の docs walkthroughの入力となる。

## 完了条件

- [ ] テスト設計の成果物が artifacts.json と一致する。
- [ ] AC-1〜AC-6 全てに対する検証観点・手段・期待結果が test-matrix.md に列挙されている。
- [ ] ADR 単独可読性チェック項目と backlink リンク解決検証手順が含まれている。
- [ ] Phase 7 / Phase 11 へ引き渡す検証項目 ID が一意に採番されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

## タスク100%実行確認【必須】

- [ ] 実行タスクを確認した。
- [ ] 参照資料と成果物を照合した。
- [ ] docs-only / NON_VISUAL 境界を維持した。
- [ ] commit / push / PR 作成を行っていない。

## 次Phase

- Phase 5「実装ランブック」へ Phase 4 成果物を入力として引き継ぐ。
- Phase 13 はユーザー承認待ちであり、承認なしに commit / push / PR 作成へ進まない。
