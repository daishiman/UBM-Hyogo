# Phase 11 — manual-test-result（NON_VISUAL）

## 宣言

- **タスク種別**: NON_VISUAL
- **非視覚的理由**: server-side `redirect()` 副作用 + 純関数挙動のみ。UI レイアウト変更なし
- **代替証跡**: Vitest 自動テスト（16 + 6 = 22 件）
- **スクリーンショット**: 作成しない（理由: UI 描画変更なし）

## 証跡の主ソース

| ソース                                            | 件数         | カテゴリ                  |
| ------------------------------------------------- | ------------ | ------------------------- |
| `apps/web/src/lib/url/__tests__/safe-next.spec.ts`| 16（it.each） | source-level PASS         |
| `apps/web/app/login/__tests__/page.spec.tsx`      | 6（TC-1〜4 + F6-06/F6-07） | source-level PASS         |

## 実行情報

- 実行コマンド: `mise exec -- pnpm exec vitest run apps/web/src/lib/url/__tests__/safe-next.spec.ts apps/web/app/login/__tests__/page.spec.tsx`
- 結果: PASS（2 files, 22 tests）
- typecheck: PASS（`mise exec -- pnpm --filter @ubm-hyogo/web typecheck`）
- lint: PASS（`mise exec -- pnpm lint`）

## 仕様判断根拠

- **NON_VISUAL 判断**: 元タスク仕様（`task-d-login-redirect-when-authenticated.md`）が server-side redirect + 純関数のみで構成され、視覚的 UI 出力を持たないため。
- **screenshot 不要根拠**: redirect 完了後の画面は既存 `/profile` ページであり、本タスクが描画変更を行わない。

## 既知制限

- Phase 11 では実地ブラウザ操作（localhost dev server 起動 + browser open）は user-gated とし、自動 vitest 結果を一次証跡として採用する。
- 環境ブロッカー（esbuild mismatch 等）が発生した場合は別カテゴリで記録する（製品コード問題と分離）。
