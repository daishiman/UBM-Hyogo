# 実装ガイド: issue-1029 public member photo display

> **[実装区分: 実装仕様書]**。本 workflow は `implemented_local_runtime_pending`。実コード配線、ローカル focused test/typecheck、local Playwright screenshot は完了済み。staging deploy、実 R2 presigned URL capture、commit、push、PR は user-gated。

---

## Part 1: なぜこの機能を作るのか（中学生にもわかる説明）

なぜ必要かというと、公開メンバー一覧で本人確認の手がかりが名前と文字情報だけに偏り、admin が登録した写真資産が public 側で活用されていないからです。何が変わるかというと、公開同意済みで公開状態の member だけに写真が表示され、写真が無い場合は今まで通りの丸い頭文字マークに戻ります。

### たとえ話（例え）

学校の「部活動メンバー紹介ボード」を想像してください。ボードには名前・趣味・自己紹介が貼ってあります。でも今は顔写真の枠が空っぽで、代わりに「名前の頭文字を丸の中に書いたマーク」が並んでいます。誰が誰だか、ちょっと分かりにくいですよね。

この機能は、その空っぽの枠に**顔写真を入れてあげる**仕組みです。

### 大事なルール 1: 写真を出していいのは「OK を出した人」だけ

ボードに写真を貼るには、本人が「公開していいですよ」と同意していることが必要です。この仕組みでは、すでにある 2 つの OK サインを使います。

- 本人が「公開していい」と言っている（`public_consent` が `consented`）
- ボードに名前を載せる状態になっている（`publish_state` が `public`）

この 2 つが揃っていない人は、写真も名前も最初からボードに出ません。新しく「写真だけの同意ボタン」を増やすことはしません。すでにある同意の仕組みをそのまま使います。

### 大事なルール 2: 写真を出すのは「先生（管理者）が写真を登録した人」だけ

写真は本人ではなく、信頼できる係（admin = 管理者）が別の管理画面ですでに登録しています（これは #983 という前のタスクで作りました）。管理者が「この公開メンバーに写真を登録した」という事実そのものを「公開していい」という意思とみなします。だから、写真が登録されていない人は写真枠が空のままです。

### 大事なルール 3: 写真が無い・読めないときは元のマークに戻る

写真が登録されていない人、あるいは何かの理由で写真がうまく表示できなかった人は、**今までどおり頭文字の丸マーク**に戻ります。ボードが崩れたり、エラー画面になったりはしません。写真は「あれば嬉しいおまけ」であって、無くても全部ちゃんと動きます。これを「フェイルソフト（失敗してもやさしく元に戻る）」と呼びます。

### まとめ

- 公開ディレクトリ（誰でも見られるメンバー一覧と個人ページ）に顔写真を出す。
- 出すのは「公開 OK の同意があり、かつ管理者が写真を登録した人」だけ。
- 写真が無い・読めないときは頭文字マークに戻る（壊れない）。
- データベースの構造は一切変えない。前のタスク #983 で作った写真置き場を再利用する。

### 今回作ったもの

今回の実装サイクルでは、写真を公開してよい条件を `16-member-photo-public-exposure.md` と aiworkflow-requirements 索引に固定し、public API の optional `photoUrl`、R2 presign resolver、一覧用 batch helper、そして `Avatar` へ写真 URL を渡す UI 配線まで実装した。

---

## Part 2: 技術仕様（実装者向け）

> 識別子はすべて実コード由来。手書き snippet は避け、既存 anchor（`outputs/phase-1/spec-extraction-map.md`）に整合させる。[Feedback W1-02b-3]

### 2.1 全体データフロー

```
list:    GET /public/members
  route(members.ts) → R2 deps 読込 → resolvePhotoUrls(memberIds) 構築
    → listPublicMembersUseCase(query, { ctx, resolvePhotoUrls })
      → 公開 gate で member 抽出 → resolvePhotoUrls?(memberIds) 1 回呼出
      → item source.photoUrl = map.get(memberId)
      → toPublicMemberListView(source) → PublicMemberListItemZ parse（photoUrl optional）

profile: GET /public/members/:memberId
  route(member-profile.ts) → R2 deps 読込 → resolvePhotoUrl(memberId) 構築
    → getPublicMemberProfileUseCase(memberId, { ctx, resolvePhotoUrl })
      → 公開 gate + visibility filter → resolvePhotoUrl?(memberId) 1 回呼出
      → profile source.photoUrl 注入
      → toPublicMemberProfileView(source) → PublicMemberProfileZ parse（photoUrl optional）

UI:
  list:   page.tsx → MemberGrid → MemberCard(member.photoUrl) → <Avatar src={member.photoUrl}>
  detail: [id]/page.tsx → toMemberDetailProps(profile)[photoUrl 写し取り]
            → <MemberDetail photoUrl> → <ProfileHero photoUrl> → <Avatar src={photoUrl}>
```

