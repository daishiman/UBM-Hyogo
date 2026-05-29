# Phase 4: テスト作成（TDD Red）

> **[実装区分: 実装仕様書]**。Phase 5 実装前に全テストを RED 状態で作成し、期待ふるまいを仕様として固定する。

## 事前チェック（FB-MSO-002 準拠）

Phase 4 実装着手前に以下を確認すること。

```bash
# 1. 依存解決（pnpm workspace 全体）
mise exec -- pnpm install --force

# 2. shared パッケージのビルド（viewmodel.ts の型変更が先行依存）
mise exec -- pnpm --filter @ubm-hyogo/shared build

# 3. typecheck が事前に PASS していることを確認
mise exec -- pnpm typecheck
```

---

## 1. 追加する spec ファイル一覧

| ファイルパス | 実行 config | 対応テスト |
|---|---|---|
| `apps/api/src/lib/r2/__tests__/member-photo-presign.spec.ts` | `vitest.config.ts`（unit） | presign util unit テスト |
| `apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts` | `vitest.d1.config.ts`（D1） | route contract テスト（POST/DELETE/GET） |
| `packages/shared/src/zod/__tests__/viewmodel-photo.spec.ts` | `vitest.config.ts`（unit） | `AdminMemberDetailViewZ.photoUrl` parse テスト |
| `apps/web/src/features/admin/components/_members/__tests__/MemberAvatar.spec.tsx` | `vitest.config.ts`（unit） | Avatar/MemberAvatar render spec |

> 命名規約: invariant #8 に従い全ファイルを `*.spec.{ts,tsx}` とする。`*.test.*` は禁止。
> `member-photo.contract.spec.ts` は `vitest.d1.config.ts` の `D1_INCLUDE` に
> `"apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts"` を追加してから実行する。

---

## 2. presign unit テスト（`member-photo-presign.spec.ts`）

### 目的
`presignMemberPhotoGetUrl` が正しい URL を生成し、presign 失敗時に `null` を返すことを検証する。
D1/R2 の実バインディングは不要（`aws4fetch` の `AwsClient` をモックして SigV4 署名 query を確認）。

### テストケース

| ID | テスト名 | 入力 | 期待値 |
|---|---|---|---|
| PRESIGN-U-1 | 正常系: 署名 URL が生成される | deps = `{accountId:"acc",accessKeyId:"kid",secretAccessKey:"secret",bucket:"bucket"}`, objectKey = `members/m_001/avatar`, ttl = 300 | 戻り値が `https://acc.r2.cloudflarestorage.com/bucket/members/m_001/avatar` で始まる文字列（`X-Amz-Expires=300` を含む） |
| PRESIGN-U-2 | 署名クエリに `X-Amz-Expires=300` が含まれる | 同上 | URL を `new URL(result!)` でパースし `searchParams.get("X-Amz-Expires") === "300"` |
| PRESIGN-U-3 | `X-Amz-Signature` クエリパラメータが含まれる | 同上 | `searchParams.get("X-Amz-Signature")` が truthy |
| PRESIGN-U-4 | objectKey が URL エンコードされる | objectKey に空白を含む（`members/m 1/avatar`） | URL.pathname に `%20` が含まれる |
| PRESIGN-U-5 | deps 不正（空文字 accountId）で null 返却 | `accountId: ""` | 戻り値が `null` |
| PRESIGN-U-6 | deps 不正（空文字 accessKeyId）で null 返却 | `accessKeyId: ""` | 戻り値が `null` |
| PRESIGN-U-7 | aws4fetch が throw した場合 null 返却（fail-soft） | `AwsClient.sign` を `vi.fn().mockRejectedValueOnce(new Error("sign error"))` | 戻り値が `null`（throw しない） |
| PRESIGN-U-8 | TTL 0 で null 返却（バリデーション境界） | `ttlSeconds: 0` | 戻り値が `null` |

### 実装方針（spec ファイル骨格）

