# 実装ガイド — sidebar footer 固定 + アカウント popover 外側クリック閉じ + collapse はみ出し + main footer sticky

> implemented_local_evidence_captured。VISUAL タスク。local code + focused component evidence は取得済み。commit / PR / staging screenshot は user-gated。

---

## Part 1: 中学生にもわかる説明

サイトの左側に「メニューの棚（サイドバー）」があります。いま、この棚と画面のまわりで
**4 つの困りごと**が起きています。1 つずつ、身近なたとえで説明します。

### こまりごと 1・4「下のボタンとフッターが、いつも同じ場所にいてほしい」

ノートを思い浮かべてください。ノートには **表紙** と **裏表紙** があって、その間に
ページが何枚もはさまっています。中のページは何枚あってもめくれますが、
**表紙と裏表紙はいつも同じ位置**にありますよね。

いまのサイトはこれが逆になっていて、メニューの項目が増えると棚そのものがどんどん
下に伸びてしまい、いちばん下にある「公開サイトに戻る」ボタンやユーザーのアイコンが
画面の外（下のほう）に押し出されて、**スクロールしないと見えません**。

そこで「棚の高さを画面の高さにピッタリ合わせて固定」します。こうすると、
メニューがどれだけ多くても **メニューの部分だけが中でスクロール** し、
下のボタンたちは表紙・裏表紙のように **いつも画面の下にとどまる** ようになります。

同じ考え方を、ページの下にある **フッター**（プライバシーポリシー / 利用規約 / コピーライト）にも
使います。中身が少ないページでも、フッターは裏表紙のように **いつも画面のいちばん下** に
来るようにします。中身が多いページでは、ふつうに文章の終わりにくっつきます。

### こまりごと 2「棚を細くしたら、アイコンがはみ出る」

細い本棚に、大きな本を横向きで押し込むと、本がはみ出してしまいますよね。
解決法は「本を棚の幅に合わせて、縦に細くして入れる」ことです。

サイドバーは「閉じる（細くする）」ことができますが、いまは細くしても中身が
そのままの大きさなので、アイコンや小さな数字バッジが横にはみ出します。
そこで、細くしたときは **アイコンを真ん中にそろえ**、文字や矢印は隠し、
数字バッジは **小さな丸い点** にして、棚の幅にきちんと収めます。

### こまりごと 3「メニューが、別の場所を押しても閉じない」

スマホでお店のアプリを見ていると、ときどき広告のふきだし（ポップアップ）が出ます。
あれは、**画面のどこか別の場所をタップすると消えます**よね。

いまのアカウントメニュー（「プロフィール編集 / 申請 / 管理者ダッシュボード」が出るやつ）は、
**別の場所を押しても閉じません**。もう一度アイコンを押さないと閉じない、不便な状態です。
そこで広告のふきだしと同じように、「**メニューの外側を押したら閉じる**」「**Escape キーを押したら閉じる**」
という動きを足します。メニューを開いている間だけ「外側が押されたか」を見張る係をつけて、
閉じたらその係を片付けます。

---

まとめると、今回は次の 4 つを直します。見た目の世界観や色は変えず、「**いつも見える・はみ出さない・外を押せば閉じる**」という当たり前の使いやすさを取り戻すのが目的です。

| # | こまりごと | やること | たとえ |
|---|-----------|---------|--------|
| C1 | 下のボタンが隠れる | 棚の高さを画面に固定、メニューだけ中でスクロール | ノートの表紙・裏表紙 |
| C2 | 細くするとはみ出る | アイコン中央寄せ・バッジは点 | 細い棚に本を縦に入れる |
| C3 | メニューが閉じない | 外側クリック / Escape で閉じる | 広告ふきだしを外タップで消す |
| C4 | フッターが浮く | フッターをいつも画面の下へ | ノートの裏表紙 |

---

## Part 2: 技術者向け詳細

> **重要**: 本タスクは本サイクルで実コードへ反映済み。以下は適用済み差分と検証結果の実装ガイドである。

### 変更ファイル（ソース 5 / テスト 3 / 新規ソース 0）

| ファイル | concern | 変更概要 |
|---------|---------|---------|
| `apps/web/src/styles/globals.css` | C1, C2 | `[data-shell="sidebar"]` を高さ固定 + overflow:hidden（行 1417 付近 / 1547 付近の 2 ブロック）|
| `apps/web/src/components/shell/SidebarShell.tsx` | C1, C2, C4 | aside 2 段 flex 化 + overflow-hidden、`<main>` flex-column 化、`AdminPublicReturn` collapsed 中央寄せ |
| `apps/web/src/components/shell/SidebarUserMenu.tsx` | C2, C3 | `browserDocument()` 経由 pointerdown/keydown listener、summary collapsed 中央寄せ |
| `apps/web/src/components/shell/SidebarNavItem.tsx` | C2 | collapsed `justify-center`、badge collapsed ドット |
| `apps/web/src/styles/legacy-public.css` | C4 | `[data-component="public-footer"]` `margin-top:40px` → `margin-top:auto` |
| `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | C1, C2, C4 | footer 領域 / main flex-column / collapse 構造の契約追加 |
| `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` | C3 | 外側クリック / Escape close、内側維持 |
| `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | C2 | collapsed justify-center / badge ドット |

