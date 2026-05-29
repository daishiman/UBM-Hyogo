# Implementation Guide — admin-audit-prototype-alignment

> workflow: admin-audit-prototype-alignment
> implemented_at: 2026-05-27
> scope: Task A (UI prototype alignment) + Task B (API 404 mount regression guards)

## 概要

`/admin/audit` を他の admin 画面（`AdminMembersPage` / `AdminTagsPage` / `SchemaDiffPage`）と
共通の admin design language（`AdminPageHeader` + Card + Filter grid + Button / Select primitives
+ tokenized `tbl`）に整える。あわせて staging で発生していた
`admin api /admin/audit?limit=50 failed: 404` の再発を CI で検知するための回帰テストを 2 件追加する。
既存 API surface（`AdminAuditListResponseZ` / cursor encode / PII masking）は変更しない。

## 変更ファイル

### Task A（UI prototype alignment）

| パス | 種別 | 概要 |
|------|------|------|
| `apps/web/app/(admin)/admin/audit/page.tsx` | 編集 | `AdminPageHeader` を採用し、`<section className="flex flex-col gap-4">` で wrap |
| `apps/web/src/components/admin/AuditLogPanel.tsx` | 編集 | filter を Card + grid、ボタンを Button / `buttonVariants` primitive、エラー表示を `Banner tone="warning"`、テーブルを `tbl` クラス、空状態を `EmptyState`、ページング `Pagination` 化 |
| `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | 編集 | local `<h1>` 撤去 / FormField 描画 / 404 hint banner などの追加ケース |
| `apps/web/app/(admin)/admin/audit/page.page.spec.ts` | 編集 | `AdminPageHeader` title / breadcrumbs / description の描画回帰ケース |
| `apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts` | 編集 | `admin api /admin/audit?limit=50 failed: 404` を `ADMIN_FETCH_404` に展開する回帰ケース |
| `apps/web/playwright/tests/visual-staging/admin-audit.spec.ts` | 新規 | staging-visual project 用 admin-audit baseline spec（unauthenticated guard 描画） |

### Task B（API 404 mount regression guards）

| パス | 種別 | 概要 |
|------|------|------|
| `apps/api/src/index.spec.ts` | 新規 | root `app.route("/admin", adminAuditRoute)` を再現するラッパで `/admin/audit?limit=1` を request し、401（404 でない）を確認 |
| `apps/api/src/routes/admin/audit.contract.spec.ts` | 編集 | `GET /admin/audit: routed via root mount returns 200` を追加（D1 シード + admin auth + root mount 経由で 200） |
| `docs/30-workflows/completed-tasks/admin-audit-prototype-alignment/tasks/task-B-api-404-recovery.md` | 編集 | §B.6 確定原因にコード側調査結果と回帰テストへのリンクを追記 |

## 検証

```bash
mise exec -- pnpm typecheck   # green
mise exec -- pnpm lint        # green
mise exec -- pnpm --filter web test -- src/components/admin/__tests__/AuditLogPanel.component.spec.tsx
mise exec -- pnpm --filter web test -- app/\(admin\)/admin/audit/page.page.spec.ts
mise exec -- pnpm --filter web test -- src/lib/admin/__tests__/safe-server-fetch.spec.ts
mise exec -- pnpm --filter api test -- src/index.spec.ts
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/src/routes/admin/audit.contract.spec.ts
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/admin-audit-prototype-alignment/outputs/phase-11 PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1 mise exec -- pnpm --filter web exec playwright test apps/web/playwright/tests/admin-schema-conflicts-audit.spec.ts -g "audit states" --project=desktop-chromium
```

すべて green。`audit.contract.spec.ts` は D1 lane（`vitest.d1.config.ts`）で 10 件 pass。`pnpm --filter web test -- ...` は既存 script の引数展開により web suite 全体を実行し、158 files / 1158 tests pass（1 skipped）。`pnpm --filter api test -- src/index.spec.ts` は api suite 全体を実行し、66 files / 415 tests pass。

## User-gated 残作業

| 項目 | 内容 |
|------|------|
| staging deploy | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`（user 実行） |
| staging env 検証 | `bash scripts/cf.sh secret list --config apps/{web,api}/wrangler.toml --env staging` と `INTERNAL_API_BASE_URL` の deployed 値確認（user 実行） |
| staging 目視 | admin session で `/admin/audit?limit=50` を開き 200 + design language 描画確認 |
| Playwright visual baseline | `staging-visual` project の Linux baseline を CI で取得（user-gated） |
| commit / push / PR | ユーザー指示後に実施 |

## スクリーンショット

Local authenticated fixture で `/admin/audit` の default / filtered / empty state を取得済み。

| 状態 | パス |
|------|------|
| default table | `outputs/phase-11/screenshots/admin-audit-default.png` |
| filtered table | `outputs/phase-11/screenshots/admin-audit-filtered.png` |
| empty state | `outputs/phase-11/screenshots/admin-audit-empty.png` |

staging deploy 後の production-equivalent authenticated baseline は user-gated のまま。
