> 関連 source: docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md
> 実装区分: 実装仕様書

# Phase 10: ビルド & SSR 検証 / Workers ランタイム

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-04-w3-window-guard-and-logger |
| Wave | W3 |
| 実行種別 | sequential |
| Phase 番号 | 10 / 13 |
| 作成日 | 2026-05-08 |
| 上流 Phase | 9（静的検証 / Lint / 型 / grep gate） |
| 下流 Phase | 11（staging 反映 / decision-record） |
| 状態 | completed |

## 目的

`@opennextjs/cloudflare` ビルド経路で **SSR 警告 0 / Workers ランタイム起動 OK** を確認する。`window` 参照が SSR 段で評価されると build 段 / dev server 段で即座に落ちるため、本 phase は CI 単位ではなく **build & smoke** 単位の最終ゲートとして機能する。

## 実行タスク

1. `pnpm --filter @ubm-hyogo/web build` で SSR 警告 0 を確認する手順
2. `@opennextjs/cloudflare` ビルドの要点
3. `wrangler dev` / `wrangler pages dev` smoke 起動手順
4. `apps/web/wrangler.toml` 前提（task-02 で確定）
5. 失敗時の切り分けフロー（どの `window` 参照が残っているか）
6. runtime 判定 (`process.env.NEXT_RUNTIME`) の Workers / Node / Browser 別挙動の整理
7. CI で本タスクが触る gate 一覧の最終整理

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md §8 / §9 | build コマンド・DoD |
| 必須 | apps/web/wrangler.toml | task-02 で確定済み env |
| 必須 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | `scripts/cf.sh` 経由必須 |
| 推奨 | @opennextjs/cloudflare README | adapter 仕様 |

## 10.1 build コマンドと期待

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build
```

期待:

- exit 0
- stderr に `ReferenceError: window is not defined` / `Cannot read properties of undefined (reading 'document')` が **1 件も無い**
- `Static page generation failed` 警告が無い
- `.open-next/` または `.vercel/output/`（adapter 仕様準拠）が生成

## 10.2 `@opennextjs/cloudflare` ビルド要点

| ステージ | 内容 | window 参照時の挙動 |
| --- | --- | --- |
| Next.js compile | `next build` で RSC / SSR バンドル生成 | server bundle に `window.*` が含まれると build OK でも runtime で死ぬ |
| OpenNext transform | `.open-next/server-functions/default/` に Workers 用 entry を作成 | top-level `window` 参照は dead-code にならず Workers eval で例外 |
| Workers bundling | esbuild が Workers 互換にバンドル | top-level `window` は esbuild が定義不明で warn |

→ **build OK = runtime OK** は保証しない。10.3 の dev smoke を必ず実施する。

## 10.3 wrangler dev smoke

```bash
# 認証は scripts/cf.sh が op run 経由で注入する
bash scripts/cf.sh --help  # ラッパー疎通

# Workers 互換 dev（OpenNext 経路の Pages dev は本 task では非採用）
bash scripts/cf.sh dev --config apps/web/wrangler.toml --local --port 8788
```

検証:

1. `http://127.0.0.1:8788/` にアクセスし `200 OK` を確認
2. `wrangler tail` 相当の dev console に **JSON 一行 logger 出力**が流れる
3. SSR 段で `window is not defined` が出ないこと
4. logger 経由の `error` が Sentry mock（ローカルは DSN 空）でも throw しないこと

> `wrangler dev` を直接呼ばず必ず `bash scripts/cf.sh` 経由で起動する（CLAUDE.md「Cloudflare 系 CLI 実行ルール」遵守）。

## 10.4 `apps/web/wrangler.toml` 前提

| 項目 | 値 / 出所 |
| --- | --- |
| name | `ubm-hyogo-web` 系（task-02 確定） |
| compatibility_date | task-02 で確定 |
| `[vars]` 非機密 | `NEXT_PUBLIC_*` 等。logger は触らない |
| Secret | `SENTRY_DSN_WEB` / `AUTH_SECRET`（`bash scripts/cf.sh secret put` 投入） |
| 本 task の追加 | **なし**（logger は env 追加を要求しない） |

## 10.5 失敗時の切り分けフロー

