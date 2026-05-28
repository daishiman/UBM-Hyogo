# Implementation Guide

## Part 1: 中学生レベル

なぜ必要かを先に言うと、staging の `/profile` がサーバー側の読み込み失敗で落ち、ユーザーには原因が分からないエラー画面だけが見えていたためです。何をしたかは、API の住所を読む場所を env.ts に揃え、失敗時にページ全体を落とさない形へ直したことです。

UBM 兵庫支部会のメンバーサイトには、自分の登録内容を見る「マイページ（`/profile`）」があります。本番に近い staging 環境でこのページを開こうとすると、「マイページの読み込みに失敗しました」というエラー画面に切り替わってしまっていました。

原因はざっくり言うと、**「自分の住所メモを間違った棚から探していた」** ことです。

私たちのサイトは Cloudflare Workers という「世界中に散らばっている超軽量サーバー」で動いています。このサーバーには「環境変数（env）」という設定メモが登録されていて、たとえば「API サーバーの住所はここ」というメモが置かれています。

これまでのコードは、このメモを **古い棚（`process.env` という Node.js の伝統的な棚）** から取り出そうとしていました。でも Cloudflare Workers では、メモは **新しい棚（`getCloudflareContext().env`）** に置かれているので、古い棚を見ても空っぽ。空っぽだったときの保険として「とりあえず自分のパソコンの中（`127.0.0.1`）に聞きに行く」というコードが書かれていましたが、Cloudflare Workers は世界中に散らばっているサーバーなので「自分のパソコン」なんて場所はなく、結局誰にも繋がらずエラーになっていたのです。

さらに、`/profile` のページは「自分の情報を取りに行って失敗したら、その場でドカンと落ちる」設計になっていました。そのため、上の env トラブルでネットワーク呼び出しが失敗した瞬間、ページ全体が「Server Components render error」というエラーで真っ白になっていました。

今回の修正で:

1. **新しい棚から取り出す** ように直しました（env.ts の `getApiBaseEnv()` という、棚を間違えない関数を経由するルールに合わせた）。
2. **「ダメだったらパソコンの中に聞きに行く」という保険を撤去** しました（代わりに、設定が無ければはっきりエラーにする）。
3. **「失敗したら落ちる」を「失敗したら『失敗しました』とユーザーに見せる』** に変えました（`safeServerFetch` という安全装置でくるんだ）。
4. **同じ間違いを二度としないように見張り（テスト）を置きました**（`authed.ts` の中で古い棚を直接見るコードや `127.0.0.1` が書かれたら CI が即座に止める）。

### 今回作ったもの

- env.ts の `getApiBaseEnv()`（API 住所だけを取り出す窓口）
- `/profile` の `/me` 失敗時に落ちずに `SectionError` を返す経路
- `getApiBaseEnv()`、`fetchAuthed`、`ProfilePage` の focused regression spec

| 用語 | 日常語での言い換え |
| --- | --- |
| env | 設定メモ |
| Cloudflare Workers | 世界中にある軽い実行場所 |
| Server Component | サーバー側で先に作る画面部品 |
| fallback | だめだったときの予備ルート |
| safeServerFetch | 失敗してもページが落ちないようにする安全装置 |
| SectionError | 「ここだけ失敗しました」とユーザーに見せる小さなエラー枠 |

## Part 2: 技術者レベル

### 背景

`apps/web/src/lib/fetch/authed.ts` は member route group の Server Component から API Worker を呼ぶ helper である。Cloudflare Workers runtime では `process.env["INTERNAL_API_BASE_URL"]` / `process.env["PUBLIC_API_BASE_URL"]` が binding 正本ではないため、`getApiBaseEnv()` 経由で `getCloudflareContext().env` を優先する必要がある。

さらに `apps/web/app/(member)/profile/page.tsx` は初回 `/me` 呼び出しを `try/catch` + `throw err;` で Server Component に bubble up させていたため、env 解決失敗や API 5xx が即 SCR digest 化していた。既存 `/me/profile` 経路は既に `safeServerFetch` でラップされており、本タスクで `/me` 経路も同型化する。

### 実装ステップ

