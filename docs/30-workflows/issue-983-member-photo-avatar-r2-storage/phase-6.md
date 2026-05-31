# Phase 6: テスト拡充

> **[実装区分: 実装仕様書]**。Phase 5 の GREEN 達成後に fail path・回帰ガード・補助ケースを追加し、仕様の網羅性を高める。

---

## 1. 追加対象ファイルと追加ケース概要

| ファイルパス | 追加目的 |
|---|---|
| `apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts` | fail path / 回帰 / audit actor 検証 / 重複 upload 上書き / 削除後 GET |
| `apps/api/src/lib/r2/__tests__/member-photo-presign.spec.ts` | presign null 時 detail 維持の独立確認 |
| `packages/shared/src/zod/__tests__/viewmodel-photo.spec.ts` | `.strict()` 回帰（未知フィールド reject）の追加確認 |

---

## 2. route contract — fail path / 回帰 追加ケース

以下を `member-photo.contract.spec.ts` に追記する。

### 2.1 presign null 時 detail 200 維持（fail-soft 回帰）

| ID | テスト名 | セットアップ | 期待 |
|---|---|---|---|
| ROUTE-E-1 | photo row あり・presign secret 未設定 → detail 200、photoUrl 無し | D1 に photo row あり。env の `R2_ACCOUNT_ID` = undefined（未設定状態） | レスポンスが `200` かつ `body.photoUrl === undefined` |
| ROUTE-E-2 | photo row あり・presign util が throw → detail 200、photoUrl 無し | `presignMemberPhotoGetUrl` を `vi.fn().mockResolvedValueOnce(null)` で null 強制 | レスポンスが `200` かつ `body.photoUrl === undefined` |

### 2.2 重複 upload による上書き確認

| ID | テスト名 | セットアップ | 期待 |
|---|---|---|---|
| ROUTE-E-3 | 同じ memberId で 2 回 POST → 最後のデータで上書き | 1 回目 JPEG 10KB、2 回目 PNG 20KB を同じ memberId に POST | D1 `member_photos` の `content_type` が `image/png`、`byte_size` が 20480（2 回目の値） |
| ROUTE-E-4 | 重複 upload 後の R2 object key が同一 | 上記 ROUTE-E-3 後 | R2 に `members/{memberId}/avatar` が 1 object のみ存在（削除→再作成ではなく上書き） |

### 2.3 削除後 GET で photoUrl が存在しないことの確認

| ID | テスト名 | セットアップ | 期待 |
|---|---|---|---|
| ROUTE-E-5 | photo を DELETE 後の GET detail → photoUrl 無し | POST で photo 登録 → DELETE → GET detail | `200` かつ `body.photoUrl === undefined` |
| ROUTE-E-6 | photo を DELETE 後の GET detail → 既存フィールドは正常 | 上記と同じセットアップ | `body.identityMemberId` / `body.status` / `body.profile` が正常に返る（detail 全体が壊れていない） |

### 2.4 audit 記録の actor / action 検証

| ID | テスト名 | セットアップ | 期待 |
|---|---|---|---|
| ROUTE-E-7 | POST photo → audit action = `admin.member.photo_uploaded`、actor が admin email | admin token で POST | D1 `audit_log` の `action = 'admin.member.photo_uploaded'` かつ `actor_email` が admin email の文字列に一致 |
| ROUTE-E-8 | DELETE photo → audit action = `admin.member.photo_deleted` | admin token で DELETE | D1 `audit_log` の `action = 'admin.member.photo_deleted'` かつ `target_id` が memberId |

### 2.5 サイズ境界の falsy / 0 バイト path

Phase 4 で列挙した境界パターンのうち以下を実際の spec ケースとして追記する（ROUTE-C-2 の補完）。

| ID | バイト数 | 期待ステータス |
|---|---|---|
| ROUTE-E-9 | 0 バイト | 400 |
| ROUTE-E-10 | 1 バイト（最小許容） | 200 |
| ROUTE-E-11 | 262144 バイト（256KB ちょうど） | 200 |
| ROUTE-E-12 | 262145 バイト（1 バイト超過） | 413 |

---

## 3. presign unit — presign null 補助ケース

`member-photo-presign.spec.ts` に追記する。

