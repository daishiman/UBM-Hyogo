# Phase 7: カバレッジ確認

> **[実装区分: 実装仕様書]**。変更ファイル・変更ブロックに対象を限定してカバレッジを計測し、今サイクルの新規実装が十分に網羅されていることを確認する（FB-BEFORE-QUIT-002 準拠）。

---

## 1. 対象ファイル（今サイクルで新規作成・編集したファイル）

| 区分 | ファイルパス | カバレッジ対象の関心 |
|------|------|------|
| 新規 | `apps/api/migrations/0023_member_photos_source.sql` | DDL テキスト（実行コードなし）→ Phase 11 runtime ops で確認。カバレッジ対象外 |
| 編集 | `apps/api/src/repository/memberPhotos.ts`（source 追加部分） | `getMemberPhoto` の source マップ分岐 / `upsertMemberPhoto` の source 引数 |
| 編集 | `apps/api/src/routes/admin/members.ts`（source 明示部分） | `upsertMemberPhoto(..., source: "admin")` パスが既存 contract test で通ること |
| 編集 | `apps/api/src/routes/me/index.ts`（`POST /me/photo` / `DELETE /me/photo` / `GET /me/profile` photoUrl） | POST の各検証分岐（MIME/size/empty/binding無/未認証/own-id解決）/ DELETE の guard分岐 / photoUrl fail-soft |
| 編集 | `apps/api/src/routes/me/schemas.ts` | `MeProfileResponseZ.photoUrl?` / `MePhotoUploadAcceptedZ` の parse 成功/失敗 |
| 新規 | `apps/web/app/api/me/photo/route.ts` | POST/DELETE の proxy 透過・エラー status 転送 |
| 新規 | `apps/web/src/lib/api/me-photo-client.ts` | `uploadOwnPhoto` / `deleteOwnPhoto` の各 status → code 写像分岐 |
| 新規 | `apps/web/app/(member)/profile/_components/PhotoUpload.client.tsx` | 状態機械（idle→selected→uploading→success/error）/ delete confirm / エラー後再 upload 可能 |

### 対象外（明示）

| ファイルパス | 対象外理由 |
|------|------|
| `apps/api/migrations/0023_member_photos_source.sql` | DDL のみ。Migration run 確認は Phase 11 runtime ops |
| `apps/api/src/routes/me/index.ts`（既存 visibility-request / delete-request ブロック） | 本タスクで変更していない行。カバレッジ変動なし |
| `apps/web/app/(member)/profile/page.tsx`（mount 変更部分） | UI mount の visual 確認は Phase 11。component 本体は `PhotoUpload.client.tsx` 側でカバー |
| `apps/web/src/lib/api/me-types.ts`（`photoUrl?` 追加行） | 型宣言のみ（実行コードなし） |

---

## 2. カバレッジ計測対象と目標

### 2.1 repository 拡張（`apps/api/src/repository/memberPhotos.ts`）

| 計測観点 | 目標 | 根拠 |
|------|------|------|
| line coverage | ≥ 95% | source 追加は CRUD の軽量拡張。null return 分岐のみ注意 |
| branch coverage | ≥ 90% | `getMemberPhoto` の `source` 正規化分岐（`"self"` vs それ以外→`"admin"`）+ null 分岐 |

カバレッジ確認対象の分岐:

```
getMemberPhoto
├── row = null → null（DELETE 前に photo 無し）
├── row.source = "self" → "self"
└── row.source = それ以外（"admin"） → "admin"（正規化）

upsertMemberPhoto
├── source: "admin"（admin route 呼び出し）
└── source: "self"（self-upload 呼び出し）

deleteMemberPhoto
└── DELETE 実行（既存）
```

### 2.2 `/me/photo` POST route（`apps/api/src/routes/me/index.ts` の POST handler 部分）

