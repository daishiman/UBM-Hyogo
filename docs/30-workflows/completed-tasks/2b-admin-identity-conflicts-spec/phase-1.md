# Phase 1 — 要件定義

> **[実装区分: 実装仕様書]** / taskType=implementation / visualEvidence=NON_VISUAL

## 1. 目的

`/admin/identity-conflicts` 画面の Playwright E2E spec を新規作成し、admin による identity conflict の **一覧表示 / merge / dismiss / 認可境界** を契約レベルで保証する。

## 2. 背景

- 親 workflow `e2e-quality-uplift-stage-2`（completed）の sub-task 2b。
- Stage 1 で `signSession()` が活性化し、admin/member/anonymous の 3 ロール fixture が利用可能になった。
- 既存 API (`apps/api/src/routes/admin/identity-conflicts.ts`) と shared schema (`packages/shared/src/schemas/identity-conflict.ts`) は実装済。E2E 層のみ未整備。

## 3. ユーザーストーリー

| # | role | story |
|---|------|-------|
| US-1 | admin | identity conflict 一覧を見て、重複疑いの member ペアを把握したい |
| US-2 | admin | conflict を merge し、target に統合できる |
| US-3 | admin | 誤検出 conflict を dismiss できる |
| US-4 | member | `/admin/identity-conflicts` には到達できない（403 / redirect） |
| US-5 | anonymous | `/admin/identity-conflicts` には到達できない（`/login` redirect） |

## 4. 成果物

| # | path | 状態 |
|---|------|------|
| 1 | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 新規（200-240 行） |
| 2 | `apps/web/src/lib/admin/server-fetch.ts` | support: non-production inline list fixture gate |
| 3 | `apps/web/playwright.config.ts` | support: evidence dir + webServer env gate |
| 4 | `packages/shared/src/schemas/identity-conflict.ts` / `.test.ts` | support: strict request/response contract + focused tests |

## 5. 非機能要件

| 項目 | 要件 |
|------|------|
| skip 件数 | 0 |
| flaky 耐性 | 日時値 ISO8601 固定、Server Component list は gated fixture、mutation は `page.route()` で intercept |
| 実行時間 | 既存 spec と同等（< 30s 目安） |
| 環境依存 | `ADMIN_IDENTITY_CONFLICTS_EVIDENCE=1` または spec 名検出時のみ `PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1` を dev server に注入 |

## 6. スコープ外

- API 実装変更 / D1 schema 変更 / 新 endpoint 追加
- cascade preview の skip 処理（sub-task 2c の責務）
- race condition 検証（sub-task 2a の責務）
- contract test (sub-task 2d の責務、ただし fixture 形は再利用される)

## 7. 完了条件

- 本 phase の output として、Phase 2 以降が依拠する要件・US・成果物・スコープ境界が確定
- artifacts.json metadata が確定（`taskType=implementation` / `visualEvidence=NON_VISUAL` / `implementationMode=new`）
