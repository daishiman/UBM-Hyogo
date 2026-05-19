# Phase 3: 設計レビュー

## 1. レビュー観点と判定

| 観点 | 判定 | コメント |
|---|---|---|
| 単一責務 | OK | `/profile` loading boundary 単体 |
| SRP / 分離 | OK | loading.tsx と spec.tsx のみ。本体 page.tsx は触らない |
| 既存資産再利用 | OK | OKLch token / Tailwind v4 utility / 既存 a11y pattern を再利用 |
| 新規 primitive 生成 | なし | i05/i06 横展開メモの「i05/i06/i07 完了後に hook 抽出」を尊重 |
| HEX 直書き | なし | `bg-surface-2` utility のみ |
| Client/Server 境界 | OK | Server Component（`"use client"` 不要） |
| Next.js 規約 | OK | default export / props なし |
| テスト容易性 | OK | role/aria/sr-only すべて `@testing-library/react` で検証可能 |
| CLS 影響 | OK | 実 page と同じ `max-w-3xl` container を使用 |
| reduced-motion | OK | `motion-safe:` prefix で `prefers-reduced-motion` 尊重 |

## 2. 横展開メモ（i05/i06/i07 共通）

i05/i06 と本タスク (i07) で確立する pattern は完全に共通:

```
<main role="status" aria-busy="true" aria-live="polite" data-page="...-loading">
  <span className="sr-only">{文脈テキスト}</span>
  {placeholder blocks with bg-surface-2 motion-safe:animate-pulse}
</main>
```

3 件すべて merge 後の整理タスクで `useAutoFocusOnMount` / `<LoadingSkeleton>` primitive の抽出を検討する（本タスク scope 外、CONST_007 例外なし）。

## 3. リスクと回避策

| リスク | 影響 | 回避策 |
|---|---|---|
| `bg-surface-2` utility 未生成 | skeleton が白抜けで invisible | Phase 2 §1 で `--color-surface-2` が `@theme inline` 内にあることを確認済み。Tailwind v4 で自動生成 |
| 実 page の container 幅が変わっている | CLS 残存 | Phase 11 §3 で `/profile` を localhost で開き、skeleton → 本体の遷移を目視確認 |
| `motion-safe:` が JIT で未認識 | animation 効かず | Tailwind v4 標準サポート。globals.css に追加定義不要 |
| `data-page` 命名衝突 | E2E 識別子重複 | `profile-loading` は既存値 grep でゼロ（Phase 5 §0 で確認） |
| Next.js 16 Turbopack/Webpack 差異 | Server Component で意図せず client bundling | `"use client"` を付けない / hooks を import しない構成で問題なし |

## 4. 設計承認

設計上の論点はすべて解消。Phase 4 のテスト計画に進む。

- 承認者: spec author（self-review / solo dev）
- 承認日: 仕様書作成日（実装時に Phase 13 で実日付記録）
