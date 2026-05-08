# task-03-w2-par-sentry-workers-sdk-unify — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | task-03-w2-par-sentry-workers-sdk-unify |
| 親ワークフロー | docs/30-workflows/ui-prototype-alignment-mvp-recovery |
| ディレクトリ | docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify |
| 元タスク仕様 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-03-w2-par-sentry-workers-sdk-unify.md |
| Wave | W2（02-runtime / task-02 と並列） |
| 実行種別 | parallelizable（task-02 と並列実行可能。`wrangler.toml` 編集は task-02 集約） |
| 作成日 | 2026-05-07 |
| 状態 | implemented-local |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| evidence_type | curl_and_build_grep_with_sentry_dashboard_aux |
| workflow_state | implemented-local |
| docs_only | false |

## 目的（purpose）

Sentry SDK を **`@sentry/cloudflare`（Workers / Node SSR / Edge ランタイム）** と **`@sentry/nextjs`（Browser ランタイム）** に明示的に分離し、Next.js 15 の `instrumentation.ts` / `instrumentation-client.ts` の規約に揃えて二重 init を排除する。これにより phase-1 §6 リスクの「Workers ランタイムへ `window.requestIdleCallback` を呼ぶ Browser SDK が混入し RSC 500 を引き起こす事象」を構造的に解消する。下流タスク（task-04 logger / task-05 error.tsx）が依存する `captureException` / `captureMessage` の API シグネチャを本タスクで凍結する。

## scope in / out

### scope in

- `apps/web/src/instrumentation.ts` 新規/更新（`@sentry/cloudflare` 系のみ import、`register()` export）
- `apps/web/src/instrumentation-client.ts` 新規（`@sentry/nextjs` のみ import、`'use client'`）
- `apps/web/src/lib/sentry/capture.ts` 新規（`captureException` / `captureMessage` の薄ラッパ・runtime 分岐）
- `apps/web/src/lib/__tests__/sentry-capture.test.ts` 新規（mock + runtime 分岐 + 二重 init ガード単体テスト）
- 旧 `apps/web/sentry.{client,server,edge}.config.ts` 削除（存在する場合）
- `apps/web/package.json` の依存追加（`@sentry/cloudflare`）と不要依存削除
- `apps/web/next.config.ts` の最小修正（`experimental.instrumentationHook` / Sentry webpack plugin 配線）
- 二重 init ガード `globalThis.__ubmSentryInitialized__`（server）+ `window.__ubmSentryInitialized__`（client）の導入
- DSN 注入経路の確定（server: Cloudflare Secrets `SENTRY_DSN_WEB` / client: `[vars]` の `NEXT_PUBLIC_SENTRY_DSN`）
- build grep gate（`.open-next/worker.js` への `requestIdleCallback` 0 件）の手順化

### scope out

- `wrangler.toml` の env / secret 定義（task-02 の責務）
- logger との結線・breadcrumb 投入（task-04 の責務）
- `error.tsx` の UI 設計と staging smoke の e2e 実行（task-05 の責務）
- `apps/api` への Sentry 導入（別 workflow）
- Sentry release tag 自動化 / performance monitoring 設計（範囲外）
- D1 schema 変更・新規 endpoint 追加（`SCOPE.md` 不変条件で禁止）

## AC（Acceptance Criteria）

