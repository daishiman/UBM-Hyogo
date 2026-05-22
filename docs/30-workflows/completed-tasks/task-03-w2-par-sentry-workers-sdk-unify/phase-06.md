# Phase 6: 実装計画

## 目的

Phase 2〜5 の設計・契約・テスト戦略を、ファイル単位の **変更/新規/削除（M / C / D）** 一覧と実装順序に落とし込む。実装時は本 Phase の表をチェックリストとして使い、diff scope 規律（SCOPE.md §6）から外れないことを担保する。

## 変更対象ファイル詳細表

| # | path | 種別 | 概要 | 凍結契約参照 |
| --- | --- | --- | --- | --- |
| F-01 | `apps/web/package.json` | M | `@sentry/cloudflare` 追加。不要なら `@sentry/node` 削除 | Phase 2 依存追加表 |
| F-02 | `apps/web/pnpm-lock.yaml` | M | F-01 の自動再生成 | — |
| F-03 | `apps/web/src/instrumentation.ts` | M（無ければ C） | `register()` を export。`@sentry/cloudflare` のみ動的 import。`globalThis.__ubmSentryInitialized__` ガード | Phase 3 §register |
| F-04 | `apps/web/src/instrumentation-client.ts` | C | `'use client'` 付き。`@sentry/nextjs` のみ静的 import。`window.__ubmSentryInitialized__` ガード | Phase 2 設計 1 |
| F-05 | `apps/web/sentry.client.config.ts` | D | 旧 init を完全除去（存在すれば） | Phase 2 設計 |
| F-06 | `apps/web/sentry.server.config.ts` | D | 同上 | 同上 |
| F-07 | `apps/web/sentry.edge.config.ts` | D | 同上 | 同上 |
| F-08 | `apps/web/src/lib/sentry/capture.ts` | C | `captureException` / `captureMessage` / `CaptureContext`。`typeof window` 分岐の動的 import。fail-soft | Phase 3 凍結シグネチャ |
| F-09 | `apps/web/src/lib/__tests__/sentry-capture.test.ts` | C | T-01〜T-06 のテスト | Phase 5 Matrix |
| F-10 | `apps/web/src/__tests__/instrumentation.test.ts` | C（任意） | T-07 / T-08 の二重 init ガードテスト | Phase 5 Matrix |
| F-11 | `apps/web/next.config.ts` | M（最小） | `experimental.instrumentationHook = true`（Next 15 系で必要時のみ）。Sentry webpack plugin の配線（必要時のみ） | 元タスク §3 |
| F-12 | `apps/web/src/lib/sentry/index.ts` | C（任意） | `capture.ts` から再 export する barrel（task-04 / 05 の import path 短縮用） | Phase 3 export 表 |

> 既存ファイル有無は事前に `find apps/web -maxdepth 3 -name "sentry.*.config.*" -o -name "instrumentation*"` で確認し、存在するもののみ M/D 適用。

## 実装順序（依存順 / Wave 内 step）

| step | アクション | 対象 | 検証 |
| --- | --- | --- | --- |
| S-1 | `find` で既存 sentry config / instrumentation を棚卸し | リポジトリ全体 | 結果を作業メモに残す |
| S-2 | 依存追加 | F-01 / F-02 | `pnpm install` 成功 |
| S-3 | 旧 config 削除 | F-05 / F-06 / F-07 | `find` 結果が 0 件 |
| S-4 | `instrumentation.ts` 実装 | F-03 | tsc 通過 |
| S-5 | `instrumentation-client.ts` 実装 | F-04 | tsc 通過 |
| S-6 | `capture.ts` 実装（凍結シグネチャ） | F-08 | tsc 通過 |
| S-7 | `next.config.ts` 最小修正 | F-11 | build dry-run（`pnpm build`）通過 |
| S-8 | barrel 任意作成 | F-12 | tsc 通過 |
| S-9 | 単体テスト T-01〜T-06 | F-09 | `pnpm test` PASS |
| S-10 | 任意テスト T-07 / T-08 | F-10 | 同上 |
| S-11 | `pnpm build` 実行 → grep gate G-1 | — | `.open-next/worker.js` の `requestIdleCallback` 0 件 |
| S-12 | grep gate G-2〜G-5 | — | 全 0 件 |
| S-13 | local dev 起動確認 | `bash scripts/cf.sh dev --config apps/web/wrangler.toml` | RSC 200 |
| S-14 | diff scope 確認 | `git diff --name-only main...HEAD` | F-01〜F-12 と本 task package のみ |

## 依存追加コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web add @sentry/cloudflare
mise exec -- pnpm --filter @ubm-hyogo/web add @sentry/nextjs   # 既存維持確認
# 不要時のみ
mise exec -- pnpm --filter @ubm-hyogo/web remove @sentry/node
```

## 旧 config 削除コマンド

```bash
# 存在確認
find apps/web -maxdepth 2 -name "sentry.*.config.*" -print

# 削除（git mv で完了タスク領域へではなく、機能不要なので git rm）
git rm -f apps/web/sentry.client.config.ts \
          apps/web/sentry.server.config.ts \
          apps/web/sentry.edge.config.ts 2>/dev/null || true
```

## stale build cache 対策

```bash
rm -rf apps/web/.open-next apps/web/.next
```

旧 config 削除直後に必ず実行（元タスク §11 リスク表）。

## 実行タスク（チェックリスト）

- [ ] F-01〜F-12 を表通りに M / C / D 適用
- [ ] S-1〜S-14 を順序通りに実行
- [ ] 各 step で `tsc --noEmit` / `pnpm lint` / `pnpm test` を順次走らせる（一括ではなく細粒度で）
- [ ] diff が SCOPE.md の許容範囲内であることを S-14 で確認
- [ ] 旧 config 削除後の stale cache を必ず除去

## 入力 / 出力

| 種別 | 内容 |
| --- | --- |
| 入力 | Phase 2 設計、Phase 3 凍結契約、Phase 5 テスト Matrix |
| 出力 | F-01〜F-12 の M/C/D 表、S-1〜S-14 の実装順序 |

## 参照資料

- 元タスク §3「変更対象ファイル」, §9「ローカル実行・検証コマンド」, §11「リスクと緩和」
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` §6 diff scope 規律

## 成果物

- 本 phase-06.md（実装計画表）
- `outputs/phase-06/main.md`（executed 時のみ）

## 完了条件（DoD）

- [ ] ファイル変更表 F-01〜F-12 が網羅
- [ ] 実装順序 S-1〜S-14 が依存順で並んでいる
- [ ] 依存追加 / 削除 / cache 除去のコマンドが `mise exec --` / `git rm` 経由で記述
- [ ] diff scope 確認手順 S-14 が記述

## 統合テスト連携

- F-01〜F-12 の実装後、Phase 11 canonical evidence 5 点（typecheck / lint / test / build / grep-gate）を取得してから runtime deploy へ進む。
- `apps/web/src/lib/sentry/capture.ts` の実装は Phase 5 の T-01〜T-08 と Phase 3 の凍結シグネチャを同時に満たすことを確認する。

## メタ情報

- workflow: task-03-w2-par-sentry-workers-sdk-unify
- phase: 6
- status: `implemented-local / completed`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`
