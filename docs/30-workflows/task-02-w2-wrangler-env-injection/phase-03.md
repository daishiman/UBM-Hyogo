# Phase 03 — 設計レビュー

実装区分: 実装仕様書（CONST_004 デフォルト適用）

## 1. 代替案比較

### 案 A: `process.env` 直接参照のみ（採用しない）

| 観点 | 評価 |
| --- | --- |
| 実装容易さ | 高（zod / accessor 不要） |
| Workers ランタイム適合 | 低（Workers では `process.env` が空または部分的） |
| 型安全性 | 低（`process.env.X` は `string | undefined`） |
| smoke gate 適合 | 不可（AC-6 grep gate に違反） |
| 採否 | **不採用**: Workers でランタイム値が抜ける / 直接参照箇所が散らばり regression のたびに grep 必須 |

### 案 B: Runtime injection only（`getCloudflareContext` のみ・採用しない）

| 観点 | 評価 |
| --- | --- |
| Workers 適合 | 高 |
| build / test runtime | 不可（`getCloudflareContext` が利用できない場合 throw） |
| Vitest からの利用 | 不可 |
| 採否 | **不採用**: build / test 時に env が読めず CI が回らない |

### 案 C: Build-time bake-in only（`NEXT_PUBLIC_*` を bundler 経由のみ・採用しない）

| 観点 | 評価 |
| --- | --- |
| client bundle 適合 | 高 |
| server runtime での非 NEXT_PUBLIC_* 参照 | 不可（`AUTH_SECRET` 等が読めない） |
| 環境切替 | 低（再 build が必須） |
| 採否 | **不採用**: server-side secret が読めない |

### 案 D（採用）: `[vars]` 集約 + zod 検証 accessor + `getCloudflareContext` 優先 / `process.env` フォールバック

| 観点 | 評価 |
| --- | --- |
| Workers 適合 | 高（`getCloudflareContext().env` 経路） |
| build / test 適合 | 高（`process.env` フォールバック） |
| 型安全性 | 高（zod parse） |
| smoke gate 適合 | OK（直接参照は `env.ts` 内に閉じる） |
| 採否 | **採用** |

## 2. 選定理由

- **2 ランタイム両立**: Workers と Node（build / test）の両経路で同一 schema を通せる
- **CI gate に整合**: `process.env.NEXT_PUBLIC_*` の直接参照を `env.ts` 1 箇所に集約でき、AC-6 grep gate を機械検証可能
- **下流影響小**: 公開 API は `getEnv()` / `getPublicEnv()` の 2 関数のみ。task-04 / task-05 / task-18 は import 1 行で参照可能
- **secret 境界明確**: optional zod field で Cloudflare Secrets の遅延注入を許容しつつ、build runtime での欠落を許す

## 3. リスク評価

| リスク | 影響度 | 発生確率 | 緩和策 |
| --- | --- | --- | --- |
| `getCloudflareContext` が edge / node ランタイムで未定義 | 中 | 中 | `try/catch` フォールバック + `process.env` 最終受け |
| `NEXT_PUBLIC_*` の build 時固定でローカル切替が効かない | 中 | 低 | `wrangler dev` + `.dev.vars` 経由起動を README 化 |
| Cloudflare Secrets 投入忘れ → staging で `SENTRY_DSN_WEB` 欠落 | 中 | 中 | optional schema + task-03 の DoD で `wrangler secret list` 確認 |
| zod 厳格化で既存コードが parse 失敗 | 高 | 低 | optional / `.coerce` を活用、Phase 5 grep & 移行で順次差し替え |
| `127.0.0.1:8888` 焼き込みが想定外箇所に残存 | 中 | 中 | Phase 5 で `rg '127\.0\.0\.1:8888' apps/web/src` 全件調査、smoke gate で 0 件確認 |
| `require("@opennextjs/cloudflare")` が ESM 環境で破綻 | 中 | 低 | dynamic import パターンに切替可能（phase-05 で確認） |

## 4. task-03 sentry-workers-sdk-unify との並列実行調整

| 項目 | 本タスク | task-03 | 競合回避 |
| --- | --- | --- | --- |
| `apps/web/wrangler.toml` `[vars]` セクション | owner | 触らない | 本タスクが先行 commit |
| `apps/web/wrangler.toml` `[observability]` / instrumentation | 触らない | owner | task-03 は本タスク merge 後に追記 |
| `SENTRY_DSN_WEB` / `SENTRY_ENVIRONMENT` キー定義 | env キーセットに含める | 値を消費 | キーは本タスク、Sentry init は task-03 |
| `apps/web/instrumentation.ts` | 触らない | owner | — |
| `apps/web/src/lib/env.ts` | owner | 利用のみ | task-03 は `import { getEnv } from "@/lib/env"` で参照 |

運用フロー:

1. 本タスクが `[vars]` セクションと `env.ts` を先行 PR で merge
2. task-03 は本タスクの head から start し、instrumentation のみ追記
3. 万が一同時 PR になった場合は本タスク優先（rebase は task-03 側で実施）

## 5. 将来拡張点（本 task scope out）

- materialized env binding（D1 接続文字列の動的 rotate）
- env 値の暗号化注入（現状は Cloudflare Secrets で十分）
- preview deployment ごとの env override（必要時 `[env.preview.vars]` を追加）

## 6. 設計レビュー結論

採用案: **案 D**。Phase 02 の wrangler.toml 差分・env.ts シグネチャ・.dev.vars.example をそのまま phase-05 ランブックへ引き渡す。task-03 との並列調整ルールは index.md / phase-01 にも反映済み。
