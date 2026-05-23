[実装区分: 実装仕様書]

# Phase 8: リファクタ

## 1. 本タスクでのリファクタ範囲

**なし**。

本修正は `scripts/verify-design-tokens.ts` の `colorLiteralExcludes` 配列拡張、scanner/defaults の named export、重複 filter 整理に限定する。構造的改善余地は追加抽象を要するほど大きくない。

## 2. 検討したが見送った項目

| 項目 | 見送り理由 |
|---|---|
| `colorLiteralExcludes` を「satori 制約による HEX 必須ファイル」という意味で別配列に切り出し（例: `satoriHexExcludes`） | 現状 8 件（`.tsx` 4 件 + `route.tsx` 4 件）すべて同じ「`next/og` `ImageResponse` 由来」起源。論理的に同一バケット。callsite が増えるか、別理由の exclude が混じった時点で再評価 |
| Next.js Metadata Files convention の全 file/route 形を generator 化（`['opengraph-image', 'twitter-image', 'icon', 'apple-icon'].flatMap(n => [`${n}.tsx`, `${n}/route.tsx`])`） | 現状 8 件で見通しが効くため、機械生成のメタプログラミングコストが上回る。10 件超か新 convention 追加時に再評価 |

## 3. リファクタを将来扱う場合の入口

- 新しい Next.js Metadata Files convention（例: `sitemap.xml/route.tsx`）が追加され、かつ HEX 直書きが必要になった時点で `colorLiteralExcludes` 配列を `satori-required-hex` 専用配列へ分割する
- 分割した場合は `scripts/verify-design-tokens.ts` の comment で「OKLch token 不変条件 (CLAUDE.md) の satori 例外バケット」である旨を明示する
