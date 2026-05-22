# Phase 6: テスト拡充

## 追加テストケース

### CallToActionCTA.component.spec.tsx に追加

```tsx
it("renders with required prop only, applies all defaults (regression guard)", () => {
  render(<CallToActionCTA responderUrl="https://x.example/" />);
  expect(screen.getByRole("heading", { name: "メンバー情報の掲載をお願いします" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "回答フォームを開く" })).toHaveAttribute(
    "href",
    "https://x.example/",
  );
});

it("does not leak href as plain text (xss-shaped regression guard)", () => {
  const url = "https://x.example/?q=<script>";
  render(<CallToActionCTA responderUrl={url} />);
  // anchor は href として受け取る。textContent には現れない
  expect(screen.queryByText(url)).toBeNull();
  expect(screen.getByRole("link")).toHaveAttribute("href", url);
});

it("eyebrow text 'FOR MEMBERS' is rendered (visual contract)", () => {
  render(<CallToActionCTA responderUrl="https://x.example/" />);
  expect(screen.getByText("FOR MEMBERS")).toBeInTheDocument();
});
```

### HomePage page.tsx の statement-level integration（追加）

既存 HomePage spec があれば追記、なければ新規 file は作らず Phase 11 の手動テストで担保する。

```tsx
it("renders CallToActionCTA even when members list is empty (AC-2 regression)", async () => {
  // listMembersRaw を items: [] でモック
  // HomePage が members 件数によらず CallToActionCTA を出すことを確認
});
```

## fail path / 補助 command

| ケース | 期待動作 |
|--------|---------|
| `responderUrl=""` | 空文字でも anchor は render される（runtime crash しない）。propTypes 警告は出さない |
| `heading=""` を渡す | 空 h2 が render される（呼び出し側責任。component で trim しない） |

## ローカル実行コマンド

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" exec vitest run \
  apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx \
  apps/web/src/lib/constants/__tests__/form.spec.ts
```

## 完了条件

- [ ] 上記 3 追加ケースが GREEN
- [ ] 全体テスト件数の増加が docs 上で確認できる（Phase 11 manual-test-result.md に記録）

## 成果物

`outputs/phase-6/test-expansion.md`
