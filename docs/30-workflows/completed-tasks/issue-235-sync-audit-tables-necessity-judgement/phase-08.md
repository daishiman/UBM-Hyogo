# Phase 8: 正本突合（DRY 化の再解釈）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| 種別 | docs-only / 設計判定（NON_VISUAL） |
| implementation_mode | verify_existing |
| 前 Phase | 7（AC マトリクス） |
| 次 Phase | 9（品質保証：正本整合監査） |
| 主成果物 | outputs/phase-08/main.md |

## 目的

実装タスクの「DRY 化（共通化・重複コード排除）」を、判定タスク向けに「正本突合（重複記述・矛盾の排除）」へ再解釈する（Phase 3 §1 の再解釈方針に整合）。本判定が以下 2 つの既存正本と重複・矛盾しないことを突合し、判定の正本を一意に固定する。

- 親 close-out `ut21-forms-sync-conflict-closeout` Phase 2 §(d)（保留方針・解除条件）
- `.claude/skills/aiworkflow-requirements/references/task-workflow.md` の `sync_jobs` current facts

## 実行タスク

1. **親 §(d) 突合**: 親 Phase 2 §(d) の「保留対象 / 保留条件 / 解除条件 / 受け皿タスク」と本判定の関係を表化し、本判定が §(d) を「上書き」ではなく「承継・確定」する関係であることを示す。
2. **task-workflow.md 突合**: current facts の「`sync_audit_logs` / `sync_audit_outbox` は新設しない」記述を、本判定により「UT21-U02 / Issue #235 で新設不要確定」へ同期し、矛盾しないことを確認する。
3. **重複記述の排除方針**: 判定正本を `outputs/phase-02/gap-analysis-and-verdict.md` に一意化し、Phase 5 / 7 / 9 / 10 等の他成果物は判定本文を再記述せず「パス参照」で承継する DRY 方針を明記する。
4. **二重正本回避の確認**: 親 §(d)・task-workflow.md・本判定の三者で「判定結論を持つ正本は本 workflow のみ」「親 §(d) は委譲記録」「task-workflow.md は current facts スナップショット」と役割を分離して固定する。

## 参照資料

- `docs/30-workflows/completed-tasks/issue-235-sync-audit-tables-necessity-judgement/index.md`
- `docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 統合テスト連携

- 本 Phase は docs-only / NON_VISUAL 判定タスクのため、新規統合テストは追加しない。
- 判定の一次証跡は Phase 11 の read-only 再現コマンドで取得する。

## 完了条件

- [ ] 親 §(d) と本判定の関係表が作成され「承継・確定（上書きでない）」が明記されている
- [ ] task-workflow.md current facts と矛盾しないことが確認されている
- [ ] 判定正本を gap-analysis-and-verdict.md に一意化する DRY 方針が明記されている
- [ ] 三者の役割分離（二重正本回避）が固定されている

## 成果物/実行手順

- `outputs/phase-08/main.md`
