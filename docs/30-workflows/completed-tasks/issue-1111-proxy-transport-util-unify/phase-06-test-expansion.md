# Phase 06 — テスト拡張（fail path / 回帰 guard）

## 1. 方針

Phase 04 の正常系（kind 分岐・log 引数）に加え、**例外伝播**と**呼び出し側固有の後処理が抽出後も不変であること**を回帰 guard として固定する。util `selectAndFetch` は try/catch を持たず（現状の各呼び出し側も binding/HTTP 例外を握り潰さない）、例外は呼び出し側へそのまま伝播させる設計を確認する。新規 endpoint・D1 アクセスは発生させない。

## 2. util の例外伝播（`transport-select.spec.ts` へ追加）

| # | シナリオ | mock | 期待 |
| --- | --- | --- | --- |
| T-15 | binding 経路で `binding.fetch` が throw | `bindingFetch = vi.fn().mockRejectedValue(new Error("boom"))` | `selectAndFetch(...)` が同 Error を reject（util は try/catch せず伝播）。`log` 未呼出 |
| T-16 | http-fallback 経路で global `fetch` が throw | `globalFetch.mockRejectedValue(new Error("net"))`・`binding: undefined`・`resolveBase: () => "http://h"` | `selectAndFetch(...)` が同 Error を reject。`log` 未呼出 |
| T-17 | `resolveBase` 自体が throw | `resolveBase: () => { throw new Error("base") }`・`binding: undefined` | 同 Error を伝播。global `fetch` 未呼出 |

> いずれも `await expect(selectAndFetch(...)).rejects.toThrow(...)` で確認。util がエラーを変換・吸収しないこと（呼び出し側の既存 error handling が抽出後も同じ例外を受け取れること）を保証する。

## 3. 呼び出し側回帰 guard（既存 spec を再実行して不変確認）

抽出後も既存 spec が緑であることで、各呼び出し側固有の後処理が transport 抽出の影響を受けないことを担保する。新規 spec は追加せず**既存 spec を再実行**する。

| # | 不変対象 | 担保する spec | 確認内容 |
| --- | --- | --- | --- |
| R-1 | route.ts の base-unavailable → 500 | `route.spec.ts` | `apiBase(env)===null`（staging/prod で `INTERNAL_API_BASE_URL` 未設定）時、`selectAndFetch` が `{ kind: "base-unavailable" }` を返し route.ts が **500 JSON Response**（`error: "internal_api_base_url_missing"`）を返す経路が緑のまま |
| R-2 | route.ts の binding/HTTP 分岐 + secret/header 構築 | `route.spec.ts` | binding 経路・HTTP fallback 経路の双方で upstream へ正しい URL・header・body が渡る。`upstream.text()` / status / content-type 透過が不変 |
| R-3 | server-fetch の 404 warn / `AdminFetchError` throw | `server-fetch.http-fallback.spec.ts` | `!res.ok` 後処理（404 warn ログ・`AdminFetchError` throw）が transport 抽出後も同条件で発火 |
| R-4 | server-fetch の binding fixture 経路 | `server-fetch.binding.spec.ts` | fixture（test 時 binding 無効化）で `resolveServiceBinding` が `disableBinding=true` のとき undefined を返し HTTP 経路へ落ちる。`logAdminTransport`(scope:admin) の出力が不変 |
| R-5 | server-fetch の env base 解決 | `server-fetch.env.spec.ts` | `resolveApiBase()` の base 解決（INTERNAL アクセサ → getEnv フォールバック・末尾 `/` 除去）が抽出後も不変 |
| R-6 | public の binding/HTTP 分岐 + scope 無しログ | `public.spec.ts` | `logTransport`（scope 無し）の出力が不変。binding 経路・HTTP fallback 経路の kind が一致 |
| R-7 | public の PLAYWRIGHT cache bypass | `public.spec.ts` | PLAYWRIGHT 時に `effectiveInit`（cache bypass 付き init）が `selectAndFetch` の `init` として渡り、bypass が抽出後も有効。cache 制御は util 外（doFetch 側）に残る |

## 4. 実行コマンド

```bash
# util 単体（T-1〜T-17）+ 回帰 5 ファイル一括
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/lib/fetch/__tests__/transport-select.spec.ts \
  apps/web/app/api/admin/[...path]/route.spec.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts \
  apps/web/src/lib/fetch/public.spec.ts
```

## 5. Phase 06 完了条件

- [ ] util の例外伝播（T-15/T-16/T-17）が PASS。util は try/catch せず呼び出し側へ伝播する。
- [ ] R-1〜R-7 の既存 spec が**編集なしで全 PASS**（pure refactor の回帰 guard 成立）。
- [ ] route.ts の base-unavailable→500・server-fetch の 404 warn / `AdminFetchError` throw・public の PLAYWRIGHT cache bypass が抽出後も不変であることを既存 spec で確認済み。
