# Phase 12 成果物: skill-feedback-report

改善点なしでも必須出力。本タスク（docs-only ADR 起票）を通じて task-specification-creator / aiworkflow-requirements skill の改善余地を 3 観点で記録する。

## 観点 1: テンプレート改善

**気付き**: docs-only ADR 起票タスクの phase 解釈、特に Phase 4「検証戦略」と Phase 11「手動検証 NON_VISUAL 縮約」の運用が、コード変更タスク前提のテンプレートと重複した。

**提案**: `task-specification-creator` skill に「ADR 起票タスク specialized template」を追加し、以下を最初から組み込む:

- Phase 4 検証コマンドの 90% は doc-only grep（deploy target 抽出 / リンク死活 / 不変条件 抵触ガード / 関連タスク重複）に収束する → 共通テンプレ化
- Phase 11 NON_VISUAL 宣言 3 ファイル冒頭固定 + メタ 5 項目をテンプレ化
- Phase 12 Step 2 を「stale contract withdrawal / topology drift 正本同期」用途で発火する fallback 文面のテンプレ化

**期待効果**: ADR 起票タスクの Phase 4-11 仕様作成工数を 30-50% 短縮。

## 観点 2: ワークフロー改善

**気付き**: 本タスクは `task-impl-opennext-workers-migration-001` / `UT-GOV-006-web-deploy-target-canonical-sync` と責務が重なる可能性が高く、Phase 1 識別段階で「重複検知 → 統合 or 棲み分け判断」を機械的に行う仕組みがなかった。Phase 3 ゲートで人手判断した結果、C-1 採択（既存タスクへ stub 吸収）に至ったが、これを Phase 1 で先取りできれば往復が減る。

**提案**: `aiworkflow-requirements` skill に「タスク仕様書作成時、`scope` / `task_path` / `blocks` / `related` から共通キーワードを抽出し、unassigned-task / completed-tasks / 30-workflows index に対して類似度検索を行うステップ」を Phase 0 / Phase 1 に組み込む。検出時は仕様書冒頭に「重複候補 N 件」セクションを自動挿入。

**期待効果**: 重複起票事故の事前防止 + Phase 3 ゲートでの判断材料の早期供給。

## 観点 3: ドキュメント改善

**気付き**: base case 別の差分記述（cutover / 保留 / 段階移行）が `phase-02` / `phase-03` / `phase-05` / `phase-12 system-spec-update-summary` / `unassigned-task-detection` に分散しており、cutover 採択時 / 保留採択時で切り替えるべき記述箇所のマップが散在した。

**提案**: ADR 起票タスク template に「base case 別差分マトリクス」セクションを Phase 1 で必須化し、以降の Phase はそれを参照する規約に統一する。1 箇所の差分マトリクスを更新すれば全 Phase 仕様書の base case 依存記述が整合する DRY 構造を強制。

**期待効果**: base case 切替時の整合維持コストを大幅削減。多 base case ADR タスクで特に有効。

## 完了確認

- [x] 3 観点（テンプレート / ワークフロー / ドキュメント）すべて記述
- [x] 各観点に「気付き / 提案 / 期待効果」3 構造
- [x] ユーザーの明示指示（2026-05-01）により、既存 reference への最小追記として即時反映済み。新規テンプレート作成や大幅な agent 構造変更は行わず、`task-type-decision.md` / `phase-12-documentation-guide.md` / `spec-update-workflow.md` / `spec-guidelines.md` / `orchestration-design-tasks.md` / `phase12-spec-sync-subagent-template.md` に運用ルールを同期した。