### C1 + C4: レイアウト固定（CSS 差分）

```css
/* globals.css — [data-shell="sidebar"]（行 1417 付近 / 1547 付近の両ブロックを整合） */
[data-shell="sidebar"] {
  position: sticky;
  top: 0;
  height: 100dvh;  /* dynamic viewport（モバイル URL バー追従） */
  max-height: 100dvh;
  overflow: hidden; /* collapse はみ出し抑止（C2）+ 内部スクロール委譲（C1） */
  border-right: 1px solid var(--ubm-color-border-default);
  background: var(--ubm-color-surface-panel);
}
```

```css
/* legacy-public.css — [data-component="public-footer"]（行 716 付近） */
[data-component="public-footer"] {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 32px 28px;
  margin-top: auto;   /* was: 40px — sticky footer 化（C4） */
  border-top: 1px solid var(--ubm-color-border-default);
  color: var(--ubm-color-text-secondary);
  font-size: 12px;
}
```

> 色・寸法はすべて既存 `--ubm-color-*` / `--shell-*` トークン経由。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` なし（AC-5・`verify-design-tokens` 非抵触）。

### C1 + C4: SidebarShell.tsx（className 差分）

aside を「スクロール部（Brand + Nav）」と「固定フッター部（公開サイトに戻る + user menu + collapse トグル）」の 2 段 flex に再編する。

```tsx
// スクロール部と固定 footer 部を分離
const sidebarNavContent = (sidebarCollapsed: boolean) => (
  <>
    <SidebarBrand collapsed={sidebarCollapsed} />
    <SidebarNav navGroups={navGroups} collapsed={sidebarCollapsed} activePath={activePath} />
  </>
);

const sidebarFooterContent = (sidebarCollapsed: boolean) => (
  <>
    {role === "admin" ? <AdminPublicReturn collapsed={sidebarCollapsed} /> : null}
    <SidebarUserMenu role={role} user={user} collapsed={sidebarCollapsed} />
  </>
);

// desktop aside footer
<div
  data-shell-block="sidebar-footer"
  className="mt-auto flex shrink-0 flex-col gap-2 border-t border-[var(--shell-bar-border)] pt-2"
>
  {sidebarFooterContent(collapsed)}
  <SidebarCollapseToggle />
</div>
```

```tsx
// aside: overflow-hidden + flex 構造（height は CSS 側）
<aside
  data-shell="sidebar"
  data-collapsed={collapsed ? "true" : "false"}
  className="hidden w-[var(--shell-bar-w)] shrink-0 flex-col gap-3 overflow-hidden border-r border-[var(--shell-bar-border)] bg-[var(--shell-bar-bg)] p-3 data-[collapsed=true]:w-[var(--shell-bar-w-collapsed)] md:flex"
>
  {sidebarNavContent(collapsed)}
  {/* sidebar-footer block */}
</aside>

// <main>: 縦 flex 化（footer の margin-top:auto が効く前提）
<main
  data-shell="main"
  data-route={routeKey}
  className="flex min-w-0 flex-1 flex-col"
>
  {children}
</main>
```

> 従来 aside 末尾の collapse toggle wrapper は `sidebar-footer` ブロックへ統合。drawer は `sidebarNavContent(false)` + `sidebarFooterContent(false)` を描画し、desktop collapse toggle は aside 側だけに残す。

### C2: SidebarNavItem.tsx（badge collapsed ドット）

```tsx
// 行クラス: collapsed は justify-center / gap-0
const itemClassName = `flex items-center rounded-sm px-3 py-2 text-sm ... ${collapsed ? "justify-center gap-0" : "gap-3"}`;

// badge: collapsed はドット、expanded は Chip
{showBadge && item.badge ? (
  collapsed ? (
    <span
      data-shell-block="nav-badge-dot"
      className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--ubm-color-accent-ink)]"
    >
      <span className="sr-only">{item.badge.count}</span>
    </span>
  ) : (
    <Chip tone={TONE_TO_CHIP[item.badge.tone]}>{item.badge.count}</Chip>
  )
) : null}
```

> collapsed では可視数字をドットへ縮約し、`sr-only` で件数を保持する。expanded 状態では従来どおり `Chip` が可視件数を担う。

### C3: SidebarUserMenu.tsx（外側クリック / Escape listener API）

state owner は `<details>.open` のまま（I-2 / I-8）。React state は増やさず、document listener は常時登録し、handler 冒頭で `details.open` を見て no-op にする。

```tsx
import { useEffect, useRef } from "react";
import { browserDocument } from "../../lib/is-browser";

