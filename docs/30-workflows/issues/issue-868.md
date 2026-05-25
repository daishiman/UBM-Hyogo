# [#868] [AWSHH-FU-003] Reporting-Endpoints / Report-To による CSP 違反収集集約

## メタ情報

```yaml
issue_number: 868
title: [AWSHH-FU-003] Reporting-Endpoints / Report-To による CSP 違反収集集約
state: OPEN
priority: 中
scale: -
category: セキュリティ
status: -
created_date: 2026-05-23
updated_date: 2026-05-23
url: https://github.com/daishiman/UBM-Hyogo/issues/868
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | - |

---

## 概要

`Reporting-Endpoints` ヘッダと CSP `report-to` ディレクティブを設定し、CSP 違反レポートを集約する。

## 背景

現状の CSP report-only は `report-uri` / `report-to` 未設定のため違反が観測できない。AWSHH-FU-001 (enforce 切替) を安全に行うには observability 基盤が前提。

## スコープ

- `apps/web/src/lib/security-headers.ts` に Reporting-Endpoints / report-to 追加
- 受信 endpoint 方針合意 (内製 apps/api or Sentry / Datadog 等)
- retention / privacy ポリシー
- 受信側実装 (採用方式により別タスク化)

## 前提条件

- 観測性設計 wave での endpoint 方針合意

## 仕様書

- `docs/30-workflows/unassigned-task/awshh-followup-003-reporting-endpoints.md`
- `docs/30-workflows/apps-web-security-headers-hardening/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/apps-web-security-headers-hardening/outputs/phase-12/unassigned-task-detection.md` (U-AWSHH-003)
