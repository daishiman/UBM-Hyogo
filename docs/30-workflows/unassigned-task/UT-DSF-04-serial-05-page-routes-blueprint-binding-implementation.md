# UT-DSF-04: serial-05 19 routes blueprint binding 実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-DSF-04 |
| タスク名 | serial-05 19 routes 全 page.tsx の 09e/f/g blueprint binding |
| 優先度 | HIGH |
| 推奨Wave | Wave 2 |
| 状態 | unassigned |
| 作成日 | 2026-05-19 |
| 既存タスク組み込み | あり |
| 組み込み先 | ui-prototype-design-system-foundation / serial-05-page-routes-blueprint-binding |

## 目的

`apps/web/app/` 配下 19 routes 全 page.tsx を、
`docs/00-getting-started-manual/specs/09e/f/g-screen-blueprints-*.md` の blueprint section と
1:1 で照合した状態に編集する。既存 primitive / feature component のみで構成し、
Server Component を既定、interactivity が必要な部分のみ `.client.tsx` boundary で wrap する。

19 routes は SCOPE.md / PROTOTYPE-COVERAGE.md の `current_app_path` を正本とする。

## スコープ

### 含む

- 19 routes 全 page.tsx の編集（公開 6 + 会員 2 + 管理 8 + 共通 3）:
  - 公開: `/`, `/(public)/members`, `/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms`
  - 会員: `/login`, `/profile` （root 配下のまま）
  - 管理: `/(admin)/admin`, `/(admin)/admin/{members,tags,meetings,schema,requests,identity-conflicts,audit}`
  - 共通: `error.tsx`, `not-found.tsx`, `loading.tsx`（UT-DSF-03 と整合確認のみ）
- 各 page.tsx の primitive / feature component 組み合わせを 09e/f/g blueprint と 1:1 一致
- Server Component 既定 / `.client.tsx` boundary の最小化
- データ取得は既存 API client（`apps/web/src/lib/api/`, `apps/web/src/lib/admin/`, `apps/web/src/lib/auth/`）経由のみ
- プロトタイプ未掲載画面（`/(admin)/admin/{schema,requests,identity-conflicts,audit}`, `/register`, `/privacy`, `/terms`）も既存 primitives のみで構成

### 含まない

- 新規 API endpoint 追加（`apps/api/src/routes/` diff 0）
- 新規 primitive 追加（`apps/web/src/components/ui/` diff 0）
- D1 schema 変更 / Google Form 仕様変更
- Form response → MemberDetail 描画接続（UT-DSF-05 の責務）
- `(member)` route group への `/profile` / `/login` 物理移送
- `app/(admin)/admin/dashboard/attendance/page.tsx` / `app/(admin)/admin/meetings/[id]/page.tsx` の DoD 含める
  （build green は確保するが scope 外）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 前提 | UT-DSF-01（parallel-01 globals.css） | `data-section` / `data-card` / `data-text` selector が cascade で利く |
| 前提 | parallel-02-prototype-css-rules-port（local 実装済み） | tag pill / member card hover / visibility marker selector |
| 前提 | UT-DSF-02（parallel-03 AppShell layouts） | 3 route group layout が `data-shell` / `data-route` を満たす |
| 前提 | UT-DSF-03（parallel-04 root chrome） | `<html data-theme="warm">` + fallback chrome が確立 |
| 下流 | UT-DSF-05（serial-06 form response binding） | `/(public)/members/[id]` skeleton route 提供 |
| 下流 | UT-DSF-06（serial-07 regression evidence） | 4 screens visual baseline 対象 |

## 苦戦箇所・知見

**19 routes の `current_app_path` 正本性**: SCOPE.md の URL 表記（`/login` `/profile` `/privacy` `/terms`）と
実 app router の物理配置（root 配下）が乖離する。**実装時は `PROTOTYPE-COVERAGE.md` の `current_app_path` を
最優先**する。`(member)` への移送を行わない（vestigial layout のまま）。

