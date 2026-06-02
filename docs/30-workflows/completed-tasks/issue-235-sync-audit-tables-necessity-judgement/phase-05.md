# Phase 5: 判定確定ランブック（verdict 記録）

> 親骨格: NON_VISUAL / 監査タスク用 Phase Template。Phase 3 §1 の再解釈により Phase 5 = 判定確定（実装 GREEN の再解釈）に固定。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 種別 | docs-only / 設計判定（NON_VISUAL） |
| implementation_mode | verify_existing |
| 前 Phase | 4（raw evidence 収集） |
| 次 Phase | 6（異常系：誤判定シナリオ） |
| 主成果物 | outputs/phase-05/verdict-runbook.md |

## 目的

Phase 2 `gap-analysis-and-verdict.md` の判定（新設不要）を承継し、確定判定を正式記録として固定する。実装タスクの「実装 GREEN（テスト通過）」を、判定タスクでは「verdict 確定 + docs-only 確定 + 解除条件の明文化」に再解釈する。本 Phase は新たな判定を生成せず、Phase 2 の正本判定を上書きしないまま承継・確定する（二重正本回避）。

## docs-only / Ownership 宣言

- Phase 2 の確定判定が正本。Phase 5 はそれを承継・確定するランブックであり、判定内容を改変しない。
- 判定が「新設不要」であるため、`apps/api/migrations` / `apps/api/src` への変更は一切発生しない（コード変更ゼロ）。CONST_004 例外に該当する旨を確定記録する。

## 実行タスク

1. **判定の承継記録**: Phase 2 の `判定: 新設不要（NO NEW TABLE REQUIRED）` を一意の確定判定として記録する。新設対象（`sync_audit_logs` / `sync_audit_outbox`）と充足手段（`sync_jobs` + `sync_job_logs` + zod `metrics_json`）を明示する。
2. **3 条件非該当の要約**: 判定基準 4.3 の 3 条件（行単位差分必須 / 書込失敗の別経路記録 / 外部監査・コンプラ分離）がすべて非該当であることを要約表で再掲する。
3. **docs-only 確定**: コード変更ゼロ・CONST_004 例外を確定記録し、`git status --short apps packages` 0 件を Phase 11 で実証する旨を記す。
4. **解除条件の明文化**: 将来トリガ T-1/T-2/T-3 と受け皿（別実装タスク）を記録し、CONST_005 の「今回完了すべき改善の先送り」に該当しない（現時点で該当 0 件の将来条件）旨を明記する。
5. **新設要に転じた場合の起票手順**: 後続実行者が迷わない粒度で、マイグレーション追加箇所・writer 配置・test 方針の概略を箇条書きにする。ただし本タスクではこの起票を**行わない**。
6. **親 close-out §(d) 整合**: U02（本タスク）が解除条件の判定主体であった旨と、§(d) 保留方針を上書きせず承継した旨を記録する。

## 参照資料

- `docs/30-workflows/completed-tasks/issue-235-sync-audit-tables-necessity-judgement/index.md`
- `docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 統合テスト連携

- 本 Phase は docs-only / NON_VISUAL 判定タスクのため、新規統合テストは追加しない。
- 判定の一次証跡は Phase 11 の read-only 再現コマンドで取得する。

## 完了条件

- [ ] Phase 2 判定（新設不要）を一意に承継記録している
- [ ] 3 条件非該当の要約表が再掲されている
- [ ] docs-only（コード変更ゼロ・CONST_004 例外）が確定記録されている
- [ ] 解除条件 T-1/T-2/T-3 と受け皿が明文化され、CONST_005 非該当が明記されている
- [ ] 新設要に転じた場合の起票手順が後続実行者向けの粒度で記録されている（本タスクでは起票しない旨も明記）
- [ ] 親 close-out §(d) との整合が記録されている

## 成果物/実行手順

- `outputs/phase-05/verdict-runbook.md`