- AC-1: `apps/web/src/instrumentation.ts` が `register(): Promise<void>` を export し、`@sentry/cloudflare` のみを動的 import している（`rg "@sentry/nextjs" apps/web/src/instrumentation.ts` が 0 件）。
- AC-2: `apps/web/src/instrumentation-client.ts` が `'use client'` 付きで `@sentry/nextjs` のみを import している（`rg "@sentry/cloudflare" apps/web/src/instrumentation-client.ts` が 0 件）。
- AC-3: 旧 `apps/web/sentry.{client,server,edge}.config.ts` がリポジトリに存在しない（`find apps/web -maxdepth 2 -name 'sentry.*.config.*'` が 0 件）。
- AC-4: `mise exec -- pnpm --filter @ubm-hyogo/web build` 成功後、`mise exec -- pnpm --filter @ubm-hyogo/web exec rg 'requestIdleCallback' apps/web/.open-next/` が 0 件である（grep gate）。
- AC-5: `apps/web/src/lib/sentry/capture.ts` の `captureException` / `captureMessage` が `typeof window` で runtime を分岐し、SDK 未 init / 未 DSN の状態でも throw せず silent fallback する（`sentry-capture.test.ts` の mock 単体テストで PASS）。
- AC-6: 二重 init ガード（`globalThis.__ubmSentryInitialized__` / `window.__ubmSentryInitialized__`）により、`register()` を 2 回呼んでも `Sentry.init` が 1 回しか呼ばれない（spy 単体テストで PASS）。
- AC-7: staging に deploy 後、`/` および `/(public)/members` の RSC 応答が `200`（500 が出ない）。staging Sentry dashboard に server / browser の意図的 throw event が双方届く（補助 evidence、screenshot 1 枚）。
- AC-8: `mise exec -- pnpm --filter @ubm-hyogo/web exec tsc --noEmit` および `pnpm --filter @ubm-hyogo/web lint` が PASS。
- AC-9: 下流契約：`captureException(err, ctx?)` / `captureMessage(msg, ctx?)` / `register()` のシグネチャが §0.7（元タスク）通りに固定され、後続 task-04 / task-05 が import 可能（型 export を `apps/web/src/lib/sentry/capture.ts` から確認）。

## 不変条件 trace

| # | 不変条件（CLAUDE.md / 元タスク §0.5） | 本 task での扱い |
| --- | --- | --- |
| 1 | D1 直接アクセスは `apps/api` に閉じる | Sentry breadcrumb / context に SQL や D1 接続情報を含めないことを capture.ts のコメントで明文化 |
| 2 | ランタイムシークレットは Cloudflare Secrets | `SENTRY_DSN_WEB`（web server）は `bash scripts/cf.sh secret put` 経由で投入。コード焼き付け禁止 |
| 3 | GAS prototype は本番昇格禁止 | GAS 由来の error reporting 仕様を引き継がない（GAS は logger を持たない）|
| 4 | 平文 `.env` 禁止 | `.dev.vars.example` には `op://...` 参照のみ。値は `scripts/with-env.sh` 経由で動的注入 |
| 5 | デフォルト：実装仕様書（コード変更あり）| 本 task は instrumentation 実装＋ライブラリ追加。`docs_only: false` |
| 6 | UI prototype alignment 不変条件 #1（既存 API 接続のみ）| 本 task は `apps/api` の endpoint surface に触れない |
| 7 | OKLch トークン正本化 | 本 task は色トークンに触れない（design-tokens gate と非干渉） |
| 8 | プロトタイプ正本順位 | 本 task はランタイム観測層、UI 設計に影響なし |

## Phase 索引

| Phase | タイトル | status | 主要成果物 |
| --- | --- | --- | --- |
| 1 | 要件定義（AC 確定 / 真の論点 / metadata 確定） | completed | phase-01.md / artifacts.json metadata |
| 2 | 設計（runtime 別 entry 分離・二重 init ガード設計） | completed | phase-02.md / runtime 分離 mermaid |
| 3 | API/型契約（`captureException`/`captureMessage`/`register` シグネチャ凍結） | completed | phase-03.md / 公開 API 表 |
| 4 | データ/状態（init flag・env キー一覧・Cloudflare Secrets 投入） | completed | phase-04.md / env 表 / `apps/web/src/lib/env.ts` |
| 5 | テスト戦略（mock / runtime 分岐 / 二重 init ガード / grep gate） | completed | phase-05.md / focused tests / grep gates |
| 6 | 実装計画（変更/新規/削除ファイル詳細表 + 順序） | completed | phase-06.md / 実装順序表 |
| 7 | リスク/緩和（bundle 解析・SDK バージョン整合・dynamic import 失敗 等） | completed | phase-07.md / リスクマトリクス |
| 8 | CI/Governance（design-tokens gate 非干渉・grep gate 追加・diff scope 規律） | completed | phase-08.md / CI gate 表 |
| 9 | 統合/結線（task-02 env 受領 / task-04 logger 前提 / task-05 error.tsx 接続） | completed | phase-09.md / `getEnv()` 結線 |
| 10 | デプロイ手順（local → staging → production / `scripts/cf.sh` 経由 secret put） | completed | phase-10.md / deploy runbook |
| 11 | 検証/Evidence（build grep / test ログ / staging Sentry 受信 / PASS 状態語彙） | completed | phase-11.md / evidence checklist |
| 12 | ドキュメント（中学生向け説明 + 技術者向け / system spec 更新 / skill feedback） | completed | phase-12.md / implementation-guide.md |
| 13 | PR 作成（commit/PR は user approval まで禁止） | blocked_pending_user_approval | phase-13.md / pr-template.md |

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流（直前） | task-01-w1-solo-scope-gate-all-screens | scope-gate 通過済みであること |
| 上流（並列直前） | task-02-w2-par-wrangler-env-injection | `getEnv().SENTRY_DSN_WEB` / `SENTRY_ENVIRONMENT` / `NEXT_PUBLIC_SENTRY_DSN` の env 注入を提供 |
| 並列 | task-02-w2-par-wrangler-env-injection | `wrangler.toml` 編集は task-02 集約・instrumentation 編集は task-03 集約 |
| 下流（直後） | task-04-w3-par-window-guard-and-logger | logger.warn/error から `captureException`/`captureMessage` を呼ぶ |
| 下流（直後） | task-05-w4-par-error-boundary-and-staging-smoke | `error.tsx` から `captureException` を呼び staging smoke 実行 |

