# Phase 12: 実装ガイド（implementation-guide）

## メタ情報

| 項目 | 値 |
|------|------|
| Phase | 12 |
| taskType | NON_VISUAL |
| visualEvidence | NON_VISUAL（証跡は focused tests + staging 実機ログ） |
| workflow_state | `implemented_local_evidence_captured` |

---

## Part 1: 中学生レベルの概念説明（なぜ → 何を）

### なぜこれが必要か（配達トラックの例え話）

マイページを開くのは、宅配トラックが「あなたの荷物（マイページの情報）」を取りに行くのに似ています。トラックには「どの住所に行くか」が決まっていて、本番の住所は会社の倉庫（service-binding）です。あなたのパソコンの中にある練習用の小屋（localhost）ではありません。

いま困っているのは、トラックが荷物を持って帰れず、画面に「いまは確認できません」とだけ出ることです。ある人が「もしかして、本番の倉庫じゃなくて、自分のパソコンの練習用の小屋（127.0.0.1 = localhost）に間違って行ってない？」と心配しました。コードをよく調べた答えは **「いいえ、行っていません」** です。理由は、(1) 練習用の小屋の番号は別の番号（8787）で、心配されていた番号（8888）はアプリのどこにも書かれていない、(2) 本番では会社の倉庫（service-binding）に行く仕組みが先に効くからです。心配の正体は、ブラウザの拡張機能という別のアプリが勝手に 8888 をたたいていたノイズでした。

ただし問題は、**トラックがどの住所に行ったかを、誰も伝票に書いていなかった**ことです。だから「ちゃんと倉庫に行ったよ」と証明できませんでした。そして「本当に荷物が帰れなかった理由（住所が消えていた＝退会扱い／倉庫の人が倒れていた＝サーバー故障／電話線が切れていた＝通信失敗）」も伝票がないと見分けられません。

### 何をするか

1. **伝票に「行った住所」を書く**（観測性強化）。トラックが失敗したときの記録（`server_fetch_failed` ログ）に、「どの方法で行ったか（service-binding か http か = `transportKind`）」と「行った住所（`baseHost`）」を書き足します。これで「住所は会社の倉庫（service-binding.local）で、練習用の小屋（localhost）ではない」と**伝票で証明**できます。同時に、本当の失敗理由（退会＝410／故障＝5xx／通信失敗）も伝票の「ステータス」で見分けられます。大事なのは、伝票に**個人情報（会員番号やパスワードのようなもの）は絶対に書かない**ことです。住所と結果だけ書きます。

2. **住所が空欄なら配達に行かない**（fail-closed）。もし「どこに行くか」の設定が壊れていて住所が決まっていないとき、いまの仕組みは念のため練習用の小屋（localhost）に行こうとする抜け道がありました。本番（staging / production）ではこの抜け道をふさぎ、**住所が決まらないならエラーで止める**ようにします。間違った場所に荷物を持っていく事故を、起きる前に防ぎます。

3. **検査の案内を足す**（運用補助）。`diagnose-profile-session.sh` という「見るだけで何も壊さない」検査スクリプトに、「伝票（ログ）の住所欄をどう確認するか」の案内を 1 行足します。

この 3 つは「原因を見分ける」ためのもので、退会扱いの人をどう案内するか・サーバー故障をどう直すかといった**本格的な手当ては、伝票で本当の理由がはっきりしてから**やります（先送りではなく、理由が決まらないと手当ての方針を決められないため）。

---

## Part 2: 技術者向け実装ガイド

### 背景

`/profile`（Server Component・`apps/web/app/(member)/profile/page.tsx`）は `safeServerFetch(() => fetchAuthed("/me"))` で `/me` を取得し、失敗を `mapProfileSessionErrorToDisplay`（dev 取込済 `session-error-display.ts`）で 404 / 410 / 5xx / transport 失敗 に分類する。401 は `/login` redirect されバナーにならない（C5 除外）。残る真因（410 / 5xx / service-binding 通信失敗）は staging 実機の HTTP ステータス依存で、現状ログ（`safe-fetch.ts` の `server_fetch_failed`）は `{code, path, status}` のみで **transport 解決先が記録されない**ため確定できない。

`resolveApiFetch`（`transport.ts`）の解決順序は (1) isTest×baseUrl → http、(2) `API_SERVICE` → service-binding、(3) baseUrl → http、(4) `(environment ?? "local") === "local"` → localhost フォールバック、(5) throw。`getEnvironment()` は `ENVIRONMENT` が enum 3値以外だと `"local"` を返すため step4 で localhost に行く穴がある（staging では step2 で先に解決されるが、設定破損時に顕在化し得る）。

### 要約

transport 解決先の可視化（`transportKind`/`baseHost` をログに追加）と localhost fail-closed（`environmentExplicit=false` 時 step4 を塞ぐ）を 1 サイクルで実装する。`/me` の path・shape・status 体系・D1 schema・Google Form 仕様・`apps/api/src/**` は一切変更しない（AC-9 / apps/api 非接触）。診断メタ生成は `describeTransport` に一元化し、`authed.ts` は付与のみ、`safe-fetch.ts` は読み取り・出力のみ。

