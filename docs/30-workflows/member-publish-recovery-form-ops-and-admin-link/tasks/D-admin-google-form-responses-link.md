# タスク D — 管理サイドバーから Google Form 回答一覧表（編集画面）への外部リンク追加

**[実装区分: 実装仕様書]**

親ワークフロー: `member-publish-recovery-form-ops-and-admin-link`
責務（単一責務）: 管理者画面のサイドバー nav に、Google Form の回答一覧表（編集画面）を**別タブで開く外部リンク**を 1 つ追加する。

---

## 1. 目的 / 受け入れ条件（AC）

### 目的

管理者が D1 同期前の生回答や同意状態を直接確認したいとき、admin 画面のサイドバーから Google Form の編集/回答画面へワンクリックで遷移できるようにする。これにより「メンバー非表示の原因が回答側にあるか同期側にあるか」を切り分けるオペレーションを高速化する。

### 受け入れ条件

| ID | 受け入れ条件 |
|----|-------------|
| AC-D1 | admin サイドバーの項目をクリックすると、Google Form の編集/回答一覧 URL が**別タブ（新規ウィンドウ）**で開く。元の admin 画面は遷移・リロードしない。 |
| AC-D2 | 外部リンクは `target="_blank"` かつ `rel="noopener noreferrer"` を持つ（不変条件 #7 準拠）。 |
| AC-D3 | リンク先 URL は `apps/web/src/lib/constants/form.ts` の新規定数 `FORM_RESPONSES_EDIT_URL` を経由して参照する。コンポーネント/設定への URL ハードコードを禁止する。 |
| AC-D4 | この項目が「外部サイトへ遷移するリンク」であると視覚的に判別できる（外部リンクであることを示す表示。後述の `external` フラグに紐づくマーカー or ラベル文言）。かつ内部 nav 項目（`<Link>`）の active ハイライト判定の対象にならない。 |

---

## 2. 設計判断（2 案比較）

サイドバーは Task A の `SidebarNavItem.tsx` が **内部 `<Link href>` 専用**（Next.js `Link`、`SidebarNavItem.tsx:31-50`）で、外部 URL の `target="_blank"` を描画できない。外部リンクの配置先を 2 案で比較する。

### 案A（推奨）: `ShellNavItem` に `external?: boolean` を追加し、サイドバーに 1 項目として並べる

- `ShellNavItem` に optional `external?: boolean` を追加。
- `SidebarNavItem.tsx` で `item.external === true` のとき `<Link>` の代わりに `<a href target="_blank" rel="noopener noreferrer">` を描画する分岐を追加（`RegisterCallout.tsx:39-48` の既存外部リンクパターンと同形）。
- `buildAdminGroup` の admin nav 配列に Form 項目を追加。
- 外部 icon を 1 つ追加（後述）。

**長所**: サイドバーの並び・余白・icon・collapsed 挙動が他の admin 項目と完全に一致し、UI 一貫性が最も高い。`buildNavForRole` の純関数テストでも検証可能。
**短所**: `ShellNavItem` / `ShellNavItemId` / icon `PATHS` / `SidebarNavItem` の 4 箇所に変更が波及する。union 拡張と active 判定除外の影響を明示する必要がある。

### 案B: admin layout の footer 等に独立した `<a>` を別配置する

- サイドバー nav には手を入れず、admin layout の下部などに単独の外部リンクを置く。

**長所**: `ShellNavItem` / icon / `SidebarNavItem` を変更せず、影響範囲が局所的。
**短所**: サイドバーの nav 群と視覚的に分離し、「管理メニューの一部」として認知されにくい。collapsed 状態のレイアウト追従や余白整合を別途実装する必要があり、primitive を増やす（不変条件「新規 primitive を生やさない」と衝突しやすい）。

### 推奨: 案A

サイドバーの一貫性と既存 primitive 再利用を優先し**案A を採用**する。採用に伴う影響は次のとおり明示する。

- `ShellNavItemId` union に外部リンク用の id（`form-responses`）を 1 つ追加する。`PATHS: Record<ShellNavItemId, string>`（`icons.tsx:25`）が網羅型のため、id 追加時は `PATHS` への path 追加が **型レベルで必須**になる（追加漏れは型エラー）。
- active 判定（`isNavItemActive`、`shell-config.ts:114-118`）は内部 pathname 前方一致用であり、外部 URL は判定対象にしない。`external === true` の項目は `<a>` 分岐で描画され、`isNavItemActive` を**呼ばない**（`data-active` / `aria-current` を出さない）。
- 不変条件「既存 API のみ接続」に影響しない（外部静的 URL への遷移のみ。D1 / API / Form schema は不変）。

