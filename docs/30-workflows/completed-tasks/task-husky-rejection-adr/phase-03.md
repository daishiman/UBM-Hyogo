# Phase 03: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-husky-rejection-adr |
| Phase | 3 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | documentation |

## 目的

Phase 2 で確定した ADR 設計（集約先・命名規約・各セクション記載方針・backlink 位置）を多角的に検証し、Phase 4 以降の実装ランブック作成に進める品質に達していることを保証する。

## 実行タスク

- Phase 2 design.md を読み、AC-1〜AC-6 すべてが設計でカバーされていることを review.md に記録する。
- ADR 集約先選定の妥当性を、CLAUDE.md / 既存 `doc/` 構造 / 将来の他 ADR 追加ユースケースから評価する。
- Alternatives Considered（husky / pre-commit / native git hooks）の不採用理由が一次資料（lefthook.yml / lefthook-operations.md / 派生元 design.md）から導出可能であることを検証する。
- backlink 追加位置の設計が、Phase 12 ドキュメント更新で機械的に適用可能な粒度になっているか確認する。
- ADR 単独可読性（workflow outputs に依存せず読める）を Phase 3 時点でレビューする。

## 参照資料

- Phase 1 成果物（`outputs/phase-1/main.md`）
- Phase 2 成果物（`outputs/phase-2/main.md`, `outputs/phase-2/design.md`）
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md`
- `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-3/review.md`

## 依存成果物

- Phase 1: `outputs/phase-1/main.md`
- Phase 2: `outputs/phase-2/main.md`, `outputs/phase-2/design.md`

## 実行手順

1. Phase 2 成果物を入力として読み、設計内容と AC を突合する。
2. AC-1〜AC-6 ごとに「設計のどの部分でカバーされているか」を review.md に表で整理する。
3. ADR 集約先選定について、新設 / 既存配下の trade-off を再評価し、判断根拠を review.md に追記する。
4. Alternatives Considered の各項目が一次資料から再現可能か検証する。
5. backlink 設計が Phase 12 で機械的適用可能か確認し、適用不能な箇所がある場合は設計差し戻し条件を review.md に明記する。
6. ADR 単独可読性レビューチェックリストを review.md に作成する（Phase 11 の docs walkthroughへ引き渡し）。
7. commit / push / PR 作成は行わず、Phase 13 のユーザー承認待ちを維持する。

## 多角的チェック観点（AIが判断）

- 矛盾なし: 設計レビュー結果が Phase 1 要件 / Phase 2 設計と矛盾しない。
- 漏れなし: AC-1〜AC-6 全てに対するレビュー所見が review.md に記録されている。
- 整合性あり: 不採用理由が一次資料に追跡可能で、ADR 単独可読性を阻害しない。
- 依存関係整合: Phase 4 以降のテスト設計・実装ランブック・manual-smoke-logへ渡す引継ぎ事項が明示されている。

## サブタスク管理

| サブタスク | 状態 | 証跡 |
| --- | --- | --- |
| AC カバレッジ表作成 | completed | outputs/phase-3/review.md |
| ADR 集約先選定の妥当性レビュー | completed | outputs/phase-3/review.md |
| Alternatives Considered の一次資料追跡 | completed | outputs/phase-3/review.md |
| backlink 設計の機械適用可能性レビュー | completed | outputs/phase-3/review.md |
| ADR 単独可読性チェックリスト初版 | completed | outputs/phase-3/review.md |
| 承認前禁止事項確認 | pending_user_approval | Phase 13 user_approval_required |

## 成果物

- `outputs/phase-3/main.md`
- `outputs/phase-3/review.md`

## 統合テスト連携

docs-only / NON_VISUAL のため統合テストは Phase 11 の docs walkthroughで代替する。Phase 3 で作成する ADR 単独可読性チェックリスト初版が Phase 11 の入力となる。

## 完了条件

- [ ] 設計レビューの成果物が artifacts.json と一致する。
- [ ] AC-1〜AC-6 全てに対するレビュー所見が review.md に記録されている。
- [ ] 設計差し戻し事項がある場合は review.md に明記されている（無ければ「指摘なし」を明記）。
- [ ] ADR 単独可読性チェックリスト初版が Phase 11 へ引き渡し可能な形で完成している。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

## タスク100%実行確認【必須】

- [ ] 実行タスクを確認した。
- [ ] 参照資料と成果物を照合した。
- [ ] docs-only / NON_VISUAL 境界を維持した。
- [ ] commit / push / PR 作成を行っていない。

## 次Phase

- Phase 4「テスト設計」へ Phase 3 成果物を入力として引き継ぐ。
- Phase 13 はユーザー承認待ちであり、承認なしに commit / push / PR 作成へ進まない。
