# Phase 08: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-husky-rejection-adr |
| Phase | 8 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | documentation |

## 目的

Phase 5 で作成した ADR-0001 ドラフトおよび Phase 6 / Phase 7 で抽出した修正観点を踏まえ、ADR-0001 の文章表現・章立て・用語統一を改善する。実装コードではなく Markdown 文書のリファクタリングであり、Context / Decision / Consequences / Alternatives Considered / References の各節が単独で読みやすく、一次資料と矛盾しない状態へ仕上げる。

## 実行タスク

- Phase 5 ランブック / Phase 6 失敗ケース / Phase 7 カバレッジ確認の指摘を受け、ADR-0001 の改稿候補箇所を before-after.md に列挙する。
- 派生元（task-git-hooks-lefthook-and-post-merge Phase 2 design / Phase 3 review）と用語が一致しているか確認し、揺れがあれば ADR-0001 側で統一する。
- Alternatives Considered の husky / pre-commit / native git hooks の節について、論点・根拠・引用元の並び順を統一する。
- Context → Decision → Consequences の論理連鎖が断絶していないかを文章単位で見直し、冗長表現や重複記述を整理する。
- backlink（Phase 2 design / Phase 3 review への参照）が ADR-0001 単独可読性を阻害しない位置に置かれているか再点検する。
- リファクタリング結果を before-after.md に before / after の対比形式で記録し、main.md に要約と適用方針を残す。

## 参照資料

- Phase 1 成果物（`outputs/phase-1/main.md`）
- Phase 2 成果物（`outputs/phase-2/main.md`, `outputs/phase-2/design.md`）
- Phase 3 成果物（`outputs/phase-3/main.md`, `outputs/phase-3/review.md`）
- Phase 4 成果物（`outputs/phase-4/main.md`, `outputs/phase-4/test-matrix.md`）
- Phase 5 成果物（`outputs/phase-5/main.md`, `outputs/phase-5/runbook.md`）
- Phase 6 成果物（`outputs/phase-6/main.md`, `outputs/phase-6/failure-cases.md`）
- Phase 7 成果物（`outputs/phase-7/main.md`, `outputs/phase-7/coverage.md`）
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

## 実行手順

1. Phase 5〜Phase 7 の成果物を読み、ADR-0001 の改稿候補（用語揺れ・論理飛び・冗長表現・引用粒度）を抽出する。
2. before-after.md に改稿候補を「before / after / 理由 / 出典」の列で整理する。
3. 派生元 design.md / review.md と ADR-0001 の用語が一致するよう統一案を確定する。
4. Alternatives Considered の各節（husky / pre-commit / native git hooks）の構成を揃え、論点順序の統一案を before-after.md に追記する。
5. backlink 配置と ADR 単独可読性のバランスを再評価し、改稿後の方針を main.md に要約する。
6. main.md にリファクタリング適用範囲・残課題・Phase 9 へ引き継ぐ品質ゲート項目を明記する。
7. commit / push / PR 作成は行わず、Phase 13 のユーザー承認待ちを維持する。

## 多角的チェック観点（AIが判断）

- 矛盾なし: リファクタリング結果が Phase 1 要件 / Phase 2 設計 / Phase 3 レビューと矛盾しない。
- 漏れなし: Phase 5〜Phase 7 で挙がった指摘が before-after.md に網羅されている。
- 整合性あり: 用語・章立て・引用粒度が ADR-0001 全体および派生元ドキュメントで統一されている。
- 依存関係整合: Phase 9 品質保証へ引き継ぐ改稿適用後の状態が一意に定義されている。

## サブタスク管理

| サブタスク | 状態 | 証跡 |
| --- | --- | --- |
| 改稿候補の抽出 | completed | outputs/phase-8/before-after.md |
| 用語統一の確定 | completed | outputs/phase-8/before-after.md |
| Alternatives Considered の構成統一 | completed | outputs/phase-8/before-after.md |
| backlink 配置の再点検 | completed | outputs/phase-8/main.md |
| リファクタリング要約と引継ぎ事項の整理 | completed | outputs/phase-8/main.md |
| 承認前禁止事項確認 | pending_user_approval | Phase 13 user_approval_required |

## 成果物

- `outputs/phase-8/main.md`
- `outputs/phase-8/before-after.md`

## 統合テスト連携

docs-only / NON_VISUAL のため統合テストは Phase 11 の docs walkthroughで代替する。Phase 8 のリファクタリング結果は Phase 9 品質ゲートおよび Phase 11 docs walkthroughの入力となる。

## 完了条件

- [ ] リファクタリング成果物が artifacts.json と一致する。
- [ ] Phase 5〜Phase 7 で挙がった指摘がすべて before-after.md に反映されている。
- [ ] 用語・章立て・Alternatives Considered の構成が統一されている。
- [ ] Phase 9 へ引き継ぐ品質ゲート項目が main.md に明記されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

## タスク100%実行確認【必須】

- [ ] 実行タスクを確認した。
- [ ] 参照資料と成果物を照合した。
- [ ] docs-only / NON_VISUAL 境界を維持した。
- [ ] commit / push / PR 作成を行っていない。

## 次Phase

- Phase 9「品質保証」へ Phase 8 成果物を入力として引き継ぐ。
- Phase 13 はユーザー承認待ちであり、承認なしに commit / push / PR 作成へ進まない。
