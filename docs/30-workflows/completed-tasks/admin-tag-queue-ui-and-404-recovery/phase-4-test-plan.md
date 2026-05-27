# Phase 4: Test Plan

## ユニット / コンポーネントテスト

| spec | 対象 | ケース数 | 担当タスク |
|------|------|---------|-----------|
| `apps/web/src/components/admin/__tests__/TagQueuePanel.component.spec.tsx` | UI primitive 整合 | 既存 8 + 新規 3 | task-B |
| `apps/web/src/features/admin/components/_shared/__tests__/AdminSectionErrorClient.spec.tsx`（パスは実装時 grep で特定） | エラーコード分岐 | 4（401/403/404/500） | task-A |
| `apps/web/src/lib/admin/__tests__/server-fetch.spec.ts` | 404 dev-only warn | 2（404 dev / 404 prod） | task-A |

## E2E / visual

| spec | 対象 | ケース数 | 担当タスク |
|------|------|---------|-----------|
| `apps/web/playwright/tests/visual-staging-authenticated/admin-tags-authenticated.spec.ts` | staging 視認 | 2（empty / items） | task-C |

## マニュアル確認

- ローカル dev で `INTERNAL_API_BASE_URL` を意図的にゴミ値に切替えると `/admin/tags` が `ADMIN_FETCH_404` を出し、`AdminSectionErrorClient` の復旧ヒントが表示される
- 正しい値に戻すと page-head / grid-2 / sticky 右ペインが描画される

## カバレッジ目標

新規追加コードに対してテスト被覆 90%以上を維持（追加 spec で十分到達する想定。閾値を下げる変更は不要）。
