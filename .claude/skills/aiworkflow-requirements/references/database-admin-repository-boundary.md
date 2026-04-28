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
| `adminNotes.ts` | admin_member_notes の CRUD | public/member view model に混ぜない |
| `auditLog.ts` | audit_log の append / list | update / delete / remove API を提供しない |
| `syncJobs.ts` | sync_jobs の lifecycle | `running -> succeeded/failed` のみ、終端状態の上書き禁止 |
| `magicTokens.ts` | magic_tokens の issue / verify / consume | `used = 0 AND expires_at >= now` の条件付き UPDATE で single-use |

## 境界

| 境界 | 現在の gate | 後続 gate |
| --- | --- | --- |
| apps/web -> D1 / repository | `scripts/lint-boundaries.mjs` | 09a / Wave 2 統合で dependency-cruiser CI gate |
| 02a / 02b / 02c repository 間 | `.dependency-cruiser.cjs` ルール案 | dependency-cruiser 導入後に CI で強制 |
| test fixture と production | `__fixtures__/` / `__tests__/` に閉じる | build config で production bundle 除外を固定 |

## 下流連携

| 下流 | 使用する入口 |
| --- | --- |
| 03a / 03b | `syncJobs.start/succeed/fail`, `auditLog.append` |
| 04c | `adminUsers`, `adminNotes`, `auditLog` |
| 05a | `adminUsers.isActiveAdmin` |
| 05b | `magicTokens.issue/verify/consume` |
| 07c | `adminNotes`, `auditLog` |
| 08a | `__tests__/_setup.ts` と repository contract |
