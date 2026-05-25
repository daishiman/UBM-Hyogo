# [#869] [AWSHH-FU-001] CSP report-only → enforce 切替

## メタ情報

```yaml
issue_number: 869
title: [AWSHH-FU-001] CSP report-only → enforce 切替
state: OPEN
priority: 高
scale: -
category: セキュリティ
status: -
created_date: 2026-05-23
updated_date: 2026-05-23
url: https://github.com/daishiman/UBM-Hyogo/issues/869
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 高 |
| 規模 | - |
| ステータス | - |

---

## 概要

`apps/web` で `report-only` モード導入済みの CSP を、staging / production の違反レポート観測後に `enforce` (`Content-Security-Policy`) に切り替える。

## 背景

PR #(apps-web-security-headers-hardening) で CSP を `Content-Security-Policy-Report-Only` として導入。production 互換性観測後の enforce 切替が必須。

## スコープ

- `apps/web/src/lib/security-headers.ts` の `SecurityHeaderConfig.cspMode` 切替
- `apps/web/middleware.ts` の env-driven 設定
- Playwright smoke の header 名検証更新

## 前提条件

- staging / production で 1〜2 週間 report-only モードで違反収集
- 関連: AWSHH-FU-003 (Reporting-Endpoints 集約) 先行推奨

## 仕様書

- `docs/30-workflows/unassigned-task/awshh-followup-001-csp-enforce-cutover.md`
- `docs/30-workflows/apps-web-security-headers-hardening/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/apps-web-security-headers-hardening/outputs/phase-12/unassigned-task-detection.md` (U-AWSHH-001)
