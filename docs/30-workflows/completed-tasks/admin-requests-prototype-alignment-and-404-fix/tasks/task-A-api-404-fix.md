# Task A — `/admin/requests` 404 根本原因修正 + regression spec

> CONST_004: 実装仕様書 / CONST_005 必須項目を全て満たす。

| 項目 | 値 |
|------|-----|
| Lane | Lane-A |
| 区分 | API（apps/api） |
| spec_status | spec_created |
| 想定差分行数 | ~80 行（spec ~60 + 修正分 0〜20） |

---

## 1. 変更対象ファイル

| パス | 種別 | 変更概要 |
|------|------|----------|
| `apps/api/src/routes/admin/requests.spec.ts` | 新規 or 追記 | TC-A-01〜06 |
| `apps/api/src/routes/admin/requests.ts` | 確認 | 既存 `app.get("/requests", ...)`（変更なしを期待。RED で問題発見時のみ修正） |
| `apps/api/src/index.ts:281` | 確認 | `app.route("/admin", adminRequestsRoute)` mount を確認（変更なしを期待） |
| `apps/web/wrangler.toml` | 条件付き修正 | URL drift 検出時のみ `INTERNAL_API_BASE_URL` 修正 |
| **deploy 作業**（コード変更ではない） | 条件付き | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`（user 明示承認後） |

---

## 2. 関数シグネチャ（変更なし — 確認のみ）

`apps/api/src/routes/admin/requests.ts`:

```ts
export function createAdminRequestsRoute(): Hono<{
  Bindings: AdminRouteEnv;
  Variables: RequireAuthVariables & WriteTagNoteProviderVariables;
}>;

// 内部:
// app.get("/requests", async (c) => Promise<Response>);   // path: /admin/requests
// app.post("/requests/:noteId/resolve", async (c) => Promise<Response>);
```

---

## 3. 入出力契約

### GET /admin/requests

**入力**:
- query: `status?: "pending"|"resolved"|"rejected" (default pending)`, `type: "visibility_request"|"delete_request"`, `limit?: number ≤ 100 (default 50)`, `cursor?: string`
- header: `Authorization: Bearer <admin JWT>` または `Cookie: __Secure-authjs.session-token=<...>` または `x-internal-auth: <secret>`

**出力（200）**:
```json
{
  "ok": true,
  "items": [{ "noteId": "...", "memberId": "...", "noteType": "visibility_request", "requestStatus": "pending", "requestedAt": "ISO", "requestedReason": null, "requestedPayload": null, "memberSummary": { "memberId": "...", "publicHandle": null, "publishState": "live", "isDeleted": false } }],
  "nextCursor": null,
  "appliedFilters": { "status": "pending", "type": "visibility_request" }
}
```

**エラー**: 400（zod validation）/ 401（no/invalid auth）/ 403（non-admin）/ 500（AUTH_SECRET 不在）。

---

## 4. テスト方針

### 4.1 静的解析（実装前）

```bash
# 仮説 H3（mount 衝突）の最終確認
grep -n 'app.route\|app.get\|app.post' apps/api/src/index.ts | grep -i admin
grep -n 'app.get\|app.post\|app.use\|app.route' apps/api/src/routes/admin/requests.ts
```

期待: `/admin/requests` を吸う先行 handler が存在しないこと。

### 4.2 staging 切り分け（root cause 確定）

```bash
# 1) 404 再現確認（admin JWT を別途取得）
curl -i "https://ubm-hyogo-api-staging.daishimanju.workers.dev/admin/requests?status=pending&type=visibility_request" \
  -H "Authorization: Bearer ${ADMIN_JWT}"

# 2) deploy 履歴確認
bash scripts/cf.sh wrangler deployments list --name ubm-hyogo-api-staging

# 3) runtime trace
bash scripts/cf.sh wrangler tail ubm-hyogo-api-staging --env staging
```

### 4.3 RED → GREEN

```bash
# RED: 既存ファイル不在 or 新 case 追加で fail
mise exec -- pnpm --filter @repo/api test -- requests

# GREEN: 必要なら route or wrangler config 修正
mise exec -- pnpm --filter @repo/api test -- requests
```

### 4.4 regression spec の構造

`apps/api/src/routes/admin/requests.spec.ts`:

```ts
import { describe, it, expect, beforeAll } from "vitest";
import { app } from "../../index"; // または既存 harness
import { signTestJwt } from "../../test-utils/jwt"; // 既存ヘルパ準拠
import { buildTestEnv } from "../../test-utils/env"; // 既存ヘルパ準拠

describe("admin requests route — TC-A regression", () => {
  it("TC-A-01: GET /admin/requests with admin JWT returns 200", async () => {
    const jwt = await signTestJwt({ role: "admin" });
    const res = await app.fetch(
      new Request("https://x/admin/requests?type=visibility_request", {
        headers: { Authorization: `Bearer ${jwt}` },
      }),
      buildTestEnv(),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.appliedFilters).toEqual({
      status: "pending",
      type: "visibility_request",
    });
  });

  it("TC-A-02: no auth → 401", async () => { /* ... */ });
  it("TC-A-03: non-admin JWT → 403", async () => { /* ... */ });
  it("TC-A-04: invalid type → 400", async () => { /* ... */ });
  it("TC-A-05: delete_request → 200", async () => { /* ... */ });
  it("TC-A-06: mount drift gate — /admin/requests dispatch !== 404", async () => {
    const res = await app.fetch(
      new Request("https://x/admin/requests?type=visibility_request"),
      buildTestEnv(),
    );
    expect(res.status).not.toBe(404); // 401 or 200 OK
  });
});
```

---

## 5. ローカル実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @repo/shared build
mise exec -- pnpm --filter @repo/api test -- requests
mise exec -- pnpm --filter @repo/api typecheck
mise exec -- pnpm lint
```

---

## 6. DoD（Definition of Done）

- [ ] TC-A-01〜06 全 green（local vitest）。
- [ ] `grep -rn '/admin/requests' apps/api/src/index.ts` で mount が確認できる。
- [ ] staging curl が 200 を返す（admin JWT 付き）。
- [ ] `pnpm typecheck` / `pnpm lint` green。
- [ ] code 変更なく redeploy だけで解決した場合、Phase 12 lessons-learned に「bundle drift 復旧」を記録する。
- [ ] CONST_002: deploy は user 明示承認後のみ。

---

## 7. 想定リスクと縮約

| リスク | 縮約 |
|--------|------|
| `app.fetch` test harness が apps/api に未整備 | 既存 `members.spec.ts` パターンを踏襲、追加導入は最小 |
| `x-internal-auth` 経由 test が AUTH_SECRET 必須 | `buildTestEnv()` で `AUTH_SECRET=test-secret` を bind |
| staging redeploy が permission 必要 | CONST_002 / 1Password CLI ラッパー `scripts/cf.sh` 経由 |
