[実装区分: 実装仕様書]

# Phase 10: 最終レビュー（Go / No-Go）

## 1. 完了確認マトリクス

| 観点 | 状態 | 根拠 |
|---|---|---|
| `scripts/verify-design-tokens.ts` line 61-66 に 4 件追加 | 完了 | Phase 5 実装 |
| `pnpm verify:tokens` ローカル exit 0 | 完了 | `outputs/phase-11/verify-tokens-local.txt` |
| GitHub Actions `verify-design-tokens` green | user-gated | Phase 13 PR 作成後に確認 |
| 他 verify gate に regression なし | 完了 | focused Vitest / Phase 12 compliance |
| drift 検出能力維持 | 完了 | `outputs/phase-11/drift-canary-fail.txt`, `outputs/phase-11/canary-non-og-route.txt` |

## 2. CLAUDE.md 不変条件との整合性レビュー

CLAUDE.md「UI prototype alignment / MVP recovery」§不変条件 2 の OKLch token 正本化:

> **OKLch トークン正本化**: 色は `apps/web/src/styles/tokens.css` と `docs/00-getting-started-manual/specs/design-tokens.md` が正本。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止。CI gate `verify-design-tokens`（task-18）で fail 判定。

本修正の整合性:

- 追加 exclude 4 件はすべて **Next.js Metadata Files convention** の route handler 形式（`opengraph-image/route.tsx` 等）
- これらは `next/og` の `ImageResponse`（内部実装は **satori**）でレンダリングされる
- satori は **CSS variable / Tailwind class を解決できない** — HEX literal が技術的に必須
- 既に root convention（`opengraph-image.tsx` 等）4 件は exclude 済み。route convention 4 件はその対称形であり「同じ satori 制約による正当な例外」
- 通常の UI コンポーネント（`apps/web/src/components/**`、`apps/web/app/**/page.tsx` 等）に対する HEX 直書き禁止は **そのまま維持される**

よって「HEX 直書き禁止」原則の **本質的緩和は発生しない**。satori 制約という技術的・物理的に回避不能な領域のみを exclude する正当な拡張である。

## 3. レビュー判定

**承認（Go）**。

判定根拠:
- 修正範囲が局所的（verifier と focused spec）かつ純粋に static analysis exclude 拡張
- ランタイム挙動への影響ゼロ（`scripts/verify-design-tokens.ts` は CI 検査専用）
- CLAUDE.md 不変条件との論理整合あり
- drift 検出能力（regression 観点）が Phase 9 §3 で保全確認可能

## 4. ロールバック手順

1. `scripts/verify-design-tokens.ts` line 61-66 から追加した 4 行を削除
2. `git revert <commit-sha>` で本 PR commit を巻き戻し再 push
3. 巻き戻し後は元の状態（`verify-design-tokens` が `opengraph-image/route.tsx` の HEX で fail）に戻るのみ。アプリ実行系には一切影響なし

ロールバック後、PR #175 の CI failure が再発するため、別アプローチ（例: `opengraph-image/route.tsx` を `opengraph-image.tsx` root convention に書き換え）を検討する必要がある。