```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
// presignMemberPhotoGetUrl, MEMBER_PHOTO_OBJECT_KEY は未実装のため RED になる
import { presignMemberPhotoGetUrl, MEMBER_PHOTO_OBJECT_KEY } from "../member-photo-presign";

describe("presignMemberPhotoGetUrl", () => {
  const VALID_DEPS = {
    accountId: "acc123",
    accessKeyId: "AKID",
    secretAccessKey: "SECRET",
    bucket: "ubm-hyogo-member-photos-staging",
  } as const;

  it("PRESIGN-U-1: 正常系 — URL が r2.cloudflarestorage.com で始まる", async () => {
    const url = await presignMemberPhotoGetUrl(VALID_DEPS, "members/m_001/avatar", 300);
    expect(url).not.toBeNull();
    expect(url).toContain("acc123.r2.cloudflarestorage.com");
  });

  it("PRESIGN-U-2: X-Amz-Expires=300 を含む", async () => {
    const url = await presignMemberPhotoGetUrl(VALID_DEPS, "members/m_001/avatar", 300);
    const parsed = new URL(url!);
    expect(parsed.searchParams.get("X-Amz-Expires")).toBe("300");
  });
  // ... 以下 PRESIGN-U-3〜U-8
});

describe("MEMBER_PHOTO_OBJECT_KEY", () => {
  it("memberId からオブジェクトキーを生成する", () => {
    expect(MEMBER_PHOTO_OBJECT_KEY("m_001")).toBe("members/m_001/avatar");
  });
});
```

### RED 実行コマンド

```bash
# presign unit のみ実行（D1 不要、vitest.config.ts で実行）
mise exec -- pnpm --filter @ubm-hyogo/api \
  exec vitest run \
  apps/api/src/lib/r2/__tests__/member-photo-presign.spec.ts
# → import エラー（ファイル未作成）で RED になることを確認
```

---

## 3. route contract テスト（`member-photo.contract.spec.ts`）

### 目的
Hono app を Miniflare D1（`setupD1`）で動作させ、POST/DELETE/GET の HTTP 契約と副作用（D1 upsert/delete、R2 モック操作、audit log 記録）を検証する。

> R2 は Miniflare の `r2Buckets` オプションでインメモリ R2 を使用（Miniflare 3 対応）。
> `requireAdmin` 認証は `INTERNAL_AUTH_SECRET` ヘッダーをモック環境に設定して通過させる。

### テストケース

| ID | メソッド・パス | 入力 | 期待ステータス | 副作用確認 |
|---|---|---|---|---|
| ROUTE-C-1 | `POST /admin/members/:memberId/photo` | 正常 JPEG（≤256KB）、memberId 存在 | 200 `{ok:true}` | D1 `member_photos` に行が INSERT される、R2 に object が存在する、audit `admin.member.photo_uploaded` が記録される |
| ROUTE-C-2 | `POST .../photo` | ファイルサイズ 257KB（境界超過） | 413 | D1・R2・audit 変更なし |
| ROUTE-C-3 | `POST .../photo` | MIME `image/gif`（不許可） | 415 | D1・R2・audit 変更なし |
| ROUTE-C-4 | `POST .../photo` | memberId が D1 に存在しない | 404 | D1・R2・audit 変更なし |
| ROUTE-C-5 | `POST .../photo` | ファイルサイズ 256KB（上限境界・許容） | 200 `{ok:true}` | R2 put 成功 |
| ROUTE-C-6 | `DELETE /admin/members/:memberId/photo` | photo が存在する memberId | 200 `{ok:true}` | D1 行が削除される、R2 object が削除される、audit `admin.member.photo_deleted` が記録される |
| ROUTE-C-7 | `DELETE .../photo` | memberId が D1 に存在しない（または photo 行なし） | 404 | audit 変更なし |
| ROUTE-C-8 | `GET /admin/members/:memberId` | photo row あり、presign 成功（deps 有効） | 200 `AdminMemberDetailView`、`photoUrl` フィールド有 | presign util が呼ばれる |
| ROUTE-C-9 | `GET /admin/members/:memberId` | photo row なし | 200 `AdminMemberDetailView`、`photoUrl` フィールド無し（undefined） | presign util 不呼び出し |
| ROUTE-C-10 | `GET /admin/members/:memberId` | photo row あり、presign util が null 返却（fail-soft） | 200 `AdminMemberDetailView`（detail 本体 OK）、`photoUrl` フィールド無し | presign 失敗でも 500 にならない |

