# Phase 12 — main

本ワークフローは `admin-ui-prototype-alignment` followup-001 として、`/admin/members` の (a) プロトタイプ準拠化 + (b) `ADMIN_FETCH_404` root cause 修正を 1 サイクル内で完遂する実装仕様書である。

## scope summary

- /admin/members 一覧 + drawer のプロトタイプ準拠化
- ADMIN_FETCH_404 の 4 仮説切り分け + 修正
- adapter additive 拡張（既存 endpoint のレスポンスから occupation / zone / membershipType / tags / updatedAt / hue を派生）
- vitest unit + playwright visual baseline spec の追加
- strict 7 output + aiworkflow-requirements skill 同期

## workflow_state

`spec_created` — 実装着手は user 承認後。
