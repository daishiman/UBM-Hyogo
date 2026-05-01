# Phase 2: 設計 — 05b-B-magic-link-callback-credentials-provider

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-B-magic-link-callback-credentials-provider |
| phase | 2 / 13 |
| wave | 05b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

最小責務で実装・運用設計を定義する。

## 実行タスク

1. 参照資料と親タスクの状態を確認する。完了条件: 未実装・未実測の境界が記録される。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC と evidence path が対応する。
3. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作が明記される。

## 参照資料

- docs/30-workflows/unassigned-task/task-05b-authjs-callback-route-credentials-provider-001.md
- apps/api/src/routes/auth/index.ts
- apps/web/app/lib/auth/config.ts
- apps/web/src/lib/auth.ts

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/05b-B-magic-link-callback-credentials-provider/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 05b Magic Link 発行・検証 API, 06b member login UI, AUTH_SECRET / NEXTAUTH_URL 相当の環境変数
- 下流: 06b logged-in profile visual evidence, 08b auth E2E full execution, 09a staging auth smoke

## 多角的チェック観点

- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden
- #15 Auth session boundary
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] outputs/phase-02/main.md を作成する

## 成果物

- outputs/phase-02/main.md

## 完了条件

- `/api/auth/callback/email?token=&email=` が 404 にならない
- 正しい token/email で session cookie が確立される
- 不正 token/email は login error に戻される
- apps/web から D1 直参照せず API/proxy 境界を守る
- 関連 route/auth tests が追加される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 3 へ、AC、blocker、evidence path、approval gate を渡す。
