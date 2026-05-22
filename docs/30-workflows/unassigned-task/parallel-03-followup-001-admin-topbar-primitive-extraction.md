# AdminTopbar primitive 抽出 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------- |
| タスクID     | parallel-03-followup-001-admin-topbar-primitive-extraction                                          |
| タスク名     | (admin)/layout.tsx の inline `<header data-shell="topbar">` を AdminTopbar primitive へ抽出         |
| 分類         | 改善                                                                                                |
| 対象機能     | admin AppShell topbar slot（breadcrumb slot / actions slot）                                        |
| 優先度       | 中                                                                                                  |
| 見積もり規模 | 小規模                                                                                              |
| ステータス   | 未実施                                                                                              |
| 発見元       | parallel-03 Phase 12                                                                                |
| 発見日       | 2026-05-19                                                                                          |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/`
- deferred 宣言: `phase-13-commit-pr.md` line 192「AdminTopbar の primitive 化は本 workflow の必須成果物ではない。parallel-03 では inline JSX の topbar slot を完了形とする」
- 現状実装: `apps/web/app/(admin)/layout.tsx` line 33-44（`<header data-shell="topbar">` の inline JSX）
- 既存 primitive 群（先行整備済み）:
  - `apps/web/src/components/layout/AdminSidebar.tsx`
  - `apps/web/src/components/layout/PublicHeader.tsx`
  - `apps/web/src/components/layout/PublicFooter.tsx`
  - `apps/web/src/components/layout/MemberHeader.tsx`

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

parallel-03 (AppShell Layouts) では `(public)` / `(member)` / `(admin)` の 3 route group ごとに AppShell を整備し、data-* 契約（`data-theme` / `data-route-group` / `data-shell` / `data-route`）を確立した。AdminSidebar / PublicHeader / PublicFooter / MemberHeader は primitive 化されたが、admin topbar は parallel-03 のスコープ判定で「inline JSX のまま完了形」と deferred 宣言され、`(admin)/layout.tsx` 内に header 要素が直書きされている。

### 1.2 問題点・課題

- admin topbar だけ primitive 化されておらず、layout file がプレゼンテーション責務を持つ非対称状態
- 将来 breadcrumb / actions slot に動的内容（パンくず・操作ボタン群）を流し込む際、layout.tsx に JSX が肥大化しやすい
- AdminSidebar と並列の責務粒度に揃わないため、layout primitive の一覧性・テスタビリティが下がる
- vitest spec (`(admin)/layout.spec.tsx`) は data-* 契約検証中心だが、primitive 単体 spec が無いため topbar の class / aria 不変条件を独立に検証できない

### 1.3 放置した場合の影響

- 後続タスク（admin breadcrumb 実装 / topbar action 拡張）で layout.tsx の inline JSX が継続的に肥大化
- primitive 一覧の非対称が CLAUDE.md 不変条件3「プロトタイプ正本順位」を辿る際の参照コストを増やす
- design token / a11y 監査の対象を「primitive を grep」で網羅する運用が破綻

---

## 2. 何を達成するか（What）

### 2.1 目的

`<header data-shell="topbar">` を `apps/web/src/components/layout/AdminTopbar.tsx` に抽出し、`(admin)/layout.tsx` から primitive 呼び出し 1 行に置換する。既存 data-* 契約・OKLch トークン参照・vitest 契約検証を 100% 維持する。

### 2.2 最終ゴール

- `apps/web/src/components/layout/AdminTopbar.tsx` が新規追加され、AdminSidebar と対称な props 設計を持つ
- `(admin)/layout.tsx` の topbar JSX が `<AdminTopbar />`（または slot props 付き呼び出し）1 行に置換
- `(admin)/layout.spec.tsx` の既存 data-* 契約検証が修正なしで pass
- `apps/web/src/components/layout/AdminTopbar.spec.tsx` を新規追加し primitive 単体契約を検証
- axe critical violation 0 を維持

### 2.3 スコープ

#### 含むもの

- AdminTopbar primitive 新規追加（`apps/web/src/components/layout/AdminTopbar.tsx`）
- `(admin)/layout.tsx` の inline JSX 置換
- AdminTopbar 単体 spec 追加
- 既存 `(admin)/layout.spec.tsx` の data-* 契約 pass 維持確認

#### 含まないもの

- breadcrumb 実データ統合（slot は placeholder / children pattern のまま）
- topbar actions の具体ボタン実装（admin 機能側の別タスク）
- design token の改変（OKLch トークンは `tokens.css` 正本のまま）
- 新規 primitive 群の追加（不変条件3「プロトタイプ正本順位」遵守）

### 2.4 成果物

- `apps/web/src/components/layout/AdminTopbar.tsx`
- `apps/web/src/components/layout/AdminTopbar.spec.tsx`
- `apps/web/app/(admin)/layout.tsx` の差分（inline JSX 削除 + primitive 呼び出し）

---

## 3. どのように実装するか（How）

### 3.1 設計方針

- AdminSidebar と同じく **server component / no client boundary** で実装（layout.tsx が server component のため）
- data-* 契約の付与位置: **primitive 内部の root `<header>` に `data-shell="topbar"` を付与**。`data-route-group="admin"` は wrapper 側（layout.tsx の `<div>`）に残す（route group 識別は AppShell wrapper 責務）
- props 設計（最小 API）:
  ```ts
  type AdminTopbarProps = {
    readonly breadcrumb?: ReactNode; // 既定: テキスト「管理」
    readonly actions?: ReactNode;    // 既定: aria-hidden placeholder
  };
  ```
  - 既存 inline JSX の `<div data-component="admin-breadcrumb-slot">管理</div>` と `<div aria-hidden="true" data-component="admin-topbar-actions" />` を slot として外出し
  - props 省略時は parallel-03 時点の既定描画を保つ（既存 spec 互換）
- OKLch トークン参照（`var(--ubm-color-*)`）は inline JSX からそのまま移植

### 3.2 変更ファイル一覧

| ファイル                                              | 種別       | 内容                                          |
| ----------------------------------------------------- | ---------- | --------------------------------------------- |
| `apps/web/src/components/layout/AdminTopbar.tsx`      | 新規追加   | primitive 本体                                |
| `apps/web/src/components/layout/AdminTopbar.spec.tsx` | 新規追加   | primitive 単体契約 spec                       |
| `apps/web/app/(admin)/layout.tsx`                     | 既存変更   | inline `<header>` を `<AdminTopbar />` に置換 |

### 3.3 置換イメージ

before（`(admin)/layout.tsx` 33-44 行）:

```tsx
<header className="..." data-shell="topbar">
  <div className="..." data-component="admin-breadcrumb-slot">管理</div>
  <div aria-hidden="true" data-component="admin-topbar-actions" />
