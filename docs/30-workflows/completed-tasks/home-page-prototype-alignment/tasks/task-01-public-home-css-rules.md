# task-01 — 公開トップ用 CSS rule 追加

`[実装区分: 実装仕様書]`

判定根拠: ユーザー要望（プロトタイプ整合）はコード変更を伴う。`apps/web/src/styles/legacy-public.css` への CSS rule 追加によって `/` の見た目を改善する。

## 1. 目的

公開トップ `/` の `PublicHeader` / `Stats` / `ZoneIntro` / `Timeline` / `PublicFooter` / `MemberGrid` セクションに対応する CSS rule が `legacy-public.css` に欠落しているため、これらを追記してプロトタイプ（`docs/00-getting-started-manual/claude-design-prototype/`）と整合させる。

## 2. 変更対象ファイル

| path | 種別 | 想定変更行数 |
| --- | --- | --- |
| `apps/web/src/styles/legacy-public.css` | 編集（末尾追記） | ≈ 150 行追加 |

**新規ファイル作成・既存ファイル削除なし。**

## 3. 追加する CSS rule（仕様）

`legacy-public.css` 末尾に以下のコメント境界で囲んだ block を追加する:

```css
/* === home-page-prototype-alignment task-01 (start) === */
/* …rule 群… */
/* === home-page-prototype-alignment task-01 (end) === */
```

### 3.1 PublicHeader (`[data-component="public-header"]`)

```css
[data-component="public-header"] {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 28px;
  background: color-mix(in oklab, var(--ubm-color-surface-panel) 92%, transparent);
  border-bottom: 1px solid var(--ubm-color-border-default);
  backdrop-filter: saturate(140%) blur(8px);
  -webkit-backdrop-filter: saturate(140%) blur(8px);
}

[data-component="public-header"] [data-role="brand"] {
  font-family: var(--ubm-font-serif);
  font-size: 16px;
  font-weight: 600;
  color: var(--ubm-color-text-primary);
  text-decoration: none;
  letter-spacing: 0;
}

[data-component="public-header"] nav ul {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
}

[data-component="public-header"] nav a {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  font-size: 14px;
  color: var(--ubm-color-text-secondary);
  text-decoration: none;
  border-radius: var(--ubm-radius-sm);
}

[data-component="public-header"] nav a:hover {
  background: var(--ubm-color-surface-bg-2);
  color: var(--ubm-color-text-primary);
}

[data-component="public-header"] nav a[aria-current="page"] {
  color: var(--ubm-color-accent-ink);
  background: var(--ubm-color-accent-soft);
}

[data-component="public-header"] [data-role="auth-cta"] {
  font-size: 14px;
  padding: 8px 14px;
  border-radius: var(--ubm-radius-md);
  background: var(--ubm-color-text-primary);
  color: var(--ubm-color-surface-panel);
  text-decoration: none;
}

@media (max-width: 600px) {
  [data-component="public-header"] {
    flex-wrap: wrap;
    padding: 12px 16px;
  }
}
```

### 3.2 Stats (`[data-component="stats"]`)

```css
[data-component="stats"] {
  padding: 32px 28px 0;
}

[data-component="stats"] [data-role="stat-grid"] {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  list-style: none;
  margin: 0;
  padding: 0;
}

[data-component="stats"] li[data-stat] {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px 20px;
  background: var(--ubm-color-surface-panel);
  border: 1px solid var(--ubm-color-border-default);
  border-radius: var(--ubm-radius-lg);
  box-shadow: var(--ubm-shadow-xs);
}

[data-component="stats"] li[data-stat] [data-role="label"] {
  font-size: var(--ubm-text-xs);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ubm-color-text-muted);
}

[data-component="stats"] li[data-stat] [data-role="value"] {
  font-family: var(--ubm-font-en);
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 0;
  color: var(--ubm-color-text-primary);
}

@media (max-width: 900px) {
  [data-component="stats"] [data-role="stat-grid"] { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  [data-component="stats"] [data-role="stat-grid"] { grid-template-columns: 1fr; }
}
```

### 3.3 ZoneIntro (`[data-component="zone-intro"]`)

```css
[data-component="zone-intro"] {
  padding: 40px 28px 0;
}

[data-component="zone-intro"] h2 {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0;
  color: var(--ubm-color-text-primary);
  margin: 0 0 16px;
}

[data-component="zone-intro"] [data-role="zone-list"] {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  list-style: none;
  margin: 0;
  padding: 0;
}

[data-component="zone-intro"] li[data-zone] {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  background: var(--ubm-color-surface-panel);
  border: 1px solid var(--ubm-color-border-default);
  border-left-width: 4px;
  /* border-left color は TSX 側の inline style (var(--ubm-color-zone-*)) で上書き */
  border-radius: var(--ubm-radius-lg);
  box-shadow: var(--ubm-shadow-xs);
}

[data-component="zone-intro"] li[data-zone] [data-role="label"] {
  font-family: var(--ubm-font-en);
  font-size: var(--ubm-text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--ubm-color-text-muted);
}

[data-component="zone-intro"] li[data-zone] [data-role="title"] {
  font-size: 16px;
  font-weight: 700;
  color: var(--ubm-color-text-primary);
  margin: 0;
}

[data-component="zone-intro"] li[data-zone] [data-role="description"] {
  font-size: 14px;
  line-height: 1.7;
  color: var(--ubm-color-text-secondary);
  margin: 0;
}

@media (max-width: 900px) {
  [data-component="zone-intro"] [data-role="zone-list"] { grid-template-columns: 1fr; }
}
```

