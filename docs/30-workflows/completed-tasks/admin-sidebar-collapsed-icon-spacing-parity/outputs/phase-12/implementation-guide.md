# Implementation Guide — 折りたたみサイドバーのアイコン間隔を展開と揃える

## Part 1（中学生にもわかる説明）

### 背景（どんな困りごと？）

パソコンの管理画面には、左側にメニューの棒（サイドバー）があります。この棒は、ボタンを押すと
「文字つき（広い状態）」と「アイコンだけ（細い状態）」を切り替えられます。

困っていたのは、アイコンだけの状態にすると、上下のアイコンの間が**やたら空いて**しまうことです。
文字つきのときは詰まっているのに、アイコンだけにすると間延びして見えて、見た目がそろいません。

### 要約（なぜそうなる？ 日常の例え）

アイコンの絵そのものは小さい（はがきサイズ）のに、その周りに**透明な大きい箱**（封筒）をつけて
いました。文字つきのときは封筒も小さく、絵にぴったりでした。ところがアイコンだけにすると、封筒が
急に大きい箱（40mm 四方）に変わるのに、中の絵は同じ小ささのまま。だから絵の上下に**すき間**が
できて、列と列の間が広がってしまったのです。

### 実装ステップ（どう直す？）

直し方はかんたんです。**アイコンだけのときの封筒の高さを、絵にぴったりの小ささに戻す**だけ。
中の絵（はがき）は元から小さいので、封筒を小さくしても絵は変わりません。横幅はそのままにして
真ん中ぞろえを保つので、アイコンは今まで通りきれいに中央に並びます。

これで、アイコンだけのときも、文字つきのときと同じ間隔になり、見た目がそろいます。

### 既知制限（今回はやらないこと）

ブランドのロゴの箱や、ユーザーアバターの丸は、メニューとは別の場所にあり、線で区切られていて
列の間隔には関係しないので、今回はさわりません。色や横の余白、開け閉めの動きも変えません。

## Part 2（技術者向け）

### 背景

折りたたみ（collapsed）時の nav アイコン縦ピッチが展開（expanded）時より広い。
原因は icon ラッパー span の高さが状態で切り替わるが、内部グリフは固定サイズである点。

### 要約（真因）

- `apps/web/src/components/shell/SidebarNavItem.tsx:35` のアイコンラッパー span:
  `collapsed ? "h-10 w-10" : "h-[18px] w-[18px]"`。collapsed は `h-10`（40px 四方）。
- グリフは `apps/web/src/components/shell/icons.tsx` の `Stroke` が `width="18" height="18"` で
  **固定 18×18px**。`h-10` はグリフを拡大せず、上下に約 11px ずつの余白だけ生む。
- ピッチ計算: collapsed ≈ `py-2`(16px) + 40px = 56px、expanded ≈ `py-2`(16px) + ~20px = 36px。
  差 22px は icon-box 高さのみに由来。`<ul> gap-0.5`(2px) は両状態共通で無罪。

### 実装ステップ（className diff）

`SidebarNavItem.tsx:35`:

```diff
- className={`inline-flex shrink-0 items-center justify-center text-[var(--ubm-color-text-secondary)] ${collapsed ? "h-10 w-10" : "h-[18px] w-[18px]"}`}
+ className={`inline-flex shrink-0 items-center justify-center text-[var(--ubm-color-text-secondary)] ${collapsed ? "h-[18px] w-10" : "h-[18px] w-[18px]"}`}
```

`SidebarShell.tsx:36`（`AdminPublicReturn`「公開サイトに戻る」リンク）:

```diff
- className={`inline-flex shrink-0 items-center justify-center text-[var(--ubm-color-text-secondary)] ${collapsed ? "h-10 w-10" : "h-[18px] w-[18px]"}`}
+ className={`inline-flex shrink-0 items-center justify-center text-[var(--ubm-color-text-secondary)] ${collapsed ? "h-[18px] w-10" : "h-[18px] w-[18px]"}`}
```

- 高さのみ 40px→18px に縮小。横幅 `w-10`（40px）は維持し、collapsed の `link` 側 `w-full justify-center`
  と合わせて中央寄せを担保（AC-3）。
- 修正後 collapsed ピッチ ≈ `py-2`(16px) + 18px + nav `gap-0.5` ≈ 36px（expanded ±2px）。
  不足する場合は `h-5`(20px) 昇格余地あり（AC-1 の ±2px 許容内で調整）。

### TypeScript 観点

props / 型 / DOM 構造の変更なし。`SidebarNavItemProps` / `SidebarShellProps` 不変。
変更は className 文字列リテラル内の Tailwind utility のみ。`ShellIcon` / `Stroke` も不変。

### テスト（回帰）

`apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` の collapsed icon-box アサーション
（既存は `expect(link?.querySelector('[aria-hidden="true"]')?.className).toContain("h-10")`）を
新 className `h-[18px]` に追従更新し、加えて「collapsed の icon-box が `h-[18px]`（=expanded と同高さ）」を
検証する回帰ケースを追加する。他の既存 spec（label sr-only / tooltip / active）は DOM 不変ゆえ全 PASS。

### 検証コマンド

```bash
pnpm --filter @ubm-hyogo/web typecheck
pnpm --filter @ubm-hyogo/web verify-design-tokens
pnpm exec vitest run --config=vitest.config.ts apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx
grep -rnE '#[0-9a-fA-F]{3,6}' apps/web/src/components/shell/SidebarNavItem.tsx apps/web/src/components/shell/SidebarShell.tsx   # HEX 0 件
git diff --stat -- apps/api   # 差分 0
```

### 既知制限（OOS）

- OOS-1 `SidebarBrand.tsx:20` ロゴ箱、OOS-2 `SidebarUserMenu.tsx:56` アバター箱は独立プリミティブ
  （border 区切り・nav 行間隔に非寄与）ゆえ非対象。
- OOS-3 水平余白・色・トグル挙動は不変。
- OOS-4 スクショ内「セッション情報を取得できませんでした」は別タスク（profile 観測性）。

## 視覚証跡（Phase 11 / VISUAL）

local screenshot capture 経路として `/visual-harness/admin-sidebar-spacing-collapsed`、
`/visual-harness/admin-sidebar-spacing-expanded` と
`apps/web/playwright/tests/visual/admin-sidebar-spacing.spec.ts` を追加した。
PNG 実体は 2026-06-11 の実行で Next dev webServer が対象 harness URL を返さず未取得。
未取得を PASS と主張せず、runtime blocked / staging user-gated として扱う。

| canonical 名 | 内容 |
| --- | --- |
| `sidebar-collapsed-before.png` | 修正前の広い縦間隔（修正後状態からは revert なしに再現しない） |
| `sidebar-collapsed-after.png` | 修正後のピッチ（展開と一致、capture spec 追加済み / runtime blocked） |
| `sidebar-expanded-reference.png` | 展開時の基準ピッチ（capture spec 追加済み / runtime blocked） |
| `sidebar-collapsed-after-footer.png` | 修正後の「公開サイトに戻る」footer のピッチ統一（capture spec 追加済み / runtime blocked） |

capture command:

```bash
pnpm --dir apps/web exec playwright test --config=playwright.parallel09.config.ts apps/web/playwright/tests/visual/admin-sidebar-spacing.spec.ts
```
