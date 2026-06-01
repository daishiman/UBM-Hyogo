# Phase 7 — カバレッジ確認

> **実装区分: 実装仕様書**。本 Phase は **変更したファイル/ブロックに限定**したカバレッジ目標と実測手順を固定する（全体一律目標ではなく対象範囲明示・[Feedback BEFORE-QUIT-002]）。

## 1. カバレッジ対象スコープ（変更範囲限定）

本タスクで変更/新規となるファイルのみを対象とする。未変更ファイルや無関係モジュールは対象外（一律 80% は適用しない）。

| # | ファイル | 種別 | 主な変更ブロック | line 目標 | branch 目標 |
|---|----------|------|------------------|-----------|-------------|
| C-1 | `apps/web/src/lib/admin/image-resize.ts` | 新規 | `buildMemberPhotoVariants`（正常 / Canvas 不可 fallback / convertToBlob 失敗 fallback / hash 計算） | 90% | 85% |
| C-2 | `apps/api/src/routes/admin/members.ts` | 拡張 | `resolvePhotoUrl`（thumb 有/無分岐・presign fail-soft）/ `POST photo`（display+thumb / 旧 `file` 後方互換 / 検証 415・413 / binding 無 503）/ `DELETE`（両 key 削除 best-effort） | 85% | 80% |
| C-3 | `apps/api/src/repository/memberPhotos.ts` | 拡張 | `getMemberPhoto`（4 列 map・null 許容）/ `upsertMemberPhoto`（thumb null / 非 null 両系） | 90% | 85% |
| C-4 | `apps/api/src/lib/r2/member-photo-presign.ts` | 拡張 | `MEMBER_PHOTO_THUMB_OBJECT_KEY` / 定数・型追加（純粋・分岐なし） | 100% | n/a |
| C-5 | `packages/shared`（MemberDetail viewmodel） | 拡張 | `photoThumbUrl` optional の parse（present/absent 双方） | 既存 schema test の追補で網羅 | 既存 |
| C-6 | `apps/web/.../MemberAvatar.tsx` | 拡張 | size 別 src 選択（sm/md→thumb→display / lg→display / 全欠落→placeholder） | 90% | 90% |

> C-4 は分岐を持たない純粋な定数/key builder のため branch 目標は n/a（line 100% のみ）。

## 2. 各変更関数のカバレッジ実測の取り方

### 2.1 `buildMemberPhotoVariants`（C-1・最重要分岐）

測定すべき分岐:

| 分岐 | 入力条件 | 期待 status |
|------|----------|-------------|
| 正常 | jsdom 上で `createImageBitmap` + canvas をモック成功させた File | `client_generated`（display+thumb 両 File / hash 非空） |
| SSR/非対応 fallback | `globalThis.document` を未定義化、または `createImageBitmap` 不在 | `original_fallback`（display=原 File / thumb=null） |
| convertToBlob 失敗 fallback | `convertToBlob` が reject / 例外を投げるモック | `original_fallback`（例外を投げず fallback 値を返すこと＝WEEKGRD-02） |
| hash 計算 | `crypto.subtle.digest` モックで固定 bytes → hex 文字列長 64 | hash 経路を line カバレッジに含める |

> 例外を投げない純粋関数ガード（WEEKGRD-02）の検証として、各 fallback で **throw されないこと** を `await expect(...).resolves` で確認し、branch を両側踏む。

### 2.2 `resolvePhotoUrl` / route（C-2）

| 分岐 | 条件 |
|------|------|
| thumb あり | `photo.thumbObjectKey` 非 null → `photoThumbUrl` が返却に含まれる |
| thumb なし | `thumbObjectKey` null → `photoThumbUrl` 不在（`photoUrl` のみ） |
| presign fail-soft | presign を reject させても detail 200・該当 URL は undefined |
| POST 後方互換 | `display` 不在 + 旧 `file` のみ → display 採用 / `processing_status='original_fallback'` |
| POST 検証 | display が ALLOWED_MIME 外 → 415 / display が 256KB 超 → 413 / thumb が 64KB 超 → 413 |
| binding 無 | `MEMBER_PHOTOS` 未設定 → 503 |
| DELETE 両 key | display+thumb 双方 R2 delete 呼出。thumb delete 失敗でも D1 行削除は完遂（best-effort） |

### 2.3 `upsertMemberPhoto` / `getMemberPhoto`（C-3）

| 分岐 | 条件 |
|------|------|
| upsert thumb 非 null | `processing_status='client_generated'` 行が INSERT OR REPLACE される |
| upsert thumb null | thumb 系 NULL・`processing_status='original_fallback'` |
| get 新列 map | Raw snake_case 4 列 → camelCase へ正しく写像 |
| get null 許容 | 既存行（新列 NULL / `processing_status='none'`）でも `MemberPhotoRow` を返す |

### 2.4 `MemberAvatar`（C-6）

| 分岐 | 条件 |
|------|------|
| sm/md + thumb あり | `src === photoThumbUrl` |
| sm/md + thumb なし | `src === photoUrl`（display へ降格） |
| lg | `src === photoUrl`（thumb があっても display） |
| 全欠落 | `<img>` 不在 or onError → hue placeholder |

## 3. 検証コマンド（対象指定）

```bash
# api 側（route / repository / presign）— 変更ファイルに限定して計測
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --coverage \
  src/routes/admin/__tests__/member-photo.contract.spec.ts \
  src/repository/__tests__/memberPhotos.spec.ts \
  --coverage.include='src/routes/admin/members.ts' \
  --coverage.include='src/repository/memberPhotos.ts' \
  --coverage.include='src/lib/r2/member-photo-presign.ts'

# web 側（image-resize / MemberAvatar）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --coverage \
  src/lib/admin/__tests__/image-resize.spec.ts \
  src/features/admin/components/_members/__tests__/MemberAvatar.spec.tsx \
  --coverage.include='src/lib/admin/image-resize.ts' \
  --coverage.include='src/features/admin/components/_members/MemberAvatar.tsx'

# shared（schema 追補）
mise exec -- pnpm --filter @ubm-hyogo/shared exec vitest run --coverage
```

> `--coverage.include` で対象を絞り、変更ファイルの line/branch を実測する。閾値未達のブロックは Phase 6（テスト実装）へ差し戻し、不足分岐に対応するケースを追加する。テスト命名は `*.spec.{ts,tsx}` のみ（invariant #8）。

## 完了条件（Phase 7）

- [ ] C-1..C-6 の line/branch 目標を変更範囲限定で明示
- [ ] 各変更関数の分岐表（正常/fallback/後方互換）を列挙
- [ ] `--coverage.include` 指定の実測コマンドを記載
- [ ] 出力: [outputs/phase-7/coverage-report.md](outputs/phase-7/coverage-report.md)
