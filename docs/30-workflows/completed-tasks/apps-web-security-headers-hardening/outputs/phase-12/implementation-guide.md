# Phase 12: 実装ガイド

## Part 1: 中学生レベル

Web ページを返すときに、ブラウザへ「このページでは危ない機能を使わない」「読み込める通信先はここだけ」というルールを一緒に渡す。画面は変えず、レスポンスヘッダだけを追加する。

## Part 2: 技術者レベル

- `apps/web/src/lib/security-headers.ts` が header 生成の SSOT。
- `apps/web/middleware.ts` が全 route response に `applySecurityHeaders()` を適用。
- CSP は初期 `Content-Security-Policy-Report-Only`。
- `Permissions-Policy` は privacy-sensitive feature を `=()` で無効化し、`browsing-topics` は列挙しない。
- `require-trusted-types-for` / `trusted-types` は出力しない。
