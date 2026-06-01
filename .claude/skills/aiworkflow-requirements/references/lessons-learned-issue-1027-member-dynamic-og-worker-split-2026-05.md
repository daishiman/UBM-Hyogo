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
