# Implementation Guide

## Part 1: 中学生レベルの説明

### 身近なたとえ

学校行事で、当日の係が使う道具だけを小さな箱に詰めて体育館へ持っていく場面を考えます。名簿やマイクは箱に入っているのに、放送係の説明書だけ入れ忘れると、行事は始まっても大事な連絡が流れません。

このタスクの `instrumentation.js` は、その「放送係の説明書」に近い役割です。build という箱詰め作業で説明書が抜けることがあるため、あとから確実に入っているか確認します。

Next.js standalone build は、アプリを動かすために必要なファイルだけをまとめた小さな実行用フォルダを作る仕組みです。

`instrumentation` は、サーバー側で最初に動く監視用の入り口です。ここで Sentry を起動しないと、サーバーで起きたエラーが Sentry に届きません。

今の Next.js / OpenNext の組み合わせでは、`instrumentation.js` が standalone フォルダへ自動で入らないことがあります。そのため、build 後に必要なファイルをコピーする patch script が必要です。

silent failure は、build は成功しているのに実際には監視が動いていない状態です。このタスクは、CI で `instrumentation.js` の存在と中身を確認し、その状態を失敗として検出できるようにします。

### 専門用語セルフチェック

| 用語 | 中学生向けの意味 |
| --- | --- |
| standalone build | アプリを動かすために必要なものだけを集めた実行用フォルダ |
| instrumentation | サーバーが動き始めた時に監視を準備する入り口 |
| Sentry | エラーが起きた時に知らせてくれる監視サービス |
| silent failure | 表面上は成功に見えるが、大事な機能が裏で動いていない失敗 |
| trace file | どの追加ファイルを一緒に運ぶ必要があるかを書いた一覧 |
| CI gate | 変更を通す前に自動で確認する検査 |

## Part 2: 技術者向け

現行 `scripts/patch-next-standalone-instrumentation.mjs` は、`apps/web` を `cwd` として `.next/server/instrumentation.js`、`.map`、`server/instrumentation.js.nft.json`、および trace `files[]` を `.next/standalone/apps/web/.next/` へ copy する。

本タスクの実装方針は、この現行方式を維持し、次の不足を補うことに限定する。

| Concern | Required Change |
| --- | --- |
| cwd safety | `apps/web` 以外からの実行を exit 1 にする |
| verification | `--verify-only` で copy せず standalone artifact を検証する |
| regression | fixture `.next/server` / `.next/standalone` 構造で trace copy を test する |
| CI | `.github/workflows/pr-build-test.yml` の `build-test` job で `@ubm-hyogo/web build:cloudflare` 後に verify step を実行する |
| runbook | Next.js / OpenNext upgrade 時の trace layout 再確認と workaround removal 判定を文書化する |

## Canonical Paths

- Script: `scripts/patch-next-standalone-instrumentation.mjs`
- Source artifact: `apps/web/.next/server/instrumentation.js`
- Trace file: `apps/web/.next/server/instrumentation.js.nft.json`
- Standalone artifact: `apps/web/.next/standalone/apps/web/.next/server/instrumentation.js`
- CI workflow: `.github/workflows/pr-build-test.yml`
- Runbook: `docs/runbooks/next-standalone-instrumentation-patch.md`

## 実装結果サマリ

| 成果物 | path | 状態 |
|--------|------|------|
| patch script 改修 | `scripts/patch-next-standalone-instrumentation.mjs` | cwd guard / `--verify-only` / structured log を追加 |
| regression test | `scripts/__tests__/patch-next-standalone-instrumentation.test.mjs` | TC-01〜TC-07 (9 ケース) を node --test で実装 / 全 PASS |
| CI gate | `.github/workflows/pr-build-test.yml` | `Patch script regression test` / `Build (Cloudflare standalone)` / `verify-web-instrumentation-patch` の 3 step を build-test job に追加 |
| RUN BOOK | `docs/runbooks/next-standalone-instrumentation-patch.md` | 6 章構成（背景 / 責務 / 起動経路 / fail 条件 5 種 / upgrade 追従 / FAQ）|

## CI gate fail 条件 (6 種)

詳細は `docs/runbooks/next-standalone-instrumentation-patch.md` §4 を参照。`--verify-only` モード時の log には `Sentry server instrumentation missing in standalone build artifact` を必ず含める。

## 既知の制限

- `pnpm --filter @ubm-hyogo/web build:cloudflare` は OpenNext/esbuild の `Host version "0.25.4" does not match binary version "0.21.5"` で patch script 到達前に fail する既存 blocker がある。本タスクの追加 node regression はこの blocker に依存しない。
- patch script は env / DSN / token を一切読まない。fork PR でも secret 注入なしで gate が動く。
- `pnpm --filter @ubm-hyogo/web build:cloudflare` のフルローカル証跡は上記 blocker のため CI-side/runtime pending として扱う。今回 cycle の追加 regression は node test で green を確認する。
