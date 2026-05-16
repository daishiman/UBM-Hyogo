# Phase 9 — ロールアウト戦略

## 環境別影響

| 環境 | 影響 | 対応 |
| --- | --- | --- |
| ローカル | なし（JSDoc のみ） | typecheck / lint / test PASS のみ確認 |
| Cloudflare staging (`dev`) | なし | PR merge 後 staging deploy で挙動変化が出ないこと（既存 smoke で十分） |
| Cloudflare production (`main`) | なし | 通常の `dev → main` リリースサイクルで反映 |

## デプロイ手順

通常の PR フロー以外の特殊操作なし。

- base: `dev`
- merge 後の staging deploy: 既存 CI の自動 deploy（本タスクで wrangler config 変更なし）
- production rollout: 別タスクの `dev → main` リリースに含める（本タスク単独で main へ直接 push しない）

## rollback 計画

- JSDoc のみの変更のため、`git revert <commit>` で復元可能
- ランタイム挙動変化を伴わないため、rollback による副作用なし

## feature flag

不要（コメント変更のみ）。
