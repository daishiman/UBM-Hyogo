# Phase 12: ドキュメント更新（親まとめ）

| 項目      | 値                          |
| --------- | --------------------------- |
| Phase     | 12 / 13                     |
| 名称      | ドキュメント更新            |
| 状態      | implemented_local_evidence_captured |
| 作成日    | 2026-05-28                  |

## 1. Phase 12 strict 7 構成

| #   | File                                          | 役割                                  |
| --- | --------------------------------------------- | ------------------------------------- |
| 1   | `main.md`                                     | Phase 12 概要・進行状況                |
| 2   | `implementation-guide.md`                     | コード変更ガイド + diff + 検証コマンド  |
| 3   | `system-spec-update-summary.md`               | システム仕様 same-wave sync summary    |
| 4   | `documentation-changelog.md`                  | Step 1-A〜1-C / Step 2 個別記録        |
| 5   | `unassigned-task-detection.md`                | 未タスク検出（0 件 + 2 回検証）         |
| 6   | `skill-feedback-report.md`                    | skill 改善 feedback（0 件でも出力）     |
| 7   | `phase12-task-spec-compliance-check.md`       | canonical 9 headings 逐語準拠 compliance |

## 2. 検証コマンド

```bash
bash scripts/verify-pr-ready.sh
mise exec -- pnpm indexes:rebuild
```

## 3. close-out 条件

- strict 7 が全て `present`
- root `artifacts.json` と `outputs/artifacts.json` の parity 0 差分
- canonical 9 headings 逐語準拠 compliance-check が PASS
- workflow_state が実コード投入後に `implemented_local_runtime_pending`（または `implemented_local_evidence_captured`）に昇格済
