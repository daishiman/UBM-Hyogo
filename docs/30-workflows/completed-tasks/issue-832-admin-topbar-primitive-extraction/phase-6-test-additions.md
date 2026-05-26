# Phase 6: テスト追加（境界 / fail path / 回帰 guard）

Phase 4 のハッピーパス TC に加え、Phase 3 リスク表（特に R-5）由来の境界ケースと回帰 guard を追加する。本 Phase は「実装済み」宣言ではなく、実装者が Gate-B で完了確認するための受け入れチェックリストである。

## 1. 追加観点チェックリスト

- [ ] TB-1: `breadcrumb={null}` で既定テキスト「管理」へフォールバックする（Phase 3 R-5 / Phase 2 §4「`?? "管理"`」の境界）
- [ ] TB-2: actions に falsy ReactNode（`""` / `0` / `false`）を渡したケースの DOM 挙動を確定させる
- [ ] TB-3: breadcrumb に falsy だが意味のある `0` を渡したケース（`??` は `0` を残す）
- [ ] REG-1: `(admin)/layout.spec.tsx` の既存 4 ケースが無修正で pass する
- [ ] AUX-1: `AdminTopbar.tsx` に HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が 0 件

## 2. 境界テストスニペット（`AdminTopbar.spec.tsx` に追記）

```tsx
describe("AdminTopbar 境界", () => {
  // TB-1: breadcrumb に null を渡すと既定「管理」へフォールバック（Phase 3 R-5）
  it("breadcrumb={null} は既定テキスト「管理」へフォールバックする", () => {
    const { container } = render(<AdminTopbar breadcrumb={null} />);
    const slot = container.querySelector('[data-component="admin-breadcrumb-slot"]');
    // breadcrumb の `?? "管理"` は undefined と null の両方で「管理」へ落ちる
    expect(slot?.textContent).toBe("管理");
  });

  // TB-3: breadcrumb に 0 を渡すと ?? は 0 を残す（null/undefined 以外はそのまま）
  it("breadcrumb={0} は ?? を通過し 0 がそのまま表示される", () => {
    const { container } = render(<AdminTopbar breadcrumb={0} />);
    const slot = container.querySelector('[data-component="admin-breadcrumb-slot"]');
    expect(slot?.textContent).toBe("0");
  });

  // TB-2: actions に falsy ReactNode を渡しても省略（undefined）とは区別される。
  // 設計（Phase 2 §4）: aria-hidden は actions === undefined のときのみ付く。
  // null/""/false/0 はいずれも「明示注入」なので aria-hidden は付かない（visible 空 div）。
  it("actions={null} は省略と区別され aria-hidden が付かない", () => {
    const { container } = render(<AdminTopbar actions={null} />);
    const actions = container.querySelector('[data-component="admin-topbar-actions"]');
    expect(actions).not.toBeNull();
    expect(actions?.hasAttribute("aria-hidden")).toBe(false);
    // React は null/false/"" を描画しないため子テキストは空
    expect(actions?.textContent).toBe("");
  });

  it("actions={false} も省略と区別され aria-hidden が付かない", () => {
    const { container } = render(<AdminTopbar actions={false} />);
    const actions = container.querySelector('[data-component="admin-topbar-actions"]');
    expect(actions?.hasAttribute("aria-hidden")).toBe(false);
  });
});
```

> **設計確認（Phase 2 §4 との整合）**: 省略時の `aria-hidden="true"` 判定は `actions === undefined` で行う。`null` / `false` / `""` / `0` を渡した場合は「明示的に注入された」とみなし `aria-hidden` を付けない（呼び出し側の意図を尊重）。`null`/`false`/`""` は React が描画しないため見た目は空だが、これは仕様どおり。本タスクでは layout から props 未指定（= `undefined`）でのみ呼ぶため、これらの falsy ケースは将来の利用者向けの契約固定である。

## 3. 回帰 guard：`(admin)/layout.spec.tsx` 無修正 pass の確認手順

```bash
# 1. layout.spec.tsx が編集されていないこと（git で差分ゼロ）
git diff --name-only -- "apps/web/app/(admin)/layout.spec.tsx"   # 出力が空であること

# 2. 既存 4 ケースが pass すること
mise exec -- pnpm --filter @ubm-hyogo/web test -- "app/(admin)/layout.spec.tsx"
```

確認対象 4 ケース（assert される data-* 契約）:

| 契約 | 付与位置（抽出後） |
|---|---|
| `data-shell="topbar"` | AdminTopbar 内部 root `<header>` |
| `data-shell="sidebar"` | layout.tsx `<aside>` |
| `data-route="admin"` | layout.tsx `<main>` |
| `data-theme="cool"` / `data-route-group="admin"` | layout.tsx wrapper `<div>` |

`layout.spec.tsx` が修正なしで pass すれば、data-* 契約の DOM 出現位置が抽出前後で不変であることの証跡になる。

## 4. 補助コマンド：HEX 直書きゼロ確認（AUX-1）

```bash
grep -rnE '#[0-9a-fA-F]{3,6}|bg-\[#|text-\[#' "apps/web/src/components/layout/AdminTopbar.tsx"
# → マッチ 0 件（exit code 1 / 出力なし）を期待。
#   1 件でもマッチしたら CLAUDE.md UI 不変条件2 / verify-design-tokens gate に抵触。
```

色は `var(--ubm-color-border-default)` / `var(--ubm-color-text-primary)` の token 経由のみ。inline JSX から無改変で移植した結果として HEX は出現しないはず。

## 5. テストしないケース（意図的に除外）

| ケース | 除外理由 |
|---|---|
| pixel-perfect / snapshot 画像比較 | 新規 visual を導入しない抽出作業であり、見た目は inline JSX と同一。視認は Phase 11 で担保 |
| client interaction（actions ボタンの onClick） | AdminTopbar は Server Component で client API を持たない（Phase 2 §1）。actions の挙動は注入側の責務 |
| `(admin)/layout.tsx` の auth gate / grid 配置 | 本タスク変更対象外。layout.spec.tsx の回帰のみで担保 |

## 6. 実行コマンド再掲

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- "src/components/layout/__tests__/AdminTopbar.spec.tsx"
mise exec -- pnpm --filter @ubm-hyogo/web test -- "app/(admin)/layout.spec.tsx"
grep -rnE '#[0-9a-fA-F]{3,6}|bg-\[#|text-\[#' "apps/web/src/components/layout/AdminTopbar.tsx"
```
