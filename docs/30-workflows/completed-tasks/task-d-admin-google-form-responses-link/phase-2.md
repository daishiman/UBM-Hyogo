# Phase 2: 設計

## 目的

サイドバー primitive `SidebarNavItem` が **内部 `<Link href>` 専用**である制約に対し、
`ShellNavItem` に `external?: boolean` を追加して 1 項目として nav に並べ、external 時のみ
`<a target="_blank" rel="noopener noreferrer">` を描画する設計を、実コードのシグネチャに整合させて固定する。

## 設計判断（2 案比較・採用=案A）

サイドバーは `SidebarNavItem.tsx` が内部 Next.js `<Link href>` 専用で、外部 URL の `target="_blank"` を
描画できなかった。外部リンク配置を 2 案で比較する。

### 案A（採用）: `ShellNavItem.external?` を追加しサイドバーに 1 項目として並べる

- `ShellNavItem` に optional `external?: boolean` を追加。
- `SidebarNavItem.tsx` で `item.external` のとき `<Link>` の代わりに `<a href target="_blank" rel="noopener noreferrer">` を描画する分岐を追加（`RegisterCallout.tsx` の既存外部リンクパターンと同形）。
- `buildAdminGroup` の admin nav 配列末尾（`audit` の後）に Form 項目を追加。
- 外部 icon を `PATHS` に 1 つ追加。

**長所**: サイドバーの並び・余白・icon・collapsed 挙動が他 admin 項目と完全一致。`buildNavForRole` の純関数テストで検証可能。
**短所**: `ShellNavItem` / `ShellNavItemId` / icon `PATHS` / `SidebarNavItem` の 4 箇所へ変更が波及。union 拡張と active 判定除外の影響を明示する必要。

### 案B（不採用）: admin layout footer に独立 `<a>` を別配置

**長所**: 影響範囲が局所的。**短所**: nav 群と視覚分離して「管理メニューの一部」と認知されにくい。collapsed 追従・余白整合を別実装し、新規 primitive を生やす懸念（不変条件と衝突）。

### 採用根拠（landed 実装と一致）

サイドバーの一貫性と既存 primitive 再利用を優先し **案A を採用**。dev landed 実装は案A で実装済み。

## 変更レイヤと責務（状態所有権）

| レイヤ | ファイル | 責務 | 変更種別 |
| --- | --- | --- | --- |
| 定数 | `apps/web/src/lib/constants/form.ts` | `FORM_RESPONSES_EDIT_URL` 提供（hardcode 禁止の単一参照点） | 編集 |
| nav config | `apps/web/src/components/shell/shell-config.ts` | `ShellNavItemId` union 拡張 / `ShellNavItem.external?` / `buildAdminGroup` 項目追加 | 編集 |
| icon | `apps/web/src/components/shell/icons.tsx` | `PATHS` に `form-responses` path 追加（網羅型整合） | 編集 |
| 描画 | `apps/web/src/components/shell/SidebarNavItem.tsx` | `external` 分岐で `<a target="_blank">` 描画 + active 除外 | 編集 |
| route / layout | `apps/web/src/app/(admin)/**` | — | **変更なし** |
| D1 / API / Form | — | — | **変更なし** |

## インターフェース設計（実コード verbatim 反映・dev landed）

### 1. 定数（`constants/form.ts`）

```ts
// CLAUDE.md 固定値 — Google Form 編集/回答一覧 URL。
export const FORM_RESPONSES_EDIT_URL =
  "https://docs.google.com/forms/d/119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg/edit" as const;
```

> formId 部分は CLAUDE.md「フォーム固定値」`formId = 119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` と一致。

### 2. nav config（`shell-config.ts`）

```ts
import { FORM_RESPONSES_EDIT_URL } from "../../lib/constants/form";

export type ShellNavItemId =
  | "home" | "directory" | "register" | "profile" | "dashboard"
  | "attendance" | "members" | "tag-queue" | "schema" | "meeting"
  | "requests" | "identity" | "audit"
  | "form-responses"; // 追加: Google Form 回答一覧（外部リンク）

export interface ShellNavItem {
  readonly id: ShellNavItemId;
  readonly href: string;
  readonly label: string;
  readonly icon: ShellNavItemId;
  readonly badge?: { readonly tone: ShellNavBadgeTone; readonly count: number };
  /** true のとき外部サイトへ別タブ遷移する <a target="_blank">。既定（未指定）は内部 <Link>。 */
  readonly external?: boolean;
}
```

`buildAdminGroup` の `items` 配列末尾（`audit` の後）:

