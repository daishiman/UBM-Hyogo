# Phase 7: リスクと緩和

## 目的

元タスク §11 リスクマトリクスを実行可能な緩和手順に展開し、各リスクに対する **検出コマンド・緩和手順・残留リスク** の 3 点セットを定義する。

## リスク・緩和マトリクス

### R-01: `@sentry/nextjs` が server bundle に推移混入し RSC 500 が再発

| 項目 | 内容 |
| --- | --- |
| 影響 | 全 19 routes の RSC で TypeError（`requestIdleCallback is not defined`）→ 500 |
| 発生条件 | (a) `instrumentation.ts` が `@sentry/nextjs` を直接 import / (b) `capture.ts` が runtime 分岐をミスして server で `@sentry/nextjs` を import / (c) 他モジュール経由で推移 import |
| 検出 | `mise exec -- pnpm --filter @ubm-hyogo/web build && rg 'requestIdleCallback' apps/web/.open-next/`（grep gate G-1） |
| 緩和 | 1) `instrumentation.ts` に `@sentry/nextjs` の import を物理的に置かない / 2) `capture.ts` で `await import("@sentry/cloudflare")` を `typeof window === 'undefined'` 経路に閉じる / 3) `next.config.ts` の `serverExternalPackages` に `@sentry/cloudflare` を追加検討 |
| 残留 | 第三者ライブラリが `@sentry/nextjs` を peer 経由で引っ張る場合は逐次対応 |

### R-02: `@sentry/cloudflare` と `@sentry/nextjs` の major / minor バージョン不整合

| 項目 | 内容 |
| --- | --- |
| 影響 | 共通の `Hub` / `Scope` API 不整合で `captureException` が silent 失敗 |
| 検出 | `pnpm list --filter @ubm-hyogo/web @sentry/cloudflare @sentry/nextjs` で major / minor を比較 |
| 緩和 | 同 major かつ近接 minor で揃える（例: 共に v8.x の最新 minor）。`package.json` で `"^8"` ピン |
| 残留 | Sentry SDK の breaking change 対応は別タスク |

### R-03: client DSN を Cloudflare Secrets に入れて build に届かない

| 項目 | 内容 |
| --- | --- |
| 影響 | client side capture が無音で機能しない（dashboard に browser event 0 件） |
| 検出 | staging で `throw new Error('client-test')` を実行 → dashboard 確認 / `apps/web/.open-next/worker.js` を `rg 'NEXT_PUBLIC_SENTRY_DSN'` で検査（公開 DSN が build 時 inject されているか） |
| 緩和 | client DSN は `[vars]` の `NEXT_PUBLIC_SENTRY_DSN` で管理（Phase 4 表）。secret に入れない |
| 残留 | DSN ローテーション時に `[vars]` 更新を忘れるリスク → runbook で明示 |

### R-04: `instrumentation.ts` で `@sentry/cloudflare` の dynamic import が edge ランタイムで失敗

| 項目 | 内容 |
| --- | --- |
| 影響 | server-side capture が部分的に機能しない |
| 検出 | staging deploy 後 `/api/_throw` を叩き dashboard 確認 / Workers logs |
| 緩和 | `await import("@sentry/cloudflare")` を try/catch で囲む（fail-soft）。失敗時は `console.error` で fallback。後続コード継続 |
| 残留 | edge での capture 完全動作確認は task-05 staging smoke で実施 |

### R-05: 旧 `sentry.{client,server,edge}.config.ts` 削除後の stale build cache

| 項目 | 内容 |
| --- | --- |
| 影響 | 削除済 config が `.open-next/` キャッシュから読まれ deploy が壊れる |
| 検出 | `ls apps/web/.open-next/` 内に `sentry.*.config.*` 由来 chunk が残る |
| 緩和 | 旧 config 削除直後に `rm -rf apps/web/.open-next apps/web/.next` を必ず実行（Phase 6 S-3 の直後） |
| 残留 | CI 側の cache（GitHub Actions cache）に残った場合は cache key bump |

### R-06: 二重 init ガードの globalThis / window 名前衝突

| 項目 | 内容 |
| --- | --- |
| 影響 | 他ライブラリが `__ubmSentryInitialized__` を上書きして init が起動しない / 多重起動 |
| 検出 | `rg "__ubmSentryInitialized__" apps/web/src` で 4〜6 箇所のみ（instrumentation 系 + capture テスト）であることを確認 |
| 緩和 | プレフィックス `__ubm` で衝突確率を最小化。本 repo 内では本 task のみが触る前提を SCOPE.md に登録 |
| 残留 | 外部ライブラリ衝突は確率低、検出は本 grep のみ |

### R-07: `process.env.SENTRY_DSN` 直接参照の混入

| 項目 | 内容 |
| --- | --- |
| 影響 | Workers ランタイムで `process.env` が undefined となり、staging で DSN 未設定状態となる |
| 検出 | grep gate G-5: `rg "process\\.env\\.SENTRY_DSN" apps/web/src` 0 件 |
| 緩和 | `getEnv()` 経由のみ許可。`instrumentation-client.ts` のみ `process.env.NEXT_PUBLIC_SENTRY_DSN` を許可（build inject される） |
| 残留 | code review で逐次検査 |

### R-08: `next.config.ts` の `experimental.instrumentationHook` バージョン依存

| 項目 | 内容 |
| --- | --- |
| 影響 | Next.js 15.x では `instrumentationHook` がデフォルト有効化 → 設定しても warning。古い 14.x 系では未有効で `register()` が呼ばれない |
| 検出 | `pnpm list next --filter @ubm-hyogo/web` でバージョン確認 |
| 緩和 | Next 15.x 系を前提とし、`experimental.instrumentationHook` の指定は bundler version を見てから最小修正 |
| 残留 | Next major upgrade 時に再確認 |

## 実行タスク（チェックリスト）

- [ ] R-01〜R-08 の各検出コマンドが Phase 11 evidence に組み込まれている
- [ ] R-01 grep gate を CI（Phase 8）で fail させる構成を確認
- [ ] R-05 stale cache 除去を Phase 6 S-3 の直後に固定
- [ ] R-07 grep gate G-5 を CI に組み込み

## 入力 / 出力

| 種別 | 内容 |
| --- | --- |
| 入力 | 元タスク §11、Phase 5 grep gate |
| 出力 | リスク R-01〜R-08 の検出 / 緩和 / 残留マトリクス |

## 参照資料

- 元タスク §11「リスクと緩和」
- Phase 5「grep gate」, Phase 6「実装順序」

## 成果物

- 本 phase-07.md（リスクマトリクス）
- `outputs/phase-07/main.md`（executed 時のみ）

## 完了条件（DoD）

- [ ] R-01〜R-08 が検出コマンド付きで列挙
- [ ] 各リスクの緩和手順が Phase 6 / Phase 8 と整合
- [ ] R-01（最重要）の grep gate G-1 が AC-4 と一致

## 統合テスト連携

- R-01 / R-02 / R-07 は Phase 11 `grep-gate.log` の blocker として扱う。
- R-08 の staging dashboard evidence は user approval 後の runtime evidence であり、`implemented-local` の完了条件に含めない。

## メタ情報

- workflow: task-03-w2-par-sentry-workers-sdk-unify
- phase: 7
- status: `implemented-local / completed`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`
