# Phase 5: 実装手順 — CSS / component レスポンシブ是正の copy-paste 設計

## メタ情報

- task_id: `responsive-mobile-tablet-ui-fixes`
- 前提: [phase-2-design.md](phase-2-design.md)（変更ファイル一覧・CSS ブロック）/ [phase-4-test-plan.md](phase-4-test-plan.md)（TC）/ [shared-context.md](shared-context.md)
- 注記: **本 Phase は実装手順の確定（仕様）であり、実装の実行はしない**。実コード変更・commit は後続 `03.実装.md`（実装フェーズ）の責務。

## 目的

Phase 2 設計の各変更ファイルを「種別・対象行・Before→After 差分方針・対応 AC・シグネチャ」レベルで copy-paste 可能に確定し、後続実装が迷いなく Red→Green できる状態にする。

## 実行タスク

1. 新規/修正ファイルパス一覧を確定する（冒頭必須）。
2. 各ファイルの Before→After CSS / className 差分方針を copy-paste 可能レベルで定義する（§1-9）。
3. per-table のカード化 vs sticky 横スクロールの判断基準を確定する（§5）。
4. Red→Green の実装順序を確定する。

> 本 Phase は手順の確定（仕様）であり、実コード変更・commit は後続 `03.実装.md` の責務。

## 変更ファイル一覧（冒頭必須・Feedback RT-03）

### 新規作成

| パス | 役割 | 対応 AC |
| --- | --- | --- |
| `apps/web/playwright/tests/visual-full/full-visual.spec.ts` | 既存 visual full に横スクロール 0 アサート追加 | AC-2..AC-8, AC-10 |

### 修正（編集）

| パス | 変更概要 | 対応 AC |
| --- | --- | --- |
| `apps/web/src/styles/tokens.css` | `--bp-md/lg/xl` ドキュメント変数追加 | AC-1 |
| `apps/web/src/styles/globals.css` | メディアクエリ境界統一・grid 流体化・テーブル可視性・オーバーレイ収納 | AC-1,2,4,6,7,8 |
| `apps/web/src/styles/legacy-public.css` | `main` 幅 clamp・stat-card / hero grid 流体化 | AC-2,6 |
| `apps/web/src/styles/auth.css` | auth フォーム狭幅 padding（width は既存 `min(100%,420px)` 維持） | AC-3,5 |
| `apps/web/src/components/shell/SidebarDrawer.tsx` | drawer 幅クラス `w-[17rem] max-w-[85vw]` → `w-[min(17rem,88vw)]` | AC-8 |
| `apps/web/src/components/shell/SidebarShell.tsx` | tooltip/popover viewport-safe max-width（必要時のみ・該当 CSS が globals 側なら本ファイルは無変更可） | AC-8 |
| `apps/web/app/error.tsx` | ルートコンテナを中央寄せ・狭幅 padding utility 化 | AC-5 |
| `apps/web/app/not-found.tsx` | 同上 | AC-5 |
| `apps/web/app/loading.tsx` | スピナー中央維持 utility | AC-5 |
| `apps/web/playwright/fixtures/viewports.ts` | `mobileNarrow`(375) を additive 追加（既存定数不変） | AC-2..AC-5 |
| `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx` | 幅クラス検証を additive（既存 55 行不変） | AC-8 |

> ルート route 実体は `apps/web/app/`（`apps/web/app/` ではない）。`(public)` / `(admin)/admin` / `(member)/profile` / `(auth)/login` segment 別の `error.tsx`/`loading.tsx`/`not-found.tsx` も同方針で揃える（共通スタイルは globals 側のユーティリティクラスに寄せ、route 個別の重複を避ける）。

## 1. tokens.css（AC-1）

末尾に追記（CSS 変数は media query 内で展開できないため**ドキュメント目的**・参照規約固定）:

```css
/* --- responsive breakpoints (documentation anchors; media queries must inline these px values) --- */
:root {
  --bp-md: 768px;   /* tablet 開始 */
  --bp-lg: 1024px;  /* small desktop / sidebar aside 開始 */
  --bp-xl: 1280px;  /* desktop */
}
```

## 2. globals.css 境界統一（AC-1 / RC-1）

実コードの非標準境界（確認済み: `:759 max-width:767`, `:1376 max-width:900`, `:1730/:2960/:3249 max-width:768`, `:2345 max-width:720`, `:3272 max-width:767`）を標準へ寄せる。

| Before | After | 理由 / 対応 |
| --- | --- | --- |
| `@media (max-width: 767px)` | `@media (max-width: 767.98px)` | `md`(768) 未満を明示・768 ちょうどの揺らぎ防止 |
| `@media (max-width: 900px)` | `@media (max-width: 1023.98px)` | タブレット帯(768-1024)で詰まる 2 カラムを `lg` 未満単カラム化 |
| `@media (max-width: 768px)` | `@media (max-width: 767.98px)` または `1023.98px` | 「`md` 未満で隠す」意図は `767.98`、「タブレットでも単カラム」意図は `1023.98`。各ブロックの意図で per-block 判断 |
| `@media (max-width: 720px)` | `@media (max-width: 767.98px)` | 非標準 720 を `md` 未満へ集約 |
| `@media (min-width: 768px)` | 維持 | 標準境界・変更不要 |

