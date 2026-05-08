# Phase 1: 要件定義

## 実装区分

**[実装区分: 実装仕様書]** — index.md の判定根拠と整合。

## 1. 背景

親タスク `task-03-w2-par-sentry-workers-sdk-unify` は `apps/web/src/instrumentation.ts`（`@sentry/cloudflare`）と `instrumentation-client.ts`（`@sentry/nextjs`）への SDK 分離、`apps/web/src/lib/sentry/capture.ts` の runtime 分岐 wrapper、`__ubmSentryInitialized__` global での二重 init ガードを完了し、Phase 11 で local PASS 5 点（typecheck / lint / test / build / grep-gate）を取得した。状態語彙は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（spec contract 完了 + runtime pending）であり、staging runtime の評価のみが残置している。

Issue #559 はその runtime 残置（AC-7: staging RSC 200 + Sentry server/browser event 各 1 件以上、AC-4: OpenNext build artifact への `requestIdleCallback` / `@sentry/nextjs` 推移混入 0 件）を staging で実測し、状態を `PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED` に昇格させることを目的とする。

## 2. 機能要件

| ID | 要件 |
| --- | --- |
| FR-1 | `apps/web/src/lib/env.ts` の zod schema が `SENTRY_DSN_WEB` / `NEXT_PUBLIC_SENTRY_DSN` を optional URL、`SENTRY_ENVIRONMENT` / `SENTRY_TRACES_SAMPLE_RATE` を required、`NEXT_PUBLIC_SENTRY_ENVIRONMENT` を optional enum として受理し、parse 失敗時に throw する |
| FR-2 | `apps/web/wrangler.toml` `[env.staging.vars]` に `SENTRY_ENVIRONMENT="staging"` / `NEXT_PUBLIC_SENTRY_ENVIRONMENT="staging"` / `SENTRY_TRACES_SAMPLE_RATE="0.2"` を含む |
| FR-3 | `SENTRY_DSN_WEB` が Cloudflare Secrets staging / production に投入され、`bash scripts/cf.sh secret list --env staging` で name のみ表示される |
| FR-4 | staging deploy 後の `/` および `/(public)/members` が HTTP 200 を返す |
| FR-5 | Sentry dashboard `environment:staging` フィルタ下で server / browser runtime tag を持つ event がそれぞれ 1 件以上受信される |
| FR-6 | `apps/web/.open-next/worker.js` に `requestIdleCallback` および `@sentry/nextjs` 推移依存が 0 件 |
| FR-7 | `task-03-w2-par-sentry-workers-sdk-unify.md` 冒頭メタ「状態」が `PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED` に昇格 |

## 3. 非機能要件

| ID | 要件 |
| --- | --- |
| NFR-1 | DSN 実値（URL / project numeric id）が repository / log / PR body / screenshot 上のテキスト領域に残らない |
| NFR-2 | staging / production の DSN source は別 1Password item に分離（`op://UBM-Hyogo/Sentry Web DSN (<env>)/dsn` / `public_dsn`） |
| NFR-3 | secret 投入・staging deploy・dashboard 観測は G1〜G5 の段階承認 gate を通過 |
| NFR-4 | runtime evidence 取得は本仕様書作成サイクル外で人手承認後に実行 |

## 4. ステークホルダー / 役割

| Role | 責務 |
| --- | --- |
| owner（user） | G1〜G5 の各 gate 承認、Sentry dashboard screenshot 取得 |
| Claude Code（後続実行サイクル） | env schema 反映、wrangler.toml 編集、`scripts/cf.sh` 経由の secret 投入実行、staging deploy 実行、curl 取得、grep gate 実行、状態昇格コミット作成 |

## 5. visualEvidence 判定

`artifacts.json.metadata.visualEvidence = "NON_VISUAL"`。Phase 11 主証跡は curl log / grep log / secret list log（テキスト）。Sentry dashboard screenshot は **VISUAL 補助** として保存するが、AC PASS 判定の主軸は curl HTTP 200 と event 受信の有無（dashboard URL + filter スクリーン領域記録）であり、UI screenshot 必須テンプレ要件ではない。

## 6. workflow_state

`metadata.workflow_state = "spec_created"`。G0 preflight または Phase 11 runtime evidence が未完了の間は `spec_created` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を維持する。Phase 11 完了後だけ `runtime-verified` へ昇格し、Phase 12 で `task-03-w2-par-sentry-workers-sdk-unify.md` 側のメタを `PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED` に書き換える。本ワークフロー root の `workflow_state` は `spec_created` →（G0〜G5 PASS 後）→ `implemented-local` →（Phase 13 merge 後）→ `completed` の遷移を取る。

## 7. 完了条件

- [ ] FR-1〜FR-7 が満たされる経路が phase-02 / phase-05 で詳細化されている
- [ ] NFR-1〜NFR-4 を遵守する手順が phase-05 / phase-11 に具体化されている
- [ ] visualEvidence / workflow_state / 状態語彙の決定が `artifacts.json` と整合
