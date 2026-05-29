# Phase 12 Implementation Guide

## Part 1: 中学生レベル説明

Web 側から API 側へ連絡するとき、外の住所へ回り道すると staging では 404 になることがあった。そこで Cloudflare Workers の中にある専用連絡口 `API_SERVICE` を先に使うようにした。テスト中は今まで通り mock の `fetch` を使うので、既存テストは壊れない。

## Part 2: 技術者向け

- `fetchAdmin()` の signature は維持。
- `getPublicFetchEnv()` 経由で `API_SERVICE` と runtime flag を取得し、production/staging では `binding.fetch.bind(binding)` を優先。
- `NODE_ENV=test` または `PLAYWRIGHT_TEST=1` では global `fetch` を維持し、server-side fetch mock と既存 Playwright fixture を破壊しない。
- `x-internal-auth` / `cookie` / JSON body / error body snippet は既存契約を維持。

## Verification

- Focused Vitest: 3 files / 9 tests PASS.
- Staging runtime smoke is user-gated.
