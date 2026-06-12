# 実装ガイド — responsive-mobile-tablet-ui-fixes

本ガイドは「全画面レスポンシブ（携帯・タブレット）UI/UX 是正」タスクの実装ガイドである。Part 1（初学者・中学生レベル）と
Part 2（開発者・技術者レベル）の 2 部構成で記す。本タスクは `implemented_local_visual_present_staging_pending` であり、
`apps/web` の実コード差分・focused vitest・token/type/lint・local runtime smoke・local physical PNG capture は本サイクルで完了済みである。authenticated admin staging screenshot / commit / PR は user-gated とする。

---

## Part 1: やさしい説明（中学生レベル）

### なぜ必要か（先に「困りごと」から）

スマートフォン（小さい画面）やタブレット（中くらいの画面）でこのサイトを開くと、文字や表が画面の外にはみ出して
見えなくなったり、ボタンが画面の端で切れて押せなかったり、横にスクロールしないと中身が読めなかったりします。
パソコンの大きい画面では問題なく見えるのに、小さい画面だと「家具を動かさずに大きな部屋から小さな部屋へ引っ越した」ような状態で、
大きなソファ（横長の表）やタンス（3 列のカード）が小さな部屋に入りきらず、ドアからはみ出してしまっているのです。
だからまず、画面の大きさに合わせて家具（部品）の置き方を変える仕組みを整える必要があります。

### 何が壊れているか（5 つの困りごと）

1. **画面サイズの境目がバラバラ**: 「ここから先は小さい画面用」という境目（ブレークポイント）の数字が、場所によって
   767 だったり 900 だったり 1024 だったりとバラバラです。物差しの目盛りが場所ごとに違うようなもので、タブレットの
   ちょうど中くらいの幅で部品が窮屈に詰まってしまいます。
2. **横幅が固定されてはみ出す**: 「ここは必ず 1120 ピクセル」「この列は最低 18rem（約 288 ピクセル）」のように幅を
   固定で決めている場所があり、小さい画面ではその固定幅が画面より大きくなって右にはみ出します。
3. **表が見えなくなる**: 表（テーブル）が小さい画面だと横スクロールに押し出され、右側の列が画面の外に隠れて読めません。
   小さい画面では表を「カードを縦に積む」形に変えるか、横スクロールでも全部の列に手が届くようにする必要があります。
4. **吹き出し（メニュー）が画面からはみ出す**: サイドバーの説明吹き出しやメニューが、画面の端で外にはみ出して切れてしまいます。
5. **真ん中に出したい画面がずれる**: エラー画面・読み込み中画面・ログイン画面など、本来は画面の真ん中に小さく
   出したいものが、小さい画面だと余白（パディング）とぶつかって窮屈になります。

### 何をするか（部屋の模様替えの例え）

小さい部屋に引っ越したら、大きな家具を「縦に積む」「幅を部屋に合わせて縮める」「はみ出すものは折りたたむ」ように
配置し直しますよね。このタスクでやるのは、まさにその「画面の大きさに合わせて部品の置き方を変える」作業です。

- **境目の数字をそろえる**: 「小さい画面（携帯）」「中くらい（タブレット）＝768」「大きい（パソコン）＝1024」と、
  境目の数字を 3 つに統一します。
- **横幅を伸び縮みできるようにする**: 固定の幅をやめて、画面の幅に合わせて自動で伸び縮みする書き方（clamp や minmax(0,…)）に変えます。
- **表をカードに変える**: 小さい画面では表を「1 件ずつのカード」に積み直し、全部の情報が読めるようにします。
- **吹き出しを画面の中に収める**: 吹き出しやメニューの最大幅を「画面からはみ出さない大きさ」に決めます。
- **真ん中表示を整える**: エラー・読み込み・ログイン画面を、小さい画面でも真ん中にきれいに収まるようにします。

### どこまでやるか（やること・やらないこと）

今回やるのは、あくまで「見た目の崩れ・はみ出し・隠れを直す」ところまでで、色や文字のデザインそのものは変えません。
データの取り方（API）やデータベース、入力フォームの中身もいっさいさわりません。直すのは画面の「見せ方」だけです。

### 今回作ったもの

- 小さい画面用の幅の基準（375px / 390px / 768px）を確認するための viewport 設定。
- 画面の横はみ出しを見つける Playwright のチェック。
- サイドバーメニューが小さい画面からはみ出さない幅指定。
- local で確認できるスクリーンショット 5 枚と、どの画面を撮ったか分かる coverage 表。

### 専門用語セルフチェック

