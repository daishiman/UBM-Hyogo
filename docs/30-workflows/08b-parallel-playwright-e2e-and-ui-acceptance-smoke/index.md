# 08b-parallel-playwright-e2e-and-ui-acceptance-smoke — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | playwright-e2e-and-ui-acceptance-smoke |
| ディレクトリ | docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke |
| Wave | 8 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 担当 | qa-e2e |
| 状態 | pending |
| タスク種別 | spec_created |

## purpose

`docs/00-getting-started-manual/specs/09-ui-ux.md` の検証マトリクス（10 画面 × desktop / mobile）を Playwright で完全網羅し、公開導線（landing → 一覧 → 詳細 → 登録）、ログイン (5 AuthGateState)、マイページ (editResponseUrl 遷移)、管理画面 5 画面、検索 (q / zone / status / tag / sort / density)、density 切替を E2E で pass させる。screenshot evidence を `outputs/phase-11/evidence/` に保存し、09-ui-ux.md の検証マトリクス全 row を green にする。

## scope in / out

### scope in

- Playwright 設定（`apps/web/playwright.config.ts` の placeholder）
- desktop (1280x800) / mobile (iPhone 13 = 390x844) 2 viewport
- 公開シナリオ: `/` → `/members` → `/members/[id]` → `/register` 導線（不変条件 #4 #8）
- 認証シナリオ: `/login` で AuthGateState 5 状態（input / sent / unregistered / rules_declined / deleted）（不変条件 #9）
- マイページシナリオ: `/profile` 表示 + editResponseUrl ボタン → Google Form 遷移（不変条件 #4）
- 管理シナリオ: `/admin`, `/admin/members`, `/admin/tags`, `/admin/schema`, `/admin/meetings` 5 画面の主要操作
- 検索 / density 切替シナリオ: `q`, `zone`, `status`, `tag`, `sort`, `density` 6 パラメータ全組合せの代表 5 ケース
- screenshot evidence: 各シナリオ完了時に `*.png` を outputs に保存
- a11y assertion: `@axe-core/playwright` で WCAG 2.1 AA 主要違反 0 件
- CI workflow placeholder (`.github/workflows/e2e-tests.yml`)

### scope out

- contract / unit / authz test（08a の責務）
- visual regression snapshot diff（不変条件 #15 attendance UI のような限定 snapshot のみ）
- production 環境負荷 test（運用フェーズ）
- staging deploy 後の Playwright pass（09a の責務）

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 06a-parallel-public-landing-directory-and-registration-pages | `/`, `/members`, `/members/[id]`, `/register` UI |
| 上流 | 06b-parallel-member-login-and-profile-pages | `/login`, `/profile` UI |
| 上流 | 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages | `/admin/*` 5 画面 |
| 上流 | 07a-parallel-tag-assignment-queue-resolve-workflow | `/admin/tags` queue 操作 |
| 上流 | 07b-parallel-schema-diff-alias-assignment-workflow | `/admin/schema` alias 操作 |
| 上流 | 07c-parallel-meeting-attendance-and-admin-audit-log-workflow | `/admin/meetings` attendance 操作 |
| 下流 | 09a-parallel-staging-deploy-smoke-and-forms-sync-validation | E2E green を staging deploy 前提 |
| 下流 | 09b-parallel-cron-triggers-monitoring-and-release-runbook | Playwright CI workflow を release runbook に組込 |
| 並列 | 08a | 同 wave、互いに独立（contract vs E2E） |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/09-ui-ux.md | 検証マトリクス（10 画面 × viewport） |
| 必須 | docs/00-getting-started-manual/specs/05-pages.md | URL 一覧 |
| 必須 | docs/00-getting-started-manual/specs/12-search-tags.md | 検索 / density |
| 必須 | docs/00-getting-started-manual/specs/11-admin-management.md | admin 5 画面 |
| 必須 | docs/00-getting-started-manual/specs/13-mvp-auth.md | AuthGateState 5 状態 |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 |
| 参考 | docs/00-getting-started-manual/claude-design-prototype/ | UI 叩き台 |

## AC（Acceptance Criteria）

- AC-1: 09-ui-ux.md 検証マトリクス全 10 画面を desktop / mobile の 2 viewport で検証し、対象セルが **green**
- AC-2: 公開導線 4 シナリオ（landing / 一覧 / 詳細 / 登録）が desktop / mobile で全 pass
- AC-3: AuthGateState 5 状態（input / sent / unregistered / rules_declined / deleted）が `/login` で全表示確認、`/no-access` ルートが存在しない
- AC-4: `/profile` で editResponseUrl ボタン押下 → `https://docs.google.com/forms/d/e/.../viewform` への遷移を観測
- AC-5: 管理画面 5 シナリオ（dashboard / members / tags / schema / meetings）が **管理者 cookie** でのみ pass、一般会員 / 未認証では 403 / login redirect
- AC-6: 検索 6 パラメータ（q / zone / status / tag / sort / density）の URL クエリと表示が一致、density 3 値（comfy / dense / list）切替で表示数 / レイアウト変化を観測
- AC-7: screenshot evidence が `outputs/phase-11/evidence/` 配下に **30 枚以上**（10 画面 × desktop + mobile + 主要操作後）配置
- AC-8: `@axe-core/playwright` で **WCAG 2.1 AA 主要違反 0 件**