export function SidebarUserMenu({ role, user, collapsed }: SidebarUserMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  // route 変化で自動 close（既存維持）
  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  // 外側クリック / Escape で close
  useEffect(() => {
    const doc = browserDocument();
    if (!doc) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = detailsRef.current;
      if (!el?.open) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      el.open = false;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const el = detailsRef.current;
      if (!el?.open || e.key !== "Escape") return;
      el.open = false;
    };
    doc.addEventListener("pointerdown", onPointerDown);
    doc.addEventListener("keydown", onKeyDown);
    return () => {
      doc.removeEventListener("pointerdown", onPointerDown);
      doc.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details
      ref={detailsRef}
      data-shell-block="user-menu"
      className="group relative ..."
    >
      {/* summary: collapsed は justify-center（アバターのみ中央寄せ）。popover は既存どおり */}
    </details>
  );
}
```

### listener API シグネチャ一覧

| 要素 | shape | 公開範囲 |
|------|-------|---------|
| `onPointerDown(e: PointerEvent) => void` | `detailsRef` 外側押下で `details.open=false` | `SidebarUserMenu` 内ローカル |
| `onKeyDown(e: KeyboardEvent) => void` | `Escape` で close | `SidebarUserMenu` 内ローカル |
| `browserDocument()` | `Document \| undefined`（SSR/Workers は undefined）| `apps/web/src/lib/is-browser.ts` 既存・再利用 |

### エラーハンドリング / エッジケース

- `browserDocument()` が undefined（SSR / Cloudflare Workers）→ effect は早期 return（no-op）。throw しない（I-5）。
- summary 自身のクリック: `el.contains(target)` が true → 外側判定で誤閉じしない。`<details>` ネイティブトグルがそのまま機能（I-8）。
- popover 内リンククリック: route 変化 effect が close を担う（既存挙動維持）。`pointerdown` は内側のため無反応。
- `100dvh` 非対応ブラウザ: 対象ブラウザの現行対応を前提に `height/max-height: 100dvh` へ統一。追加 fallback は今回入れない。
- listener は mount 中登録し、handler 冒頭で `details.open` を見て no-op。React state を増やさないため hydration と状態同期が単純。
- hydration: footer 固定は CSS（margin-auto / flex / height）のみで実現。`onToggle` / listener は mount 後のみ動作し初期 HTML 不変（I-6・mismatch なし）。

### 設定値 / 定数

| 項目 | 値 | 由来 |
|------|----|----|
| sidebar 高さ | `100dvh` + `max-height: 100dvh` | globals.css |
| collapse 幅 | `var(--shell-bar-w-collapsed)`（4rem）| tokens.css 既存 |
| 展開幅 | `var(--shell-bar-w)` | tokens.css 既存 |
| footer 上余白 | `padding: 32px 28px`（breathing room 保持）| legacy-public.css |
| badge ドット | `h-2 w-2 rounded-full`（8px 円）| SidebarNavItem |
| 新規 DOM 契約 | `data-shell-block="sidebar-footer"` / `data-shell-block="nav-badge-dot"`（additive・I-7 非抵触）| SidebarShell / SidebarNavItem |

### 視覚証跡

本タスクは **VISUAL**。視覚証跡は Phase 11 の screenshot-plan（`phase-11-manual-test.md` / `outputs/phase-11/`）を参照する。

- 対象画面: 公開ホーム `/` を admin ログイン状態で閲覧した sidebar / footer（ユーザー報告のスクリーンショット起点）。expanded / collapsed の両状態、アカウント popover open 状態、短コンテンツページの footer 位置を撮影対象とする。
- 取得タイミング: staging（`ubm-hyogo-web-staging`、認証必須）で取得。**screenshot 取得は user-gated**（Phase 13 blocked）。
- 代替自動証跡: focused vitest（`SidebarShell.spec` の footer 領域 DOM 契約 / `SidebarNavItem.spec` の collapsed 構造 / `SidebarUserMenu.spec` の開閉挙動）で AC-1〜AC-4 を保護する。
- local screenshot evidence: `outputs/phase-11/local-public-home.png` / `outputs/phase-11/local-public-privacy.png`（public viewer shell の sidebar footer 固定を確認）。
- local automated evidence: focused vitest 3 files / 22 tests PASS、web typecheck PASS、web verify-design-tokens PASS、web lint PASS。
