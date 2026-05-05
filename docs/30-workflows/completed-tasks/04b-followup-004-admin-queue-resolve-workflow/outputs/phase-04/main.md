# Phase 4 — テスト戦略サマリ

詳細は `test-strategy.md` を参照。

## レイヤ別カバレッジ

| レイヤ | フレームワーク | テストファイル | テスト数 |
|--------|----------------|----------------|----------|
| Repository | Vitest + miniflare D1 | `apps/api/src/repository/__tests__/adminNotes.test.ts` | +2 (listPendingRequests) |
| API route | Vitest + miniflare D1 + JWT seed | `apps/api/src/routes/admin/requests.test.ts` | 10 |
| Web component | Vitest + @testing-library/react | `apps/web/src/components/admin/__tests__/RequestQueuePanel.test.tsx` | 5 |
| 手動 smoke | Phase 11 | n/a | 4 シナリオ |

## 重点ケース
- AC-5 二重 resolve → 409（API + Web）
- AC-6 atomicity（member_status 不変＋note のみ更新は不可）
- AC-7 PII raw 値が DOM に出ない
- visibility approve `desiredState` 不正 → 422
- delete approve → `member_status.is_deleted=1` + `deleted_members` 行存在
- cursor pagination の安定性（FIFO）

## 想定 NG
- D1 batch がエラーで途中失敗 → fault injection は miniflare で再現困難なため、サブクエリガードで論理的に保証する設計レビューで担保
