# Phase 9: QA

## 自動 QA チェックリスト

| # | コマンド | 期待 |
|---|---|---|
| 1 | `mise exec -- pnpm typecheck` | 0 errors |
| 2 | `mise exec -- pnpm lint` | 0 errors / 0 warnings |
| 3 | `mise exec -- pnpm --filter @ubm-hyogo/web test` | 全 spec pass |
| 4 | `mise exec -- pnpm --filter @ubm-hyogo/web build` | success かつ deprecation warning なし |
| 5 | `test ! -e apps/web/middleware.ts && rg -n "middleware\\.ts" apps/web --glob '!middleware.ts' --glob '!*.log'` | 実装側に stale `middleware.ts` 参照が残らない。仕様書本文の説明用 hit は対象外 |
| 6 | `mise exec -- pnpm verify-phase12-compliance` | target workflow が pass |
| 7 | `bash scripts/verify-pr-ready.sh` | pass |

## 手動 QA（Phase 11 で evidence 化）

ローカル dev server で 4 シナリオを実行:

1. logged-out + `/profile` → 307 `/login?redirect=%2Fprofile`
2. logged-out + `/admin` → 307 `/login?gate=admin_required`
3. 非 admin login + `/admin` → 403 Forbidden
4. admin login + `/admin` → 画面描画成功

## 回帰チェック

- `/(public)/*` routes が引き続き未認証で表示可能
- `/api/*` routes が proxy の matcher に含まれず影響を受けない
- Auth.js callback (`/api/auth/callback/*`) が proxy の matcher に含まれない

## メタ情報

| 項目 | 値 |
|---|---|
| workflow | issue-277-next-proxy-migration |
| phase | 9 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

実装後の品質ゲートを一括実行し、deprecated warning と auth gate regression がないことを確認する。

## 実行タスク

- typecheck / lint / web test / build を実行する。
- stale `middleware.ts` 実装参照を grep で確認する。
- Phase 12 compliance を確認する。

## 参照資料

- Phase 5 implementation。
- Phase 6 tests。
- scripts/verify-phase12-compliance.ts。

## 成果物

- QA command outputs。
- Phase 11 evidence files。

## 完了条件

- 全 QA コマンドが exit 0。
- build warning に middleware deprecation が出ない。

## 統合テスト連携

Phase 11 manual smoke と Phase 13 PR test plan に結果を反映する。
