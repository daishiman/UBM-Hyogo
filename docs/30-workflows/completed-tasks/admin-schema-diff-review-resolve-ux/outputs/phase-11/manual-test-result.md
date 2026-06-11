# Phase 11: 手動テスト結果 — admin-schema-diff-review-resolve-ux

## VISUAL_ON_EXECUTION / implemented_local_evidence_captured 宣言

- 本タスクは **VISUAL_ON_EXECUTION**（実行時に視覚証跡を取得する区分）であり、現状は **implemented_local_evidence_captured** である。
- 本 wave では apps/web 実装、focused tests、typecheck、design-token 検証、apps/api 非接触確認を完了した。
- local Playwright fixture による `/admin/schema` screenshot 取得を完了した。
- authenticated staging `/admin/schema` の実画面操作・commit / push / PR は **user-gated**。

---

## 1. 本 wave で実行した検証

| 区分 | コマンド | 結果 |
|------|----------|------|
| targeted vitest | `pnpm exec vitest run apps/web/src/components/admin/__tests__/schemaReviewTerms.spec.ts apps/web/src/components/admin/__tests__/SchemaReviewGuide.spec.tsx apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` | PASS（3 files / 36 tests） |
| typecheck | `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| lint | `pnpm lint` | PASS |
| design tokens | `pnpm verify:tokens` | PASS（root design-token gate） |
| apps/api non-touch | `git diff --quiet -- apps/api` | PASS（exit 0） |
| local Playwright visual | `ADMIN_SCHEMA_DIFF_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/admin-schema-diff-review-resolve-ux/outputs/phase-11/screenshots PLAYWRIGHT_BASE_URL=http://localhost:3001 pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual/admin-schema-diff.spec.ts --project=visual-chromium` | PASS（canonical 4 PNG captured） |

---

## 2. スクリーンショット証跡

| TC-ID | 判定 | 証跡 |
|-------|------|------|
| TC-01 | PASS | `screenshots/schema-review-guide-default.png` |
| TC-02 | PASS | `screenshots/schema-diff-card-collapsed.png`, `screenshots/admin-schema-diff-added-desktop.png`, `screenshots/admin-schema-diff-changed-desktop.png`, `screenshots/admin-schema-diff-removed-desktop.png`, `screenshots/admin-schema-diff-unresolved-desktop.png` |
| TC-03 | PASS | `screenshots/schema-diff-card-inline-form-expanded.png`, `screenshots/admin-schema-diff-resolve-success.png`, `screenshots/admin-schema-diff-resolve-409.png`, `screenshots/admin-schema-diff-resolve-422.png` |
| TC-04 | PASS | `screenshots/schema-assign-help-visible.png` |

---

## 3. user-gated staging evidence（計画）

| 区分 | 内容 | 取得方法 | 判定 |
|------|------|----------|------|
| screenshot: guide | 目的説明表示 | `schema-review-guide-default.png` | staging_visual_pending_user_gate |
| screenshot: collapsed | フォーム未展開 | `schema-diff-card-collapsed.png` | staging_visual_pending_user_gate |
| screenshot: expanded | カード直下フォーム展開 | `schema-diff-card-inline-form-expanded.png` | staging_visual_pending_user_gate |
| screenshot: help | 文脈ヘルプ + やさしい用語 | `schema-assign-help-visible.png` | staging_visual_pending_user_gate |

---

## 4. staging screenshot を本 wave で作らない理由

- 改修後 UI は local Playwright fixture と component tests で確認済みだが、authenticated staging runtime はユーザー承認が必要。
- staging に未反映の画面画像を生成すると実画像の捏造になるため、PNG は user-gated runtime まで保留する。
- commit / push / PR もユーザー承認後のみ実施する。

---

## 5. 完了条件

- [x] VISUAL_ON_EXECUTION / implemented_local_evidence_captured 宣言を冒頭に記した。
- [x] 本 wave で実行した focused evidence を列挙した。
- [x] local Playwright fixture screenshot 4 canonical PNG を `outputs/phase-11/screenshots/` に保存した。
- [x] user-gated staging screenshot 4 canonical 名を計画として列挙した。
- [x] staging screenshot を本 wave で作らない理由（実画像捏造の回避）を明記した。
