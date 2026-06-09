# Phase 5: 実装 — 19 ファイルの削除 / rename 手順

> **[実装区分: 実装仕様書]** NON_VISUAL

## 1. メタ情報

| 項目 | 内容 |
| ---- | ---- |
| Phase | 5（実装） |
| 入力 | Phase 2 §5（削除順序 Step 1-7）/ §6（lane A-D）/ Phase 4（検証 suite） |
| 出力 | 本 `phase-5.md`（19 ファイルの変更前後を明記した手順） |
| 注意 | 本 Phase の手順に従い、2026-06-08 本サイクル内で実コード・設定・spec の削除 / rename を実施済み。commit・push・PR・deploy・Issue mutation は user-gated |

## 2. 新規作成 / 修正ファイルパス一覧（[Feedback RT-03]）

新規作成ファイル: **なし**（削除・rename リファクタリングのため新規ファイルは生成しない）。

修正ファイル（全 19 ファイル）:

### apps/web プロダクション / 設定（6）
1. `apps/web/src/lib/env.ts`
2. `apps/web/src/lib/fetch/public.ts`
3. `apps/web/wrangler.toml`
4. `apps/web/.dev.vars.example`
5. `apps/web/playwright.config.ts`
6. `apps/web/playwright.admin-schema-diff.config.ts`

### apps/og プロダクション / 設定（2）
7. `apps/og/src/member-source.ts`
8. `apps/og/wrangler.toml`

### spec 群（11）
9. `apps/web/src/lib/__tests__/env.spec.ts`
10. `apps/web/src/lib/fetch/public.spec.ts`
11. `apps/web/src/lib/api/__tests__/public.spec.ts`
12. `apps/web/src/lib/__tests__/build-time-env.spec.ts`
13. `apps/web/src/lib/fetch/authed.spec.ts`
14. `apps/web/src/__tests__/instrumentation.runtime.spec.ts`
15. `apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts`
16. `apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts`
17. `apps/web/src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts`
18. `apps/og/src/__tests__/member-source.spec.ts`
19. `apps/og/src/__tests__/router.spec.ts`

## 3. 実装順序（Phase 2 §5 Step 1-7 の具体化）

型結合を壊さない順序: **Step 1（env.ts 定義）→ Step 2（public.ts consumer）→ Step 3（og）→ Step 4（config）→ Step 5（spec）→ Step 6（grep gate）→ Step 7（typecheck/lint/vitest）**。
Step 1 を先行させることで、Step 2 の取りこぼしを typecheck が機械検出する（Phase 4 T-1）。

---

## Step 1: `apps/web/src/lib/env.ts`（Lane A・最優先）

### 1-1. `EnvSchema`（L6-7）— 旧キー schema 行を削除

変更前:
```ts
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  PUBLIC_API_BASE_URL: z.string().url(),
```
変更後:
```ts
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
```
> L6（NEXT_PUBLIC）は保持し、L7（`PUBLIC_API_BASE_URL: z.string().url(),`）の 1 行のみ削除する。

### 1-2. `PublicFetchEnv` interface（L61-67）— 旧キー型フィールドを削除

変更前:
```ts
export interface PublicFetchEnv {
  API_SERVICE?: ServiceBinding;
  NEXT_PUBLIC_API_BASE_URL?: string;
  PUBLIC_API_BASE_URL?: string;
  NODE_ENV?: string;
  PLAYWRIGHT_TEST?: string;
}
```
変更後:
```ts
export interface PublicFetchEnv {
  API_SERVICE?: ServiceBinding;
  NEXT_PUBLIC_API_BASE_URL?: string;
  NODE_ENV?: string;
  PLAYWRIGHT_TEST?: string;
}
```
> L64（`PUBLIC_API_BASE_URL?: string;`）のみ削除。L63（NEXT_PUBLIC）保持。

### 1-3. `ApiBaseEnv` interface（L76-79）— 型全体を削除（D-3）

変更前:
```ts
export interface ApiBaseEnv {
  INTERNAL_API_BASE_URL?: string;
  PUBLIC_API_BASE_URL?: string;
}
```
変更後: **interface ごと削除**（5 行・前後の空行 1 行も含めて除去）。

