# Phase 8 — セキュリティ / 認可境界

## 1. 認可マトリクス

| role | `/admin/identity-conflicts` 直接遷移 | API 期待応答 | UI 期待挙動 |
|------|--------------------------------------|-------------|------------|
| admin | 200 | 200 list | 一覧表示 / merge / dismiss UI 操作可能 |
| member | 403 | 403 | admin layout 内 403 表示 or `/profile` redirect。admin 専用要素は不可視 |
| anonymous | redirect | 401 | `page.url()` が `/login` を含む |

## 2. 検証 test

- test 5: `memberPage` で `/admin/identity-conflicts` に直接遷移し、API 403 / UI 上 admin 専用要素が不可視であることを確認
- test 6: `anonymousPage` で同 URL に遷移し、`page.url()` が `/login` を含むことを確認

## 3. シークレット衛生

| 項目 | 方針 |
|------|------|
| API token / secret | spec / fixture / response mock に一切含めない |
| session cookie | fixture (`signSession()`) 経由のみ。直接 set 禁止 |
| 個人情報 | mock fixture 内の `displayName` は架空名で固定 |

## 4. 不変条件チェック（CLAUDE.md UI alignment）

| # | 不変条件 | 本 spec での遵守 |
|---|---------|------------------|
| 1 | 既存 API endpoint surface のみ利用 | GET 38 / merge 54 / dismiss 91 + `/admin/members/:id` のみ mock |
| 2 | OKLch トークン正本化 | selector で色値・`bg-[#xxx]` 依存しない |
| 3 | プロトタイプ正本順位 | 新 primitive を生成せず、既存 primitive の semantics に対して assert |
| 4 | D1 直接アクセス禁止 | `page.route()` mock のみ |
| 5 | 新規 fixture 禁止 | `auth.ts` の既存 3 fixture import のみ |
