# Phase 5: 実装手順

## 0. 変更ファイル一覧（Feedback RT-03 — 見落とし防止のため必須記載）

| 種別 | パス | 内容 |
|---|---|---|
| **新規作成** | `apps/web/src/components/layout/AdminTopbar.tsx` | topbar primitive 本体（Server Component） |
| **新規作成** | `apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx` | primitive 単体契約 spec（既定描画 / slot 注入 / OKLch / axe） |
| **修正** | `apps/web/app/(admin)/layout.tsx` | inline `<header data-shell="topbar">`（35-46 行）を `<AdminTopbar />` に置換 + import 追加 |
| 無修正（検証のみ） | `apps/web/app/(admin)/layout.spec.tsx` | 既存 data-* 契約 spec が無修正で pass することを確認 |

> web package 名は `@ubm-hyogo/web`。全コマンドは `mise exec -- pnpm ...` 経由で実行（Node 24 / pnpm 10 を保証）。build は `next build --webpack`（OpenNext Workers 互換）。テスト拡張子は `*.spec.tsx` のみ（CLAUDE.md 不変条件 #8。`*.test.*` 禁止）。

## 1. Step 0: 事前確認

```bash
mise exec -- node -v   # v24.15.0 であること

# 抽出対象（inline topbar）が現存することの確認
grep -n 'data-shell="topbar"' "apps/web/app/(admin)/layout.tsx"

# 既存 import 階層の参照（AdminSidebar と同一階層に揃える）
grep -n "AdminSidebar" "apps/web/app/(admin)/layout.tsx"

# AdminTopbar がまだ存在しないことの確認（新規作成のため）
ls apps/web/src/components/layout/AdminTopbar.tsx 2>/dev/null && echo "EXISTS(想定外)" || echo "NOT_FOUND(想定通り)"

# spec 配置先 __tests__/ ディレクトリの存在確認（兄弟 spec があるので既存のはず）
ls apps/web/src/components/layout/__tests__/
```

- `data-shell="topbar"` が `(admin)/layout.tsx` にヒットすること（抽出元が存在する）。
- `AdminTopbar.tsx` が `NOT_FOUND` であること（implementation_mode: `new`）。
- `__tests__/` は `AdminSidebar.component.spec.tsx` / `MemberHeader.spec.tsx` が既存のため存在する想定。万一未存在なら Step 2 で同時作成する。

## 2. Step 1: `apps/web/src/components/layout/AdminTopbar.tsx` 新規作成

Phase 2 §4 の正本スニペットをそのまま作成する（class / token / data-* / 文言「管理」を inline JSX から無改変で移植）。

```tsx
// parallel-03-followup-001 / issue-832: admin AppShell topbar primitive。
// inline JSX（(admin)/layout.tsx）からの抽出。data-shell="topbar" 契約を内部 root に保持。
// Server Component（client boundary なし）。breadcrumb / actions は省略可能 slot。
import type { ReactNode } from "react";

type AdminTopbarProps = {
  readonly breadcrumb?: ReactNode;
  readonly actions?: ReactNode;
};

export function AdminTopbar({ breadcrumb, actions }: AdminTopbarProps = {}) {
  return (
    <header
      className="flex items-center justify-between border-b border-[var(--ubm-color-border-default)] px-4 py-3"
      data-shell="topbar"
    >
      <div
        className="text-sm font-semibold text-[var(--ubm-color-text-primary)]"
        data-component="admin-breadcrumb-slot"
      >
        {breadcrumb ?? "管理"}
      </div>
      {actions === undefined ? (
        <div aria-hidden="true" data-component="admin-topbar-actions" />
      ) : (
        <div data-component="admin-topbar-actions">{actions}</div>
      )}
    </header>
  );
}
```

実装上の不変条件（Phase 2 §4 設計上の決定事項を遵守）:

- destructuring に **default param `= {}`** を付ける（`<AdminTopbar />` 呼び出しを許容 / Phase 3 R-3 対策）。
- **`actions === undefined`** で省略と `null` 注入を区別する。省略時のみ `aria-hidden="true"`（Phase 3 R-2 対策）。
- breadcrumb は **`?? "管理"`** で `undefined` / `null` 両方を既定テキストへフォールバック。
- `"use client"` を付けない（Server Component / 不変条件5）。
- 名前付き export `AdminTopbar`（兄弟 primitive の export 形式に対称）。

## 3. Step 2: `apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx` 新規作成

Phase 4 テスト計画の TC を参照して spec を作成する。`__tests__/` ディレクトリは既存（兄弟 spec が同居）なので、Step 0 の確認で存在を再確認するだけでよい（未存在なら同時作成）。最低限カバーする契約（AC-4 対応）:

| TC | 観点 | 期待 |
|---|---|---|
| TC-1 | props 省略時の既定描画 | root `<header data-shell="topbar">` が出る / breadcrumb slot に「管理」テキスト / actions placeholder に `aria-hidden="true"` |
| TC-2 | `breadcrumb` 注入 | `data-component="admin-breadcrumb-slot"` wrapper は維持され、中身が注入 ReactNode に差し替わる |
| TC-3 | `actions` 注入 | `data-component="admin-topbar-actions"` wrapper から `aria-hidden` が外れ、中身が出る |
| TC-4 | OKLch トークン参照 | className に `border-[var(--ubm-color-border-default)]` / `text-[var(--ubm-color-text-primary)]` が含まれ、HEX 直書きがない |
| TC-5 | axe critical violation | 既定描画の DOM で axe critical 0（`apps/web/src/test/axe.ts` helper を利用） |

