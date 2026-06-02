# Phase 6: 異常系検証（誤判定シナリオ）

> 親骨格: NON_VISUAL / 監査タスク用 Phase Template。Phase 3 §1 の再解釈により Phase 6 = 異常系（誤判定シナリオ）に固定。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| 種別 | docs-only / 設計判定（NON_VISUAL） |
| implementation_mode | verify_existing |
| 前 Phase | 5（判定確定ランブック） |
| 次 Phase | 7（AC マトリクス） |
| 主成果物 | outputs/phase-06/failure-cases.md |

## 目的

実装タスクの「異常系テスト」を、判定タスクでは「誤判定シナリオの列挙と回避策の固定」に再解釈する。本判定（新設不要・docs-only・CLOSED Issue）が陥りやすい誤判定パターンを網羅的に洗い出し、各シナリオに「症状 / 原因 / 回避策」を付すことで、後続実行者・レビュアー・将来の再判定者が同じ誤りを再発させないためのガードレールを固定する。

## docs-only / Ownership 宣言

- 本 Phase はシナリオの列挙・分析のみ。コード・他文書を編集しない。
- 回避策は本 workflow 内の運用ルールとして記録するにとどめ、`.claude/skills/` 等への反映は Phase 12（skill-feedback-report）の責務に委ねる。

## 実行タスク

1. **誤判定シナリオの列挙**: 過剰実装 / 早期却下 / 解除条件曖昧化 / outbox 前例の誤読 / 親 §(d) 二重正本化 / CLOSED Issue reopen / docs-only の completed 誤昇格、の 7 シナリオを表に列挙する。
2. **各シナリオの分解**: 各行に「症状（どう観測されるか）/ 原因（なぜ起きるか）/ 回避策（どう防ぐか）」を付す。
3. **判定論理との接続**: 各回避策が Phase 2 判定・Phase 5 verdict-runbook・index §苦戦想定のどの記述で既に担保されているかを参照付けする。
4. **残存リスクの宣言**: 回避策適用後の残存リスクが MINOR 0 / MAJOR 0 であることを Phase 3 §4 と整合させて宣言する。

## 参照資料

- `docs/30-workflows/completed-tasks/issue-235-sync-audit-tables-necessity-judgement/index.md`
- `docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 統合テスト連携

- 本 Phase は docs-only / NON_VISUAL 判定タスクのため、新規統合テストは追加しない。
- 判定の一次証跡は Phase 11 の read-only 再現コマンドで取得する。

## 完了条件

- [ ] 7 つの誤判定シナリオが表で列挙されている
- [ ] 各シナリオに「症状 / 原因 / 回避策」が付されている
- [ ] 各回避策が既存正本記述（Phase 2 / 5 / index）と接続されている
- [ ] 残存リスク（MINOR 0 / MAJOR 0）が宣言されている

## 成果物/実行手順

- `outputs/phase-06/failure-cases.md`
