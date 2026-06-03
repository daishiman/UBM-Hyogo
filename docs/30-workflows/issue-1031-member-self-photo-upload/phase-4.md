# Phase 4: テスト作成（TDD Red）

> **[実装区分: 実装仕様書]**。Phase 5 実装前に全テストを RED 状態で作成し、期待ふるまいを仕様として固定する。

## 事前チェック（MINOR-3 解消 + 依存確認）

Phase 4 実装着手前に以下を確認すること。

```bash
# 1. パッケージ filter 名確認（MINOR-3 解消）
#    apps/api → @ubm-hyogo/api、apps/web → @ubm-hyogo/web、packages/shared → @ubm-hyogo/shared
grep '"name"' apps/api/package.json apps/web/package.json packages/shared/package.json

# 2. 依存解決
mise exec -- pnpm install --force

# 3. shared パッケージビルド（viewmodel 型変更が先行依存）
mise exec -- pnpm --filter @ubm-hyogo/shared build

# 4. typecheck が事前 PASS していることを確認（spec 追加後は RED になって OK）
mise exec -- pnpm typecheck
```

---

## 1. 追加する spec ファイル一覧

| ファイルパス | 実行 config | 対応テスト |
|---|---|---|
| `apps/api/src/routes/me/__tests__/photo.route.spec.ts` | `vitest.d1.config.ts`（D1） | `/me/photo` route contract（POST/DELETE） + `/me/profile` photoUrl 拡張 |
| `apps/api/src/repository/__tests__/memberPhotos.source.spec.ts` | `vitest.d1.config.ts`（D1） | `source` 列 roundtrip / migration 0023 shape / admin backfill |
| `apps/web/app/(member)/profile/_components/__tests__/PhotoUpload.client.component.spec.tsx` | `vitest.config.ts`（unit/jsdom） | PhotoUpload 状態機械 / a11y / ロック解放 |
| `apps/web/app/api/me/photo/__tests__/route.spec.ts` | `vitest.config.ts`（unit） | proxy route の multipart 透過 / DELETE 転送 / ステータス透過 |

> 命名規約: invariant #8 に従い全ファイルを `*.spec.{ts,tsx}` とする。`*.test.*` は禁止。
> D1 関連の spec は `vitest.d1.config.ts` の `D1_INCLUDE` に両ファイルのパスを追加してから実行する。

---

## 2. `/me/photo` route contract テスト（`photo.route.spec.ts`）

### 目的

Hono app を Miniflare D1（`setupD1`）で動作させ、`POST /me/photo` / `DELETE /me/photo` の HTTP 契約と副作用（D1 upsert/delete、R2 モック操作、audit log 記録）を検証する。
また `GET /me/profile` の `photoUrl` fail-soft 拡張が正しく機能することも確認する。

> 認証は `sessionGuard` の `resolveSession` を mock して通過させる。
> `requireRulesConsent` は `rulesConsent` フィールドを D1 member row にセットして通過 / 未セットで 403 を確認する。
> `rateLimitSelfRequest` は D1 rate limit カウンタが閾値（5回）に達した状態で 429 を確認する。
> R2 は Miniflare の `r2Buckets` オプションでインメモリ R2 を使用。

### テストケース — POST /me/photo

