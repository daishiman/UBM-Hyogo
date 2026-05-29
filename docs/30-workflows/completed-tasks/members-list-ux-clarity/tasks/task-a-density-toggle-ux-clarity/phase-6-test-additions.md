<!-- workflow: members-list-ux-clarity / task: A / phase: 6 -->

# Phase 6 — テスト拡充 (task-a-density-toggle-ux-clarity)

[実装区分: 実装仕様書]

## 1. 目的

Phase 4 で AC を一通り押さえたあと、fail path / 回帰 guard を追加して脆弱箇所を補強する。

## 2. 追加テストケース

| TC | 種別 | 内容 | 期待 |
| -- | ---- | ---- | ---- |
| TC-A8 | 回帰 guard | OPTIONS 配列の長さ・順序が `["comfy", "dense", "list"]` のまま (将来 reorder 防止) | `Array.from(radios).map(r => r.textContent)` が `["ゆったり…", "密…", "リスト…"]` の順 |
| TC-A9 | fail path | HelpHint の `triggerLabel` が空文字でも summary が描画される (ガード) | `<summary aria-label="">` が存在 (空文字でも throw しない) |
| TC-A10 | 回帰 guard | `Segmented` を sublabel undefined で呼ぶ既存パターンが破壊されていない | mock 用 `<Segmented options={[{value:"a", label:"A"}]} value="a" onChange={...} />` を別 it ブロックで描画し `data-role="sublabel"` を持たない確認 |
| TC-A11 | a11y | description span が `.sr-only` class を持ち、`aria-hidden` 設定されていない (SR は読む) | `container.querySelector("#density-comfy-desc")` の `className` に `sr-only` 含む & `aria-hidden` 属性なし |
| TC-A12 | URL guard | `density=list` 状態から `dense` に切替えても `q` / `zone` などの他 param が保持される | `useSearchParams` mock を `q=foo&zone=0_to_1` で初期化し、dense クリック後 `replace` の引数に `q=foo&zone=0_to_1&density=dense` が含まれる |

## 3. 配置

- TC-A8〜A11: `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx`
- TC-A10: 同ファイル内に `describe("Segmented backward compat", ...)` を追加
- TC-A12: 同ファイル内 `describe("DensityToggle - URL preservation", ...)`

## 4. 実行コマンド

Phase 5 と同じ。

## 5. DoD

- [ ] TC-A8〜A12 が追加されている
- [ ] 既存 + 新規 = 計 12 ケース全 GREEN
- [ ] URL preservation テスト (TC-A12) で他 query param 保持が確認されている
