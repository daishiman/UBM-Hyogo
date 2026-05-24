# [#871] [AWSHH-FU-002] CSP nonce 化 ('unsafe-inline' 削除)

## メタ情報

```yaml
issue_number: 871
title: [AWSHH-FU-002] CSP nonce 化 ('unsafe-inline' 削除)
state: OPEN
priority: 中
scale: -
category: セキュリティ
status: -
created_date: 2026-05-23
updated_date: 2026-05-23
url: https://github.com/daishiman/UBM-Hyogo/issues/871
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | - |

---

## 概要

現状の CSP に含まれる `script-src 'self' 'unsafe-inline'` / `style-src 'self' 'unsafe-inline'` から `'unsafe-inline'` を削除し、Next.js の nonce-based CSP に移行する。

## 背景

`'unsafe-inline'` は XSS 防御を著しく弱める。Next.js 16 + App Router + OpenNext Workers での nonce 配信は middleware で request 毎に nonce を生成し response header と inline script 双方に注入する設計が必要。

## スコープ

- `apps/web/next.config.ts` nonce 発行
- `apps/web/src/lib/security-headers.ts` の `buildCspDirective` を nonce 対応
- middleware.ts での nonce 伝播
- App Router server/client 境界での context 伝播
- 全画面 smoke

## 前提条件

- AWSHH-FU-001 (CSP enforce 切替) 完了推奨

## 仕様書

- `docs/30-workflows/unassigned-task/awshh-followup-002-csp-nonce-migration.md`
- `docs/30-workflows/apps-web-security-headers-hardening/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/apps-web-security-headers-hardening/outputs/phase-12/unassigned-task-detection.md` (U-AWSHH-002)
