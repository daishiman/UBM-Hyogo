# カバレッジ計画 — issue-1030

## 対象範囲

全体一律ではなく、変更ファイルと変更ブロックに限定して測定する。

| 対象 | line 目標 | branch 目標 | 重点分岐 |
| --- | --- | --- | --- |
| `apps/web/src/lib/admin/image-resize.ts` | 90% | 85% | 正常 / SSR fallback / encode failure / hash |
| `apps/api/src/routes/admin/members.ts` | 85% | 80% | thumb 有無 / presign fail-soft / 旧 `file` / validation / DELETE best-effort |
| `apps/api/src/repository/memberPhotos.ts` | 90% | 85% | thumb null / non-null / snake_case map / 旧行 |
| `apps/api/src/lib/r2/member-photo-presign.ts` | 100% | n/a | thumb key builder と定数 |
| `packages/shared` viewmodel | schema test で網羅 | 既存 | `photoThumbUrl?` present/absent |
| `MemberAvatar.tsx` | 90% | 90% | sm/md thumb 優先、lg display、全欠落 |

## 実測コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --coverage \
  src/routes/admin/__tests__/member-photo.contract.spec.ts \
  src/repository/__tests__/memberPhotos.spec.ts \
  --coverage.include='src/routes/admin/members.ts' \
  --coverage.include='src/repository/memberPhotos.ts' \
  --coverage.include='src/lib/r2/member-photo-presign.ts'

mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --coverage \
  src/lib/admin/__tests__/image-resize.spec.ts \
  src/features/admin/components/_members/__tests__/MemberAvatar.spec.tsx \
  --coverage.include='src/lib/admin/image-resize.ts' \
  --coverage.include='src/features/admin/components/_members/MemberAvatar.tsx'

mise exec -- pnpm --filter @ubm-hyogo/shared exec vitest run --coverage
```

## 完了判定

本ファイルは root [phase-7.md](../../phase-7.md) の出力実体。実装 wave で閾値未達の場合は Phase 6 に差し戻し、不足分岐に対応する spec を追加する。
