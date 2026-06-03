# Phase 8 — リファクタリング

> **実装区分: 実装仕様書**。本 Phase は duplicate / navigation drift の削減対象を **対象 / Before / After / 理由** で固定する（[Feedback RT-03]）。**公開インターフェース（関数シグネチャ・variant key・route 契約・schema）は不変**に保つ。

## 1. リファクタリング対象テーブル

| # | 対象 | Before | After | 理由 |
|---|------|--------|-------|------|
| R-1 | presign 呼び出し（route `resolvePhotoUrl`） | display と thumb で `presignMemberPhotoGetUrl` を別々にインライン呼出（try/catch 重複） | `presignVariantUrl(env, key): Promise<string \| undefined>` ローカル helper に集約し display/thumb から共用（fail-soft の握り潰しも 1 箇所） | duplicate な try/catch fail-soft の二重化を排除。presign 仕様変更時の改修点を 1 箇所に |
| R-2 | R2 put（POST photo） | display put と thumb put でバケット取得・put・例外処理を 2 度記述 | `putVariant(bucket, key, file)` helper にまとめ、display は必須・thumb は条件付きで同 helper を再利用 | navigation drift（put 手順の片方だけ更新される）を防止。binding 取得は呼出前に 1 度 |
| R-3 | R2 delete（DELETE） | display delete のみ存在（thumb 追加で 2 行に分岐しがち） | `deleteVariant(bucket, key)` を best-effort（個別 catch）で display/thumb に適用 | orphan 防止ロジックの一貫化。thumb delete 失敗が display delete・D1 行削除を巻き込まない |
| R-4 | image-resize の長辺計算 | display(512) と thumb(96 cover) で縮小寸法計算をインライン重複 | `computeTargetSize(w, h, longEdge): {w,h}` / `computeCoverSize(w, h, edge): {sx,sy,sw,sh,dw,dh}` を private helper に抽出 | 縮小アルゴリズムの式重複を排除。display/thumb で同一の丸め規則を保証 |
| R-5 | webp エンコード | display/thumb で `convertToBlob({type,quality})` → `File` 化を 2 度記述 | `canvasToWebpFile(canvas, name): Promise<File \| null>` に集約（失敗時 null 返却） | エンコード失敗時の null fallback 経路を一本化（WEEKGRD-02 と整合） |
| R-6 | variant 定数の散在 | key/byte 上限/MIME がファイル横断で参照される | すべて `member-photo-presign.ts` に集約（`MEMBER_PHOTO_THUMB_OBJECT_KEY` / `MEMBER_PHOTO_THUMB_MAX_BYTES` / `MemberPhotoVariant` / `MemberPhotoProcessingStatus`）。route・repository・web は import 参照のみ | マジックナンバー直書き禁止。variant 仕様の単一正本化（navigation drift 防止） |
| R-7 | MemberAvatar の src 選択 | size 判定と src フォールバックが JSX 内に分散しがち | `resolveAvatarSrc(size, photoThumbUrl, photoUrl): string \| undefined` 純粋 helper に抽出 | sm/md→thumb→display / lg→display のルールを 1 関数で単体テスト可能に |

## 2. インターフェース不変の保証

リファクタリングはいずれも **内部 helper 抽出のみ**で、以下の公開契約を変更しない:

| 公開面 | 不変であること |
|--------|----------------|
| `buildMemberPhotoVariants(file): Promise<ResizedVariants>` | シグネチャ・返却型・status enum 値を維持 |
| `MEMBER_PHOTO_THUMB_OBJECT_KEY(memberId)` / 既存 `MEMBER_PHOTO_OBJECT_KEY` | key 文字列を変更しない（後方互換の要） |
| route `POST/GET/DELETE /members/:memberId/photo` | request/response shape（`display`/`thumb`/`contentHash`・`photoUrl`/`photoThumbUrl`）を維持 |
| `MemberPhotoRow` / `getMemberPhoto` / `upsertMemberPhoto` | 列・引数・返却を維持（helper は private） |
| MemberDetail viewmodel zod | `photoThumbUrl?` の追加のみ。既存 field を破壊しない |

> R-1..R-7 はすべて関数内/ファイル内の private helper 抽出。export 面は増やさない（`resolveAvatarSrc` 等は module-private + テスト用 export は最小限）。抽出後も Phase 7 の `--coverage.include` 対象は同一ファイルのため計測単位は変わらない。

## 3. リファクタリング順序と検証

1. R-6（定数集約）→ 他 helper が参照するため最初。
2. R-4/R-5（image-resize helper）→ R-1/R-2/R-3（route helper）→ R-7（avatar helper）。
3. 各ステップ後に `pnpm typecheck` でシグネチャ不変を確認、`vitest run`（変更ファイル）で挙動不変を確認。

## 完了条件（Phase 8）

- [ ] R-1..R-7 を 対象/Before/After/理由 テーブルで固定
- [ ] 公開インターフェース不変表を明示
- [ ] リファクタ順序と検証手順を記載
- [ ] 出力: [outputs/phase-8/refactoring-notes.md](outputs/phase-8/refactoring-notes.md)