| 計測観点 | 目標 | 根拠 |
|------|------|------|
| line coverage（POST handler のみ） | ≥ 80% | guard 分岐多数。R2 binding missing (503) は runtime-only |
| branch coverage（POST handler のみ） | ≥ 75% | 全 guard 分岐を Phase 4/6 spec で網羅しているが R2 binding missing は除外許容 |

カバレッジ確認対象の分岐（POST）:

```
POST /me/photo
├── sessionGuard 未認証 → 401（AC-2）
├── requireRulesConsent 未同意 → 403 RULES_CONSENT_REQUIRED（AC-7）
├── rateLimitSelfRequest 超過 → 429（AC-8）
├── formData parse 失敗 → 400
├── file フィールド無し → 400
├── MIME 不正（jpeg/png/webp 以外） → 415（AC-6）
├── byteLength = 0 → 400（空ファイル）
├── byteLength > 256KB → 413（AC-6）
├── MEMBER_PHOTOS binding 無し → 503（runtime-only・除外許容）
└── 正常（own memberId で R2 put + D1 upsert source:"self" + audit） → 200
```

カバレッジ確認対象の分岐（DELETE）:

```
DELETE /me/photo
├── sessionGuard 未認証 → 401
├── getMemberPhoto → null → 404（photo 未登録）
├── MEMBER_PHOTOS binding 無し → 503（runtime-only・除外許容）
└── 正常（R2 delete + D1 delete + audit member.photo_deleted） → 200
```

カバレッジ確認対象の分岐（GET /me/profile の photoUrl 解決）:

```
GET /me/profile — photoUrl 解決分岐
├── presign secret 未設定 → photoUrl 省略（fail-soft）
├── getMemberPhoto → null → photoUrl 省略（photo 未登録）
├── presignMemberPhotoGetUrl → null → photoUrl 省略（presign 失敗）
└── presignMemberPhotoGetUrl → URL → photoUrl 同梱（fail-soft 成功）
```

### 2.3 proxy route（`apps/web/app/api/me/photo/route.ts`）

| 計測観点 | 目標 | 根拠 |
|------|------|------|
| line coverage | ≥ 85% | 小規模 proxy。エラー status 転送分岐のみ |
| branch coverage | ≥ 80% | API Worker への forward 成功 / 各 error status（401/403/413/415/429）の透過 |

カバレッジ確認対象の分岐:

```
POST proxy
├── API Worker 401 → 401 転送
├── API Worker 403 → 403 転送
├── API Worker 413 → 413 転送
├── API Worker 415 → 415 転送
├── API Worker 429 → 429 転送
└── 正常 200 → 200 転送

DELETE proxy
├── API Worker 401 → 401 転送
├── API Worker 404 → 404 転送
└── 正常 200 → 200 転送
```

### 2.4 me-photo-client（`apps/web/src/lib/api/me-photo-client.ts`）

| 計測観点 | 目標 | 根拠 |
|------|------|------|
| line coverage | ≥ 90% | status→code 写像のケース数に対して分岐が直線的 |
| branch coverage | ≥ 85% | 各 status（401/403/413/415/429/404/400）→ PhotoErrorCode 写像 + unknown fallback |

カバレッジ確認対象の分岐:

```
uploadOwnPhoto
├── 415 → UNSUPPORTED_MEDIA_TYPE
├── 413 → FILE_TOO_LARGE
├── 400 → EMPTY_FILE | INVALID_REQUEST
├── 403 → RULES_CONSENT_REQUIRED
├── 429 → RATE_LIMITED
├── 401 → UNAUTHENTICATED
└── その他 → UNKNOWN

deleteOwnPhoto
├── 401 → UNAUTHENTICATED
├── 404 → NOT_FOUND
└── その他 → UNKNOWN
```

### 2.5 PhotoUpload コンポーネント（`apps/web/app/(member)/profile/_components/PhotoUpload.client.tsx`）

