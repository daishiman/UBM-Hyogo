# Phase 8 — リファクタ

## 範囲

最小限。本タスクは bugfix であり、リファクタは伴わない。

## 共通化候補(本サイクル外)

- `apps/web/src/lib/fetch/public.ts` と `apps/web/src/lib/admin/server-fetch.ts` の "service-binding 優先 + test fallback" ロジックは類似。将来共通 helper (`getServiceBindingOrFetch(env)`) として括る余地あり
- ただし現状 fetcher 経路は public / admin で auth header / cookie 取り扱いが異なるため、本サイクルで共通化しない(CONST_003: 過度な抽象化を避ける)

## 削除候補

なし。既存 fixture 早期 return 群は意図通り維持。
