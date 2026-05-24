# Phase 1: 要件定義

## 0. 実装区分の判定（CONST_004）

- **判定: 実装仕様書**（コード変更を伴う）。
- 根拠: issue #832 の目的「`<header data-shell="topbar">` を AdminTopbar primitive へ抽出する」は、新規ファイル作成・既存 layout の JSX 置換・新規 spec 追加というコード変更なしには達成不可能。docs-only 例外には該当しない。
- `implementation_mode: new`: current branch（`dev` 先端）に AdminTopbar 実装は未存在。P50 チェックの「current branch に実装が存在する＝No」「upstream マージ済み＝No」のため通常の実装 Phase とする。

## 1. 背景

- parallel-03（AppShell Layouts）で `(public)` / `(member)` / `(admin)` の 3 route group ごとに AppShell を整備し、data-* 契約（`data-theme` / `data-route-group` / `data-shell` / `data-route`）を確立した。
- `AdminSidebar` / `PublicHeader` / `PublicFooter` / `MemberHeader` は primitive 化されたが、admin topbar だけは parallel-03 のスコープ判定で「inline JSX のまま完了形」と deferred 宣言され（`phase-13-commit-pr.md` line 192）、`apps/web/app/(admin)/layout.tsx` 内に `<header data-shell="topbar">` が直書きされている。
- 現状（current branch `0e8272121`）の該当箇所は `apps/web/app/(admin)/layout.tsx` の 35-46 行:

```tsx
<header
  className="flex items-center justify-between border-b border-[var(--ubm-color-border-default)] px-4 py-3"
  data-shell="topbar"
>
  <div
    className="text-sm font-semibold text-[var(--ubm-color-text-primary)]"
    data-component="admin-breadcrumb-slot"
  >
    管理
  </div>
  <div aria-hidden="true" data-component="admin-topbar-actions" />
</header>
```

## 2. 既存コードの命名規則分析（FB-01 / FB-SDK-07-4 対応）

| 観点 | current コードの規則 | 本タスクでの適用 |
|---|---|---|
| primitive ファイル名 | PascalCase `.tsx`（`AdminSidebar.tsx` / `MemberHeader.tsx`） | `AdminTopbar.tsx` |
| export 形式 | 名前付き export（`export function AdminSidebar()`） | `export function AdminTopbar()` |
| 配置ディレクトリ | layout chrome は `components/layout/`（sidebar / member header） | `components/layout/AdminTopbar.tsx` |
| spec ファイル配置 | `components/layout/__tests__/`（`AdminSidebar.component.spec.tsx` / `MemberHeader.spec.tsx`） | `components/layout/__tests__/AdminTopbar.spec.tsx` |
| spec 拡張子 | `*.spec.tsx`（CLAUDE.md 不変条件 #8） | `*.spec.tsx` |
| Server / Client | `AdminSidebar` / `PublicHeader` / `MemberHeader` は no client boundary（`"use client"` なし） | Server Component（client API 不使用） |
| props 設計 | 既存 4 primitive は props ゼロの default-rendering | AdminTopbar は **props 省略可能**（`breadcrumb?` / `actions?`）で既定描画を保つ |

> **命名ズレ検出（FB-01）**: issue #832 body は追加先を `components/admin/` と記載するが、兄弟 primitive `AdminSidebar` は `components/layout/` にある。layout chrome の配置規約に合わせ `components/layout/` を正とする（Phase 2 で設計確定）。

## 3. 機能要件