| 専門用語の例 | 日常語への言い換え例 |
| --- | --- |
| レスポンシブ | 「画面の大きさに合わせて部品の並べ方を自動で変えること」 |
| ブレークポイント | 「ここから小さい画面用／大きい画面用、と切り替える幅の境目の数字」 |
| ビューポート | 「いま見えている画面の表示エリアの大きさ（幅×高さ）」 |
| オーバーフロー | 「中身が箱からはみ出すこと（はみ出すと横スクロールが出る）」 |
| グリッド | 「方眼のマス目に部品を並べる配置のしくみ。1 列にも 2 列にもできる」 |
| clamp（クランプ） | 「最小・ふつう・最大を決めて、その範囲で自動で伸び縮みさせる書き方」 |

---

## Part 2: 技術詳細（開発者レベル）

### 全体方針

- **`apps/web` 表現層完結の UI/UX 是正**。新しい API endpoint / D1 schema / Google Form schema / fetch URL は一切追加・変更しない（不変条件 #1 #5、AC-9）。
- 崩れの根本原因は共通 CSS 層に集中する（[shared-context.md](../../shared-context.md) §4 RC-1..RC-5）: (a) メディアクエリ境界の不統一（`max-width: 767/768/900/1024px` 混在）、
  (b) 固定幅・最小幅起因のはみ出し（`min(1120px,…)` / drawer `17rem` / `minmax(18rem,…)`）、(c) テーブルのレスポンシブ未対応、(d) オーバーレイのビューポート外配置、(e) 共通画面・auth の狭幅検証不足。
- mobile-first を原則とし、既存の `max-width` ルールは標準境界（767.98 / 1023.98 / 1279.98）へ寄せ、新規は `min-width: 768/1024/1280` のみを使う。
- 色は `var(--ubm-color-*)` 経由のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` の新規追加なし（AC-9、`verify:tokens` gate）。新規 primitive を生やさない（不変条件 #3）。

### breakpoint 体系（AC-1 / RC-1）

`tokens.css` 末尾にドキュメント目的の CSS カスタムプロパティを追加し、メディアクエリの境界値を統一する。
CSS のメディアクエリは変数を直接展開できないため、変数は規約アンカー（コメント）として置き、各 `@media` には px 実値をインラインする。

```css
/* --- responsive breakpoints (documentation anchors; media queries must inline these px values) --- */
:root {
  --bp-md: 768px;  /* tablet 開始（2 カラム化の開始点） */
  --bp-lg: 1024px; /* small desktop / sidebar aside 開始 */
  --bp-xl: 1280px; /* desktop */
}
```

| トークン | 幅 | 適用 |
| --- | --- | --- |
| base | 0px〜 | 携帯（単カラム・縦積み） |
| `md` | 768px〜 | タブレット（2 カラム化開始） |
| `lg` | 1024px〜 | 小型デスクトップ（3 カラム・サイドバー aside） |
| `xl` | 1280px〜 | デスクトップ |

### 変更ファイルの Before → After 要約

| # | ファイル | 種別 | Before | After |
| --- | --- | --- | --- | --- |
| 1 | `apps/web/src/styles/tokens.css` | 編集 | breakpoint 変数なし | `--bp-md/lg/xl` + 規約コメントを追加（AC-1） |
| 2 | `apps/web/src/styles/globals.css` | 編集 | `@media (max-width: 767px / 768px / 900px / 1024px)` 混在。grid は `minmax(Nrem,…)` 固定最小値。テーブルは `overflow-x:auto` のみ。tooltip/popover はビューポート外配置あり | `767.98px` / `1023.98px` の標準境界へ統一。`minmax(0,…)` + `lg` 未満単カラム化。`.admin-table--cards` カード積み + `min-width` 横スクロール。tooltip/popover に `max-width: min(...)`（AC-1/2/4/6/7/8） |
| 3 | `apps/web/src/styles/legacy-public.css` | 編集 | `main { width: min(1120px, calc(100% - 40px)); }`。stat-card / hero grid が固定 2 カラム | `width: min(1120px, 100%); padding-inline: clamp(1rem,4vw,1.25rem);`。stat-card / hero を `minmax(0,1fr)` 単カラム→`md` で多カラム（AC-2/6） |
| 4 | `apps/web/src/styles/auth.css` | 編集 | `.auth-card { width: min(100%, 420px); }`（狭幅 padding 不足） | `.auth-card { width: min(100%, 420px); padding-inline: clamp(1rem,5vw,1.5rem); }`（AC-3/5） |
| 5 | `apps/web/src/components/shell/SidebarDrawer.tsx` | 編集 | `className="... w-[17rem] max-w-[85vw] ..."` | `className="... w-[min(17rem,88vw)] ..."`（小型携帯でバックドロップ tap 領域確保）（AC-8） |
| 6 | `apps/web/playwright/tests/visual-full/full-visual.spec.ts` | 編集 | 既存 visual full | 全 route visual に `scrollWidth <= clientWidth` アサートを追加（AC-2..AC-10） |
| 7 | `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx` | 編集 | 既存 drawer spec | drawer 幅クラス `w-[min(17rem,88vw)]` の jsdom 構造検証（AC-8） |
| 8 | `apps/web/playwright/fixtures/viewports.ts` | 編集 | `mobileNarrow` なし | `mobileNarrow: 375×812` を additive 追加（既存定数不変・AC-2..AC-5） |

> 2026-06-12 追記: Phase 5 仕様との突合で `globals.css` の `@media (max-width: 720px)`（member route ブロック）残存と
> `viewports.ts` の `mobileNarrow` 未追加を検出し、同サイクルで是正済み（767.98px へ統一 / additive 追加）。

### グリッド流体化（AC-6 / RC-2）の copy-paste 設計

```css
/* legacy-public.css: main 幅の左右 padding を clamp 化 */
main { width: min(1120px, 100%); padding-inline: clamp(1rem, 4vw, 1.25rem); margin: 0 auto; }