```ts
{
  id: "form-responses",
  href: FORM_RESPONSES_EDIT_URL,
  label: "Form回答",
  icon: "form-responses",
  external: true,
},
```

> `ShellNavItemId` に id を足すと、網羅型 `PATHS: Record<ShellNavItemId, string>` に当該キーがない限り型エラー
> （icon 追加が型レベルで必須）。`appliedQuery` 等の外部 surface には影響しない。

### 3. icon（`icons.tsx`）

```ts
"form-responses": "M7 7h6M7 11h6M7 15h4M5 3h10l4 4v14H5zM15 3v5h5M14 14l6-6M16 8h4v4",
```

> 既存 stroke icon（`viewBox="0 0 24 24"` / `strokeWidth` 系）の描画系に合わせる。外部リンクを示す
> 「ボックス＋外向き矢印」系の path。

### 4. 描画分岐（`SidebarNavItem.tsx`）

```tsx
export function SidebarNavItem({ item, collapsed, activePath }: SidebarNavItemProps) {
  const pathname = usePathname() ?? activePath;
  const active = isNavItemActive(item.href, pathname);
  const showBadge = item.badge && item.badge.count > 0;
  const content = (
    <>
      <span aria-hidden="true" className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[var(--ubm-color-text-secondary)]">
        <ShellIcon id={item.icon} />
      </span>
      <span className={collapsed ? "sr-only" : "flex-1"}>
        {item.label}
        {item.external ? <span className="sr-only">（外部リンク）</span> : null}
      </span>
      {item.external && !collapsed ? (
        <span aria-hidden="true" className="text-xs text-[var(--ubm-color-text-muted)]">↗</span>
      ) : null}
      {showBadge && item.badge ? (
        <Chip tone={TONE_TO_CHIP[item.badge.tone]}>
          <span className={collapsed ? "sr-only" : undefined}>{item.badge.count}</span>
        </Chip>
      ) : null}
    </>
  );
  if (item.external) {
    return (
      <li>
        <a href={item.href} target="_blank" rel="noopener noreferrer" data-shell-block="nav-item"
           className="flex items-center gap-3 rounded-sm px-3 py-2 text-sm text-[var(--ubm-color-text-primary)] hover:bg-[var(--shell-active-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]">
          {content}
        </a>
      </li>
    );
  }
  return (
    <li>
      <Link href={item.href} data-shell-block="nav-item" data-active={active ? "true" : "false"} aria-current={active ? "page" : undefined}
            className="... data-[active=true]:bg-[var(--shell-active-bg)] data-[active=true]:font-semibold data-[active=true]:text-[var(--ubm-color-accent-ink)]">
        {content}
      </Link>
    </li>
  );
}
```

> 注意点:
> - className は既存の OKLch トークン変数（`var(--shell-active-bg)` / `var(--ubm-color-accent)` 等）を流用。HEX 直書き / `bg-[#xxx]` / inline style を導入しない。
> - 外部分岐では `data-active` / `aria-current` を出さず、active 用 className を付与しない。
> - 判別は label「Form回答」+ icon + `↗`（非 collapsed・`aria-hidden`）+ sr-only「（外部リンク）」で担保。
> - `content`（icon/label/badge）は内部/外部で同一 markup を共有する。

## 入出力・副作用（概要・詳細は Phase 5）

| 項目 | 内容 |
| --- | --- |
| 入力 | `ShellNavItem`（`external: true`, `href = FORM_RESPONSES_EDIT_URL`）。`buildNavForRole("admin", ...)` 経由で admin group に含まれる |
| 出力 | `<a target="_blank" rel="noopener noreferrer" href=".../edit">…</a>` |
| 副作用 | クリックで新規タブに Google Form 編集画面を開く。現 admin 画面は遷移・リロードしない。`rel="noopener"` で `window.opener` 遮断 |
| データ層 | D1 / API / Form schema への読み書きなし（純粋な外部静的 URL 遷移） |

## ライブラリ選定

新規ライブラリ採用なし。既存 Next.js `Link` / 素の `<a>` / 既存 `ShellIcon` / `Chip` のみ。新規 primitive を生やさない。

## 既存コンポーネント再利用可否

- `RegisterCallout.tsx` の外部リンクパターン（`target="_blank" rel="noopener noreferrer"`）を踏襲。
- `ShellIcon` / `Chip` / OKLch トークン className を再利用。新規 primitive ゼロ。

## 参照

- `.claude/skills/aiworkflow-requirements/references/ui-component-architecture.md`（存在時）
- `docs/00-getting-started-manual/claude-design-prototype/`（shell primitive の正本）