| ID | テスト名 | 入力 | 期待ステータス | 副作用確認 |
|---|---|---|---|---|
| ME-PHOTO-C-1 | 正常系: JPEG 100KB self-upload | 認証済みセッション・rulesConsent 済・JPEG 100KB | 200 `{ok:true}` | D1 `member_photos` に `source='self'` で upsert される。R2 object が存在する。audit `member.photo_uploaded` が `actor_email=session_email` で記録される |
| ME-PHOTO-C-2 | 正常系: PNG 1バイト（最小許容） | PNG 1バイト | 200 `{ok:true}` | R2 put 成功・D1 upsert 成功 |
| ME-PHOTO-C-3 | 正常系: WebP 256KB（上限境界） | WebP 262144バイト | 200 `{ok:true}` | R2 put 成功 |
| ME-PHOTO-C-4 | file フィールド不在 | multipart body に `file` フィールドなし | 400 | D1・R2・audit 変更なし |
| ME-PHOTO-C-5 | file 空（0バイト） | File オブジェクト byteLength=0 | 400 | D1・R2・audit 変更なし |
| ME-PHOTO-C-6 | MIME 不許可（image/gif） | `image/gif` MIME | 415 | D1・R2・audit 変更なし |
| ME-PHOTO-C-7 | MIME 不許可（application/pdf） | `application/pdf` | 415 | 変更なし |
| ME-PHOTO-C-8 | サイズ超過（262145バイト） | 262145バイト JPEG | 413 | D1・R2・audit 変更なし |
| ME-PHOTO-C-9 | 未認証（sessionGuard が 401） | Authorization ヘッダーなし | 401 | 変更なし |
| ME-PHOTO-C-10 | rulesConsent 未同意（requireRulesConsent が 403） | rulesConsent=null の member | 403 `RULES_CONSENT_REQUIRED` | D1・R2 変更なし |
| ME-PHOTO-C-11 | rate limit 超過（429） | rate limit カウンタ = 5（閾値） | 429 | D1・R2・audit 変更なし |
| ME-PHOTO-C-12 | R2 binding 無し（503） | `MEMBER_PHOTOS` binding undefined | 503 | D1 変更なし（R2 put 前に返す） |
| ME-PHOTO-C-13 | authorization: body/query に他人の memberId を混入しても自分の row のみ書く | multipart body に `memberId=other_id` を追加、query に `?memberId=other_id` を追加 | 200 | D1 に `other_id` の行が作られず、`session.user.memberId` の行のみ upsert される（AC-2 必須ケース） |

### テストケース — DELETE /me/photo

| ID | テスト名 | 入力 | 期待ステータス | 副作用確認 |
|---|---|---|---|---|
| ME-PHOTO-C-14 | 正常系: photo 存在 → 削除 | D1 に photo row 有、R2 に object 有 | 200 `{ok:true}` | D1 行削除・R2 object 削除・audit `member.photo_deleted` 記録 |
| ME-PHOTO-C-15 | photo 未登録（404） | D1 に photo row 無 | 404 | audit 変更なし |
| ME-PHOTO-C-16 | 未認証（401） | セッションなし | 401 | 変更なし |
| ME-PHOTO-C-17 | DELETE は rulesConsent 不要 | rulesConsent=null だが DELETE | 200（同意ゲートを通過） | photo 削除される |
| ME-PHOTO-C-18 | authorization: DELETE でも自分の row のみ削除（path に memberId 無し） | session.user.memberId のみ使用確認 | 200 | `session.user.memberId` の行のみ削除（他 member の行は変化なし）（AC-2 必須ケース） |

### テストケース — GET /me/profile の photoUrl 拡張

| ID | テスト名 | セットアップ | 期待 |
|---|---|---|---|
| ME-PHOTO-C-19 | photo row あり + presign 成功 → `photoUrl` 同梱 | D1 に photo row あり。env に R2_ACCOUNT_ID 等設定 | `200`、`body.photoUrl` が有効な URL 文字列 |
| ME-PHOTO-C-20 | photo row なし → `photoUrl` 省略（fail-soft） | D1 に photo row なし | `200`、`body.photoUrl === undefined` |
| ME-PHOTO-C-21 | photo row あり + presign secret 未設定 → `photoUrl` 省略（fail-soft） | `R2_ACCOUNT_ID` = undefined | `200`（500 にならない）、`body.photoUrl === undefined` |

### 境界パターン補足（サイズ）

| バイト数 | 期待 |
|---|---|
| 0 バイト | 400（空ファイル拒否）— ME-PHOTO-C-5 |
| 1 バイト | 200（最小許容）— ME-PHOTO-C-2 |
| 262144 バイト（= 256 × 1024） | 200（上限ちょうど、許容）— ME-PHOTO-C-3 |
| 262145 バイト（= 256 × 1024 + 1） | 413（1バイト超過）— ME-PHOTO-C-8 |

### spec ファイル骨格

