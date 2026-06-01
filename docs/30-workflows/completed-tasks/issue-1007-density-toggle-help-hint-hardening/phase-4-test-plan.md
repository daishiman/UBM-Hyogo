# Phase 4: テスト計画（TDD Red）

`[実装区分: 実装仕様書]`

## 4.1 対象テストファイル

`apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx`（既存に追記。新規ファイルは作らない＝不変条件 #8 / `*.spec.tsx`）

既存 mock（`next/navigation`）と `cleanup` をそのまま流用する。`render` は複数 instance を同一 container に描画できるため、複数配置テストは 1 回の `render` 内で `<><DensityToggle/><DensityToggle/></>` を描画する。

## 4.2 追加テストケース（期待値 = 実装前は RED）

| TC | 名称 | 操作 | 期待 | 対応 AC |
|----|------|------|------|---------|
| TC-1 | 複数配置で description id が衝突しない | 2 つの `DensityToggle` を描画 | 2 つの instance の `span.visually-hidden` の id 集合が重複ゼロ（全 id が unique） | AC-1 |
| TC-2 | aria-describedby が参照切れしない | 同上 | 各 radio の `aria-describedby` 値に一致する `id` 要素が同一 container 内に存在 | AC-2 |
| TC-3 | instance 内で radio→description が対応 | 同上 | instance A の radio の describedby が instance A の span を指す（B を指さない） | AC-1/AC-2 |
| TC-4 | Escape で HelpHint が閉じる | summary click で open → `keydown Escape` | `details.open === false`、`document.activeElement` が summary | AC-3 |
| TC-5 | click-outside で閉じる | open → details 外要素を `fireEvent.pointerDown` | `details.open === false` | AC-4 |
| TC-6 | details 内 click では閉じない | open → dd を `fireEvent.pointerDown` | `details.open === true` | AC-4 |
| TC-7 | summary toggle は従来どおり | summary を 2 回 click | open→close が切り替わる | AC-5 |
| TC-8 | help icon が Icon system で描画 | render | `summary [data-component="icon"]`（`.ui-icon`）が存在し、平文 `?` text を直接持たない | AC-6 |
| TC-9 | summary の aria-label 維持 | render | `summary[aria-label="表示密度の説明を見る"]` が存在 | AC-6 |
| TC-10 | listener cleanup | open→unmount | unmount 後に `keydown`/`pointerdown` を dispatch しても例外/state 更新警告が出ない | AC-9 |

既存 4 test（radio 3 種 / sublabel+HelpHint dl / comfy replace / dense param）は回帰確認として維持（AC-7）。

## 4.3 テスト実装メモ（MINOR 吸収）

- M2 対策: id 照合は `getElementById` ではなく `container.querySelector('[id="..."]')` または `radio.getAttribute("aria-describedby")` と `span.id` の集合比較で行う（`useId` のコロンを許容）。
- M1 対策: click-outside は `render` 時に details 外の兄弟要素（例: `<button data-testid="outside" />`）を含むラッパーで描画し、`fireEvent.pointerDown(screen.getByTestId("outside"))` を使う。`document.dispatchEvent` は使わない。
- open 化は `fireEvent.click(summary)`（jsdom は `<details>` の native toggle を反映する。反映されない場合は `details.open = true; fireEvent(details, new Event("toggle"))` でフォールバック）。

## 4.4 実行コマンド（RED 確認）

```bash
mise exec -- pnpm exec vitest run apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx
```

期待（実装前）: TC-1〜TC-10 が FAIL（RED）、既存 4 test は PASS。

## 完了条件
- 上記 TC が test ファイルに追記され、実装前に RED（新規分）になることを確認できる計画が固定されていること。
