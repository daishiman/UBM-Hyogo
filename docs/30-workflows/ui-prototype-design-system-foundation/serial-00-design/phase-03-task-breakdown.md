---
phase: 3
title: タスク分解 — 8 サブワークフローと変更ファイル俯瞰
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-00-design
status: completed
---

# Phase 3 — タスク分解

[実装区分: 実装仕様書]

## 1. サブワークフロー一覧

| ID | ディレクトリ | 種別 | 主変更ファイル | 主要 DoD |
|----|------------|------|---------------|--------|
| SW-01 | `parallel-01-globals-css-rhythm/` | 並列 | `apps/web/src/styles/globals.css` | page background / card / surface / typography が selector で機能 |
| SW-02 | `parallel-02-prototype-css-rules-port/` | 並列 | `apps/web/src/styles/globals.css` | tag pill selected / member card hover / `[data-visibility]` marker が機能 |
| SW-03 | `parallel-03-appshell-layouts/` | 並列 | `apps/web/app/(public)/layout.tsx`, `(admin)/layout.tsx`, `(member)/layout.tsx` | 3 系統で共通 chrome 継承 |
| SW-04 | `parallel-04-shared-page-chrome/` | 並列 | `apps/web/app/layout.tsx`, `error.tsx`, `not-found.tsx`, `loading.tsx` | Root + fallback 完成 |
| SW-05 | `serial-05-page-routes-blueprint-binding/` | 直列（SW-01..04 後） | `apps/web/app/.../page.tsx` × 16 | 19 routes 全 page.tsx が build green |
| SW-06 | `serial-06-form-response-binding/` | 直列（SW-05 後） | `apps/web/app/(public)/members/[id]/page.tsx`, `MemberDetail.tsx` | response_fields が描画される |
| SW-07 | `serial-07-regression-evidence/` | 直列（SW-06 後） | `apps/web/playwright/tests/visual/*.spec.ts`, CI workflow | visual snapshot 4 + verify-design-tokens green |

## 2. 変更ファイル俯瞰（後続 Phase 5/8 の実装ガイド前倒し）

### 2.1 styles 層（SW-01, SW-02）

- `apps/web/src/styles/globals.css` — `@layer components` 拡張
- `apps/web/src/styles/tokens.css` — 変更なし（既存維持）

### 2.2 app 層（SW-03, SW-04, SW-05, SW-06）

> **凡例**: ファイルはすべて `apps/web/app/` 起点。`新規` = repo に未存在で本 workflow で生成、`編集` = repo に既存で本 workflow で改変、`移送` = 既存パスから別パスへ移動して編集。

既存ファイルの編集（SW-04 / SW-05 共通）:
- `apps/web/app/layout.tsx`（編集 — Root chrome 仕様準拠化）
- `apps/web/app/error.tsx`（編集）
- `apps/web/app/not-found.tsx`（編集）
- `apps/web/app/loading.tsx`（編集）

AppShell 層（SW-03）:
- `apps/web/app/(public)/layout.tsx`（編集）
- `apps/web/app/(admin)/layout.tsx`（編集）
- `apps/web/app/(member)/layout.tsx`（編集 — `profile` 配下を chrome 配下に置く設計に整える）

公開 routes（SW-05）:
- `apps/web/app/page.tsx`（編集）
- `apps/web/app/(public)/members/page.tsx`（編集）
- `apps/web/app/(public)/members/[id]/page.tsx`（編集。SW-06 でさらに調整）
- `apps/web/app/(public)/register/page.tsx`（編集）
- `apps/web/app/privacy/page.tsx`（編集）
- `apps/web/app/terms/page.tsx`（編集）

会員 routes（SW-05）:
- `apps/web/app/login/page.tsx`（編集 — 未認証 entry point として root 配下に維持）
- `apps/web/app/profile/page.tsx`（編集 — 既存 root 配下 path を維持し、`_components/` / `error.tsx` / `loading.tsx` / `not-found.tsx` も同階層のまま扱う）