### 256KB 超過の boundary パターン（FB-UT-W3-HTTP）

| バイト数 | 期待 |
|---|---|
| 0 バイト | 400（空ファイル拒否） |
| 1 バイト | 200（最小許容） |
| 262144 バイト（= 256 * 1024） | 200（上限ちょうど、許容） |
| 262145 バイト（= 256 * 1024 + 1） | 413（1 バイト超過） |
| 1048576 バイト（= 1MB） | 413（明らかな超過） |

### spec ファイル骨格

```ts
// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../../repository/__tests__/_setup";
import { createAdminMembersRoute } from "../members";
// R2 mock は miniflare の r2Buckets オプション経由

describe("POST /admin/members/:memberId/photo contract", () => {
  let env: InMemoryD1;
  beforeEach(async () => { env = await setupD1(); });

  it("ROUTE-C-1: 正常 JPEG ≤256KB → 200 + D1 upsert + R2 put + audit", async () => {
    // multipart body を FormData で組み立て
    // ...
    expect(res.status).toBe(200);
    // D1 member_photos 行確認
    // R2 object 存在確認
    // audit_log action='admin.member.photo_uploaded' 確認
  });
  // ... 以下 ROUTE-C-2〜C-10
});
```

### RED 実行コマンド（D1 config 必須）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api \
  exec vitest run --config ../../vitest.d1.config.ts \
  apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts
# → import エラー（route 未実装）で RED になることを確認
```

---

## 4. shared schema テスト（`viewmodel-photo.spec.ts`）

### 目的
`AdminMemberDetailViewZ` の `photoUrl` optional フィールドが `.strict()` 維持で parse できることを確認。
現状は `photoUrl` が無いため全ケースが RED になる。

### テストケース

| ID | 入力 | 期待 |
|---|---|---|
| SCHEMA-P-1 | 既存の合法オブジェクト（photoUrl なし） | `safeParse` が `success: true`（後方互換 = .strict() 維持） |
| SCHEMA-P-2 | `photoUrl: "https://example.com/photo.jpg"` を追加 | `success: true`、`data.photoUrl === "https://example.com/photo.jpg"` |
| SCHEMA-P-3 | `photoUrl: "not-a-url"` を設定 | `success: false`（`z.string().url()` 違反） |
| SCHEMA-P-4 | `photoUrl: null` を設定 | `success: false`（null は optional だが型外） |
| SCHEMA-P-5 | 未知フィールド `unknownField: "x"` を追加（.strict() 回帰） | `success: false` |

### RED 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/shared \
  exec vitest run \
  packages/shared/src/zod/__tests__/viewmodel-photo.spec.ts
```

---

## 5. Avatar/MemberAvatar render spec（`MemberAvatar.spec.tsx`）

### 目的
`Avatar` の `src` prop 追加と `MemberAvatar` の `photoUrl` prop 追加に対する render 動作を確認。
現状は `src` / `photoUrl` prop が無いため全ケースが RED になる。

> テスト環境: `jsdom`（vitest.config.ts 既定。`// @vitest-environment jsdom` コメント不要）。
> React render には `@testing-library/react` の `render` / `screen` を使用。

### テストケース

