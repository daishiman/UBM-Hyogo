---
workflow_id: issue-901-authenticated-profile-admin-staging-visual
phase: 12
task: system-spec-update-summary
status: present
---

# System Spec Update Summary

## 1. `docs/00-getting-started-manual/specs/` への更新

| spec | 更新有無 | 理由 |
| --- | --- | --- |
| `13-mvp-auth.md`（MVP 認証方針 / session JWT 構造 / admin gate） | **更新なし** | 本タスクは既存 spec の **claim 構造 / TTL=600s / admin gate (`admin_users.active`) / cookie name 規約**を変更せず再利用するのみ。spec の正本性に変更は加えない |
| `02-auth.md`（Magic Link / Google OAuth 設計） | **更新なし** | 認証フロー自体は変更しない。本タスクは visual baseline 取得のための storageState mint であり、production 認証経路は無関係 |
| `08-free-database.md`（D1 構成） | **更新なし** | D1 schema 変更 0 件 |
| `01-api-schema.md`（フォーム / API） | **更新なし** | 新規 endpoint / フォーム変更 0 件 |

## 2. CLAUDE.md / 不変条件への影響

| 不変条件 | 影響 |
| --- | --- |
| apps/web env アクセス不変条件（task-02 / `getAuthEnv()`） | **整合**: mint CLI は `apps/web/src/` 配下ではなく `apps/web/playwright/scripts/` 配下。`apps/web` ランタイム env access の不変条件は対象外。CI 内 env 直接読みは Playwright script のため許容 |
| UI prototype alignment 不変条件 #1（新規 API endpoint / D1 schema 変更禁止） | **整合**: 0 件 |
| UI prototype alignment 不変条件 #4（D1 直接アクセス禁止） | **整合**: spec / mint CLI から D1 直接アクセスなし |
| シークレット管理（平文 `.env` 禁止） | **整合**: 1Password 経由 `op run` で env 注入 / GitHub Secrets で CI 側注入 |
| Cloudflare CLI 実行ルール（`scripts/cf.sh` 経由） | **整合**: `wrangler` 直接実行なし（Phase 10 §1-3 全て `scripts/cf.sh` 経由） |
| test ファイル命名（`*.spec.ts` のみ） | **整合**: 新規 test 全て `.spec.ts` |

## 3. 結論

本タスクは spec / 不変条件への変更を **0 件** で完結する。既存仕様の再利用のみで認証後 staging visual baseline を確立する。