**プロトタイプ未掲載画面の primitive 揃え**: `/(admin)/admin/{schema,requests,identity-conflicts,audit}` /
`/register` / `/privacy` / `/terms` / `/login` / `error` / `not-found` はプロトタイプ JSX に完成形が無い。
既存 `Card` / `KVList` / `Stat` / `EmptyState` / `Hero` / `Prose` 等の primitives のみで構成し、新規 primitive
を生やさない。`PROTOTYPE-COVERAGE.md` の対応表を編集中に参照。

**`(admin)` 配下 8 routes の使い分け**: `Card` / `KVList` / `Stat` の使い分けが blueprint で section 単位に
規定されている。例えば dashboard は KPI cards + 最近のアクティビティ + queue previews（09g §1）、
members は table + drawer + filters（09g §2）。同じ Card primitive を tone 違い（`data-card-tone="panel|surface|emphasis"`）
で使い分ける運用とし、新規 primitive を生やさない。

**Server / Client 境界**: filters / drawer / sort 等は Client Component が必要。`*.client.tsx` suffix と
`"use client"` directive を minimal scope で適用。`page.tsx` 自体は Server Component で fetch のみ行い、
Client Component は受け取った data を render する設計。

**API adapter 不在の場合**: API response shape と blueprint の期待 shape が乖離する場合、本 SW では
adapter を作らず、UT-DSF-05（serial-06）でまとめて吸収する。serial-05 は skeleton + chrome までを担当。

**`127.0.0.1:8888` localhost 焼き込み禁止**: `apps/web/src/` / `apps/web/app/` 配下に localhost endpoint を
直接記載しない。`getEnv()` / `getPublicEnv()` 経由のみ。

**CI gate `verify-design-tokens`**: 19 routes の page.tsx は Tailwind utility 多用箇所。`bg-[#xxx]` /
`text-[#xxx]` / HEX 直書きが 1 つでも残ると fail。

## 受け入れ基準

- [ ] 19 routes 全 page.tsx が 09e/f/g blueprint と 1:1 一致
- [ ] `apps/api/src/routes/` の diff が空（新規 endpoint 0 件）
- [ ] `apps/web/src/components/ui/` の追加なし（新規 primitive 0 件）
- [ ] `apps/web/app/` 配下で `D1Database` / `env.DB` grep 0 件
- [ ] `apps/web/src/` / `apps/web/app/` 配下で `127.0.0.1:8888` grep 0 件
- [ ] `verify-design-tokens` CI gate が green
- [ ] `pnpm typecheck` / `pnpm lint` / `next build --webpack` が exit 0
- [ ] 新規テスト suffix は `*.spec.{ts,tsx}` のみ
- [ ] Phase 11 evidence inventory 物理配置済み

## 参照

正本仕様（Phase 1-13）:

- `docs/30-workflows/ui-prototype-design-system-foundation/serial-05-page-routes-blueprint-binding/phase-01-requirements.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-05-page-routes-blueprint-binding/phase-02-architecture.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-05-page-routes-blueprint-binding/phase-03-task-breakdown.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-05-page-routes-blueprint-binding/phase-04-data-contract.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-05-page-routes-blueprint-binding/phase-05-implementation-guide.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-05-page-routes-blueprint-binding/phase-06-test-strategy.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-05-page-routes-blueprint-binding/phase-07-quality-gates.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-05-page-routes-blueprint-binding/phase-08-dod.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-05-page-routes-blueprint-binding/phase-09-risks.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-05-page-routes-blueprint-binding/phase-10-local-verification.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-05-page-routes-blueprint-binding/phase-11-evidence-inventory.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-05-page-routes-blueprint-binding/phase-12-compliance-check.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-05-page-routes-blueprint-binding/phase-13-commit-pr-draft.md`

参考:

- `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md`
- `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md`
- `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/SCOPE.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/PROTOTYPE-COVERAGE.md`
