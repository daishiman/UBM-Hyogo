# Phase 5: 実装（TDD Green フェーズ）

> **Phase 種別**: 実装（Phase 4 のテストを green にする）
> **対象タスク**: Task D admin サイドバー nav に Google Form 回答編集画面への外部リンクを追加
> **workflow_state**: `implemented_local_evidence_captured`（実装は dev へ landed 済み: PR #1064 / commit 745c95115）
> **前提**: Phase 4 のテストが定義済み（landed 環境では green）
> **次フェーズ**: Phase 6（テスト拡充）

---

## 5.1 このフェーズのゴール

Phase 4 で定義した TC-1〜TC-5 を green にする最小実装を行う。
admin サイドバー nav の末尾（監査ログの後）に「Form回答」項目を 1 件追加し、`SidebarNavItem` に `item.external` 分岐を実装して、`FORM_RESPONSES_EDIT_URL` を `target="_blank"` + `rel="noopener noreferrer"` の外部リンクとして描画する。external 項目は active 判定対象外とする。

**本タスクは verify_existing（landed 実装の正本記述）**であり、実装は既に dev に landed 済み（PR #1064 / commit 745c95115）。本 Phase の実体は「landed 実装が以下の手順・シグネチャと一致していることの確認」である。新規 apps 差分は発生させない。

---

## 5.2 変更対象ファイル一覧と種別（CONST_005）

| # | ファイル | 種別 | 変更内容 |
|---|---------|------|----------|
| 1 | `apps/web/src/lib/constants/form.ts` | 編集 | `FORM_RESPONSES_EDIT_URL` 定数追加（既存 `FORM_RESPONDER_URL` と同パターン） |
| 2 | `apps/web/src/components/shell/shell-config.ts` | 編集 | `ShellNavItemId` union に `"form-responses"` / `ShellNavItem.external?` / `buildAdminGroup` items 末尾に項目 / import 追加 |
| 3 | `apps/web/src/components/shell/icons.tsx` | 編集 | 網羅型 `PATHS` に `"form-responses"` svg path 追加（union 追加と同時に必須） |
| 4 | `apps/web/src/components/shell/SidebarNavItem.tsx` | 編集 | `item.external` のとき `<a target/rel>` 分岐を描画。content（icon+label+badge）は内部/外部で共有 |

> D1 schema / Google Form 仕様 / API endpoint は無変更（UI prototype alignment 不変条件 #1）。新規 primitive を生やさず、既存 `SidebarNavItem` の分岐拡張で完結する（不変条件 #3）。

---

## 5.3 関数・型シグネチャ・差分方針（CONST_005）

### 5.3.1 `lib/constants/form.ts`（#1）

既存 `FORM_RESPONDER_URL` の隣に `as const` で追加する。値は CLAUDE.md フォーム固定値の formId（`119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg`）の編集 URL。

```typescript
// CLAUDE.md 固定値 — Google Form 編集/回答一覧 URL。
export const FORM_RESPONSES_EDIT_URL =
  "https://docs.google.com/forms/d/119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg/edit" as const;
```

> ハードコード禁止（AC-D3）。URL を直接コンポーネントに書かず、本定数を唯一の正本とする。

### 5.3.2 `components/shell/shell-config.ts`（#2）

**(a) import 追加（冒頭）**

```typescript
import { FORM_RESPONSES_EDIT_URL } from "../../lib/constants/form";
```

**(b) `ShellNavItemId` union 末尾に `"form-responses"` を追加**

```typescript
export type ShellNavItemId =
  | "home"
  | "directory"
  | "register"
  | "profile"
  | "dashboard"
  | "attendance"
  | "members"
  | "tag-queue"
  | "schema"
  | "meeting"
  | "requests"
  | "identity"
  | "audit"
  | "form-responses"; // ← 追加
```

> この union 拡張により `icons.tsx` の網羅型 `PATHS: Record<ShellNavItemId, string>` が `"form-responses"` キー欠落で**型エラー**になる（#3 で同時追加が必須）。

**(c) `ShellNavItem` interface に `external?` を追加**

```typescript
export interface ShellNavItem {
  readonly id: ShellNavItemId;
  readonly href: string;
  readonly label: string;
  readonly icon: ShellNavItemId;
  readonly badge?: { readonly tone: ShellNavBadgeTone; readonly count: number };
  readonly external?: boolean; // ← 追加（省略時は内部リンク）
}
```

**(d) `buildAdminGroup` の items 末尾（audit の後）に external 項目を追加**

