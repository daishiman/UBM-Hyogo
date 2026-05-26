---
phase: 4
title: Data Contract
workflow_id: issue-901-authenticated-profile-admin-staging-visual
status: spec_created
---

# Phase 4 — Data Contract

[実装区分: 実装仕様書]

## 1. session JWT claims schema (HS256)

```ts
// packages/shared 既存 signSessionJwt の入力 = 本タスクで mint する claim
const SessionClaims = z.object({
  sub: z.string().min(1),               // memberId（admin の場合も同 memberId）
  email: z.string().email(),            // member email / admin email
  isAdmin: z.boolean(),                 // admin_users.active=true で true、それ以外 false
  iat: z.number().int().positive(),     // mint 時の epoch sec
  exp: z.number().int().positive(),     // iat + 600
  iss: z.literal('ubm-hyogo-staging').optional(),
  aud: z.literal('ubm-hyogo-web').optional(),
});
```

## 2. cookie schema（Playwright storageState 互換）

```ts
const AuthCookie = z.object({
  name: z.literal('authjs.session-token'),
  value: z.string().min(20),            // signed JWT
  domain: z.string().min(1),            // STAGING_WORKER_HOST (no scheme, no path)
  path: z.literal('/'),
  expires: z.number().int().positive(), // iat + 600 (epoch sec, Playwright 形式)
  httpOnly: z.literal(true),
  secure: z.literal(true),
  sameSite: z.literal('Lax'),
});
```

> Auth.js v5 (`next-auth`) は本番 `__Secure-` prefix を付ける場合があるため、staging Worker の cookie 名規約を Phase 5 で再確認し、不一致なら `__Secure-authjs.session-token` を採用する。Phase 10 §3 で `bash scripts/cf.sh tail` の Set-Cookie を一次根拠として確定する。

## 3. storageState JSON schema（Playwright 仕様）

```ts
const StorageState = z.object({
  cookies: z.array(AuthCookie).min(1),
  origins: z.array(z.unknown()).optional(),
});
```

## 4. CLI 引数契約

```
mint-staging-storage-state.ts
  --role=member|admin       (必須)
  --out=<absolute path>     (必須)
  --ttl-sec=<number>        (任意・既定 600)
  --dry-run                 (任意・ファイル書き出しせず schema 検証のみ)
```

## 5. env 契約

| env | 必須 | 用途 | 取扱 |
|---|---|---|---|
| `STAGING_AUTH_SECRET` | ✅ | HS256 sign key（`apps/web` / `apps/api` 同値） | log 非出力・GitHub Secrets |
| `STAGING_ADMIN_MEMBER_ID` | ✅ | admin role の `sub` claim | log 非出力 |
| `STAGING_ADMIN_EMAIL` | ✅ | admin role の `email` claim | log 非出力 |
| `STAGING_ME_MEMBER_ID` | ✅ | member role の `sub` claim | log 非出力 |
| `STAGING_ME_EMAIL` | ✅ | member role の `email` claim | log 非出力 |
| `STAGING_WORKER_HOST` | ✅ | cookie domain（例: `ubm-hyogo-web-staging.daishimanju.workers.dev`） | 値は OK・URL scheme 不要 |
| `PLAYWRIGHT_STAGING_BASE_URL` | ✅ | Playwright `use.baseURL` | scheme 付与（`https://...`） |

## 6. screenshot baseline 命名契約

| 種別 | パス |
|---|---|
| profile authenticated | `apps/web/playwright/tests/visual-staging-authenticated/profile-authenticated.spec.ts-snapshots/<arg>-authenticated-staging-visual-chromium-linux.png` |
| admin dashboard authenticated | `apps/web/playwright/tests/visual-staging-authenticated/admin-dashboard-authenticated.spec.ts-snapshots/<arg>-authenticated-staging-visual-chromium-linux.png` |
| evidence inventory | `outputs/phase-11/screenshots/profile-authenticated.png` / `admin-dashboard-authenticated.png`（baseline からの copy） |

## 7. artifacts.json contract（本ファイル）

`metadata.gates[]` は Gate-A/B/C を `pending` 初期値で持ち、`evidence_path` は `gate-metadata:validate` の実装に合わせて repo root 相対。`expected_runtime_screenshots` は §6 inventory 2 件。`spec_creation_strategy` は `optimize_to_current_codebase` 固定。

## 8. cross-ref 契約

| 参照元 | 参照先 | 形式 |
|---|---|---|
| 本 workflow `index.md` | proto-spec / 親 workflow | 相対パス link |
| proto-spec consumed pointer | 本 workflow root | YAML frontmatter `canonical_workflow:` |
| 親 workflow `phase-09-risks.md` §5 | 本 workflow root | inline cross-ref + R-03 解消明記 |
| 親 workflow `phase-13-commit-pr-draft.md` §7 | 本 workflow root | inline cross-ref + フォロー消化明記 |
