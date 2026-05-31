# 実装ガイド — AdminFetchError typed class 導入

**[実装区分: 実装仕様書]**

## Part 1: 概念説明（はじめての人向け）

### なぜ必要か（先に理由）
管理画面はサーバーの裏側にある「管理用 API」に問い合わせて情報を取ってきます。この問い合わせが失敗したとき、いまのプログラムは「`admin api /admin/audit failed: 404`」という **1 本の文章** だけをエラーとして投げています。

ここで困るのが、「404（ページが見つからない）なのか、500（サーバーが壊れた）なのか」を後から知りたいとき、この **文章を虫めがねで読んで数字を探す** ようなことをしている点です。文章の書き方が少しでも変わると、虫めがねの探し方も壊れてしまいます。

### 何をするか
エラーを「ただの文章」ではなく、**ラベル付きの箱** に変えます。箱には最初から:
- `status`（404 や 500 という数字）
- `path`（どの API でこけたか）
- `responseBodySnippet`（サーバーが返した中身の最初の部分。最大 500 文字）

が **仕切り** に分けて入っています。これで虫めがねで文章を読む必要がなくなり、「箱の status の仕切りを見るだけ」で 404 と 500 を見分けられます。

### 大事な約束（こわさない）
箱の **表のラベル（文章そのもの）は、いまと一字一句同じ** にします。なぜなら、いまその文章をあてにしている検査（テスト）がたくさんあるからです。中身を仕切りに分けて便利にするけれど、表書きは変えない——これが今回いちばん気をつけるところです。

たとえるなら、お弁当箱の中をおかずごとに仕切るけれど、フタに貼ってあるラベルのシールはそのまま、という感じです。

## Part 2: 技術詳細（開発者向け）

### 追加する型（TypeScript）
`apps/web/src/lib/admin/server-fetch.ts` に追加:

```ts
export class AdminFetchError extends Error {
  readonly status: number;
  readonly path: string;
  readonly responseBodySnippet: string | null;

  constructor(opts: { path: string; status: number; responseBody?: string | null }) {
    const rawBody = opts.responseBody === undefined ? null : opts.responseBody;
    const messageSuffix = rawBody ? ` body=${rawBody.slice(0, 256)}` : "";
    super(`admin api ${opts.path} failed: ${opts.status}${messageSuffix}`);
    this.name = "AdminFetchError";
    this.status = opts.status;
    this.path = opts.path;
    this.responseBodySnippet = rawBody === null ? null : rawBody.slice(0, 500);
  }
}

export function isAdminFetchError(error: unknown): error is AdminFetchError {
  const candidate = error as {
    readonly name?: unknown;
    readonly path?: unknown;
    readonly status?: unknown;
  };
  return (
    error instanceof AdminFetchError ||
    (error instanceof Error &&
      candidate.name === "AdminFetchError" &&
      typeof candidate.path === "string" &&
      typeof candidate.status === "number")
  );
}
```

### 使用例（throw 側 / server-fetch.ts error path）
```ts
let rawBody: string | null = null;
try {
  rawBody = await res.text();
} catch { /* body 読み取り失敗は致命的でない */ }
// 404 warn は不変
throw new AdminFetchError({ path, status: res.status, responseBody: rawBody });
```

### 使用例（consume 側 / 共通正規化 safe-fetch.ts、admin 非依存 duck typing）
```ts
function statusFromError(err: Error): number | null {
  const candidate = (err as { status?: unknown }).status;
  if (typeof candidate === "number" && Number.isInteger(candidate)) return candidate;
  const match = err.message.match(STATUS_FROM_MESSAGE); // 後方互換 fallback
  return match ? Number(match[1]) : null;
}
```

### エラーハンドリング / エッジケース
| ケース | 挙動 |
| --- | --- |
| `responseBody` 未指定 / `null` | `responseBodySnippet=null`、message suffix なし |
| `responseBody=""` | suffix 抑止（falsy）、`responseBodySnippet=""`（null と区別） |
| `responseBody` 256 文字超 | message suffix は 256 切り、`responseBodySnippet` は 500 切り（独立スライス） |
| Workers cross-module で `instanceof` false | `isAdminFetchError` の `name === "AdminFetchError"` + `path/status` fallback で吸収 |

### 設定可能なパラメータ / 定数
| 定数 | 値 | 根拠 |
| --- | --- | --- |
| message body suffix 上限 | 256 | 現状コード（`server-fetch.ts:513`）と `binding.spec.ts:101` の byte-identical 維持 |
| `responseBodySnippet` 上限 | 500 | Issue #991 AC（PII 流入防止） |
| message format | `admin api ${path} failed: ${status}${" body=" + body.slice(0,256)?}` | 既存テスト互換（変更禁止） |

### 識別子一覧（実装時 grep 確認対象 / FB-W1-02b-3）
- `AdminFetchError`（class, export）
- `isAdminFetchError`（function, export）
- `responseBodySnippet`（field）
- `statusFromError`（safe-fetch.ts 内 helper）
- `STATUS_FROM_MESSAGE`（既存正規表現, 維持）

## 視覚証跡
UI/UX 変更なしのため Phase 11 スクリーンショット不要。代替証跡は `outputs/phase-11/manual-test-result.md`（focused Vitest）および `outputs/phase-10/phase-10.md`。