```typescript
items: [
  // ...dashboard / attendance / members / tag-queue / schema / meeting / requests / identity...
  { id: "audit", href: "/admin/audit", label: "監査ログ", icon: "audit" },
  {
    id: "form-responses",
    href: FORM_RESPONSES_EDIT_URL,
    label: "Form回答",
    icon: "form-responses",
    external: true,
  },
],
```

> - admin グループ items は audit までの 9 項目 + form-responses で **10 項目**になる（shell-config.spec の `toHaveLength(10)`）。
> - `PUBLIC_GROUP` / `MEMBERS_GROUP` は無改変。viewer / member ロールには admin グループが付かないため、form-responses も含まれない（role 境界・Phase 6）。
> - external 項目は `href` が外部 URL のため `isNavItemActive` ロジック（`/` / `/admin` 完全一致・それ以外前方一致）の対象にならない（外部 URL は pathname と一致しない）が、最終的に DOM レベルでも external 分岐が active を出さないことで二重に保証する（#4）。

### 5.3.3 `components/shell/icons.tsx`（#3）

`PATHS: Record<ShellNavItemId, string>` は**網羅型**のため、union 追加と同時に `"form-responses"` キーを追加しないと型エラーになる。外部リンク（書類 + 上向き矢印）を示す stroke path を追加する。

```typescript
const PATHS: Record<ShellNavItemId, string> = {
  // ...既存 home..audit...
  "form-responses": "M7 7h6M7 11h6M7 15h4M5 3h10l4 4v14H5zM15 3v5h5M14 14l6-6M16 8h4v4",
};
```

> `Stroke` / `ShellIcon` 本体は無改変（`PATHS[id]` を引くだけ）。新規 icon コンポーネントは作らない。

### 5.3.4 `components/shell/SidebarNavItem.tsx`（#4）

**content（icon span + label span + badge）を内部/外部で共有**し、最後に `item.external` で `<a>` か `<Link>` を分岐する。

**(a) content 内: label span に外部リンク sr-only と、非 collapsed 時の ↗ マーカーを追加**

```tsx
const content = (
  <>
    <span
      aria-hidden="true"
      className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[var(--ubm-color-text-secondary)]"
    >
      <ShellIcon id={item.icon} />
    </span>
    <span className={collapsed ? "sr-only" : "flex-1"}>
      {item.label}
      {item.external ? <span className="sr-only">（外部リンク）</span> : null}
    </span>
    {item.external && !collapsed ? (
      <span aria-hidden="true" className="text-xs text-[var(--ubm-color-text-muted)]">
        ↗
      </span>
    ) : null}
    {showBadge && item.badge ? (
      <Chip tone={TONE_TO_CHIP[item.badge.tone]}>
        <span className={collapsed ? "sr-only" : undefined}>{item.badge.count}</span>
      </Chip>
    ) : null}
  </>
);
```

> - sr-only「（外部リンク）」は scr reader 向けの判別（AC-D4）。collapsed でも label span 自体が sr-only になるため二重に隠れるが、テキスト内容としては保持される。
> - ↗ は `aria-hidden="true"` の視覚マーカーで、collapsed 時は出さない（アイコンのみ表示の整合）。
> - 色は **OKLch トークン**（`var(--ubm-color-text-muted)` 等）経由。HEX 直書き / `text-[#xxx]` / inline style 禁止（不変条件 #2）。

**(b) external 分岐: `<a target/rel>` を描画し、`data-active` / `aria-current` を出さない**

```tsx
if (item.external) {
  return (
    <li>
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        data-shell-block="nav-item"
        className="flex items-center gap-3 rounded-sm px-3 py-2 text-sm text-[var(--ubm-color-text-primary)] hover:bg-[var(--shell-active-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
      >
        {content}
      </a>
    </li>
  );
}
```

> - `target="_blank"` + `rel="noopener noreferrer"` でタブナビング / referrer leak を防ぐ（AC-D2・不変条件 #7）。
> - external 分岐の `<a>` には **`data-active` / `aria-current` を一切付けない**（AC-D4）。`active` 変数を参照しないため、外部 URL が active 扱いになることがない。
> - className は内部分岐と同系統の OKLch トークンだが、`data-[active=true]:*` の active 強調クラス群は付けない（active 概念が無いため）。

**(c) 内部分岐（従来どおり・回帰しないこと）**

```tsx
return (
  <li>
    <Link
      href={item.href}
      data-shell-block="nav-item"
      data-active={active ? "true" : "false"}
      aria-current={active ? "page" : undefined}
      className="...（既存 OKLch トークン + data-[active=true]:bg/font/text）..."
    >
      {content}
    </Link>
  </li>
);
```

