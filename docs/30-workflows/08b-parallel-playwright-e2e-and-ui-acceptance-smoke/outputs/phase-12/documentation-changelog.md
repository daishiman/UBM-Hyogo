# Documentation Changelog — 08b parallel-playwright-e2e-and-ui-acceptance-smoke

> 本タスクで追加・更新したドキュメント / 実装ファイルの完全リスト。

## 1. タスク仕様書本体（`docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/`）

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `index.md` | 追加 | タスク index、AC-1〜8、13 phase 表、outputs ツリー |
| `artifacts.json` | 追加 | metadata（taskType=docs-only / workflow_state=spec_created）、13 phase status |
| `phase-01.md` | 追加 | 要件定義 |
| `phase-02.md` | 追加 | 設計 |
| `phase-03.md` | 追加 | 設計レビュー |
| `phase-04.md` | 追加 | テスト戦略 |
| `phase-05.md` | 追加 | 実装ランブック |
| `phase-06.md` | 追加 | 異常系検証 |
| `phase-07.md` | 追加 | AC マトリクス |
| `phase-08.md` | 追加 | DRY 化 |
| `phase-09.md` | 追加 | 品質保証 |
| `phase-10.md` | 追加 | 最終レビュー |
| `phase-11.md` | 追加 | 手動 smoke |
| `phase-12.md` | 追加 | ドキュメント更新（本 phase） |
| `phase-13.md` | 追加 | PR 作成 |

→ 計 **15 ファイル**（仕様書本体）。

## 2. Phase outputs（`docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/outputs/`）

| パス | 種別 | 概要 |
| --- | --- | --- |
| `phase-01/main.md` | 追加 | 真の論点 + AC 確定 |
| `phase-02/main.md` | 追加 | 設計サマリ |
| `phase-02/e2e-architecture.mmd` | 追加 | Mermaid（test runner / browser / D1 seed） |
| `phase-02/scenario-matrix.md` | 追加 | scenario × viewport |
| `phase-03/main.md` | 追加 | 設計レビュー（PASS-MINOR-MAJOR） |
| `phase-04/main.md` | 追加 | テスト戦略 |
| `phase-04/verify-matrix.md` | 追加 | 45 verify row |
| `phase-05/main.md` | 追加 | runbook サマリ |
| `phase-05/runbook.md` | 追加 | 7 step runbook |
| `phase-05/playwright-config.ts.placeholder` | 追加 | config 雛形 |
| `phase-05/page-objects.md` | 追加 | page object 設計 |
| `phase-06/main.md` | 追加 | 異常系 F-1〜F-14 |
| `phase-07/main.md` | 追加 | AC matrix サマリ |
| `phase-07/ac-matrix.md` | 追加 | AC × scenario × viewport × screenshot × invariant 1:1 |
| `phase-08/main.md` | 追加 | DRY Before/After |
| `phase-09/main.md` | 追加 | 品質保証（free-tier / secret hygiene / a11y） |
| `phase-10/main.md` | 追加 | 最終レビュー / GO-NO-GO |
| `phase-11/main.md` | 追加 | 手動 smoke 手順 + 44 screenshot リスト |
| `phase-11/evidence/` | placeholder | 実 evidence は上流 green 後 |
| `phase-12/main.md` | 追加 | 本 phase summary |
| `phase-12/implementation-guide.md` | 追加 | PR 本文元 |
| `phase-12/system-spec-update-summary.md` | 追加 | spec 提案差分 |
| `phase-12/documentation-changelog.md` | 追加 | 本ファイル |
| `phase-12/unassigned-task-detection.md` | 追加 | 未タスク 5 件 |
| `phase-12/skill-feedback-report.md` | 追加 | skill フィードバック |
| `phase-12/phase12-task-spec-compliance-check.md` | 追加 | 仕様準拠チェック |

→ outputs 計 **約 26 ファイル**（phase-11/evidence/ プレースホルダ除く）。

