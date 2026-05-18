# Phase 3 — 設計

[実装区分: 実装仕様書]

## 3.1 アーキテクチャ概観

```
apps/web/
├── src/
│   ├── test/
│   │   └── axe.ts                       ← 新規: 共有 axe runner + rule baseline
│   └── components/ui/__tests__/
│       └── parallel09-primitives.component.spec.tsx   ← 編集: jest-axe 統合 + proxy 整理
```

## 3.2 共有 axe runner 設計（`apps/web/src/test/axe.ts`）

### 3.2.1 公開 API

```ts
// apps/web/src/test/axe.ts
import { configureAxe, type JestAxeConfigureOptions } from "jest-axe";

/**
 * primitive / 部分 UI 用の axe runner。
 *
 * jsdom では layout / computed style 系 rule が false positive を出すため
 * 以下を baseline で disable する:
 *   - color-contrast: jsdom の getComputedStyle が OKLch token の rgb 化に未対応
 *   - region: primitive を独立 render する性質上 landmark が無いのは正常
 *   - landmark-one-main: 同上
 *
 * 上記以外の rule（aria-*、name 関連、focus 関連、role 整合等）は enable のままとする。
 */
export const axe = configureAxe({
  rules: {
    "color-contrast": { enabled: false },
    "region": { enabled: false },
    "landmark-one-main": { enabled: false },
  },
});
```

### 3.2.2 シグネチャ

- export: `axe(container: Element | string): Promise<AxeResults>`
- 副作用: なし（pure functional wrapper）
- 入力: 任意の DOM 要素 / HTML 文字列
- 出力: axe-core の結果オブジェクト。caller は `results.violations.toHaveLength(0)` で assert

## 3.3 spec 統合戦略

`parallel09-primitives.component.spec.tsx` に以下を追加する。

```ts
import { axe } from "@/test/axe";

describe.each([
  ["FormField", () => render(<FormField name="x" label="X"><input /></FormField>).container],
  ["FormField (error)", () => render(<FormField name="e" label="E" error="必須"><input /></FormField>).container],
  ["EmptyState", () => render(<EmptyState title="空" description="ありません" />).container],
  ["Pagination", () => render(<Pagination current={2} total={50} pageSize={10} hasNext hasPrev onNext={() => {}} onPrev={() => {}} />).container],
  ["Icon (labelled)", () => render(<Icon name="search" ariaLabel="検索" />).container],
  ["Icon (decorative)", () => render(<Icon><svg /></Icon>).container],
  ["Breadcrumb", () => render(<Breadcrumb items={[{ label: "管理", href: "/admin" }, { label: "会員" }]} />).container],
])("a11y(%s)", (_, mount) => {
  it("axe violation 0", async () => {
    const results = await axe(mount());
    expect(results.violations).toHaveLength(0);
  });
});
```

### 3.3.1 axe と固有契約の責務分離

30種思考法レビューで「axe が代替」として assertion を削除する方針を撤回した。axe は rule violation を検出するが、各 primitive が公開 API として約束する exact attribute value までは保証しない。

### 3.3.2 残置する固有契約

- `FormField`: `aria-invalid="true"`、`describedBy === errorEl.id` の id 参照一致、required アスタリスク class
- `EmptyState`: `role="status"`、title / description / action 描画、children-only API 互換
- `Pagination`: `nav[aria-label="pagination"]`、`2 / 5` テキスト、`ページ 3` テキスト、`onNext`/`onPrev` 発火条件
- `Icon`: decorative icon の `aria-hidden="true"`、`size` ごとの px 値、`role="img"` + `aria-label` 名前
- `Breadcrumb`: `nav[aria-label="breadcrumb"]`、`aria-current="page"` の値、separator の `aria-hidden="true"`、href 無しの span 描画、items 空時の null 描画

## 3.4 依存・実行環境

| 項目 | 値 |
| --- | --- |
| node | 24.15.0（`.mise.toml`） |
| vitest environment | jsdom |
| 依存追加 | なし（`jest-axe` 既存） |
| `vitest.config.ts` 変更 | なし |
| `expect.extend` | 使わない（既存 admin pattern に揃える） |

## 3.5 rule baseline 妥当性根拠

| rule | disable 理由 |
| --- | --- |
| color-contrast | jsdom の `getComputedStyle` は OKLch (task-09) の rgb 化を行わない。Lighthouse / Playwright で別途検証する |
| region | primitive は landmark 外で render する。実画面では `error.tsx` / layout が main を供給する |
| landmark-one-main | 同上 |

それ以外（`aria-*`、`role-img-alt`、`button-name`、`link-name`、`aria-allowed-role` 等）は enable を維持。
