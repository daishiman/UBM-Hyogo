# Phase 2: 設計

> **[実装区分: 実装仕様書]**。本 Phase は topology・データフロー・契約・状態所有権を設計する。

## メタ情報

- workflow_state: `implemented_local_runtime_pending` / 対象レイヤ: shared(zod/types) / apps-api(route, use-case, view-model, repository) / apps-web(component, adapter)
- 既存コンポーネント再利用可否（[FB-SDK-07-1]）: **再利用優先**。`Avatar` の `src`/`onError` fallback、`presignMemberPhotoGetUrl`、`member_photos` 表は #983 で landed 済み。新規 primitive・新規 migration を生やさない。

## 目的

public member photo display を、API を変更せず（既存 endpoint surface を維持しつつ）写真フィールドを追加する形で設計し、責務境界・状態所有権・fail-soft を確定する。

## 1. データフロー設計

### 1.1 list（`GET /public/members`）

```
route(members.ts)
  ├─ env から R2 deps（R2_ACCOUNT_ID/ACCESS_KEY_ID/SECRET_ACCESS_KEY/MEMBER_PHOTOS/ENVIRONMENT）を読む
  ├─ resolvePhotoUrls = async (memberIds) => Map<memberId, presignedUrl>
  │     (1) R2 secret 未設定 → 空 Map（fail-soft、photoUrl 一切付かない）
  │     (2) listMemberPhotosByIds(db, memberIds) → Map<memberId, objectKey>（1 query batch）
  │     (3) 各 objectKey を presignMemberPhotoGetUrl(deps, objectKey, 300) で署名
  │     (4) presign 成功分のみ Map に詰める（null は除外）
  └─ listPublicMembersUseCase(query, { ctx, resolvePhotoUrls })
        ├─ 公開 gate（既存 publicMembers repo）で member 抽出
        ├─ summary fields 取得（既存）
        ├─ resolvePhotoUrls?(抽出 memberIds) を 1 回呼ぶ
        ├─ item source に photoUrl = map.get(memberId)（無ければ undefined）
        └─ toPublicMemberListView(source) → zod parse（photoUrl optional）
```

### 1.2 profile（`GET /public/members/:memberId`）

```
route(member-profile.ts)
  ├─ env から R2 deps を読む
  ├─ resolvePhotoUrl = async (memberId) => presignedUrl | undefined
  │     (1) R2 secret 未設定 → undefined
  │     (2) getMemberPhoto(db, memberId) → null なら undefined
  │     (3) presignMemberPhotoGetUrl(deps, photo.objectKey, 300) → null なら undefined
  └─ getPublicMemberProfileUseCase(memberId, { ctx, resolvePhotoUrl })
        ├─ 公開 gate + visibility filter（既存）で profile 組成
        ├─ resolvePhotoUrl?(memberId) を 1 回呼ぶ（公開 gate 通過後）
        ├─ profile source に photoUrl 注入
        └─ toPublicMemberProfileView(source) → zod parse（photoUrl optional）
```

> **重要**: presign resolver は profile を公開 gate が通った後に呼ぶ。公開不可 member は use-case が 404 を投げるため、写真も漏れない（AC-4/AC-6）。

### 1.3 UI（web）

```
list:  page.tsx → MemberGrid → MemberCard(member.photoUrl) → <Avatar src={member.photoUrl}>
detail: [id]/page.tsx → toMemberDetailProps(profile) [photoUrl 写し取り]
         → <MemberDetail photoUrl> → <ProfileHero photoUrl> → <Avatar src={photoUrl}>
```

`Avatar` は `src && !imgFailed` で `<img onError>`、それ以外は hue placeholder（既存実装）。UI 側に新規 fallback 実装は不要。

## 2. 契約設計

### 2.1 shared zod（`packages/shared/src/zod/viewmodel.ts`）

```ts
export const PublicMemberListItemZ = z.object({
  memberId: z.string().min(1),
  fullName: z.string(),
  nickname: z.string(),
  occupation: z.string(),
  location: z.string(),
  ubmZone: z.string().nullable(),
  ubmMembershipType: z.string().nullable(),
  // issue-1029: public-safe presigned photo URL（TTL 300s）。optional のため既存 parse 不変。
  photoUrl: z.string().url().optional(),
});

export const PublicMemberProfileZ = z
  .object({
    // ...既存フィールド...
    // issue-1029: 同上。.strict() 維持。
    photoUrl: z.string().url().optional(),
  })
  .strict();
```

