# Phase 05: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-husky-rejection-adr |
| Phase | 5 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | documentation |

## 目的

Phase 2 設計 / Phase 3 レビュー / Phase 4 テストマトリクスに基づき、ADR-0001 を執筆して配置するための具体的な実装手順を runbook.md に確定する。ADR ディレクトリ作成 → ADR-0001 ファイル執筆 → 派生元 workflow outputs への backlink 追記、というステップごとに対象ファイル・コマンド・検証手段を明示し、後続 Phase（または別 AI セッション）が決定論的に再実行できる状態にする。

## 実行タスク

- ADR 集約先ディレクトリ（Phase 2 で確定した `doc/decisions/` 等）の作成手順を runbook に明記する（mkdir 対象パス・既存衝突確認）。
- ADR-0001 ファイル（`0001-git-hook-tool-selection.md`）の執筆手順を Context / Decision / Consequences / Alternatives Considered / References のセクション単位で順序付けて明記する。
- 各セクションに転記する派生元テキスト範囲（Phase 2 design.md の引用方針）と、`lefthook.yml` / `doc/00-getting-started-manual/lefthook-operations.md` から参照する内容を runbook のステップに割り当てる。
- 派生元 workflow outputs（`docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md` / `phase-3/review.md`）への backlink 追記手順を、対象ファイル・追記位置・追記文言の粒度で明記する。
- 各ステップ後の検証コマンド（リンク解決確認 / 必須セクション充足確認 / 一次資料との非矛盾確認）を Phase 4 テストマトリクスの検証項目 ID と紐付ける。
- ロールバック手順（ADR ファイル削除・backlink 削除）を runbook 末尾に明記する。

## 参照資料

- Phase 1 成果物（`outputs/phase-1/main.md`）
- Phase 2 成果物（`outputs/phase-2/main.md`, `outputs/phase-2/design.md`）
- Phase 3 成果物（`outputs/phase-3/main.md`, `outputs/phase-3/review.md`）
- Phase 4 成果物（`outputs/phase-4/main.md`, `outputs/phase-4/test-matrix.md`）
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md`
- `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-3/review.md`
- `lefthook.yml`
- `doc/00-getting-started-manual/lefthook-operations.md`
- `CLAUDE.md`

## 依存成果物

- Phase 1: `outputs/phase-1/main.md`
- Phase 2: `outputs/phase-2/main.md`, `outputs/phase-2/design.md`
- Phase 3: `outputs/phase-3/main.md`, `outputs/phase-3/review.md`
- Phase 4: `outputs/phase-4/main.md`, `outputs/phase-4/test-matrix.md`

## 実行手順

1. Phase 1〜4 成果物を読み、設計・レビュー・テストマトリクスから runbook に落とし込む情報を抽出する。
2. ADR ディレクトリ作成ステップを runbook の最初のステップとして記述する（対象パス・既存衝突確認・期待ディレクトリ構造）。
3. ADR-0001 ファイル執筆ステップを Context / Decision / Consequences / Alternatives Considered / References の順で章立てし、各章で参照する派生元テキスト範囲を割り当てる。
4. 派生元 workflow outputs への backlink 追記ステップを、対象ファイルパス・追記位置・追記文言の粒度で記述する。
5. 各ステップ末尾に Phase 4 テストマトリクスの検証項目 ID と検証手段を紐付ける。
6. ロールバック手順を runbook 末尾に明記し、runbook.md と本 Phase main.md を artifacts.json の outputs と一致させる。
7. commit / push / PR 作成は行わず、Phase 13 のユーザー承認待ちを維持する。

## 多角的チェック観点（AIが判断）

- 矛盾なし: runbook の各ステップが Phase 2 設計 / Phase 3 レビュー / Phase 4 テストマトリクスと矛盾しない。
- 漏れなし: ADR ディレクトリ作成 / ADR-0001 執筆 / backlink 追記 / 検証 / ロールバックの全ステップが揃っている。
- 整合性あり: 各ステップで対象ファイル・コマンド・期待結果・検証項目 ID が一貫して紐付いている。
- 依存関係整合: Phase 6 失敗ケース / Phase 7 カバレッジ確認 / Phase 11 docs walkthroughへ渡す前提が runbook で確定している。

## サブタスク管理

| サブタスク | 状態 | 証跡 |
| --- | --- | --- |
| ADR ディレクトリ作成手順記述 | completed | outputs/phase-5/runbook.md |
| ADR-0001 セクション別執筆手順記述 | completed | outputs/phase-5/runbook.md |
| 派生元テキスト範囲の割り当て | completed | outputs/phase-5/runbook.md |
| backlink 追記手順記述 | completed | outputs/phase-5/runbook.md |
| 検証項目 ID とステップの紐付け | completed | outputs/phase-5/runbook.md |
| ロールバック手順記述 | completed | outputs/phase-5/runbook.md |
| 承認前禁止事項確認 | pending_user_approval | Phase 13 user_approval_required |

## 成果物

- `outputs/phase-5/main.md`
- `outputs/phase-5/runbook.md`

## 統合テスト連携

docs-only / NON_VISUAL のため統合テストは Phase 11 の docs walkthroughで代替する。Phase 5 runbook は Phase 11 で実際に実行され、結果が manual-smoke-log.md に記録される前提で記述する。

## 完了条件

- [ ] 実装ランブックの成果物が artifacts.json と一致する。
- [ ] ADR ディレクトリ作成 / ADR-0001 執筆 / backlink 追記 / 検証 / ロールバックが全てステップとして含まれている。
- [ ] 各ステップが Phase 4 テストマトリクスの検証項目 ID と紐付いている。
- [ ] runbook が後続 Phase または別 AI セッションで決定論的に再実行可能な粒度になっている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

## タスク100%実行確認【必須】

- [ ] 実行タスクを確認した。
- [ ] 参照資料と成果物を照合した。
- [ ] docs-only / NON_VISUAL 境界を維持した。
- [ ] commit / push / PR 作成を行っていない。

## 次Phase

- Phase 6「テスト拡充」へ Phase 5 成果物を入力として引き継ぐ。
- Phase 13 はユーザー承認待ちであり、承認なしに commit / push / PR 作成へ進まない。