### 1-4. `getApiBaseEnv()` 関数（L168-177）— 関数全体を削除（D-3）

変更前:
```ts
export function getApiBaseEnv(rawEnv: RawEnv = readRawEnv()): ApiBaseEnv {
  return {
    ...(typeof rawEnv["INTERNAL_API_BASE_URL"] === "string"
      ? { INTERNAL_API_BASE_URL: rawEnv["INTERNAL_API_BASE_URL"] }
      : {}),
    ...(typeof rawEnv["PUBLIC_API_BASE_URL"] === "string"
      ? { PUBLIC_API_BASE_URL: rawEnv["PUBLIC_API_BASE_URL"] }
      : {}),
  };
}
```
変更後: **関数ごと削除**（前後の空行 1 行も含めて除去）。production consumer 0 件（env.ts 定義 + `env.spec.ts` のみ）であることを Step 6 G-2 で再確認する。

### 1-5. `getPublicFetchEnv()`（L179-203）— 旧キー解決ブロックとスプレッドを削除

変更前（該当部）:
```ts
export function getPublicFetchEnv(rawEnv: RawEnv = readRawEnv()): PublicFetchEnv {
  const processEnv = readProcessEnv();
  const nextPublicBaseUrl =
    typeof processEnv["NEXT_PUBLIC_API_BASE_URL"] === "string"
      ? processEnv["NEXT_PUBLIC_API_BASE_URL"]
      : typeof rawEnv["NEXT_PUBLIC_API_BASE_URL"] === "string"
        ? rawEnv["NEXT_PUBLIC_API_BASE_URL"]
        : undefined;
  const baseUrl =
    typeof processEnv["PUBLIC_API_BASE_URL"] === "string"
      ? processEnv["PUBLIC_API_BASE_URL"]
      : typeof rawEnv["PUBLIC_API_BASE_URL"] === "string"
        ? rawEnv["PUBLIC_API_BASE_URL"]
        : undefined;
  const binding = rawEnv["API_SERVICE"];
  return {
    ...(binding === undefined ? {} : { API_SERVICE: binding as ServiceBinding }),
    ...(nextPublicBaseUrl === undefined ? {} : { NEXT_PUBLIC_API_BASE_URL: nextPublicBaseUrl }),
    ...(baseUrl === undefined ? {} : { PUBLIC_API_BASE_URL: baseUrl }),
    ...(typeof processEnv["NODE_ENV"] === "string" ? { NODE_ENV: processEnv["NODE_ENV"] } : {}),
    ...(typeof processEnv["PLAYWRIGHT_TEST"] === "string"
      ? { PLAYWRIGHT_TEST: processEnv["PLAYWRIGHT_TEST"] }
      : {}),
  };
}
```
変更後:
```ts
export function getPublicFetchEnv(rawEnv: RawEnv = readRawEnv()): PublicFetchEnv {
  const processEnv = readProcessEnv();
  const nextPublicBaseUrl =
    typeof processEnv["NEXT_PUBLIC_API_BASE_URL"] === "string"
      ? processEnv["NEXT_PUBLIC_API_BASE_URL"]
      : typeof rawEnv["NEXT_PUBLIC_API_BASE_URL"] === "string"
        ? rawEnv["NEXT_PUBLIC_API_BASE_URL"]
        : undefined;
  const binding = rawEnv["API_SERVICE"];
  return {
    ...(binding === undefined ? {} : { API_SERVICE: binding as ServiceBinding }),
    ...(nextPublicBaseUrl === undefined ? {} : { NEXT_PUBLIC_API_BASE_URL: nextPublicBaseUrl }),
    ...(typeof processEnv["NODE_ENV"] === "string" ? { NODE_ENV: processEnv["NODE_ENV"] } : {}),
    ...(typeof processEnv["PLAYWRIGHT_TEST"] === "string"
      ? { PLAYWRIGHT_TEST: processEnv["PLAYWRIGHT_TEST"] }
      : {}),
  };
}
```
> 削除点: (a) `const baseUrl = ...PUBLIC_API_BASE_URL...` の解決ブロック（旧 L187-192）、(b) return 内の `...(baseUrl === undefined ? {} : { PUBLIC_API_BASE_URL: baseUrl }),` スプレッド（旧 L197）。`nextPublicBaseUrl` 単一解決にする。process.env と cloudflareEnv の優先順位（process.env 優先）は保持。

