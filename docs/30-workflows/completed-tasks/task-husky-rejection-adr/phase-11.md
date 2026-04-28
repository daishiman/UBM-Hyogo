# Phase 11: 手動テスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-husky-rejection-adr |
| Phase | 11 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | documentation |

## 目的

ADR-0001 と関連 backlink・命名規約・参照整合性を、人間の目視と CLI による docs walkthrough で検証する。docs-only / NON_VISUAL 区分のため自動 UI テストとスクリーンショット生成は行わず、Phase 11 必須3点（main.md / manual-smoke-log.md / link-checklist.md）で統合テスト相当の証跡を残す。

## 実行タスク

- ADR-0001 が workflow outputs に依存せず単独で読了できることを目視確認する。
- workflow outputs（task-git-hooks-lefthook-and-post-merge の Phase 2 design ADR-01 セクション末尾 / Phase 3 review 第5節末尾）から ADR-0001 への backlink がクリック可能で正しい相対パスを指していることを確認する。
- 命名規約 `NNNN-<slug>.md`（`0001-git-hook-tool-selection.md`）が Phase 2 設計と一致していることを確認する。
- Alternatives Considered で挙げた husky / pre-commit / native git hooks 各々の不採用理由が、派生元（Phase 2 design / Phase 3 review / Phase 12 unassigned-task-detection B-2）まで一次資料追跡できることを確認する。
- AC-1〜AC-6 を 1 件ずつ `manual-smoke-log.md` に展開し、実行コマンド / 期待結果 / 実測 / PASS or FAIL を記録する。
- NON_VISUAL のため `screenshot-plan.json` と `screenshots/` は作成せず、スクリーンショットを作らない理由を `manual-smoke-log.md` に記録する。

## 参照資料

- Phase 1〜Phase 10 成果物
- `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md`
- `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-3/review.md`
- `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/unassigned-task-detection.md`
- `lefthook.yml`
- `doc/00-getting-started-manual/lefthook-operations.md`
- `CLAUDE.md`

## 依存成果物

- Phase 1: `outputs/phase-1/main.md`
- Phase 2: `outputs/phase-2/main.md`, `outputs/phase-2/design.md`
- Phase 3: `outputs/phase-3/main.md`, `outputs/phase-3/review.md`
- Phase 4: `outputs/phase-4/main.md`, `outputs/phase-4/test-matrix.md`
- Phase 5: `outputs/phase-5/main.md`, `outputs/phase-5/runbook.md`
- Phase 6: `outputs/phase-6/main.md`, `outputs/phase-6/failure-cases.md`
- Phase 7: `outputs/phase-7/main.md`, `outputs/phase-7/coverage.md`
- Phase 8: `outputs/phase-8/main.md`, `outputs/phase-8/before-after.md`
- Phase 9: `outputs/phase-9/main.md`, `outputs/phase-9/quality-gate.md`
- Phase 10: `outputs/phase-10/main.md`, `outputs/phase-10/go-no-go.md`

## 実行手順

1. Phase 10 までの成果物を読み、テスト対象（ADR-0001 本体・backlink 2 箇所・命名規約・Alternatives Considered の追跡可能性）を確定する。
2. `manual-smoke-log.md` に AC-1〜AC-6 を 1 項目ずつ展開し、確認手順とコマンド例（grep / ls 等）を併記する。
3. docs walkthrough を実行し、結果（PASS / FAIL / 観察事項）を `manual-smoke-log.md` に記録する。
4. `link-checklist.md` に backlink の出発点 URL / 着地点 URL / 相対パス / 期待挙動を表形式で列挙する。
5. `manual-smoke-log.md` に証跡の主ソース、screenshot を作らない理由（docs-only / NON_VISUAL）、実行日時、実行者を記録する。
6. 全成果物が artifacts.json の outputs 3 件と一致することを確認する。
7. commit / push / PR 作成は行わず、Phase 13 のユーザー承認待ちを維持する。

## 多角的チェック観点（AIが判断）

- 矛盾なし: docs walkthrough の判定基準が AC-1〜AC-6 と一意に対応する。
- 漏れなし: ADR-0001 単独可読性 / backlink / 命名規約 / Alternatives Considered 追跡の 4 観点が全てチェック対象に含まれる。
- 整合性あり: NON_VISUAL 区分と Phase 11 必須3点の成果物が artifacts.json と一致する。
- 依存関係整合: Phase 10 までの go/no-go 判定結果が手動テスト範囲に反映されている。

## サブタスク管理

| サブタスク | 状態 | 証跡 |
| --- | --- | --- |
| ADR-0001 単独可読性確認 | completed | outputs/phase-11/manual-smoke-log.md |
| backlink クリック確認 | completed | outputs/phase-11/link-checklist.md |
| 命名規約遵守確認 | completed | outputs/phase-11/manual-smoke-log.md |
| Alternatives Considered 一次資料追跡確認 | completed | outputs/phase-11/manual-smoke-log.md |
| screenshot 不要理由の記録 | completed | outputs/phase-11/manual-smoke-log.md |
| 承認前禁止事項確認 | pending_user_approval | Phase 13 user_approval_required |

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`

## 統合テスト連携

本 Phase で統合テスト相当の docs walkthrough を実施し、docs-only / NON_VISUAL タスクの品質保証を完結させる。自動 UI テスト・スクリーンショット差分検証は対象外で、成果物は main.md / manual-smoke-log.md / link-checklist.md の3点に限定する。

## 完了条件

- [ ] manual-smoke-log.md が AC-1〜AC-6 を網羅している。
- [ ] backlink が 2 箇所（Phase 2 design / Phase 3 review）について検証されている。
- [ ] 命名規約 `0001-git-hook-tool-selection.md` の遵守が確認されている。
- [ ] screenshot-plan.json と screenshots/ を作成しない理由が manual-smoke-log.md に記録されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

## タスク100%実行確認【必須】

- [ ] 実行タスクを確認した。
- [ ] 参照資料と成果物を照合した。
- [ ] NON_VISUAL 境界を維持した。
- [ ] commit / push / PR 作成を行っていない。

## 次Phase

- Phase 12「ドキュメント更新」へ Phase 11 成果物を入力として引き継ぐ。
- Phase 13 はユーザー承認待ちであり、承認なしに commit / push / PR 作成へ進まない。