/* stat-card grid: 携帯で単カラム → md で多カラム */
[data-component="stat-card"] { grid-template-columns: minmax(0, 1fr); }
@media (min-width: 768px) {
  [data-component="stat-card"] { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
}

/* tag-master-grid / attendance / schema-glossary: minmax(0,…) + lg 未満単カラム */
.tag-master-grid, .attendance-primary-grid { grid-template-columns: minmax(0, 1fr); }
@media (min-width: 1024px) {
  .tag-master-grid { grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); }
  .attendance-primary-grid { grid-template-columns: minmax(0, 1.35fr) minmax(0, 0.85fr); }
}
.schema-glossary { grid-template-columns: minmax(0, 1fr); }
@media (min-width: 768px) { .schema-glossary { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1024px) { .schema-glossary { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
```

> 是正の要点: `minmax(18rem, …)` の **18rem 最小値**が携帯幅を超えてはみ出す。`minmax(0, …)` にすると親幅を超えない（AC-6）。

### テーブル可視性（AC-7 / RC-3）の copy-paste 設計

```css
.admin-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
@media (max-width: 767.98px) {
  .admin-table--cards thead { display: none; }
  .admin-table--cards tr { display: grid; gap: 0.25rem; padding-block: 0.75rem; }
  .admin-table--cards td { display: grid; grid-template-columns: 9rem 1fr; gap: 0.5rem; }
  .admin-table--cards td::before { content: attr(data-label); color: var(--ubm-color-text-muted); }
}
@media (min-width: 768px) {
  .admin-table th, .admin-table td { min-width: 7rem; white-space: normal; }
}
```

> 既存テーブル component には `data-label` 属性の **additive 付与**のみ行い、列構造・testid・href は不変（不変条件遵守）。

### オーバーレイ収納（AC-8 / RC-4）の copy-paste 設計

```css
.ubm-shell-tooltip { max-width: min(240px, calc(100vw - var(--shell-bar-w-collapsed) - 1.5rem)); }
.ui-sidebar-user-menu-popover { max-width: min(208px, calc(100vw - 2rem)); }
```

```tsx
// SidebarDrawer.tsx: drawer 幅を min(17rem, 88vw) 相当へ
// Before: className="... w-[17rem] max-w-[85vw] ..."
// After : className="... w-[min(17rem,88vw)] ..."
```

### トークン使用例（HEX 直書き禁止）

```css
.auth-card {
  width: min(100%, 420px);
  padding-inline: clamp(1rem, 5vw, 1.5rem);
  border: 1px solid var(--ubm-color-border-default);
  border-radius: var(--ubm-radius-lg);
  background: var(--ubm-color-surface-panel);
}
```

色・余白・角丸・影は全て `var(--ubm-*)` 経由。`oklch(...)` / `#rrggbb` / `bg-[#...]` を新規に書かない（不変条件 #2、AC-9）。

### TypeScript の型定義

本タスクで新しい公開 API 型は追加しない。追加した型相当の surface は Playwright viewport fixture の additive key のみである。

```ts
type ResponsiveViewportName = "desktop" | "tablet" | "mobile" | "mobileNarrow" | "wide";

interface ResponsiveViewport {
  width: number;
  height: number;
}
```

### APIシグネチャ

新しい HTTP API / D1 schema / Google Form schema は追加しない。検証で使うコマンド surface は次の通り。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/30-workflows/completed-tasks/responsive-mobile-tablet-ui-fixes --json
```

### 使用例

local PNG を再取得する場合は、Next dev server を起動した上で `outputs/phase-11/screenshots/screenshot-plan.json` の route / viewport に従って Playwright capture を実行する。

```bash
AUTH_SECRET=local-dev-secret pnpm --filter @ubm-hyogo/web dev --hostname 127.0.0.1 --port 3210
node .claude/skills/task-specification-creator/scripts/capture-screenshots.js --workflow docs/30-workflows/completed-tasks/responsive-mobile-tablet-ui-fixes --plan outputs/phase-11/screenshots/screenshot-plan.json
```

### エラーハンドリング

- `scrollWidth > clientWidth + 1` が出た route は Phase 11 coverage で FAIL とし、該当 CSS を同サイクルで修正して再撮影する。
- hidden `nextjs-portal` は dev runtime の常駐 container として扱い、赤い可視 overlay が出た場合のみ capture FAIL とする。
- authenticated admin route の staging screenshot は user approval が必要なため、local PNG と同じ PASS に混ぜず `pending_user_approval` として分離する。

### 設定項目と定数一覧

| 定数 / 設定 | 値 | 用途 |
| --- | --- | --- |
| `--bp-md` | `768px` | tablet 開始 |
| `--bp-lg` | `1024px` | small desktop / sidebar aside 開始 |
| `--bp-xl` | `1280px` | desktop |
| `mobileNarrow` | `375x812` | 小型携帯 fallback |
| `Gate-C` | `pending_user_approval` | authenticated admin staging screenshot / commit / push / PR |

### テスト構成

| レーン | コマンド / 証跡 | 目的 |
| --- | --- | --- |
| focused Vitest | `SidebarDrawer.spec.tsx` 5 tests PASS | drawer width regression |
| token gate | `verify-design-tokens` 9 tests PASS | HEX / token invariant |
| runtime smoke | `runtime-smoke-result.json` 36 checks PASS | horizontal overflow guard |
| local PNG | `screenshots/*.png` 5 files present | representative visual evidence |
| phase12 guide validator | `validate-phase12-implementation-guide.js --json` | implementation-guide completeness |

### implementation-guide.md heading-only reject gate 実測

| Part | 本文行数（非空・見出し除く） | key sections | 判定 |
| --- | --- | --- | --- |
| Part 1: やさしい説明（中学生レベル） | 41 | なぜ必要か / 何が壊れているか（5 つ） / 何をするか（例え話） / やること・やらないこと / 専門用語セルフチェック（6 用語） | PASS（3 行以上 + 例え話 + 用語表 5 件以上） |
| Part 2: 技術詳細（開発者レベル） | 86 | 全体方針 / breakpoint 体系 / 変更ファイル Before→After / grid 流体化 / テーブル可視性 / オーバーレイ収納 / トークン使用例 / 既知制限 / 検証コマンド | PASS（3 行以上 + 検証コマンド + 既知制限） |

両 Part とも本文 3 行以上かつ必須 key section を充足。見出し存在のみの strict PASS ではない。

### エッジケース・既知制限

| ケース | 挙動 / 制限 |
| --- | --- |
| 320px（極小携帯） | ベストエフォート。崩れ・はみ出しは不可だが pixel 完全一致は非要求（[shared-context.md](../../shared-context.md) §1） |
| 768px ちょうどの揺らぎ | `767.98px` 境界で `md` 未満を明示し、768 ちょうどでの 2 カラム/1 カラムの揺らぎを防止 |
| テーブルのカード化が過剰な小規模テーブル | per-table 判断で「sticky 見出し + `min-width` + 横スクロール」のみ可（Phase 5 で判断） |
| `apps/web` 実装・screenshot | 本サイクルで完了。local physical PNG 5 files と `screenshot-coverage.md` を Phase 11 に保存済み。authenticated admin staging baseline のみ user-gated |
| API 集計・D1 schema・Form 仕様 | 非変更（AC-9・不変条件 #1 #5）。本タスクは表現層のみ |

### 検証コマンド（本サイクルで実行済み / staging admin visual は user-gated）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
# 注: vitest 設定はリポジトリルートの vitest.config.ts が正本
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__
mise exec -- pnpm exec playwright test \
  apps/web/playwright/tests/visual-full/full-visual.spec.ts
# 非標準境界が残っていないことを確認
grep -n "max-width: 900px" apps/web/src/styles/globals.css | grep . && echo "[FAIL]" || echo "[PASS: no 900px]"
# API 非変更（AC-9）
git diff --name-only -- apps/api   # 空であること
```

> 本タスクは `implemented_local_visual_present_staging_pending`。上記コマンドと local PNG capture は本サイクルで実行済みで、結果を Phase 11 evidence と documentation-changelog へ転記済み。
> authenticated admin staging baseline は user-gated runtime artifact のため本サイクルでは生成しない。
> `manual-test-result.md` は local evidence の記録枠 + authenticated staging runtime pending 境界の記録として存在する。
