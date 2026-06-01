# Lessons Learned: issue-1027 member dynamic OG Worker split

Issue #1027 implemented member-specific dynamic OG PNGs by splitting generation into `apps/og` instead of restoring `next/og` to the main `apps/web` OpenNext Worker.

## L-I1027-001: Architecture fork requires a user decision before Phase 2

Paid plan vs dedicated Worker split changes cost, deployment topology, CI gates, and runtime ownership. When a task contains this kind of product/infra fork, Phase 1 must record the user decision before design and implementation proceed.

## L-I1027-002: Cloudflare Worker size budget is per deployed Worker bundle

The Free plan 3MiB gzip limit applies to each Worker bundle. Moving dynamic OG generation out of `apps/web` is valid only if `apps/og` has its own size gate and `apps/web` keeps `next/og` / `ImageResponse` out of its bundle.

## L-I1027-003: Public metadata env vars still need accessor discipline

`OG_IMAGE_BASE_URL` is optional and public, but direct `process.env` reads in metadata helpers would bypass schema and drift checks. Public metadata values belong behind `getPublicEnv()`.

## L-I1027-004: OG Worker data fetch should prefer Service Binding

`apps/og` reads existing public member data and should use `API_SERVICE` first in Cloudflare runtime, with `PUBLIC_API_BASE_URL` only as local/test fallback. This avoids same-account `workers.dev` loopback assumptions.

## L-I1027-005: Crawler-facing OG generation must fail soft

Unknown members, upstream API errors, and partial member fields should return a valid default PNG instead of a failing crawler response. Runtime evidence should verify both named and default image paths.

## L-I1027-006: Follow-up consumed state must be synchronized same-wave

The source unassigned task is no longer open after the Worker split implementation. It must carry `status: consumed`, a canonical workflow pointer, local evidence summary, and user-gated runtime boundary in the same close-out wave.

## L-I1027-007: 新規 workspace package は aggregate coverage-gate に明示配線しないと CI が MISSING で fail する

`apps/og` を新規 workspace package として追加した際、`scripts/coverage-guard.sh` の集約モード (`--no-run`) は `discover_packages` が `apps/*` / `packages/*` を機械列挙するため、**`apps/og/package.json` が存在した瞬間に判定対象へ自動で含まれる**。しかし CI の `coverage-gate-shard` matrix (`.github/workflows/ci.yml`) は `[web, api-unit, api-d1, packages]` 固定で og shard を持たず、`apps/og/coverage/coverage-summary.json` が生成・upload されない。結果として shard は全 success なのに aggregate `coverage-gate` ジョブだけが `MISSING: apps/og/coverage/coverage-summary.json` で exit 1 になる（merge commit 直後の dev 同期 push で顕在化）。

対処は4点を**同一コミットで**揃える:
1. `apps/og/package.json` に `test:coverage`（`--coverage.reportsDirectory=apps/og/coverage` + `--coverage.include="apps/og/src/**"`）を追加
2. `scripts/coverage-guard.sh` の `--group` 検証 enum・`run_group`・`group_summary_paths` の3箇所に `og` を追加
3. `.github/workflows/ci.yml` の matrix を `[web, api-unit, api-d1, packages, og]` へ拡張（upload-artifact の path は `apps/*/coverage/` で og を自動捕捉済み）
4. coverage が 80% threshold を満たすこと（下記 L-I1027-008）

教訓: 新規 package 追加は「テストが通る」だけでは不十分で、**aggregate gate が機械列挙する集合と shard が生成する集合の差分**を必ず埋める。`discover_packages` が自動で広がる側、shard matrix が手動固定の側、という非対称が罠。

## L-I1027-008: Workers ランタイム専用コードは `v8 ignore` で除外し、純粋ロジックは抽出して unit test する

`apps/og/src/render.tsx` の `workers-og` (`ImageResponse` / `loadGoogleFont`) は Cloudflare Workers ランタイム (HTMLRewriter/Satori) 依存で Node/jsdom テスト環境では実行不能なため、初期実装では render.tsx の lines カバレッジが 49% に留まり 80% gate を割る。

正攻法は「テスト不能領域を除外」と「テスト可能ロジックを直接テスト」の両輪:
- HTML 組成の純粋関数 (`buildHtml` / `tagLine` / `escapeHtml`) を **export** して直接 unit test（escape/タグ結合/フォールバック分岐を網羅）
- `imageResponse` の `HTMLRewriter` 不在 early-return より後の workers-og ブロックのみ `/* v8 ignore start */ … /* v8 ignore stop */` で除外し、**除外理由をコメントに明記**（coverage-guard の HINT「テスト不能領域は exclude に追加 (要レビュー)」に準拠）
- ルータ (`index.ts`) の `catch` フォールバック分岐は render を throw させる mock テストで網羅

結果 render.tsx 98.38% / og 全体 99.35% lines・96.49% branch へ到達。`v8 ignore` で握り潰すのは「ランタイム依存で原理的にテスト不能」な箇所に限定し、純粋ロジックまで除外しないこと。
