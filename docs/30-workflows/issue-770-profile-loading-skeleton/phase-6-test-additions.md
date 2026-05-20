# Phase 6: テスト追加

Phase 4 §3 で確定した `apps/web/app/profile/loading.spec.tsx` を Phase 5 §2 で作成する。本 Phase では追加観点を増やさず、同 spec の role / aria / sr-only / skeleton block count を正式テストとして採用する。

## 確認

| 項目 | 期待 |
|---|---|
| 新規 spec ファイル | `apps/web/app/profile/loading.spec.tsx`（`.spec.tsx` 命名） |
| TC 数 | 4 件（TC-1/2/3 統合 + TC-4 + TC-5 + TC-6） |
| matchers | `@testing-library/jest-dom/vitest` を使用 |
| 命名規約 | `.test.tsx` 禁止（不変条件 #8） |

## 追加検討して見送ったケース

| ケース | 見送り理由 |
|---|---|
| pulse animation の visual 検証 | unit test では animation 状態を信頼性高く検証できないため Phase 11 手動 |
| `prefers-reduced-motion` での animation 停止 | media query は JSDOM で再現困難。Phase 11 手動で確認 |
| visual regression (Playwright screenshot) | task-709 baseline 経路は別 PR で運用中。本タスク scope 外 |

将来 visual baseline を取り直す場合は task-709 / playwright-smoke の visual job で `/profile` 4 viewport 撮影に追加する（本タスクでは触らない）。
