# Phase 6: テスト拡充

> Phase: 6 / 13
> 名称: テスト拡充（Phase 4 の主要ケースに対するエッジケース追加）

---

## 6.1 追加テスト一覧

| # | spec ファイル | describe / it | 目的 |
|---|---------------|---------------|------|
| A1 | `login-error.spec.tsx` | renders without error.digest | `digest` が undefined のとき code block が描画されない |
| A2 | `login-error.spec.tsx` | does not re-focus on re-render with same error | `error` が同一参照なら focus は 1 回のみ |
| A3 | `login-error.spec.tsx` | console.error called once per error | `error` 変化時のみログが追加される |
| A4 | `login-loading.spec.tsx` | respects prefers-reduced-motion (matchMedia mock) | `prefers-reduced-motion: reduce` で `animate-pulse` がクラスに含まれていても CSS で抑制されることをスナップショット |
| A5 | `login-loading.spec.tsx` | sr-only text is visually hidden | computed style に `clip-path` または `sr-only` クラスが適用される |
| A6 | `root-error.spec.tsx` | preserves existing aria-live attribute | 既存 `aria-live` が `"assertive"` のまま変更されない |
| A7 | `root-error.spec.tsx` | renders digest when provided | `error.digest` が code 要素で表示される |
| A8 | `profile-loading.spec.tsx` | skeleton count is stable | avatar 1 + name 1 + kv 3 = 5 要素 |
| A9 | `profile-loading.spec.tsx` | uses motion-safe class | クラスリストに `motion-safe:animate-pulse` が含まれる |

---

## 6.2 E2E エッジケース

| # | scenario | 目的 |
|---|----------|------|
| E6 | `/login` でネットワーク 503 → error → reset で復帰 | reset 後に skeleton → 正常画面 |
| E7 | dark テーマで focus outline 視認性 | スクリーンショット差分 |
| E8 | reduced-motion ON で `/login` slow load | pulse が止まることを CSS computed で確認 |

---

## 6.3 jest-axe 拡張

各 spec の jest-axe 検証は以下のルールを有効化:

- `region` rule: section / role がない領域がないか
- `color-contrast` rule: OKLch クラスのコントラスト比 4.5:1 以上
- `aria-allowed-attr` rule: `aria-busy` の使用箇所が `role="status"` 等の許可要素か

jsdom 環境で color-contrast が無効な場合は Playwright 側で axe-playwright を使って同等チェックを実施。

---

## 6.4 完了判定

- 上記 A1〜A9 + E6〜E8 が green
- 追加ケースで既存 19 ケースが broken にならない
- jest-axe violations 引き続き 0

---

## 次フェーズへの引き継ぎ

Phase 7 で line / branch coverage を測定し、80% 閾値を超えるか確認する。
