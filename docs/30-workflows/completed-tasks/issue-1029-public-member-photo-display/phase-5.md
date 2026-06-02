# Phase 5: 実装

> **[実装区分: 実装仕様書]**。本 Phase は Phase 4 の RED テストを GREEN にする実装差分方針を確定する。

## メタ情報

- workflow_state: `implemented_local_runtime_pending` / taskType: `implementation` / implementation_mode: `new`
- 対象レイヤ: shared(zod/types) / apps-api(repository, route, use-case, view-model) / apps-web(component, adapter)
- 既存 API endpoint surface は変更しない（path / method / 既存 field を保持し photoUrl を optional 追加するのみ）。
- D1 schema 変更なし（#983 の `member_photos` を再利用）。

## 目的

Phase 2 §1/§2 のデータフロー・契約に従い、route 層 presign resolver → use-case DI → view-model parse → web Avatar src の写真表示経路を実装する。fail-soft・後方互換・invariant #5（apps/web から R2/D1 直接アクセス禁止）を保つ。

## 変更ファイル一覧（[Feedback RT-03] 必須記載）

### 新規作成

| パス | 内容 |
|------|------|
| `docs/00-getting-started-manual/specs/16-member-photo-public-exposure.md` | 写真公開ポリシー ADR（gate / TTL 300s / R2 read タイミング / Cache-Control 方針）。本文は Phase 12 で確定し、ファイル自体は本 Phase で作成する |
| `apps/api/src/repository/__tests__/member-photos.batch.spec.ts` | lane B テスト（Phase 4 設計） |
| `apps/web/src/components/public/__tests__/MemberCard.spec.tsx` | lane E テスト（Phase 4 設計） |
| `apps/web/src/components/public/__tests__/ProfileHero.component.spec.tsx` | lane F テスト（Phase 4 設計） |

### 編集

| パス | 変更概要 |
|------|---------|
| `packages/shared/src/zod/viewmodel.ts` | `PublicMemberListItemZ` / `PublicMemberProfileZ` に `photoUrl: z.string().url().optional()` 追加 |
| `packages/shared/src/types/viewmodel/index.ts` | `PublicMemberListItem` / `PublicMemberProfile` に `photoUrl?: string` 追加 |
| `apps/api/src/repository/memberPhotos.ts` | `listMemberPhotosByIds(c, memberIds): Promise<Map<string,string>>` batch helper 追加 |
| `apps/api/src/routes/public/members.ts` | `MembersEnv` に R2 env 追加 + batch presign resolver 構築・use-case へ DI |
| `apps/api/src/routes/public/member-profile.ts` | `MemberProfileEnv` に R2 env 追加 + 単一 presign resolver 構築・use-case へ DI |
| `apps/api/src/use-cases/public/list-public-members.ts` | deps に `resolvePhotoUrls?` 追加・item source に photoUrl 注入 |
| `apps/api/src/use-cases/public/get-public-member-profile.ts` | deps に `resolvePhotoUrl?` 追加・profile source に photoUrl 注入 |
| `apps/api/src/view-models/public/public-member-list-view.ts` | `PublicMemberListItemSource` に `photoUrl?` 追加・parse 経路へ通す |
| `apps/api/src/view-models/public/public-member-profile-view.ts` | `ProfileSource` に `photoUrl?` 追加・parse 経路へ通す |
| `apps/web/src/components/public/MemberCard.tsx` | `<Avatar ... src={member.photoUrl} />`（comfy/dense/list 全 density） |
| `apps/web/src/components/public/ProfileHero.tsx` | props に `photoUrl?: string` 追加 → `<Avatar ... src={props.photoUrl} />` |
| `apps/web/src/components/public/MemberDetail.tsx` | `photoUrl` を ProfileHero へ pass through |
| `apps/web/src/lib/adapters/member-detail.ts` | `MemberDetailProps` に `photoUrl?: string` 追加・`toMemberDetailProps` で写し取り |

## 実装差分方針（ファイル別）

### 1. shared zod（`packages/shared/src/zod/viewmodel.ts`）

`PublicMemberListItemZ` の object に末尾フィールドとして追加（Phase 2 §2.1 引用）:

```ts
// issue-1029: public-safe presigned photo URL（TTL 300s）。optional のため既存 parse 不変。
photoUrl: z.string().url().optional(),
```

`PublicMemberProfileZ` の `.object({...}).strict()` の object 内末尾に同フィールドを追加する。`.strict()` の呼び出し位置は変更しない（追加後も `.strict()` を保つ）。

### 2. shared types（`packages/shared/src/types/viewmodel/index.ts`）

`PublicMemberListItem` / `PublicMemberProfile` interface に `photoUrl?: string;` を追加する（Phase 2 §2.2 引用）。zod 由来 type を `z.infer` で生成している場合は型追加は zod 側のみで自動反映されるため、手書き interface の場合のみ本ファイルを編集する。