| ID | テスト名 | 期待 |
|---|---|---|
| PRESIGN-E-1 | `presignMemberPhotoGetUrl` が null を返しても例外が上位に伝播しない | `await presignMemberPhotoGetUrl({accountId:"",…}, …, 300)` が `null` を return し `throw` しない |
| PRESIGN-E-2 | TTL 負数 → null | `ttlSeconds: -1` → `null` |
| PRESIGN-E-3 | `objectKey` が空文字 → null（バリデーション境界） | `objectKey: ""` → `null` |

---

## 4. shared schema — `.strict()` 回帰確認

`viewmodel-photo.spec.ts` に追記する（Phase 4 の SCHEMA-P-5 が pass していれば既に網羅されているが、明示的な回帰 label として追加）。

| ID | テスト名 | 入力 | 期待 |
|---|---|---|---|
| SCHEMA-E-1 | `adminNote` 未知フィールドで strict reject（`.strict()` 回帰） | 合法オブジェクト + `adminNote: "x"` | `safeParse` が `success: false`、`error.issues[0].code === "unrecognized_keys"` |
| SCHEMA-E-2 | `photoUrl` と未知フィールドの同時存在でも strict reject | 合法オブジェクト + `photoUrl: "https://r2.test/p.jpg"` + `extra: 1` | `success: false` |
| SCHEMA-E-3 | `photoUrl` は `string` url のみ許容、`number` は reject | `photoUrl: 12345` | `success: false` |

---

## 5. Avatar/MemberAvatar — 追加回帰ケース

`MemberAvatar.spec.tsx` に追記する。

| ID | テスト名 | 条件 | 期待 |
|---|---|---|---|
| AVATAR-E-1 | src あり → `data-hue` 属性が維持される | `<Avatar name="田中" src="…" />` | `role="img"` の div に `data-hue` 属性が存在する |
| AVATAR-E-2 | src onError → fallback div に `data-size` 属性が維持される | AVATAR-R-3 と同じ条件で `fireEvent.error(img)` | fallback div に `data-size="md"` が存在する |
| AVATAR-E-3 | MemberAvatar photoUrl 無し → `<img>` が DOM に存在しない | `<MemberAvatar memberId="m_001" fullName="田中" />` | `document.querySelector("img")` が `null` |
| AVATAR-E-4 | MemberAvatar に `size="lg"` が反映される | `<MemberAvatar memberId="m_001" fullName="田中" size="lg" />` | `role="img"` の div に `data-size="lg"` |

---

## 6. 実行コマンド（Phase 6 全テスト）

```bash
# unit テスト（presign / shared schema / Avatar）
mise exec -- pnpm exec vitest run \
  apps/api/src/lib/r2/__tests__/member-photo-presign.spec.ts \
  packages/shared/src/zod/__tests__/viewmodel-photo.spec.ts \
  apps/web/src/features/admin/components/_members/__tests__/MemberAvatar.spec.tsx

# D1 contract テスト（Route-E-* を含む全 member-photo contract）
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts \
  apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts

# 全 unit テスト（回帰確認）
mise exec -- pnpm exec vitest run
```

---

## 完了条件（Phase 6）

- [ ] ROUTE-E-1〜E-12 が全て GREEN（fail-soft / 重複 upload / 削除後 GET / audit actor / サイズ境界）
- [ ] PRESIGN-E-1〜E-3 が GREEN（null 返却・境界）
- [ ] SCHEMA-E-1〜E-3 が GREEN（`.strict()` 回帰 / 型 reject）
- [ ] AVATAR-E-1〜E-4 が GREEN（属性維持 / img 非存在確認）
- [ ] 全 unit テスト（`pnpm exec vitest run`）が PASS
- [ ] D1 contract テスト（`vitest.d1.config.ts` 経由）が PASS

## メタ情報
workflow_state: `spec_created` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
Phase 5 の実装に対し、fail-soft、edge case、a11y、schema strictness の回帰耐性を上げる。

## 実行タスク
- API/storage edge case を追加検証する。
- UI fallback と accessibility のテストを追加する。

## 参照資料
- `phase-5.md`

## 成果物
- Phase 6 テスト拡充仕様

## 統合テスト連携
Phase 7 coverage の対象分岐は本 Phase の追加テストで網羅する。
