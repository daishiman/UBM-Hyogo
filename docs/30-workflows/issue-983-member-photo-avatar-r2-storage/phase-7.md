# Phase 7: カバレッジ確認

> **[実装区分: 実装仕様書]**。変更ファイル・変更ブロックに対象を限定してカバレッジを計測し、今サイクルの新規実装が十分に網羅されていることを確認する（FB-BEFORE-QUIT-002 準拠）。

---

## 1. 対象ファイル（今サイクルで新規作成・編集したファイル）

| 区分 | ファイルパス | カバレッジ対象の関心 |
|---|---|---|
| 新規 | `apps/api/src/lib/r2/member-photo-presign.ts` | presign util 全分岐（deps 不正 / TTL ≤0 / 正常 / aws4fetch throw） |
| 新規 | `apps/api/src/repository/memberPhotos.ts` | `getMemberPhoto` / `upsertMemberPhoto` / `deleteMemberPhoto` の全パス |
| 編集 | `apps/api/src/routes/admin/members.ts`（photo endpoints 部分） | POST/DELETE photo handler・detail photoUrl 解決分岐 |
| 編集 | `apps/web/src/components/ui/Avatar.tsx` | `src` 有/無・`imgFailed` true/false の 4 分岐 |
| 編集 | `apps/web/src/features/admin/components/_members/MemberAvatar.tsx` | `photoUrl` 有/無の 2 分岐 |
| 編集 | `packages/shared/src/zod/viewmodel.ts`（`AdminMemberDetailViewZ` の `photoUrl` 追加行） | parse 成功/失敗（shared の schema 行単体は軽量で全パス unit で到達済み） |

### 対象外（明示）

| ファイルパス | 対象外理由 |
|---|---|
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | UI コンポーネント全体。affordance 部分は Phase 11 の手動 visual で確認。E2E Playwright は Phase 9 対象 |
| `apps/api/migrations/0022_member_photos.sql` | DDL は SQL テキスト。Migration run 確認は Phase 11 runtime ops |
| `apps/api/src/env.ts` | 型宣言のみ（実行コードなし）。型は typecheck で確認済み |
| `apps/api/wrangler.toml` | 設定ファイル（実行コードなし） |
| `packages/shared/src/types/viewmodel/index.ts` | TypeScript interface 宣言のみ（実行コードなし） |

---

## 2. カバレッジ計測対象と目標

### 2.1 presign util（`apps/api/src/lib/r2/member-photo-presign.ts`）

| 計測観点 | 目標 | 根拠 |
|---|---|---|
| line coverage | ≥ 90% | fail-soft 分岐（deps 不正 / TTL ≤0 / throw catch）を含む小規模ファイル |
| branch coverage | ≥ 85% | deps 各フィールド空チェック × TTL チェック × try/catch の分岐数が多い |

カバレッジ確認対象の分岐:

```
presignMemberPhotoGetUrl
├── accountId 空 → null（PRESIGN-U-5）
├── accessKeyId 空 → null（PRESIGN-U-6）
├── secretAccessKey 空 → (PRESIGN-U-7 類似の未設定パスは PRESIGN-E-1 で網羅）
├── ttlSeconds <= 0 → null（PRESIGN-U-8 / PRESIGN-E-2）
├── objectKey 空 → null（PRESIGN-E-3）
├── aws4fetch throw → null（PRESIGN-U-7）
└── 正常 → URL 文字列（PRESIGN-U-1〜U-4）
```

### 2.2 memberPhotos repository（`apps/api/src/repository/memberPhotos.ts`）

| 計測観点 | 目標 | 根拠 |
|---|---|---|
| line coverage | ≥ 95% | 分岐が少ない CRUD。null return 分岐のみ注意 |
| branch coverage | ≥ 90% | `getMemberPhoto` の `if (!row) return null` と正常 return の 2 分岐が主 |

カバレッジ確認対象の分岐:

```
getMemberPhoto
├── row = null → null（ROUTE-C-9: photo なし）
└── row 有 → MemberPhotoRow（ROUTE-C-1 / ROUTE-C-8）

upsertMemberPhoto
└── INSERT OR REPLACE 実行（ROUTE-C-1 / ROUTE-E-3）

deleteMemberPhoto
└── DELETE 実行（ROUTE-C-6）
```

### 2.3 route handler（photo 部分、`apps/api/src/routes/admin/members.ts`）

| 計測観点 | 目標 | 根拠 |
|---|---|---|
| line coverage（photo handler のみ） | ≥ 80% | DB binding missing / member not found / MIME / サイズ / R2 binding の guard 分岐 |
| branch coverage（photo handler のみ） | ≥ 75% | 全 guard 分岐を Phase 4/6 spec で網羅しているが、R2 binding missing（503 path）は runtime-only のためモック難 |

カバレッジ確認対象の分岐（POST）:

```
POST /admin/members/:memberId/photo
├── DB binding missing → 503
├── member not found → 404（ROUTE-C-4）
├── formData parse 失敗 → 400
├── file なし → 400
├── MIME 不正 → 415（ROUTE-C-3）
├── byteLength = 0 → 400（ROUTE-E-9）
├── byteLength > 256KB → 413（ROUTE-C-2 / ROUTE-E-12）
├── R2 binding missing → 503
└── 正常 → 200（ROUTE-C-1 / ROUTE-C-5 / ROUTE-E-10 / ROUTE-E-11）
```

カバレッジ確認対象の分岐（GET detail の photoUrl 解決）:

```
GET /admin/members/:memberId — photoUrl 解決分岐
├── secret 未設定 → photoUrl 省略（ROUTE-E-1）
├── photo row なし → photoUrl 省略（ROUTE-C-9）
├── presign → null → photoUrl 省略（ROUTE-C-10 / ROUTE-E-2）
└── presign → URL → photoUrl 同梱（ROUTE-C-8）
```

### 2.4 Avatar コンポーネント（`apps/web/src/components/ui/Avatar.tsx`）

| 計測観点 | 目標 | 根拠 |
|---|---|---|
| line coverage | ≥ 90% | jsdom render で 4 分岐全てを AVATAR-R-1〜R-4 + AVATAR-E-1〜E-2 で通過 |
| branch coverage | ≥ 85% | `if (src && !imgFailed)` の 4 ケース（src なし / src あり / src+failed） |

カバレッジ確認対象の分岐:

```
Avatar
├── src 無し → hue div（AVATAR-R-1）
├── src 有り・imgFailed=false → img + hue div 背面（AVATAR-R-2）
├── src 有り・onError → imgFailed=true → hue div（AVATAR-R-3）
└── src=undefined（明示 undefined） → hue div（AVATAR-R-4）
```

---

## 3. カバレッジ取得コマンド

### presign util + repository（unit config 経由）

```bash
# 新規ファイルのみを coverage include 対象に絞って計測
mise exec -- pnpm exec vitest run \
  --coverage \
  --coverage.include="apps/api/src/lib/r2/member-photo-presign.ts" \
  --coverage.include="apps/api/src/repository/memberPhotos.ts" \
  apps/api/src/lib/r2/__tests__/member-photo-presign.spec.ts
```

### route handler（D1 config 経由）

```bash
mise exec -- pnpm exec vitest run \
  --config vitest.d1.config.ts \
  --coverage \
  --coverage.include="apps/api/src/routes/admin/members.ts" \
  apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts
```

### Avatar コンポーネント（unit config 経由）

```bash
mise exec -- pnpm exec vitest run \
  --coverage \
  --coverage.include="apps/web/src/components/ui/Avatar.tsx" \
  --coverage.include="apps/web/src/features/admin/components/_members/MemberAvatar.tsx" \
  apps/web/src/features/admin/components/_members/__tests__/MemberAvatar.spec.tsx
```

### 変更ファイル全体まとめて計測（1 コマンド確認用）

```bash
# unit config（presign / Avatar / shared schema）
mise exec -- pnpm exec vitest run \
  --coverage \
  --coverage.include="apps/api/src/lib/r2/member-photo-presign.ts" \
  --coverage.include="apps/api/src/repository/memberPhotos.ts" \
  --coverage.include="apps/web/src/components/ui/Avatar.tsx" \
  --coverage.include="apps/web/src/features/admin/components/_members/MemberAvatar.tsx" \
  apps/api/src/lib/r2/__tests__/member-photo-presign.spec.ts \
  packages/shared/src/zod/__tests__/viewmodel-photo.spec.ts \
  apps/web/src/features/admin/components/_members/__tests__/MemberAvatar.spec.tsx
```

出力先: `./coverage/` ディレクトリ（`vitest.config.ts` の `coverage.reportsDirectory` 既定値）。
HTML レポートは `./coverage/index.html` でブラウザ確認可能。

---

## 4. カバレッジ不足時の対応方針

| ケース | 対応 |
|---|---|
| presign util branch < 85% | deps の各フィールド空チェックを個別テストケースで補完（PRESIGN-U-5/U-6 相当の variant を secret key にも追加） |
| repository branch < 90% | `getMemberPhoto` が null を返すパスをテストケースに明示追加（ROUTE-C-9 が既にカバーしているはずだが確認） |
| route handler branch < 75% | R2 binding missing（503）のみ runtime 依存で到達困難。comment で `// coverage: skip R2-binding-missing path` と明記し許容する |
| Avatar branch < 85% | `imgFailed` state 遷移を `fireEvent.error` で確実にトリガーしているか確認。`act()` ラップが必要な場合は追加 |

> **coverage gate ポリシー**: 本 workflow ではモノリポ全体の coverage gate（`scripts/coverage-guard.sh`）とは独立して変更ファイル限定で確認する。全体 gate の閾値変更は行わない。

---

## 完了条件（Phase 7）

- [ ] presign util の line coverage ≥ 90%、branch coverage ≥ 85% を実測で確認している
- [ ] memberPhotos repository の line coverage ≥ 95%、branch coverage ≥ 90% を実測で確認している
- [ ] route handler（photo endpoints + photoUrl 解決分岐）の line coverage ≥ 80%、branch coverage ≥ 75% を実測で確認している（R2 binding missing 503 パスは除外許容）
- [ ] Avatar コンポーネントの line coverage ≥ 90%、branch coverage ≥ 85% を実測で確認している
- [ ] カバレッジ不足箇所がある場合、対応方針（§4）に従って補完済み、または除外理由を記録済みである
- [ ] `pnpm exec vitest run`（全 unit）が PASS している
- [ ] `pnpm exec vitest run --config vitest.d1.config.ts`（全 D1 contract）が PASS している

## メタ情報
workflow_state: `spec_created` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
主要分岐の coverage を確認し、重要な fail-soft と fallback 分岐の未検証をなくす。

## 実行タスク
- presign、route、schema、avatar の coverage を測定する。
- 未達分岐を同一サイクルで補う。

## 参照資料
- `phase-6.md`

## 成果物
- Phase 7 coverage 確認仕様

## 統合テスト連携
Phase 9 の品質ゲートは本 Phase の coverage 結果を前提にする。