```
build / wrangler dev で window 系エラー
  ↓
1. mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n '\bwindow\.' src/
   → 0 件か確認
  ↓
2. 0 件なのに失敗する場合は依存ライブラリ（node_modules）が SSR で window を触っている
   → next.config.{ts,mjs} の transpilePackages / serverExternalPackages を確認
  ↓
3. RSC / Server Action 中に動的 import した client module で漏出している可能性
   → "use client" の境界を確認、useEffect 移動を検討
  ↓
4. instrumentation-client.ts のロード経路が server bundle に巻き込まれていないか
   → next.config の instrumentation 設定を確認（task-03 §0.6 と整合）
```

## 10.6 runtime 判定の挙動マトリクス

`apps/web/src/lib/logger.ts` の `RUNTIME_TAG()`（元仕様 §4.2）が返す値:

| 実行環境 | `isBrowser()` | `process.env.NEXT_RUNTIME` | `runtime` 出力 |
| --- | --- | --- | --- |
| Browser (production) | true | undefined | `"browser"` |
| jsdom test | true | undefined | `"browser"` |
| Node SSR (Next dev) | false | `"nodejs"` | `"nodejs"` |
| Workers Edge runtime | false | `"edge"` | `"edge"` |
| Workers (env 未注入) | false | undefined | `"workers"`（fallback） |
| node test (vitest) | false | （未注入） | `"workers"` |

→ Phase 8 統合テストの runtime マトリクスと一致していることを最終確認する。

## 10.7 CI gate 一覧（本タスク最終版）

| gate | コマンド | 関連 phase |
| --- | --- | --- |
| typecheck | `pnpm --filter @ubm-hyogo/web exec tsc --noEmit` | 9 |
| lint | `pnpm --filter @ubm-hyogo/web lint` | 9 |
| test | `pnpm --filter @ubm-hyogo/web test src/lib/__tests__/` | 7 / 8 |
| window-grep | grep gate one-liner（Phase 9 §grep） | 9 |
| build | `pnpm --filter @ubm-hyogo/web build` | 10 |
| smoke (manual) | `bash scripts/cf.sh dev --config apps/web/wrangler.toml --local` | 10 |

> smoke 以外は GitHub Actions で恒久 gate 化する（task-18 で `required_status_checks` 反映）。

## CONST_005 該当項目

- **CONST_005-1（既存 API のみ接続）**: build / smoke で `apps/api` 側 endpoint を新規追加していない。
- **CONST_005-2（OKLch トークン正本化）**: build 時に `bg-[#xxx]` 検出は task-18 で扱う。本 phase では新規 HEX 導入なし。
- **CONST_005-3（プロトタイプ正本順位）**: 該当なし（platform task）。
- **CONST_005-4（D1 直接アクセス禁止）**: `apps/web` の build 出力に D1 binding 参照が含まれないこと（既存条件）。
- **CONST_005-5（secret 不混入）**: build artifact に `SENTRY_DSN_WEB` 値が焼き込まれない。`apps/web/src/lib/env.ts` (task-02) 経由のみ。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | build コマンド & 期待出力 | 10 | completed |
| 2 | OpenNext / Workers bundling 要点 | 10 | completed |
| 3 | wrangler dev smoke 手順 | 10 | completed |
| 4 | 切り分けフロー | 10 | completed |
| 5 | runtime マトリクス | 10 | completed |
| 6 | CI gate 一覧最終版 | 10 | completed |
| 7 | outputs/phase-10/phase-10.md 配置 | 10 | completed |

## 成果物

| 種別 | パス |
| --- | --- |
| ドキュメント | docs/30-workflows/task-04-w3-window-guard-and-logger/phase-10.md |
| ドキュメント | docs/30-workflows/task-04-w3-window-guard-and-logger/outputs/phase-10/phase-10.md |

## 完了条件

- [ ] `pnpm --filter @ubm-hyogo/web build` が SSR 警告 0 で通過
- [ ] `bash scripts/cf.sh dev --config apps/web/wrangler.toml --local` で `/` が 200 OK
- [ ] dev console に JSON 一行 logger が観測できる
- [ ] runtime マトリクス全 6 行が説明されている
- [ ] CI gate 一覧（5 自動 + 1 manual）が最終確定

## 次 Phase

- 次: Phase 11（staging 反映 / decision-record）
- 引き継ぎ事項: build artifact 検証ログ、smoke 結果、CI gate 名称
- ブロック条件: build で window 起因 SSR 警告が残存
