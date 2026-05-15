# Implementation Guide

## Part 1: 中学生レベル

会員ページを表示するとき、表側のサイトは裏側の仕組みにデータを取りに行く。Cloudflare では、この表側と裏側を「内線電話」のような安全な通り道でつなげる。

テスト中だけは、本物の裏側ではなく、練習用の相手につなぎたい。そのため、テスト中は別の住所を使えるようにする。ただし、本番で間違えて別の住所が入っても、内線電話を使わないとページが壊れたり、外に余計な通信が出たりする。

この変更では、「別の住所を使ってよいのはテスト中だけ」と決める。普段の本番と本番前確認では、必ず安全な内線電話を優先する。

| 用語 | 日常語での言い換え |
| --- | --- |
| service binding | 内線電話 |
| HTTP fallback | 普通の外線電話 |
| production | 本番 |
| staging | 本番前の練習場所 |
| CI | 自動で確認してくれる係 |

## Part 2: 技術者レベル

### Interface / Type

```ts
interface ServiceBinding {
  fetch: typeof fetch;
}

interface PublicEnv {
  API_SERVICE?: ServiceBinding;
  PUBLIC_API_BASE_URL?: string;
}
```

### API Signature

```ts
function isTestOrPlaywright(): boolean;
function getServiceBinding(): ServiceBinding | undefined;
export async function fetchPublic<T>(path: string, options?: FetchPublicOptions): Promise<T>;
```

### Behavior

- `NODE_ENV === "test"` / `PLAYWRIGHT_TEST === "1"` のいずれかが真、かつ `PUBLIC_API_BASE_URL` がある場合のみ HTTP fallback を優先する。`CI === "true"` 単独では HTTP fallback を許可しない。
- それ以外では `API_SERVICE.fetch()` を優先する。
- service binding がない local dev では既存どおり `PUBLIC_API_BASE_URL` または default `http://localhost:8787` を使う。

### Error Handling / Edge Cases

- response 非 2xx は既存どおり `fetchPublic failed` を throw する。
- `fetchPublicOrNotFound()` の 404 専用 error は変更しない。
- test/Playwright 判定 env は module-local `isTestOrPlaywright()` に閉じ、`getEnv()` schema は変更しない。

### Constants

| Name | Value / Meaning |
| --- | --- |
| `DEFAULT_BASE_URL` | `http://localhost:8787` |
| `NODE_ENV=test` | Vitest fallback 許可 |
| `PLAYWRIGHT_TEST=1` | Playwright fallback 許可 |
