**[実装区分: 実装仕様書]**

# Phase 4: テスト作成 / TDD Red 計画

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `spec_created` |
| 入力 | Phase 2 設計 / Phase 3 Gate-A GO |
| 出力 | 本ファイル + Phase 5 への入力 |

## 1. テスト対象一覧

| ID | 対象 | テストファイル | mode |
|---|---|---|---|
| T1 | `verify-design-tokens` brand-asset exempt | `scripts/verify-design-tokens.spec.ts` | vitest unit |
| T2 | `GoogleOAuthButton` の 4-tone icon 描画 | `apps/web/app/login/_components/GoogleOAuthButton.component.spec.tsx`（既存があれば追加 / なければ snapshot のみ） | vitest component |
| T3 | `/login` visual snapshot | `apps/web/playwright/tests/visual/login.spec.ts` | Playwright visual |

## 2. T1: verify-design-tokens.spec.ts への追加ケース

### TC-EXEMPT-01: brand-icons 直下 SVG の HEX は PASS

```ts
it("brand-icons 直下の .svg 内 HEX は exempt として scan されない", () => {
  // fixture: tmp dir / components/ui/brand-icons/google.svg に '#4285F4' を含む内容を書く
  const result = scanForbiddenColorLiterals({ root: tmpRoot });
  expect(result.violations).toHaveLength(0);
});
```

### TC-EXEMPT-02: brand-icons 直下 TSX の HEX は FAIL

```ts
it("brand-icons 直下の .tsx 内 HEX は exempt 対象外で FAIL する", () => {
  // fixture: components/ui/brand-icons/GoogleBrandIcon.tsx に '#EA4335' を含む内容を書く
  const result = scanForbiddenColorLiterals({ root: tmpRoot });
  expect(result.violations.length).toBeGreaterThan(0);
});
```

### TC-EXEMPT-03: brand-icons サブディレクトリ配下の HEX は FAIL（再帰させない境界確認）

```ts
it("brand-icons サブディレクトリ配下の HEX は exempt 対象外で FAIL する", () => {
  // fixture: components/ui/brand-icons/sub/google.svg に '#FBBC05' を含む内容を書く
  const result = scanForbiddenColorLiterals({ root: tmpRoot });
  expect(result.violations.length).toBeGreaterThan(0);
  expect(result.violations[0].file).toMatch(/brand-icons\/sub\/google\.svg$/);
});
```

### TC-EXEMPT-04: 通常 src 配下の HEX は引き続き FAIL を維持（regression guard）

```ts
it("通常 src 配下の .tsx 内 HEX は引き続き FAIL する（regression guard）", () => {
  // fixture: components/ui/Card.tsx に '#ff0000' を含む内容を書く
  const result = scanForbiddenColorLiterals({ root: tmpRoot });
  expect(result.violations.length).toBeGreaterThan(0);
  expect(result.violations[0].file).toMatch(/components\/ui\/Card\.tsx$/);
});
```

### TDD Red 計画

- Phase 5 の手順 3（verify-design-tokens 拡張）の前に TC-EXEMPT-01〜04 を **Red** 状態で書く
- TC-EXEMPT-01 は exempt 未実装時に FAIL（HEX 検出される）
- TC-EXEMPT-02 は実装前後とも FAIL（TSX への HEX 逃げ道を塞ぐ regression guard）
- TC-EXEMPT-03 は exempt 未実装時に PASS（元々検出される）→ 実装後も PASS（直下のみ exempt のため）
- TC-EXEMPT-04 は exempt 未実装時に PASS（元々検出される）→ 実装後も PASS（regression guard）

## 3. T2: GoogleOAuthButton component test

### 既存 spec 確認

- `apps/web/app/login/_components/` 配下に `GoogleOAuthButton.component.spec.tsx` が存在するか Phase 5 開始時に grep で確認
- 存在しない場合: snapshot test を作らず、Playwright visual snapshot（T3）で代替
- 存在する場合: `<GoogleBrandIcon />` が render される assert を追加

### 追加 assert（spec 存在時）

```tsx
it("GoogleBrandIcon が leftIcon に描画される", () => {
  render(<GoogleOAuthButton />);
  const button = screen.getByRole("button", { name: /Google/i });
  const icon = button.querySelector('img[aria-hidden="true"][alt=""]');
  expect(icon).not.toBeNull();
  expect(icon).toHaveAttribute("draggable", "false");
  // HEX literal は SVG asset に閉じ、rendered TSX markup へ漏らさない
  expect(button.innerHTML).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
});
```

## 4. T3: Playwright visual baseline 更新

### baseline 再生成手順

```bash
mise exec -- pnpm --filter @ubm-hyogo/web playwright test visual/login --update-snapshots
```

### 更新対象

- `apps/web/playwright/tests/visual/login.spec.ts-snapshots/login-visual-chromium-linux.png` 等の chromium baseline 一式
- baseline 差分が必ず出る（1-tone stroke → 4-tone fill）ため、`--update-snapshots` 実行を Phase 5 完了時に必須化

### 検証

- baseline 更新後の再実行で `pnpm --filter @ubm-hyogo/web playwright test visual/login` が PASS することを Phase 9 で確認

## 5. テスト命名規則と naming pattern

| 種別 | 命名規則 | 例 |
|---|---|---|
| vitest unit | `*.spec.ts` | `verify-design-tokens.spec.ts` |
| vitest component | `*.component.spec.tsx` | `GoogleOAuthButton.component.spec.tsx` |
| Playwright visual | 既存 `visual/login.spec.ts` を流用 | – |

> CLAUDE.md 不変条件 8: 新規 test ファイルは `*.spec.{ts,tsx}` のみ。`*.test.{ts,tsx}` は禁止（lefthook で reject）

## 6. fixture 設計

`verify-design-tokens.spec.ts` の fixture は `tmp` ディレクトリに mini repo 構造を作って scan する既存パターン（Phase 5 で実装時に既存 fixture helper を確認）。新規追加ケースでも同じ helper を再利用する。

## 7. Props vs internal state 確認

`GoogleBrandIcon` は **stateless functional component**。internal state なし。すべて props 駆動。テストは props 注入のみで完結する。

## 8. private method テスト方針

`scanForbiddenColorLiterals()` は module-level export 関数。private method キャスト不要。直接 import してテストする。

## 9. Phase 4 完了条件

- [x] T1 / T2 / T3 のテスト対象を明示
- [x] TC-EXEMPT-01〜04 の 4 ケース仕様を確定
- [x] TDD Red 計画（実装前に Red 状態で書く）を明示
- [x] baseline 更新手順を確定
- [x] 命名規則 / fixture / Props vs state / private method 方針を確定

## 10. 次 Phase への引き継ぎ

Phase 5 では本 Phase で確定したテストケースを TDD Red 状態で先に書き、その後 11 件の変更を Phase 2 の実装順序 9 ステップに従って実装する。各テストが Green に変わるタイミングを Phase 5 内で記録する。
