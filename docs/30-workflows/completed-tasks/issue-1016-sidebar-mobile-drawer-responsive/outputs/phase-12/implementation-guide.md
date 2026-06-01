# Implementation Guide — Issue #1016 Task E: Mobile drawer responsive

[実装区分: 実装 / VISUAL / workflow_state = implemented_local_runtime_pending]

## Part 1: 中学生レベル（なぜ必要か → 何をするか）

スマートフォンの画面はパソコンに比べてとても狭い。だからパソコンのように、画面の左側にいつもメニュー（リンクの一覧）を出しっぱなしにしておくと、肝心の中身を見るスペースがなくなってしまう。

そこで使うのが「引き出し（drawer / ドロワー）」という仕組みだ。ふだんはメニューを隠しておき、画面の上の方にある「三本線のボタン（ハンバーガーボタン）」を押したときだけ、画面の横からメニューがスッと出てくる。たとえるなら、机の引き出しのように、必要なときだけ開けて、使い終わったら閉じておくイメージだ。

この引き出しは、まわりの暗い部分（背景）を押すか、キーボードの「Esc」キーを押すと閉じる。さらに、メニューの中のリンクを押してページが切り替わったときも、自動で閉じる。画面が広いタブレットやパソコンでは引き出しは出てこず、最初から横にメニューが並ぶ（タブレットでは少し狭いので、たたんだ状態で始まる）。これによって、どの大きさの画面でも気持ちよくメニューを使えるようにするのが、このタスクの目的だ。

### 背景

- 現状、スマホ幅（`<768px`）ではサイドバーが隠れる CSS だけは入っているが、代わりに開く「引き出し」本体が存在しないため、スマホではメニューに辿り着けない。
- `useSidebarState` には `drawerOpen` / `setDrawerOpen` という「引き出しが開いているか」を覚えておく仕組みが先行して入っているが、それを使う相手（ボタンと引き出し）がまだ無く、宙ぶらりんになっている。

## Part 2: 技術者レベル

### 実装ステップ

1. `SidebarMobileTrigger.tsx`（新規・Client）を作成し、`useSidebarShellContext()` の `setDrawerOpen(true)` を click で呼ぶ。`md:hidden` でモバイル専用。
2. `SidebarDrawer.tsx`（新規・Client）を作成し、`open` 時に `role="dialog"` `aria-modal="true"` `id="shell-drawer"` の overlay を描画。body scroll lock / initial focus / Esc close を useEffect で実装。
3. `useSidebarState.ts`（編集）に `usePathname()` を追加し route 変化で auto-close、`readInitialCollapsed()` に matchMedia による md 初期 collapsed 判定を追記。
4. `SidebarShell.tsx`（編集）に mobile strip（`SidebarMobileTrigger` + `mobileTriggerSlot`）と `SidebarDrawer` を mount。
5. Phase 8 で brand+nav+footer の共通化を検討し、drawer/aside 固有要素の差が大きいため helper 抽出を不採用（M-1 解消判定）。
6. 4 spec（trigger / drawer / useSidebarState mock 追記）で AC を検証。

### TypeScript 型定義（phase-02-design.md より逐語引用・FB-W1-02b-3 手書き drift 禁止）

```tsx
export type SidebarDrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode; // brand + nav + footer の同ツリー
};

export function SidebarDrawer({ open, onClose, children }: SidebarDrawerProps): JSX.Element | null
```

### コンポーネント API

| コンポーネント | 入力 | 出力 | 副作用 |
|---------------|------|------|--------|
| `SidebarMobileTrigger` | なし（`useSidebarShellContext()` で `drawerOpen` / `setDrawerOpen` 消費） | hamburger `<button>`（`data-component="shell-mobile-trigger-button"` / `aria-controls="shell-drawer"` / `aria-expanded={drawerOpen}` / `md:hidden`） | click で `setDrawerOpen(true)` |
| `SidebarDrawer` | `open` / `onClose` / `children` | `open=false` で `null`、`open=true` で overlay（backdrop `aria-hidden` + panel `role="dialog"` `aria-modal="true"` `id="shell-drawer"`） | body 属性 toggle / initial focus / keydown listener（全 cleanup あり） |

### `useSidebarState` の追記契約

| 項目 | 契約（phase-02-design.md 逐語） |
|------|------|
| route close | `const pathname = usePathname();` → `useEffect(() => { setDrawerOpenState(false); }, [pathname]);`（AC-5） |
| md 初期 collapsed | `readInitialCollapsed()` 内で localStorage 未設定時のみ `window.matchMedia("(min-width: 768px)").matches` && `!window.matchMedia("(min-width: 1024px)").matches` を返す（md=collapsed / lg=expanded）（AC-8） |
| ガード順 | `browserMatchMedia(query)` 経由で `window.matchMedia` を参照し、`useSidebarState` から直接 browser global を触らない（INV-3） |

