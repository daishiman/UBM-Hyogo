# Phase 11 — Evidence Inventory（VISUAL）

## 0. screenshot_mode

`VISUAL`（profile / admin / public 3 面に新 UI 追加）。

Current status: `local_static_visual_present_staging_pending`。ローカル実装、focused Vitest、local static visual capture は PASS / present。staging runtime PASS は主張しない。

## 1. capture 一覧

| # | Path | Status | Evidence type | route | state | tc |
|---|------|--------|---------------|-------|-------|----|
| 1 | `outputs/phase-11/screenshots/profile-public-consent-callout-consented.png` | present | local static screenshot | `/profile` | publicConsent=consented | TC-A1 |
| 2 | `outputs/phase-11/screenshots/profile-public-consent-callout-declined.png` | present | local static screenshot | `/profile` | publicConsent=declined | TC-A2 |
| 3 | `outputs/phase-11/screenshots/profile-public-consent-callout-unknown.png` | present | local static screenshot | `/profile` | publicConsent=unknown | TC-A3 |
| 4 | `outputs/phase-11/screenshots/admin-members-bulk-republish-button.png` | present | local static screenshot | `/admin/members` | drawer closed（一括ボタン表示） | TC-B1 |
| 5 | `outputs/phase-11/screenshots/admin-members-bulk-republish-drawer-open.png` | present | local static screenshot | `/admin/members` | drawer open + candidates 表示 | TC-B2 |
| 6 | `outputs/phase-11/screenshots/admin-members-bulk-republish-drawer-running.png` | present | local static screenshot | `/admin/members` | drawer running（progress） | TC-B3 |
| 7 | `outputs/phase-11/screenshots/admin-members-bulk-republish-drawer-failed.png` | present | local static screenshot | `/admin/members` | drawer done + 失敗一覧 | TC-B4 |
| 8 | `outputs/phase-11/screenshots/public-members-all-hidden-fallback.png` | present | local static screenshot | `/members` | allHidden fallback | TC-C1 |
| 9 | `outputs/phase-11/screenshots/public-members-filter-empty.png` | present | local static screenshot | `/members` | filter empty (既存 EmptyState 維持) | TC-C2 |
| 10 | `outputs/phase-11/screenshots/public-members-grid-default.png` | present | local static screenshot | `/members` | 通常一覧 (回帰確認) | TC-C3 |
| 11 | `outputs/phase-11/metadata.json` | present | metadata | all | `{ tc, route, state, filename, capturedAt }` | all |

## 2. capture 戦略

- Local static visual capture generated 10 PNGs with Playwright `page.setContent`.
- Staging/runtime visual capture remains user-gated.
- file 配置: `docs/30-workflows/completed-tasks/issue-958-h3-public-filter-ux/outputs/phase-11/screenshots/`
- metadata: `outputs/phase-11/metadata.json` に `{ tc, route, state, filename, capturedAt }`

## 3. fixture / preconditions

- TC-A1/A2/A3: admin 経由で seed user の publicConsent 状態を切替（または mock SSR）
- TC-B*: hidden / member_only な seed member を 3-5 件
- TC-C1: D1 上で全 member の publishState を `hidden` に temp 切替 → 撮影 → revert（staging 専用）

## 4. 完了条件

- [x] 10 screenshot 列挙
- [x] tc / route / filename 1:1
- [x] capture project / metadata 経路明示
- [x] local static screenshot は `present`、staging/runtime screenshot は未取得として混同しない
