# parallel-03-prototype-ux-css 実装仕様書

**[実装区分: 実装仕様書]** — UI/CSS 変更のみ。state/API 変更なし。

## 1. 目的

Prototype の visual feedback 3点を実装側 (Tailwind + OKLch token) に翻訳し、視認性を復旧する。

## 2. スコープ

- **G3-1**: Tag pill `aria-selected="true"` 時の塗りつぶし配色
- **G3-2**: Member card hover transition (border-color / box-shadow)
- **G3-3**: Profile visibility marker (公開/会員/管理者用 の視覚差別化)

## 3. 変更対象ファイル一覧

| パス | 種別 | 理由 |
|------|------|------|
| `apps/web/src/styles/globals.css` | 編集 | `@layer components` に G3-1/2/3 の CSS 規則を追加 |
| `apps/web/src/components/public/MemberCard.tsx` | 編集 | `data-component="member-card"` 属性 (既存) と transition class の確認 |
| `apps/web/src/components/public/MemberFilters.client.tsx` | 編集 | active tag button に `aria-selected` 属性と `data-component="tag-pill"` を付与 |
| `apps/web/src/components/public/MemberDetailSections.tsx` | 編集 | `<section>` に `data-visibility` 属性を付与 (section オブジェクトに該当 field がない場合は default "public") |
| `apps/web/src/components/public/FormPreviewSections.tsx` | 編集 | `data-role="visibility"` を持つ既存 span に CSS 装飾を効かせる (markup 変更最小) |

## 4. 設計

### 4.1 G3-1: Tag pill selected 状態の fill

**現状:**
- Prototype: `docs/00-getting-started-manual/claude-design-prototype/styles.css` ℓ824-828 に `.tag-pill.selected { background: var(--text); color: var(--panel); }`
- 実装側 `MemberFilters.client.tsx` で active tag を render するが、button に `aria-selected` 属性が無く、視覚的な選択状態が判別しづらい

**要件:**
- 実装側 active tag button に `aria-selected={isSelected}` と `data-component="tag-pill"` を付与
- CSS で `button[data-component="tag-pill"][aria-selected="true"]` セレクタを追加
- 配色: `background: var(--ubm-color-text-primary); color: var(--ubm-color-surface-panel); border-color: var(--ubm-color-text-primary);`
- transition: `all var(--ubm-dur-fast) var(--ubm-ease-standard)` (.15s 程度)

### 4.2 G3-2: Member card hover transition

**現状:**
- `MemberCard.tsx` には既に `data-component="member-card"` が付与されている (Read 確認結果)
- globals.css に該当セレクタの hover transition なし

**要件:**
- `[data-component="member-card"]` で `transition` を定義
- `:hover` で `border-color` を `--ubm-color-border-strong` に、`box-shadow` を `--ubm-shadow-sm` に変化
- `:focus-visible` で OKLch アクセント outline

### 4.3 G3-3: Profile visibility marker

**現状:**
- `MemberDetailSections.tsx` の `<section>` は visibility 情報を持たない (**API 確認済**: `apps/api/src/routes/public/members.ts` に `visibility` field なし → MVP では `"public"` 固定運用)
- `FormPreviewSections.tsx` には `data-role="visibility"` 持ちの label span が存在するが、CSS装飾がない

**要件:**
- `MemberDetailSections.tsx` の `<section>` に `data-visibility="public"` を固定付与（API に field が追加されたら `section.visibility ?? "public"` へ変更）
- CSS で `[data-visibility="public|member|admin"]` セレクタを追加
  - `public`: 左ボーダー `var(--ubm-color-ok)` + icon `🌍`
  - `member`: 左ボーダー `var(--ubm-color-zone-b)` + icon `👥`
  - `admin`: 左ボーダー `var(--ubm-color-danger)` + icon `🔐`
- アイコンは `::before` content で挿入 (装飾用、a11y は section title text 側に依存)

## 5. 関数・props シグネチャ

```tsx
// MemberFilters.client.tsx
<button
  type="button"
  onClick={() => onTagToggle(t)}
  data-component="tag-pill"
  aria-selected={initial.tag.includes(t)}
>
  #{t} ×
</button>

// MemberDetailSections.tsx
type Section = {
  key: string;
  title: string;
  visibility?: "public" | "member" | "admin"; // 既存 section 型に追加 / default "public"
  // ...
};

<section
  key={section.key}
  data-section={section.key}
  data-visibility={section.visibility ?? "public"}
>
  ...
</section>
```

## 6. 入出力・副作用

- 視覚的変化のみ。state / API / DOM 構造変更なし
- a11y: `aria-selected` 属性で screen reader が tag pill の選択状態を認識
- visibility marker の icon は装飾 emoji。意味は section title text と aria-label に依存

## 7. テスト方針

- **Vitest + Testing Library**
  - `MemberFilters`: 選択中の tag に `aria-selected="true"` が付くことを検証 (spec ファイル: `apps/web/src/components/public/__tests__/MemberFilters.spec.tsx`)
  - `MemberDetailSections`: `data-visibility` が正しい値で render されることを検証
- **Playwright (visual)**
  - Member card hover で border / shadow transition が発火する (existing smoke の延長)
  - Profile section に `border-left` + icon が描画される
- **a11y (jest-axe / axe-core)**
  - tag pill `aria-selected` が screen reader に伝わる violation 0

## 8. ローカル実行・検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test
# verify-design-tokens CI gate と同じ grep を local で実行
mise exec -- bash scripts/verify-design-tokens.sh  # スクリプトがなければ手動 grep
grep -rEn 'bg-\[#|text-\[#|border-\[#' apps/web/src && echo "HEX 直書きあり (NG)" || echo "HEX 直書きなし (OK)"
```

## 9. DoD

- [ ] Tag pill 選択時に背景塗りつぶしで視認可能
- [ ] Member card hover で border-color / box-shadow が transition
- [ ] Profile section に visibility marker (左ボーダー + icon) が表示
- [ ] OKLch token のみで実装、HEX 直書き 0件
- [ ] verify-design-tokens CI gate がPASS
- [ ] 既存 Vitest / Playwright smoke がPASS
- [ ] axe a11y violations 0 維持

## 10. リスク・制約

| リスク | 対策 |
|--------|------|
| ~~section オブジェクトに `visibility` field が無い~~ | **確認済 (2026-05-15)**: `apps/api/src/routes/public/members.ts` の section 定義に `visibility` field は**存在しない**。本 spec ではすべての section に `data-visibility="public"` 固定で運用する。将来 API 側に field 追加された場合は `section.visibility ?? "public"` への変更を再評価する |
| Tailwind utility が `@layer components` の規則を上書き | `@layer components` で specificity を確保 (`[data-component="..."][aria-selected="true"]` の組み合わせで十分) |
| Emoji icon の表示が環境依存 | フォントスタック確認後に必要なら SVG `background-image` に置換 (本タスクでは emoji 採用、不具合時に follow-up) |
| OKLch token と prototype color のマッピング誤り | tokens.css の `--ubm-color-*` を正本とし、prototype と差異がある場合は tokens.css 側を変更せず実装側で再マッピング (`var(--ubm-color-text-primary)` を採用) |
