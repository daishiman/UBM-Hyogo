# [#83] [UT-11-GOOGLE-VERIFY-01] Google OAuth 実機 Smoke・同意画面検証

## メタ情報

```yaml
issue_number: 83
title: [UT-11-GOOGLE-VERIFY-01] Google OAuth 実機 Smoke・同意画面検証
state: OPEN
priority: 低
scale: -
category: 要件
status: -
created_date: 2026-04-27
updated_date: 2026-04-27
url: https://github.com/daishiman/UBM-Hyogo/issues/83
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | - |
| ステータス | - |

---

## 概要

UT-11 の実装コードはユニットテスト検証済みだが、実際の Google OAuth フローは Google Cloud Console のリダイレクト URI 登録・Cloudflare Secrets 配置・`.dev.vars` 設定が揃わないと動作確認できない。これらの外部リソースを整えた上で AC-1〜AC-13 を実環境で確認し、Phase 11 smoke 証跡を残す。

## 背景

- ローカル・staging・production での redirect URI 登録が必要
- `SESSION_SECRET` / `ADMIN_EMAIL_ALLOWLIST` の Cloudflare Secrets 配置が必要
- 実際の Google OAuth フロー（login → consent → callback → session → logout）の確認が必要

## スコープ

- Google Cloud Console redirect URI 3 環境登録確認（AC-11）
- Cloudflare Secrets 4 種配置確認（AC-12）
- ローカル preview フルフロー smoke（AC-9）
- staging smoke
- 新規管理者追加 runbook の実証（AC-13）

## 参照

- 仕様書: `docs/30-workflows/unassigned-task/UT-11-GOOGLE-VERIFY-01-google-oauth-consent-verification.md`
- runbook: `docs/30-workflows/completed-tasks/ut-11-google-oauth-admin-login-flow/outputs/phase-05/runbook.md`
