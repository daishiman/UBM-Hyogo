# discovered-issues

task-11 の Phase 11 実走中に発見済み・未解決の項目を記録する。各 issue は同一 wave で `docs/30-workflows/unassigned-task/` に formalize するか、本 task 完了後の follow-up として残す。

| ID | severity | 概要 | 推奨 follow-up タスク名 | 既存 task との依存関係 |
| --- | --- | --- | --- | --- |
| ISSUE-01 | High | `PENDING_RUNTIME_EVIDENCE` 解消（`member_identities` seed 不在で members 系 screenshot / axe / coverage が未取得） | `task-11a-members-runtime-evidence-recovery` | task-09a 隣接（D1 seed / staging fixtures）に依存。task-18 regression smoke の前提条件。task-11 完了 PASS 昇格に必須。 |
| ISSUE-02 | Medium | OG image / sitemap / robots.txt の追加（公開 SEO 整備） | `task-11b-public-seo-assets` | task-11 のスコープ外。task-02（routing infra）/ task-08（design tokens）に部分依存。並列実行可。 |
| ISSUE-03 | Low | members ページの Pagination prefetch（次ページ visibility-based prefetch / IntersectionObserver） | `task-11c-members-pagination-prefetch` | task-11 の MemberGrid / MemberTable 実装に依存。runtime evidence 取得後（ISSUE-01 解消後）に着手推奨。 |
| ISSUE-04 | Medium | Playwright project 拡張（firefox / mobile-chromium / mobile-webkit を `playwright.config.ts` に追加） | `task-11d-playwright-cross-browser-projects` | task-11 の playwright config / spec に依存。task-18 regression smoke の cross-browser gate と整合。 |

## 詳細

### ISSUE-01: PENDING_RUNTIME_EVIDENCE 解消

- 現状: `outputs/phase-11/manual-test-result.md` に記録した通り、`members-*.png` 3 枚と `axe.json`、`coverage/e2e/coverage-summary.json` が未取得。
- 解消条件: `member_identities` seed を持つ環境（local fixture or staging）で `playwright test playwright/tests/public-top-and-list.spec.ts` を再走し、5 cases 全てで axe critical=0 を確認。
- 完了基準: `manual-test-result.md` を `PASS` 化し、`IMPLEMENTED_LOCAL_RUNTIME_PENDING` 表記を撤去。
- 起票要否: task-11 の close-out で `PASS` 昇格を要求するため、unassigned task として **formalize 推奨**。

### ISSUE-02: OG image / sitemap / robots.txt

- 現状: `apps/web/app/page.tsx` および `(public)` route group に OG image generator / `sitemap.xml` / `robots.txt` 未配置。
- 影響: 公開公開向け SEO / SNS 共有 preview の品質が低下。
- 起票要否: task-11 のスコープ（`/` と `/members`）の MVP 完成度には不要だが、公開前にカバーすべき。**baseline として記録**し、別 task で formalize 推奨。

### ISSUE-03: Pagination prefetch

- 現状: `MemberGrid.tsx` / `MemberTable.tsx` に `<Link prefetch>` の活用余地あり。次ページ番号の prefetch を visibility-based で行う最適化が未実装。
- 影響: large list での体感遅延が残る可能性。
- 起票要否: ISSUE-01 解消後の最適化フェーズで起票。**baseline / future** として保留。

### ISSUE-04: Playwright firefox / mobile project 拡張

- 現状: `apps/web/playwright.config.ts` の `projects` は `desktop-chromium` のみ。mobile breakpoint（task-08 design tokens）の runtime gate 未整備。
- 影響: 公開ターゲットの一部ブラウザで axe / visual regression が未保証。
- 起票要否: task-18 regression smoke と並行で extension すべき。**formalize 推奨**。

## 状態管理

- 4 件すべて `open` で start。task-11 close-out 時点で `IMPLEMENTED_LOCAL_RUNTIME_PENDING` の根拠として `outputs/phase-12/unassigned-task-detection.md` 側にも参照を残す。
- ISSUE-01 のみ task-11 の completion gate に必須（PASS 昇格 blocker）。他 3 件は baseline / future として task-11 完了後に着手可。
