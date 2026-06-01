# Phase 1: 要件定義

`[実装区分: 実装仕様書]`

## 1.1 タスク分類（Phase 11 / Phase 12 判定の起点）

| 項目 | 値 |
|------|-----|
| タスク種別 | **UI task**（client component の挙動・DOM 構造・a11y を変更） |
| visual_category | **VISUAL**（HelpHint の開閉・icon 表示に視覚差分。Phase 11 screenshot 必須） |
| implementation_mode | `new`（堅牢化コードを新規追加。既存 UX 表示の回帰も確認） |
| docs-only か | いいえ（コード変更が目的達成に必須 → 実装仕様書） |

## 1.2 P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|----------|------|------|
| current branch に実装が存在する | No（3要件すべて未実装） | 通常の実装 Phase とする |
| upstream（dev）にマージ済み | No（未着手） | 未マージとして扱う |
| 前提タスク完了済み | Yes（`task-a-density-toggle-ux-clarity` PR #1009 マージ済） | 依存解消タスク不要 |

## 1.3 既存コードの命名規則（FB-01 / FB-SDK-07-4 整合）

- ファイル: client component は `*.client.tsx`、test は `*.spec.tsx`（`*.test.tsx` 禁止 = 不変条件 #8）
- DOM hook: `data-component="..."` / `data-role="..."` の kebab-case（既存 `density-toggle-control` / `help-hint` / `segmented-sublabel`）
- id 生成: 既存正本パターンは `useId()`（`Field.tsx:20` / `FormField.tsx:10` / `ConfirmDialog.tsx:29`）
- Escape close: 既存正本パターンは `keydown` で `e.key === "Escape"`（`ConfirmDialog.tsx:65` / `Drawer.tsx:71` / `Modal.tsx:68`）
- icon: 正本は `apps/web/src/components/ui/Icon.tsx`（`<Icon name=... />`）+ `icons.ts`（`IconName` union）。**lucide-react は apps/web 未導入**

## 1.4 受入条件（AC）

| ID | 受入条件 | 検証 Phase |
|----|----------|-----------|
| AC-1 | 同一ページに `DensityToggle` を 2 つ描画しても、各 description の `id` と各 radio の `aria-describedby` が衝突しない（互いに異なる prefix を持つ） | 4/6 |
| AC-2 | `aria-describedby` が指す `id` を持つ要素が DOM 上に必ず存在する（参照切れゼロ）。各 instance 内で radio → description の対応が保持される | 4/6 |
| AC-3 | HelpHint が open のとき `Escape` 押下で閉じ、focus は summary に戻る | 4/6 |
| AC-4 | HelpHint が open のとき、details 要素外への pointerdown で閉じる（click-outside close） | 4/6 |
| AC-5 | HelpHint の `summary` クリックでの open/close（native toggle）は従来どおり動作する | 4/6 |
| AC-6 | `?` 表示が正本 Icon system（`<Icon name="help" />`）で描画され、`summary` の `aria-label="表示密度の説明を見る"` が維持される | 4/6 |
| AC-7 | 既存 AC（3 種 radio / aria-checked / sublabel / HelpHint dl 内容 / density param URL replace）が全て回帰なし | 4/6 |
| AC-8 | HEX 直書き・`bg-[#xxx]`・新規 primitive の追加がない（design token gate PASS） | 9 |
| AC-9 | event listener leak がない（document listener は mount〜unmount で張り、ハンドラ内で `detailsRef.current.open` を判定。unmount で必ず解除） | 7 |

## 1.5 inventory（変更対象の現状）

| ファイル | 現状の関連箇所 | 変更内容 |
|----------|----------------|----------|
| `DensityToggle.client.tsx` | `:64` static `describedBy`、`:79` static span id、`:85-97` native `<details>`、`:87` 平文 `?` | useId 化 / 非制御 details + Escape + click-outside / Icon 化 |
| `ui/icons.ts` | `IconName` union（13 種、`help` なし） | `"help"` を union に追加 |
| `ui/Icon.tsx` | `iconGlyph()` の switch（`help` case なし） | `case "help"` を追加 |
| `__tests__/DensityToggle.client.spec.tsx` | 4 test（複数配置 / keyboard なし） | 複数配置 id / Escape / click-outside / icon test を追加 |
| `styles/legacy-public.css` | `:1288-1328` help-hint ブロック、`summary` は `?` 文字前提の 28px 円 | `summary` 内 `.ui-icon` のサイズ整合（必要時のみの限定差分） |

## 1.6 苦戦が予想される箇所（Issue 引継ぎ）

- **再利用境界**: HelpHint を汎用 primitive 化しない。`DensityToggle` 内の feature-local に留める（Issue リスク表）。
- **hydration / listener leak**: click-outside の document listener は `useEffect` 内で mount 時に add、unmount cleanup で必ず remove。作用条件は handler 内の `detailsRef.current.open` 判定へ閉じ込める。
- **icon の token gate**: SVG は `stroke="currentColor"`（既存 `iconGlyph` common props）に従い HEX を書かない。

## 完了条件
- AC 一覧と inventory を固定し、Phase 2 設計の前提が確定していること。