> 内部分岐は `active = isNavItemActive(item.href, pathname)` を従来どおり `data-active` / `aria-current` / active className に反映する（TC-3 回帰）。

---

## 5.4 OKLch トークン遵守の確認（CONST_005・不変条件 #2）

| 用途 | 使用トークン |
|------|------------|
| nav item 文字色 | `var(--ubm-color-text-primary)` |
| icon 文字色 | `var(--ubm-color-text-secondary)` |
| ↗ マーカー文字色 | `var(--ubm-color-text-muted)` |
| hover / active 背景 | `var(--shell-active-bg)` |
| focus outline | `var(--ubm-color-accent)` |
| active 文字色（内部のみ） | `var(--ubm-color-accent-ink)` |

> HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` / inline `style` を使わない。CI gate `verify-design-tokens`（task-18）が fail 判定する。

---

## 5.5 入出力・副作用

- **入力**: `ShellNavItem`（`external?: boolean`）、`collapsed: boolean`、`activePath: string`、`usePathname()`。
- **出力**: external 項目は `<a target="_blank" rel="noopener noreferrer" href={FORM_RESPONSES_EDIT_URL}>`、内部項目は従来の `<Link>`（active 属性付き）。
- **副作用**: なし（純粋な presentational 分岐）。クリック時のブラウザ遷移は新規タブで Google Form 編集 URL を開くのみ（元画面は遷移しない・AC-D1）。D1 / API / Google Form 仕様への変更なし。

---

## 5.6 後方互換性の確認

- `external` は optional のため、既存 nav 項目（home..audit / profile / public 群）は `external` 未指定＝内部 `<Link>` のまま挙動不変（TC-3 回帰）。
- `ShellNavItemId` union 拡張は網羅型 `PATHS` に form-responses を同時追加するため型整合（typecheck 緑）。
- viewer / member ロールは admin グループを持たないため form-responses が露出しない（role 境界不変）。
- admin items が 9→10 になる以外、既存項目の id / href / label / icon は不変（shell-config.spec の既存 assert が回帰しない）。

---

## 5.7 ローカル実行コマンド（CONST_005）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test
# 関連 3 spec のみ
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/lib/constants/__tests__/form-responses.spec.ts \
  apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx \
  apps/web/src/components/shell/__tests__/shell-config.spec.ts
```

---

## 5.8 DoD（Definition of Done）

- [ ] `form.ts` に `FORM_RESPONSES_EDIT_URL` を `as const` で追加（既存 `FORM_RESPONDER_URL` と同パターン）
- [ ] `shell-config.ts` に union `"form-responses"` / `ShellNavItem.external?` / import / admin items 末尾項目を追加（admin items=10）
- [ ] `icons.tsx` の網羅型 `PATHS` に `"form-responses"` path を追加（typecheck 緑）
- [ ] `SidebarNavItem.tsx` で content を共有し、external 分岐 `<a target="_blank" rel="noopener noreferrer">` を実装、`data-active`/`aria-current` を出さない
- [ ] label span に sr-only「（外部リンク）」、非 collapsed 時に ↗ マーカー（`aria-hidden`）
- [ ] 内部分岐は従来どおり `<Link>` + active 属性（回帰しない）
- [ ] 色はすべて OKLch トークン（HEX / inline style 無し・`verify-design-tokens` 緑）
- [ ] Phase 4 の TC-1〜TC-5 が green
- [ ] `mise exec -- pnpm typecheck` / `pnpm lint` が green
- [ ] `git status apps/web/` を確認（verify_existing＝新規 apps 差分ゼロ＝クリーン）

---

## 完了条件

完了条件は次のすべてを満たすことである。

1. 4 ファイル（`form.ts` / `shell-config.ts` / `icons.tsx` / `SidebarNavItem.tsx`）が本書のシグネチャ・差分方針と一致し、external 項目が `FORM_RESPONSES_EDIT_URL` 定数経由で `target="_blank"` + `rel="noopener noreferrer"` の `<a>` として描画されること（AC-D1/D2/D3）。
2. external 分岐が `data-active` / `aria-current` を出さず active 判定対象外であり、sr-only「（外部リンク）」と ↗ マーカーで外部リンクを判別できること（AC-D4）。
3. 内部 nav 項目の active 挙動と既存 admin/public/members 項目が回帰せず、色がすべて OKLch トークン経由であること（不変条件 #2）。
4. Phase 4 の TC-1〜TC-5 と既存 web spec が green で、`pnpm typecheck` / `pnpm lint` が緑、`git status apps/web/` がクリーン（verify_existing で新規 apps 差分ゼロ）であること。