| ID | テスト名 | 条件 | 期待 DOM |
|---|---|---|---|
| AVATAR-R-1 | src なし → initial + hue div | `<Avatar name="田中" size="md" />` | `role="img"` の `<div>` が存在し `<img>` は存在しない |
| AVATAR-R-2 | src あり → `<img>` が render される | `<Avatar name="田中" src="https://r2.test/photo.jpg" size="md" />` | `<img>` が存在し `alt="田中"` |
| AVATAR-R-3 | src あり onError → hue div に fallback | AVATAR-R-2 後に `img.dispatchEvent(new Event("error"))` | `<img>` が消え `role="img"` div に戻る（または img が hidden になる） |
| AVATAR-R-4 | src なし / 失敗後 → 現行 DOM と同一（pixel diff 0 相当） | src なし（既存 hue path） | `data-hue` 属性が数値、`data-size="md"` が存在（AC-4 DOM 互換） |
| AVATAR-R-5 | MemberAvatar photoUrl なし → hue placeholder | `<MemberAvatar memberId="m_001" fullName="田中" />` | `role="img"` の div が存在し `<img>` は存在しない |
| AVATAR-R-6 | MemberAvatar photoUrl あり → img render | `<MemberAvatar memberId="m_001" fullName="田中" photoUrl="https://r2.test/p.jpg" />` | `<img>` が存在 |

### spec ファイル骨格

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Avatar } from "../../../../../components/ui/Avatar";
import { MemberAvatar } from "../MemberAvatar";

describe("Avatar", () => {
  it("AVATAR-R-1: src なし → img が render されない", () => {
    render(<Avatar name="田中" />);
    expect(screen.queryByRole("img", { hidden: false })).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });

  it("AVATAR-R-2: src あり → img が render される", () => {
    render(<Avatar name="田中" src="https://r2.test/photo.jpg" />);
    const img = document.querySelector("img") as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.alt).toBe("田中");
  });
  // ... 以下 AVATAR-R-3〜R-6
});
```

### RED 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web \
  exec vitest run \
  apps/web/src/features/admin/components/_members/__tests__/MemberAvatar.spec.tsx
```

---

## 6. 命名規約整合確認チェックリスト

実装前に以下を確認し、Phase 4 完了時に全チェック済みとすること。

- [ ] 全 spec ファイルが `*.spec.{ts,tsx}`（`*.test.*` は使用していない）— invariant #8
- [ ] D1 関連の contract spec が `vitest.d1.config.ts` の `D1_INCLUDE` に追加されている
- [ ] audit action 文字列が `admin.member.photo_uploaded` / `admin.member.photo_deleted` であることをテスト内に文字列リテラルで固定している
- [ ] 256KB 境界パターン（0 / 1 / 262144 / 262145 / 1MB バイト）が ROUTE-C-2 と合わせて網羅されている
- [ ] `MemberAvatar.spec.tsx` が既存 `MemberAvatar.tsx` と同一ディレクトリの `__tests__/` 配下に置かれている（Phase 1 artifact 命名準拠）

---

## 完了条件（Phase 4）

- [ ] 4 つの spec ファイルが作成されており、全ケースが RED 状態（import/型エラー）である
- [ ] presign unit（PRESIGN-U-1〜U-8）が spec として記述されている
- [ ] route contract（ROUTE-C-1〜C-10）が spec として記述されている
- [ ] shared schema（SCHEMA-P-1〜P-5）が spec として記述されている
- [ ] Avatar/MemberAvatar render（AVATAR-R-1〜R-6）が spec として記述されている
- [ ] 256KB 境界パターン（FB-UT-W3-HTTP）が route contract に列挙されている
- [ ] `vitest.d1.config.ts` の `D1_INCLUDE` に `member-photo.contract.spec.ts` のパスが追加されている
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/shared build` が事前 PASS している
- [ ] `pnpm typecheck` が事前 PASS している（Phase 4 の spec 追加後は型エラーが出て OK → Phase 5 実装後に GREEN になる）

## メタ情報
workflow_state: `spec_created` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
実装前に RED テストとして API、schema、UI、visual の期待動作を固定する。

## 実行タスク
- presign unit と route contract を作成する。
- avatar render と shared schema のテストを作成する。

## 参照資料
- `phase-2.md`
- `phase-3.md`

## 成果物
- Phase 4 TDD Red 仕様

## 統合テスト連携
Phase 5 実装は本 Phase の RED テストを GREEN にすることを完了条件にする。
