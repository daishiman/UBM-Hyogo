# Phase 8: DRY 化 — 06b-followup-002-parallel-me-api-authjs-session-resolver

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-followup-002-parallel-me-api-authjs-session-resolver |
| phase | 8 / 13 |
| wave | 06b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

重複手順、重複設定、重複責務を削減する。

## 実行タスク

1. 参照資料と該当ソースを確認する。完了条件: 接続漏れの境界が記録される。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC と evidence path が対応する。
3. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作が明記される。

## 参照資料

- apps/api/src/index.ts
- apps/api/src/routes/me/index.ts
- apps/api/src/middleware/session-guard.ts
- apps/api/src/middleware/require-admin.ts
- packages/shared/src/auth.ts
- apps/web/src/lib/fetch/authed.ts
- apps/web/app/profile/page.tsx

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/06b-followup-002-parallel-me-api-authjs-session-resolver/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 05a Auth.js Google OAuth session JWT, 05b Magic Link callback follow-up, 04b /me route implementation, AUTH_SECRET shared between apps/web and apps/api
- 下流: 06b logged-in profile visual evidence, 08b profile/auth E2E, 09a staging authenticated smoke

## 多角的チェック観点

- #5 apps/web D1 direct access forbidden
- #7 memberId/responseId separation
- #11 profile SSR auth gate
- #15 Auth session boundary
- 未実装/未実測を PASS と扱わない。
- dev-only 経路と production session 経路を混同しない。

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] outputs/phase-08/main.md を作成する

## 成果物

- outputs/phase-08/main.md

## 完了条件

- production/staging の `/me` が Auth.js cookie/JWT で 200 を返す
- 未ログインまたは不正 JWT は 401 を返す
- 削除済み member は 410、rules 未同意は authGateState で表現される
- apps/web は D1 直参照せず cookie forwarding のまま成立する
- dev-only `x-ubm-dev-session` 経路は production で無効のまま維持される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 9 へ、AC、blocker、evidence path、approval gate を渡す。
