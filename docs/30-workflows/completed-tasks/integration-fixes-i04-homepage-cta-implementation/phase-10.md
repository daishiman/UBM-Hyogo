# Phase 10: 最終レビュー

## 受入条件 vs 実装結果

| AC | 内容 | 確認方法 | 結果欄 |
|----|------|---------|--------|
| AC-1 | dark variant で render | Phase 4 test + Phase 11 screenshot | （実装後記入） |
| AC-2 | members 件数によらず常時表示 | Phase 6 test + page.tsx 静的読みで条件分岐外配置を確認 | （実装後記入） |
| AC-3 | `target="_blank"` + `rel="noopener noreferrer"` | Phase 4 test | （実装後記入） |
| AC-4 | responderUrl が CLAUDE.md 固定値と一致・hardcode 禁止 | Phase 4 test + Phase 9 grep | （実装後記入） |
| AC-5 | `data-component="call-to-action-cta"` | Phase 4 test | （実装後記入） |
| AC-6 | コンポーネントテスト PASS | Phase 4-7 | （実装後記入） |
| AC-7 | `pnpm typecheck` / `pnpm lint` PASS | Phase 9 | （実装後記入） |
| AC-8 | HEX 直書きなし | Phase 9 grep | （実装後記入） |
| AC-9 | dev server で目視確認 | Phase 11 | （実装後記入） |
| AC-10 | parent spec DoD と整合 | parent spec を再読 | （実装後記入） |

## blocker 判定

- BLOCKER: AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7
- MINOR: AC-8（HEX 直書き）→ MINOR 判定された場合は `unassigned-task-detection.md` へ転記
- INFO: AC-10（parent spec の他 AC との整合性チェック）

## MINOR 指摘 → 未タスク化（Phase 12 Task 4 で集約）

該当があれば本欄に列挙する。0 件でも Phase 12 で「0 件」と明示する（FB ガイドライン）。

## 成果物

`outputs/phase-10/final-review.md`
