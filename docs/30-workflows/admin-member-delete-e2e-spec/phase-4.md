# Phase 4: テスト作成（TDD Red → Green）

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |
| 前提 | Phase 1-3 GO |

## 1. Open Questions の解決

| # | 問い | 解決 | 根拠 |
|---|------|------|------|
| Q1 | member 認可はどう観測するか | admin layout が非 admin を `/login?gate=forbidden` へ redirect | `apps/web/app/(admin)/layout.tsx` |
| Q2 | reason 必須 validation の観測点 | UI は空 reason で `削除実行` disabled、API 422 は backend contract 側 | `MemberDrawer.tsx` / `DeleteBodyZ` |
| Q3 | cascade preview endpoint 実在 | 未実装。test #2 は skip + `// TODO(stage-3)` | grep `delete-preview\|deletePreview\|cascade.*preview` |
| Q4 | Server Component fetch の mock | `PLAYWRIGHT_ADMIN_MEMBER_DELETE_FIXTURE=1` を `server-fetch.ts` に追加 | 2b identity-conflicts と同じ境界 |

## 2. テストファイル

| path | 種別 | 状態 | 行数 |
|------|------|------|------|
| `apps/web/playwright/tests/admin-member-delete.spec.ts` | E2E (Playwright) | 新規 | 175 |

## 3. Red / Green 方針

Red: spec 作成直後は `server-fetch.ts` fixture gate が無いため `/admin/members` SSR fetch で失敗する。

Green: `PLAYWRIGHT_ADMIN_MEMBER_DELETE_FIXTURE=1` を dev server env に接続し、desktop-chromium focused run で 5 pass + 1 skip を取得する。

## 4. 検証コマンド

| 観点 | コマンド | 実績 |
|------|---------|------|
| 全 6 test 認識 | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-member-delete.spec.ts --project=desktop-chromium --list` | 6 tests |
| focused E2E | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-member-delete.spec.ts --project=desktop-chromium` | 5 passed / 1 skipped |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |
| lint | `mise exec -- pnpm lint` | exit 0 |
