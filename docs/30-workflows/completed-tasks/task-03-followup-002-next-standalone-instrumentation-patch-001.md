# task-03-followup-002-next-standalone-instrumentation-patch-001 - Next standalone instrumentation patch script regression hardening

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | task-03-followup-002-next-standalone-instrumentation-patch-001 |
| タスク名 | Next.js standalone instrumentation copy patch の build pipeline 恒常化と regression test 化 |
| 分類 | infrastructure / build / observability |
| 優先度 | 中 |
| ステータス | 未実施 |
| 発見元 | task-03-w2-par-sentry-workers-sdk-unify 実装中に追加された `scripts/patch-next-standalone-instrumentation.mjs` と `apps/web/open-next.config.ts` 連携 |
| 発見日 | 2026-05-07 |
| 親タスク | task-03-w2-par-sentry-workers-sdk-unify |

## Why

task-03 実装で、Next.js 15 の `instrumentation.ts` を OpenNext Cloudflare build の `.next/standalone/apps/web/.next/server/` に物理 copy するための ad-hoc patch スクリプト `scripts/patch-next-standalone-instrumentation.mjs` を導入した。これは `pnpm build` が Next standalone bundler に instrumentation を含めない仕様に対する workaround であり、現状は `apps/web/open-next.config.ts` の `buildCommand` に直接埋め込まれている。Next.js / OpenNext のバージョン更新で `.nft.json` のスキーマ変化や trace 解決ロジックが変わった場合に sentry init が無音で消える退行が発生し、Phase 11 の `grep-gate.log` だけでは検出できない。

## What

- `scripts/patch-next-standalone-instrumentation.mjs` の責務（`server/instrumentation.js` / `*.map` / `*.nft.json` + trace 内ファイルの copy）と前提（`.next/standalone/apps/web/.next/` レイアウト）を `docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify/outputs/phase-12/implementation-guide.md` に追記する。
- patch 実行後の `.next/standalone/apps/web/.next/server/instrumentation.js` 存在確認と、その中に `@sentry/cloudflare` 由来の register が含まれることを assert する Vitest / Node script regression test を `apps/web/scripts/__tests__/patch-next-standalone-instrumentation.test.ts`（または相当）に追加する。
- CI workflow（`.github/workflows/` 配下の web build job）に `pnpm --filter @ubm-hyogo/web build:cloudflare` 後の上記 assert を組み込み、Next.js / OpenNext バージョンアップ時に必ず緑になることを gate 化する。
- patch script の入出力境界（`appDir`, `nextDir`, `standaloneNextDir`, `traceFile`）を引数化し、ハードコードされた相対パスを排除して monorepo root 移動に強くする。
- patch script が依拠する `.nft.json` schema 変更 / Next.js upstream の standalone instrumentation 公式サポート開始に追従する RUN BOOK を `docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify/outputs/phase-12/cursor-runbook.md`（または新規 runbook）に残す。

## 苦戦箇所【記入必須】

- Next.js standalone build は `instrumentation.ts` を `.next/standalone/apps/web/.next/server/instrumentation.js` に自動 copy しない（`server/instrumentation.js.nft.json` だけを含める）ため、OpenNext Cloudflare worker bundler が runtime register を解決できない。発見当初は build log にエラーが出ず、Sentry dashboard に server event が届かないだけの silent failure だった。
- `.nft.json` の `files` 配列に列挙される相対パスは `server/` 起点と `node_modules/` 起点が混在し、単純に `copyFileSync` ではディレクトリ未作成エラーが発生する。`mkdirSync(dirname(target), { recursive: true })` の両側適用が必要だが、これも標準 Next docs には載っていない。
- `pnpm build && node ../../scripts/patch-next-standalone-instrumentation.mjs` を `open-next.config.ts` の `buildCommand` に埋め込んだ結果、CI 上では `cwd` が `apps/web` になることに依存しており、worktree root から直接実行すると path が破綻する。runbook で「常に `pnpm --filter @ubm-hyogo/web build:cloudflare` 経由で実行」と明示しないと再現できない。

## スコープ

含む:
- patch script の責務 / 入出力境界の文書化
- regression test（standalone build 後 instrumentation.js が存在し sentry register を含む）
- CI gate 組み込み
- Next.js / OpenNext upstream 追従 RUN BOOK

含まない:
- Next.js / OpenNext upstream への PR 提出
- `apps/api` 側 instrumentation patch（apps/api には instrumentation.ts なし）
- Sentry Webpack plugin 設定変更

## リスクと対策

| リスク | 対策 |
|--------|------|
| Next.js / OpenNext のバージョンアップで `.nft.json` スキーマが変化し silent failure | regression test で `instrumentation.js` 存在 + register 文字列を assert |
| `cwd` 依存で worktree 直叩き失敗 | patch script を引数化し、`open-next.config.ts` の `buildCommand` 文字列に絶対パス解決 helper を追加 |
| Next.js 公式が standalone instrumentation を解消した時の dead code 化 | upstream changelog 追従 SOP を runbook 化、解消版に到達したら patch script 削除タスクを起票 |

## 検証方法

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
test -f apps/web/.next/standalone/apps/web/.next/server/instrumentation.js
mise exec -- pnpm --filter @ubm-hyogo/web exec rg '@sentry/cloudflare' \
  apps/web/.next/standalone/apps/web/.next/server/instrumentation.js
```

## 完了条件

- [ ] `scripts/patch-next-standalone-instrumentation.mjs` の責務 / 入出力境界が implementation-guide.md に追記済み
- [ ] standalone build 後の `instrumentation.js` 存在 + sentry register 含有を assert する regression test が CI で実行される
- [ ] CI gate が web build job に組み込まれ、欠落時に fail する
- [ ] Next.js / OpenNext upstream 追従 RUN BOOK が `outputs/phase-12/` または専用 runbook に追加済み
- [ ] patch script の `cwd` 前提が runbook で明示され、worktree 直叩き時の安全策が文書化済み

## 参照

- `scripts/patch-next-standalone-instrumentation.mjs`
- `apps/web/open-next.config.ts`
- `docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify/phase-11.md`
