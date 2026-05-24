# [#81] [UT-11-API-AUTH-01] API 管理者セッション消費契約

## メタ情報

```yaml
issue_number: 81
title: [UT-11-API-AUTH-01] API 管理者セッション消費契約
state: OPEN
priority: 中
scale: -
category: 要件
status: -
created_date: 2026-04-27
updated_date: 2026-04-27
url: https://github.com/daishiman/UBM-Hyogo/issues/81
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | - |

---

## 概要

UT-11 は `apps/web` の admin gate（Next.js Middleware）で `/admin/*` を保護した。`apps/api`（Hono Workers）が管理者専用 API エンドポイントを提供する際に、`admin_session` JWT Cookie をどう検証するかの境界を確定し実装する。

## 背景

現状は `apps/web` middleware で `/admin/*` が保護されているが、`apps/api` 側の privileged エンドポイント保護は未定義。将来的に会員管理 API などを実装する際に認可の穴が生じる可能性がある。

## スコープ

- `apps/web` middleware と `apps/api` 認可の責務分離設計
- `apps/api` 認可方式の選定と実装（Hono middleware / guard）
- 期限切れ・改ざん・非 admin・Cookie 欠落のテスト
- staging / production の Cookie / CORS ドメイン設定

## 参照

- 仕様書: `docs/30-workflows/unassigned-task/UT-11-API-AUTH-01-api-admin-session-consumption.md`
- 元タスク: `docs/30-workflows/ut-11-google-oauth-admin-login-flow/`
