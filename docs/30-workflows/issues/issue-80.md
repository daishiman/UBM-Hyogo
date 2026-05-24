# [#80] [UT-11-ROUTE-TEST-01] 認証ルート・Middleware 統合テスト

## メタ情報

```yaml
issue_number: 80
title: [UT-11-ROUTE-TEST-01] 認証ルート・Middleware 統合テスト
state: OPEN
priority: 中
scale: -
category: 要件
status: -
created_date: 2026-04-27
updated_date: 2026-04-27
url: https://github.com/daishiman/UBM-Hyogo/issues/80
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | - |

---

## 概要

UT-11 で実装した OAuth ルート 3 本と `/admin/*` middleware の全分岐を決定論的にテストする。Google API をモックした状態で phase-04 test matrix（T-01〜T-15）を網羅する。

## 背景

純粋関数のユニットテスト（27件 pass 済み）では検証できない HTTP レイヤーの契約（Cookie 属性・ステータスコード・リダイレクト先・state 不一致時の 400 等）を確認するのが目的。

## スコープ

- `/api/auth/login` redirect URL・PKCE challenge・temp Cookie 属性
- `/api/auth/callback/google` 全終端パス（state 不一致 400 / verifier 欠落 400 / token 失敗 502 / 未検証メール 403 / allowlist miss 403 / 成功 302）
- `/api/auth/logout` session Cookie 失効
- `/admin/*` middleware 未認証・期限切れ JWT リダイレクト
- Node 24.x + `node:test` で実行（追加依存なし）

## 参照

- 仕様書: `docs/30-workflows/unassigned-task/UT-11-ROUTE-TEST-01-auth-route-middleware-integration-tests.md`
- 元タスク: `docs/30-workflows/ut-11-google-oauth-admin-login-flow/`