```ts
// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupD1, type InMemoryD1 } from "../../../repository/__tests__/_setup";
import { createMeRoute } from "../index";

// 未実装のため全ケースが RED になる（import エラー or ルート未存在）
describe("POST /me/photo route contract", () => {
  let env: InMemoryD1;
  beforeEach(async () => { env = await setupD1(); });

  it("ME-PHOTO-C-1: 正常 JPEG self-upload → 200 + source='self' + audit", async () => {
    const formData = new FormData();
    formData.append("file", new File([new Uint8Array(1024)], "photo.jpg", { type: "image/jpeg" }));
    // createMeRoute を呼び出し、sessionGuard mock で認証通過
    // ...
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
    // D1 member_photos の source = 'self' を確認
    // audit_log action = 'member.photo_uploaded' を確認
  });

  it("ME-PHOTO-C-13: 他人 memberId を body/query に混入しても自分の row のみ書く", async () => {
    // query: ?memberId=other_member_id、multipart body にも memberId フィールド追加
    // session.user.memberId のみが upsert されることを D1 で確認
  });
  // ... ME-PHOTO-C-2〜C-21
});

describe("DELETE /me/photo route contract", () => {
  // ME-PHOTO-C-14〜C-18
});

describe("GET /me/profile photoUrl 拡張", () => {
  // ME-PHOTO-C-19〜C-21
});
```

### RED 実行コマンド

```bash
# D1 config 必須
mise exec -- pnpm --filter @ubm-hyogo/api \
  exec vitest run --config ../../vitest.d1.config.ts \
  apps/api/src/routes/me/__tests__/photo.route.spec.ts
# → import エラー（/me/photo route 未実装）で RED になることを確認
```

---

## 3. repository source roundtrip テスト（`memberPhotos.source.spec.ts`）

### 目的

migration 0023 の `source` 列が additive に追加され、`upsertMemberPhoto` / `getMemberPhoto` の `source` roundtrip が正しく動作することを確認する。
また既存行（source なし）を migration 適用後に SELECT すると `source='admin'` が返ることを確認する（DEFAULT 'admin' backfill の検証）。

### テストケース

| ID | テスト名 | 入力 | 期待値 |
|---|---|---|---|
| REPO-SRC-1 | `upsertMemberPhoto` に `source:'self'` を渡すと `getMemberPhoto` が `source:'self'` を返す | `source: "self"` | `getMemberPhoto().source === "self"` |
| REPO-SRC-2 | `upsertMemberPhoto` に `source:'admin'` を渡すと `getMemberPhoto` が `source:'admin'` を返す | `source: "admin"` | `getMemberPhoto().source === "admin"` |
| REPO-SRC-3 | migration 0023 適用後、既存行（0022 で insert）を SELECT すると `source='admin'` | 0022 のみ適用後 `INSERT`、0023 適用後 `SELECT` | `getMemberPhoto().source === "admin"`（DEFAULT backfill） |
| REPO-SRC-4 | migration 0023 の DDL shape（`source TEXT NOT NULL DEFAULT 'admin'`）を確認 | `PRAGMA table_info(member_photos)` | `name='source'`、`type='TEXT'`、`notnull=1`、`dflt_value="'admin'"` |
| REPO-SRC-5 | `source` に不明値が DB に入っても `getMemberPhoto` が `'admin'` にフォールバックする | DB に直接 `source='legacy'` を INSERT | `getMemberPhoto().source === "admin"`（"self" 以外は "admin" 正規化） |
| REPO-SRC-6 | admin route 側の upsert（source:'admin' 明示）が既存行を上書きし source='admin' が維持される | `source:'self'` で upsert 後、`source:'admin'` で upsert | `getMemberPhoto().source === "admin"` |
| REPO-SRC-7 | `deleteMemberPhoto` 後に `getMemberPhoto` が `null` を返す | upsert → delete | `getMemberPhoto() === null` |
| REPO-SRC-8 | upsert 連続（source 変化）で last-write-wins が成立する | 1回目 `source:'admin'`、2回目 `source:'self'` | `getMemberPhoto().source === "self"` |

### spec ファイル骨格

