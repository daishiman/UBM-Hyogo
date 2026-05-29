<!-- workflow: members-list-ux-clarity / task: A / phase: 4 -->

# Phase 4 — テスト計画 (task-a-density-toggle-ux-clarity)

[実装区分: 実装仕様書]

## 1. テスト戦略

- **vitest + @testing-library/react** によるコンポーネントテストで AC-A1〜A6 を検証
- 既存 `DensityToggle.client.spec.tsx` を **拡張**する (新規ファイルは作らない)
- TDD 順序: 既存 3 ケース PASS 維持 → 新規 RED → 実装で GREEN
- Playwright visual baseline は Task C で実施 (本タスクは component 層に閉じる)

## 2. 対象ファイル

| ファイル | 対応 |
| -------- | ---- |
| `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` | 既存 + 新規ケース |

## 3. テストケース一覧

### 3.1 既存ケース (AC-A5 / A6 — 互換維持・無修正)

| TC | 内容 | 期待 |
| -- | ---- | ---- |
| TC-E1 | radiogroup を描画し aria-checked を value で反映 | 既存通り PASS |
| TC-E2 | comfy 選択時に density param を削除して `/members` に replace | 既存通り PASS |
| TC-E3 | dense 選択時に `density=dense` を URL に付与 | 既存通り PASS |

### 3.2 新規ケース

| TC | AC | 内容 | 期待値 |
| -- | -- | ---- | ------ |
| TC-A1 | AC-A1 | 3 つの `[data-role="sublabel"]` が描画されテキストは `カード詳細` / `カード簡易` / `1行リスト` | `container.querySelectorAll('[data-component="density-toggle"] [data-role="sublabel"]').length === 3` / `.textContent` 配列が期待値と一致 |
| TC-A2 | AC-A2 | 各 radio に `aria-describedby="density-{value}-desc"` が設定されている | `getByRole("radio", { name: "ゆったり" }).getAttribute("aria-describedby")` が `"density-comfy-desc"` |
| TC-A3 | AC-A2 | 対応する visually-hidden description span が存在しテキストが description 本文 | `container.querySelector("#density-comfy-desc")?.textContent` が `"顔写真・自己紹介・タグまでカードに表示。じっくり見たい人向け。"` |
| TC-A4 | AC-A3 | `[data-component="help-hint"]` 配下に `<summary>` が 1 つ存在し `aria-label` が `"表示密度の説明を見る"` | `container.querySelector('[data-component="help-hint"] summary')?.getAttribute("aria-label")` が一致 |
| TC-A5 | AC-A4 | HelpHint summary クリックで `<details>` が open 状態になり 3 つの `<dt>` / `<dd>` が描画される | `fireEvent.click(summary)`; `details.hasAttribute("open") === true`; `getAllByRole("term").length === 3`; `getAllByRole("definition").length === 3` |
| TC-A6 | AC-A4 | HelpHint 内 `<dd>` のテキストが OPTIONS description と一致 | 各 dd の `textContent` が `comfy/dense/list` description と完全一致 |
| TC-A7 | AC-A6 | 主ラベル `ゆったり / 密 / リスト` が radiogroup 内 accessible name として解決可能 (carry-over) | `getByRole("radio", { name: "ゆったり" })` 等が throw しない |

> `getAllByRole("term")` / `getAllByRole("definition")` の WAI-ARIA mapping が happy-dom で動かない場合は
> `container.querySelectorAll('[data-component="help-hint"] dt').length === 3` のフォールバックを許容する。

## 4. テストデータ

OPTIONS は実装と同じ const をテスト内で再定義せず、`textContent` 比較で本文を確認する。
主ラベル文字列は `"ゆったり" | "密" | "リスト"` の 3 種で固定。

## 5. モック方針

- `next/navigation` は既存通り `useRouter` / `useSearchParams` / `usePathname` を `vi.mock`
- HelpHint 内 `<details>` の native open 状態は happy-dom が `open` 属性として管理する前提

## 6. 実行コマンド

```bash
# 該当 spec のみ
mise exec -- pnpm --filter @ubm/web vitest run \
  src/components/public/__tests__/DensityToggle.client.spec.tsx

# typecheck
mise exec -- pnpm --filter @ubm/web typecheck
```

## 7. 期待結果

- 既存 3 ケース (TC-E1〜E3) GREEN 維持
- 新規 7 ケース (TC-A1〜A7) GREEN
- 合計 10 ケース・FAIL 0 件

## 8. RED → GREEN 順序

1. 新規ケース TC-A1〜A7 を追加 → RED 確認
2. `Segmented.tsx` の SegmentedOption 型拡張 + button 内 sublabel 描画
3. `DensityToggle.client.tsx` の OPTIONS 拡張 + visually-hidden span + HelpHint 配置
4. `DensityToggle.client.tsx` 新規作成
5. 全 10 ケース GREEN 確認

## DoD

- [x] テストケース一覧が AC ID と紐づいている
- [x] 既存ケース互換維持が明示されている
- [x] 実行コマンドが具体的に示されている
- [x] RED → GREEN 順序が明示されている