> `PublicMemberListItemZ` は object（`.strict()` なし）。`PublicMemberProfileZ` と `PublicMemberListViewZ` は `.strict()`。optional 追加は既存 parse を壊さない。

### 2.2 shared types（`packages/shared/src/types/viewmodel/index.ts`）

```ts
export interface PublicMemberListItem { /* ...既存... */ photoUrl?: string; }
export interface PublicMemberProfile  { /* ...既存... */ photoUrl?: string; }
```

### 2.3 repository batch helper（`apps/api/src/repository/memberPhotos.ts`）

```ts
/** 複数 member の object_key を 1 query で取得（list の N+1 防止）。空配列は空 Map。 */
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

### 2.4 use-case deps（DI）

```ts
// list-public-members.ts
export interface ListPublicMembersDeps {
  ctx: DbCtx;
  resolvePhotoUrls?: (memberIds: string[]) => Promise<Map<string, string>>;
}
// get-public-member-profile.ts
export interface GetPublicMemberProfileDeps {
  ctx: DbCtx; // 既存
  resolvePhotoUrl?: (memberId: string) => Promise<string | undefined>;
}
```

> resolver は **optional**。未注入（既存テスト / R2 無し）は photoUrl なしで従来通り動作する（後方互換）。

### 2.5 route env（`MembersEnv` / `MemberProfileEnv` 拡張）

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

## 3. 状態所有権 / 責務境界

| 責務 | owner | 非 owner |
|------|-------|---------|
| R2 presign（署名生成） | apps/api route 層 resolver | view-model（R2 非依存維持）/ apps/web |
| 公開 gate 判定 | `publicMembers` repo / profile use-case | route / web |
| photo object_key の DB 取得 | `memberPhotos` repo | route が直接 SQL を書かない |
| photoUrl の schema 検証 | shared zod（view-model parse） | web |
| 写真表示 / fallback | `Avatar`（web） | API |

> 因果ループ: secret 未設定 / presign 失敗 → resolver が undefined を返す（バランスループ）→ schema optional が吸収 → UI が hue placeholder（既存）。エラーが伝播せず 200 を維持する fail-soft 設計。

## 4. R2 read cost 設計（issue 指摘への回答）

- **presign は CPU 内署名のみ**（aws4fetch signQuery）。R2 へのネットワーク read は発生しない。
- 実際の R2 GET は **browser が `<img src>` を取得する時のみ**発生する。list で N 件 presign しても R2 read は「画面に表示された avatar 分」だけ。
- TTL = 300s（admin と同値）。Cache-Control はブラウザ既定（presigned URL の `X-Amz-Expires` で失効）。list の no-store は HTML レスポンスに対するもので、`<img>` 取得には影響しない。
- 結論: list batch presign は許容コスト。追加の thumbnail/transcode は scope 外（#983-followup-003）。

## 実行タスク

- §1-4 のデータフロー・契約・責務・cost 設計を確定する。
- resolver DI パターン（optional・fail-soft）を Phase 4 テスト設計の前提として固定する。

## 参照資料

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| API endpoints | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | public member contract |
| architecture | `.claude/skills/aiworkflow-requirements/references/architecture-*.md` | layer 境界（route/use-case/repo/view） |

- `phase-1.md` / `outputs/phase-1/spec-extraction-map.md`
- `apps/api/src/routes/admin/members.ts:289-318`（resolvePhotoUrl 先例）

## 成果物

- Phase 2 設計（本ファイル）

## 完了条件

- [ ] list / profile のデータフローが route→use-case→view→UI で閉じている
- [ ] resolver DI が optional・fail-soft で後方互換であることが設計に明記されている
- [ ] view-model が R2 非依存である（presign は route 層）ことが責務境界表に記録されている
- [ ] R2 read cost（presign=CPU のみ / R2 read=browser img 時）が明記されている
- [ ] zod は `.strict()` 維持・photoUrl optional であることが契約に明記されている

## 統合テスト連携

Phase 4 が §2 の契約（schema optional / resolver DI / batch helper）に対する RED テストを設計する。Phase 5 が §1 のデータフローを実装する。
