# workflow-profile-me-404-authenticated-admin-recovery artifact inventory

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/profile-me-404-authenticated-admin-recovery/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` |
| purpose | staging `/profile` の authenticated admin `MEMBER_SESSION_404` を、API route-miss observability、apps/api CD、web transport diagnostics、read-only diagnosis script で復旧可能な状態へ戻す |
| implementation targets | `apps/api/src/middleware/error-handler.ts`, `.github/workflows/api-cd.yml`, `scripts/smoke/runtime-admin-api.sh`, `scripts/diagnose-profile-session.sh`, `apps/web/src/lib/server-fetch/safe-fetch.ts`, `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` |
| tests | `apps/api/src/middleware/error-handler.spec.ts` 5 PASS（NF-1〜NF-5）; `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` 13 PASS（SF-1/SF-4 含む）; `bash -n scripts/diagnose-profile-session.sh` PASS; `bash -n scripts/smoke/runtime-admin-api.sh` PASS; typecheck/lint PASS |
| invariant | `/me` path/shape/status, `apps/api/src/routes/me/**`, D1 schema, Google Form schema, `/profile` UI wording are unchanged |
| user gate | staging deploy, authenticated `/me` 200 recovery verification, `/profile` recovery screenshot, commit, push, PR |

## Notes

- API 404 response contract remains `UBM-1404` / `application/problem+json`; only the structured log `context` adds `{ reason: "route_not_matched", method, path, hasAuthorization, hasSessionCookie }`. The two booleans answer the central question of this bug — did the authenticated admin's credentials reach the api when the route 404'd — and are named without `authorization`/`cookie` so `SENSITIVE_KEY_SUBSTRINGS` redaction does not misfire (AC-9). The raw cookie/bearer values never appear in the payload.
- `safeServerFetch.logServerFetchFailure` now adds `routeNotFound: true` to the `server_fetch_failed` payload only when `status === 404`, so a web route-404 log correlates 1:1 with the api `UBM-1404` log; non-404 (410/5xx/FAILED) keep the existing payload shape (no `routeNotFound` key).
- `diagnose-profile-session.sh` decides `api_route_diff` on the `api_me_healthz_status:api_me_status` axis (`200:404 → healthz_alive_me_miss` = S1 strong signal) and prints a read-only `parity_hint` string (`bash scripts/cf.sh deployments list ...`) without executing `cf.sh`.
- `api-cd.yml` mirrors web-cd's step-scoped Cloudflare token pattern, restricts push triggers to `apps/api/**` / `packages/shared/**` / its own file via `paths:`, and keeps smoke prerequisites skippable when runtime secrets are absent.

## Lessons Learned

- **L-PM404-001（status 別専用文言 × 表示事実による仮説空間圧縮）**: `MEMBER_SESSION_404` 専用文言（`session-error-display.ts`）が表示された事実だけで、(a) 401 ではない（401 なら `/login` redirect）(b) `/me` が HTTP 404 を返した、を確定でき、ユーザー提供 screenshot 単体で仮説を route 層（S1/S2）へ圧縮できる。status 別の専用文言は調査コスト極小の data-cause シグナル。
- **L-PM404-002（片側のみ自動 CD = 強化ループ R1 の素因）**: `web-cd.yml` は apps/web のみ deploy し apps/api には自動 CD が無い非対称 CD（D-A）は、境界障害（authenticated `/me` 404）を反復生成する強化ループ R1 の構造素因。recovery は「サブ原因列挙 → 全サブ原因をカバーする共通対策（apps/api 自動 CD で route 最新化）→ 確定は deploy 後 RT-E」のテンプレで、`ls .github/workflows` に各 deploy 単位の自動 CD 有無を確認する観点を spec 段階で持てば予防可能。
- **L-PM404-003（secret 非漏洩の二重防御 = 命名 + boolean 化）**: 認証情報の到達を観測する診断ログは、`hasAuthorization`/`hasSessionCookie` という boolean 名にすることで `SENSITIVE_KEY_SUBSTRINGS`（`authorization`/`cookie`/`token`/`secret`）の redaction 誤発火を避けつつ、値を boolean 化して二重に secret 非漏洩を担保する。観測性追加時の汎用パターン。
- **L-PM404-004（テスト green は「仕様充足」でなく「実装追認」のことがある）**: focused Vitest 全 PASS で landed 済でも、テストが実装の出力フィールド（当初の `accept`/`userAgent`/`dataCause`）を assert していたため、Phase-5 仕様が要求する診断フィールド（`hasAuthorization`/`hasSessionCookie`/`routeNotFound`/`api_route_diff`）の欠落をどのテストも検出しなかった（部分カバレッジ green の罠）。AC に紐づく診断フィールドは、フィールド名と「何を一意化するためのフィールドか」（意味論）の両方を仕様と突き合わせる。
- **L-PM404-005（検証 Agent 対立は実 diff × 仕様コードブロックの 1 行照合で決着）**: 監査 Agent の一方が「`hasAuthorization`/`hasSessionCookie` が存在する」と実装を仕様と取り違えて誤報告した。Agent 報告でも仕様記述でもなく、`git diff` の実コードと Phase-5 task の「改修方針」コードブロックを 1 行ずつ突き合わせる ground truth 照合で乖離 3 件を確定した。Phase-12 compliance-check の PASS は doc 間整合のみで、code 照合を含まないことがある。
