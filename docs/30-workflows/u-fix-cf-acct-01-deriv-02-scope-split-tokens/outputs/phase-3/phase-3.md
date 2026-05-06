# Phase 3: 設計レビューゲート

## メタ情報
| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |

## レビュー観点（5 点）

| ID | 観点 | チェック内容 | 結果欄 |
| --- | --- | --- | --- |
| R-1 | 最小 scope 妥当性 | 各 Token の scope が deploy step で確認された API call 集合の必要十分か | ☐ |
| R-2 | job 順序 | D1 migration -> Workers deploy, Pages deploy remains in web-cd が `needs:` で保証されているか | ☐ |
| R-3 | rollback 独立性 | 1 Token の rollback が他 Token の状態に波及しないか | ☐ |
| R-4 | failure mode 切り分け | job 失敗時に「どの Token / scope が原因か」が log だけで識別できるか | ☐ |
| R-5 | オペレーションコスト | rotation 自動化（DERIV-03）未着手段階で 6 Token を運用人員 1 名で維持できるか。runbook で吸収できるか | ☐ |

## 設計トレードオフ確認

| 項目 | 採用案 | 代替案 | 採用理由 |
| --- | --- | --- | --- |
| `Account Settings:Read` 付与 | 全 Token に付与 | verification 専用 Token 切出し | 全付与で attack surface 増だが workflow 設計コストとのトレードオフで MVP 採用 |
| Pages Token | 即時発行 | 利用開始時発行 | 命名規約・workflow 構造の統一感を優先し即時発行 |

## 成果物

- `outputs/phase-3/review-checklist.md`（R-1〜R-5 の判定結果）
- `outputs/phase-3/design-tradeoff-decisions.md`