> Step 1 完了直後、`getPublicFetchEnv()` 戻り値型から `PUBLIC_API_BASE_URL?` が消えるため、Step 2 未着手だと public.ts が typecheck エラーになる（意図的に露見させる = Phase 2 設計の肝）。

---

## Step 2: `apps/web/src/lib/fetch/public.ts`（Lane A・Step 1 直後に直列）

### 2-1. `getBaseUrl()`（L24）— fallback 削除

変更前:
```ts
  const baseUrl = env.NEXT_PUBLIC_API_BASE_URL ?? env.PUBLIC_API_BASE_URL;
```
変更後:
```ts
  const baseUrl = env.NEXT_PUBLIC_API_BASE_URL;
```

### 2-2. `getServiceBinding()`（L48）— fallback 削除

変更前:
```ts
    Boolean(env.NEXT_PUBLIC_API_BASE_URL ?? env.PUBLIC_API_BASE_URL);
```
変更後:
```ts
    Boolean(env.NEXT_PUBLIC_API_BASE_URL);
```

### 2-3. コメント表記更新（L9 / L10 / L13 / L45 / L49）

旧キー `PUBLIC_API_BASE_URL` を言及する説明コメントを `NEXT_PUBLIC_API_BASE_URL` 表記へ置換する（挙動コメントの正確性維持）。

| 行 | 変更前（該当語） | 変更後 |
| -- | --------------- | ------ |
| L9 | `... かつ PUBLIC_API_BASE_URL 明示時` | `... かつ NEXT_PUBLIC_API_BASE_URL 明示時` |
| L10 | `→ env.ts が解決した PUBLIC_API_BASE_URL の HTTP fetch` | `→ env.ts が解決した NEXT_PUBLIC_API_BASE_URL の HTTP fetch` |
| L13 | `→ env.ts が解決した PUBLIC_API_BASE_URL の HTTP fetch` | `→ env.ts が解決した NEXT_PUBLIC_API_BASE_URL の HTTP fetch` |
| L45 | `// test/CI 限定: PUBLIC_API_BASE_URL 明示時に ...` | `// test/CI 限定: NEXT_PUBLIC_API_BASE_URL 明示時に ...` |
| L49 | `// production / staging: PUBLIC_API_BASE_URL の有無に関わらず ...` | `// production / staging: NEXT_PUBLIC_API_BASE_URL の有無に関わらず ...` |

> コメントを残すと G-1（grep gate）で旧キーが検出され 0 件にならないため、コメント置換は必須。

---

## Step 3: apps/og rename（Lane C・Lane A/B と並列可）

### 3-1. `apps/og/src/member-source.ts`

`OgEnv` interface（L5-8）変更前:
```ts
export interface OgEnv {
  API_SERVICE?: ServiceBinding;
  PUBLIC_API_BASE_URL?: string;
}
```
変更後:
```ts
export interface OgEnv {
  API_SERVICE?: ServiceBinding;
  NEXT_PUBLIC_API_BASE_URL?: string;
}
```

`fetchViaBaseUrl()`（L66）変更前:
```ts
  const baseUrl = env.PUBLIC_API_BASE_URL?.trim();
```
変更後:
```ts
  const baseUrl = env.NEXT_PUBLIC_API_BASE_URL?.trim();
```
> 削除でなく rename（D-2）。base URL 解決経路を残す。`NEXT_PUBLIC_` 接頭辞は apps/og（Hono Worker）では単なる env 変数名で runtime 挙動に影響しない（Phase 2 §7）。

### 3-2. `apps/og/wrangler.toml`