| ID | 要件 |
|---|---|
| FR-1 | `AdminTopbar` は root に `<header data-shell="topbar">` を描画する Server Component として `apps/web/src/components/layout/AdminTopbar.tsx` に新規追加する |
| FR-2 | props 省略時、parallel-03 時点の既定描画（breadcrumb slot テキスト「管理」 + aria-hidden actions placeholder）を出す（既存 spec 互換） |
| FR-3 | `breadcrumb?: ReactNode` props で breadcrumb slot の中身を差し替えられる。slot wrapper（`data-component="admin-breadcrumb-slot"`）は常に出力する |
| FR-4 | `actions?: ReactNode` props で actions slot の中身を差し替えられる。slot wrapper（`data-component="admin-topbar-actions"`）は常に出力する。actions 省略時のみ `aria-hidden="true"` を付与する |
| FR-5 | `apps/web/app/(admin)/layout.tsx` の inline `<header data-shell="topbar">` を `<AdminTopbar />` 呼び出し 1 行に置換する |
| FR-6 | OKLch トークン参照（`var(--ubm-color-border-default)` / `var(--ubm-color-text-primary)`）を inline JSX からそのまま移植する |

## 4. 非機能要件

| ID | 要件 |
|---|---|
| NFR-1 | `(admin)/layout.spec.tsx`（既存）が**無修正で pass** すること（data-* 契約の DOM 出現位置を変えない） |
| NFR-2 | axe critical violation 0 を維持 |
| NFR-3 | `pnpm typecheck` / `pnpm lint` が 0 error / 0 warning |
| NFR-4 | OpenNext Cloudflare build（`next build --webpack`）に影響を与えない（Server Component のため client bundle 増加なし） |
| NFR-5 | 新規 primitive / 新規 visual 仕様を持ち込まない（CLAUDE.md UI 不変条件3） |

## 5. 受け入れ基準（AC）

- AC-1: `apps/web/src/components/layout/AdminTopbar.tsx` が新規追加され、AdminSidebar と対称な props 省略可能 API を持つ。
- AC-2: `(admin)/layout.tsx` から inline `<header data-shell="topbar">` が消え、`<AdminTopbar />` 呼び出しに置換されている。
- AC-3: `(admin)/layout.spec.tsx` が無修正で pass（`data-shell="topbar"` / `data-shell="sidebar"` / `data-route="admin"` / `data-theme="cool"` / `data-route-group="admin"` の検証維持）。
- AC-4: `apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx` が新規追加され、props 省略時 / 注入時の slot 契約・OKLch トークン参照・axe critical 0 を検証。
- AC-5: `pnpm typecheck` / `pnpm lint` が PASS。
- AC-6: HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を導入していない。
- AC-7: 新規 primitive・新規 visual 仕様を導入していない。

## 6. inventory（変更前の現状把握）

| パス | 状態 | 役割 |
|---|---|---|
| `apps/web/app/(admin)/layout.tsx` | 既存 | admin AppShell。topbar が inline |
| `apps/web/app/(admin)/layout.spec.tsx` | 既存 | AppShell data-* 契約 spec（4 ケース） |
| `apps/web/src/components/layout/AdminSidebar.tsx` | 既存 | sidebar primitive（参照元） |
| `apps/web/src/components/layout/MemberHeader.tsx` | 既存 | header primitive（参照元 / `<header>` 所有パターン） |
| `apps/web/src/components/public/PublicHeader.tsx` | 既存 | header primitive（参照元 / `<header>` 所有パターン） |
| `apps/web/src/test/axe.ts` | 既存 | axe helper（spec で利用） |
| `apps/web/src/styles/tokens.css` | 既存 | OKLch トークン正本 |

## 7. carry-over 確認（前タスク差分）

- `git log --oneline -5` 時点で AdminTopbar 関連 commit はなし。本タスクが初出。
- 依存タスク（parallel-03 AppShell）は完了済み。依存解消タスクは不要。

## 8. スコープ確定

- 含む: AdminTopbar primitive 新規 / `(admin)/layout.tsx` inline JSX 置換 / AdminTopbar 単体 spec 追加 / `(admin)/layout.spec.tsx` の pass 維持確認。
- 含まない: breadcrumb 実データ統合 / actions 具体ボタン / 他 layout 抽出 / 新 token / API・D1 変更（index.md「スコープ外」参照）。
