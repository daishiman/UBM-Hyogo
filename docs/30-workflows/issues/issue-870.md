# [#870] [AWSHH-FU-004] apps/api Workers レスポンスヘッダ hardening

## メタ情報

```yaml
issue_number: 870
title: [AWSHH-FU-004] apps/api Workers レスポンスヘッダ hardening
state: OPEN
priority: 中
scale: -
category: セキュリティ
status: -
created_date: 2026-05-23
updated_date: 2026-05-23
url: https://github.com/daishiman/UBM-Hyogo/issues/870
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | - |

---

## 概要

`apps/api` (Hono on Cloudflare Workers) に API 用セキュリティヘッダを追加する。`apps/web` と独立した surface のため別 workflow として実施。

## 背景

今 cycle の hardening は `apps/web` 局所スコープ。API レスポンス用ヘッダは未整備。

## スコープ

- `apps/api/src/middleware/security-headers.ts` 新規
- `hono.use` での全 route 適用
- `X-Content-Type-Options: nosniff` / `Strict-Transport-Security` / `Referrer-Policy: no-referrer` / `Cache-Control` 適正化
- CORS Origin allowlist 厳格化 (staging / production env 分離)
- vitest unit

## 仕様書

- `docs/30-workflows/unassigned-task/awshh-followup-004-apps-api-security-headers.md`
- `docs/30-workflows/apps-web-security-headers-hardening/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/apps-web-security-headers-hardening/outputs/phase-12/unassigned-task-detection.md` (U-AWSHH-004)
