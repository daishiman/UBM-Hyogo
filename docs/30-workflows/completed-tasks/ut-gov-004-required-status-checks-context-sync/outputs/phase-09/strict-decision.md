# strict-decision.md — Phase 9 最終正本

## 最終決定

| ブランチ | strict | 確定理由 |
| --- | --- | --- |
| dev | `false` | staging 環境、実験的 merge 許容、merge 摩擦最小化を優先 |
| main | `true` | production デプロイトリガ、up-to-date 必須、壊れリスク最小化 |

## 判定軸（最終）

| 観点 | dev | main | コメント |
| --- | --- | --- | --- |
| merge 摩擦 | 低 | 高（許容） | solo 運用で rebase コスト軽 |
| 壊れリスク | 中 | 低 | main の影響度が最大 |
| 復旧容易性 | 容易 | 容易 | `gh api PATCH` 即時 |
| 一貫性 | dev/main 異 | dev/main 異 | 段階運用が合理的 |

## ロールバック条件

main で `strict:true` が原因で 24 時間以上 merge が停滞した場合、一時的に `strict:false` に切替→根本原因（status check 遅延等）修正後に再度 `strict:true`。

## UT-GOV-001 への引き渡し

UT-GOV-001 は `confirmed-contexts.yml.required_status_checks.strict.dev = false` と `strict.main = true` を読み取り、各ブランチに別々に apply する。