### TypeScript 型定義（CONST-005 主要シグネチャ）

```ts
// F1: transport.ts
export interface ApiTransportDescriptor {
  readonly transportKind: "service-binding" | "http";
  readonly baseHost: string; // service-binding は SERVICE_BINDING_ORIGIN の host、http は new URL(baseUrl).host
}
export function describeTransport(transport: ApiTransport): ApiTransportDescriptor;

export interface ApiTransportEnv {
  API_SERVICE?: { fetch: typeof fetch } | undefined;
  baseUrl?: string | undefined;
  environment?: "local" | "staging" | "production" | undefined;
  environmentExplicit?: boolean | undefined; // 追加: ENVIRONMENT が enum 3値で明示注入されたか
  isTest?: boolean | undefined;
}

// F2: env.ts
export function getEnvironmentResolution(
  rawEnv?: RawEnv,
): { environment: "local" | "staging" | "production"; explicit: boolean };

// F3: errors.ts
export class FetchAuthedError extends Error {
  readonly status: number;
  readonly bodyText: string;
  readonly transport?: ApiTransportDescriptor;
}
export class ApiTransportError extends Error {
  readonly transport: ApiTransportDescriptor;
  readonly cause?: unknown;
}
```

### `describeTransport` 改修

純関数。新規 localhost/8787/8888 リテラルを焼かず、既存定数 `SERVICE_BINDING_ORIGIN`（`https://service-binding.local`）と `t.baseUrl`（ランタイム値）から `new URL(...).host` で抽出する（phase-4 §1）。

```ts
export function describeTransport(t: ApiTransport): ApiTransportDescriptor {
  if (t.kind === "service-binding") {
    return { transportKind: "service-binding", baseHost: new URL(SERVICE_BINDING_ORIGIN).host };
  }
  return { transportKind: "http", baseHost: new URL(t.baseUrl).host };
}
```

### `getEnvironmentResolution` 改修（env.ts）

`rawEnv["ENVIRONMENT"]` が `"local"|"staging"|"production"` に厳密一致 → `{ environment: <値>, explicit: true }`。不一致/未定義 → `{ environment: "local", explicit: false }`。`getEnvironment` は後方互換のため不変（戻り値は本関数の `environment` と常に同値）。入出力表は phase-4 §2（E-1〜E-5）。

### `resolveApiFetch` 改修（fail-closed）

step4 の条件を `(environment ?? "local") === "local" && environmentExplicit === true` に変更。`environmentExplicit !== true`（未注入/不正/省略）のとき step4 を skip → step5 throw（fail-closed）。明示 `ENVIRONMENT=local` のときだけ local fallback を許可する。真理値表は phase-4 §3.2（R-1〜R-8）。R-7（`false` × binding 無 × baseUrl 無 × local）が本タスクの核心で throw する。throw メッセージは「ENVIRONMENT 未注入で transport 解決不能（fail-closed）」を示し、`apps/web/src/app/error.tsx` の error boundary が補足する。

### `authed.ts` 配線

```ts
const resolution = getEnvironmentResolution();
const transport = resolveApiFetch({
  API_SERVICE: env.API_SERVICE,
  baseUrl: env.INTERNAL_API_BASE_URL,
  environment: resolution.environment,
  environmentExplicit: resolution.explicit,
  isTest: getTransportRuntimeIsTest(),
});
const descriptor = describeTransport(transport);
// 非2xx        -> new FetchAuthedError(status, text, descriptor)
// fetch throw  -> fetchViaApiTransport が ApiTransportError(..., descriptor, cause) に wrap
```

### ログ shape（safe-fetch.ts）

`logServerFetchFailure` の `console.error("server_fetch_failed", {...})` に `transportFromError(originalError)` で取り出した `error.transport` を flat spread する。

```ts
function transportFromError(err: Error): ApiTransportDescriptor | undefined {
  const transport = (err as { readonly transport?: unknown }).transport;
  if (transport && typeof transport === "object") {
    const t = transport as { transportKind?: unknown; baseHost?: unknown };
    if ((t.transportKind === "service-binding" || t.transportKind === "http") && typeof t.baseHost === "string") {
      return { transportKind: t.transportKind, baseHost: t.baseHost };
    }
  }
  return undefined;
}
// 出力キー: code / path / status / transportKind? / baseHost?
```

出力キー契約は phase-4 §4。**禁止キー（不変条件 #11・AC-3）**: `memberId` / `cookie` / `secret` / `token` / `authorization` / リクエストボディ。診断メタを持たない error ではキー自体が現れない（spread が空 → 既存テスト回帰ゼロ・AC-8）。`safeServerFetch` の公開シグネチャは不変（元 error の受け渡しは内部に閉じる）。

