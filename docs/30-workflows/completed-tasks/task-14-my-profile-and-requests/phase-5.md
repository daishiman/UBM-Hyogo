# Phase 5: API 契約（既存 surface・参照のみ）

[実装区分: 実装仕様書]

`/profile` から呼び出す既存 API endpoint を整理し、**追加・変更しないこと**を不変条件として固定する。
Phase 6（UI）と Phase 9（実装ガイド）が参照する契約。

---

## 1. 既存 endpoint surface 一覧

| endpoint (apps/web) | method | proxy 先 (apps/api) | 役割 |
|---------------------|--------|---------------------|------|
| `/api/me/[...path]` | GET / POST | `apps/api/src/routes/me/index.ts` | `/me`, `/me/profile` 等への透過 proxy |
| `/api/me/visibility-request` | POST | `apps/api/src/routes/me/services.ts` | 公開範囲申請 row 作成 |
| `/api/me/delete-request` | POST | 同上 | 削除申請 row 作成 |

**不変条件（CONST）:**
- `apps/api/src/routes/me/{index,services,schemas}.ts` の追加・変更 0 件
- `apps/web/app/api/me/*` 配下 handler 追加・変更 0 件
- 検証: `git diff dev...HEAD --name-only` に上記 path が現れないこと

---

## 2. `GET /me` 契約

### 2.1 Request

- method: GET
- headers: session cookie（`fetchAuthed` が透過）
- body: なし

### 2.2 Response（200）

```ts
interface MeSessionResponse {
  readonly memberId: string;
  readonly authGateState: "active" | "rules_declined" | "deleted";
  readonly displayName: string;
}
```

### 2.3 Error

| code | 状態 | UI 対応 |
|------|------|--------|
| 401 | 未認証 | `AuthRequiredError` throw → page.tsx で `redirect("/login?redirect=/profile")` |
| 5xx | サーバ障害 | error.tsx + Sentry |

---

## 3. `GET /me/profile` 契約

### 3.1 Request

- method: GET
- headers: session cookie

### 3.2 Response（200）

Phase 4 §1 の `MeProfileResponse` と同一。

### 3.3 Error

| code | 状態 | UI 対応 |
|------|------|--------|
| 401 | 未認証 | redirect |
| 404 | profile 未作成 | `notFound()` |
| 5xx | サーバ障害 | error.tsx |

---

## 4. `POST /me/visibility-request` 契約

### 4.1 Request

```ts
{
  desiredState: "hidden" | "public",
  reason?: string  // ≤500
}
```

content-type: `application/json`
session: cookie 経由

### 4.2 Response（200）

```ts
{ ok: true, requestId: string }
```

### 4.3 Error

| code | UI 対応 |
|------|--------|
| 400 | `<RequestErrorMessage>` で API エラー文言表示 |
| 401 | 1 度 retry → 失敗時 `router.replace("/login?redirect=/profile")` |
| 409 | 重複申請（既に pending あり） → `<RequestErrorMessage>` |
| 5xx | `<RequestErrorMessage>` + Sentry |

---

## 5. `POST /me/delete-request` 契約

### 5.1 Request

```ts
{
  reason?: string,       // ≤500
  confirmText: string    // "削除を申請する" 必須
}
```

### 5.2 Response（200）

```ts
{ ok: true, requestId: string }
```

### 5.3 Error

visibility-request と同等。`confirmText` 不一致時は client 側で submit させない（API には到達しない）。

---

## 6. fetch 呼び出し規約

```ts
// 全呼出は fetchAuthed 経由。
// component / client island は /api prefix を書かず、fetchAuthed が同一 origin proxy へ解決する。
import { fetchAuthed } from "@/src/lib/fetch/authed";

await fetchAuthed<MeSessionResponse>("/me");
await fetchAuthed<MeProfileResponse>("/me/profile");
await fetchAuthed<VisibilityRequestResponse>("/me/visibility-request", {
  method: "POST",
  body: JSON.stringify({ desiredState, note }),
});
await fetchAuthed<DeleteRequestResponse>("/me/delete-request", {
  method: "POST",
  body: JSON.stringify({ reason, confirmText }),
});
```

`fetchAuthed` 内部で `credentials: "include"` 相当の cookie 透過、401 時の `AuthRequiredError` throw が実装されていることを **前提**とする（実装は task-13 等で確立済）。
UI component と test は `fetchAuthed("/me/visibility-request")` / `fetchAuthed("/me/delete-request")` を期待値にする。`/api/me/*` は既存 proxy route の実体 path としてのみ扱い、component から直接 hardcode しない。

---

## 7. 契約検証コマンド

```bash
# api surface 不変の verification
git diff dev...HEAD --name-only | grep -E '^(apps/api/src/routes/me/|apps/web/app/api/me/)' && \
  echo "ERROR: api surface に変更が混入" || echo "OK"
```

CI gate / 手動 review 双方で実行。

---

## 8. 完了条件

- 4 endpoint の request/response/error がすべて Phase 6 component の fetch 呼出と整合
- `apps/api` および `apps/web/app/api/me/*` への変更が 0 であることを git diff で検証可能
- error code 別の UI 対応が Phase 6 / Phase 7 に反映済