### 3.4 Timeline (`[data-component="timeline"]`)

```css
[data-component="timeline"] {
  padding: 40px 28px 0;
}

[data-component="timeline"] h2 {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0;
  color: var(--ubm-color-text-primary);
  margin: 0 0 16px;
}

[data-component="timeline"] ol {
  list-style: none;
  margin: 0;
  padding: 24px 28px;
  background: var(--ubm-color-surface-panel);
  border: 1px solid var(--ubm-color-border-default);
  border-radius: var(--ubm-radius-lg);
}

[data-component="timeline"] ol > li {
  display: grid;
  grid-template-columns: 88px 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--ubm-color-border-default);
}

[data-component="timeline"] ol > li:last-child { border-bottom: 0; }

[data-component="timeline"] ol > li time {
  font-family: var(--ubm-font-en);
  font-size: 12px;
  color: var(--ubm-color-text-muted);
}

[data-component="timeline"] ol > li > span {
  font-size: 14px;
  font-weight: 500;
  color: var(--ubm-color-text-secondary);
}

@media (max-width: 600px) {
  [data-component="timeline"] ol > li {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
```

### 3.5 MemberGrid (`[data-component="member-grid"]`)

```css
[data-component="member-grid"] {
  display: grid;
  gap: 18px;
  list-style: none;
  margin: 0;
  padding: 0;
}

[data-component="member-grid"][data-density="comfy"] {
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

[data-component="member-grid"][data-density="dense"] {
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}
```

### 3.6 PublicFooter (`[data-component="public-footer"]`)

```css
[data-component="public-footer"] {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 32px 28px;
  margin-top: 40px;
  border-top: 1px solid var(--ubm-color-border-default);
  color: var(--ubm-color-text-muted);
  font-size: 12px;
}

[data-component="public-footer"] ul {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  list-style: none;
  margin: 0;
  padding: 0;
}

[data-component="public-footer"] ul a {
  color: var(--ubm-color-text-secondary);
  text-decoration: none;
}

[data-component="public-footer"] ul a:hover {
  color: var(--ubm-color-text-primary);
  text-decoration: underline;
}

[data-component="public-footer"] [data-role="copyright"] {
  margin: 0;
}
```

### 3.7 ホームページ全体の rhythm（オプション）

`<main data-page="home">` 直下のセクション間 vertical rhythm を補強:

```css
[data-page="home"] {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 1200px;
  margin: 0 auto;
}
```

## 4. 入出力 / 副作用

- 入力: なし（純 CSS）
- 出力: ブラウザレンダリング時の見た目変化
- 副作用: なし（既存 selector の上書きはしない・全て新規追加）

## 4.1 シグネチャ

- CSS selector signature: `[data-component="public-header"]`, `[data-component="stats"]`, `[data-component="zone-intro"]`, `[data-component="timeline"]`, `[data-component="member-grid"]`, `[data-component="public-footer"]`
- TypeScript / React props signature: N/A（TSX 変更なし）

## 5. テスト方針

### 5.1 既存テスト

- `apps/web/src/components/public/__tests__/*.spec.tsx` の snapshot は **構造を変更しないため pass 維持**
- `pnpm --filter @ubm-hyogo/web test -- public` で確認

### 5.2 新規テスト

CSS 専用のため追加 unit test なし。検証は次の手順で:

1. `pnpm --filter @ubm-hyogo/web dev` で `localhost:3000` を開く
2. DevTools で各セクションが期待 layout になっていることを inspect
3. token 経由かを確認（`getComputedStyle` で `oklch(...)` または `#xxx` が token 由来か）

### 5.3 CI gate

- `verify-design-tokens`: 追加 CSS に HEX 直書きが無いこと（**`color-mix(in oklab, ...)` の引数は変数のみ**）。本仕様では `#xxx` 直書きを **0 件**にする
- `playwright-smoke / smoke (chromium)`: 既存 smoke が `/` で 200 を返すことを継続確認

## 6. ローカル実行・検証コマンド

```bash
# 依存
mise exec -- pnpm install

# 型 / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# dev サーバ起動して目視確認
mise exec -- pnpm --filter @ubm-hyogo/web dev
# → http://localhost:3000/ を開く

# unit test（snapshot 含む）
mise exec -- pnpm --filter @ubm-hyogo/web test -- public

# design token gate
mise exec -- pnpm verify:tokens

# build
mise exec -- pnpm --filter @ubm-hyogo/web build
```

## 7. DoD（Definition of Done）

- [x] `apps/web/src/styles/legacy-public.css` 末尾に §3.1〜§3.7 の rule block が `/* === home-page-prototype-alignment task-01 (start/end) === */` マーカー付きで追加されている
- [x] `pnpm typecheck` / `pnpm lint` PASS
- [x] `pnpm --filter @ubm-hyogo/web test -- public` PASS（snapshot 変更なし）
- [x] `pnpm --filter @ubm-hyogo/web build` PASS
- [x] local runtime で確認: header が横並び / Stats が grid / ZoneIntro が grid / Timeline が card 化 / Footer が border-top 付き
- [x] 追加 CSS に HEX 直書き 0 件（`grep -nE '#[0-9a-fA-F]{3,8}' apps/web/src/styles/legacy-public.css` の追加範囲が空）
- [x] local `/` screenshot を Phase 11 evidence として `outputs/phase-11/screenshots/` に保存
