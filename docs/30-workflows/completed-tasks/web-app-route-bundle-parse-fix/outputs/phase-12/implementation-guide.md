# Implementation Guide

## Part 1: 中学生レベル

### なぜ必要か

公開中のWebアプリには、画面を見せる係と、ログインなどの細かいお願いを受け取る係があります。今回、画面を見せる係は動いていましたが、ログインまわりのお願いを受け取る係だけが、公開先で失敗していました。

たとえば、学校の図書室で「本の場所は地図を見てね」と言われたのに、地図に「あとで決める場所」とだけ書かれていたら、本を探せません。今回もこれと似ていて、公開先のサーバーが読むファイル一覧に、実際の場所ではなく仮の名前が残っていました。そのため、サーバーは必要なファイルを見つけられず、エラーを返していました。

### 何をしたか

本番用に作るときの方法を、公開先のサーバーが読める形に切り替えました。あわせて、前からある仕上げ作業が「今回は対象のファイルが無い」場合でも止まらず、次へ進めるようにしました。

### 用語の言い換え

| 用語 | 日常語での言い換え |
| --- | --- |
| Next.js | Webアプリを作るための道具 |
| Turbopack | 新しい作り方 |
| webpack | 以前から使われている安定した作り方 |
| Cloudflare Workers | 公開先のサーバー |
| bundle | 公開先へ渡すためにまとめたファイル |
| 500 | サーバー側で失敗したという合図 |
| instrumentation | 動きを記録するための補助ファイル |

## Part 2: 技術者レベル

`apps/web` の production build は `NODE_ENV=production next build --webpack` を正本とする。Next.js 16.2.4 の Turbopack default は App Route Handler bundle に `[project]/node_modules/...` virtual specifier を残すケースがあり、`@opennextjs/cloudflare` 1.19.4 の Worker bundle 生成後に Cloudflare runtime が parse fail する。

Local gate は `pnpm --filter @ubm-hyogo/web typecheck`, `lint`, `build:cloudflare`, `.open-next/worker.js` の `[project]/` grep で構成する。webpack 経路では `.next/server/instrumentation.js` が生成されないため、`scripts/patch-next-standalone-instrumentation.mjs` はファイル未生成時に明示 skip する。`scripts/patch-open-next-worker.mjs` の auth env bridge は維持する。

Staging / production deploy と smoke は Cloudflare mutation を伴うため、Phase 13 G2 / G3 の user approval 後に実行する。

### Contract

| Item | Before | After |
| --- | --- | --- |
| `apps/web` production build | `NODE_ENV=production next build` | `NODE_ENV=production next build --webpack` |
| OpenNext build entry | `apps/web/open-next.config.ts` `buildCommand` runs `pnpm build` | unchanged; `pnpm build` now selects webpack |
| instrumentation copy patch | assumes `.next/server/instrumentation.js` exists | exits 0 with explicit skip log when the file is not emitted |
| runtime deploy / smoke | required for full production verification | user-gated G2/G3; not marked runtime PASS in this cycle |

### API / Command Signatures

```json
{
  "scripts": {
    "build": "NODE_ENV=production next build --webpack",
    "build:cloudflare": "NODE_ENV=production opennextjs-cloudflare build && node ../../scripts/patch-open-next-worker.mjs"
  }
}
```

```ts
// scripts/patch-next-standalone-instrumentation.mjs
const instrumentationFile = "server/instrumentation.js";
if (!existsSync(join(nextDir, instrumentationFile))) {
  console.log("[patch-next-standalone-instrumentation] instrumentation not emitted; skipping");
  process.exit(0);
}
```

### Error Handling / Edge Cases

| Case | Handling |
| --- | --- |
| `.next/server/instrumentation.js` absent | skip with exit 0; OpenNext bundle generation continues |
| `.open-next/worker.js` contains `[project]/` | Phase 11 grep gate fails; runtime deploy must not proceed |
| `build:cloudflare` fails before Worker generation | Phase 8 E-3/E-4 rollback path applies; no deploy |
| staging smoke or tail fails after user approval | production deploy remains blocked; rollback target in Phase 10 applies |

### Parameters / Constants

| Name | Value |
| --- | --- |
| Next.js | `16.2.4` |
| `@opennextjs/cloudflare` | `1.19.4` |
| Builder flag | `--webpack` |
| Bad specifier grep | `grep -E "\\[project\\]/" apps/web/.open-next/worker.js` |
| Staging rollback version | `efc4051e-160b-4c77-93ca-6a5751e952f3` |
| Production rollback version | `e608d54e-37a8-414d-865c-798ebfd71735` |

### Evidence References

| Evidence | Path | Status |
| --- | --- | --- |
| typecheck | `outputs/phase-11/evidence/typecheck.log` | local exit 0 |
| lint | `outputs/phase-11/evidence/lint.log` | local exit 0 |
| OpenNext build | `outputs/phase-11/evidence/build.log` | local exit 0; `Next.js 16.2.4 (webpack)` recorded |
| bad specifier grep | `outputs/phase-11/evidence/grep-gate.log` | exit 1 = expected no match |
| screenshot | N/A | `visualEvidence=NON_VISUAL`; status code, build log, and Worker bundle grep are the evidence |
