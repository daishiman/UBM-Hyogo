# Phase 6: テスト拡充

> **[実装区分: 実装仕様書]**。Phase 5 の GREEN 達成後に fail path・回帰ガード・補助ケースを追加し、仕様の網羅性を高める。

---

## 1. 追加対象ファイルと追加ケース概要

Phase 5 で実装した **変更ファイルのみを対象**とする。未変更のファイル（既存の admin route で Phase 4/5 が直接触れていない箇所）はこの Phase では追加しない。

| ファイルパス | 追加目的 |
|---|---|
| `apps/api/src/routes/me/__tests__/photo.route.spec.ts` | fail-soft / rate limit / rulesConsent / 上書き / 削除後 GET / audit actor 詳細 |
| `apps/api/src/repository/__tests__/memberPhotos.source.spec.ts` | migration backfill 詳細 / last-write-wins 回帰 |
| `apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts`（既存ファイル・admin 回帰） | admin route が `source:'admin'` 明示追加後も既存挙動が壊れていないことを確認 |
| `apps/web/app/(member)/profile/_components/__tests__/PhotoUpload.client.component.spec.tsx` | ロック解放詳細 / 削除 confirm flow / a11y 補助 |
| `apps/web/app/api/me/photo/__tests__/route.spec.ts` | proxy ステータス透過の補助ケース |

---

## 2. `/me/photo` route contract — fail path / 回帰 追加ケース

以下を `photo.route.spec.ts` に追記する。

### 2.1 fail-soft 回帰（presign null 時 200 維持）

| ID | テスト名 | セットアップ | 期待 |
|---|---|---|---|
| ME-PHOTO-E-1 | `GET /me/profile`: presign secret 全未設定 → 200 かつ `photoUrl` 無し | D1 に photo row あり。`R2_ACCOUNT_ID` = undefined | `200`、`body.photoUrl === undefined`（500 にならない） |
| ME-PHOTO-E-2 | `GET /me/profile`: presign util が null 返却 → 200 かつ `photoUrl` 無し | `presignMemberPhotoGetUrl` を `vi.fn().mockResolvedValueOnce(null)` で強制 null | `200`、`body.photoUrl === undefined` |
| ME-PHOTO-E-3 | `GET /me/profile`: presign util が throw → 200 かつ `photoUrl` 無し（fail-soft catch） | `presignMemberPhotoGetUrl` を `vi.fn().mockRejectedValueOnce(new Error("presign error"))` で強制 throw | `200`（500 にならない）、`body.photoUrl === undefined` |

### 2.2 上書き（last-write-wins）確認

| ID | テスト名 | セットアップ | 期待 |
|---|---|---|---|
| ME-PHOTO-E-4 | 同一 member が 2 回 POST → 最後のデータで上書き | 1回目 JPEG 10KB、2回目 PNG 20KB を同じ session で POST | D1 `member_photos` の `content_type='image/png'`、`byte_size=20480` |
| ME-PHOTO-E-5 | 上書き後 R2 object key が単一スロット維持 | ME-PHOTO-E-4 後 | R2 に `members/{memberId}/avatar` が 1 object のみ存在（orphan 無し） |
| ME-PHOTO-E-6 | admin upload 後に self upload → source が 'self' に更新される | admin route で `source:'admin'` upsert 後、me route で POST | D1 の `source='self'` |
| ME-PHOTO-E-7 | self upload 後に admin upload → source が 'admin' に更新される（last-write-wins） | me route で POST 後、admin route で POST | D1 の `source='admin'` |

### 2.3 削除後 GET で photoUrl が存在しないことの確認

| ID | テスト名 | セットアップ | 期待 |
|---|---|---|---|
| ME-PHOTO-E-8 | POST → DELETE → `GET /me/profile` → `photoUrl` 無し | POST で photo 登録 → DELETE → GET profile | `200`、`body.photoUrl === undefined` |
| ME-PHOTO-E-9 | 削除後も profile 本体フィールドは正常（detail 全体が壊れていない） | ME-PHOTO-E-8 と同じ | `body.profile` / `body.statusSummary` 等が正常に返る |

### 2.4 audit actor / action の詳細確認

| ID | テスト名 | セットアップ | 期待 |
|---|---|---|---|
| ME-PHOTO-E-10 | POST → audit `action='member.photo_uploaded'` かつ actor が session email | セッション email = `member@example.com` で POST | D1 `audit_log` に `action='member.photo_uploaded'`、`actor_email='member@example.com'` |
| ME-PHOTO-E-11 | DELETE → audit `action='member.photo_deleted'` かつ `target_id` が memberId | セッション memberId = `m_001` で DELETE | D1 `audit_log` に `action='member.photo_deleted'`、`target_id='m_001'` |
| ME-PHOTO-E-12 | audit action が admin 系（`admin.member.photo_uploaded`）と混同されない | POST して audit を確認 | `action='member.photo_uploaded'`（admin. prefix なし） |