## 13 phases

| Phase | 名称 | ファイル | 概要 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | 真の論点（実 D1 vs mock）、AC-1〜8 確定 |
| 2 | 設計 | phase-02.md | Mermaid（test runner / browser / D1 seed）、test ファイル構成、env / dependency matrix |
| 3 | 設計レビュー | phase-03.md | alternative 3 案（local web + local api / staging URL / preview URL）、PASS-MINOR-MAJOR |
| 4 | テスト戦略 | phase-04.md | scenarios x viewport の verify suite、a11y 戦略 |
| 5 | 実装ランブック | phase-05.md | runbook + Playwright test signature + page object |
| 6 | 異常系検証 | phase-06.md | failure cases（navigation timeout / login fail / form submit error / mobile viewport overflow） |
| 7 | AC マトリクス | phase-07.md | AC × scenario × viewport × screenshot のトレース |
| 8 | DRY 化 | phase-08.md | page object / fixture / helper の Before/After |
| 9 | 品質保証 | phase-09.md | free-tier (CI 分) / secret hygiene / a11y assertion |
| 10 | 最終レビュー | phase-10.md | GO/NO-GO（上流 06a/b/c, 07a/b/c の AC 達成チェック） |
| 11 | 手動 smoke | phase-11.md | local 実行 + screenshot 30 枚 evidence |
| 12 | ドキュメント更新 | phase-12.md | implementation-guide / system-spec-update-summary / changelog / unassigned / skill-feedback / compliance-check |
| 13 | PR 作成 | phase-13.md | approval gate / local-check-result / change-summary / PR template |

## outputs

```
outputs/phase-01/main.md
outputs/phase-02/main.md
outputs/phase-02/e2e-architecture.mmd
outputs/phase-02/scenario-matrix.md
outputs/phase-03/main.md
outputs/phase-04/main.md
outputs/phase-04/verify-matrix.md
outputs/phase-05/main.md
outputs/phase-05/runbook.md
outputs/phase-05/playwright-config.ts.placeholder
outputs/phase-05/page-objects.md
outputs/phase-06/main.md
outputs/phase-07/main.md
outputs/phase-07/ac-matrix.md
outputs/phase-08/main.md
outputs/phase-09/main.md
outputs/phase-10/main.md
outputs/phase-11/main.md
outputs/phase-11/evidence/
outputs/phase-11/evidence/desktop/      # 10 画面 + 操作 screenshot
outputs/phase-11/evidence/mobile/       # 10 画面 + 操作 screenshot
outputs/phase-11/evidence/axe-report.json
outputs/phase-11/evidence/playwright-report/
outputs/phase-11/evidence/ci-workflow.yml
outputs/phase-12/main.md
outputs/phase-12/implementation-guide.md
outputs/phase-12/system-spec-update-summary.md
outputs/phase-12/documentation-changelog.md
outputs/phase-12/unassigned-task-detection.md
outputs/phase-12/skill-feedback-report.md
outputs/phase-12/phase12-task-spec-compliance-check.md
outputs/phase-13/main.md
outputs/phase-13/local-check-result.md
outputs/phase-13/change-summary.md
outputs/phase-13/pr-template.md
```

## services / secrets

| 区分 | 値 | 配置 | 備考 |
| --- | --- | --- | --- |
| Playwright | runner | apps/web/playwright.config.ts | chromium / webkit / firefox 全 3 |
| `@axe-core/playwright` | a11y assertion | devDeps | WCAG 2.1 AA |
| local D1 seed | preview / dev binding | wrangler dev | playwright 前に seed |
| Auth.js test session | adminCookie / memberCookie | playwright/fixtures/auth.ts | 08a と同 helper を共有 |
| 環境変数 | `PLAYWRIGHT_BASE_URL=http://localhost:3000` | playwright.config.ts | local |
| Secrets | （新規導入なし） | — | local 完結 |

## invariants touched

- **#4** 本人プロフィール本文は D1 override で編集しない（profile UI に編集 form がないことを E2E で確認）
- **#8** localStorage を route / session / data の正本にしない（reload 後も状態維持確認）
- **#9** `/no-access` 専用画面に依存しない（`/no-access` URL が 404 / 不在を確認、AuthGateState 出し分け）
- **#15** meeting attendance UI で重複登録 → toast / 削除済み除外（07c E2E）

## completion definition

- 仕様作成時点では `artifacts.json.metadata.workflow_state=spec_created`、各 Phase は `pending` のまま実行順序・成果物・承認ゲートが定義済み
- AC-1〜8 が Phase 7 マトリクスで完全トレース
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）全 PASS
- 不変条件 #4 / #8 / #9 / #15 が E2E test として記述
- 実行時は screenshot evidence 30 枚以上を配置してから Phase 12 に進む
- Phase 13 は user 承認後のみ実行可能で、承認前に commit / PR 作成しない