### 2.2 shared zod / types

### APIシグネチャ

```ts
export type PublicPhotoUrlResolver = (memberId: string) => Promise<string | undefined>;
export type PublicPhotoUrlsResolver = (memberIds: string[]) => Promise<Map<string, string>>;

export async function listMemberPhotosByIds(
  c: DbCtx,
  memberIds: readonly string[],
): Promise<Map<string, string>>;

// GET /public/members
export interface PublicMemberListItem {
  photoUrl?: string;
}

// GET /public/members/:memberId
export interface PublicMemberProfile {
  photoUrl?: string;
}
```

### 使用例

```ts
const photos = await listMemberPhotosByIds(ctx, members.map((member) => member.memberId));
const view = toPublicMemberListView({
  ...member,
  photoUrl: photos.get(member.memberId),
});
```

`packages/shared/src/zod/viewmodel.ts`:

```ts
// PublicMemberListItemZ（.strict() 維持）に追加
photoUrl: z.string().url().optional(),

// PublicMemberProfileZ（.strict()）に追加
photoUrl: z.string().url().optional(),
```

- optional のため既存 parse は破壊されない（AC-2）。`PublicMemberProfileZ` の `.strict()` は維持する。
- 先例: `AdminMemberDetailViewZ.photoUrl: z.string().url().optional()`（同ファイル `:311-313`、#983 landed）。

`packages/shared/src/types/viewmodel/index.ts`:

```ts
export interface PublicMemberListItem { /* ...既存... */ photoUrl?: string; }
export interface PublicMemberProfile  { /* ...既存... */ photoUrl?: string; }
```

### 2.3 repository batch helper

`apps/api/src/repository/memberPhotos.ts` に追加（list の N+1 防止・AC-8）:

```ts
/** 複数 member の object_key を 1 query で取得。空配列は空 Map。 */
export async function listMemberPhotosByIds(
  c: DbCtx,
  memberIds: readonly string[],
): Promise<Map<string, string>> {
  if (memberIds.length === 0) return new Map();
  const ph = memberIds.map(() => "?").join(", ");
  const r = await c.db
    .prepare(`SELECT member_id, object_key FROM member_photos WHERE member_id IN (${ph})`)
    .bind(...memberIds)
    .all<{ member_id: string; object_key: string }>();
  const map = new Map<string, string>();
  for (const row of r.results ?? []) map.set(row.member_id, row.object_key);
  return map;
}
```

- profile 側は既存 `getMemberPhoto(db, memberId)` を単体取得で使う。

### 2.4 use-case deps（resolver DI・optional・fail-soft）

```ts
// list-public-members.ts
export interface ListPublicMembersDeps {
  ctx: DbCtx;
  resolvePhotoUrls?: (memberIds: string[]) => Promise<Map<string, string>>;
}

// get-public-member-profile.ts
export interface GetPublicMemberProfileDeps {
  ctx: DbCtx;
  resolvePhotoUrl?: (memberId: string) => Promise<string | undefined>;
}
```

- resolver は **optional**。未注入（既存テスト / R2 secret 無し）の場合は photoUrl なしで従来通り動作する（後方互換・AC-8 fail-soft）。
- profile では resolver を **公開 gate 通過後**に呼ぶ。公開不可 member は use-case が 404 を投げるため写真も漏れない（AC-4 / AC-6）。

### 2.5 route env と presign resolver 構築

`MembersEnv` / `MemberProfileEnv` を拡張する:

```ts
export interface MembersEnv {
  DB: D1Database;
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  MEMBER_PHOTOS?: R2Bucket;
  ENVIRONMENT?: string;
}
```

list route の resolver（batch）構築フロー:

1. R2 secret 未設定 → 空 Map を返す（fail-soft、photoUrl 一切付かない）。
2. `listMemberPhotosByIds(db, memberIds)` → `Map<memberId, objectKey>`（1 query batch）。
3. 各 objectKey を `presignMemberPhotoGetUrl(deps, objectKey, MEMBER_PHOTO_PRESIGN_TTL_SECONDS)` で署名。
4. presign 成功分のみ Map に詰める（`null` は除外）。

profile route の resolver（単体）構築フロー:

1. R2 secret 未設定 → `undefined`。
2. `getMemberPhoto(db, memberId)` → `null` なら `undefined`。
3. `presignMemberPhotoGetUrl(deps, photo.objectKey, MEMBER_PHOTO_PRESIGN_TTL_SECONDS)` → `null` なら `undefined`。

### 2.6 presign（再利用・#983 landed）

