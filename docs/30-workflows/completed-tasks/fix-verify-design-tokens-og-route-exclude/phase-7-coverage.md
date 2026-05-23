[実装区分: 実装仕様書]

# Phase 7 — カバレッジ

## 1. 本タスクの coverage 影響範囲

本タスクは **`scripts/` 配下の build / CI script の修正**（`scripts/verify-design-tokens.ts`）であり、以下の通り production runtime には一切影響しない。

| 領域 | 影響 |
|------|------|
| `apps/web/**` runtime | なし（`apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` のコードは変更しない） |
| `apps/api/**` runtime | なし |
| `apps/web` Vitest coverage | なし |
| `apps/api` Vitest coverage | なし |
| `scripts/` の Vitest coverage | drift script 自体は behavior unit test (`scripts/verify-design-tokens.spec.ts` C-EX-1〜C-EX-6) で検証 |

## 2. coverage gate への影響

- `pnpm test:coverage`（apps/web / apps/api）の threshold は **変更しない**。
- `scripts/` 配下は既存の coverage 集計対象外（`vitest.config.*` の include を変更しない）。
- 既存 coverage gate のスレッショルドを下げる変更は本タスクで行わない。

## 3. drift script の behavior verification 方針

drift script は CI gate 用 utility であり、production code path とは異なる扱い:

- 振る舞いの正しさは Phase 6 で追加した unit test (C-EX-1〜C-EX-6) で担保する。
- 行カバレッジ数値そのものは coverage report に含めない（既存方針踏襲）。
- regression は GitHub Actions `verify-design-tokens` workflow が end-to-end で実ファイル走査により検出する。

## 4. 受け入れ基準

- 既存 `pnpm test:coverage`（apps/web / apps/api）の threshold が変更されていないこと。
- 既存 coverage が低下していないこと（本タスクの変更は scripts/ のみのため、原理的に低下しない）。
- Phase 6 追加 unit test 6 件すべて pass。
- GitHub Actions `verify-design-tokens` workflow green。

## 5. 実行コマンド（任意確認）

```bash
# coverage threshold が変更されていないことの確認（diff 確認）
git diff dev...HEAD -- 'apps/web/vitest.config.*' 'apps/api/vitest.config.*'
# 期待: 出力なし

# 既存 coverage が回ること（必要なら）
mise exec -- pnpm --filter @ubm/web test:coverage
mise exec -- pnpm --filter @ubm/api test:coverage
```
