# Phase 10 — 運用・監視

## 監視対象

本タスクはランタイム挙動を変えないため、新規メトリクス・アラートの追加なし。既存の以下を引き続き確認。

| 対象 | 観点 |
| --- | --- |
| `tagQueueResolve` workflow の audit log (`admin.tag.queue_resolved`) | 件数・エラー率に変化がないこと |
| Cloudflare Workers logs (`apps/api`) | error rate に変化がないこと |

## 後続実装者向けガイダンス

`apps/api/src/repository/memberTags.ts` を編集する際:

1. ファイル冒頭コメントに従い、**新規書き込み API を追加しない**
2. `assignTagsToMember` を `tagQueueResolve` workflow 以外から呼ばない
3. 新規書き込み経路が必要な場合は `tagQueueResolve` workflow 側への集約を検討し、不変条件 #13 の変更を要する場合は CLAUDE.md / `docs/30-workflows/02-application-implementation/07a-parallel-tag-assignment-queue-resolve-workflow/` の owner レビューを経る

## 監視 dashboard

新規 dashboard 追加なし。
