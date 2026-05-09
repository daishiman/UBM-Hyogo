# Phase 6: 異常系検証

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 6 |
| task | task-05-error-boundary-and-staging-smoke |
| state | implemented-local / implementation / runtime evidence pending_user_approval |

## 目的

この Phase で task-05 の実装仕様、検証条件、または close-out 条件を固定する。

## 実行タスク

- [ ] 本 Phase の本文に記載された設計・検証・ドキュメント作業を実施する
- [ ] runtime evidence が必要な項目は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-05-w4-par-error-boundary-and-staging-smoke.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md`
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物

- `outputs/phase-06/main.md`

## 統合テスト連携

`apps/web/tests/e2e/staging-smoke.spec.ts` は `staging-smoke-checklist.md` の 19 routes を正本として実装サイクルで接続する。

## 異常系シナリオ

| ID | シナリオ | 期待挙動 | 検証方法 |
| --- | --- | --- | --- |
| AB-01 | render 中の throw | route segment error boundary が活性化、`role=alert` UI が表示 | Playwright fixture `/(public)/members/__broken__` |
| AB-02 | layout 自体の throw | `global-error.tsx` が `<html><body>` で fallback | `next build && next start` で意図的 throw |
| AB-03 | 存在しない route | `not-found.tsx` が 404 で render | `/__nonexistent__` を Playwright で goto |
| AB-04 | API 遅延中の遷移 | `loading.tsx` が `aria-busy=true` で表示 | Slow API シミュレーション（DevTools network throttle）で目視 |
| AB-05 | digest 欠損 | `エラーID:` 行が render されない | TC-U-04 |
| AB-06 | logger 内部失敗 | task-04 logger no-throw contract により error boundary は依然 render される | logger.error が no-throw であることを task-04 contract test で確認。boundary 側で throw spy を注入しない |
| AB-07 | `STAGING_BASE_URL` に production URL 混入 | spec が `beforeAll` で fail | spec 冒頭 guard |
| AB-08 | `STAGING_AUTH_BEARER` 未設定 | 認可ヘッダ無しで request、unauth gate を観測 | smoke の auth-protected describe |

## エラー injection fixture

`apps/web/app/__smoke__/error-boundary/page.tsx`（Cloudflare Workers staging-only fixture）か、もしくは `/(public)/members/[id]` の特定 ID で API mock の 500 を返す方式のいずれか。**実装は `ENABLE_STAGING_SMOKE_FIXTURE=1` の明示 guard で gate**し、production deploy には混入させない。

実装方針（推奨）:
- `apps/web/app/__smoke__/error-boundary/page.tsx` を新設し、`ENABLE_STAGING_SMOKE_FIXTURE=1` の場合だけ `throw new Error("staging-smoke fixture")` を発火
- production deploy では `ENABLE_STAGING_SMOKE_FIXTURE=1` を禁止し、grep/deploy preflight で fail closed する

## Sentry 連携検証

| 観点 | 期待 |
| --- | --- |
| browser `error.boundary.caught` event が送信される | `error.tsx` / `global-error.tsx` の client boundary を Sentry dashboard で確認 |
| server test event が送信される | task-03/04 の server-side logger/capture contract を staging smoke helper route or command で確認 |
| `digest` が tag / extra として記録される | dashboard で `digest` 検索可能 |
| logger が握り潰しても error boundary 自体は再 throw しない | unit test で確認 |

## 完了条件

- [ ] AB-01〜08 のうち AB-01/02/03/05/07 は自動テスト、残りは手動チェックリストに登録
- [ ] error injection fixture が staging-only である（production 混入しない）ことが build で検証可能
