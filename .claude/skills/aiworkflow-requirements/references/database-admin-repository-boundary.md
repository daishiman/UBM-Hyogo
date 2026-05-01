# 管理者リポジトリ境界仕様

> 親仕様書: [database-implementation.md](database-implementation.md)
> 役割: detail specification
> 追加日: 2026-04-27

## 概要

Wave 2 の 02c では、管理者ドメインの D1 repository を `apps/api/src/repository/` に集約する。`apps/web/**` は D1 binding、repository、Cloudflare D1 型を直接 import しない。画面からのデータ取得は後続の Hono API endpoint 経由に限定する。

## 対象 repository

| repository | 主な責務 | 不変条件 |
| --- | --- | --- |
| `adminUsers.ts` | admin_users の lookup / active 判定 | admin gate は active admin のみ許可 |
| `adminNotes.ts` | admin_member_notes の CRUD + 04b member self-service request queue (`note_type`, `request_status`) | public/member view model に混ぜない |
| `auditLog.ts` | audit_log の append / list | update / delete / remove API を提供しない |
| `syncJobs.ts` | sync_jobs の lifecycle | `running -> succeeded/failed` のみ、終端状態の上書き禁止 |
| `magicTokens.ts` | magic_tokens の issue / verify / consume | `used = 0 AND expires_at >= now` の条件付き UPDATE で single-use |

## 境界

| 境界 | 現在の gate | 後続 gate |
| --- | --- | --- |
| apps/web -> D1 / repository | `scripts/lint-boundaries.mjs` | 09a / Wave 2 統合で dependency-cruiser CI gate |
| 02a / 02b / 02c repository 間 | `.dependency-cruiser.cjs` ルール案 | dependency-cruiser 導入後に CI で強制 |
| test fixture と production | `apps/api/tsconfig.build.json` で build typecheck から `__fixtures__` / `__tests__` / `*.test.ts` を除外し、`.dependency-cruiser.cjs` の `no-prod-to-fixtures-or-tests` を root `lint` 経路で実行 | 実 `wrangler deploy --dry-run` evidence は `task-02c-followup-002-wrangler-dry-run-evidence-001` で取得 |

## 下流連携

| 下流 | 使用する入口 |
| --- | --- |
| 03a / 03b | `syncJobs.start/succeed/fail`, `auditLog.append` |
| 04c | `adminUsers`, `adminNotes`, `auditLog` |
| 05a | `adminUsers.isActiveAdmin` |
| 05b | `magicTokens.issue/verify/consume` |
| 07c | `adminNotes`, `auditLog` |
| 08a | `__tests__/_setup.ts` と repository contract |

## 04b member self-service queue

`admin_member_notes.note_type` は既存 admin note と member self-service request を分ける。

| note_type | 用途 |
| --- | --- |
| `general` | 既存 admin note。既存行の DEFAULT |
| `visibility_request` | 会員本人の公開停止 / 再公開申請 |
| `delete_request` | 会員本人の退会申請 |

04b-followup-001 以降の pending 判定は `request_status='pending'` の行だけを対象にする。
`visibility_request` / `delete_request` は作成時に `pending`、admin resolve/reject 時に
`resolved` / `rejected` へ遷移する。`resolved_at` は unix epoch ms、`resolved_by_admin_id`
は処理した admin userId を保持する。`general` 行は request 系 3 列を NULL に保つ。