</header>
```

after:

```tsx
<AdminTopbar />
```

---

## 4. 苦戦箇所・将来の留意点（重要）

parallel-03 実装中に observed した点を後続が即解決できるよう残す。

### 4.1 data-* 契約の付与位置判断

- `data-shell="topbar"` は **primitive 内部 root** が正解（shell slot 識別は primitive 責務）
- `data-route-group="admin"` は **wrapper 側に残す**（route group は AppShell scope）
- `data-component="admin-breadcrumb-slot"` / `data-component="admin-topbar-actions"` は **primitive 内部に保持**（slot 識別は primitive 内部 DOM）
- 誤って primitive の wrapper 側に `data-route-group` を移すと `(admin)/layout.spec.tsx` の AppShell 検証が壊れる

### 4.2 既存 primitive API 不変条件との整合

- AdminSidebar / PublicHeader / PublicFooter / MemberHeader は props 省略可能な default-rendering を保つ設計
- AdminTopbar も同パターンに揃え、props 省略時に parallel-03 既定描画（テキスト「管理」 + aria-hidden actions placeholder）を出すこと
- props 命名は `breadcrumb` / `actions`（slot pattern を将来 children/slot で受けやすい命名）

### 4.3 vitest spec の data-* 契約維持

- `(admin)/layout.spec.tsx` は `data-shell="topbar"` / `data-component="admin-breadcrumb-slot"` / `data-component="admin-topbar-actions"` の存在を assert している想定
- primitive 抽出後も同 selector が DOM に出現する必要があり、付与位置を変えないこと
- primitive 単体 spec では「props 省略時の既定描画」「props 注入時の slot 反映」「OKLch トークン class の存在」を独立検証する

### 4.4 server component 境界

- `(admin)/layout.tsx` は `async` server component で `getSession()` を呼ぶ
- AdminTopbar に client-only API（onClick / useState 等）を持ち込まないこと（持ち込むと layout 全体 client 境界に巻き込む）
- 将来 actions slot に client button を入れる場合は呼び出し側で `"use client"` boundary を作る

### 4.5 プロトタイプ正本順位（CLAUDE.md 不変条件3）

- `docs/00-getting-started-manual/claude-design-prototype/` の primitives + tokens + rhythm を参照
- 新規 primitive 「ではない」ことに注意（parallel-03 で既に inline 実装済みのものを抽出する作業）
- 新規 visual 仕様を持ち込まない（color / spacing / typography は既存 inline JSX のトークン参照を踏襲）

---

## 5. テスト戦略

### 5.1 Unit (primitive 単体)

`apps/web/src/components/layout/AdminTopbar.spec.tsx` で以下を assert:

- props 省略時に `data-shell="topbar"` を持つ `<header>` が描画される
- 既定 breadcrumb スロットがテキスト「管理」を含む
- 既定 actions スロットが `aria-hidden="true"` を持つ
- `breadcrumb` props 注入時に slot DOM が置換される
- `actions` props 注入時に slot DOM が置換される
- OKLch トークン class（`bg-[var(--ubm-color-*)]` 系）が root に付与される

### 5.2 Integration (layout)

- 既存 `apps/web/app/(admin)/layout.spec.tsx` を **無修正で pass** させる
- AppShell wrapper の `data-route-group="admin"` / `data-theme="cool"` / `data-route="admin"` が引き続き検出可能

### 5.3 a11y

- `axe` critical violation 0 を維持（既存 axe spec があれば流用、無ければ primitive spec 内で `@axe-core/react` または手動 role 検証）

### 5.4 検証コマンド

```bash
mise exec -- pnpm --dir apps/web exec vitest run src/components/layout/AdminTopbar.spec.tsx
mise exec -- pnpm --dir apps/web exec vitest run app/\(admin\)/layout.spec.tsx
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