| 項目 | 値 / anchor |
|------|------------|
| presign helper | `presignMemberPhotoGetUrl(deps, objectKey, ttl)`（`apps/api/src/lib/r2/member-photo-presign.ts`・純粋関数・失敗時 `null`） |
| TTL | `MEMBER_PHOTO_PRESIGN_TTL_SECONDS = 300`（admin と同値・public も同値） |
| 署名方式 | aws4fetch signQuery（CPU 内署名のみ・R2 へのネットワーク read は発生しない） |
| 実 R2 GET | browser が `<img src>` を取得する時のみ発生（list で N 件 presign しても read は画面表示分のみ） |
| bucket 名 | `ubm-hyogo-member-photos-{prod,staging}`（admin route `resolvePhotoUrl` `:289-318` と同パターンで解決） |
| object key | `member_photos.object_key`（DB row 値を presign に渡す） |

### 2.7 fail-soft とエラーハンドリング

### エラーハンドリング

| 失敗ケース | 挙動 | 結果 |
|-----------|------|------|
| R2 secret 未設定 | resolver が空 Map / undefined | photoUrl 省略・list/profile は 200 維持（AC-8） |
| presign 失敗（deps 不正等） | helper が `null` → resolver が除外 | 当該 member のみ photoUrl 省略・他 member は影響なし |
| 写真未登録 member | `member_photos` row なし → map に無し | photoUrl 省略 |
| 非公開 / consent なし member | 公開 gate で除外（resolve 前） | member 自体が応答に含まれない（写真も漏れない・AC-3/AC-4/AC-6） |
| UI で `<img>` 読込失敗 | `Avatar` の `onError` が hue placeholder へ | pixel diff ゼロの fallback（AC-5） |

- view-model は R2 非依存を維持する（presign は route 層のみ・invariant #5 / AC-7）。

### エッジケース

| ケース | 期待 |
| --- | --- |
| `memberIds` が空配列 | `listMemberPhotosByIds` は DB query せず空 Map |
| 公開 gate 不通過 | member 自体が 404 / list 除外。写真有無を漏らさない |
| R2 secret 未設定 | `photoUrl` 省略で 200 維持 |
| 壊れた presigned URL | `Avatar` の `onError` で hue placeholder |

### 2.8 設定可能パラメータ一覧

### 設定項目と定数一覧

| パラメータ | 既定値 | 設定場所 | 備考 |
|-----------|-------|---------|------|
| presign TTL | `300`（秒） | `MEMBER_PHOTO_PRESIGN_TTL_SECONDS` 定数 | admin と共有・public 専用値は設けない |
| R2 bucket 名 | `ubm-hyogo-member-photos-{prod,staging}` | `ENVIRONMENT` から解決 | admin `resolvePhotoUrl` と同パターン |
| R2 認証 | `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Cloudflare Secrets | 未設定時は fail-soft |
| R2 binding | `MEMBER_PHOTOS` | `wrangler.toml` R2 binding | 未設定時は fail-soft |
| Cache-Control | 追加なし | - | presigned URL の `X-Amz-Expires=300` で失効統一（list の no-store は HTML 応答用で `<img>` には無影響） |

### 2.9 UI 配線

- `MemberCard.tsx`: `<Avatar ... src={member.photoUrl} />`（list / comfy / dense 全 density）。
- `ProfileHero.tsx`: props に `photoUrl?: string` 追加 → `<Avatar ... src={props.photoUrl} />`。
- `MemberDetail.tsx`: `photoUrl` を `ProfileHero` へ pass through。
- `lib/adapters/member-detail.ts`: `MemberDetailProps` に `photoUrl?: string` 追加 + `toMemberDetailProps` で写し取り。
- `Avatar` は `src && !imgFailed` で `<img onError>`、それ以外は hue placeholder（既存実装・新規 fallback 不要）。

### テスト構成

| レイヤ | テスト |
| --- | --- |
| shared | `PublicMemberListItemZ` / `PublicMemberProfileZ` optional `photoUrl` parse |
| repository | `member-photos.batch.spec.ts` で空配列 / 単一 / 複数 batch |
| use-case | resolver 注入 / 未注入 fail-soft / gate 不通過 / presign 失敗 |
| web | `MemberCard.spec.tsx` / `ProfileHero.component.spec.tsx` で `<Avatar src>` と placeholder |
| grep gate | `apps/web/src` に R2 / `member_photos` 直接参照が無いこと |

---

## 視覚証跡

VISUAL_ON_EXECUTION のうち local mock runtime screenshot は取得済み。screenshot-plan は `outputs/phase-11/screenshot-plan.json` を参照する。取得済み local 証跡は次の 3 枚:

- `outputs/phase-11/screenshots/public-members-photo-list-desktop.png`
- `outputs/phase-11/screenshots/public-member-photo-detail-desktop.png`
- `outputs/phase-11/screenshots/public-members-photo-list-mobile.png`

staging deploy 後の実 R2 presigned URL capture は Gate-C user-gated として残す。