---

## 3. 変更対象ファイル一覧

| ファイル | 変更種別 | 内容 |
|---------|---------|------|
| `apps/web/src/lib/constants/form.ts` | 編集 | `FORM_RESPONSES_EDIT_URL` 定数を追加（`FORM_RESPONDER_URL` と同パターン）。 |
| `apps/web/src/components/shell/shell-config.ts` | 編集 | `ShellNavItemId` union に `"form-responses"` 追加。`ShellNavItem` に `readonly external?: boolean` 追加。`buildAdminGroup` の admin items 末尾に Form 項目を追加。 |
| `apps/web/src/components/shell/icons.tsx` | 編集 | `PATHS` に `"form-responses"` の外部リンク用 SVG path を追加。 |
| `apps/web/src/components/shell/SidebarNavItem.tsx` | 編集 | `item.external === true` のとき外部 `<a target="_blank" rel="noopener noreferrer">` を描画する分岐を追加。 |
| `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | 新規 | 外部/内部の描画分岐を検証（`*.spec.tsx` のみ・不変条件 #8）。 |
| `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | 編集（任意） | admin group に external 項目が含まれ href が定数と一致することを追加検証（既存 spec 拡張）。 |

> 上記以外のファイルは変更しない。D1 schema / API endpoint / Google Form 仕様は変更しない。

---

## 4. 型 / 関数シグネチャ

### 4-1. `constants/form.ts`（追加後）

既存（`form.ts:2-3`）:

```ts
export const FORM_RESPONDER_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform" as const;
```

追加（同ファイル・同パターンで `as const`）:

```ts
// CLAUDE.md 固定値 — Google Form 編集/回答一覧 URL（正本: docs/00-getting-started-manual/google-form/02-result.md:12）。
// 不変条件 #7: 外部 link 遷移（target="_blank" + rel="noopener noreferrer"）でのみ参照する。
export const FORM_RESPONSES_EDIT_URL =
  "https://docs.google.com/forms/d/119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg/edit" as const;
```

> formId 部分は CLAUDE.md「フォーム固定値」`formId = 119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` と一致すること。

### 4-2. `shell-config.ts`（拡張後）

`ShellNavItemId` union（`shell-config.ts:7-20`）に 1 要素追加:

```ts
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
  | "form-responses"; // 追加: Google Form 回答一覧（外部リンク）
```

`ShellNavItem` interface（`shell-config.ts:24-30`）に optional フィールド追加:

```ts
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

`buildAdminGroup`（`shell-config.ts:56-91`）の `items` 配列末尾（`audit` の後）に追加:

```ts
{
  id: "form-responses",
  href: FORM_RESPONSES_EDIT_URL,
  label: "フォーム回答（外部）",
  icon: "form-responses",
  external: true,
},
```

> `shell-config.ts` 冒頭に `import { FORM_RESPONSES_EDIT_URL } from "@/lib/constants/form";` を追加する（path alias は既存コードの import 慣例に合わせる。既存に form 定数 import がなければ `@/lib/constants/form` を新規 import する）。
> label に「（外部）」を含めることで AC-D4 のテキスト面の判別性を担保する。

### 4-3. 新 icon id（`icons.tsx`）

`PATHS: Record<ShellNavItemId, string>`（`icons.tsx:25-43`）に外部リンクを示す path（例: ボックスから矢印が出る外部リンクアイコン）を追加:

```ts
"form-responses":
  "M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