1. `apps/web/src/lib/fetch/authed.ts` に `getApiBaseEnv()` を import し、runtime base URL を `getApiBaseEnv().INTERNAL_API_BASE_URL` / `getApiBaseEnv().PUBLIC_API_BASE_URL` から解決する。
2. `FALLBACK_INTERNAL_API = "http://127.0.0.1:8787"` を削除する。env 未解決時は throw する（fail-fast）。
3. `apps/web/app/(member)/profile/page.tsx` の初回 `/me` を `safeServerFetch(..., { codePrefix: "MEMBER_SESSION", rethrowOn: [AuthRequiredError] })` でラップし、`!ok` 時に SectionError UI を返す。
4. `apps/web/src/lib/fetch/authed.spec.ts` を更新し、`getApiBaseEnv()` 経由 + `process.env` 直接参照 0 件 + `127.0.0.1` リテラル 0 件を固定する。
5. `apps/web/app/(member)/profile/page.spec.tsx`（または既存 `page.spec.tsx` への追記）で `/me` 5xx 時に throw せず SectionError UI を返すこと、401 時に `/login?redirect=/profile` へ redirect することを固定する。

### API / Type Contract

```ts
export interface ApiBaseEnv {
  INTERNAL_API_BASE_URL?: string;
  PUBLIC_API_BASE_URL?: string;
}

export const fetchAuthed: <T>(
  path: string,
  init?: RequestInit,
) => Promise<T>;

export function getApiBaseEnv(rawEnv?: RawEnv): ApiBaseEnv;
```

### APIシグネチャ

```ts
fetchAuthed<T>(path: string, init?: RequestInit): Promise<T>
getApiBaseEnv(rawEnv?: RawEnv): ApiBaseEnv
```

### 使用例

```ts
const me = await fetchAuthed<MeSessionResponse>("/me");
```

`fetchAuthed` の public signature は不変。既存 API endpoint surface も不変。`ProfilePage` の export も不変（default export server component）。

### Error Handling

| Case | Behavior |
| --- | --- |
| `INTERNAL_API_BASE_URL` / `PUBLIC_API_BASE_URL` どちらも missing | `resolveApiBase()` が throw し、localhost fallback は使わない |
| API 401 | `AuthRequiredError` を throw、`profile/page.tsx` で `/login?redirect=/profile` へ redirect |
| API 5xx / network error / env 解決失敗 | `safeServerFetch` で捕捉され、SectionError UI を返す（SCR digest 化しない） |

### エラーハンドリング

`AuthRequiredError` だけは redirect のために再 throw する。それ以外の env 解決失敗、network failure、API 5xx は `safeServerFetch` が `SafeResult` に変換し、`ProfilePage` が `SectionError` として表示する。

### エッジケース

- `INTERNAL_API_BASE_URL` が空で `PUBLIC_API_BASE_URL` がある場合は PUBLIC を使う。
- 両方空の場合は localhost fallback せず明示的に throw する。
- `/me` が 401 の場合は既存通り `/login?redirect=/profile` へ redirect する。

### 設定項目と定数一覧

| Key | 用途 |
| --- | --- |
| `INTERNAL_API_BASE_URL` | Server Component から API Worker へ向く優先 base URL |
| `PUBLIC_API_BASE_URL` | INTERNAL 未設定時の fallback base URL |
| `MEMBER_SESSION` | `/me` safe fetch の error code prefix |

### テスト構成

| Spec | 固定する契約 |
| --- | --- |
| `apps/web/src/lib/__tests__/env.spec.ts` | `getApiBaseEnv()` が full `EnvSchema` を要求せず部分取得できる |
| `apps/web/src/lib/fetch/authed.spec.ts` | INTERNAL -> PUBLIC -> fail-fast、source guard |
| `apps/web/app/(member)/profile/page.spec.tsx` | `/me` 5xx は SectionError、401 は redirect |

### Verification Commands

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/fetch/authed.spec.ts \
  "apps/web/app/(member)/profile/page.spec.tsx" \
  apps/web/src/lib/__tests__/env.spec.ts

pnpm --filter @ubm-hyogo/web typecheck
```

Broader `lint` / build / `bash scripts/verify-pr-ready.sh` / staging runtime smoke は Phase 13 user-gated checks として残す。
