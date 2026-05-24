# task-02 — CallToActionCTA className ハイブリッド整理

`[実装区分: 実装仕様書]`

判定根拠: `CallToActionCTA` は `data-component="call-to-action-cta"` と className（`call-to-action-cta__*` BEM 系）を混在して使用しているため、保守性と一貫性のためデータ属性ベースに統一する。コード変更を伴う。

## 1. 目的

CallToActionCTA の TSX が `data-component` / `data-variant` / `data-role` と BEM-like className（`call-to-action-cta__inner` 等）を混在している現状を、**data-attr 駆動に統一**し、他公開コンポーネント（Hero / Stats / ZoneIntro / Timeline 等）と一貫させる。

## 2. 変更対象ファイル

| path | 種別 | 想定変更行数 |
| --- | --- | --- |
| `apps/web/src/components/public/CallToActionCTA.tsx` | 編集 | ≈ 15 行変更 |
| `apps/web/src/styles/legacy-public.css` | 編集（既存 `[data-component="call-to-action-cta"]` rule 群の selector 書き換え） | ≈ 20 行修正 |
| `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx` | 編集（data-role / data-variant assertion 追加） | ≈ 数行 |

## 3. TSX 構造変更

### 3.1 Before（現状）

```tsx
<section data-component="call-to-action-cta" data-variant="dark" className="call-to-action-cta">
  <div className="call-to-action-cta__inner">
    <div className="call-to-action-cta__copy">
      <p className="call-to-action-cta__eyebrow">FOR MEMBERS</p>
      <h2 className="call-to-action-cta__heading">{heading}</h2>
      <p className="call-to-action-cta__body">{body}</p>
    </div>
    <a … data-role="call-to-action-cta-button" className="cta-button cta-button--accent">…</a>
  </div>
</section>
```

### 3.2 After（目標）

```tsx
<section data-component="call-to-action-cta" data-variant="dark">
  <div data-role="inner">
    <div data-role="copy">
      <p data-role="eyebrow">FOR MEMBERS</p>
      <h2 data-role="heading">{heading}</h2>
      <p data-role="body">{body}</p>
    </div>
    <a … data-role="cta-button" data-variant="accent">…</a>
  </div>
</section>
```

> 既存 `cta-button` / `cta-button--accent` className は使用箇所が CTA 単体に限定されているため、`data-role="cta-button"` + `data-variant="accent"` で代替する。共有 button primitive が別に存在する場合は実装着手時の grep で確認し、共有側を優先する。

## 4. CSS 修正

`legacy-public.css` の既存 rule（289 行付近〜342 行付近）の selector を以下に書き換える:

| Before | After |
| --- | --- |
| `[data-component="call-to-action-cta"] .call-to-action-cta__inner` | `[data-component="call-to-action-cta"] [data-role="inner"]` |
| `[data-component="call-to-action-cta"] .call-to-action-cta__copy` | `[data-component="call-to-action-cta"] [data-role="copy"]` |
| `[data-component="call-to-action-cta"] .call-to-action-cta__eyebrow` | `[data-component="call-to-action-cta"] [data-role="eyebrow"]` |
| `[data-component="call-to-action-cta"] .call-to-action-cta__heading` | `[data-component="call-to-action-cta"] [data-role="heading"]` |
| `[data-component="call-to-action-cta"] .call-to-action-cta__body` | `[data-component="call-to-action-cta"] [data-role="body"]` |
| `[data-component="call-to-action-cta"] [data-role="call-to-action-cta-button"]` | `[data-component="call-to-action-cta"] [data-role="cta-button"]` |
| `[data-component="call-to-action-cta"] .call-to-action-cta__button-icon` | `[data-component="call-to-action-cta"] [data-role="cta-button"] svg, [data-component="call-to-action-cta"] [data-role="cta-button"] [data-component="icon"]` |

declaration 本体は変更しない（見た目を維持）。

## 5. 入出力 / 副作用

- 入力: `CallToActionCTAProps`（変更なし）
- 出力: 同等の DOM 構造（className → data-role に置換）
- 副作用: focused component assertion の更新

## 5.1 シグネチャ

- `CallToActionCTAProps`: 変更なし
- component export: `export function CallToActionCTA(props: CallToActionCTAProps): ReactElement` 変更なし
- DOM selector signature: `data-component="call-to-action-cta"`, `data-role="inner|copy|eyebrow|heading|body|cta-button"`, `data-variant="dark|accent"`

## 6. テスト方針

- `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx` に `data-role="inner"`, `copy`, `eyebrow`, `heading`, `body`, `cta-button` と `data-variant="accent"` の assertion を追加
- 現行テストは snapshot ではなく Testing Library assertion 形式のため、snapshot 更新は不要
- `pnpm --filter @ubm-hyogo/web test -- CallToActionCTA` で PASS 確認

## 7. ローカル実行・検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- CallToActionCTA.component
mise exec -- pnpm --filter @ubm-hyogo/web build
```

## 8. DoD

- [x] `CallToActionCTA.tsx` から `call-to-action-cta__*` className が全て除去され、`data-role` に置換されている
- [x] `legacy-public.css` の対応 selector が `[data-role="…"]` 形式に統一されている
- [x] `pnpm typecheck` / `pnpm lint` PASS
- [x] `CallToActionCTA.component.spec.tsx` PASS（snapshot 更新不要）
- [x] `pnpm --filter @ubm-hyogo/web build` PASS
- [x] local runtime screenshot で CTA セクションが dark bg + accent button で表示される
