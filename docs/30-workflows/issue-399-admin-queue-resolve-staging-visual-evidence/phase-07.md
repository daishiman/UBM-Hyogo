# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-399-admin-queue-resolve-staging-visual-evidence |
| phase | 07 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implementation-prepared |

## Issue #399 AC ↔ 実装 / Phase マッピング

| AC（Issue #399） | 対応 Phase / 成果物 | gate | 状態 |
| --- | --- | --- | --- |
| staging 実画像が phase-11 evidence dir または follow-up workflow output に保存 | Phase 11 `outputs/phase-11/screenshots/` | VISUAL_ON_EXECUTION | COVERED_BY_PLANNED_RUN |
| admin 認証情報・PII が記録に残らない | Phase 06 `.gitignore` 追加 + Phase 11 `redaction-check.md` | redaction-check PASS | COVERED_BY_PLANNED_GATE |
| evidence link が implementation-guide.md に反映済み | Phase 05 Step 6 + Phase 12 documentation update | diff applied | COVERED_BY_PLANNED_DIFF |

## scope ↔ Phase マッピング

| Scope | Phase |
| --- | --- |
| pending visibility list / pending delete list | Phase 02 seed 設計 + Phase 11 #01, #02 |
| detail panel | Phase 11 #03 |
| approve / reject modal | Phase 11 #04, #05 |
| empty state | Phase 11 #06（cleanup 後） |
| 409 toast | Phase 11 #07（並行操作） |
| reversibility / staging URL / admin account / D1 seed | Phase 02 seed 設計 + Phase 06 異常系 + runbook |
| evidence link を implementation-guide.md に追記 | Phase 05 Step 6 / Phase 12 |

## 完了条件

- [ ] - すべての AC が 1 つ以上の Phase 成果物にマップされ、gate 種別が記録されていること（VISUAL_ON_EXECUTION 分は実行を待つ `COVERED_BY_PLANNED_*` 表記）

## 目的

Phase 07 の判断と成果物境界を明確にする。

## 実行タスク

- Phase 07 の入力、実装状態、runtime pending 境界を確認する。

## 参照資料

- [index.md](index.md)
- [artifacts.json](artifacts.json)
- [runbook.md](runbook.md)

## 成果物

- `outputs/phase-07/main.md`

## 統合テスト連携

- Focused Vitest は Phase 09 の品質 gate に集約する。
