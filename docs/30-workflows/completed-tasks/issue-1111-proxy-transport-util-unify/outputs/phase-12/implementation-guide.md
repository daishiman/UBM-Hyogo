# 実装ガイド — issue-1111 transport 選択 util 集約

本ガイドは Part 1（概念・中学生レベル）と Part 2（技術者レベル）の 2 部構成。識別子は phase-02 設計 / index.md の確定名と完全一致させる（identifier drift 厳禁）。

---

## Part 1 — これは何をするのか（やさしい説明）

### たとえ話

ある会社に「商品の届け先を決める手順書」があるとします。手順は単純で、

1. まず「社内便（早くて確実な専用ルート）」が使えるか確認する。
2. 使えるなら社内便で届ける。
3. 使えないなら「普通の宅配便」で届ける。

この手順書が、A 部署・B 部署・C 部署の 3 つの部署にそれぞれ**まるごとコピー**されて貼られていました。中身はほぼ同じです。

ここで問題が起きます。あるとき「社内便の使える条件を変えよう」というルール変更がありました。担当者は A 部署と B 部署の手順書は直したのに、**C 部署の手順書を直し忘れました**。すると C 部署だけ古いルールで動き続け、届け先を間違える事故が起きます。3 枚バラバラにあると、必ずどれか 1 枚を直し忘れるのです。

### なぜ必要なのか

手順書が 3 枚に分かれていると、「ルールを 1 回変えるたびに 3 枚すべてを正しく直す」必要があり、いつか直し忘れて事故ります。これは「同じことが 3 回コピーされている」状態で、ソフトウェアでも同じ問題が起きます。

### 何をするのか

手順書を**1 冊だけ**にまとめます。A・B・C の 3 部署は、自分専用のコピーを捨てて、その**共通の 1 冊を見る**ようにします。こうすれば、ルール変更は 1 冊を直すだけで済み、直し忘れによる事故が起きません。

ただし 3 部署には「少しだけ違う事情」があります。たとえば「社内便が使えなかったときの代わりの届け先」や「届けた記録を残すかどうか」は部署ごとに違います。そこは無理に 1 冊へ押し込めず、**部署ごとの事情は部署側に残し**、共通している「まず社内便、ダメなら宅配便」という骨組みだけを 1 冊に集めます。これにより、まとめた後も 3 部署の動きはまったく変わりません（pure refactor）。

---

## Part 2 — 技術詳細（実装者向け）

### 対象と現状

「binding 優先 → HTTP fallback」transport 選択イディオムが以下 3 ファイルに独立複製されている。

| 呼び出し側 | ファイル | 特徴 |
| --- | --- | --- |
| admin mutation proxy | `apps/web/app/api/admin/[...path]/route.ts` | transport ログ無し / base 不在時 500 |
| admin read | `apps/web/src/lib/admin/server-fetch.ts` | `logAdminTransport`（scope: admin）/ base 常在 |
| public read | `apps/web/src/lib/fetch/public.ts` | `logTransport`（scope 無し）/ base 常在 |

スコープ外: `apps/web/src/lib/auth.ts`（`service ?? { fetch }` 三項の軽量変種。isTestOrPlaywright / fallback-base を持たない別形状ゆえ統合しない）。

### 新規 util の型定義 / シグネチャ

`apps/web/src/lib/fetch/transport-select.ts`（新規・純粋関数のみ）。

