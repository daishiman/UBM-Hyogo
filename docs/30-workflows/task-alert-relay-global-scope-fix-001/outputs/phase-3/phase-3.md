# Phase 3: 設計レビュー

## レビュー判定: completed (design GO / runtime validation pending)

| 観点                       | 判定 | コメント                                                                                       |
| -------------------------- | ---- | ---------------------------------------------------------------------------------------------- |
| 価値性 (deploy 復旧)       | ✅   | validation error 10021 を直接解消する最小修正                                                  |
| 実現性                     | ✅   | 単一ファイル + lazy init パターンの定石・実装難度低                                            |
| 整合性 (既存契約維持)      | ✅   | log payload の `isolateId` semantics (isolate ごとに stable) を維持                            |
| 運用性                     | ✅   | regression test で global scope guard を契約化するため再発防止可能                            |
| スコープ単一性             | ✅   | 1 file edit + 1 test edit で 1 サイクル完了 (CONST_007)                                       |

## 残存リスク

| ID    | リスク                                                                          | 緩和策                                                                                                   |
| ----- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| R-01  | `apps/api` 内の他ファイルにも同種の global scope violation が残っている可能性   | Phase 5 完了後に `rg -n "^(const\|let)[[:space:]]+[A-Za-z0-9_]+[[:space:]]*=[[:space:]]*(crypto\\.|await |fetch\\(|setTimeout\\(|setInterval\\()" apps/api/src` で top-level 行を全走査。`new TextEncoder()` は Workers global scope 許容のため禁止候補に含めない |
| R-02  | wrangler dry-run でも validation がローカル再現しない可能性                     | DoD で実 staging deploy job (CI) の pass を必須とする                                                    |

## Phase 4 進行可否: GO
