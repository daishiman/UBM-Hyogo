# Phase 06: テスト拡充

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-husky-rejection-adr |
| Phase | 6 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | documentation |

## 目的

Phase 4 のテストマトリクスでは捕捉しきれない「ADR が将来失敗するケース」を列挙し、回避策と検出手段を failure-cases.md に明文化する。リンク切れ・他 ADR との番号衝突・ADR 集約先ディレクトリ移動・派生元 workflow outputs アーカイブ等のシナリオを ADR-0001 の長期可読性に対する脅威として扱い、Phase 7 カバレッジ確認 / Phase 11 docs walkthroughで再検出可能な状態にする。

## 実行タスク

- 失敗シナリオ S-1: ADR-0001 から派生元 workflow outputs / `lefthook.yml` / `doc/00-getting-started-manual/lefthook-operations.md` へのリンクが切れるケースを列挙し、検出手段（リンクチェッカ / 手動 grep）と回避策（相対リンク維持 / アーカイブ時のリダイレクト）を明記する。
- 失敗シナリオ S-2: 他 ADR が追加された際に番号 `0001` が衝突する / 採番ルールが破られるケースを列挙し、回避策（命名規約 `NNNN-<slug>.md` の遵守 / index 文書の維持）を明記する。
- 失敗シナリオ S-3: ADR 集約先ディレクトリが将来移動・改名されるケース（例: `doc/decisions/` → `doc/adr/`）を列挙し、回避策（移動時の backlink 一括更新手順 / リダイレクトメモ）を明記する。
- 失敗シナリオ S-4: 派生元 workflow outputs（`docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/`）が完了後さらにアーカイブ・移動された際に backlink が壊れるケースを列挙し、回避策を明記する。
- 失敗シナリオ S-5: `lefthook.yml` / `doc/00-getting-started-manual/lefthook-operations.md` の改訂で ADR-0001 の Decision / Consequences が陳腐化するケースを列挙し、ADR Superseded 化の手順を明記する。
- 各失敗シナリオに Phase 4 テストマトリクスの検証項目 ID との対応関係を付与し、Phase 7 カバレッジ確認 / Phase 11 docs walkthroughの入力とする。

## 参照資料

- Phase 1 成果物（`outputs/phase-1/main.md`）
- Phase 2 成果物（`outputs/phase-2/main.md`, `outputs/phase-2/design.md`）
- Phase 3 成果物（`outputs/phase-3/main.md`, `outputs/phase-3/review.md`）
- Phase 4 成果物（`outputs/phase-4/main.md`, `outputs/phase-4/test-matrix.md`）
- Phase 5 成果物（`outputs/phase-5/main.md`, `outputs/phase-5/runbook.md`）
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
- Phase 4: `outputs/phase-4/main.md`, `outputs/phase-4/test-matrix.md`
- Phase 5: `outputs/phase-5/main.md`, `outputs/phase-5/runbook.md`

## 実行手順

1. Phase 1〜5 成果物を読み、テストマトリクスと runbook で扱われていない長期可読性リスクを洗い出す。
2. 失敗シナリオ S-1〜S-5 を failure-cases.md に列挙し、各シナリオに「発生条件 / 影響範囲 / 検出手段 / 回避策 / Superseded 化基準」を割り当てる。
3. 各失敗シナリオを Phase 4 テストマトリクスの検証項目 ID と対応付け、未カバーの検証項目があれば test-matrix への差し戻しメモを記録する。
4. 失敗シナリオごとに Phase 11 docs walkthroughへ引き渡すチェック項目を抽出する。
5. failure-cases.md と本 Phase main.md を artifacts.json の outputs と一致させる。
6. commit / push / PR 作成は行わず、Phase 13 のユーザー承認待ちを維持する。

## 多角的チェック観点（AIが判断）

- 矛盾なし: 失敗シナリオが Phase 2 設計 / Phase 5 runbook の前提を覆さない。
- 漏れなし: リンク切れ / 番号衝突 / ディレクトリ移動 / 派生元アーカイブ / 仕様陳腐化の 5 シナリオが網羅されている。
- 整合性あり: 各シナリオの検出手段・回避策が一次資料（`lefthook.yml` / `doc/00-getting-started-manual/lefthook-operations.md` / 派生元 outputs）から導出可能。
- 依存関係整合: Phase 7 カバレッジ確認 / Phase 11 docs walkthroughへ渡す検証項目 ID が紐付いている。

## サブタスク管理

| サブタスク | 状態 | 証跡 |
| --- | --- | --- |
| S-1 リンク切れシナリオ記述 | completed | outputs/phase-6/failure-cases.md |
| S-2 番号衝突シナリオ記述 | completed | outputs/phase-6/failure-cases.md |
| S-3 集約先移動シナリオ記述 | completed | outputs/phase-6/failure-cases.md |
| S-4 派生元アーカイブシナリオ記述 | completed | outputs/phase-6/failure-cases.md |
| S-5 仕様陳腐化シナリオ記述 | completed | outputs/phase-6/failure-cases.md |
| 検証項目 ID との対応付け | completed | outputs/phase-6/failure-cases.md |
| 承認前禁止事項確認 | pending_user_approval | Phase 13 user_approval_required |

## 成果物

- `outputs/phase-6/main.md`
- `outputs/phase-6/failure-cases.md`

## 統合テスト連携

docs-only / NON_VISUAL のため統合テストは Phase 11 の docs walkthroughで代替する。Phase 6 で列挙した失敗シナリオは Phase 11 のチェックリスト項目および Phase 12 のドキュメント更新の運用注意事項として引き渡す。

## 完了条件

- [ ] テスト拡充の成果物が artifacts.json と一致する。
- [ ] 失敗シナリオ S-1〜S-5 が failure-cases.md に列挙され、検出手段・回避策・Superseded 化基準が割り当てられている。
- [ ] 各シナリオが Phase 4 テストマトリクスの検証項目 ID と対応付けられている。
- [ ] Phase 11 docs walkthroughへ引き渡すチェック項目が抽出されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

## タスク100%実行確認【必須】

- [ ] 実行タスクを確認した。
- [ ] 参照資料と成果物を照合した。
- [ ] docs-only / NON_VISUAL 境界を維持した。
- [ ] commit / push / PR 作成を行っていない。

## 次Phase

- Phase 7「カバレッジ確認」へ Phase 6 成果物を入力として引き継ぐ。
- Phase 13 はユーザー承認待ちであり、承認なしに commit / push / PR 作成へ進まない。
