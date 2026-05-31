# Phase 3: 設計レビュー（Phase 4 進行判定）

## 3.1 レビュー観点と判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| スコープ妥当性 | PASS | 単一 component の state 追加 + test。1サイクル完了可能（CONST_007 充足） |
| 責務境界 | PASS | row 可視性所有権が row-local に閉じる。page.tsx / hook / API 不変 |
| 不変条件整合 | PASS | #1（既存API）/#2（OKLch）/#9（primitive）/#10（legacy hook 不使用）すべて維持 |
| 命名規則整合 | PASS | `optimisticMerged`（camelCase）が既存 state 命名と整合（Phase 1.3） |
| Props vs state | PASS | `optimisticMerged` は internal state と確定（Phase 2.3、VSCPKR-03） |
| rollback race | PASS | component-local state により cross-row race を構造排除（§6 懸念を設計で解消） |
| テスト可能性 | PASS | UI 操作経由で internal state を driven。Playwright で DOM 消失を検証可能 |
| node-only import リスク | N/A | 新規 import なし（W1-02b-4 該当せず） |

## 3.2 苦戦箇所への設計時対応（発見元 spec §6 反映）

| 元 spec §6 の懸念 | 設計での解消 |
| --- | --- |
| rollback 時の race condition で複数 row が誤復元 | component-local state により各 row が独立。cross-row race が**そもそも発生しない**構造に変更（操作ID ベース制御すら不要） |
| server error 時の toast と inline error の責務分界が曖昧 | 既存 `mergeError` の inline 表示（`role="alert"`）を rollback 後にそのまま surface。toast は既存 hook の `handleFailure` が補助で出す。責務は既存パターン踏襲で確定 |

## 3.3 リスク評価

| リスク | 影響度 | 確率 | 対策 |
| --- | --- | --- | --- |
| success 後 `router.refresh()` 完了前に親が再 mount し optimisticMerged が初期化される | 低 | 低 | refresh は同一 row を再取得しない（server で merge 済）。再 mount しても row は list に存在しないため問題化しない |
| optimistic hide 中に再度 merge 操作される | 低 | 低 | `return null` で UI 自体が消えるため再操作経路がない |
| 既存 vitest の success ケース（row が `merge` ボタンに戻る前提）が壊れる | 中 | 中 | 既存テストは success で stage idle 復帰を検証。optimisticMerged true により row が null になるため、既存テストの assertion を Phase 6 で更新（success → row 消失 へ期待値変更） |

## 3.4 判定

**GATE: PASS → Phase 4 へ進行可**

- 設計は単一 component に閉じ、不変条件・命名・責務すべて整合。
- 唯一の注意点（§3.3 の既存 success テスト assertion 更新）は Phase 4/6 で対応する旨を明記済み。
