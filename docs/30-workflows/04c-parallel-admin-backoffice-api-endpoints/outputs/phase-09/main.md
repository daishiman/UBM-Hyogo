# Phase 9 — 品質保証

## free-tier 見積もり（D1）

前提: 管理者数 1〜3 名、admin 操作頻度は 100 ops/day 以下。

| endpoint | 1 call の reads | 1 call の writes | 想定/day | reads/day | writes/day |
|---|---|---|---|---|---|
| GET /admin/dashboard | 5（COUNT 4 + recent10 1） | 0 | 30 | 150 | 0 |
| GET /admin/members | 1 | 0 | 30 | 30 | 0 |
| GET /admin/members/:id | 6（identity, status, response, sections, fields, audit） | 0 | 30 | 180 | 0 |
| PATCH status | 1 | 2（status + audit） | 5 | 5 | 10 |
| POST/PATCH notes | 1 | 2 | 5 | 5 | 10 |
| POST delete/restore | 1 | 3 | 1 | 1 | 3 |
| GET /admin/tags/queue | 1 | 0 | 10 | 10 | 0 |
| POST tags resolve | 2（queue + reviewing 経由） | 3 | 5 | 10 | 15 |
| GET schema/diff | 1 | 0 | 5 | 5 | 0 |
| POST schema/aliases | 2 | 3 | 2 | 4 | 6 |
| GET meetings | 1 | 0 | 5 | 5 | 0 |
| POST meetings | 0 | 2 | 1 | 0 | 2 |
| POST attendance | 2 | 2 | 10 | 20 | 20 |
| DELETE attendance | 0 | 2 | 2 | 0 | 4 |
| sync trigger | 既存 | 既存 | 既存 | - | - |
| **合計（admin 起点）** | | | | **425 reads** | **70 writes** |

D1 free tier: 5GB / 500k reads / 100k writes per day。**余裕（< 0.1% 消費）**。

## CPU / wall time

各 handler は単純 SELECT / INSERT で < 5ms 想定。Cloudflare Workers の 10ms CPU / 30s wall に余裕。dashboard だけ COUNT 4 + recent10 で ~10ms 想定だが許容内。

## ロギング

- 既存 `apps/api/src/middleware/error-handler.ts` が catch する
- audit_log で who/what/when/target を残すため、別途 console.log は不要

## セキュリティ

- adminGate は Bearer 一致のみ。本番では 05a で Auth.js セッション + admin_users 照合に差し替え予定（本タスクで scope 外）
- 403 body に target を含めない（memberId 露出ゼロ）
- zod parse 失敗は generic `"invalid_input"` のみ返却（内部 schema 漏洩なし）
