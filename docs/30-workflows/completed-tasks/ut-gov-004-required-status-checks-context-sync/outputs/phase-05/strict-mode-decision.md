# strict-mode-decision.md — Phase 5 確定

## 決定

| ブランチ | strict | 根拠 |
| --- | --- | --- |
| dev | `false` | 実験的 merge を許容、staging 環境のため壊れリスク低、merge 摩擦削減を優先 |
| main | `true` | production デプロイトリガ、up-to-date 必須で壊れリスク最小化 |

## 判定軸

| 観点 | dev | main |
| --- | --- | --- |
| merge 摩擦 | 低 | 高（許容） |
| 壊れリスク | 中 | 低（許容） |
| solo 運用での rebase 負荷 | 軽 | 軽 |
| ロールバック容易性 | `gh api -X PATCH` 即時 | 同上 |

## ロールバック発動条件

- main で `strict:true` が原因で merge が 24 時間以上停滞 → 一時的に `strict:false` に戻し、根本原因（status check の遅延等）を修正したのち再度 `strict:true`

## Phase 9 へ

本ファイルは暫定確定。Phase 9 `strict-decision.md` で QA 観点から再評価し、最終正本化する。
