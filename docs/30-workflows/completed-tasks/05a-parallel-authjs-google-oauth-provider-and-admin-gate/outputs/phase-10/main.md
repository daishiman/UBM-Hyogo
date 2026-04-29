# Phase 10 — 最終レビュー

## 完了スコープ

1. Auth.js v5 + GoogleProvider 設定（`apps/web/src/lib/auth.ts`）
2. session strategy = JWT (HS256, 24h) の実装と verify helper（`packages/shared/src/auth.ts`）
3. session-resolve endpoint（`apps/api/src/routes/auth/session-resolve.ts`）+ internal-auth middleware
4. UI gate (`apps/web/middleware.ts`)：`/admin/:path*` matcher + `isAdmin === true` 必須
5. API gate (`apps/api/src/middleware/require-admin.ts`)：`requireAuth` / `requireAdmin` の二段
6. 既存 `admin-gate.ts` を `requireSyncAdmin` にリネーム（`adminGate` deprecated alias 維持）
7. 05b との session 共有契約（`SessionJwtClaims` / `GateReason` を shared に集約）

## scope out（以下は本タスクで実装しない）

| # | 内容 | 担当 |
| --- | --- | --- |
| 1 | apps/api の既存 `/admin/*` 13 endpoint への `requireAdmin` 適用 | UI (06) + admin_users seed 整備後の別タスク |
| 2 | Magic Link provider | 05b |
| 3 | `AuthGateState` 5 状態判定 API | 05b |
| 4 | `/login` `/profile` `/admin/*` UI | 06 |
| 5 | Playwright E2E | 08b |
| 6 | audit_log 連携（admin_gate_denied イベント） | 07c |

## 残課題 / 申し送り

| 項目 | 内容 |
| --- | --- |
| R-1 | `/admin/*` への `app.use(requireAdmin)` 適用は別 PR。テストが Bearer SYNC_ADMIN_TOKEN を渡す前提で書かれているため、JWT 経路に切替時に 13 endpoint test を一括書き換える必要あり |
| R-2 | apps/web の Auth.js callback の E2E は OAuth mock が必要（Playwright + msw 等）。08b で実装 |
| R-3 | admin 権限剥奪後 24h は JWT が valid。緊急時は AUTH_SECRET rotate で全 session 無効化（運用ドキュメント別途） |
| R-4 | `INTERNAL_API_BASE_URL` の wrangler.toml への追記は infra (04) との配線依存のため別 PR |

## 4 条件再評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | session 構造 + admin gate が UI/API 両方で確定、05b と共有可能 |
| 実現性 | PASS | typecheck/lint/test 全て pass、既存 476 件壊さず新規 23 件追加 |
| 整合性 | PASS | 不変条件 #5/#7/#9/#10/#11 全て satisfy、05b 設計と endpoint 共有 |
| 運用性 | PASS | secrets はリポジトリに不在、`scripts/cf.sh` 経路、JWT 24h で D1 row 増無し |

## 検証コマンド再掲

```
mise exec -- pnpm typecheck    # pass
mise exec -- pnpm lint         # pass (lint-boundaries + tsc)
mise exec -- pnpm test         # 59 / 59 targeted pass
```