`[vars]`（L10）/ `[env.staging.vars]`（L16）/ `[env.production.vars]`（L29）の 3 箇所のキー名 `PUBLIC_API_BASE_URL` を `NEXT_PUBLIC_API_BASE_URL` へ rename する（**値は変更しない**）。

変更前（各セクション）:
```toml
PUBLIC_API_BASE_URL = "<既存の値を維持>"
```
変更後:
```toml
NEXT_PUBLIC_API_BASE_URL = "<同じ値を維持>"
```
> OgEnv フィールド名（3-1）と wrangler の `[vars]` キー名を揃える。両方 rename しないと undefined になるため Lane C 内で同時に行う（Phase 3 リスク「apps/og rename 漏れ」対策）。

---

## Step 4: config 削除（Lane B・Lane A と並列可）

### 4-1. `apps/web/wrangler.toml`

`[vars]`（L17）/ `[env.staging.vars]`（L33）/ `[env.production.vars]`（L61）の `PUBLIC_API_BASE_URL = ...` 行を**削除**する（apps/web は削除。rename ではない）。`NEXT_PUBLIC_API_BASE_URL` 行は各セクションに残す。

> 旧キーは NEXT_PUBLIC_ と常に同値の重複行。3 セクションをまとめて削除する（片側のみ削除で環境間乖離を作らない = Phase 3 リスク対策）。値の付け替えではない。

### 4-2. `apps/web/.dev.vars.example`（L5）

`PUBLIC_API_BASE_URL=...`（または `op://` 参照行）を**削除**。`NEXT_PUBLIC_API_BASE_URL` 行は保持。

### 4-3. `apps/web/playwright.config.ts`（L149）

`'PUBLIC_API_BASE_URL=...'` の env 注入行を**削除**する。

### 4-4. `apps/web/playwright.admin-schema-diff.config.ts`（L45）

`PUBLIC_API_BASE_URL` の env 注入行を**削除**する。

---

## Step 5: spec 群移行（Lane D は web 9 本 = Step 1 完了後 / Lane C は og 2 本）

各 spec で旧キー `PUBLIC_API_BASE_URL` の seed / delete / assert / テスト名を移行する。Phase 4 §4 の「保持すべき振る舞いの意図」を不変点として守る。

### 5-1. `apps/web/src/lib/__tests__/env.spec.ts`（旧キー 8 件）
- schema parse の旧キー seed（`PUBLIC_API_BASE_URL: "..."`）を削除。`NEXT_PUBLIC_API_BASE_URL` のみで parse が通ることを確認する形に。
- `getApiBaseEnv` を対象とする 2 テスト（L11 import 参照 / L252 系 / L262 系）を**テストごと削除**（関数削除に伴う）。import からも `getApiBaseEnv` / `ApiBaseEnv` を除去する。

### 5-2. `apps/web/src/lib/fetch/public.spec.ts`（旧キー 9 件）
- seed / `delete env.PUBLIC_API_BASE_URL` / assert / テスト名（`PUBLIC_API_BASE_URL` を含む describe/it 文字列）を `NEXT_PUBLIC_API_BASE_URL` へ rename。
- service-binding 優先 / HTTP fallback の transport 選択結果は不変であることを維持。

### 5-3. `apps/web/src/lib/api/__tests__/public.spec.ts`（旧キー 4 件）
- seed / assert を `NEXT_PUBLIC_API_BASE_URL` へ rename。

### 5-4. `apps/web/src/lib/__tests__/build-time-env.spec.ts`（旧キー 3 件）
- seed を `NEXT_PUBLIC_API_BASE_URL` へ rename。

### 5-5. `apps/web/src/lib/fetch/authed.spec.ts`（旧キー 2 件）
- 型定義の旧キー + seed を削除（NEXT_PUBLIC_ 単一に）。authed fetch の env shape は INTERNAL_ 主体で旧キーは余剰。

### 5-6. `apps/web/src/__tests__/instrumentation.runtime.spec.ts`（旧キー 1 件）
- 同義二重 seed の旧キー行を削除（NEXT_PUBLIC_ 側 seed は保持）。