## services / secrets

| 区分 | キー | 配置 | 備考 |
| --- | --- | --- | --- |
| Cloudflare Secrets | `SENTRY_DSN_WEB` | `bash scripts/cf.sh secret put SENTRY_DSN_WEB --config apps/web/wrangler.toml --env {staging,production}` | web server 用 DSN |
| `[vars]` | `NEXT_PUBLIC_SENTRY_DSN` | `apps/web/wrangler.toml` の env section（task-02 で配置） | client DSN は公開前提 |
| `[vars]` | `SENTRY_ENVIRONMENT` | `apps/web/wrangler.toml` env section | `'local' | 'staging' | 'production'` |
| `[vars]` | `SENTRY_TRACES_SAMPLE_RATE` | `apps/web/wrangler.toml` env section | 数値文字列、既定 `0.1` |
| 1Password | DSN 実値 | `op://UBM-Hyogo/Sentry Web DSN (<env>)/dsn` 等の参照のみ | `.env` には実値書かない |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-03-w2-par-sentry-workers-sdk-unify.md | 元タスク仕様（正本） |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md | scope-gate / diff scope 規律 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md | task-03 行 / 依存パッケージ |
| 必須 | CLAUDE.md（`scripts/cf.sh` ルール / 不変条件） | wrangler 直接実行禁止・branch protection ポリシー |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 3 層分離・観測対象 |
| 参考 | docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/ | 仕様書フォーマット参考 |
| 参考 | https://docs.sentry.io/platforms/javascript/guides/cloudflare/ | `@sentry/cloudflare` 公式 |
| 参考 | https://docs.sentry.io/platforms/javascript/guides/nextjs/ | `@sentry/nextjs` 公式（Browser 限定使用） |

## completion definition

### implemented-local completion（本ワークフローの今回ゴール）

- phase-01.md 〜 phase-13.md と `index.md` / `artifacts.json` が存在する
- 元タスク §0.7 の凍結シグネチャが phase-03.md に転載され、下流タスク（task-04/05）契約として固定されている
- AC-1〜AC-9 が phase-11 の evidence 計画と 1:1 対応している
- 不変条件 trace（上表）が `SCOPE.md` の規律と整合している
- Phase 11 は local code / typecheck / lint / focused tests / grep gate を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` として閉じ、staging runtime PASS と誤記しない
- Phase 12 strict 7 outputs と `outputs/artifacts.json` が物理配置され、aiworkflow-requirements indexes から辿れる

### executed completion（本ワークフローの実装完了条件・別 commit / 別 PR）

- AC-1〜AC-9 が PASS
- staging deploy 後 `/` / `/(public)/members` で RSC 200、Sentry dashboard に server + browser 双方の event 1 件以上
- 二重 init ガードと runtime 分岐の単体テスト PASS
- `.open-next/worker.js` の `requestIdleCallback` 0 件（grep gate）
- task-04 / task-05 が capture.ts を import して結線可能な状態
