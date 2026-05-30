# Lessons Learned: issue-976 admin server-fetch service-binding

## L-I976-001: Public/Admin server-fetch の transport symmetry を Phase 2/4 gate に入れる
- **状況**: public fetch は Cloudflare `API_SERVICE` service-binding 優先で実装済みだったが、admin server-fetch だけ `${INTERNAL_API_BASE_URL}` 経由の HTTP fetch のみだった。staging で workers.dev loopback 404 が再発し、原因は per-route absence ではなく transport 非対称だった。
- **教訓**: server-fetch helper を public/admin/その他 layer ごとに増やすときは、transport policy(`API_SERVICE` binding 優先 / HTTP fallback / test fallback) を全 layer で同じ accessor 経由に揃え、Phase 2/Phase 4 gate で symmetry を必ず検証する。

## L-I976-002: Service binding 優先 + HTTP fallback の二重 transport policy
- **状況**: production/staging では `binding.fetch.bind(binding)` で workers 間 RPC を使い、test/Playwright では既存の global fetch mock を壊さないように HTTP fallback を維持したい。
- **教訓**: `if (NODE_ENV==='test' || PLAYWRIGHT_TEST==='1') return globalFetch; else if (binding) return binding.fetch.bind(binding); else return globalFetch;` の順で fallback chain を1関数に閉じ込めると、既存の fetch mock spec を破壊せず、production loopback も避けられる。

## L-I976-003: transport 判定 accessor を `getPublicFetchEnv()` に一本化
- **状況**: `getEnv()` の zod schema で全 env を一括検証すると、optional な service binding が parse fail を起こしやすい。
- **教訓**: transport 判定に必要な env (`API_SERVICE` / `NODE_ENV` / `PLAYWRIGHT_TEST` / `INTERNAL_API_BASE_URL`) は `getPublicFetchEnv()` の専用 accessor に閉じる。仕様書の疑似コードも実 accessor 名に揃え、`process.env.*` 直参照と `getEnv()` の混在を防ぐ。

## L-I976-004: 既存 fetch mock を壊さない契約
- **状況**: focused Vitest と Playwright fixture は global fetch を mock する前提で書かれており、service-binding 優先化で API/D1 hook timeout が再発する懸念があった。
- **教訓**: `NODE_ENV=test` または `PLAYWRIGHT_TEST=1` を transport 判定の **最優先 short-circuit** に置き、3 件の focused spec(`server-fetch-url` / `server-fetch-service-binding` / `server-fetch-http-fallback`) で binding-present/binding-absent/test-mode の3軸を独立に固定する。

## L-I976-005: transport 変更でも contract は維持
- **状況**: service-binding 経由でも `x-internal-auth` header / `cookie` 転送 / JSON body / error body snippet の既存契約を変えると、API 側 Hono handler や上位 caller が壊れる。
- **教訓**: transport 層(`binding.fetch` vs `globalFetch`)を切り替えても、Request 構築側(headers/method/body) と Response 解釈側(status/error snippet) は完全に共通化する。signature(`fetchAdmin(path, init)`) は維持し、caller 側に変更を波及させない。