## 3. 実装 scaffolding（`apps/web/`）

| ファイル | 種別 | 行 |
| --- | --- | --- |
| `apps/web/playwright.config.ts` | 追加 | 48 |
| `apps/web/playwright/fixtures/auth.ts` | 追加 | 60 |
| `apps/web/playwright/fixtures/d1-seed.ts` | 追加 | 34 |
| `apps/web/playwright/page-objects/BasePage.ts` | 追加 | 21 |
| `apps/web/playwright/page-objects/HomePage.ts` | 追加 | 12 |
| `apps/web/playwright/page-objects/MembersListPage.ts` | 追加 | 28 |
| `apps/web/playwright/page-objects/MemberDetailPage.ts` | 追加 | 22 |
| `apps/web/playwright/page-objects/RegisterPage.ts` | 追加 | 13 |
| `apps/web/playwright/page-objects/LoginPage.ts` | 追加 | 27 |
| `apps/web/playwright/page-objects/ProfilePage.ts` | 追加 | 22 |
| `apps/web/playwright/page-objects/AdminDashboardPage.ts` | 追加 | 12 |
| `apps/web/playwright/page-objects/AdminMembersPage.ts` | 追加 | 11 |
| `apps/web/playwright/page-objects/AdminTagsPage.ts` | 追加 | 11 |
| `apps/web/playwright/page-objects/AdminSchemaPage.ts` | 追加 | 11 |
| `apps/web/playwright/page-objects/AdminMeetingsPage.ts` | 追加 | 36 |
| `apps/web/playwright/tests/public-flow.spec.ts` | 追加 | 42 |
| `apps/web/playwright/tests/auth-gate-state.spec.ts` | 追加 | 26 |
| `apps/web/playwright/tests/profile.spec.ts` | 追加 | 31 |
| `apps/web/playwright/tests/admin-pages.spec.ts` | 追加 | 50 |
| `apps/web/playwright/tests/search-density.spec.ts` | 追加 | 52 |
| `apps/web/playwright/tests/attendance.spec.ts` | 追加 | 23 |
| `apps/web/playwright/tests/a11y.spec.ts` | 追加 | 20 |
| `apps/web/package.json` | 更新 | `@playwright/test` / `@axe-core/playwright` devDependencies 追加 |

→ scaffolding 計 **22 ファイル / 612 行**（package.json 除く）。

## 4. CI workflow

| ファイル | 種別 | 行 | 概要 |
| --- | --- | --- | --- |
| `.github/workflows/e2e-tests.yml` | 追加 | 63 | PR / push 時の Playwright 実行 + `actions/upload-artifact@v4`（retention 14 日） |

## 5. screenshot evidence 配置規約

```
outputs/phase-11/evidence/
├── desktop/
│   ├── landing.png ... attendance-deleted-excluded.png  (29 枚)
├── mobile/
│   ├── landing.png ... admin-meetings.png  (15 枚)
├── axe-report.json
├── playwright-report/
│   ├── index.html / data/ / trace/
├── ci-workflow.yml
└── run.log
```

命名規約: `{viewport}/{screen}-{state?}.png`。state 省略可。

## 6. 不変条件の test 化点

| 不変条件 | spec | assertion 概要 |
| --- | --- | --- |
| #4 profile 編集 form 不在 | `profile.spec.ts` | 編集 form 不在 + popup → forms.google.com |
| #8 localStorage を正本にしない | `profile.spec.ts` | clear() + reload 後 state 維持 |
| #9 `/no-access` 不在 | `auth-gate-state.spec.ts` | status 404 + 5 state /login 内出し分け |
| #15 attendance 二重防御 | `attendance.spec.ts` | dup toast + 削除済み除外 |

## 集計

- **追加ドキュメント**: 15 仕様 + 26 outputs = **41 ファイル**
- **追加実装**: scaffolding 22 + CI yml 1 = **23 ファイル**
- **更新**: `apps/web/package.json` 1 ファイル
