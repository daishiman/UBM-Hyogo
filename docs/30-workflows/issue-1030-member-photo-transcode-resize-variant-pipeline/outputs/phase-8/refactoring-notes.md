# リファクタリング記録 — issue-1030

## 対象と意図

| ID | 対象 | Before | After | 理由 |
| --- | --- | --- | --- | --- |
| R-1 | presign fail-soft | display / thumb で try/catch 重複 | `presignVariantUrl()` に集約 | 片側だけ挙動が変わる drift を防ぐ |
| R-2 | R2 put | display / thumb で put 手順を重複 | `putVariant()` に集約 | validation 後の副作用順序を一貫化 |
| R-3 | R2 delete | display のみから thumb 分岐追加 | `deleteVariant()` best-effort | orphan 防止と 500 巻き込み回避 |
| R-4 | resize 寸法計算 | display/thumb の式が分散 | `computeTargetSize()` / `computeCoverSize()` | 丸め規則を単一化 |
| R-5 | WebP encode | canvas encode が重複 | `canvasToWebpFile()` | null fallback を一箇所に集約 |
| R-6 | variant 定数 | key / byte / status が散在し得る | `member-photo-presign.ts` を正本 | magic number drift 防止 |
| R-7 | avatar src | JSX 内に size 条件が散在し得る | `resolveAvatarSrc()` | size 別選択を単体テスト可能にする |

## 公開契約不変

- `buildMemberPhotoVariants(file): Promise<ResizedVariants>`
- `MEMBER_PHOTO_OBJECT_KEY(memberId)` の display key
- `POST/GET/DELETE /admin/members/:memberId/photo`
- `MemberPhotoRow` / `getMemberPhoto` / `upsertMemberPhoto`
- `photoUrl?` は維持し、`photoThumbUrl?` は optional 追加のみ

## 完了判定

本ファイルは root [phase-8.md](../../phase-8.md) の出力実体。実装 wave では helper 抽出後も公開 signature と route/schema contract が変わらないことを typecheck と focused tests で確認する。