```ts
export type TransportKind = "service-binding" | "http-fallback";

/** binding を無効化するか否かを呼び出し側が計算して渡す（症状1/2 を吸収） */
export interface ResolveBindingInput {
  readonly binding: { fetch: typeof fetch } | undefined; // env.API_SERVICE
  readonly disableBinding: boolean;                      // isTestOrPlaywright && <baseVar 明示>
}
export function resolveServiceBinding(
  input: ResolveBindingInput,
): { fetch: typeof fetch } | undefined;

/** 末尾スラッシュ除去（server-fetch / route.ts 共通の base 正規化） */
export function stripTrailingSlash(base: string): string;

export interface SelectTransportConfig {
  readonly binding: { fetch: typeof fetch } | undefined; // resolveServiceBinding の戻り
  readonly resolveBase: () => string | null;             // 呼び出し側固有の fallback 戦略
  readonly bindingUrlPrefix?: string;                    // default "https://service-binding.local"
  readonly log?: (kind: TransportKind, path: string, status: number) => void; // opt-in
}
export type SelectTransportResult =
  | { readonly kind: TransportKind; readonly response: Response }
  | { readonly kind: "base-unavailable" }; // resolveBase() === null（route.ts のみ到達しうる）

export async function selectAndFetch(
  cfg: SelectTransportConfig,
  path: string,
  init: RequestInit,
): Promise<SelectTransportResult>;
```

`SelectTransportResult` の `kind` は判別共用体である。`"service-binding"` / `"http-fallback"` の 2 ケースは `response: Response` を持ち、`"base-unavailable"` は response を持たない。

### 制御構造（`selectAndFetch` の骨格）

1. `cfg.binding` が存在すれば transport は `"service-binding"`。`new Request` の URL は `bindingUrlPrefix`（default `"https://service-binding.local"`）+ `path` で構成し、`cfg.binding.fetch(...)` を実行。
2. `cfg.binding` が無ければ `cfg.resolveBase()` を呼ぶ。
   - 戻り値が `null` → `{ kind: "base-unavailable" }` を返す（fetch しない）。
   - 戻り値が `string` → 呼び出し側が返した `base + path` を `globalThis.fetch` で実行し transport は `"http-fallback"`。
3. fetch 後、`cfg.log` があれば `cfg.log(kind, path, response.status)` を呼ぶ（opt-in）。`route.ts` は `log` を渡さないためログ無しを維持。
4. `{ kind, response }` を返す。

> `isTestOrPlaywright` 判定・各呼び出し側の fallback 戦略・transport ログ shape は呼び出し側固有として残す。util は制御構造の骨格のみを共通化する。末尾スラッシュ正規化も pure refactor の一部として呼び出し側の既存責務を維持し、`route.ts` / `server-fetch.ts` は `stripTrailingSlash(...)` 済みの base を渡し、`public.ts` は既存どおり `getBaseUrl()` の戻りをそのまま渡す。

### 使用例（3 呼び出し側の差替コード）

#### 1. `route.ts`（admin mutation・ログ無し・base 不在時 500）

```ts
const binding = resolveServiceBinding({
  binding: env.API_SERVICE,
  disableBinding: isTestOrPlaywright(env) && !!env.INTERNAL_API_BASE_URL,
});
const result = await selectAndFetch(
  { binding, resolveBase: () => apiBase(env) }, // log 渡さない・LOCAL_DEV_FALLBACK は apiBase() 内に残す
  path,
  init,
);
if (result.kind === "base-unavailable") {
  return new Response("API base URL is not configured", { status: 500 });
}
return result.response;
```

- `LOCAL_DEV_FALLBACK`（`http://127.0.0.1:8787`）は `apiBase(env)` の内側＝呼び出し側に残し、util へ移送しない（task-18 gate / 不変条件 #3）。

#### 2. `server-fetch.ts`（admin read・logAdminTransport scope:admin）

```ts
const binding = resolveServiceBinding({
  binding: env.API_SERVICE,
  disableBinding: isTestOrPlaywright() && !!env.INTERNAL_API_BASE_URL,
});
const result = await selectAndFetch(
  {
    binding,
    resolveBase: () => resolveApiBase(),                 // 常に string
    log: (kind, p, status) => logAdminTransport(kind, p, status), // scope:admin
  },
  path,
  init,
);
// base 常在のため base-unavailable には到達しない。throw 経路（既存）を維持
return result.response;
```

