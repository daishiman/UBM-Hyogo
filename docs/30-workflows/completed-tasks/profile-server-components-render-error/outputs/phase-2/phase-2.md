# Phase 2: 設計

## 2.1 原因仮説と検証手順（必須）

### 仮説 H1（最有力・既に特定済み）: `apps/web/src/lib/fetch/authed.ts` の env 参照経路違反

**根拠**:

- L11: `const FALLBACK_INTERNAL_API = "http://127.0.0.1:8787"` — CLAUDE.md「127.0.0.1 など localhost endpoint の `apps/web/src` 配下への焼き込み禁止」に違反
- L14-L17: `process.env["INTERNAL_API_BASE_URL"]` / `process.env["PUBLIC_API_BASE_URL"]` を直接参照 — CLAUDE.md 不変条件「`apps/web` ランタイムの env 参照は `getApiBaseEnv()` 経由のみ・`process.env.*` 直接禁止」に違反
- Cloudflare Workers + `@opennextjs/cloudflare` runtime では `[vars]` バインディングは `getCloudflareContext().env` 経由でのみ参照可能。`process.env` 経由は **空** または **undefined**
- 結果: `resolveApiBase()` が fallback の `127.0.0.1:8787` を返す → Cloudflare Worker から到達不能 → `fetch` 例外 → `page.tsx` L41 の `throw err;` で SCR 中断 → `/profile/error.tsx` boundary が `digest=398449091, scope=profile` でログ

### 仮説 H2: `/me` API（apps/api 側）が 5xx を返す可能性

- `fetchAuthed` は `!res.ok` で `FetchAuthedError` を throw する。`/me` が 500 ならここで例外
- → H1 修正後も再発する場合は Phase 2.2 で `apps/api` 側のログも確認
- → 設計としては「直接原因 H1 修正 + `safeServerFetch` 二段防御で H2 が起きても error UI で降格」とする

### 仮説 H3: env binding ミス（`INTERNAL_API_BASE_URL` が staging に未投入）

- 反証: `apps/web/wrangler.toml` で `[env.staging.vars]` に存在
- → 低確率だが Phase 2.2 で `apps/web/wrangler.toml` `[env.staging.vars]` と deploy 後 runtime 挙動で確認する（通常 vars のため secrets inventory では確認しない）

## 2.2 stack trace 取得手順（Phase 5 着手前に必須実行）

```bash
# 1. 認証
bash scripts/cf.sh whoami

# 2. apps/web staging の tail を起動（別 terminal）
bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging --format pretty

# 3. apps/api staging の tail も並行で起動
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging --format pretty

# 4. ブラウザで再現（要 login 済み cookie）
#    https://ubm-hyogo-web-staging.daishimanju.workers.dev/profile

# 5. tail 出力から digest=398449091 / scope=profile に該当する例外 stack を抽出
```

## 2.3 設計判断

| 項目                                                              | 採用                                                                                                 | 不採用                                                                              |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| env 参照経路                                                      | `getApiBaseEnv()` 経由                                                                                       | `process.env` 直接、独自 helper                                                     |
| `INTERNAL_API_BASE_URL` / `PUBLIC_API_BASE_URL` の優先順位         | INTERNAL を優先、無ければ PUBLIC を fallback（既存ロジック同型）                                       | どちらか片方のみに統一                                                              |
| `127.0.0.1:8787` fallback                                         | 完全削除（env 解決失敗時は throw、`/profile/error.tsx` で表示）                                       | local 用 fallback を残す                                                            |
| 初回 `/me` の error handling                                      | `safeServerFetch` でラップし `rethrowOn: [AuthRequiredError]` で redirect 経路のみ rethrow            | `try/catch` で `throw err;` を残す（SCR ハードクラッシュを誘発）                    |
| `/me` 5xx 時の UI                                                 | SectionError + ProfileHeader fallback（既存 `/me/profile` 失敗経路と同型）                            | 全画面エラー表示                                                                    |

## 2.4 ターゲット I/F 設計

### `authed.ts`

