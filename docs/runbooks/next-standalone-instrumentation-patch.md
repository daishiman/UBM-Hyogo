# RUN BOOK: Next.js standalone instrumentation patch

参照: Issue #560 / `docs/30-workflows/issue-560-task-03-followup-002-next-standalone-instrumentation-patch/`

## 1. 背景

Next.js standalone build (`output: "standalone"`) は `instrumentation.ts` (またはコンパイル後の `.next/server/instrumentation.js`) を standalone 出力 (`.next/standalone/...`) へ自動 copy しない。これは Next.js / OpenNext の現行制約で、公式 docs に明示されていない。

`apps/web` は Sentry の server-side init を `instrumentation.ts` の `register()` 内で行うため、この自動 copy 漏れが発生すると **build は成功するのに Sentry server event が一切届かない silent failure** になる。

`scripts/patch-next-standalone-instrumentation.mjs` は、build 後にこのファイルと依存 trace を物理 copy し、`--verify-only` モードで CI gate を提供する workaround である。

## 2. patch script 責務 / 入出力境界

| 項目 | 値 |
|------|----|
| 起動経路（正規） | `apps/web/open-next.config.ts` の `buildCommand` 経由 (`pnpm build && node ../../scripts/patch-next-standalone-instrumentation.mjs`) |
| 起動経路（検証） | `cd apps/web && node ../../scripts/patch-next-standalone-instrumentation.mjs [--verify-only]` |
| cwd 前提 | `apps/web`（それ以外は exit 1 / `cwd_guard_failed`） |
| 入力 | `apps/web/.next/server/instrumentation.js` / `.map` / `.nft.json` および `.nft.json` の `files[]` |
| 出力 | `apps/web/.next/standalone/apps/web/.next/server/instrumentation.js` ほか trace dependency |
| 環境変数 | 読まない（DSN / token に非接触） |
| ログ形式 | `[patch-next-standalone-instrumentation] event=... key=value ...` |

## 3. 起動経路と禁止事項

- **正規**: `pnpm --filter @ubm-hyogo/web build:cloudflare` → opennextjs-cloudflare が `open-next.config.ts` の `buildCommand` を実行する経路。
- **検証**: `cd apps/web && node ../../scripts/patch-next-standalone-instrumentation.mjs --verify-only`。CI でも同じ経路で gate する。
- **禁止**: リポジトリ root から `node scripts/patch-next-standalone-instrumentation.mjs` の直叩き。cwd guard が fail させる。

## 4. CI gate fail 条件 (6 種)

CI workflow `.github/workflows/pr-build-test.yml` の `verify-web-instrumentation-patch` step は、次のいずれかで job 全体を fail させる:

1. `apps/web/.next/standalone/apps/web/.next/server/instrumentation.js` が不在
2. 当該ファイルに `register` / `Sentry` のいずれかの token が含まれない
3. patch script 実行時 `cwd` が `apps/web` 以外 (`cwd_guard_failed`)
4. patch script が exit code ≠ 0 を返す
5. `server/instrumentation.js.nft.json` の `files[]` に列挙された trace dependency の copy 失敗
6. `server/instrumentation.js.nft.json` が JSON として読めない、または `files` が配列ではない

`--verify-only` の `verify_failed` ログには `Sentry server instrumentation missing in standalone build artifact` を含める。copy / trace failure は `copy_failed` / `trace_failed` の structured event を確認する。

## 5. Next.js / OpenNext upgrade 追従

upgrade PR (Next.js / `@opennextjs/cloudflare` のいずれか) を切る前に必ず以下を実施する:

1. ローカルで `pnpm --filter @ubm-hyogo/web build:cloudflare` を実行
2. `apps/web/.next/server/instrumentation.js.nft.json` の trace 構造（`files[]` のキー名と相対 path 規則）に変化がないか確認
3. `apps/web/.next/standalone/apps/web/.next/server/` の layout が変わっていないか確認
4. layout が変わった場合は `scripts/patch-next-standalone-instrumentation.mjs` の `REQUIRED_INPUTS` / `TRACE_FILE` / 出力 path を追従させ、regression test fixture も更新
5. upstream で本問題が解決した release が出た場合は、**workaround 撤去 PR を別タスクで起票**する（このスクリプトと CI gate を同時に消す）

## 6. トラブルシュート FAQ

| 症状（log の event） | 原因 | 対処 |
|---|---|---|
| `cwd_guard_failed` | リポジトリ root などから直叩きした | `cd apps/web` してから実行する。CI なら `working-directory: apps/web` を確認 |
| `copy_failed reason=missing` | `pnpm build` が走っていない / Next.js の output layout が変わった | `pnpm --filter @ubm-hyogo/web build` を先に実行。それでも missing なら §5 に従い trace 構造を再確認 |
| `verify_failed reason=missing` | `build:cloudflare` の `buildCommand` が patch script を起動していない | `apps/web/open-next.config.ts` の `buildCommand` を確認 |
| `verify_failed reason=tokens_missing` | `instrumentation.ts` の export 仕様が変わって `register` / `Sentry` token が消えた | task-03 (`task-03-w2-par-sentry-workers-sdk-unify`) の export 仕様と整合させる |
| `trace_failed reason=invalid_json` | `.nft.json` が壊れている / Next.js trace layout が変わった | §5 に従い trace 構造を確認し、必要なら script と fixture を更新 |
| `Sentry server instrumentation missing in standalone build artifact` | 上記いずれかの最終形態 | CI ログから event を読み取り上の表へ |