> テスト拡張子は `*.spec.tsx`（`*.test.*` は禁止 / CLAUDE.md 不変条件 #8）。`window` を `vi.stubGlobal` で丸ごと差し替えない（happy-dom の `instanceof HTMLElement` 破壊を回避）。

## 4. Step 3: `apps/web/app/(admin)/layout.tsx` 修正

### 3-a. import 追加（AdminSidebar import の隣）

```tsx
import { AdminSidebar } from "../../src/components/layout/AdminSidebar";
import { AdminTopbar } from "../../src/components/layout/AdminTopbar";
```

> relative import 階層は `AdminSidebar` と同一（`../../src/components/layout/AdminTopbar`）。Phase 3 R-4 対策として既存 `AdminSidebar` import 行を grep で確認してから揃える。

### 3-b. inline `<header>` ブロック置換（Phase 2 §5 diff）

before（35-46 行 / `data-shell="topbar"` の `<header>` ブロックで同定。行番号には依存しない）:

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

after:

```tsx
      <AdminTopbar />
```

> ⚠️ Phase 3 R-1: `data-route-group="admin"` / `data-theme="cool"` / `data-testid="admin-shell"` は wrapper `<div>` に、`data-shell="sidebar"` は `<aside>` に、`data-route="admin"` は `<main>` に**残す**。primitive 側へ移さない。置換は `<header data-shell="topbar">` ブロックのみ。

抽出後の grid 構造（Phase 2 §6）— `AdminTopbar` は `<header>` を直接返すので余分な wrapper を増やさず grid 子（row1/col2）として配置する:

```tsx
<div ... data-theme="cool" data-route-group="admin" data-testid="admin-shell"
     className="ubm-admin-shell grid ... md:grid-cols-[272px_1fr] grid-rows-[auto_1fr]">
  <aside ... data-shell="sidebar" className="... md:row-span-2"><AdminSidebar /></aside>
  <AdminTopbar />            {/* ← <header> が row1/col2 に入る */}
  <main ... data-route="admin">{children}</main>
</div>
```

## 5. Step 4: 型・lint チェック

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

エラー / warning があれば最大 3 サイクルで修正する（lint は `pnpm lint --fix` を先に試す）。NFR-3: 0 error / 0 warning。

## 6. Step 5: unit テスト実行

```bash
# 新規 primitive spec
mise exec -- pnpm --filter @ubm-hyogo/web test -- "src/components/layout/__tests__/AdminTopbar.spec.tsx"

# 既存 AppShell 契約 spec が無修正で pass すること（NFR-1 / AC-3）
mise exec -- pnpm --filter @ubm-hyogo/web test -- "app/(admin)/layout.spec.tsx"
```

`layout.spec.tsx` は **無修正**で pass すること（`data-shell="topbar"` / `data-shell="sidebar"` / `data-route="admin"` / `data-theme="cool"` / `data-route-group="admin"` の selector が抽出後も同一 DOM に出現する）。

## 7. Step 6: build 確認（Workers bundle 互換）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build
```

- `next build --webpack` が success すること（NFR-4）。
- `[project]/...` 仮想 module specifier が混入していないことを確認:

```bash
grep -r "\[project\]" apps/web/.open-next | head
# → 空であること
```

- Server Component のため client bundle 増加なし（Phase 2 §8）。

## 8. Step 7: ローカル動作確認（admin session が必要 → Phase 11 に委譲）

`/admin` ルートは auth gate（admin session 必須）の背後にあるため、topbar の実 DOM 目視確認には admin ログインが必要。スクリーンショットを含む VISUAL_ON_EXECUTION 証跡取得は **Phase 11（手動テスト）に委譲**する。Phase 5 では起動が成功し route が解決することのみ確認する。

```bash
mise exec -- bash scripts/with-env.sh pnpm --filter @ubm-hyogo/web dev
# admin session でログインのうえ /admin を開き、topbar の breadcrumb「管理」表示と
# 区切り線（border-b）レイアウトが抽出前と同一であることの目視確認は Phase 11 で実施する。
```

> admin テストアカウントでのログイン手順・スクリーンショット canonical 名は Phase 11 仕様に従う。

## 9. DoD（Definition of Done）— index.md AC-1〜AC-7 対応

- [ ] **AC-1**: `apps/web/src/components/layout/AdminTopbar.tsx` を新規作成。AdminSidebar と対称の props 省略可能 API（`breadcrumb?` / `actions?` + default param `= {}`）を持つ
- [ ] **AC-2**: `(admin)/layout.tsx` から inline `<header data-shell="topbar">` が消え、`<AdminTopbar />` 呼び出しに置換され、import が AdminSidebar の隣に追加されている
- [ ] **AC-3**: `(admin)/layout.spec.tsx` が**無修正**で pass（5 selector の DOM 出現位置不変）
- [ ] **AC-4**: `AdminTopbar.spec.tsx` を新規作成し、TC-1〜TC-5（既定描画 / slot 注入 ×2 / OKLch / axe critical 0）が全 PASS
- [ ] **AC-5**: `pnpm typecheck` / `pnpm lint` PASS（0 error / 0 warning）
- [ ] **AC-6**: HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を導入していない
- [ ] **AC-7**: 新規 primitive / 新規 visual 仕様を導入していない（class / token / 文言は無改変移植）
- [ ] `pnpm --filter @ubm-hyogo/web build` PASS かつ `[project]` 仮想 module 非混入
