# Phase 11 main

## Cycle summary

本実行サイクル（2026-05-08 / wt-13）では G0 preflight + ローカル品質ゲート（typecheck / lint / test / build / grep gate / DSN leak scan）を完遂し、 evidence を取得した。G1 secret 投入以降は **1Password に `UBM-Hyogo` vault 及び `Sentry Web DSN (staging|production)` item が provisioning されていない** ことが判明したため、spec の prerequisite 不成立として halt する。状態は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を維持。

## 環境

- worktree: `.worktrees/task-20260508-184740-wt-13`
- HEAD: `7d27f796` (origin/dev — Merge PR #593 feat/task-04-window-guard-and-logger-spec)
- Node: v24.15.0 / pnpm: 10.33.2
- 親 task-03 実装ファイル: 全 PASS（origin/dev に取り込み済み）

## G0 preflight

- timestamp: 2026-05-08T21:30:30+09:00（post-rebase）
- parent task-03 spec: present
- parent task-02 spec: present
- `apps/web/src/lib/env.ts`: present (Sentry schema 5 keys 反映済み)
- `apps/web/wrangler.toml`: present (`[env.staging.vars]` / `[env.production.vars]` Sentry vars 反映済み)
- `apps/web/.dev.vars.example`: present (op:// 参照のみ)
- `scripts/cf.sh`: present
- `apps/web/src/instrumentation.ts`: present
- `apps/web/src/instrumentation-client.ts`: present
- `apps/web/src/lib/sentry/capture.ts`: present
- log: `evidence/preflight-g0.log`
- result: **PASS**

## Step 1〜3 実コード実装（FR-1 / FR-2 / NFR-1）

本サイクル内で以下の実コード変更を実施。当初「origin/dev 上で反映済み」と判定したが再検証で乖離が判明したため、spec の FR-1 / FR-2 / NFR-1 を満たすよう本サイクルで実装した。

| ファイル | 変更内容 |
| --- | --- |
| `apps/web/src/lib/env.ts` | `EnvSchema` に `NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional()` / `NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.enum(["local","staging","production"]).optional()` を追加 |
| `apps/web/wrangler.toml` | `[vars]` / `[env.staging.vars]` / `[env.production.vars]` 各セクションに `NEXT_PUBLIC_SENTRY_ENVIRONMENT = "<env>"` を追加 |
| `apps/web/.dev.vars.example` | `NEXT_PUBLIC_SENTRY_ENVIRONMENT=local` 追加、`SENTRY_DSN_WEB` の op path を spec 正本 `op://UBM-Hyogo/Sentry Web DSN (local)/dsn` に修正、`NEXT_PUBLIC_SENTRY_DSN=op://UBM-Hyogo/Sentry Web DSN (local)/public_dsn` を追加 |
| `apps/web/src/lib/__tests__/env.test.ts` | `NEXT_PUBLIC_SENTRY_DSN` parse PASS / 不正 URL reject / `NEXT_PUBLIC_SENTRY_ENVIRONMENT` enum reject の 3 ケース追加。既存 optional secrets テストを 5 keys 対応に拡張 |

## Step 4 ローカル品質ゲート

| step | command | result |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS（exit 0） |
| lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | PASS（exit 0） |
| test | `mise exec -- pnpm --filter @ubm-hyogo/web test` | **445/445 passed**（実装後再走） |
| build (Next) | `mise exec -- pnpm --filter @ubm-hyogo/web build` | PASS |
| build (OpenNext Cloudflare) | `mise exec -- pnpm --filter @ubm-hyogo/web run build:cloudflare` | PASS（`.open-next/worker.js` 再生成、auth env bridge 注入確認） |

## G4 grep gate（Step 8 相当 — local pre-deploy 段階, post-implementation rebuild）

- scope: `apps/web/.open-next/worker.js`（server runtime artifact）
- AC-4-R1: `requestIdleCallback` matches in worker.js: **0**
- AC-4-R2: `@sentry/nextjs` matches in worker.js: **0**
- log: `evidence/grep-gate-runtime.log`
- result: **PASS**（NEXT_PUBLIC_SENTRY_* 追加後の再ビルドでも 0 件維持）
- note: `apps/web/.open-next/assets/` 配下の client-side static bundles に `requestIdleCallback` を含むコード（Next.js Turbopack runtime / Web API としての標準機能利用）が存在するが、これは browser scope であり AC-4 (server runtime worker.js) の対象外。

## DSN leak scan

- pattern: `https://[A-Za-z0-9]+@[A-Za-z0-9.-]+\.ingest\.sentry\.io`
- scan exclusions: `node_modules`, `apps/web/.open-next`, `apps/web/.next`, `pnpm-lock.yaml`
- 検出: `docs/30-workflows/completed-tasks/task-03-w2-par-sentry-workers-sdk-unify/phase-04.md:41` に `https://xxx@oN.ingest.sentry.io/yyy`（**プレースホルダ例**, xxx/oN/yyy 非実値）
- log: `evidence/dsn-leak-scan.log`
- result: **PASS**（実 DSN 漏洩 0 件）

## G1 secret 投入承認 — **NOT EXECUTED**

- timestamp: 2026-05-08T21:44:42+09:00
- prerequisite check:
  - `op` CLI: present (v2.33.1, signed-in `my.1password.com` / `manju.1password.com`)
  - 1Password vault `UBM-Hyogo`: **MISSING**（両 account とも該当 vault 不在。利用可能 vault: `Personal` / `Employee` / `senpAI` / `Shared`）
  - `op item get 'Sentry Web DSN (staging)' --vault UBM-Hyogo`: **FAIL**（`"UBM-Hyogo" isn't a vault in this account`）
  - 全 vault 横断 Sentry item 検索: **0 件**
- 判定: spec が前提とする 1Password 正本 (`op://UBM-Hyogo/Sentry Web DSN (staging)/dsn` / `.../public_dsn`) が provisioning されていないため、`bash scripts/cf.sh secret put` を安全に実行できない
- 必要な事前作業（本タスク scope out / 別サイクルで実施）:
  1. Sentry project の作成または特定（環境別または共通）と DSN（server / public）の発行
  2. 1Password に `UBM-Hyogo` vault 作成（または既存 vault 採用 + spec の op:// パス更新）
  3. `Sentry Web DSN (staging)` / `Sentry Web DSN (production)` item 作成（fields: `dsn`, `public_dsn`）
  4. 上記完了後、本サイクル G1 から再開
- result: **HALT (PRECONDITION_NOT_MET)**

## G2 staging deploy 承認 — NOT EXECUTED（G1 halt のため）

## G3 curl + Sentry event 観測承認 — NOT EXECUTED

## G4 grep gate 再走承認 — local pre-deploy 段階のみ実行（上記参照）

deploy 後の再走（spec 規定の G4）は G2 deploy 完了が前提のため未実行。

## G5 状態昇格 + commit/PR 承認 — NOT EXECUTED

`task-03-w2-par-sentry-workers-sdk-unify.md` のメタ「状態」は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を維持。

## evidence files (this cycle)

- `evidence/preflight-g0.log`（G0 PASS）
- `evidence/grep-gate-runtime.log`（G4 local PASS, worker.js scope）
- `evidence/dsn-leak-scan.log`（PASS, placeholder example のみ）

## evidence files (deferred — next cycle)

- `evidence/secret-list-staging.log`
- `evidence/deploy-staging.log`
- `evidence/curl-staging.log`
- `evidence/sentry-staging-server-event.png`
- `evidence/sentry-staging-browser-event.png`

## Verdict

`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 維持。本サイクルは local PASS 5 点 + DSN leak scan + G0 preflight evidence を追加取得し、後続 runtime 実行サイクルへの bridge を確立した。runtime evidence 取得は Sentry project + 1Password vault provisioning 完了後の別サイクルで実施する。
