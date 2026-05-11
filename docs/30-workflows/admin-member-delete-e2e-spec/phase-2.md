# Phase 2: 設計

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |

## 1. spec ファイル構造

`apps/web/playwright/tests/admin-member-delete.spec.ts` は既存 `auth.ts` fixture から `test` / `expect` を import し、以下 6 ケースを持つ。

| # | test | fixture | 状態 |
|---|------|---------|------|
| 1 | 成功系: 詳細 drawer → 二段確認 → reason 付き論理削除 | `adminPage` | active |
| 2 | cascade preview（API 未実装・Stage 3 持越し） | none | skip（唯一） |
| 3 | reason 空では削除実行 disabled / API 到達 0 | `adminPage` | active |
| 4 | audit log entry 連動 | `adminPage` | active |
| 5 | member は `/login?gate=forbidden` 系 redirect | `memberPage` | active |
| 6 | anonymous は `/login` redirect | `anonymousPage` | active |

## 2. mock / fixture 戦略

| 対象 | 方式 | 根拠 |
|------|------|------|
| Server Component `GET /admin/members` | `PLAYWRIGHT_ADMIN_MEMBER_DELETE_FIXTURE=1` で `server-fetch.ts` が固定 `AdminMemberListView` を返す | `page.route()` は server-side fetch を捕捉しない |
| Server Component `GET /admin/audit` | 同 fixture gate で `admin.member.deleted` entry を返す | audit page も Server Component |
| Client `GET /api/admin/members/:id` | `page.route()` | `MemberDrawer` の browser fetch |
| Client `POST /api/admin/members/:id/delete` | `page.route()` + body assertion | reason body / call count を検証 |

新 Playwright fixture は追加しない。`apps/api` route / D1 schema は参照のみ。

## 3. selector 戦略

| 用途 | selector |
|------|---------|
| drawer open | `getByRole('button', { name: '詳細' }).first()` |
| drawer | `getByTestId('member-drawer')` |
| 1 段目 削除 button | drawer 内 `getByRole('button', { name: '論理削除する' })` |
| 2 段目 confirm dialog | drawer 内 `getByRole('dialog', { name: '削除確認' })` |
| reason input | `getByLabel(/削除理由/)` |
| confirm 押下 | `getByRole('button', { name: '削除実行' })` |
| audit 表示 | `getByText('admin.member.deleted')` / `getByText('mem_001')` |

色値・class 名依存セレクタは禁止。

## 4. 状態語彙

local desktop-chromium の 5 pass + 1 skip は `implemented-local-runtime-pending` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` とする。firefox / webkit / staging / CI / PR は user-gated runtime evidence として残す。
