# Phase 12 — Documentation Changelog

## 1. 新規作成ファイル

| パス | 内容 |
|------|------|
| `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/index.md` | workflow 概要 |
| `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/artifacts.json` | root artifacts (Gates A/B/C) |
| `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/phase-1-requirements.md` | 要件定義（7×3=21 matrix） |
| `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/phase-2-design.md` | spec ファイル構成、storageState 戦略、playwright projects 設計 |
| `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/phase-3-design-review.md` | 不変条件 7 項目適合チェック |
| `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/phase-4-test-plan.md` | 21+4 TC マトリクス、expect chain 設計 |
| `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/phase-5-implementation.md` | CONST_005 完備（変更ファイル / 関数シグネチャ / テスト方針 / 実行コマンド / DoD） |
| `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/phase-6-test-additions.md` | fail-path 2 TC + regression 2 TC |
| `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/phase-7-coverage.md` | routes × states × DOM 契約属性 matrix |
| `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/phase-8-refactor.md` | DRY / helper 抽出 / 命名規約 |
| `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/phase-9-qa.md` | typecheck/lint/dry-run/PII grep の 9 項目 |
| `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/phase-10-final-review.md` | 4 条件 PASS / blocker なし |
| `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/outputs/artifacts.json` | outputs gates parity |
| `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/outputs/phase-11/manual-test-result.md` | NON_VISUAL 宣言 + TC 結果テンプレート |
| `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/outputs/phase-12/main.md` | Phase 12 index |
| `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/outputs/phase-12/implementation-guide.md` | Part 1 中学生 + Part 2 技術 |
| `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/outputs/phase-12/system-spec-update-summary.md` | API / D1 / Auth.js no-op + workflow 正本導線同期 |
| `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/outputs/phase-12/documentation-changelog.md` | 本ファイル |
| `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/outputs/phase-12/unassigned-task-detection.md` | 未タスク検出 0 件 |
| `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/outputs/phase-12/skill-feedback-report.md` | skill フィードバック |
| `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 headings |
| `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/outputs/phase-13/pr-creation-result.md` | Phase 13 user-gated placeholder |

## 2. 既存ファイル変更

| パス | 予定変更 |
|------|----------|
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 登録 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | quick lookup 登録 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | workflow quick reference 登録 |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | skill history 登録 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | latest headline 登録 |
| `apps/web/playwright/tests/setup-auth.spec.ts` | 新規（実装 wave） |
| `apps/web/playwright/tests/auth-slot-coverage.spec.ts` | 新規（実装 wave） |
| `apps/web/playwright/.auth/.gitignore` | storageState JSON の ignore |
| `apps/web/playwright/.auth/.gitkeep` | `.auth/` ディレクトリ保持 |
| `apps/web/playwright.config.ts` | projects 2 追加 + 既存 testIgnore 追加（実装 wave） |
| `.github/workflows/playwright-smoke.yml` | `auth-slot` job 追加（実装 wave） |
| `apps/web/src/lib/auth-view/` | Auth.js session から `guest` / `member` / `admin` view を解決 |
| `apps/web/src/components/public/PublicHeader.tsx` / `(public)/layout.tsx` | public header の `data-auth-state` と auth CTA |
| `apps/web/app/privacy/page.tsx` / `apps/web/app/terms/page.tsx` | legal pages に public header/footer を付与 |
| `apps/web/src/components/layout/MemberHeader.tsx` / `(member)/layout.tsx` | member header の `data-auth-state` と admin CTA |
| `apps/web/app/(admin)/layout.tsx` / `AdminSidebar*.tsx` | admin shell の `data-auth-state="admin"` と public-return role |
| `apps/web/middleware.ts` | non-admin `/admin` を `/login?gate=forbidden` redirect に統一 |

## 3. spec → 実装の対応表

| spec phase | 実装ファイル |
|------------|--------------|
| Phase 5 §2 | `setup-auth.spec.ts` |
| Phase 5 §3 | `auth-slot-coverage.spec.ts` |
| Phase 5 §4 | `playwright.config.ts` |
| Phase 5 §5 | `apps/web/playwright/.auth/.gitignore` |
| Phase 5 §6 | `playwright-smoke.yml` |
| Phase 6 §1 (TC-F02) | `auth-slot-coverage.spec.ts` で `signSessionJwt` の `nowSeconds` / `ttlSeconds` を使い expired JWT を生成 |

## 4. ロールバック手順

| 対象 | 手順 |
|------|------|
| 本 workflow ディレクトリ | `git rm -rf docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/` |
| 実装 wave のコード変更 | 実装 wave PR ごと revert |
| CI workflow 変更 | playwright-smoke.yml の `auth-slot` job を削除 |