#### 3. `public.ts`（public read・logTransport scope 無し）

```ts
const binding = resolveServiceBinding({
  binding: env.API_SERVICE,
  disableBinding: isTestOrPlaywright() && !!env.PUBLIC_API_BASE_URL,
});
const result = await selectAndFetch(
  {
    binding,
    resolveBase: () => getBaseUrl(),                     // DEFAULT localhost・常に string
    log: (kind, p, status) => logTransport(kind, p, status), // scope 無し
  },
  path,
  effectiveInit, // PLAYWRIGHT cache bypass は呼び出し側に残す
);
return result.response;
```

### エラーハンドリング

| 呼び出し側 | `resolveBase()` の値域 | `base-unavailable` 時の挙動 |
| --- | --- | --- |
| `route.ts` | `string \| null`（staging/prod で LOCAL_DEV_FALLBACK が効かないと null） | `kind === "base-unavailable"` を検査し **500 Response** を返す（現状の fail-fast を維持） |
| `server-fetch.ts` | 常に `string`（`resolveApiBase()` は base 常在） | 到達しない。base 解決失敗は既存の **throw 経路**で扱う（util 外） |
| `public.ts` | 常に `string`（`getBaseUrl()` は DEFAULT localhost を返す） | **到達しない**（base 常在） |

`base-unavailable` を判別共用体の独立ケースにすることで、「base が無いとき fetch を発行しない」ことを型で強制する。route.ts 以外は base 常在のため、このケースに入らない契約を回帰テストで固定する。

### 設定パラメータ

| パラメータ | 既定値 | 意味 |
| --- | --- | --- |
| `bindingUrlPrefix` | `"https://service-binding.local"` | service-binding 経由 fetch の Request URL prefix。各呼び出し側の現行値と一致させる（pure refactor）。実値が異なる呼び出し側がある場合は明示指定で吸収 |
| `cfg.log` | `undefined`（未指定） | opt-in。`route.ts` は渡さずログ無しを維持。`server-fetch.ts` / `public.ts` は各自の log fn を渡す |
| `cfg.resolveBase` | （必須） | 呼び出し側固有の fallback 戦略。`null` 返却で base-unavailable を表現 |

### 不変条件（pure refactor の保証点）

1. binding 優先 → HTTP fallback の分岐結果が抽出前後で完全不変。
2. `disableBinding` の真理値（`isTestOrPlaywright && <baseVar 明示>`）を呼び出し側が計算し、判定述語自体を util へ移送しない（症状 1/2）。
3. fallback base 解決（route.ts: LOCAL_DEV_FALLBACK + staging/prod null / server-fetch: 末尾 `/` 除去 / public: DEFAULT localhost）は呼び出し側に残す（症状 3）。
4. `LOCAL_DEV_FALLBACK`（127.0.0.1:8787）を util へ移送しない。util へ 127.0.0.1 系・`8888` を焼き込まない（task-18 grep gate / 不変条件 #3）。
5. env 参照は `apps/web/src/lib/env.ts` の公開アクセサ経由のみ。`process.env.*` 直接参照を新規追加しない。util は純粋関数で env を直接読まない。
6. D1 直接アクセス禁止（`apps/web` から `apps/api` 経由のみ）。
7. test file は `*.spec.ts` のみ。

## 視覚証跡

**UI/UX 変更なしのため Phase 11 スクリーンショット不要**。本タスクは transport 選択ロジックの内部抽出（pure refactor / NON_VISUAL）であり、画面表示・操作導線・レイアウトに一切変更がない。

代替証跡:

| 証跡 | 内容 |
| --- | --- |
| `phase-10-final-review.md` | 最終レビュー（pure refactor 不変条件チェック・呼び出し側差替の挙動同一性） |
| `phase-11-manual-test.md` | focused vitest（util spec + 5 既存回帰 spec）+ `typecheck` + `lint` の実行計画（NON_VISUAL evidence） |
