# Phase 6 — 実装手順

[実装区分: 実装仕様書]

## 6.1 ステップ概観

1. ワークツリーで作業ブランチを `feat/issue-748-jest-axe-primitive-a11y` として作成
2. T1: `apps/web/src/test/axe.ts` を新規作成
3. T2: `parallel09-primitives.component.spec.tsx` に `axe` import と `describe.each` 追加
4. T3: axe と component contract assertion の責務を分離
5. T4: ローカル test 実行 + log 保存
6. T5: typecheck / lint

## 6.2 T1 実装詳細

`apps/web/src/test/axe.ts` を新規作成し、以下を書く:

```ts
import { configureAxe } from "jest-axe";

/**
 * primitive / 部分 UI 用の axe runner。
 *
 * jsdom では以下 rule が false positive を出すため baseline で disable:
 *   - color-contrast: jsdom getComputedStyle が OKLch token (task-09) の rgb 化に未対応
 *   - region: primitive を独立 render する性質上 landmark 無しが正常
 *   - landmark-one-main: 同上
 *
 * 上記以外（aria-*、role-img-alt、button-name、link-name、aria-allowed-role 等）は enable のまま。
 * 実画面の color-contrast / region 検証は Lighthouse / Playwright axe で別途実施する。
 */
export const axe = configureAxe({
  rules: {
    "color-contrast": { enabled: false },
    "region": { enabled: false },
    "landmark-one-main": { enabled: false },
  },
});
```

## 6.3 T2 実装詳細

`apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx` の冒頭 import 直後に以下を追加:

```ts
import { axe } from "@/test/axe";
```

ファイル末尾に以下の `describe.each` を追加:

```ts
describe.each([
  [
    "FormField",
    () =>
      render(
        <FormField name="name" label="氏名">
          <input type="text" />
        </FormField>,
      ).container,
  ],
  [
    "FormField (error)",
    () =>
      render(
        <FormField name="email" label="メール" error="必須項目です">
          <input type="email" />
        </FormField>,
      ).container,
  ],
  [
    "EmptyState",
    () =>
      render(
        <EmptyState
          icon={<span data-testid="ico" />}
          title="空"
          description="まだありません"
          action={<button>追加</button>}
        />,
      ).container,
  ],
  [
    "Pagination",
    () =>
      render(
        <Pagination
          current={2}
          total={50}
          pageSize={10}
          hasNext
          hasPrev
          onNext={() => {}}
          onPrev={() => {}}
        />,
      ).container,
  ],
  ["Icon (labelled)", () => render(<Icon name="search" ariaLabel="検索" />).container],
  [
    "Icon (decorative)",
    () =>
      render(
        <Icon>
          <svg />
        </Icon>,
      ).container,
  ],
  [
    "Breadcrumb",
    () =>
      render(
        <Breadcrumb items={[{ label: "管理", href: "/admin" }, { label: "会員" }]} />,
      ).container,
  ],
])("a11y(%s)", (_, mount) => {
  it("axe violation 0", async () => {
    const results = await axe(mount());
    expect(results.violations).toHaveLength(0);
  });
});
```

## 6.4 T3 実装詳細（責務分離）

30種思考法レビューにより、当初の proxy assertion 削除方針は破棄する。`axe` は real rule violation 0 件の横断チェックとして追加し、`aria-invalid` / `role=status` / `aria-label` / `aria-hidden` / `aria-current` などの exact component contract assertion は残す。

## 6.5 T4 実装詳細（evidence 取得）

```bash
mkdir -p docs/30-workflows/issue-748-jest-axe-primitive-a11y-integration/outputs/phase-11
mise exec -- pnpm --filter web test -- apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx 2>&1 \
  | tee docs/30-workflows/issue-748-jest-axe-primitive-a11y-integration/outputs/phase-11/local-test.log
```

green を確認。

## 6.6 T5 実装詳細

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

両方 green であることを確認。

## 6.7 DoD（Definition of Done）

- [ ] `apps/web/src/test/axe.ts` が存在し export `axe` を提供する
- [ ] `parallel09-primitives.component.spec.tsx` に shared `axe` import と 7 ケースの `describe.each` ブロックが存在する
- [ ] exact component contract assertion が残り、axe violation 0 件 test が追加されている
- [ ] `pnpm --filter web test -- parallel09-primitives.component.spec.tsx` が green
- [ ] `pnpm typecheck` / `pnpm lint` が green
- [ ] evidence ログが `outputs/phase-11/local-test.log` に存在する
