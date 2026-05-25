**[実装区分: 実装仕様書]**

# Phase 6: テスト拡充 / fail path / regression guard

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `spec_created` |
| 入力 | Phase 4 テスト計画 / Phase 5 実装 |
| 出力 | 本ファイル |

## 1. 追加 fail path テスト

### TC-EXEMPT-05: 拡張子が `.css` の場合は exempt 対象外

```ts
it("brand-icons 直下でも .css ファイル内 HEX は exempt 対象外で FAIL する", () => {
  // fixture: components/ui/brand-icons/google.css に '#4285F4' を含む内容
  const result = scanForbiddenColorLiterals({ root: tmpRoot });
  expect(result.violations.length).toBeGreaterThan(0);
});
```

理由: 正規表現が `.svg` のみに固定されているため、`.css` は exempt 外。将来うっかり `.css` を `brand-icons/` に置いた場合の検出を保証。

### TC-EXEMPT-06: 拡張子が `.ts`（非 tsx）の場合も exempt 対象外

```ts
it("brand-icons 直下でも .ts ファイル内 HEX は exempt 対象外で FAIL する", () => {
  // fixture: components/ui/brand-icons/colors.ts に '#34A853' を含む内容
  const result = scanForbiddenColorLiterals({ root: tmpRoot });
  expect(result.violations.length).toBeGreaterThan(0);
});
```

理由: HEX 直書きが許されるのは「SVG asset」だけ。設定値 `.ts` や component `.tsx` で HEX を許すと token 設計が壊れる。

### TC-EXEMPT-07: 別 directory 名 `brand-icon`（単数形）配下は exempt 対象外

```ts
it("brand-icon（単数形）配下の HEX は exempt 対象外で FAIL する", () => {
  // fixture: components/ui/brand-icon/google.tsx
  const result = scanForbiddenColorLiterals({ root: tmpRoot });
  expect(result.violations.length).toBeGreaterThan(0);
});
```

理由: 命名 typo / 別ディレクトリでの抜け穴化を防ぐ。正規表現は `brand-icons` 複数形のみマッチ。

## 2. 補助 command

```bash
# Phase 6 完了確認
mise exec -- pnpm vitest run scripts/verify-design-tokens.spec.ts

# 期待: TC-EXEMPT-01..07 すべて Green
```

## 3. 既存テストへの影響確認

| 既存 test | 期待 |
|---|---|
| `apps/web` 配下の component spec | 既存 PASS を維持（IconName から `"google"` 削除の影響は `GoogleOAuthButton` 1 箇所のみ） |
| `verify-design-tokens.spec.ts` の既存ケース | regression 0 件 |

## 4. fail path カバレッジまとめ

| ケース | 通過条件 |
|---|---|
| brand-icons 直下 svg HEX → PASS | TC-EXEMPT-01 |
| brand-icons 直下 tsx HEX → FAIL | TC-EXEMPT-02 |
| brand-icons subdir HEX → FAIL | TC-EXEMPT-03 |
| 通常 src HEX → FAIL | TC-EXEMPT-04 |
| brand-icons 直下 css HEX → FAIL | TC-EXEMPT-05 |
| brand-icons 直下 ts HEX → FAIL | TC-EXEMPT-06 |
| brand-icon（単数形）配下 → FAIL | TC-EXEMPT-07 |

## 5. Phase 6 完了条件

- [x] fail path TC-EXEMPT-05〜07 を追加
- [x] 既存テストへの影響なしを確認
- [x] fail path カバレッジ表を提示

## 6. 次 Phase への引き継ぎ

Phase 7 では `verify-design-tokens.ts` の exempt 分岐 line / branch カバレッジを実測し、変更行が完全に覆われていることを証跡化する。
