# Lessons Learned: issue-1031 member self photo upload (2026-06)

Workflow: `docs/30-workflows/issue-1031-member-self-photo-upload/`
Parent: `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/`
State: `implemented_local_runtime_pending / implementation / VISUAL`

会員本人による写真アップロード（`POST /me/photo` / `DELETE /me/photo`）と `member_photos.source` 列追加の実装で得た再発防止知見。

## L-I1031-001: `source` 列は migration では additive、値域正規化は read-time に寄せる

`member_photos.source` を `ALTER TABLE ... ADD COLUMN source TEXT NOT NULL DEFAULT 'admin'`（additive・既存行は DEFAULT backfill）で追加した。DB 層に `CHECK(source IN ('admin','self'))` を付けると legacy 行 migration が失敗するリスクがあるため付けない。
**解決策**: 値域の担保は repository read-time に寄せる。`memberPhotos.ts.getMemberPhoto` の SELECT に `source` を含め、`row.source === "self" ? "self" : "admin"` で正規化（未知値・legacy 値は silent forward-compatible に `admin` 扱い）。

## L-I1031-002: `/me/photo` の path に memberId を出さない（invariant #11 fail-closed）

admin route `/admin/members/:memberId/photo` と対比し、本人経路は path / query / multipart body のいずれにも他人の memberId を露出・参照させてはならない。
**解決策**: `POST /me/photo` / `DELETE /me/photo` は path パラメータを持たず、対象は常に `session.user.memberId` のみで解決する。AC-2 contract test と grep gate で path に `:memberId` が無いことを機械的に保証する。

## L-I1031-003: `GET /me/profile.photoUrl` は fail-soft（presign 失敗で 200 を壊さない）

`photoUrl` の presigned URL 生成は `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` が未設定の local / 未provision 環境で throw し得る。ここで throw すると profile detail が 500 で壊れる。
**解決策**: `resolveMyPhotoUrl`（admin の `resolvePhotoUrl` と同ロジック）は secret 不足 / row 不在 / presign null / I/O error すべてで `undefined` を返し、response body は `...(photoUrl !== undefined ? { photoUrl } : {})` で conditional merge。secret 未設定でも 200 を維持する。`MeProfileResponseZ` は `.strict()` を保ったまま `photoUrl?` を optional 追加。

## L-I1031-004: multipart upload の検証順序を固定し status code を契約化する

`POST /me/photo` は file field 有無 → MIME → size → R2 binding と検証段が多く、順序がぶれると client の error handling が複雑化する。
**解決策**: 検証順序を固定し contract test（ME-PHOTO-C-*）で全分岐を validate。(1) file 無/取得失敗→400、(2) MIME allowlist 外→415、(3) 0 byte→400、(4) >256KB→413、(5) R2 binding 無→503、rate limit→429。size/MIME はサーバ側で再検証し client 申告を信用しない。

## L-I1031-005: 同意ゲートは upload 限定、delete には付けない

本人 self-service で `requireRulesConsent` を一律に挟むと、自分の写真撤去（delete）まで同意状態に依存して塞いでしまう。
**解決策**: middleware chain を経路ごとに分離する。`POST /me/photo` = `sessionGuard → requireRulesConsent → rateLimitSelfRequest`、`DELETE /me/photo` = `sessionGuard`（同意ゲート無し）。delete は R2 binding 不足時も D1 row を削除して本人の撤去意図を優先し、row 不在は 404。

## L-I1031-006: Client Component のロック解放は try/finally 等価を success/error 両分岐に置く

`PhotoUpload.client.tsx` の状態機械（idle/uploading/success/error, confirm/deleting）で、異常系のロック解放を忘れると UI が永久に disabled になる。
**解決策**: `finally` に頼らず `kind: "success"` と `kind: "error"` の両経路で必ず state 更新する（try/finally 等価）。`isLocked` は `uploadState.kind === "uploading" || deleteState.kind === "deleting"` で判定。削除は 2 段階確認（confirm → deleting）で誤操作を防ぐ。

## L-I1031-007: OKLch token 遵守（HEX 直書き / `bg-[#xxx]` 禁止を CSS custom property で回避）

不変条件 #8 により色は OKLch token 正本で、HEX 直書きや `bg-[#...]` arbitrary value は `verify-design-tokens` で fail する。
**解決策**: アクセント色は `bg-[var(--ubm-color-...)]` / `text-[var(--ubm-color-accent)]` の形で CSS custom property を Tailwind arbitrary に埋め込む。Phase 9 の grep gate で HEX 直書き 0 件を確認してから PASS にする。

## L-I1031-008: web proxy は multipart を `FormData` 再構築で透過する

Client から `FormData` で送った file を Next.js Route Handler（server runtime）経由で API Worker へ proxy する際、boundary を手で組むと encoding がずれる。
**解決策**: `/api/me/photo/route.ts` で `req.formData()` を parse し、そのまま `fetchAuthed("/me/photo", { method: "POST", body: form })` に渡す（fetch が boundary を自動再構築）。proxy は env 不変条件を守り `process.env` を直接参照せず `fetchAuthed` の env accessor のみを使う。エラー status（401/403/413/415/429/404）は passthrough する。