```ts
// before
const FALLBACK_INTERNAL_API = "http://127.0.0.1:8787";

const resolveApiBase = (): string => {
  const internal = process.env["INTERNAL_API_BASE_URL"];
  if (internal && internal.length > 0) return internal.replace(/\/$/, "");
  const pub = process.env["PUBLIC_API_BASE_URL"];
  if (pub && pub.length > 0) return pub.replace(/\/$/, "");
  return FALLBACK_INTERNAL_API;
};

// after
import { getApiBaseEnv } from "@/lib/env";

const resolveApiBase = (): string => {
  const env = getApiBaseEnv();
  const internal = env.INTERNAL_API_BASE_URL;
  if (internal && internal.length > 0) return internal.replace(/\/$/, "");
  const pub = env.PUBLIC_API_BASE_URL;
  if (pub && pub.length > 0) return pub.replace(/\/$/, "");
  throw new Error(
    "fetchAuthed: neither INTERNAL_API_BASE_URL nor PUBLIC_API_BASE_URL is configured",
  );
};
```

### `profile/page.tsx`

```ts
// before
let me: MeSessionResponse;
try {
  me = await fetchAuthed<MeSessionResponse>("/me");
} catch (err) {
  if (err instanceof AuthRequiredError) {
    return redirect("/login?redirect=/profile");
  }
  throw err; // ← SCR ハードクラッシュの原因
}

// after
let meResult: Awaited<ReturnType<typeof safeServerFetch<MeSessionResponse>>>;
try {
  meResult = await safeServerFetch(
    () => fetchAuthed<MeSessionResponse>("/me"),
    { codePrefix: "MEMBER_SESSION", rethrowOn: [AuthRequiredError] },
  );
} catch (err) {
  if (err instanceof AuthRequiredError) {
    return redirect("/login?redirect=/profile");
  }
  throw err;
}

if (!meResult.ok) {
  return (
    <>
      <MemberHeader />
      <main data-route="member" data-section-rhythm="comfortable">
        <SectionError
          title="マイページを読み込めませんでした"
          detail={meResult.error.message}
          retryHref="/profile"
        />
      </main>
    </>
  );
}
const me = meResult.data;
```

> `safeServerFetch` の既存契約上、`rethrowOn` 指定の error class は throw され、それ以外は `{ ok: false, error: { code, message } }` として返る。`AuthRequiredError` は外側の `try/catch` または `safeServerFetch` 呼び出し直前で redirect する。

## 2.5 ステップ間 state ownership（NON_VISUAL のため簡略）

| 関数              | 入力                            | 出力                                | 副作用                            |
| ----------------- | ------------------------------- | ----------------------------------- | --------------------------------- |
| `resolveApiBase`  | （内部で `getApiBaseEnv()` 呼び出し）  | URL 文字列（末尾 `/` 除去済み）     | env 未設定時 throw（fail-fast）   |
| `fetchAuthed<T>`  | `path` / `init`                 | `T`（API 応答）                     | env 解決失敗 / fetch 失敗 / 401 (AuthRequiredError) / その他 !res.ok (FetchAuthedError) で throw |
| `ProfilePage`     | -                               | JSX（profile UI / SectionError / redirect） | AuthRequiredError → redirect。env 解決失敗・5xx → SectionError UI |

## 2.6 既存テスト・smoke 再利用

- 既存: `apps/web/src/lib/fetch/authed.spec.ts`（base URL 解決の単体）
- 既存: `apps/web/app/(member)/profile/page.spec.tsx`（profile page の rendering）
- broad grep guard: `apps/web/src/lib/fetch/authed.ts` 内の `process.env[` および `127.0.0.1` を 0 件固定

## 2.7 ライブラリ選定

| ライブラリ        | 既存採用 | 今タスクでの利用       |
| ----------------- | -------- | ---------------------- |
| zod               | 既存     | EnvSchema は既存のまま |
| @opennextjs/cloudflare | 既存 | `getCloudflareContext` を `env.ts` 経由で間接利用 |
| vitest            | 既存     | regression spec 実行   |

新規ライブラリ追加なし。
