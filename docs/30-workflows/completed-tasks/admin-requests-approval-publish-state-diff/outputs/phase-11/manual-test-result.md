# Phase 11 — VISUAL 証跡記録

> status: **local evidence captured / staging visual pending user gate** / visualScope=`VISUAL`。同一サイクルで `apps/web` 実装とローカル検証を完了した。3 canonical screenshot は staging deploy + admin bearer mint が user-gated のため未取得（PNG 0 件・擬似生成しない）。

---

## 1. 証跡の主ソース

| ソース | 内容 | 状態 |
| --- | --- | --- |
| Focused Vitest | `RequestQueueDetail.spec.tsx` / `RequestConfirmDialog.spec.tsx` / `RequestQueuePanel.component.spec.tsx` | PASS（3 files / 27 tests） |
| Admin requests Playwright E2E | `apps/web/playwright/tests/admin-requests.spec.ts` | PASS（7 tests / `desktop-chromium` / local fixture） |
| Typecheck | `pnpm typecheck` | PASS |
| Lint | `pnpm lint` | PASS |
| Design token gate | `pnpm --filter @ubm-hyogo/web verify-design-tokens` | PASS（1 file / 9 tests） |
| Phase 12 compliance | `pnpm verify:phase12-compliance` | PASS |
| AC-7 guard | `git diff --name-only -- apps/api packages/shared` | PASS（空） |
| Component/style grep gate | `rg "#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#" ...` | PASS（対象差分に該当なし） |
| VISUAL screenshot | `screenshot-plan.json` の 3 canonical 名（`/admin/requests` desktop 3 件） | pending user gate |

## 2. 実行結果

| # | コマンド | 結果 |
| --- | --- | --- |
| 1 | `pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx` | PASS（3 files / 27 tests） |
| 2 | `AUTH_SECRET=playwright-auth-secret-playwright-auth-secret PLAYWRIGHT_SKIP_WEB_SERVER=1 PLAYWRIGHT_ADMIN_REQUESTS_FIXTURE=1 pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/admin-requests.spec.ts --project=desktop-chromium` | PASS（7 tests） |
| 3 | `pnpm typecheck` | PASS |
| 4 | `pnpm lint` | PASS |
| 5 | `pnpm --filter @ubm-hyogo/web verify-design-tokens` | PASS（9 tests） |
| 6 | `pnpm verify:phase12-compliance` | PASS |

## 3. screenshot 記録表

| # | canonical 名 | tc | route | viewport | 取得 | 結果 | 備考 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `request-approve-visibility-public-to-hidden` | TC-V-01 | `/admin/requests?type=visibility_request` | desktop | pending | runtime_pending_user_gate | 公開 → 非公開（fixture TEST-NOTE-V01） |
| 2 | `request-approve-visibility-hidden-to-public` | TC-V-02 | `/admin/requests?type=visibility_request` | desktop | pending | runtime_pending_user_gate | 非公開 → 公開 + ダイアログ具体文言（fixture TEST-NOTE-V02） |
| 3 | `request-approve-delete-enroll-to-withdraw` | TC-V-03 | `/admin/requests?type=delete_request` | desktop | pending | runtime_pending_user_gate | 在籍 → 退会（論理削除）（fixture TEST-NOTE-D01） |

## 4. 3 層評価記録

| 層 | 判定 | 根拠 |
| --- | --- | --- |
| Semantic | PASS | helper の label mapping / fail-soft / note_type 分岐 / dialog 文言を focused Vitest で固定 |
| Visual | LOCAL PASS / RUNTIME_PENDING | CSS は既存 OKLch token のみ。staging screenshot 3 PNG は user-gated |
| AI UX | LOCAL PASS / RUNTIME_PENDING | 「公開 → 非公開」「在籍 → 退会（論理削除）」の意味軸分離を component DOM で確認。runtime 目視は user-gated |

## 5. 現在の確定事項

- `apps/web/src/components/admin/RequestQueueDetail.tsx` に `formatPublishStateLabel` / `buildPublishStateDiff` を実装し、詳細パネルへ before-after diff 行を追加した。
- `RequestQueuePanel.tsx` は同 helper を使って承認確認ダイアログの具体文言を生成する。
- `RequestConfirmDialog.tsx` は退会時のみ `role="alert"`、公開状態変更時は通常説明文として表示する。
- `globals.css` の diff 表示は既存 `--ubm-color-*` token のみを使う。
- Playwright admin requests fixture の `publishState` を実 API 値域（`public` / `hidden` / `member_only`）に補正し、E2E で `公開 → 非公開` diff を固定した。
- commit / push / PR / staging deploy / admin bearer mint / 3 canonical PNG capture は user-gated。