### エラー / エッジケース

| ケース | 方針 |
|--------|------|
| SSR hydration | 初期 state は SSR で常に `collapsed=false`（expanded）でレンダリングし、mount 後 `useEffect` の `readInitialState()` で localStorage / matchMedia から確定。SSR HTML と初回 client HTML を一致させ mismatch を回避（phase-02-design.md 因果ループ節） |
| listener cleanup | Esc 用 keydown listener / body 属性は全 useEffect の return で `removeEventListener` / `removeAttribute`。`open=false` 早期 return 後も cleanup が走る |
| `browserDocument()` 不在（SSR） | `const doc = browserDocument(); if (!doc) return;` で副作用を skip |
| matchMedia 例外 | `try { ... } catch { return false; }` で expanded フォールバック |

### 設定可能パラメータ（phase-02-design.md 逐語）

| パラメータ | 値 | 出典 |
|-----------|-----|------|
| breakpoint（md 下限 / lg 下限） | `(min-width: 768px)` / `(min-width: 1024px)` | phase-02-design.md responsive 契約 |
| storage key | `ubm:shell:collapsed`（既存 `STORAGE_KEY`） | 親 Task A 既存 `useSidebarState.ts` |
| body 属性（scroll lock） | `data-shell-drawer-open`（`"true"` 付与 / close で removeAttribute） | phase-02-design.md AC-6 |
| dialog id | `shell-drawer`（`aria-controls="shell-drawer"` と一致） | phase-02-design.md / phase-03 命名整合 |
| scrim token | `--ubm-color-overlay-scrim`（未定義時 Phase 5 で既存 scrim トークン採用・HEX 直書き禁止 / INV-2・M-2） | phase-02-design.md §SidebarDrawer 注記 |

### 制約（INV-1〜INV-6）

- 新規 API endpoint / D1 schema 変更なし（UI のみ・API 非接触）。
- 全色 OKLch トークン経由。HEX 直書き / `bg-[#xxx]` 禁止（`verify-design-tokens`）。
- `window` / `document` / `localStorage` 直接参照は `@/lib/is-browser`（`isBrowser` / `browserDocument`）と既存 `getBrowserStorage()` 経由のみ。
- テストファイルは `*.spec.{ts,tsx}` のみ。
- 新規 primitive を生やさず既存 shell 群（`SidebarNav` 等）で構成。

### 検証コマンド（本サイクルで実行）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx \
  apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx
```

Result: 4 files / 21 tests PASS（`outputs/phase-11/evidence/focused-vitest.log`）。

### 既知制限

- 本サイクルは実コード + focused Vitest + local screenshot まで完了。staging visual は未実行であり staging runtime PASS を主張しない。
- focus trap 外部ライブラリは追加しない（initial focus + Esc + backdrop close の最小実装に限定 / phase-02-design.md ライブラリ選定）。
- M-3（`is-browser.ts` への matchMedia getter 追加）は `browserMatchMedia(query)` で本サイクル内に解消済み（unassigned-task-detection.md 参照）。

## 視覚証跡（VISUAL）

本タスクは VISUAL（taskType=`implementation` / visualEvidence=`VISUAL`）。Phase 11 で 375 / 768 / 1280 px の screenshot 4 枚を取得済み。現状 workflow_state=`implemented_local_runtime_pending` で、focused Vitest と local screenshot は present、staging visual は **`pending`**。

| canonical 名 | viewport | 状態 | 期待 |
|-------------|----------|------|------|
| `outputs/phase-11/screenshots/shell-drawer-mobile-closed.png` | 375px | present | hamburger 表示・sidebar hidden・drawer 非表示 |
| `outputs/phase-11/screenshots/shell-drawer-mobile-open.png` | 375px | present | drawer overlay（`role="dialog"`）+ backdrop |
| `outputs/phase-11/screenshots/shell-sidebar-tablet-collapsed.png` | 768px | present | sidebar visible・初期 collapsed・hamburger hidden |
| `outputs/phase-11/screenshots/shell-sidebar-desktop-expanded.png` | 1280px | present | sidebar visible・expanded（localStorage 優先） |

> staging visual 確認・commit / push / PR は user-gated。staging runtime evidence なしに runtime PASS を主張しない。
