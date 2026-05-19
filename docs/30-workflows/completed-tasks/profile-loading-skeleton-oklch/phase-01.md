# Phase 1: 要件定義

## 目的

`/profile` route の streaming 中 placeholder を、profile card 形状（avatar + heading + 4 KV rows）の skeleton に統一する。

## 必達要件 (Functional)

| ID | 要件 |
|----|------|
| FR-01 | `apps/web/app/profile/loading.tsx` が default export として `ProfileLoading` を返す |
| FR-02 | render 結果は avatar circle + heading bar + KV pair 4 行で構成する |
| FR-03 | `role="status"` `aria-busy="true"` `aria-live="polite"` を root に持つ |
| FR-04 | `sr-only` テキスト「マイページを読み込み中」を含む |
| FR-05 | pulse animation は `motion-safe:animate-pulse` で `prefers-reduced-motion` を尊重 |

## 非機能要件 (Non-Functional)

| ID | 要件 |
|----|------|
| NFR-01 | 色は design-token utility `bg-surface-2` のみ使用。component-level HEX / arbitrary color 直書き禁止 |
| NFR-02 | レイアウトは `max-w-3xl` / `px-6 py-12` / `space-y-6` で本体 page と一致させる |
| NFR-03 | TypeScript strict mode 配下で `ReactElement` 型を明示 |

## 入力 (Current State)

```tsx
// apps/web/app/profile/loading.tsx
export default function ProfileLoading() {
  return (
    <main>
      <h1>マイページ</h1>
      <p aria-live="polite">読み込み中…</p>
    </main>
  );
}
```

シンプル text のみで skeleton pattern なし。`bg-surface-2` 等の token utility 未使用。

## 出力 (Desired State)

- `loading.tsx` が skeleton 形状を持ち、design-token utility 経由で色を適用
- `loading.spec.tsx` が a11y 属性と sr-only テキストを検証する PASS suite を持つ

## 不変条件

1. profile page 本体 (`apps/web/app/profile/page.tsx`) は変更しない
2. avatar / KV pair component を新規追加しない（skeleton 内で `<div>` 形状のみ）
3. 既存 API endpoint / D1 schema / Google Form schema に変更を加えない
4. p-07 spec section 4.5 の DoD を満たす

## スコープ外

- profile page 本体の layout 変更
- design token 自体の変更（`bg-surface-2` utility が未登録の場合は globals.css に最小追加のみ許容）
- error.tsx / not-found.tsx の変更

## 参照

- source spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i07-profile-loading-skeleton/spec.md`
- 正本 token: `apps/web/src/styles/globals.css` / `apps/web/src/styles/tokens.css`
- prototype: `docs/00-getting-started-manual/claude-design-prototype/`

## 完了条件

- [ ] FR-01 〜 FR-05 / NFR-01 〜 NFR-03 を仕様確定
- [ ] スコープ外項目を明文化
- [ ] 参照ドキュメントを enumerate