---

## 6. 受け入れ条件（DoD）

- **AC-1**: `apps/web/src/components/layout/AdminTopbar.tsx` が新規追加され、AdminSidebar と対称な props 省略可能 API を持つ
- **AC-2**: `(admin)/layout.tsx` から inline `<header data-shell="topbar">` が消え、`<AdminTopbar />` 呼び出しに置換されている
- **AC-3**: `(admin)/layout.spec.tsx` が無修正で pass（data-* 契約維持）
- **AC-4**: `AdminTopbar.spec.tsx` が新規追加され、props 省略時 / 注入時の slot 契約と OKLch トークン参照を検証
- **AC-5**: `pnpm typecheck` / `pnpm lint` が 0 error / 0 warning
- **AC-6**: axe critical violation 0 を維持
- **AC-7**: 新規 primitive・新規 visual 仕様を導入していない（不変条件3 遵守）
- **AC-8**: HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を導入していない（不変条件2 OKLch トークン正本化）

---

## 7. 関連 path / refs

- 親 workflow: `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/`
- deferred 根拠: `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-13-commit-pr.md` line 192
- 現状実装: `apps/web/app/(admin)/layout.tsx` line 33-44
- 既存 primitive 参考: `apps/web/src/components/layout/AdminSidebar.tsx`
- design token 正本: `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md`
- プロトタイプ正本: `docs/00-getting-started-manual/claude-design-prototype/`
- CLAUDE.md「UI prototype alignment / MVP recovery」§不変条件 2「OKLch トークン正本化」/ §不変条件 3「プロトタイプ正本順位」
