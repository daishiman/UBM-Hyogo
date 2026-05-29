# Phase 2: Basic Design

## Transport Selection

`fetchAdmin()` keeps its public signature and existing fixture early returns. After fixtures, it builds a single `RequestInit` and chooses transport:

- service binding: `getAdminFetchEnv().API_SERVICE.fetch("https://service-binding.local${path}", init)`
- HTTP fallback: `fetch("${resolveApiBase()}${path}", init)`

The placeholder host is only for URL parsing; Cloudflare routes the request through the service binding.

## Environment Access

Admin fetch reads runtime values through `getAdminFetchEnv()` / `getEnv()` from `apps/web/src/lib/env.ts`. Direct `process.env` usage remains limited to existing Playwright fixture guards.

## Test Design Link

Focused tests cover service binding priority, HTTP fallback, header/body parity, and CF 1042 body propagation.