> per-block 判断基準: 「カラム数を減らす」グリッドは `1023.98px`（タブレットでも単カラム）、「mobile 専用の表示切替（drawer trigger 等）」は `767.98px`。

## 3. legacy-public.css グリッド流体化（AC-2,6 / RC-2）

```css
/* main 幅: 左右 padding を clamp 化 */
main {
  width: min(1120px, 100%);
  padding-inline: clamp(1rem, 4vw, 1.25rem);
  margin: 0 auto;
}

/* stat-card grid: 携帯単カラム → md で 2 カラム */
[data-component="stat-card"] { grid-template-columns: minmax(0, 1fr); }
@media (min-width: 768px) {
  [data-component="stat-card"] { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
}
```

## 4. globals.css グリッド流体化（AC-6 / RC-2）

```css
.tag-master-grid,
.attendance-primary-grid { grid-template-columns: minmax(0, 1fr); }
@media (min-width: 1024px) {
  .tag-master-grid { grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); }
  .attendance-primary-grid { grid-template-columns: minmax(0, 1.35fr) minmax(0, 0.85fr); }
}
.schema-glossary { grid-template-columns: minmax(0, 1fr); }
@media (min-width: 768px) { .schema-glossary { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1024px) { .schema-glossary { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
```

> 要点: `minmax(18rem,…)` の **18rem 最小値**が携帯幅を超えはみ出す。`minmax(0,…)` で親幅を超えない。

## 5. globals.css テーブル可視性（AC-7 / RC-3）

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

### per-table 判断基準（カード化 vs sticky 横スクロール）

| 条件 | 採用 | 対象例 |
| --- | --- | --- |
| 列数 4 以上 / セルに長文・複数情報を持つ | **カード積み**（`.admin-table--cards` + `td` に `data-label` additive 付与） | MembersTable, identity-conflicts, requests |
| 列数 少（2-3）/ 数値中心で sticky 見出しで十分 | **sticky 見出し + `min-width` 横スクロール**（`.admin-table-scroll` のみ） | audit-table |

> 既存テーブル component には `data-label` 属性の **additive 付与のみ**（列構造・testid・href・aria は不変）。`data-label` 値はヘッダ文言と同一文字列。

## 6. globals.css / SidebarDrawer オーバーレイ収納（AC-8 / RC-4）

```css
.ubm-shell-tooltip { max-width: min(240px, calc(100vw - var(--shell-bar-w-collapsed) - 1.5rem)); }
.ui-sidebar-user-menu-popover { max-width: min(208px, calc(100vw - 2rem)); }
```

```tsx
// SidebarDrawer.tsx:63 panel className
// Before: "absolute inset-y-0 left-0 flex w-[17rem] max-w-[85vw] flex-col gap-3 overflow-y-auto ..."
// After : "absolute inset-y-0 left-0 flex w-[min(17rem,88vw)] flex-col gap-3 overflow-y-auto ..."
```

> シグネチャ不変: `SidebarDrawer` の props・role・aria・testid は変更しない（className の幅トークンのみ差し替え）。

## 7. auth.css 狭幅 padding（AC-3,5 / RC-5）

```css
/* :18 の width: min(100%, 420px) は維持。padding を安全化 */
.auth-card {
  width: min(100%, 420px);
  padding-inline: clamp(1rem, 5vw, 1.5rem);
}
```

## 8. error / not-found / loading（AC-5 / RC-5）

ルートコンテナを既存 Tailwind utility で中央寄せ・狭幅 padding 化（HEX 直書きなし・既存クラス準拠）:

```tsx
// 例: container className
"min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center"
```

> `(public)` / `(admin)/admin` / `(member)/profile` / `(auth)/login` 配下の同名 segment バリアントも同 utility に揃える。共通文言・構造は変えず、レイアウト utility のみ調整。

## 9. viewports.ts fixture（AC-2..AC-5）

```ts
export const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
  mobileNarrow: { width: 375, height: 812 }, // additive: 最狭携帯フォールバック
  wide: { width: 1920, height: 1080 },
} as const
```

## 実装順序（Red→Green）

1. fixture（viewports.ts）+ Playwright spec 新規（Red: 横スクロール検出）。
2. tokens.css 変数 → globals/legacy-public/auth の CSS 差分。
3. SidebarDrawer 幅クラス + 構造 spec additive。
4. error/not-found/loading utility。
5. `pnpm typecheck && pnpm lint && pnpm verify:tokens` → Playwright baseline（Phase 11）→ Green。

## 参照資料

### システム仕様（aiworkflow-requirements）

- `ui-ux-*.md`（CSS 設計・mobile-first）, `architecture-*.md`（表現層境界）。
- プロジェクト: `docs/00-getting-started-manual/specs/design-tokens.md`, `apps/web/src/styles/tokens.css`。

## 成果物

- 本ファイル（実装手順）。新規/修正ファイルパス一覧・各ファイルの Before→After 差分方針・per-table 判断基準・実装順序。

## 統合テスト連携

- 上流: Phase 2 設計・Phase 4 TC。
- 下流: `03.実装.md` が本手順を実コードに適用し、Phase 6/7 がテスト追加・カバレッジを担保。

## 完了条件

各変更ファイルが Before→After 差分方針・対応 AC・シグネチャ不変条件付きで定義され、per-table 判断基準と実装順序が確定していること（実コード変更は本 Phase では行わない）。