| 計測観点 | 目標 | 根拠 |
|------|------|------|
| line coverage | ≥ 85% | 状態遷移のブランチ数は多いが jsdom render で全遷移を網羅可能 |
| branch coverage | ≥ 80% | idle/selected/uploading/success/error + delete confirm/deleting の遷移 + client-side MIME/size 事前チェック分岐 |

カバレッジ確認対象の分岐:

```
PhotoUpload
├── idle: file 未選択 → upload button disabled
├── selected: file 選択（client MIME 不正） → error 表示
├── selected: file 選択（client size 超過） → error 表示
├── selected: file 選択（正常） → upload 可
├── uploading: success → success 状態 + router.refresh()
├── uploading: error → error 状態・再 upload 可能（lock 解放確認）
├── delete confirm: Modal 表示 → キャンセル → idle 維持
└── deleting: success → success + router.refresh()
     └── deleting: error → error 表示・lock 解放確認
```

---

## 3. カバレッジ取得コマンド

### repository source 分岐（unit config 経由）

```bash
mise exec -- pnpm exec vitest run \
  --coverage \
  --coverage.include="apps/api/src/repository/memberPhotos.ts" \
  apps/api/src/repository/__tests__/memberPhotos.source.spec.ts
```

### `/me/photo` route handler（D1 config 経由）

```bash
mise exec -- pnpm exec vitest run \
  --config vitest.d1.config.ts \
  --coverage \
  --coverage.include="apps/api/src/routes/me/index.ts" \
  apps/api/src/routes/me/__tests__/photo.route.spec.ts
```

### proxy route + me-photo-client（unit config 経由）

```bash
mise exec -- pnpm exec vitest run \
  --coverage \
  --coverage.include="apps/web/app/api/me/photo/route.ts" \
  --coverage.include="apps/web/src/lib/api/me-photo-client.ts" \
  apps/web/app/api/me/photo/route.spec.ts
```

### PhotoUpload コンポーネント（unit config 経由）

```bash
mise exec -- pnpm exec vitest run \
  --coverage \
  --coverage.include="apps/web/app/(member)/profile/_components/PhotoUpload.client.tsx" \
  "apps/web/app/(member)/profile/_components/PhotoUpload.client.component.spec.tsx"
```

### 変更ファイル全体まとめて計測（1 コマンド確認用）

```bash
mise exec -- pnpm exec vitest run \
  --coverage \
  --coverage.include="apps/api/src/repository/memberPhotos.ts" \
  --coverage.include="apps/api/src/routes/me/index.ts" \
  --coverage.include="apps/web/app/api/me/photo/route.ts" \
  --coverage.include="apps/web/src/lib/api/me-photo-client.ts" \
  --coverage.include="apps/web/app/(member)/profile/_components/PhotoUpload.client.tsx" \
  apps/api/src/repository/__tests__/memberPhotos.source.spec.ts \
  apps/api/src/routes/me/__tests__/photo.route.spec.ts \
  apps/web/app/api/me/photo/route.spec.ts \
  "apps/web/app/(member)/profile/_components/PhotoUpload.client.component.spec.tsx"
```

出力先: `./coverage/` ディレクトリ（`vitest.config.ts` の `coverage.reportsDirectory` 既定値）。
HTML レポートは `./coverage/index.html` でブラウザ確認可能。

---

## 4. concern × dependency edge の coverage 可視化表

