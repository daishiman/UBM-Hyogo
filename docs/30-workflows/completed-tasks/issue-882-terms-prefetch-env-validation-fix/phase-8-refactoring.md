# Phase 8 — リファクタリング

## 対象

`apps/web/src/lib/seo/site-metadata.ts` の env 解決ロジックが `getSiteUrl` と `buildBaseMetadata` の 2 箇所に重複するため、private helper に集約する。

```ts
function resolvePublicEnv(): Pick<Env, "ENVIRONMENT" | "NEXT_PUBLIC_API_BASE_URL"> {
  return getPublicEnvSafe() ?? DEFAULT_PUBLIC_ENV;
}
```

`getSiteUrl` / `buildBaseMetadata` 双方で `resolvePublicEnv()` を呼ぶ。

## 完了条件

- リファクタ後も全テスト PASS。
- 公開 export surface は変わらないこと（`getSiteUrl` / `buildBaseMetadata` / `buildPageMetadata`）。
