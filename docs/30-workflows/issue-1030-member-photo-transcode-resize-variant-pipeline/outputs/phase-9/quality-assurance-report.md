# 品質保証計画 — issue-1030

## 一括 PASS 基準

| ID | 判定軸 | PASS 基準 |
| --- | --- | --- |
| Q-1 | typecheck | workspace typecheck が成功し、variant 型 / `photoThumbUrl?` が解決 |
| Q-2 | lint | browser guard、import、環境変数直参照、HEX 直書きに違反なし |
| Q-3 | api test | route contract / repository spec が pass |
| Q-4 | web test | image-resize / MemberAvatar spec が pass |
| Q-5 | shared test | `photoThumbUrl?` present/absent が parse 成功 |
| Q-6 | live import | `image-resize.ts` が `PhotoUploadAffordance` から実参照される |
| Q-7 | key compatibility | `members/{memberId}/avatar` を display canonical として維持 |
| Q-8 | migration compatibility | 0023 は ADD COLUMN のみ、既存行非破壊 |
| Q-9 | test naming | 新規テストは `*.spec.{ts,tsx}` のみ |
| Q-10 | design token | 既存 `Avatar` primitive 流用、色直書きなし |
| Q-11 | D1/R2 boundary | `apps/web` から D1/R2 binding 直接参照なし |
| Q-12 | env accessor | `image-resize.ts` は env 非依存、`process.env` なし |

## 実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run
mise exec -- pnpm --filter @ubm-hyogo/shared exec vitest run
```

## 完了判定

本ファイルは root [phase-9.md](../../phase-9.md) の出力実体。実装 wave では Q-1..Q-12 の実測結果を Phase 11/12 evidence に接続する。
