---
phase: 4
title: テスト計画
workflow_id: issue-880-public-segment-error-loading-boundary
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 4 — テスト計画

[実装区分: 実装仕様書]

## 1. テスト層構成

| 層 | 対象 | ファイル |
|----|------|---------|
| Playwright smoke | `(public)/error.tsx` の force-throw 発火と DOM contract | `apps/web/playwright/tests/public-error-boundary.spec.ts` |
| Playwright visual（任意） | `(public)/loading.tsx` の skeleton 描画 | 既存 visual project に追加するか個別 spec 化（Phase 6 で判断） |
| Unit | なし（Client Component / 静的 Server Component のため不要） | — |
| Static gate | `verify-design-tokens` grep（既存 CI）で OKLch 純度確認 | 既存 CI workflow |

## 2. Playwright テストケース

### TC-01: `(public)/error.tsx` の force-throw 発火

**前提**: dev server 起動済、`error-boundary-smoke` route 配置済

**手順**:
1. `await page.goto('/error-boundary-smoke')` を実行
2. `(public)` AppShell が `data-route-group="public"` で描画されていること
3. `[data-page="error"]` が描画されていること
4. `role="alert"` 要素が visible であること
5. h1 テキスト「ページを表示できませんでした」が描画されていること
6. 「再試行する」ボタンが button として存在すること
7. 「会員一覧へ戻る」リンクが `href="/members"` で存在すること
8. 「トップへ戻る」リンクが `href="/"` で存在すること
9. screenshot 取得（`outputs/phase-11/screenshots/public-error-boundary.png`）

### TC-02: focus 移動の確認

**手順**:
1. TC-01 と同じ navigate
2. `document.activeElement` が h1 タグであること（`useAutoFocusOnMount` 動作確認）

### TC-03（任意）: `(public)/loading.tsx` skeleton

**手順**:
1. `(public)/members` への navigation を route intercept で遅延
2. loading 中に `[data-page="loading"]` が描画されること
3. `role="status"` / `aria-busy="true"` が attached されること
4. screenshot 取得

## 3. 既存テストへの影響

| 既存テスト | 影響 |
|-----------|------|
| `serial-06-member-detail.spec.ts` | 影響なし（fetch 経路は変更しない） |
| `verify-design-tokens` grep | 新規 2 ファイルが grep 対象に追加されるが OKLch token のみ使用するため pass |
| `verify-test-suffix` | `*.spec.ts` 使用のため pass |
| 既存 Playwright visual snapshot | 影響なし（`(public)/error.tsx` は通常導線では発火しない） |

## 4. ローカル実行コマンド

```bash
# 単体実行
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test public-error-boundary.spec.ts

# typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# verify-design-tokens（grep gate）
mise exec -- pnpm --filter @ubm-hyogo/web verify:design-tokens
```

## 5. Coverage 期待値

| メトリクス | 期待値 |
|-----------|--------|
| `(public)/error.tsx` 機能カバレッジ | error path + reset path の主要分岐 |
| `(public)/loading.tsx` 機能カバレッジ | 描画確認のみ（純粋静的 markup） |
| Branch coverage | error.tsx の `isDev` / `error.digest` の有無は dev tooling 用なので低 coverage OK |

## 6. 失敗時の切り分け

| 症状 | 切り分け |
|------|---------|
| `(public)/error.tsx` が発火せず親 `error.tsx` が表示される | Next.js App Router segment 解決順を確認。`(public)` route group 内の throw か？ |
| logger.error が呼ばれない | `useEffect` 依存配列を確認、test 環境で `logger.error` が stub されていないか |
| screenshot が AppShell 外で撮れる | `(public)/layout.tsx` の navigation 階層を確認 |