```ts
// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1 } from "./_setup";
// 未実装のため source 引数が無く RED になる
import { upsertMemberPhoto, getMemberPhoto, deleteMemberPhoto } from "../memberPhotos";

describe("memberPhotos source roundtrip（migration 0023）", () => {
  let env: Awaited<ReturnType<typeof setupD1>>;
  beforeEach(async () => { env = await setupD1(); });

  it("REPO-SRC-1: source='self' roundtrip", async () => {
    const db = env.ctx;
    await upsertMemberPhoto(db, {
      memberId: "m_001",
      objectKey: "members/m_001/avatar",
      contentType: "image/jpeg",
      byteSize: 1024,
      uploadedBy: "member@example.com",
      source: "self",   // ← 新規引数（現行実装に無いため RED）
    });
    const row = await getMemberPhoto(db, "m_001" as any);
    expect(row?.source).toBe("self");
  });
  // ... REPO-SRC-2〜8
});
```

### RED 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api \
  exec vitest run --config ../../vitest.d1.config.ts \
  apps/api/src/repository/__tests__/memberPhotos.source.spec.ts
# → upsertMemberPhoto の source 引数未定義で RED
```

---

## 4. PhotoUpload コンポーネント テスト（`PhotoUpload.client.component.spec.tsx`）

### 目的

`PhotoUpload.client.tsx` の状態機械（idle→selected→uploading→success/error、delete confirm→deleting）、
ロック解放（try/finally）、client 事前 MIME/size チェック、a11y 属性を確認する。

> テスト環境: jsdom（vitest.config.ts 既定）
> React render には `@testing-library/react` の `render` / `screen` / `fireEvent` / `userEvent` を使用。
> `uploadOwnPhoto` / `deleteOwnPhoto` は `vi.mock('../../../../../lib/api/me-photo-client')` で mock する。

### テストケース — 状態機械

| ID | テスト名 | 操作 | 期待 DOM / 状態 |
|---|---|---|---|
| PHOTO-UP-1 | idle 状態: file input と avatar が render される | 初期 render（`photoUrl` なし） | `<input type="file">` が存在する。`role="img"` の div が存在し `<img>` は存在しない（hue placeholder） |
| PHOTO-UP-2 | idle 状態: `photoUrl` あり → Avatar が `<img>` を render | 初期 render（`photoUrl` 有） | `<img>` が存在する |
| PHOTO-UP-3 | file 選択 → selected 状態 | `<input type="file">` に有効 JPEG をセット | UI が "選択中" / selected 状態を示す。upload ボタンまたは自動 upload トリガが存在する |
| PHOTO-UP-4 | upload 中（uploading）→ input が disabled | `uploadOwnPhoto` を pending に mock して file 選択 | `<input type="file">` が `disabled`。重複送信防止 |
| PHOTO-UP-5 | upload 成功 → success 状態（router.refresh 呼び出し） | `uploadOwnPhoto` を resolve mock | `router.refresh()` が呼ばれる。成功メッセージか success 状態が確認できる |
| PHOTO-UP-6 | upload エラー後 → idle に戻り再 upload 可能（ロック解放） | `uploadOwnPhoto` を reject mock | エラーが表示される。再度 file 選択・upload が可能（`<input>` が disabled ではない）。**try/finally でロック解放されていることの確認** |
| PHOTO-UP-7 | delete ボタン（photo あり）→ confirm Modal 表示 | `hasPhoto=true` で render、delete ボタンクリック | confirm Modal（または confirm dialog）が表示される |
| PHOTO-UP-8 | delete confirm → deleting 状態（deleteOwnPhoto 呼び出し） | confirm を承諾 | `deleteOwnPhoto()` が呼ばれる。deleting 中は delete ボタンが disabled |
| PHOTO-UP-9 | delete 成功 → router.refresh | `deleteOwnPhoto` を resolve mock | `router.refresh()` が呼ばれる |
| PHOTO-UP-10 | delete エラー後 → ロック解放・再削除可能 | `deleteOwnPhoto` を reject mock | エラー表示。delete ボタンが再度 enabled になる（try/finally ロック解放） |
| PHOTO-UP-11 | hasPhoto=false → delete ボタンが非表示 | `photoUrl` なしで render | delete ボタンが DOM に存在しない |

### テストケース — client 事前 MIME/size チェック

| ID | テスト名 | 入力ファイル | 期待 |
|---|---|---|---|
| PHOTO-UP-12 | MIME 不許可ファイル（image/gif）→ client でエラー即時表示 | `type='image/gif'` の File | upload が呼ばれない。エラーメッセージが表示される |
| PHOTO-UP-13 | サイズ超過（262145バイト）→ client でエラー即時表示 | 262145バイトの Uint8Array | upload が呼ばれない。エラーメッセージが表示される |
| PHOTO-UP-14 | 許容 MIME（image/png）→ client チェック通過 | `type='image/png'` の File（1バイト） | `uploadOwnPhoto` が呼ばれる（server に投げる） |

### テストケース — a11y

| ID | テスト名 | 期待 |
|---|---|---|
| PHOTO-UP-15 | `<input type="file">` に `aria-label` か `<label>` による accessible name がある | accessible name が空でない |
| PHOTO-UP-16 | upload 中の状態を `role="status"` か `aria-live` で通知 | loading 状態に `role="status"` または `aria-live` 属性の要素が存在する |
| PHOTO-UP-17 | エラー時に `role="alert"` で通知 | エラー状態に `role="alert"` 属性の要素が存在する |

### spec ファイル骨格

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
// 未実装のため import エラーで RED になる
import { PhotoUpload } from "../PhotoUpload.client";

vi.mock("../../../../../lib/api/me-photo-client", () => ({
  uploadOwnPhoto: vi.fn(),
  deleteOwnPhoto: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe("PhotoUpload コンポーネント", () => {
  it("PHOTO-UP-1: idle 状態 — file input と hue placeholder が render される", () => {
    render(<PhotoUpload memberId="m_001" name="田中" />);
    expect(document.querySelector('input[type="file"]')).not.toBeNull();
    expect(screen.queryByRole("img")).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });

  it("PHOTO-UP-6: upload エラー後のロック解放（try/finally）", async () => {
    const { uploadOwnPhoto } = await import("../../../../../lib/api/me-photo-client");
    vi.mocked(uploadOwnPhoto).mockRejectedValueOnce(new Error("upload failed"));
    render(<PhotoUpload memberId="m_001" name="田中" />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    // ファイル選択 → upload 試行 → エラー → ロック解放
    fireEvent.change(input, {
      target: {
        files: [new File([new Uint8Array(1024)], "photo.jpg", { type: "image/jpeg" })],
      },
    });
    await waitFor(() => {
      expect(input).not.toBeDisabled();
    });
  });
  // ... PHOTO-UP-2〜17
});
```

