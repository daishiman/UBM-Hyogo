# Phase 5 実装ログ — task-13-login-rebuild

## 実装区分の判断

仕様書冒頭は `[実装仕様書]` だったが、本 review cycle で実コード差分が入ったため `implemented-local / runtime evidence pending` へ再分類した。
本サイクルでは目的（`/login` を 6 状態 + gate=admin_required overlay に再構築する）達成にコード変更が必須のため、コード実装を実施した（CONST_006）。

## 変更ファイル

| 種別 | パス |
| --- | --- |
| M | `apps/web/src/lib/url/login-query.ts` — `LOGIN_GATE_STATES` に `"error"` 追加、`error` query を 200 文字に切り詰め |
| A | `apps/web/app/login/_components/LoginCard.tsx` — Server Component。`data-testid="login-card"` / `data-component="login-card"` / `data-state` を root に付与。ロゴ inline SVG / h1 / subtitle / children / footerSlot を描画 |
| A | `apps/web/app/login/_components/LoginStatus.tsx` — sent/unregistered/deleted/rules_declined/error の switch。ui-primitive `Banner` を使用 |
| M | `apps/web/app/login/_components/LoginPanel.client.tsx` — input は form + GoogleOAuth + register link を直配。それ以外は `<LoginStatus>` に委譲。gate=admin_required で warn Banner を上乗せ |
| M | `apps/web/app/login/page.tsx` — searchParams を parse し `<LoginCard>` で wrap。`TITLES` map で 6 状態の title/subtitle を切替 |

## 不変条件確認

- `apps/web/app/api/auth/*` 配下の差分: 0（API surface 不変）
- `grep -E '#[0-9a-fA-F]{3,6}' apps/web/app/login` の検出: 0 件（HEX 直書きなし）
- `LoginPanel` / `LoginStatus` で exhaustive switch（`never` 型 fallback）

## 実行コマンド

- `mise exec -- pnpm install` ✅
- `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` ✅
- `mise exec -- pnpm --filter @ubm-hyogo/web lint` ✅

## 残課題

- runtime screenshot（dev サーバ実機）は `apps/web/playwright/tests/login-smoke.spec.ts` で `outputs/phase-11/login-*.png` に保存する。
