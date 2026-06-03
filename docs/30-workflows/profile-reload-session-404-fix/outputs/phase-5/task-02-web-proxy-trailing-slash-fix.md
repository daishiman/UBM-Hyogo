# task-02: `apps/web` proxy `/api/me/[...path]` の空 path 時 `/me/` 生成バグ修正 + テスト

[実装区分: 実装仕様書]

> 判定根拠: CONST_004 に従う。本タスクは `apps/web/app/api/me/[...path]/route.ts`（編集）と新規テスト 1 ファイルを追加して upstream URL 構築バグを是正するもので、コード変更を伴うため実装仕様書とする。

## メタ情報

| 項目 | 値 |
|------|------|
| ワークフロー | `profile-reload-session-404-fix` |
| 親 Phase | Phase 5（実装） |
| ブランチ | `docs/profile-reload-session-404-fix-spec`（実装サイクルで feature ブランチへ） |
| 起点 | `origin/dev` (bd0393a29) |
| visualEvidence | NON_VISUAL（upstream URL 文字列 / fetch 呼び出し引数で判定） |
| 想定 PR base | `dev` |
| 並列性 | T01 / T03 と相互非依存（並列実装可） |

## 背景

web proxy `apps/web/app/api/me/[...path]/route.ts:42` は `const target = `${apiBase()}/me/${path.join("/")}${url.search}`;` で upstream URL を組み立てる。`path` が空配列（`/api/me` へのアクセス）のとき `path.join("/")` が空文字となり、target が `${api}/me/`（末尾スラッシュ）になる。これは task-01 が無い状態では API 側で 404 を引き起こす（task-01 適用後は 308 で吸収されるが、proxy 側でも末尾スラッシュを生成しない多重防御とする）。詳細は `outputs/phase-1/phase-1.md` §1.2 派生欠陥参照。

## 目的

`target` 構築を空 path のとき末尾スラッシュを付けない形へ修正し、`/api/me`（空 path）→ `${api}/me`、`/api/me/visibility-request` → `${api}/me/visibility-request`（非回帰）とする。proxy の認証（`requireSession`）・cookie / Authorization / `x-ubm-dev-session` 透過・HTTP メソッド・body 転送ロジックは変更しない。

## 1. 変更対象ファイル一覧（CONST_005 必須）

| パス | 変更種別 | 内容 |
|------|---------|------|
| `apps/web/app/api/me/[...path]/route.ts` | 編集 | `proxy()` 内の `target` 構築を、空 path で末尾スラッシュを生成しない形に修正（1 行を 2 行へ） |
| `apps/web/app/api/me/[...path]/route.route.spec.ts` | 新規 | `fetch` を mock し upstream URL を検証する unit テスト |

それ以外のファイルは無編集。

## 2. 主要な関数・型・モジュールのシグネチャまたは構造（CONST_005 必須）

`proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }): Promise<Response>` のシグネチャは不変。内部の URL 構築のみ変更する。

```ts
// 修正前
const target = `${apiBase()}/me/${path.join("/")}${url.search}`;

// 修正後
const tail = path.join("/");
const target = `${apiBase()}/me${tail ? `/${tail}` : ""}${url.search}`;
```

`apiBase()` は末尾スラッシュを `replace(/\/$/, "")` で除去済みのため、`${apiBase()}/me` は常に `<base>/me` になる。

## 3. 入力・出力・副作用の定義（CONST_005 必須）

| 受信（`/api/me/...`） | `path`（params） | 修正後 target |
|------|------|------|
| `/api/me` | `[]` | `${apiBase()}/me` |
| `/api/me/visibility-request` | `["visibility-request"]` | `${apiBase()}/me/visibility-request` |
| `/api/me/profile?x=1` | `["profile"]` | `${apiBase()}/me/profile?x=1` |

| 区分 | 内容 |
|------|------|
| 入力 | `NextRequest`（method / url / cookie / authorization / content-type / x-ubm-dev-session）+ params の `path: string[]` |
| 出力 | upstream `fetch(target, init)` のレスポンスを `status` / `content-type` 透過で返す（不変） |
| 副作用 | upstream への HTTP fetch（既存と同一。URL 文字列のみ変化） |
| 不変 | `requireSession()` の 401 ガード・cookie/authorization/content-type/x-ubm-dev-session 透過・body 転送（GET/DELETE 以外）はすべて変更しない |

## 4. 編集差分（unified diff）

```diff
--- a/apps/web/app/api/me/[...path]/route.ts
+++ b/apps/web/app/api/me/[...path]/route.ts
@@ -38,7 +38,8 @@ async function proxy(
 
   const { path } = await ctx.params;
   const url = new URL(req.url);
-  const target = `${apiBase()}/me/${path.join("/")}${url.search}`;
+  const tail = path.join("/");
+  const target = `${apiBase()}/me${tail ? `/${tail}` : ""}${url.search}`;
 
   const headers: Record<string, string> = {};
   const cookie = req.headers.get("cookie");
```