### 2.5 rate limit 詳細

| ID | テスト名 | セットアップ | 期待 |
|---|---|---|---|
| ME-PHOTO-E-13 | rate limit 閾値 -1（4回目）は 200 | rate limit カウンタ = 4（閾値未満）で POST | 200 |
| ME-PHOTO-E-14 | rate limit 閾値ちょうど（5回目）は 429 | rate limit カウンタ = 5（閾値）で POST | 429 |
| ME-PHOTO-E-15 | DELETE は rate limit 対象外（sessionGuard のみ） | rate limit カウンタ = 5 の状態で DELETE | 200（rate limit ゲートを通過） |

### 2.6 rulesConsent ゲート詳細

| ID | テスト名 | セットアップ | 期待 |
|---|---|---|---|
| ME-PHOTO-E-16 | rulesConsent='accepted' → POST 通過 | `rulesConsent='accepted'` の member | 200 |
| ME-PHOTO-E-17 | rulesConsent='declined' → POST 403 | `rulesConsent='declined'` の member | 403 |
| ME-PHOTO-E-18 | rulesConsent 未セット（null）→ POST 403 | `rulesConsent=null` の member | 403 |

---

## 3. repository — migration backfill / last-write-wins 補助ケース

`memberPhotos.source.spec.ts` に追記する。

| ID | テスト名 | セットアップ | 期待 |
|---|---|---|---|
| REPO-SRC-E-1 | migration 0022 のみ適用後に INSERT → 0023 適用 → SELECT で `source='admin'` （DEFAULT backfill の実証） | setupD1 で 0022 まで apply → INSERT（source 列なし）→ 0023 apply → SELECT | `getMemberPhoto().source === "admin"` |
| REPO-SRC-E-2 | upsert に `source:'self'` → 再 upsert に `source:'admin'` → last-write-wins で 'admin' | 1回目 `source:'self'`、2回目 `source:'admin'` | `getMemberPhoto().source === "admin"` |
| REPO-SRC-E-3 | `getMemberPhoto` の source 正規化: DB に `source='unknown'` があっても 'admin' を返す | `db.exec("INSERT INTO member_photos ... source='unknown'"` | `getMemberPhoto().source === "admin"` |

---

## 4. admin route 回帰ガード（既存 contract が source 明示後も緑）

`apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts` に追記する。
Phase 5 で admin route に `source: "admin"` を追加したことにより既存挙動が退行していないことを確認する。

| ID | テスト名 | セットアップ | 期待 |
|---|---|---|---|
| ADMIN-REG-1 | admin `POST .../photo` → D1 の `source='admin'` が記録される | admin route で POST（`source: "admin"` 明示後） | D1 `member_photos.source === 'admin'` |
| ADMIN-REG-2 | admin `DELETE .../photo` → audit `admin.member.photo_deleted` が記録される（既存回帰） | admin route で DELETE | D1 `audit_log.action = 'admin.member.photo_deleted'` |
| ADMIN-REG-3 | admin `GET /admin/members/:memberId` → `photoUrl` フィールドが 200 に含まれる（既存回帰） | photo row あり・presign secret 設定済み | `body.photoUrl` が URL 文字列 |
| ADMIN-REG-4 | admin `GET .../members/:memberId` presign null → 200 維持（既存回帰） | presign secret 未設定 | `200`、`body.photoUrl === undefined` |

---

## 5. PhotoUpload コンポーネント — 補助ケース

`PhotoUpload.client.component.spec.tsx` に追記する。

### 5.1 ロック解放の詳細確認

| ID | テスト名 | 操作 | 期待 |
|---|---|---|---|
| PHOTO-UP-E-1 | upload エラー後のロック解放: `isLocked` が false に戻る（PHOTO-UP-6 の内部状態確認） | `uploadOwnPhoto` reject mock → エラー後 | file input が `disabled` でない。upload ボタン label の `aria-disabled` が `"false"` または未設定 |
| PHOTO-UP-E-2 | delete エラー後のロック解放（PHOTO-UP-10 補足） | `deleteOwnPhoto` reject mock → エラー後 | delete ボタンが `disabled` でない |
| PHOTO-UP-E-3 | upload 中に delete ボタンも disabled になる（相互ロック） | `uploadOwnPhoto` を pending にして uploading 状態 | delete ボタンが `disabled` |
| PHOTO-UP-E-4 | delete confirm → cancel → idle に戻る（delete ボタン再表示） | delete ボタンクリック → confirm 表示 → キャンセルクリック | delete ボタンが再表示される |