### RED 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web \
  exec vitest run \
  "apps/web/app/(member)/profile/_components/__tests__/PhotoUpload.client.component.spec.tsx"
# → import エラー（PhotoUpload 未実装）で RED になることを確認
```

---

## 5. proxy route テスト（`route.spec.ts`）

### 目的

`apps/web/app/api/me/photo/route.ts` の Next.js Route Handler が、
multipart POST を API Worker の `/me/photo` へ透過転送し、status / body をそのまま返すことを確認する。
DELETE も同様に転送されることを確認する（MINOR-2 解消: proxy 透過を spec で先固定）。

> `fetch` を `vi.spyOn(global, 'fetch').mockResolvedValueOnce(...)` で mock して、
> API Worker への実際のリクエストを発生させずに proxy 動作のみを検証する。

### テストケース

| ID | テスト名 | mock レスポンス | 期待 |
|---|---|---|---|
| PROXY-1 | POST multipart → API Worker に multipart で転送される | API Worker 200 `{ok:true}` | Response status=200、body `{ok:true}` |
| PROXY-2 | POST 時に cookie が転送される | 任意 200 | fetch 呼び出し時のリクエストに `Cookie` ヘッダーが含まれる |
| PROXY-3 | API Worker 413 → proxy が 413 をそのまま返す | API Worker 413 | Response status=413 |
| PROXY-4 | API Worker 415 → proxy が 415 をそのまま返す | API Worker 415 | Response status=415 |
| PROXY-5 | API Worker 401 → proxy が 401 をそのまま返す | API Worker 401 | Response status=401 |
| PROXY-6 | API Worker 403 → proxy が 403 をそのまま返す | API Worker 403 | Response status=403 |
| PROXY-7 | API Worker 429 → proxy が 429 をそのまま返す | API Worker 429 | Response status=429 |
| PROXY-8 | DELETE → API Worker に DELETE で転送される | API Worker 200 `{ok:true}` | fetch の method が `DELETE`。Response status=200 |
| PROXY-9 | DELETE 成功後 body が `{ok:true}` を返す | API Worker 200 `{ok:true}` | body `{ok:true}` |
| PROXY-10 | DELETE API Worker 404 → proxy が 404 をそのまま返す | API Worker 404 | Response status=404 |

### spec ファイル骨格

```ts
// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
// 未実装のため import エラーで RED になる
import { POST, DELETE } from "../route";