### エラーハンドリング

- 非 2xx 応答 → `FetchAuthedError`（`status` + `transportKind`/`baseHost`）。`safe-fetch` が `MEMBER_SESSION_<status>` に正規化（410 → `MEMBER_SESSION_410` 等）。
- fetch throw（接続失敗）→ `ApiTransportError`（status を持たない）。`safe-fetch` が `MEMBER_SESSION_FAILED` に正規化し `transportKind`/`baseHost` をログに出す（AC-7）。
- 401 → 従来どおり `AuthRequiredError` rethrow → `/login` redirect（観測対象外・回帰なし）。
- fail-closed throw（R-7）→ `apps/web/src/app/error.tsx` の error boundary が補足。

### 設定値・定数一覧

| 識別子 | 値 / 役割 |
|--------|-----------|
| `SERVICE_BINDING_ORIGIN` | 既存定数（`https://service-binding.local`）。`baseHost` 抽出に流用（新規リテラル焼き込みなし） |
| `LOCAL_API_FALLBACK_BASE_URL` | 既存ローカルフォールバック定数（local 開発時のみ使用）。`describeTransport` の D-3 で `new URL().host` 抽出 |
| `environmentExplicit` | 新規 optional フィールド。`ENVIRONMENT` が enum 3値で明示注入されたか。`false` 時 step4 を塞ぐ |
| `transportKind` | `"service-binding"` \| `"http"`。ログ・診断メタの transport 種別 |
| `baseHost` | host（hostname+port）のみ。scheme/path/query/cookie/secret を含めない |
| `server_fetch_failed` | 既存ログイベント名（snake_case）を据え置き拡張。新規イベント名は作らない |
| `MEMBER_SESSION_410` / `_5xx` / `_FAILED` / `_404` | 既存 safe fetch code 体系（dev 取込済・本タスクで変更しない） |

### 検証コマンド

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/lib/fetch/transport.spec.ts \
  apps/web/src/lib/fetch/__tests__/transport-select.spec.ts \
  apps/web/src/lib/fetch/authed.spec.ts \
  apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts \
  apps/web/src/lib/__tests__/env.spec.ts
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-no-localhost-bake.sh --src-only
bash -n scripts/diagnose-profile-session.sh
git diff --stat -- apps/api   # 空であること（apps/api 非接触・AC-9）
```

### 既知制限

- `/me` の shape・path・status 体系・D1 schema・Google Form 仕様・`apps/api/src/**` は一切変更しない（AC-9）。
- 本タスクは観測性強化 + fail-closed のみ。真因確定後の本格修正（410 復帰 / 5xx 根治 / transport 運用是正 / 管理者 UX）は未タスク化し、既存 #1189-1192 に統合する（CONST_007 例外①）。
- 実コード実装・focused vitest・diagnose syntax check は完了。staging deploy・wrangler tail・commit・PR は user-gated。

---

## 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。代替証跡は `manual-test-result.md`（focused tests T1〜T5 の名前と件数 + staging 実機ログの主ソース）と focused tests である。screenshots/ は空のまま保持する（PNG 0 枚）。

| 証跡 | パス / 内容 | 状況 |
|------|-------------|------|
| focused tests | T1〜T5（transport/transport-select/authed/safe-fetch/env spec） | PASS（5 files / 70 tests） |
| staging 実機ログ | `server_fetch_failed` の `{transportKind, baseHost, status}`（`wrangler tail` MT-A〜MT-D） | pending（user-gated） |
| スクリーンショット | （NON_VISUAL ゆえ取得しない） | n/a |

## 完了条件

- [x] Part 1（中学生レベル・例え話・なぜ→何を・専門用語を避けた説明）を記述した。
- [x] Part 2（TypeScript 型定義 / describeTransport / getEnvironmentResolution / resolveApiFetch 改修 / ログ shape / エラーハンドリング / 設定値一覧）を背景・要約・検証コマンド・既知制限つきで記述した。
- [x] `## 視覚証跡` で「UI/UX 変更なしのため Phase 11 スクリーンショット不要。代替証跡は manual-test-result.md と focused tests」を明記した。
- [x] 識別子（`describeTransport`/`getEnvironmentResolution`/`ApiTransportDescriptor`/`ApiTransportError`/`transportKind`/`baseHost`/`server_fetch_failed`）を SSOT と一致させた。

## 成果物
- `outputs/phase-12/implementation-guide.md`（本ファイル）

## 参照資料
- `../../_shared-context.md` §3（真因）/ §4（変更対象）/ §5（シグネチャ）
- `../phase-2/phase-2.md`（fail-closed・describeTransport・ログ拡張）/ `../phase-4/phase-4.md`（I/O 契約 D/E/R/T 表）
- 実コード: `apps/web/src/lib/fetch/transport.ts` / `authed.ts` / `errors.ts`、`apps/web/src/lib/env.ts`、`apps/web/src/lib/server-fetch/safe-fetch.ts`