### 3. repository batch helper（`apps/api/src/repository/memberPhotos.ts`）

`getMemberPhoto` の隣に Phase 2 §2.3 のコードを追加する:

```ts
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

- 空配列は SQL を発行せず空 Map を返す（lane B-1）。
- `results` が undefined でも `?? []` で空 Map（lane B-5）。
- `DbCtx` 型・`c.db.prepare` の呼び出し方は同ファイルの `getMemberPhoto` 実装に合わせる。

### 4. list use-case（`apps/api/src/use-cases/public/list-public-members.ts`）

deps interface に optional resolver を追加（Phase 2 §2.4 引用）:

```ts
resolvePhotoUrls?: (memberIds: string[]) => Promise<Map<string, string>>;
```

公開 gate で member を抽出した後、抽出済み memberIds で resolver を **1 回だけ**呼ぶ（lane C-4）:

```ts
const photoMap = deps.resolvePhotoUrls
  ? await deps.resolvePhotoUrls(memberIds)
  : new Map<string, string>();
```

item source 組成時に `photoUrl: photoMap.get(memberId)` を付ける（無ければ undefined）。resolver 未注入時は空 Map のため全 item photoUrl undefined（lane C-2 後方互換）。

### 5. profile use-case（`apps/api/src/use-cases/public/get-public-member-profile.ts`）

deps interface に追加:

```ts
resolvePhotoUrl?: (memberId: string) => Promise<string | undefined>;
```

公開 gate + visibility filter が通過し profile を組成すると確定した**後**に resolver を呼ぶ（Phase 2 §1.2・lane D-3 の漏れ防止順序）:

```ts
const photoUrl = deps.resolvePhotoUrl ? await deps.resolvePhotoUrl(memberId) : undefined;
```

gate 不通過時は profile 組成前に 404 経路（既存 NotFound）へ抜けるため resolver を呼ばない。profile source に `photoUrl` を注入する。

### 6. view-model（list / profile）

- `apps/api/src/view-models/public/public-member-list-view.ts`: `PublicMemberListItemSource` interface に `photoUrl?: string` を追加し、`toPublicMemberListView` の item mapping で source.photoUrl を出力 object へ通す。R2 への依存は追加しない（presign は route 層）。
- `apps/api/src/view-models/public/public-member-profile-view.ts`: `ProfileSource` interface に `photoUrl?: string` を追加し、`toPublicMemberProfileView` の parse object へ通す。

### 7. list route（`apps/api/src/routes/public/members.ts`）

`MembersEnv` に R2 env を追加（Phase 2 §2.5 引用）:

```ts
R2_ACCOUNT_ID?: string;
R2_ACCESS_KEY_ID?: string;
R2_SECRET_ACCESS_KEY?: string;
MEMBER_PHOTOS?: R2Bucket;
ENVIRONMENT?: string;
```

route handler で batch resolver を構築し use-case へ DI する。admin の `resolvePhotoUrl`（`apps/api/src/routes/admin/members.ts:289-318`）を public list 用 batch 版へ複製する:

```ts
const resolvePhotoUrls = async (memberIds: string[]): Promise<Map<string, string>> => {
  const out = new Map<string, string>();
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) return out; // fail-soft
  if (memberIds.length === 0) return out;
  const keyMap = await listMemberPhotosByIds(db, memberIds); // 1 query batch
  const bucketName = env.MEMBER_PHOTOS
    ? env.ENVIRONMENT === "production"
      ? "ubm-hyogo-member-photos-prod"
      : "ubm-hyogo-member-photos-staging"
    : null;
  if (!bucketName) return out;
  for (const [memberId, objectKey] of keyMap) {
    const url = await presignMemberPhotoGetUrl(
      { accountId: env.R2_ACCOUNT_ID, accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY, bucket: bucketName },
      objectKey,
      MEMBER_PHOTO_PRESIGN_TTL_SECONDS,
    );
    if (url) out.set(memberId, url); // presign 成功分のみ
  }
  return out;
};
```

use-case 呼び出しに `{ ...既存 deps, resolvePhotoUrls }` を渡す。

### 8. profile route（`apps/api/src/routes/public/member-profile.ts`）

`MemberProfileEnv` に同 R2 env を追加。単一 resolver を構築（admin `resolvePhotoUrl` をほぼそのまま転用・bucket 名解決同一）:

```ts
const resolvePhotoUrl = async (memberId: string): Promise<string | undefined> => {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) return undefined;
  const photo = await getMemberPhoto(db, memberId);
  if (!photo) return undefined;
  const bucketName = env.MEMBER_PHOTOS
    ? env.ENVIRONMENT === "production" ? "ubm-hyogo-member-photos-prod" : "ubm-hyogo-member-photos-staging"
    : null;
  if (!bucketName) return undefined;
  const url = await presignMemberPhotoGetUrl(
    { accountId: env.R2_ACCOUNT_ID, accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY, bucket: bucketName },
    photo.objectKey,
    MEMBER_PHOTO_PRESIGN_TTL_SECONDS,
  );
  return url ?? undefined;
};
```

use-case 呼び出しに `{ ...既存 deps, resolvePhotoUrl }` を渡す。

> import: `presignMemberPhotoGetUrl` / `MEMBER_PHOTO_PRESIGN_TTL_SECONDS` は `apps/api/src/lib/r2/member-photo-presign.ts`、`getMemberPhoto` / `listMemberPhotosByIds` は `apps/api/src/repository/memberPhotos.ts` から import する。

### 9. web MemberCard（`apps/web/src/components/public/MemberCard.tsx`）

既存 `<Avatar ...>`（L34/L40 付近・各 density 分岐）に `src={member.photoUrl}` を追加する。density（comfy / dense / list）の全分岐に同じく付ける。Avatar は `src` 無しで hue placeholder へ fallback する既存実装のため、photoUrl undefined 時は現行と pixel diff ゼロ（AC-5）。

### 10. web ProfileHero（`apps/web/src/components/public/ProfileHero.tsx`）

props 型に `photoUrl?: string` を追加し、`<Avatar ...>`（L18 付近）に `src={props.photoUrl}` を渡す。

### 11. web MemberDetail（`apps/web/src/components/public/MemberDetail.tsx`）

`photoUrl` を受け取り `<ProfileHero photoUrl={photoUrl} ... />` へ pass through する。MemberDetail の props 型は member-detail adapter の `MemberDetailProps` を参照する。

### 12. web adapter（`apps/web/src/lib/adapters/member-detail.ts`）

`MemberDetailProps`（L88-95 付近）に `photoUrl?: string` を追加し、`toMemberDetailProps(profile)` で `photoUrl: profile.photoUrl` を写し取る。これにより `[id]/page.tsx` は追加変更なしで photoUrl が自動伝播する（phase-1.md 注記）。

> list 側 `page.tsx` / `MemberGrid` は `member` object 全体を MemberCard へ渡しているため、schema に photoUrl が乗れば追加変更なしで伝播する。

## resolver DI 手順まとめ

1. route 層で env から R2 deps を読む。
2. route 層で resolver（list = batch / profile = 単一）を構築する。bucket 名 = `ubm-hyogo-member-photos-{prod,staging}`（`ENVIRONMENT === "production"` で prod、それ以外 staging）。
3. resolver を use-case deps に optional で DI する。
4. use-case は resolver 未注入なら photoUrl を付けない（後方互換）。
5. view-model は resolver/R2 を一切知らない（source.photoUrl を parse へ通すのみ）。

## 実行タスク

- shared → repository → use-case → view-model → route → web の順で差分を適用する。
- 各レイヤ適用後に `mise exec -- pnpm --filter <package> test` で当該 lane の RED → GREEN を確認する。
- 全レイヤ適用後に typecheck / lint / 全 test を実行する。

## 参照資料

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| API endpoints | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | public member contract / photoUrl 追加 |
| security | `.claude/skills/aiworkflow-requirements/references/security-*.md` | presign を gate 後に呼ぶ PII 境界 |
| database | `.claude/skills/aiworkflow-requirements/references/database-*.md` | member_photos batch query |

- `index.md` / `phase-1.md` / `phase-2.md`（§1/§2 契約コード）/ `phase-3.md`
- `apps/api/src/routes/admin/members.ts:289-318`（`resolvePhotoUrl` 先例。public 用に複製）
- `apps/api/src/lib/r2/member-photo-presign.ts`（`presignMemberPhotoGetUrl` / `MEMBER_PHOTO_PRESIGN_TTL_SECONDS`）

## 成果物

- Phase 5 実装差分方針（本ファイル）
- 上記「新規作成」「編集」一覧のコード（本実装サイクルで生成）

## 完了条件（DoD: Definition of Done）

- [ ] `mise exec -- pnpm typecheck` が green
- [ ] `mise exec -- pnpm lint` が green
- [ ] Phase 4 の lane A/B/C/D/E/F 全 test が PASS（RED → GREEN）
- [ ] 既存 public test（list / profile use-case / route）が非破壊で PASS
- [ ] `grep -rn "R2\|member_photos" apps/web/src` が 0 件（invariant #5: apps/web から R2/D1 直接アクセス無し）
- [ ] `PublicMemberProfileZ` が `.strict()` を維持している（lane A-6 PASS）
- [ ] 変更ファイルが本 Phase の新規/編集一覧と一致する（[Feedback RT-03]）

## 統合テスト連携

Phase 4 の RED テストが本 Phase で GREEN へ遷移する。Phase 6 が route resolver 内部分岐の fail path と回帰 guard を拡充する。Phase 9 が grep gate で invariant #5/#6/#7 を検証する。Phase 11 が visual evidence を取得する。
