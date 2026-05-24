# [#862] [fix-admin-scr-err-stg-FU-001] apps/web/src/auth.ts の env 参照を getEnv() 経由に統一

## メタ情報

```yaml
issue_number: 862
title: [fix-admin-scr-err-stg-FU-001] apps/web/src/auth.ts の env 参照を getEnv() 経由に統一
state: OPEN
priority: 中
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-05-23
updated_date: 2026-05-23
url: https://github.com/daishiman/UBM-Hyogo/issues/862
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

`apps/web/src/auth.ts` 内に残存する `process.env.*` および `getCloudflareContext().env.*` 直接参照を、CLAUDE.md「apps/web env アクセス不変条件」に従い `getEnv()` 経由に統一する。

## 親タスク / PR

- 親 task: `TASK-FIX-ADMIN-SCR-ERR-STG-001`
- 親 PR: #849 (branch `fix/admin-server-components-render-error`)
- 親 workflow: `docs/30-workflows/fix-admin-server-components-render-error-stg/`

## 背景

親タスクで Cloudflare Workers staging `/admin` の Server Components render error (digest=167275886) を `apps/web/src/lib/admin/server-fetch.ts` 修正で解消したが、`auth.ts` は env 参照 3 経路混在のまま残存。同型 regression が認証境界で再発するリスクがある。

## スコープ

- `auth.ts` 内 env 参照を `getEnv()` 経由に置換
- `EnvSchema` に `AUTH_SECRET` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `INTERNAL_AUTH_SECRET` 等が網羅されていることを確認
- zod parse 失敗時の throw を error boundary に伝播させる設計を維持
- 関連 unit test の mock env 統一

## 受け入れ条件 (DoD 抜粋)

- AC-1: `auth.ts` 配下に `process.env.` 直接参照 0 件
- AC-2: `getCloudflareContext().env.` 直接参照 0 件
- AC-3: 全 env 参照が `getEnv()` 戻り値経由
- AC-5: `pnpm typecheck` / `pnpm lint` pass
- AC-6: staging `/login` → OAuth/Magic Link → `/admin` runtime smoke pass

## 仕様書

`docs/30-workflows/unassigned-task/fix-admin-scr-err-stg-followup-001-auth-env-via-getenv-migration.md`

## 関連

- CLAUDE.md「apps/web env アクセス不変条件 (task-02 wrangler-env-injection)」
- followup-003 (CI gate 化) と runtime smoke で連携可能