### 5-7〜5-9. `apps/web/src/lib/admin/__tests__/server-fetch.{env,binding,http-fallback}.spec.ts`（各 1 件）
- 各ファイルの旧キー seed（admin 経路では余剰）を削除。admin server-fetch は INTERNAL_ 主体のため挙動不変。

### 5-10. `apps/og/src/__tests__/member-source.spec.ts`（旧キー 7 件）
- `OgEnv` seed の `PUBLIC_API_BASE_URL` を `NEXT_PUBLIC_API_BASE_URL` へ rename。
- テスト名 `falls back to PUBLIC_API_BASE_URL` を `falls back to NEXT_PUBLIC_API_BASE_URL` へ rename。
- binding 不在時に base URL fetch へ fallback する挙動は不変。

### 5-11. `apps/og/src/__tests__/router.spec.ts`（旧キー 1 件）
- seed を `NEXT_PUBLIC_API_BASE_URL` へ rename。

---

## Step 6: grep gate 確認（validation lane・直列）

- G-1: `grep -rn 'PUBLIC_API_BASE_URL' apps/ | grep -v 'NEXT_PUBLIC_API_BASE_URL'` → **0 件**（AC-7）。
- G-2: `grep -rn 'getApiBaseEnv\|ApiBaseEnv' apps/` → **0 件**（AC-2）。
- G-3: `grep -rn 'NEXT_PUBLIC_API_BASE_URL' apps/og/` → **2 件以上**（rename 取りこぼし逆検出）。

## Step 7: typecheck / lint / vitest（validation lane・直列で最後に締める）

Phase 4 §3.2（T-1〜T-3）/ §3.3（V-1〜V-11）を順に実行し、全 exit 0 / 全 green を確認する。

## 4. lane 割り当てサマリー（Phase 2 §6 の具体化）

| Lane | 対象 Step / ファイル | 並列性 |
| ---- | -------------------- | ------ |
| Lane A（web core） | Step 1（env.ts）→ Step 2（public.ts） | 内部直列。最優先 |
| Lane B（config） | Step 4（web wrangler / .dev.vars.example / playwright×2） | Lane A と並列可 |
| Lane C（og） | Step 3（member-source.ts + og/wrangler.toml）+ Step 5-10/5-11（og spec 2 本） | Lane A/B と並列可。型結合のため C 内は同時 |
| Lane D（web spec 群） | Step 5-1〜5-9（web spec 9 本） | Lane A 完了後（型に依存） |
| validation | Step 6（grep gate）→ Step 7（typecheck/lint/vitest） | 全 lane 完了後に直列で締める |

## 5. 完了条件

- [x] 新規 / 修正ファイルパス一覧を記載（[Feedback RT-03]・新規 0 / 修正 19）
- [x] Step 1-7 を各ファイルの変更前後付きで具体化
- [x] Lane A-D + validation の割り当てを Step に紐付け
- [x] apps/web は削除 / apps/og は rename の区別を各 Step に明記
- [x] Phase 5 手順に従い実コード・設定・spec を実装済み（Gate-B local implementation complete）

## 6. 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 環境変数アクセス不変条件 | `CLAUDE.md`「apps/web env アクセス不変条件（task-02 wrangler-env-injection）」 | 非機密 var は wrangler.toml `[vars]` / `[env.staging.vars]` / `[env.production.vars]` 管理。env 参照は `env.ts` accessor 経由のみで `process.env.*` 直接参照を増やさない |
| Cloudflare CLI ルール | `CLAUDE.md`「Cloudflare 系 CLI 実行ルール」 | wrangler 直叩き禁止 / `scripts/cf.sh` 経由 / 旧キーは非機密 `[vars]` 管理で Secret 不在（secret put/delete しない） |
| 削除順序設計 | `outputs/phase-2/phase-2.md` §5 | Step 1（env.ts 先行）で Step 2 取りこぼしを typecheck 機械検出 |
| 設計判断 D-2 / D-3 | `index.md` §3 | apps/og は rename・apps/web は削除 / `getApiBaseEnv` + `ApiBaseEnv` 関数ごと削除 |
