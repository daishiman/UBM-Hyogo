# [#895] "[parallel-03-followup-004-admin-topbar-actions-buttons] AdminTopbar の `actions` slot に admin グローバル操作ボタン群を流し込む（client island 経由）"

## メタ情報

```yaml
task_id: parallel-03-followup-004-admin-topbar-actions-buttons
task_name: AdminTopbar の `actions` slot に admin グローバル操作ボタン群を流し込む（client island 経由）
category: 改善
target_feature: admin AppShell topbar の actions slot（全 admin 画面共通のグローバル操作）
priority: 低
scale: 小規模
status: unassigned（未着手）
source_phase: parallel-03-followup-001 Phase 12（スコープ外として明示 deferred された topbar actions 具体ボタン実装）
created_date: 2026-05-23
dependencies: []
spec_path: docs/30-workflows/unassigned-task/parallel-03-followup-004-admin-topbar-actions-buttons.md
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | unassigned（未着手） |

---
## Canonical Workflow Status

- 親 followup: `docs/30-workflows/parallel-03-followup-001-admin-topbar-primitive-extraction/`
- deferred 根拠: parallel-03-followup-001 の §2.3「含まないもの」line 79「topbar actions の具体ボタン実装（admin 機能側の別タスク）」/ §4.4「将来 actions slot に client button を入れる場合は呼び出し側で `"use client"` boundary を作る」
- 現状実装: AdminTopbar primitive は抽出済み（`apps/web/src/components/layout/AdminTopbar.tsx`）。`actions?: ReactNode` slot を持つが、`(admin)/layout.tsx` では `<AdminTopbar />`（props なし）で呼ばれ、actions slot は空（`aria-hidden="true"` placeholder）。
- 既存 client island 参考: `apps/web/src/components/auth/SignOutButton.tsx`（`"use client"` + `signOut()` の小さな island、既に Button primitive を流用）。
- page-level 操作の受け皿（既存・本タスク対象外）: `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx` の `actions?: ReactNode` slot。

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

parallel-03-followup-001 で admin topbar は inline JSX から `AdminTopbar` primitive へ抽出され、`breadcrumb` / `actions` の 2 slot を持つ props 設計になった。`actions` slot は将来のグローバル操作ボタン群を受ける受け皿として用意されたが、followup-001 のスコープでは「topbar actions の具体ボタン実装は admin 機能側の別タスク」と明示的に deferred された。結果、現状 `(admin)/layout.tsx` は `<AdminTopbar />`（props なし）で呼ばれ、actions slot は中身が空の `aria-hidden="true"` placeholder のままになっている。

### 1.2 問題点・課題

- 全 admin 画面共通の操作導線（ログアウト等）が topbar に集約されておらず、admin shell の上部右側が常に空白の placeholder（`<div aria-hidden="true" data-component="admin-topbar-actions">` に children なし）
- グローバル操作（ログアウト導線など）の置き場所が定まっておらず、各 admin ページの `AdminPageHeader` actions（=ページ固有操作）と責務が曖昧なまま放置されると、ページごとにログアウト等のグローバル操作が重複実装されるリスク
- AdminTopbar 自体は Server Component で、actions に client 操作（onClick / useState）を入れる方法が「呼び出し側で client island を作る」という設計上の含意でしかなく、実体（実装サンプル）が存在しないため後続が迷いやすい

### 1.3 放置した場合の影響

- admin グローバル操作の集約先が決まらず、ページ固有操作（AdminPageHeader actions）にグローバル操作が紛れ込み、責務境界が崩れる
- topbar 右側の空 placeholder が UI 上の「未完成感」として残り続ける
- 後続が actions slot に client button を入れる際、Server Component 境界の壊し方（AdminTopbar を誤って client 化する等）を再発見しなければならず、followup-001 §4.4 の知見が活かされない

---

## 2. 何を達成するか（What）

### 2.1 目的

`AdminTopbar` の `actions` slot に、全 admin 画面共通のグローバル操作ボタン群を流し込む。`(admin)/layout.tsx`（Server Component）の境界を壊さず、操作ボタンは呼び出し側で作る小さな client island として `actions` props に渡す。MVP では既存導線（ログアウト等）の集約を現実的なスコープとする。

### 2.2 最終ゴール

- `(admin)/layout.tsx` の `<AdminTopbar />` 呼び出しが `<AdminTopbar actions={<AdminTopbarActions />} />` に変わり、topbar 右側にグローバル操作ボタン群が描画される
- `actions` 注入により AdminTopbar 内部の `<div data-component="admin-topbar-actions">` が `aria-hidden` 解除（`undefined`）状態になり、実際に操作可能なボタンを含む
- グローバル操作（topbar actions）と ページ固有操作（AdminPageHeader actions）の責務境界が設計方針として明文化される
- AdminTopbar は Server Component のまま（client 化しない）
- 既存 `(admin)/layout.spec.tsx` の data-* 契約が維持される
- axe critical violation 0 を維持

### 2.3 スコープ

#### 含むもの

- admin グローバル操作 client island component の新規追加（例: `apps/web/src/features/admin/components/_layout/AdminTopbarActions.tsx`、`"use client"`）
- `(admin)/layout.tsx` の `<AdminTopbar />` を `<AdminTopbar actions={...} />` に置換
- MVP グローバル操作として既存ログアウト導線（`SignOutButton`）の集約
- AdminTopbarActions の単体 spec 追加
- topbar actions（グローバル）と AdminPageHeader actions（ページ固有）の責務境界をコメント / spec で明示

#### 含まないもの

- AdminTopbar primitive 自体の props / DOM 変更（followup-001 で確定済みの slot 契約をそのまま使う）
- 新規 UI primitive の追加（不変条件3「プロトタイプ正本順位」遵守。ボタンは既存 `apps/web/src/components/ui/` を流用）
- 新規 API endpoint 追加 / D1 schema 変更 / Google Form 仕様変更（不変条件: 既存 API のみ接続）
- 通知ベル等で新規データ取得が必要な操作のうち、既存 endpoint surface に存在しないものの実装（別タスク化）
- AdminPageHeader actions（ページ固有操作）の変更
- design token の改変（OKLch トークンは `tokens.css` 正本のまま）

### 2.4 成果物

- `apps/web/src/features/admin/components/_layout/AdminTopbarActions.tsx`（新規・client island）
- `apps/web/src/features/admin/components/_layout/__tests__/AdminTopbarActions.spec.tsx`（新規・単体 spec）
- `apps/web/app/(admin)/layout.tsx` の差分（`actions` props 注入）

---

## 3. どのように実装するか（How）

### 3.1 設計方針

- **責務境界の明示（最重要論点）**:
  - **topbar actions（グローバル操作）**: 全 admin 画面で共通の操作。ページに依存しない。MVP ではログアウト導線の集約。将来: 通知ベル / クイックアクション / ユーザーメニュー等（ただし既存 endpoint で実現可能なもののみ）。
  - **AdminPageHeader actions（ページ固有操作）**: そのページ固有の操作（例: members 画面の「新規追加」、tags 画面の「タグ作成」）。`apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx` の `actions` slot が受ける。
  - 両者を重複させない。グローバル操作を AdminPageHeader に入れない / ページ固有操作を topbar に入れない。
- **client boundary の扱い**: AdminTopbar は Server Component（`(admin)/layout.tsx` が `async` server component で `getSession()` を呼ぶ）。actions に onClick / useState を持つボタンを入れるため、**AdminTopbar 自体は client 化せず**、呼び出し側で `"use client"` の小さな island component（`AdminTopbarActions`）を作って `actions` props に渡す（followup-001 §4.4 の方針を踏襲）。
- **既存資産の流用**: ログアウトは既存 client island `apps/web/src/components/auth/SignOutButton.tsx` をそのまま再利用（`signOut()` ベース、Button primitive 流用済み）。`AdminTopbarActions` はこの SignOutButton をラップする薄い container とする。
- **既存 primitive のみ**: ボタンは `apps/web/src/components/ui/Button.tsx` を流用。新規 primitive を生やさない（不変条件3）。色は `var(--ubm-color-*)` のみ。HEX / `bg-[#xxx]` / `text-[#xxx]` 禁止（不変条件2）。
- **既存 API のみ**: ログアウトは next-auth `signOut()`（既存 `app/api/auth/[...nextauth]/route.ts` 経路）。新規 endpoint は追加しない。新規データ取得を伴う操作（通知件数等）は既存 endpoint surface に存在しない限りスコープ外。

### 3.2 変更ファイル一覧

| ファイル                                                                                  | 種別     | 内容                                                                  |
| ----------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------- |
| `apps/web/src/features/admin/components/_layout/AdminTopbarActions.tsx`                   | 新規追加 | `"use client"` グローバル操作 island（MVP: SignOutButton を集約）     |
| `apps/web/src/features/admin/components/_layout/__tests__/AdminTopbarActions.spec.tsx`    | 新規追加 | island 単体契約 spec                                                  |
| `apps/web/app/(admin)/layout.tsx`                                                          | 既存変更 | `<AdminTopbar />` を `<AdminTopbar actions={<AdminTopbarActions />} />` に置換 |

### 3.3 実装イメージ

`AdminTopbarActions.tsx`（client island・呼び出し側で作る）:

```tsx
"use client";

import type { ReactElement } from "react";
import { SignOutButton } from "../../../../components/auth/SignOutButton";

// admin 全画面共通のグローバル操作のみをここに集約する。
// ページ固有操作は AdminPageHeader の actions slot を使うこと（責務境界）。
export function AdminTopbarActions(): ReactElement {
  return (
    <div className="flex items-center gap-2" data-testid="admin-topbar-actions-island">
      {/* MVP: グローバル導線はログアウトのみ集約。将来の通知ベル等は既存 API がある場合のみ追加。 */}
      <SignOutButton size="sm" variant="ghost" redirectTo="/login" />
    </div>
  );
}
```

> `SignOutButton` は既に `ButtonProps`（`size` / `variant`）を透過する Button primitive ベース。topbar 用に `size="sm"` 等を渡すかは visual 確認で調整。

`(admin)/layout.tsx`（Server Component 境界は維持）:

```tsx
import { AdminTopbarActions } from "../../src/features/admin/components/_layout/AdminTopbarActions";
// ...
<AdminTopbar actions={<AdminTopbarActions />} />
```

> AdminTopbar 自体は import / 型変更不要。`actions` に client component を渡すと、AdminTopbar 内部の `aria-hidden={hasActions ? undefined : "true"}` が `undefined`（解除）になる。

---

## 4. 苦戦箇所・将来の留意点（重要）

後続が即解決できるよう具体的に残す。

### 4.1 Server Component 境界を壊さない client island の作り方

- `(admin)/layout.tsx` は `async` server component で `getSession()` / `redirect()` を呼ぶ。ここに `"use client"` を付けると認証ガードが client 側に漏れ、設計が壊れる。**絶対に layout.tsx を client 化しない。**
- AdminTopbar も Server Component のまま（followup-001 §4.4）。AdminTopbar に `"use client"` を付けない / onClick・useState を直接持ち込まない。
- 解決パターン: client 操作は **`actions` props に渡す独立 component（`AdminTopbarActions`）側だけに閉じ込める**。Server Component から Client Component を `props.children` / props 経由で渡すのは Next.js App Router で合法（server が client を子として描画できる）。
- 注意: `AdminTopbarActions` を `app/(admin)/` 配下ではなく `src/features/admin/components/_layout/` に置く（layout.tsx の import 元が混在しないよう、既存 AdminPageHeader と同じ feature 配置に揃える）。

### 4.2 `aria-hidden` placeholder の解除と a11y 検証

- 現実装の AdminTopbar は `aria-hidden={hasActions ? undefined : "true"}`。`actions` を渡すと `hasActions === true` になり `aria-hidden` が `undefined`（DOM から属性消失）になる。
- これは「actions が注入されたら placeholder ではなく操作可能領域になる」という挙動。spec で **「actions 注入時に `data-component="admin-topbar-actions"` 要素が `aria-hidden` を持たないこと」** と **「内部に操作可能な button（accessible name 付き）が存在すること」** を assert する。
- 空でないことの a11y 検証: ログアウトボタンが accessible name（`aria-label="ログアウト"` を SignOutButton が付与済み）を持つことを確認。`aria-hidden` 領域内に focusable 要素を残さない（解除されているので問題ないが、回帰防止で assert）。

### 4.3 topbar / page header の actions 役割分担を曖昧にしない

- topbar actions = グローバル（全 admin 共通）。AdminPageHeader actions = ページ固有。**この境界を component 冒頭コメントと spec の説明に明記する**（3.1 設計方針の通り）。
- 後続が「members 画面の新規追加ボタン」を topbar に置こうとするのはアンチパターン。ページ固有操作は必ず各ページの AdminPageHeader actions へ。
- 逆に「ログアウト」を各ページの AdminPageHeader に置くのもアンチパターン。グローバル導線は topbar に一本化。

### 4.4 OKLch トークン正本化（不変条件2）

- ボタンの色指定は既存 Button primitive（`ui-button-*` class）と `var(--ubm-color-*)` のみ。
- HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を新規導入しない。`AdminTopbarActions` の wrapper class は layout 用途（`flex items-center gap-2` 等）に限定し、色 utility を直書きしない。
- CI gate `verify-design-tokens`（task-18）が HEX / arbitrary color を fail 判定する点に留意。

### 4.5 既存 API のみ接続（不変条件: 既存 API のみ / D1 直接アクセス禁止）

- ログアウトは next-auth `signOut()`（既存経路）。新規 endpoint を追加しない。
- 通知ベル等で件数取得が必要になる将来拡張は、`apps/api/src/routes/` の **既存 endpoint surface に該当 API がある場合のみ**実装可能。無ければ別タスク（API 追加タスク）として切り出す。
- `apps/web` から D1 binding への直接アクセスは禁止（不変条件5）。データ取得が必要なら既存 API 経由のみ。
- API 変更が必要な操作はこのタスクのスコープ外＝別タスク化する。

---

## 5. テスト戦略

### 5.1 Unit (island 単体)

`apps/web/src/features/admin/components/_layout/__tests__/AdminTopbarActions.spec.tsx` で以下を assert:

- `AdminTopbarActions` を描画すると、accessible name「ログアウト」を持つ button が 1 つ存在する（`getByRole("button", { name: "ログアウト" })`）
- wrapper に HEX 直書き / arbitrary color class が含まれない（色は Button primitive / `var(--ubm-color-*)` 経由）
- グローバル操作のみを含み、ページ固有操作（例: 「新規追加」ラベル button）を含まない（責務境界の回帰防止 assert）

### 5.2 Integration (layout / topbar slot)

- `apps/web/app/(admin)/layout.tsx` で `<AdminTopbar actions={<AdminTopbarActions />} />` に置換後、AdminTopbar 内部 `data-component="admin-topbar-actions"` 要素が **`aria-hidden` を持たない**（actions 注入で解除）ことを検証
- 既存 `apps/web/app/(admin)/layout.spec.tsx` の data-* 契約（`data-shell="topbar"` / `data-route-group="admin"` / `data-theme="cool"` / `data-route="admin"`）が **無修正で pass** すること
- AdminTopbar primitive 自体の spec（`apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx`、followup-001 で追加）が無修正で pass すること

### 5.3 a11y

- `axe` critical violation 0 を維持
- topbar actions 領域に focusable 要素（ログアウトボタン）が存在し、`aria-hidden` 配下に閉じ込められていないこと（4.2 の挙動を検証）
- ログアウトボタンが accessible name を持つこと

### 5.4 検証コマンド

```bash
mise exec -- pnpm exec vitest run apps/web/src/features/admin/components/_layout/__tests__/AdminTopbarActions.spec.tsx
mise exec -- pnpm --dir apps/web exec vitest run app/\(admin\)/layout.spec.tsx
mise exec -- pnpm exec vitest run apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

---

## 6. 受け入れ条件（DoD）

- **AC-1**: `apps/web/src/features/admin/components/_layout/AdminTopbarActions.tsx` が新規追加され、`"use client"` の island として MVP グローバル操作（ログアウト導線）を集約する
- **AC-2**: `(admin)/layout.tsx` が `<AdminTopbar actions={<AdminTopbarActions />} />` に置換され、AdminTopbar / layout.tsx いずれも client 化していない（Server Component 境界維持）
- **AC-3**: AdminTopbar 内部 `data-component="admin-topbar-actions"` が actions 注入により `aria-hidden` を持たず、内部に accessible name 付き button を含む
- **AC-4**: topbar actions（グローバル）と AdminPageHeader actions（ページ固有）の責務境界が component コメント / spec に明記され、グローバル操作とページ固有操作が重複していない
- **AC-5**: `AdminTopbarActions.spec.tsx` が新規追加され、ログアウト button 存在 / 責務境界 / トークン遵守を検証
- **AC-6**: 既存 `(admin)/layout.spec.tsx` および `AdminTopbar.spec.tsx` が無修正で pass（data-* 契約・slot 契約維持）
- **AC-7**: `pnpm typecheck` / `pnpm lint` が 0 error / 0 warning
- **AC-8**: axe critical violation 0 を維持
- **AC-9**: 新規 UI primitive を導入していない（ボタンは既存 `apps/web/src/components/ui/` 流用、不変条件3）
- **AC-10**: HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を導入していない（不変条件2 OKLch トークン正本化）
- **AC-11**: 新規 API endpoint / D1 直接アクセスを追加していない（既存 API のみ接続。API 変更が必要な操作はスコープ外として別タスク化を明記）

---

## 7. 関連 path / refs

- 親 followup（primitive 抽出）: `docs/30-workflows/parallel-03-followup-001-admin-topbar-primitive-extraction/`
- deferred 根拠: `docs/30-workflows/unassigned-task/parallel-03-followup-001-admin-topbar-primitive-extraction.md` §2.3「含まないもの」/ §4.4「server component 境界」
- AdminTopbar primitive 本体: `apps/web/src/components/layout/AdminTopbar.tsx`（`actions?: ReactNode` slot / `aria-hidden={hasActions ? undefined : "true"}`）
- 注入先 layout: `apps/web/app/(admin)/layout.tsx` line 36（`<AdminTopbar />`）
- ページ固有操作の受け皿（責務境界の対）: `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx` の `actions` slot
- 既存 client island 参考: `apps/web/src/components/auth/SignOutButton.tsx`（`"use client"` + `signOut()` + Button primitive 流用）
- 既存 UI primitive: `apps/web/src/components/ui/Button.tsx`
- 認証 endpoint（既存・新規追加不可）: `apps/web/app/api/auth/[...nextauth]/route.ts`
- design token 正本: `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md`
- プロトタイプ正本: `docs/00-getting-started-manual/claude-design-prototype/`
- CLAUDE.md「UI prototype alignment / MVP recovery」§不変条件 1「既存 API のみ接続」/ §不変条件 2「OKLch トークン正本化」/ §不変条件 3「プロトタイプ正本順位（新規 primitive 禁止）」/ §不変条件 4「D1 直接アクセス禁止」