afterEach(() => vi.restoreAllMocks());

describe("proxy: POST /api/me/photo → API Worker /me/photo", () => {
  it("PROXY-1: multipart POST → API Worker に 200 で透過される", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const formData = new FormData();
    formData.append("file", new File([new Uint8Array(1024)], "p.jpg", { type: "image/jpeg" }));
    const req = new Request("http://localhost/api/me/photo", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
  // ... PROXY-2〜10
});
```

### RED 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web \
  exec vitest run \
  "apps/web/app/api/me/photo/__tests__/route.spec.ts"
# → import エラーで RED になることを確認
```

---

## 6. 命名規約整合確認チェックリスト

実装前に以下を確認し、Phase 4 完了時に全チェック済みとすること。

- [ ] 全 spec ファイルが `*.spec.{ts,tsx}`（`*.test.*` は使用していない）— invariant #8
- [ ] D1 関連の 2 spec が `vitest.d1.config.ts` の `D1_INCLUDE` に追加されている
- [ ] audit action 文字列が `member.photo_uploaded` / `member.photo_deleted`（admin 系の `admin.member.*` と区別）であることをテスト内に文字列リテラルで固定している
- [ ] AC-2 必須ケース（ME-PHOTO-C-13 / ME-PHOTO-C-18）が spec に含まれており、path に memberId を含めない実装を検証する構造になっている
- [ ] ロック解放（try/finally）を検証する PHOTO-UP-6 / PHOTO-UP-10 が spec に含まれている
- [ ] client 事前チェック（PHOTO-UP-12〜14）と server 側検証（ME-PHOTO-C-6〜8）が二重で網羅されている
- [ ] `PhotoUpload.client.component.spec.tsx` が `_components/__tests__/` 配下に置かれている（Phase 1 artifact 命名準拠）

---

## 完了条件（Phase 4）

- [ ] 4 つの spec ファイルが作成されており、全ケースが RED 状態（import/型エラー）である
- [ ] `/me/photo` route contract（ME-PHOTO-C-1〜C-21）が spec として記述されている
- [ ] repository source roundtrip（REPO-SRC-1〜8）が spec として記述されている
- [ ] PhotoUpload コンポーネント（PHOTO-UP-1〜17）が spec として記述されている
- [ ] proxy route（PROXY-1〜10）が spec として記述されている
- [ ] AC-2 authorization ケース（他人 memberId 混入しても自分の row のみ触る）が必須ケースとして含まれている
- [ ] 未認証 401 ケースが POST・DELETE 両方に含まれている
- [ ] サイズ境界（0 / 1 / 262144 / 262145 バイト）が route contract に列挙されている
- [ ] `vitest.d1.config.ts` の `D1_INCLUDE` に `photo.route.spec.ts` と `memberPhotos.source.spec.ts` のパスが追加されている
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/shared build` が事前 PASS している
- [ ] `pnpm typecheck` が事前 PASS している（Phase 4 spec 追加後は型エラーが出て OK → Phase 5 実装後に GREEN になる）

## メタ情報
workflow_state: `implemented_local_runtime_pending` / taskType: `implementation` / visualEvidence: `VISUAL`

## 目的
実装前に RED テストとして API contract・repo source・proxy 透過・UI 状態機械の期待動作を固定する。

## 参照資料
- `phase-2.md`
- `phase-3.md`

## 統合テスト連携
Phase 5 実装は本 Phase の RED テストを GREEN にすることを完了条件にする。
