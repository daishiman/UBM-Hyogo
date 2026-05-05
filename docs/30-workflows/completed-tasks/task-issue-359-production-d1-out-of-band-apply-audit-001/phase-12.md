# Phase 12: ドキュメント更新

[実装区分: ドキュメントのみ仕様書]

## 目的

監査結果を docs / system spec / skill feedback / 未タスク検出に同期する。task-specification-creator skill 規定の **7 固定成果物 + 判定別追加成果物** を実体配置する。

## 7 固定成果物

| # | path | 内容 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 サマリ / 7 成果物リスト / 判定別追加成果物 |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル）+ Part 2（技術者レベル）。本タスクの「実装」=「ドキュメント更新作業」を説明 |
| 3 | `outputs/phase-12/documentation-changelog.md` | 本タスクで追加 / 更新したドキュメント一覧 |
| 4 | `outputs/phase-12/system-spec-update-summary.md` | `aiworkflow-requirements` への反映方針（cross-reference または再発防止策の追記対象） |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 残課題 0 件でも出力必須。`unattributed` 時に hook / approval gate 実装の follow-up タスクを未タスクとして起票する |
| 6 | `outputs/phase-12/skill-feedback-report.md` | 改善点なしでも出力必須。3 観点固定（テンプレ / ワークフロー / ドキュメント） |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 7 ファイル実体配置 / docs-only 判定 / spec_created workflow_state 据え置き等のコンプライアンスチェック |

## 判定別追加成果物（排他）

| 判定 | 追加成果物 | 内容 |
| --- | --- | --- |
| `confirmed` | `outputs/phase-12/cross-reference-plan.md` | `task-issue-191-production-d1-schema-aliases-apply-001` の `outputs/phase-13/main.md` または `verification-report.md` への追記内容（行・セクション・参照 evidence path） |
| `unattributed` | `outputs/phase-12/recurrence-prevention-formalization.md` | 再発防止策本文 + 反映先（runbook / lessons-learned / aiworkflow-requirements）+ 反映時の差分案 |

## Step 1: 実装ガイド作成

- Part 1（中学生レベル）: 「production の D1 データベースに、誰が・いつ・どんな許可で変更を加えたか分からない状態だったので、その出所を調査して記録する」を平易に説明
- Part 2（技術者レベル）: 監査ストラテジ・判定アルゴリズム・redaction / read-only 不変条件を技術用語で記述

## Step 2: システム仕様書更新

- Step 2-A: `aiworkflow-requirements/changelog/` に `<YYYYMMDD>-issue434-out-of-band-apply-audit.md` を追加（監査結果サマリ）
- Step 2-B: `task-workflow-active.md` / `resource-map.md` / `quick-reference.md` / artifact inventory へ spec_created workflow として same-wave 登録する
- Step 2-C: 判定別の追記:
  - confirmed → `task-issue-191-...` artifact-inventory に cross-reference を追記
  - unattributed → 該当 runbook / lessons-learned へ追記
- Step 2 (条件付き): `unattributed` 時、新 hook / approval gate 仕様の `aiworkflow-requirements/references/` 追加

## Step 3: ドキュメント更新履歴作成

- 本ワークフローで追加 / 更新した全ファイル path を `documentation-changelog.md` に列挙

## Step 4: 未タスク検出レポート

- `unattributed` 時: 「production D1 apply approval gate 強化（hook / script 実装）」を未タスクとして起票候補に列挙（実装は CONST_007 例外条件により別 follow-up）
- `confirmed` 時: 0 件でもファイル実体配置（テンプレに従い「未タスクなし」と明記）

## Step 5: skill フィードバック

- テンプレ改善: 「監査系 docs-only タスク用の Phase 11 NON_VISUAL evidence テンプレ」が `phase-11-cloudflare-cli-non-visual-evidence.md` 等で既存だが、`d1_migrations` ledger 監査用バリエーションの追加要否を記載
- ワークフロー改善: read-only audit task type の判定基準を `references/task-type-decision.md` に追記する余地
- ドキュメント改善: 改善点なしでも 0 件として明記

## Step 6: コンプライアンスチェック

- 7 ファイル実体存在
- docs-only / NON_VISUAL / spec_created の整合
- workflow root の `metadata.workflow_state` を `spec_created` のまま据え置き
- `phases[].status` のみ Phase 別に更新（仕様書作成段階では全 phase が `spec_created`、Phase 11 実行後に当該 Phase のみ `completed`）

## 完了条件

- [ ] 7 固定成果物すべて実体存在
- [ ] 判定に応じた追加成果物（cross-reference-plan.md または recurrence-prevention-formalization.md）が実体存在
- [ ] workflow root の `workflow_state` が `spec_created`（または Phase 11 実行後は `runtime_evidence_captured`）
- [ ] aiworkflow-requirements への反映方針が確定

## 注意事項

- 本仕様書作成段階でも Phase 12 の 7 固定成果物は spec_created placeholder として実体配置する。Phase 11 実行後に判定別追加成果物を同じ wave で更新する。
- `aiworkflow-requirements` 同期は Phase 12 内で実施し、本タスクと分離しない

## メタ情報

- taskType: docs-only
- visualEvidence: NON_VISUAL
- workflow_state: spec_created

## 実行タスク

- 詳細は本 Phase の既存セクションを参照する。

## 参照資料

- index.md
- artifacts.json
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 成果物

- 対応する `outputs/phase-*` 配下の `main.md`。

## 統合テスト連携

- docs-only / NON_VISUAL のため UI 統合テストは対象外。Phase 11 の read-only audit evidence と Phase 12 compliance check で検証する。