### 5.2 client 事前チェックの詳細

| ID | テスト名 | 操作 | 期待 |
|---|---|---|---|
| PHOTO-UP-E-5 | image/gif 選択 → `uploadOwnPhoto` が呼ばれない | gif ファイルを input にセット | `uploadOwnPhoto` が 0 回呼ばれる。エラーメッセージが表示される |
| PHOTO-UP-E-6 | 262145 バイト超過 → `uploadOwnPhoto` が呼ばれない | 262145バイト Uint8Array を input にセット | `uploadOwnPhoto` が 0 回呼ばれる。エラーメッセージが表示される |
| PHOTO-UP-E-7 | 262144 バイト（上限ちょうど）→ `uploadOwnPhoto` が呼ばれる | 262144バイト Uint8Array（image/jpeg）を input にセット | `uploadOwnPhoto` が 1 回呼ばれる |

### 5.3 写真未登録時の baseline 維持（AC-9）

| ID | テスト名 | 条件 | 期待 |
|---|---|---|---|
| PHOTO-UP-E-8 | `photoUrl` なし → delete ボタン非表示（AC-9: 現行と pixel diff ゼロ相当） | `<PhotoUpload memberId="m_001" name="田中" />` | delete ボタンが DOM に存在しない。`role="img"` div が `<img>` なしで存在する |
| PHOTO-UP-E-9 | `photoUrl` なし → `uploadOwnPhoto` が正常に呼べる（upload 経路は常に open） | gif 以外の有効ファイルを選択 | `uploadOwnPhoto` が呼ばれる |

---

## 6. proxy route — 補助ケース

`route.spec.ts` に追記する。

| ID | テスト名 | mock レスポンス | 期待 |
|---|---|---|---|
| PROXY-E-1 | POST 503（R2 binding 無し）→ proxy が 503 をそのまま返す | API Worker 503 | Response status=503 |
| PROXY-E-2 | DELETE 503 → proxy が 503 をそのまま返す | API Worker 503 | Response status=503 |
| PROXY-E-3 | POST Content-Type が `multipart/form-data; boundary=...` の場合 fetch に転送される | 任意 200 | fetch 呼び出し時の headers に `content-type` が `multipart/form-data` を含む |

---

## 7. 実行コマンド（Phase 6 全テスト）

```bash
# api D1 contract（me photo + admin 回帰）
mise exec -- pnpm --filter @ubm-hyogo/api \
  exec vitest run --config ../../vitest.d1.config.ts \
  apps/api/src/routes/me/__tests__/photo.route.spec.ts \
  apps/api/src/repository/__tests__/memberPhotos.source.spec.ts \
  apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts

# web unit（PhotoUpload / proxy）
mise exec -- pnpm --filter @ubm-hyogo/web \
  exec vitest run \
  "apps/web/app/(member)/profile/_components/__tests__/PhotoUpload.client.component.spec.tsx" \
  "apps/web/app/api/me/photo/__tests__/route.spec.ts"

# 全 unit テスト（回帰確認）
mise exec -- pnpm exec vitest run
```

---

## 完了条件（Phase 6）

- [ ] ME-PHOTO-E-1〜E-18 が全て GREEN（fail-soft / 上書き / 削除後 GET / audit actor / rate limit / rulesConsent 詳細）
- [ ] REPO-SRC-E-1〜E-3 が GREEN（backfill 詳細 / last-write-wins / source 正規化）
- [ ] ADMIN-REG-1〜4 が GREEN（admin route 回帰 — source 明示後も既存挙動維持）
- [ ] PHOTO-UP-E-1〜E-9 が GREEN（ロック解放 / client チェック / AC-9 baseline）
- [ ] PROXY-E-1〜E-3 が GREEN（503 透過 / Content-Type 転送）
- [ ] 全 unit テスト（`pnpm exec vitest run`）が PASS
- [ ] D1 contract テスト（`vitest.d1.config.ts` 経由）が PASS

## メタ情報
workflow_state: `implemented_local_runtime_pending` / taskType: `implementation` / visualEvidence: `VISUAL`

## 目的
Phase 5 の実装に対し、fail-soft・edge case・admin 回帰・a11y・schema strictness の回帰耐性を上げる。

## 参照資料
- `phase-5.md`

## 統合テスト連携
Phase 7 coverage の対象分岐は本 Phase の追加テストで網羅する。
