# Phase 6 — Test Implementation Result

本タスクで追加するテストは Playwright visual baseline 2 件のみ。unit / integration の追加はなし。

## 1. 追加テスト一覧

| Path | 種別 | 状態 |
|------|------|------|
| `apps/web/playwright/tests/visual-staging/members-list.spec.ts` | Playwright visual | 実装済み |
| `apps/web/playwright/tests/visual-staging/member-detail.spec.ts` | Playwright visual（env-gated） | 実装済み。`PLAYWRIGHT_MEMBER_DETAIL_ID` 未指定時は skip |

## 2. 既存テストへの影響

| ファイル | 影響 |
|---------|------|
| `apps/web/playwright/tests/visual-staging/{public-top,login,profile,admin-dashboard}.spec.ts` | 影響なし（独立 spec） |
| `apps/web/playwright/tests/visual/*.spec.ts`（local visual-chromium） | 影響なし（testMatch 分離） |
| その他 unit / integration | 影響なし（spec 追加のみ） |

## 3. 期待挙動

| ケース | 期待 |
|-------|------|
| `playwright test --list` で `staging-visual` project | members-list / member-detail を含む 6 tests を列挙 |
| `PLAYWRIGHT_MEMBER_DETAIL_ID` 未指定で実行 | member-detail が `Test skipped` で正常終了 |
| `PLAYWRIGHT_MEMBER_DETAIL_ID` 指定 + 初回 | baseline 不在で fail → `--update-snapshots` で生成 |
| 2 回目以降 | diff < 5% で pass |
