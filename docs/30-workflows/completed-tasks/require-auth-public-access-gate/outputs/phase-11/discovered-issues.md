# Phase 11 発見事項（discovered issues）

| 項目 | 値 |
|------|-----|
| taskId | require-auth-public-access-gate |
| 実施状態 | local evidence captured / runtime screenshot pending（user-gated） |

## 発見事項

- ローカル決定的 evidence 上の発見事項は 0 件。
- 実装サイクルの手動テストで HIGH 問題が見つかった場合は `unassigned-task/` へ formalize する（Phase 12 Task 4 と連動）。

## スコープ外で気づいた周辺改善余地（baseline 候補）

- M-1: `apps/api` の会員セッション user 生成重複は本レビューで `authSessionUserFromClaims` に集約済み。
- M-2: `INTERNAL_AUTH_SECRET` の本番 Cloudflare Secrets 設定整備（運用タスク）。