## 5. テスト方針（CONST_005 必須）

新規 test は `*.spec.ts`（不変条件 #8）。`getAuth` / `getAuthEnv` を `vi.mock` し、`requireSession` が通る（memberId あり）状態にしたうえで global `fetch` を `vi.fn()` で mock し、`fetch` が呼ばれた第 1 引数（target URL）を検証する。`INTERNAL_API_BASE_URL` は mock で `http://api.test`（末尾スラッシュ無し）を返す。

| TC-ID | ケース名 | 入力 | 期待 |
|-------|---------|------|------|
| TC-T02-1 | 空 path（`/api/me`）は末尾スラッシュ無し `/me` を upstream に送る | `path=[]` / `GET /api/me` | `fetch` 第 1 引数 === `http://api.test/me` |
| TC-T02-2 | 非空 path（`visibility-request`）は `/me/visibility-request` を送る（非回帰） | `path=["visibility-request"]` / `POST` | `fetch` 第 1 引数 === `http://api.test/me/visibility-request` |
| TC-T02-3 | search を保持する | `path=["profile"]` / `GET /api/me/profile?x=1` | `fetch` 第 1 引数 === `http://api.test/me/profile?x=1` |
| TC-T02-4 | 空 path + search でも末尾スラッシュを挟まない | `path=[]` / `GET /api/me?x=1` | `fetch` 第 1 引数 === `http://api.test/me?x=1` |
| TC-T02-5 | 未認証（memberId なし）は 401 を返し fetch を呼ばない（非回帰） | session.user.memberId 無し | `status=401` / `fetch` 未呼び出し |
| TC-T02-6 | cookie / authorization を upstream へ透過する（非回帰） | cookie ヘッダ付き GET | `fetch` 第 2 引数 `init.headers.cookie` が一致 |

> mock 例: `vi.mock("../../../../src/lib/auth", () => ({ getAuth: async () => ({ auth: async () => ({ user: { memberId: "m_001" } }) }) }))` / `vi.mock("../../../../src/lib/env", () => ({ getAuthEnv: () => ({ INTERNAL_API_BASE_URL: "http://api.test" }) }))`。`fetch` mock は `vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200, headers: { "content-type": "application/json" } })))`。`NextRequest` は `new Request("https://web.test/api/me", { method: "GET" })` を `as unknown as NextRequest` でキャストし、`ctx.params` は `Promise.resolve({ path: [] })`。各ケースで `vi.clearAllMocks()` を `beforeEach` する。

## 6. ローカル実行・検証コマンド（CONST_005 必須）

```bash
# 1. ブランチ確認
git branch --show-current

# 2. 依存
mise exec -- pnpm install

# 3. 型 / lint
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint

# 4. 本タスクの追加テスト（ルートから filter 指定で実行）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  "app/api/me/[...path]/route.route.spec.ts"
```

## 7. 完了条件（DoD: Definition of Done, CONST_005 必須）

| ID | 条件 | 検証 |
|----|------|------|
| DoD-T02-1 | `route.ts` の `target` 構築が `${apiBase()}/me${tail ? `/${tail}` : ""}${url.search}` に修正されている | `git diff apps/web/app/api/me/[...path]/route.ts` |
| DoD-T02-2 | TC-T02-1〜T02-4（URL 構築）が PASS | §6 手順 4 |
| DoD-T02-3 | TC-T02-5（未認証 401・fetch 未呼び出し）が PASS | §6 手順 4 |
| DoD-T02-4 | TC-T02-6（cookie/authorization 透過）が PASS | §6 手順 4 |
| DoD-T02-5 | `typecheck` / `lint` が exit 0 | §6 手順 3 |
| DoD-T02-6 | `requireSession` / cookie 透過 / body 転送ロジックを変更していない | `git diff` が `target` 構築 2 行のみ |

## 8. ロールバック手順

```bash
# 修正 2 行を戻す
git checkout -- "apps/web/app/api/me/[...path]/route.ts"
# 新規 test を削除
git rm "apps/web/app/api/me/[...path]/route.route.spec.ts"
```

戻すと空 path で再び `${api}/me/` を生成するが、task-01 が landed していれば API 側 308 で吸収される。

## 9. 後続タスク・先送り項目

CONST_007 に違反する先送り（`Phase 2 で対応`、`バックログ送り` 等）は **無し**。本タスクのスコープ（upstream URL 末尾スラッシュ抑止 + テスト）は本サイクルで完結する。

## 10. PR 作成方針（実行は別プロンプト）

CONST_002 により本仕様書作成プロンプトでは PR を作成しない。実装サイクル後、`.claude/commands/ai/diff-to-pr.md` のフローに従って user-gated で PR を作成する。base は `dev`。T01 / T03 と同一 PR に束ねるか分割するかは実装サイクルの判断とし、いずれも base=`dev`。
