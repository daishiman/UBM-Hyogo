# Implementation Guide

## Part 1: 中学生にも分かる概念説明

なぜ必要かというと、色のルール表を守っているのに、OG画像だけが機械チェックに誤って怒られていたからです。
普段の画面では `#ff0000` のような生の色を書くと、色のルール表から外れてしまいます。
しかし OG画像を作る satori は CSS 変数を読めないため、この場所だけは生の色が必要です。

たとえば学校の全員が名札の色を「クラス表」で決める決まりだとしても、印刷機がクラス表を読めない場合は、印刷する名札だけ実際の色を書く必要があります。
今回の修正はその印刷機用の例外を、決まった棚にだけ置くイメージです。
何をしたかというと、OG画像・Twitter画像・icon・apple-icon の route handler 形式だけを検査除外に追加しました。

### 今回作ったもの

- `scripts/verify-design-tokens.ts` の route handler convention 除外。
- `scripts/verify-design-tokens.spec.ts` の C-EX-1〜C-EX-6 テスト。
- Phase 11 evidence と Phase 12 strict outputs。

## Part 2: 技術者向け実装詳細

`scripts/verify-design-tokens.ts` now exports `DEFAULTS` and `scanForbiddenColorLiterals`, removes the duplicated hardcoded root OG filter, and extends `colorLiteralExcludes` with `opengraph-image/route.tsx`, `twitter-image/route.tsx`, `icon/route.tsx`, and `apple-icon/route.tsx`.

`scripts/verify-design-tokens.spec.ts` now covers the four route convention exclusions, the existing root convention exclusion, and a regular `src/components` drift canary.

### TypeScript 型定義

```ts
export interface VerifyDesignTokenDefaults {
  specPath: string
  tokensCssPath: string
  globalsCssPath: string
  includeThemeBridge: boolean
  scanColorLiterals: boolean
  colorLiteralRoots: string[]
  colorLiteralExcludes: readonly RegExp[]
}

export const DEFAULTS: VerifyDesignTokenDefaults

export async function scanForbiddenColorLiterals(
  roots: readonly string[],
  excludes?: readonly RegExp[],
): Promise<TokenDrift[]>
```

### CLIシグネチャ

```bash
mise exec -- pnpm verify:tokens
mise exec -- pnpm vitest run scripts/verify-design-tokens.spec.ts
```

### 使用例

```ts
const drifts = await scanForbiddenColorLiterals(["apps/web/app"])
expect(drifts).toEqual([])
```

```bash
mise exec -- pnpm verify:tokens
```

### エラーハンドリング

`scanForbiddenColorLiterals` は存在しない root を空配列として扱うため、対象ディレクトリがない場合も検査自体は落ちません。
検出対象の HEX が残る場合は `TokenDrift` として `reason: "forbidden-color-literal"` を返し、CLI 側で exit 1 になります。
今回の除外は regex の完全一致に寄せているため、想定外の path は fail closed します。

### エッジケース

`apps/web/app/foo/opengraph-image/route.tsx` は除外されます。
`apps/web/app/_canary_not_og/route.tsx` は除外されず、HEX drift として検出されます。
`apps/web/src/components/Foo.tsx` も除外されず、通常 UI の raw HEX 禁止は維持されます。

### 設定項目と定数一覧

`DEFAULTS.colorLiteralExcludes` が satori 由来の HEX 許容ファイルの単一正本です。
対象は root convention 4 件と route convention 4 件の合計 8 regex です。
`DEFAULTS.colorLiteralRoots` は引き続き `apps/web/app` と `apps/web/src` を走査します。

### テスト構成

既存 C1〜C7 は token JSON / CSS / theme bridge の純粋な同期検証です。
追加 C-EX-1〜C-EX-4 は route handler convention の除外を検証します。
追加 C-EX-5〜C-EX-6 は通常 source drift の検出維持と root convention 除外維持を検証します。

## Part 3: Implementation Steps

1. Keep all `next/og` exception logic in `DEFAULTS.colorLiteralExcludes`.
2. Export the scanner so the existing spec file can test real path matching instead of duplicating regex logic.
3. Remove the previous one-off `/app/opengraph-image.tsx` carve-out because the regex list already covers it.

## Part 4: Verification Commands

The focused verification commands are:

```bash
mise exec -- pnpm vitest run scripts/verify-design-tokens.spec.ts
mise exec -- pnpm verify:tokens
```

Regression canaries temporarily add a HEX literal to `apps/web/src/lib/_drift_canary.ts` and `apps/web/app/_canary_not_og/route.tsx`, confirm `verify:tokens` exits 1, then remove the temporary files.

## Part 5: Evidence

Local evidence is stored in `outputs/phase-11/verify-tokens-local.txt`, `outputs/phase-11/vitest-verify-design-tokens.txt`, `outputs/phase-11/drift-canary-fail.txt`, and `outputs/phase-11/canary-non-og-route.txt`.

GitHub Actions evidence is not captured yet because PR creation and push are explicitly user-gated.

## Part 6: Known Limits

The exception is filename-convention based. If Next.js adds another metadata image convention that also requires literal colors, the verifier should fail closed until the new convention is reviewed and explicitly added.

The implementation does not change `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx`; that file's colors remain justified by the existing satori limitation.

## Part 7: Rollback

Rollback is limited to removing the four route convention regexes, the scanner exports, and the added focused tests.

Rollback would reintroduce the PR #175 false positive for Issue #806's dynamic member OG image route, but it would not affect runtime behavior.

## Part 8: Dependencies

The direct upstream is Issue #806 dynamic member OG image. The policy upstream is the task-18 design-token verifier contract and the OKLch token SSOT.

Same-wave downstream sync updates aiworkflow quick reference, resource map, task workflow active ledger, artifact inventory, and changelog.

## Part 9: User-Gated Work

Commit, push, PR creation, and `gh pr checks` remain pending user approval. Phase 13 records that boundary instead of claiming external CI evidence.

No unassigned task is created because all detected in-cycle improvement points were completed in this cycle.