```

> Record が網羅型のため、`ShellNavItemId` に `"form-responses"` を足した時点で `PATHS` に当該キーがないと型エラーになる。path 文字列の具体形は既存 stroke icon の `viewBox="0 0 24 24"` / `strokeWidth="1.75"`（`icons.tsx:9-21`）の描画系に合うものを使う。

### 4-4. `SidebarNavItem.tsx` の外部リンク分岐（構造）

`SidebarNavItem.tsx:25-53` を、内部/外部で描画を分岐する形に変更する。共通の子要素（icon span / label span / badge）は両分岐で共有する。

```tsx
export function SidebarNavItem({ item, collapsed, activePath }: SidebarNavItemProps) {
  const pathname = usePathname() ?? activePath;
  const showBadge = item.badge && item.badge.count > 0;

  // 共通の中身（icon + label + badge）。external 分岐と内部分岐で同一 markup を共有する。
  const inner = (
    <>
      <span
        aria-hidden="true"
        className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[var(--ubm-color-text-secondary)]"
      >
        <ShellIcon id={item.icon} />
      </span>
      <span className={collapsed ? "sr-only" : "flex-1"}>{item.label}</span>
      {showBadge && item.badge ? (
        <Chip tone={TONE_TO_CHIP[item.badge.tone]}>
          <span className={collapsed ? "sr-only" : undefined}>{item.badge.count}</span>
        </Chip>
      ) : null}
    </>
  );

  // 外部リンク: active 判定は行わず、別タブ遷移（不変条件 #7）。
  if (item.external) {
    return (
      <li>
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          data-shell-block="nav-item"
          data-external="true"
          className="flex items-center gap-3 rounded-sm px-3 py-2 text-sm text-[var(--ubm-color-text-primary)] hover:bg-[var(--shell-active-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
        >
          {inner}
          <span className="sr-only">（外部サイトを新しいタブで開く）</span>
        </a>
      </li>
    );
  }

  // 内部リンク: 従来どおり Next.js Link + active 判定。
  const active = isNavItemActive(item.href, pathname);
  return (
    <li>
      <Link
        href={item.href}
        data-shell-block="nav-item"
        data-active={active ? "true" : "false"}
        aria-current={active ? "page" : undefined}
        className="flex items-center gap-3 rounded-sm px-3 py-2 text-sm text-[var(--ubm-color-text-primary)] hover:bg-[var(--shell-active-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)] data-[active=true]:bg-[var(--shell-active-bg)] data-[active=true]:font-semibold data-[active=true]:text-[var(--ubm-color-accent-ink)]"
      >
        {inner}
      </Link>
    </li>
  );
}
```

> 注意点:
> - className は既存（`SidebarNavItem.tsx:36`）の OKLch トークン変数（`var(--shell-active-bg)` / `var(--ubm-color-accent)` 等）を流用し、HEX 直書き / `bg-[#xxx]` を導入しない（不変条件 OKLch トークン正本化）。
> - 外部分岐では `data-active` / `aria-current` を出さず、active 用 className（`data-[active=true]:...`）は付与しない。
> - 外部であることの判別は label「（外部）」+ icon + `sr-only` 補助テキストで担保する（AA: スクリーンリーダー利用者にも別タブ遷移を告知）。
> - `usePathname()` は external 専用にすると未使用警告が出るため、内部分岐の `isNavItemActive` 呼び出しで引き続き使用する（上記構造のとおり外部分岐前で `pathname` は参照しないが、`active` 計算は内部分岐内に置く）。lint で `pathname` unused が出る場合は内部分岐側のみで `const pathname = ...` を宣言する形に調整してよい。

---

## 5. 入出力・副作用

| 項目 | 内容 |
|------|------|
| 入力 | `ShellNavItem`（`external: true`, `href = FORM_RESPONSES_EDIT_URL`）。`buildNavForRole("admin", ...)` 経由で admin group に含まれる。 |
| 出力（描画） | `<a target="_blank" rel="noopener noreferrer" href="…/edit">…</a>`。 |
| 副作用 | クリック時にブラウザが**新規タブ**で Google Form 編集画面を開く。現 admin 画面は遷移・リロードしない。`rel="noopener"` により `window.opener` を遮断（タブナビング防止）。 |
| active 判定 | 外部項目は `isNavItemActive` の対象外。pathname がどの admin route であっても外部項目は非 active（ハイライトしない）。 |
| データ層 | D1 / API / Google Form schema への読み書きは一切なし（純粋な外部静的 URL 遷移）。 |

---

## 6. テスト方針

新規 `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx`（`*.spec.tsx` のみ・不変条件 #8）。既存 shell spec（`shell-config.spec.ts` など）と同じ vitest + jsdom 構成に従う。

| テストケース | 期待 |
|-------------|------|
| external 項目を描画 | `<a>` 要素が描画され、`target="_blank"` / `rel="noopener noreferrer"` を持つ。`<Link>`（内部 `<a href>` で `target` なし）ではない。 |
| external の href | レンダリングされた `<a>` の `href` が `FORM_RESPONSES_EDIT_URL` と完全一致（定数 import で突合）。 |
| external は active を出さない | external 項目に `aria-current` / `data-active="true"` が付かない（`data-external="true"` を持つ）。 |
| 内部項目は従来どおり | `external` 未指定の項目は `target` を持たない nav link として描画され、pathname 一致時に `aria-current="page"` / `data-active="true"` が付く（既存挙動の回帰防止）。 |
| collapsed | `collapsed=true` のとき label が `sr-only` になる（内部・外部とも）。 |

`shell-config.spec.ts`（編集・任意）:

| テストケース | 期待 |
|-------------|------|
| admin group に external 項目 | `buildNavForRole("admin")` の admin group `items` に `id: "form-responses"` が含まれ、`external === true` かつ `href === FORM_RESPONSES_EDIT_URL`。 |
| 非 admin role | `buildNavForRole("viewer")` / `("member")` の結果に `form-responses` が含まれない。 |

> external 描画検証は `usePathname` を mock する既存 shell spec の方法に合わせる（`vi.mock("next/navigation", ...)`）。Next.js `Link` は jsdom で `<a>` として描画されるため、内部/外部の区別は `getAttribute("target")` の有無で判定する。

---

## 7. ローカル実行・検証コマンド

リポジトリルートで `mise exec --` 経由で実行（CLAUDE.md「よく使うコマンド」準拠）。

```bash
# 型チェック（ShellNavItemId 拡張に伴う PATHS 網羅・external 分岐の型整合を検証）
mise exec -- pnpm typecheck

# Lint（boundaries / inline-style 禁止 / eslint。HEX 直書きや inline style 混入を検出）
mise exec -- pnpm lint

# 新規/関連 spec のみ実行
mise exec -- pnpm exec vitest run apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx
mise exec -- pnpm exec vitest run apps/web/src/components/shell/__tests__/shell-config.spec.ts

# デザイントークン回帰（OKLch 正本・HEX 禁止 gate）
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens

# 新規 test ファイルの suffix 検査（*.test.* 混入禁止 / 不変条件 #8）は lefthook / CI gate で自動実行
```

> `pnpm lint`（ルート）は `verify:no-inline-style` を含むため、外部リンク分岐に `style={{...}}` を書かないこと（className トークン変数で表現する）。

---

## 8. DoD（Definition of Done）

- [ ] `FORM_RESPONSES_EDIT_URL` が `constants/form.ts` に `as const` で定義され、値が `docs/.../02-result.md:12` の編集用 URL と一致する。
- [ ] `ShellNavItemId` に `"form-responses"`、`ShellNavItem` に `external?: boolean` が追加され、`icons.tsx` の `PATHS` に対応 path が追加されている（型エラーなし）。
- [ ] `buildAdminGroup` の admin items に external Form 項目が含まれ、href が定数経由で参照されている（ハードコードなし）。
- [ ] `SidebarNavItem.tsx` が `external === true` で `<a target="_blank" rel="noopener noreferrer">` を描画し、内部項目は従来どおり `<Link>` + active 判定を維持する。
- [ ] 外部項目に active ハイライト（`data-active` / `aria-current`）が付かない。
- [ ] 新規 `SidebarNavItem.spec.tsx`（`*.spec.tsx`）が §6 のケースを満たし pass する。
- [ ] `pnpm typecheck` / `pnpm lint` / 関連 vitest / `verify-design-tokens` がすべて green。
- [ ] HEX 直書き・`bg-[#xxx]`・inline style を新規追加していない（OKLch トークン正本化）。
- [ ] D1 schema / API endpoint / Google Form 仕様を変更していない。

---

## 9. 実コード根拠（行番号付き）

- 定数置き場・既存パターン（`apps/web/src/lib/constants/form.ts:1-3`）:
  ```ts
  // CLAUDE.md 固定値 — Google Form 回答 URL。リポジトリ全体で hardcode 禁止、本定数経由で参照する。
  export const FORM_RESPONDER_URL =
    "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform" as const;
  ```
- `ShellNavItemId` union（`apps/web/src/components/shell/shell-config.ts:7-20`）/ `ShellNavItem` interface（同 24-30）/ `buildAdminGroup` items（同 56-91、`audit` 末尾は 88 行目）/ `isNavItemActive`（同 114-118）。
- nav item 描画は内部 `<Link href>` 専用（`apps/web/src/components/shell/SidebarNavItem.tsx:31-50`）。`ShellIcon id={item.icon}`（同 42）。
- icon 網羅型 `PATHS: Record<ShellNavItemId, string>`（`apps/web/src/components/shell/icons.tsx:25-43`）。stroke 共通設定（同 9-21）。
- 外部リンク既存パターン（`apps/web/src/components/public/RegisterCallout.tsx:39-48`）:
  ```tsx
  <a
    href={responderUrl}
    target="_blank"
    rel="noopener noreferrer"
    data-role="register-cta"
    className="cta-button"
  >
  ```
- Form 編集/回答一覧 URL の正本（`docs/00-getting-started-manual/google-form/02-result.md:12`）: `https://docs.google.com/forms/d/119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg/edit`。formId は CLAUDE.md「フォーム固定値」と一致。
- 不変条件 #7（外部 link 遷移・iframe 不採用）/ #8（`*.spec.{ts,tsx}` のみ）/ OKLch トークン正本化（HEX 禁止）は CLAUDE.md 準拠。
