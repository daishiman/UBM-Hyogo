# Phase 2: 設計

## 設計方針

`isolateId` を **lazy 初期化 + module-scope cache** とする。初回参照時に `crypto.randomUUID()` を 1 回だけ評価し、以降は cached value を返す。これにより:

- module load 時 (= global scope) には `crypto.randomUUID()` を一切呼ばない
- 同一 isolate 内の全ての log emission で同じ `isolateId` が使われる (既存 semantics 維持)
- isolate が再生成された場合は新しい `isolateId` が再採番される (Cloudflare Workers の isolate 寿命に従う)

## 代替案検討

| 案                                              | 採否 | 理由                                                                                       |
| ----------------------------------------------- | ---- | ------------------------------------------------------------------------------------------ |
| (採用) lazy init + module-scope `let` cache     | ✅   | 既存契約 (isolate ごとに stable な ID) を維持しつつ global scope での `randomUUID` を排除 |
| handler ごとに毎回 `crypto.randomUUID()` 再生成 | ❌   | 同一 isolate 内で `isolateId` が一意でなくなり、dedup 観測時の trace が壊れる              |
| 環境変数で外部注入                              | ❌   | wrangler.toml 変更必要・dynamic random 性が失われる                                        |

## API シグネチャ

```ts
// apps/api/src/routes/internal/alert-relay.ts

// Before (line 17):
// const isolateId = crypto.randomUUID();

// After:
let cachedIsolateId: string | undefined;

function getIsolateId(): string {
  if (cachedIsolateId === undefined) {
    cachedIsolateId = crypto.randomUUID();
  }
  return cachedIsolateId;
}
```

利用箇所 (`emitKvOperationError`, line 62):

```ts
// Before:
isolateId,

// After:
isolateId: getIsolateId(),
```

## 影響範囲

| ファイル                                                      | 変更種別 | 内容                                                                |
| ------------------------------------------------------------- | -------- | ------------------------------------------------------------------- |
| `apps/api/src/routes/internal/alert-relay.ts`                 | edit     | line 17 を `let cachedIsolateId` + `getIsolateId()` 関数に置換      |
| `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`  | edit     | global scope での randomUUID 非呼び出しを契約化する describe を追加 |

## ロック・データ所有権

- `cachedIsolateId` は module-scope の単一変数。書き込みは `getIsolateId()` 内のみ
- Cloudflare Workers は single-threaded per isolate のため race condition は発生しない
- isolate 跨ぎ (= 別 worker instance) では cache がクリアされ正しく再採番される

## システム観点チェック

| 観点         | 影響                                                                  |
| ------------ | --------------------------------------------------------------------- |
| セキュリティ | 影響なし (auth header verify は別 middleware)                         |
| 性能         | 初回呼び出し時のみ `crypto.randomUUID()` (μs オーダー)・以降は無コスト |
| 可観測性     | log payload の `isolateId` 契約維持                                   |
| デプロイ     | wrangler validation pass (本タスクの目的そのもの)                     |
