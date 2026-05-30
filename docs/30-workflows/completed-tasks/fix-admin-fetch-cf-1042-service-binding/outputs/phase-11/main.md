# Phase 11 Evidence: local captured / runtime pending

## Status

`local_evidence_captured_runtime_pending / NON_VISUAL`

UI layout is unchanged. The only user-visible effect is removal of the admin fetch error banner after staging runtime deploy, so screenshot evidence is not required for local close-out.

## Evidence Inventory

| Evidence | Status | Path / command | Boundary |
| --- | --- | --- | --- |
| focused web regression | present | `mise exec -- pnpm --filter web test -- --run src/lib/admin/__tests__/server-fetch.binding.spec.ts src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts src/lib/admin/__tests__/server-fetch-url.spec.ts src/lib/admin/__tests__/server-fetch.env.spec.ts` | Result: 175 files PASS / 1229 tests PASS / 1 skipped |
| service binding unit path | present | `apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts` | `API_SERVICE.fetch("https://service-binding.local/...")`, headers/body, CF 1042 body propagation |
| HTTP fallback unit path | present | `apps/web/src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts` | binding absent and test override fallback |
| URL fallback regression | present | `apps/web/src/lib/admin/__tests__/server-fetch-url.spec.ts` | trailing slash removal remains intact |
| staging deploy | pending_user_gate | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` | user approval required |
| authenticated `/admin` smoke | pending_user_gate | staging browser/curl with admin session cookie | user approval and session required |
| wrangler tail transport log | pending_user_gate | `{ transport: "service-binding", scope: "admin", path: "/admin/dashboard", status: 200 }` | staging runtime only |

## 4 Conditions

| Condition | Result | Note |
| --- | --- | --- |
| 矛盾なし | PASS | Local implementation is complete; staging runtime evidence is explicitly pending, not claimed as PASS. |
| 漏れなし | PASS | Binding, fallback, headers/body, and CF 1042 error body are covered by tests. |
| 整合性あり | PASS | Transport policy matches `fetchPublic` / `auth` service binding precedence. |
| 依存関係整合 | PASS | API Worker and D1 remain accessed only through the existing admin API boundary. |
