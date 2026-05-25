---
workflow_id: issue-872-google-brand-4tone-icon-and-tokens-exempt
workflow_state: local_static_pass_browser_pending
created_at: 2026-05-24
owner: daishiman
taskType: implementation
visualEvidence: VISUAL
implementation_mode: new
implementation_status: local_static_pass_browser_pending
source_issue: https://github.com/daishiman/UBM-Hyogo/issues/872
source_followup_id: FU-LOGIN-001
parent_workflow: docs/30-workflows/completed-tasks/login-page-prototype-alignment/
---

# issue-872 / FU-LOGIN-001 Google Brand 4-tone Icon + verify-design-tokens Brand-color Exempt Path

## 目的

`/login` の Google OAuth ボタンに表示している 1-tone "G" を、Google ブランドガイドラインに準拠する **4-tone 公式 "G" SVG** に差し替える。あわせて `scripts/verify-design-tokens.ts` に **brand-asset exempt path**（`apps/web/src/components/ui/brand-icons/` 配下）を追加し、外部 brand owner が指定する公式アセット由来の HEX 直書きを正当な例外として CI gate を通す。

## 背景

親 workflow `login-page-prototype-alignment` の Phase 12 unassigned-task-detection で検出された FU-LOGIN-001。現状の `<Icon name="google">` は `apps/web/src/components/ui/Icon.tsx` の `common` 強制 (`fill="none" stroke="currentColor"`) により単色 stroke でしか描画できず、ブランドガイドライン違反となる。同時に `verify-design-tokens` gate は HEX 直書きを禁止しているため、Google 公式色 (`#4285F4` / `#EA4335` / `#FBBC05` / `#34A853`) を直書きするには exempt path 機構が必要となる。

## 実装サマリ

| 項目 | 内容 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-872-google-brand-4tone-icon-and-tokens-exempt/` |
| 状態 | `local_static_pass_browser_pending` |
| 実装対象 | `apps/web/src/components/ui/brand-icons/{google.svg,GoogleBrandIcon.tsx}` (新規)、`apps/web/app/login/_components/GoogleOAuthButton.client.tsx` (差し替え)、`apps/web/src/components/ui/{icons.ts,Icon.tsx}` (google case 撤去)、`scripts/verify-design-tokens.{ts,spec.ts}` (brand SVG exempt 追加)、`docs/00-getting-started-manual/specs/09b-design-tokens.md` (brand-asset exempt 章追加)、`apps/web/playwright/tests/visual/login.spec.ts-snapshots/` (baseline 更新)、親 workflow / unassigned spec の consumed 反映 |
| 正本 source | Google Identity Guidelines (4-tone "G" 公式 SVG) / `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/09b-design-tokens.md` |
| 主要変更 | brand-icons ディレクトリ新設、Icon.tsx の `common` 強制を回避する別系統 React component、verify-design-tokens の二層 exempt（既存 metadata exempt + 新規 brand `.svg` exempt）。`.tsx` は HEX 例外に含めない。Static validation と render PNG は取得済み、browser screenshot / build は local `ENOSPC` 解消後に再取得 |
| API / auth boundary | 既存 `signInWithGoogle()` のみ。`apps/api/**` 差分なし |
| runtime boundary | local typecheck / lint / build / verify-design-tokens / vitest / playwright visual の更新のみ。staging deploy / commit / PR は user-gated |

## Phase 一覧

| Phase | File | 状態 |
| --- | --- | --- |
| 1 | `outputs/phase-1/phase-1.md` | spec_created |
| 2 | `outputs/phase-2/phase-2.md` | spec_created |
| 3 | `outputs/phase-3/phase-3.md` | spec_created |
| 4 | `outputs/phase-4/phase-4.md` | spec_created |
| 5 | `outputs/phase-5/phase-5.md` | spec_created |
| 6 | `outputs/phase-6/phase-6.md` | spec_created |
| 7 | `outputs/phase-7/phase-7.md` | spec_created |
| 8 | `outputs/phase-8/phase-8.md` | spec_created |
| 9 | `outputs/phase-9/phase-9.md` | spec_created |
| 10 | `outputs/phase-10/phase-10.md` | spec_created |
| 11 | `outputs/phase-11/phase-11.md` | local_static_pass_browser_pending |
| 12 | `outputs/phase-12/phase-12.md` | local_static_pass_browser_pending |
| 13 | `outputs/phase-13/phase-13.md` | pending_user_approval |

## 4条件 verdict

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | Google brand 公式色を「外部 brand owner 指定」として exempt path 経由でのみ許可。OKLch token 正本は不変 |
| 漏れなし | PASS | Icon.tsx の `common` 強制回避、icons.ts union からの google 撤去、verify-design-tokens.spec 追加、09b-design-tokens.md 追記、visual baseline 更新、親 workflow / unassigned spec の consumed 反映までスコープ化 |
| 整合性あり | PASS | `local_static_pass_browser_pending` / `VISUAL` / `new` の状態語彙で統一。Gate-A/B/C を pending 雛形配置 |
| 依存関係整合 | PASS | API / D1 / Auth.js handler / OKLch token 値は不変。staging deploy + PR は Phase 13 user-gated |
