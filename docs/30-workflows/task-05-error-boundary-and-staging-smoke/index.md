# task-05-error-boundary-and-staging-smoke

[実装区分: 実装仕様書]

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | W4（02-runtime 出口） |
| mode | parallel（画面 task 11-17 とは並列可、上流 task-02/03/04 完了後に着手） |
| owner | - |
| 状態 | implemented-local / implementation / runtime evidence pending_user_approval / VISUAL_ON_EXECUTION |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| dependency order | task-02 (env) / task-03 (sentry) / task-04 (logger) → task-05 → task-18 (regression smoke) |
| artifact ledger | root `artifacts.json` + `outputs/artifacts.json` parity |

## purpose

Next.js App Router の error / global-error / not-found / loading 各 boundary を `apps/web/app/` 配下に新設し、Cloudflare Workers staging 環境上で 19 routes 全件の HTTP smoke を行う Playwright spec を提供する。これにより 02-runtime wave のランタイム整合 (phase-1 §4 成功条件 S-06) を確定する。

## why this is not a restored old task

`apps/web/app/` には現状 error boundary が未配置であり、production throw 時の Sentry capture / digest 表示 / reset 動作が定義されていない。本タスクは新規実装であり、過去 archive の再開ではない。

## scope in / out

### Scope In
- `apps/web/app/error.tsx`（route segment error boundary）新設
- `apps/web/app/global-error.tsx`（最上位 fallback）新設
- `apps/web/app/not-found.tsx`（404）新設（仮 markup）
- `apps/web/app/loading.tsx`（Suspense fallback）新設（仮 markup）
- `apps/web/tests/e2e/staging-smoke.spec.ts` 新設（`staging-smoke-checklist.md` 正本の 19 routes smoke）
- `apps/web/playwright.config.ts` の `staging-smoke` project 追加
- `apps/web/package.json` の `e2e:staging` script 追加
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md` 新設
- `error.tsx` mount 時の `logger.error`（task-04 export）経由の Sentry capture（task-03 export）

### Scope Out
- 全 routes の axe a11y 検証（task-18 で実施）
- `verify-design-tokens` token 適用検証（task-18）
- error UI のデザイン最終形（primitives 完成後の task-15 周辺）
- production smoke（staging で完結）
- `apps/api` への新 endpoint 追加（不変条件により禁止）
- D1 schema / Google Form 仕様変更

## dependencies

### Depends On
- task-02 W2-PAR wrangler-env-injection（`@/lib/env` の `getEnv()` export）
- task-03 W2-PAR sentry-workers-sdk-unify（`@/lib/sentry/capture` の `captureException` export）
- task-04 W3-PAR window-guard-and-logger（`@/lib/logger` の `logger` export）

### Blocks
- task-18 W6-SER regression-smoke（19 routes 包括 regression smoke の前段）
- task-15 周辺（UI primitive 適用時の error boundary 互換）

## refs

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-05-w4-par-error-boundary-and-staging-smoke.md`（一次原典）
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-1/phase-1.md` §4 成功条件 S-06 / §1.1
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-2/phase-2.md` §1 task-05 / §3 DAG
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md` §4.5 / §1.2 / §2.4
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` §6 diff scope 規律
- `docs/00-getting-started-manual/specs/09-ui-ux.md`（error / 404 文言基準・存在時）
- Next.js App Router 公式 `error.tsx` / `global-error.tsx` / `not-found.tsx` / `loading.tsx` 規約

## AC

1. `apps/web/app/{error,global-error,not-found,loading}.tsx` が存在しビルドが通る
2. `error.tsx` は `process.env.NODE_ENV !== "production"` 分岐で stack を表示し、prod では digest と再試行ボタンのみ表示する
3. `error.tsx` mount 時に `logger.error({event:"error.boundary.caught", ...})` 経由で Sentry に capture される
4. `global-error.tsx` は `<html><body>` を含む独立 fallback として実装されている
5. `not-found.tsx` / `loading.tsx` は仮 markup でも render され、a11y 属性 (`role`, `aria-busy` 等) を持つ
6. `apps/web/tests/e2e/staging-smoke.spec.ts` が `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md` 正本の 19 routes（公開 6 + 会員 2 + 管理 8 + 404 + error boundary fixture + 一覧 fixture）を含む
7. `pnpm --filter @ubm-hyogo/web e2e:staging` が CLI として動作する
8. staging へ deploy 済み環境で smoke を 1 回実行し、19 routes が許容ステータス内（200/301/302/307/401/403/404）に収まる
9. Sentry dashboard に browser boundary event と server test event が別経路で届くことを目視確認
10. `staging-smoke-checklist.md` が `specs/` 配下に存在し、5 状態 × 19 routes の格子になっている

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/artifacts.json（root `artifacts.json` mirror。`cmp -s artifacts.json outputs/artifacts.json` で一致確認）
- outputs/phase-01..13/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-13/main.md

## invariants touched

- #5 `apps/web` から D1 直接アクセス禁止（error.tsx / not-found.tsx は backend 非依存）
- #7 MVP では Google Form 再回答を本人更新の正式な経路（error.tsx 文言で responderUrl 案内する場合は env 経由）
- 02-runtime 不変条件: 既存 API endpoint surface のみ利用（新規 endpoint 追加禁止）
- OKLch token 正本化（HEX 直書き禁止・`var(--ubm-color-*)` 経由）

## completion definition

全 13 phase 仕様書、root/output `artifacts.json` parity、Phase 12 strict 7 成果物、aiworkflow 導線が揃い、`apps/web` 側の変更対象ファイル・関数シグネチャ・テスト・staging smoke コマンド・DoD が明記されている。コード実装、staging deploy、runtime smoke、commit、push、PR 作成は本仕様書で実行済みにせず、ユーザー承認後の実装サイクルで完遂する。