| concern | dependency edge | カバレッジ確認方法 |
|------|------|------|
| own-id 解決（他 member 書き込み拒否） | `sessionGuard` → `c.get("user").memberId` → R2 key / D1 row | `photo.route.spec.ts`：`body/query に異なる memberId を渡しても自分の row のみ変更` |
| MIME/size server 検証 | POST handler → `MEMBER_PHOTO_ALLOWED_MIME` / `MEMBER_PHOTO_MAX_BYTES` | `photo.route.spec.ts`：415/413/400 分岐テスト |
| source roundtrip | `upsertMemberPhoto(source:"self")` → D1 → `getMemberPhoto` → `source:"self"` | `memberPhotos.source.spec.ts` |
| fail-soft photoUrl | `resolveMyPhotoUrl` null → `photoUrl` 省略 | `photo.route.spec.ts`：presign mock null 時の profile レスポンス確認 |
| proxy multipart 透過 | web proxy → API Worker（fetch mock） → multipart body 転送 | `route.spec.ts`：FormData が正しく転送されることを assert |
| エラー後 lock 解放 | `PhotoUpload` try/finally → `submitting=false` | `PhotoUpload.client.component.spec.tsx`：error 後に再 upload ボタンが `disabled` でないことを確認 |
| audit 記録 | POST handler → `auditAction("member.photo_uploaded")` | `photo.route.spec.ts`：audit mock 呼び出し確認 |
| rate limit 適用 | `rateLimitSelfRequest` → 429 | `photo.route.spec.ts`：rate limit mock trigger 時の 429 |

---

## 5. カバレッジ不足時の対応方針

| ケース | 対応 |
|------|------|
| repository branch < 90% | `source` 正規化（`"self"` 以外→`"admin"` フォールバック）のテストケースを追加 |
| `/me/photo` route branch < 75% | R2 binding missing（503）のみ runtime 依存で到達困難。`// coverage: skip R2-binding-missing path` とコメントし許容。それ以外の guard 分岐はテストケースを追加 |
| proxy route branch < 80% | 未確認の error status 写像（409等）があればテストケースを追加 |
| me-photo-client branch < 85% | 各 PhotoErrorCode の網羅状況を確認し、不足分を `uploadOwnPhoto` / `deleteOwnPhoto` の error code テストに追加 |
| PhotoUpload branch < 80% | delete confirm キャンセル遷移 / エラー後 lock 解放を明示テストに追加。`router.refresh` は jest.mock で確認 |

> **coverage gate ポリシー**: 本 workflow ではモノリポ全体の coverage gate（`scripts/coverage-guard.sh`）とは独立して変更ファイル限定で確認する。全体 gate の閾値変更は行わない。

---

## 完了条件（Phase 7）

- [ ] repository (`memberPhotos.ts`) の line coverage ≥ 95%、branch coverage ≥ 90% を実測で確認している（source 正規化分岐を含む）
- [ ] `/me/photo` POST/DELETE handler の line coverage ≥ 80%、branch coverage ≥ 75% を実測で確認している（R2 binding missing 503 パスは除外許容）
- [ ] `GET /me/profile` photoUrl fail-soft 分岐の coverage が確認されている
- [ ] proxy route の line coverage ≥ 85%、branch coverage ≥ 80% を実測で確認している
- [ ] me-photo-client の line coverage ≥ 90%、branch coverage ≥ 85% を実測で確認している
- [ ] PhotoUpload コンポーネントの line coverage ≥ 85%、branch coverage ≥ 80% を実測で確認している（エラー後 lock 解放分岐を含む）
- [ ] カバレッジ不足箇所がある場合、対応方針（§5）に従って補完済み、または除外理由を記録済みである
- [ ] `pnpm exec vitest run`（全 unit）が PASS している
- [ ] `pnpm exec vitest run --config vitest.d1.config.ts`（全 D1 contract）が PASS している

## メタ情報
workflow_state: `implemented_local_runtime_pending` / taskType: `implementation` / visualEvidence: `VISUAL`

## 目的
変更ファイル限定で主要分岐の coverage を確認し、重要な fail-soft・lock 解放・source 区別・own-id 解決の未検証分岐をなくす。

## 実行タスク
- repository / me route / proxy / client / component の coverage を測定する。
- 未達分岐を同一サイクルで補う。

## 参照資料
- `phase-6.md`

## 成果物
- Phase 7 coverage 確認仕様

## 統合テスト連携
Phase 9 の品質ゲートは本 Phase の coverage 結果を前提にする。
