# Phase 7: AC マトリクス

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 7 |
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

- `outputs/phase-07/main.md`

## 統合テスト連携

`apps/web/tests/e2e/staging-smoke.spec.ts` は `staging-smoke-checklist.md` の 19 routes を正本として実装サイクルで接続する。

| AC ID | 要件 | 検証方法 | 検証 phase | evidence path |
| --- | --- | --- | --- | --- |
| AC-01 | 4 boundary file が存在しビルド pass | `pnpm --filter @ubm-hyogo/web build` | Phase 9 / 11 | `outputs/phase-11/evidence/build.log` |
| AC-02 | error.tsx の dev/prod 分岐 | TC-U-01 / TC-U-02 | Phase 9 | `outputs/phase-11/evidence/test.log` |
| AC-03 | error.tsx mount 時 logger.error 呼び出し | TC-U-06 | Phase 9 | 同上 |
| AC-04 | global-error.tsx に `<html><body>` 含む | snapshot 検証 + 目視 | Phase 9 / 11 | snapshot file |
| AC-05 | not-found.tsx / loading.tsx render + a11y 属性 | render 検証 + Playwright `getByRole` | Phase 9 / 11 | snapshot / spec |
| AC-06 | staging-smoke.spec.ts に checklist 正本 19 routes 分の test | spec lint / test count assertion | Phase 9 | spec ファイル目視 + `staging-smoke-checklist.md` |
| AC-07 | `pnpm --filter @ubm-hyogo/web e2e:staging` 動作 | 実行ログ | Phase 11 | `outputs/phase-11/evidence/e2e-staging.log` |
| AC-08 | smoke 19 routes が許容ステータス内 | Playwright report | Phase 11 | `outputs/phase-11/evidence/playwright-report/` |
| AC-09 | Sentry dashboard に browser boundary event と server test event が別経路で到達 | dashboard 目視 | Phase 11 | `outputs/phase-11/evidence/sentry-screenshot.png` |
| AC-10 | `staging-smoke-checklist.md` が specs/ 配下に存在 | `ls` 確認 | Phase 12 | path 直接 |

## トレーサビリティ

| 要件 ID | 設計 | テスト | 実装ファイル |
| --- | --- | --- | --- |
| FR-01 | Phase 2 §変更対象ファイル | TC-U-01〜07 / smoke | `apps/web/app/{error,global-error,not-found,loading}.tsx` |
| FR-02 | Phase 5 §1-1 | TC-U-01 / TC-U-02 | `error.tsx` |
| FR-03 | Phase 5 §1-1 / §1-2 | TC-U-06 / Sentry目視 | `error.tsx` / `global-error.tsx` |
| FR-04 | Phase 5 §1-2 | snapshot | `global-error.tsx` |
| FR-05 | Phase 5 §1-3 / §1-4 | snapshot / Playwright | `not-found.tsx` / `loading.tsx` |
| FR-06 | Phase 2 §19 routes | smoke spec | `staging-smoke.spec.ts` |
| FR-07 | Phase 5 §Step 5 | 実行ログ | `package.json` |
| FR-08 | Phase 5 §Step 6 | path 確認 | `staging-smoke-checklist.md` |

## 完了条件

- [ ] 全 AC が `検証方法` / `検証 phase` / `evidence path` を持つ
- [ ] 全 FR が design / test / 実装ファイルにトレース可能