管理 routes（SW-05）:
- `apps/web/app/(admin)/admin/page.tsx`（編集）
- `apps/web/app/(admin)/admin/members/page.tsx`（編集）
- `apps/web/app/(admin)/admin/tags/page.tsx`（編集）
- `apps/web/app/(admin)/admin/meetings/page.tsx`（編集）
- `apps/web/app/(admin)/admin/schema/page.tsx`（編集）
- `apps/web/app/(admin)/admin/requests/page.tsx`（編集）
- `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`（編集）
- `apps/web/app/(admin)/admin/audit/page.tsx`（編集）

> `src/app` はこの repo の現行配置ではない。実装時は `apps/web/app` を正とする。
> `(member)` route group の境界判断は phase-02 §3.1 補足を参照（Clean Architecture / SRP に従い `login` / `profile` とも現行 root path を維持し、`(member)` は将来の member-only routes 用に温存）。

### 2.3 components 層（SW-06 のみ最小新規）

- `apps/web/src/components/public/MemberDetail.tsx` — 新規（既存があれば編集）
- 他 components は既存のものを use site で組み立てるのみ

### 2.4 test 層（SW-07）

> repo 実体の Playwright spec 配置に揃える。`apps/web/playwright.config.ts` の `/visual/` 経路は `apps/web/playwright/tests/visual/` 配下を読む。

- `apps/web/playwright/tests/visual/public-top.spec.ts`（既存パターン踏襲）
- `apps/web/playwright/tests/visual/public-members-list.spec.ts`
- `apps/web/playwright/tests/visual/public-member-detail.spec.ts`
- `apps/web/playwright/tests/visual/admin-dashboard.spec.ts`

## 3. 各サブワークフローの Phase 1-13 構造

各 SW ディレクトリには `phase-01.md` 〜 `phase-13.md` を配置する。Phase 命名:

| Phase | 内容 |
|-------|------|
| Phase 1 | 要件定義（SW スコープ） |
| Phase 2 | アーキテクチャ・設計 |
| Phase 3 | タスク分解 |
| Phase 4 | 入出力・データ契約 |
| Phase 5 | 実装ガイド（具体差分） |
| Phase 6 | テスト方針 |
| Phase 7 | 品質ゲート |
| Phase 8 | DoD / 完了条件 |
| Phase 9 | リスク・代替案 |
| Phase 10 | ローカル検証コマンド |
| Phase 11 | Evidence inventory |
| Phase 12 | Compliance check |
| Phase 13 | Commit / PR draft |

## 4. CONST_007 適合性確認

- 全 7 サブワークフローを後続実装プロンプト 1 サイクル内で完了する
- 先送り・後続フェーズ送り・分離 PR 前提なし
- 各 SW は責務単一・並列/直列の依存関係をディレクトリ名で表現済

## 5. 既存実装の流用方針

- 既存 primitives（`apps/web/src/components/ui/`）13 個は **そのまま流用**
- 既存 feature components（`apps/web/src/components/{public,admin}/`）の MembersTable / MemberDrawer / FormPreviewSections 等は **use site で組み立てるのみ**
- 既存 hooks（`apps/web/src/features/admin/hooks/`）は SW-05 以降で参照のみ
- 既存 `apps/web/src/lib/` の API client / fetch helper を経由

## 6. Phase 1 の不変条件（NFR）を Phase 5 実装規則へ落とす

| NFR | 実装規則 |
|-----|---------|
| OKLch トークン正本性 | `globals.css` / `page.tsx` で HEX / `bg-[#xxx]` を grep gate で 0 件確認 |
| D1 直接アクセス禁止 | `app/` 配下の grep で `D1Database` / `env.DB` 0 件 |
| 新規 API 禁止 | `apps/api/src/routes/` の diff が空であること |
| 新規 primitive 禁止 | `apps/web/src/components/ui/` の追加ファイルなし |
| test suffix | 新規テストは `*.spec.{ts,tsx}` のみ |
