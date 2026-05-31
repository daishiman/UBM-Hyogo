---
Phase: 11
status: runtime_pending
task_id: issue-1017-public-member-sidebar-shell-integration
---

# Phase 11 — Manual test result (issue-1017, verify_existing)

## 状態

`runtime_pending`。コード実装は landed 済み（commit `278001606` / PR #1028）。
source-level 回帰（typecheck / lint / focused specs）は本ブランチで PASS 確認済み。
local runtime screenshot は 2026-05-31 に取得済み。staging visual baseline のみ
Gate-B execution wave（Task F #1019）で実施するため pending。

## NON_VISUAL 非該当宣言

本タスクは **VISUAL** 区分（公開/会員 layout の shell 統合＝視覚的変更）。NON_VISUAL 例外には該当しない。
ただし `verify_existing` のため、Phase 11 の主証跡は「landed 実装に対する回帰テスト + 旧 header 撤去 grep + local runtime screenshot」であり、
staging baseline は Gate-B / Task F で別途取得する。

## 証跡の主ソース

- 自動テスト: `app/(public)/layout.spec.tsx` / `app/(member)/layout.spec.tsx` / `app/(public)/page.spec.tsx` / `app/(member)/profile/page.spec.tsx`（全 PASS）
- 全体: apps/web 1385 tests passed | 1 skipped（同一 run）
- typecheck 6 packages green / lint exit 0
- 旧 header production import grep = 0 件
- local runtime screenshot: Playwright `issue-1017 local sidebar shell screenshots` 1 passed（2026-05-31）

## 主証跡インベントリ

| classification | path | status |
|------|------|------|
| 回帰テストログ | outputs/phase-11/regression-test.log | present |
| screenshot plan | outputs/phase-11/screenshot-plan.json | present |
| local screenshot | outputs/phase-11/screenshots/public-shell-guest-local.png | present |
| local screenshot | outputs/phase-11/screenshots/member-shell-profile-local.png | present |
| local Playwright report | outputs/phase-11/playwright-report/results.json | present |
| staging visual baseline | (Task F #1019 staging deploy で取得) | pending |

## landed 実装に対する受け入れ条件の回帰確認

| # | 受け入れ条件 | 確認方法 | 結果 |
|---|------|------|------|
| 1 | 7 route で同一 sidebar shell | layout.spec で `SidebarShellServer` mount を assert | PASS |
| 2 | role 別 nav（PUBLIC / +MEMBERS / +ADMIN） | `buildNavForRole` unit + layout spec + local screenshot（guest/member） | PASS |
| 3 | PublicFooter 維持 | `(public)/layout.tsx` で shell children 末尾に mount | PASS |
| 4 | 旧 header import 0 件 | `git grep` production import = 0 | PASS |

## Gate-B（staging visual）実行時の確認項目

1. guest / member / admin で sidebar nav グループが PUBLIC / +MEMBERS / +ADMIN に切替わる
2. `/` → `/profile` → `/admin` 遷移で sidebar が継続表示（visual flash なし）
3. mobile 幅で `SidebarMobileTrigger` → `SidebarDrawer` が開く
4. collapse toggle で `aria-expanded` / `sr-only` 反転、`ubm:shell:collapsed` 永続化
