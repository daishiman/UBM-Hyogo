# Phase 9 — 品質保証

> **実装区分: 実装仕様書**。本 Phase は typecheck / lint / test / 後方互換 / gate の **一括 PASS 基準**を固定する。

## 1. 一括検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api  exec vitest run
mise exec -- pnpm --filter @ubm-hyogo/web  exec vitest run
mise exec -- pnpm --filter @ubm-hyogo/shared exec vitest run
```

## 2. PASS 基準（すべて満たすこと）

| # | 判定軸 | PASS 基準 | 検証手段 |
|---|--------|-----------|----------|
| Q-1 | typecheck | 6 package すべて exit 0。`MemberPhotoRow` 新列 / `ResizedVariants` / `photoThumbUrl?` / `MemberPhotoVariant` 型が解決 | `pnpm typecheck` |
| Q-2 | lint | exit 0。`no-restricted-globals`（`document`/`crypto` は browser ガード経由）/ import 順序違反なし | `pnpm lint`（必要時 `--fix` 後の残違反 0） |
| Q-3 | api test | route contract / repository spec が全 pass。後方互換ケース（旧 `file` upload）含む | api vitest run |
| Q-4 | web test | `image-resize.spec.ts` / `MemberAvatar.spec.tsx` 全 pass。fallback 3 ケース緑 | web vitest run |
| Q-5 | shared test | MemberDetail viewmodel に `photoThumbUrl` present/absent 双方が parse 成功 | shared vitest run |
| Q-6 | 新規ファイル live import | `apps/web/src/lib/admin/image-resize.ts` が `MemberDrawer.tsx`（`PhotoUploadAffordance`）から実際に import・呼出され、dead code でない | `grep -rn "image-resize" apps/web/src` で参照 ≥1 / import 解決を typecheck で確認 |
| Q-7 | 後方互換回帰（key） | 既存 key `members/{memberId}/avatar`（display）の文字列を変更していない。thumb key は別セグメント | `grep -n "members/\${memberId}/avatar" apps/api/src/lib/r2/member-photo-presign.ts`（既存定数が残存） |
| Q-8 | 後方互換回帰（行） | migration 0023 は ADD COLUMN のみ。0022 既存行を破壊しない。`processing_status` は `NOT NULL DEFAULT 'none'` で既存行整合 | migration ファイル目視 + `bash scripts/cf.sh d1 migrations list`（apply は user-gated） |
| Q-9 | test 命名 gate（invariant #8） | 新規テストは `*.spec.{ts,tsx}` のみ。`*.test.{ts,tsx}` 不在 | `git ls-files '*.test.ts' '*.test.tsx'` が空 / lefthook `block-test-suffix` 緑 |
| Q-10 | design-token gate | UI 追加は既存 `Avatar` primitive 流用のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 追加なし | `verify-design-tokens`（task-18 gate）/ `grep -rn "#\[0-9a-fA-F]\{3,6\}" apps/web/src/features/admin/components/_members/MemberAvatar.tsx` が新規 0 |
| Q-11 | D1/R2 境界（invariant #5） | `apps/web` から R2/D1 binding 直接アクセスなし。variant 生成→multipart 送信のみ | `grep -rn "MEMBER_PHOTOS\|D1Database\|R2Bucket" apps/web/src` が 0 |
| Q-12 | env アクセサ | `apps/web` の env 参照は `lib/env.ts` アクセサ経由。`process.env` 直参照なし（image-resize は env 非依存・client 純粋関数） | `grep -n "process.env" apps/web/src/lib/admin/image-resize.ts` が 0 |

## 3. 後方互換の重点回帰

| ケース | 期待 |
|--------|------|
| 旧 client（`file` 単一フィールド）upload | 200 / display 保存 / `processing_status='original_fallback'` / thumb null |
| 既存 row（新列 NULL）の GET detail | 200 / `photoUrl` あり / `photoThumbUrl` 不在 |
| Canvas 不可ブラウザ | `original_fallback` で display=原 File 送信・破壊なし |
| thumb delete 失敗 | display delete + D1 行削除は完遂（best-effort） |

## 4. 失敗時の差し戻し

- Q-1/Q-2 失敗 → 最小差分修正（unused import / 型注釈 / browser ガード追加）後に再実行。
- Q-3..Q-5 失敗 → Phase 6（テスト）/ Phase 7（カバレッジ）へ差し戻し不足ケース追加。
- Q-7/Q-8 失敗 → 後方互換違反として実装を是正（key・migration を非破壊に戻す）。

## 完了条件（Phase 9）

- [ ] Q-1..Q-12 の PASS 基準を列挙
- [ ] 新規ファイル live import / 後方互換回帰 / 命名 gate / design-token gate を明示
- [ ] 出力: [outputs/phase-9/quality-assurance-report.md](outputs/phase-9/quality-assurance-report.md)
