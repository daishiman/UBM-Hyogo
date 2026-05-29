# Lessons Learned: issue-983 member photo avatar R2 storage

state: `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION`

## L-I983-001: Form schema 外の admin-managed binary asset は D1メタ + R2バイナリ + presigned URL の3層で分離する
- **状況**: Google Form は会員の顔写真を集めない（不変条件 #1: 実フォーム schema をコードに固定しすぎない）。admin drawer は実写真を表示したいが、Form schema 外のデータは admin-managed data として分離する必要がある（不変条件 #4）。
- **教訓**: フォーム正本 schema 外の admin 管理バイナリ資産は「D1 `member_photos`（誰がどの写真を持つかのメタデータ）+ R2 `MEMBER_PHOTOS` binding（バイナリ本体）+ API が発行する短命 presigned URL」の3層で分離する。`apps/web` は signed `photoUrl` 文字列を受け取り `<img src>` に渡すだけにし、R2/D1 へ直接アクセスしない（不変条件 #5: D1/R2 アクセスは `apps/api` に閉じる）。これにより storage credential がフロントへ露出せず、正本 schema もバイナリ格納で汚染されない。

## L-I983-002: presign は fail-soft（null返却）にし、read endpoint は presign失敗でも 200 を維持する
- **状況**: `presignMemberPhotoGetUrl` は presign secret 未注入の local/未provision環境でも呼ばれうる。ここで throw すると `GET /admin/members/:memberId` detail が 500 で壊れ、写真とは無関係な member 詳細表示まで失敗する。
- **教訓**: presign helper は deps 不正 / objectKey 空 / `ttl<=0` / `aws4fetch` throw のいずれでも例外でなく `null` を返す fail-soft 契約にする。利用側 `resolvePhotoUrl` も R2 secret 3点（`R2_ACCOUNT_ID`/`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`）未設定 / photo row 不在 / bucket 未解決 / presign null で `undefined` を返し、detail endpoint は `photoUrl` を**省略したまま 200 を維持**する。secret 未設定環境で既存 detail が壊れないことを保証する。

## L-I983-003: photoUrl 解決は route 層の resolve helper で行い builder を外部I/O非依存に保つ
- **状況**: `buildAdminMemberDetailView`（builder）に R2 presign 依存を持ち込むと、builder が外部 I/O 依存になりテスト・再利用が難化する。
- **教訓**: ViewModel builder は純粋（外部 I/O 非依存）に保ち、URL 解決は route 層の `resolvePhotoUrl(env, db, mid)` helper に切り出す。route で `const photoUrl = await resolvePhotoUrl(...)` を解決し、`photoUrl !== undefined` のときだけ `c.json({ ...parsed.data, photoUrl }, 200)` と**後段マージ**する。builder の純粋性と route の I/O 責務を層分離する。

## L-I983-004: aws4fetch AwsClient signQuery で R2 presigned GET を生成する契約
- **状況**: R2 は S3 互換 endpoint を持ち、`aws4fetch` の `AwsClient` で SigV4 query 署名（presigned URL）を発行できる。
- **教訓**: `new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" })` で `aws.sign(new Request(url, {method:"GET"}), { aws: { signQuery: true } })` を使う。(1) object key は `encodeURIComponent(objectKey).replace(/%2F/g, "/")` でパス区切り `/` を保ったままエンコードする。(2) TTL は `url.searchParams.set("X-Amz-Expires", String(ttlSeconds))` で query 指定する（aws4fetch は signQuery 時にこれを読む）。endpoint は `https://{accountId}.r2.cloudflarestorage.com/{bucket}/{encodedKey}`。

## L-I983-005: multipart upload は検証順序ごとに正しいHTTPステータスを返す
- **状況**: `POST /admin/members/:memberId/photo` は multipart で受ける。検証の順序とステータスを曖昧にすると、不正入力が後段まで漏れたり誤ったステータスを返す。
- **教訓**: 検証は (1) member 存在確認 → 不在 `404`、(2) `formData()` 取得失敗 / `file` field 不在 / 非 `File` → `400`、(3) MIME allowlist（`image/jpeg`/`png`/`webp`）外 → `415`、(4) `arrayBuffer().byteLength === 0` → `400`、(5) `byteLength > MEMBER_PHOTO_MAX_BYTES`（256KB）→ `413` の順で固定する。各段で正しいステータスを返し、検証通過後にのみ R2 put + D1 upsert + audit を行う。

## L-I983-006: shared zod に optional field 追加時も `.strict()` を維持し、Avatar onError で親タスクの hue-placeholder を fallback 保持する
- **状況**: detail ViewModel に写真 URL を足すと、`AdminMemberDetailViewZ` の `.strict()` を壊しかねない。また親 admin-members-prototype-redesign が導入した hue placeholder を消すと写真不在時の表示が退行する。
- **教訓**: shared zod schema には `photoUrl: z.string().optional()` を追加し `.strict()` を維持する（unknown key 拒否は保つ）。UI は `Avatar src?` で写真優先描画しつつ、`onError` で既存の hue placeholder へ fallback する。新規 placeholder を生やさず親タスクの fallback を保持し、photo 不在・presign 省略・img ロード失敗の3経路すべてで placeholder が出る。

## 定数（実装正本）

| 項目 | 値 | 出典 |
|---|---|---|
| object key | `members/{memberId}/avatar`（1 member 1 photo 上書き） | `MEMBER_PHOTO_OBJECT_KEY` |
| max size | `256 * 1024` bytes (262144) | `MEMBER_PHOTO_MAX_BYTES` |
| MIME allowlist | `image/jpeg`, `image/png`, `image/webp` | `MEMBER_PHOTO_ALLOWED_MIME` |
| presign TTL | `300` 秒 | `MEMBER_PHOTO_PRESIGN_TTL_SECONDS` |

## 関連実装ファイル

- `apps/api/migrations/0022_member_photos.sql`
- `apps/api/src/lib/r2/member-photo-presign.ts`
- `apps/api/src/repository/memberPhotos.ts`
- `apps/api/src/routes/admin/members.ts`（`resolvePhotoUrl` / POST・DELETE photo route）
- `packages/shared/src/zod/viewmodel.ts`, `packages/shared/src/types/viewmodel/index.ts`
- `apps/web/src/components/ui/Avatar.tsx`, `apps/web/src/features/admin/components/_members/{MemberAvatar,MemberDrawer}.tsx`

## User-Gated 境界

R2 bucket 作成、R2 presign secret 注入、remote D1 migration apply、staging deploy、authenticated staging screenshot、commit、push、PR、Issue #983 mutation は user-gated。local 完了を runtime 完了と混同しない。
