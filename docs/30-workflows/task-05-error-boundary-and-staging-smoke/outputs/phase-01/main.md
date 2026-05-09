# Phase 1: 要件定義

[実装区分: 実装仕様書]

## 実行タスク

- [ ] 本 Phase の本文に記載された設計・検証・ドキュメント作業を実施する
- [ ] runtime evidence が必要な項目は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-05-w4-par-error-boundary-and-staging-smoke.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md`
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物

- `outputs/phase-01/main.md`

## 統合テスト連携

`apps/web/tests/e2e/staging-smoke.spec.ts` は `staging-smoke-checklist.md` の 19 routes を正本として実装サイクルで接続する。

## 目的

task-05 の要件を確定し、以降の Phase で扱う対象範囲・前提・成功条件を固める。

## 入力

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-05-w4-par-error-boundary-and-staging-smoke.md`（一次原典）
- phase-1 §4 S-06 / phase-2 §1 task-05 / phase-3 §4.5
- CLAUDE.md 不変条件（D1 直接アクセス禁止、token 正本化、env アクセス禁則）

## 機能要件

| ID | 要件 |
| --- | --- |
| FR-01 | App Router の error / global-error / not-found / loading の 4 boundary を `apps/web/app/` 配下に新設する |
| FR-02 | `error.tsx` は `dev`（stack 表示）と `prod`（簡略 + digest）で UI を分岐する |
| FR-03 | `error.tsx` mount 時に `logger.error` 経由で Sentry capture が走り、`event="error.boundary.caught"` が記録される |
| FR-04 | `global-error.tsx` は `<html>` / `<body>` を含む独立 fallback を提供する |
| FR-05 | `not-found.tsx` は 404 UI を、`loading.tsx` は Suspense fallback を仮 markup で提供する |
| FR-06 | Playwright で 19 routes 全件の HTTP status を smoke する spec を提供する |
| FR-07 | `pnpm --filter @ubm-hyogo/web e2e:staging` script で smoke を実行できる |
| FR-08 | `staging-smoke-checklist.md` を 19 routes × 5 状態の格子で提供する |

## 非機能要件

| ID | 要件 |
| --- | --- |
| NFR-01 | `error.tsx` / `not-found.tsx` から D1 / `apps/api` を呼ばない（純粋 UI） |
| NFR-02 | 色は `var(--ubm-color-*)` token 経由のみ。HEX / `bg-[#xxx]` 禁止 |
| NFR-03 | env 参照は `getEnv()` 経由（task-02）。`process.env.*` は `playwright.config.ts` / `error.tsx` の `NODE_ENV` 分岐に限定 |
| NFR-04 | Sentry / logger 操作は task-03 / task-04 の export のみ使用。直接 SDK 呼び出し禁止 |
| NFR-05 | `STAGING_BASE_URL` 等は CI Secrets / 1Password 管理。リポジトリ平文禁止 |
| NFR-06 | Playwright `staging-smoke` project は `retries: 2` で flaky 緩和 |

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| implementationStatus | implemented_local_runtime_pending |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflowState | spec_created |

## スコープ判定

- taskType: **implementation**（コード変更を伴う）
- visualEvidence: **VISUAL_ON_EXECUTION**（staging で 19 routes を目視 / Playwright report で確認）
- 境界判定: 本ディレクトリは implementation specification。コード実装、staging deploy、runtime smoke はユーザー承認後の実装サイクルで完了させる。未実行 evidence を PASS と扱わない。

## 完了条件

- [ ] 上記 FR / NFR が AC（index.md）と整合
- [ ] `taskType` / `visualEvidence` / `implementation_status` を `artifacts.json.metadata` に記録済み
- [ ] 一次原典・phase-1〜3 への参照行が記録されている
