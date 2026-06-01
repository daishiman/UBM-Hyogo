# Phase 9: 品質保証（正本整合監査）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 / 13 |
| 種別 | docs-only / 設計判定（NON_VISUAL） |
| implementation_mode | verify_existing |
| 前 Phase | 8（正本突合：DRY 化） |
| 次 Phase | 10（最終レビュー：GO/NO-GO） |
| 主成果物 | outputs/phase-09/main.md |

## 目的

実装タスクの「品質保証（テスト・lint）」を判定タスク向けに「正本整合監査」へ再解釈する（Phase 3 §1 の再解釈方針に整合）。判定の前提（`sync_audit_*` 非存在 / 不変条件 #4・#5 不変 / PII 非漏洩 / verdict 一意 / docs-only）が崩れていないことを再検証し、partial（穴）が 0 件であることを確定する。

## 実行タスク

1. **`sync_audit_*` 非存在の再確認**: `rg` で `apps/api/migrations` / `apps/api/src` を再検索し、`sync_audit_logs` / `sync_audit_outbox` テーブルが存在しないことを再確認する。`0002_sync_logs_locks.sql` コメント・`task-workflow.md` の `sync_audit`（別文脈の言及・テーブル名参照）を「判定対象 2 テーブルとは別物」として明示区別する（誤検知防止）。
2. **不変条件 #4 / #5 違反スキャン**: 本 workflow の判定文書群に、Form schema 外データの admin-managed 分離（#4）を崩す記述・`apps/web` から D1 を直接参照する記述（#5）が 0 件であることをスキャンする。
3. **PII 漏洩スキャン**: 判定文書に email / name 等の実 PII 値が混入していないこと（`metrics_json` の `PII_FORBIDDEN_KEYS` 言及は仕様参照であり実値ではない）を確認する。
4. **verdict 一意性の再確認**: 判定結論が `outputs/phase-02/gap-analysis-and-verdict.md` §4 の「新設不要」に一意であり、他成果物が異なる結論を持たないことを確認する。
5. **docs-only（コード変更 0）確認**: `git status --short apps packages` が 0 件であること（判定がコード変更を伴わないこと）の確認方針を記録する（実コマンド実行は Phase 11 一次証跡）。
6. **partial（穴）判定**: 監査で穴が見つかった場合は NR-N として記録する。本タスクは穴なし（partial 無）であることを宣言する。

## 参照資料

- `docs/30-workflows/completed-tasks/issue-235-sync-audit-tables-necessity-judgement/index.md`
- `docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 統合テスト連携

- 本 Phase は docs-only / NON_VISUAL 判定タスクのため、新規統合テストは追加しない。
- 判定の一次証跡は Phase 11 の read-only 再現コマンドで取得する。

## 完了条件

- [ ] `sync_audit_*` 非存在の再確認結果が記録され、別文脈 `sync_audit` 言及との区別が明示されている
- [ ] 不変条件 #4 / #5 違反 0 件が記録されている
- [ ] PII 漏洩 0 件が記録されている
- [ ] verdict 一意性が再確認されている
- [ ] docs-only（コード変更 0）確認方針が記録されている
- [ ] partial（穴）0 件 = partial 無が宣言されている（穴があれば NR-N 記録）

## 成果物/実行手順

- `outputs/phase-09/main.md`
