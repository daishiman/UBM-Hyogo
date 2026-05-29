# 2026-05-28 login-redirect-when-authenticated

`login-redirect-when-authenticated` を `implemented_local_evidence_captured / implementation / NON_VISUAL` として同期。

- `apps/web/src/lib/url/safe-next.ts` を追加し、既存 `isSafeInternalRedirect` を再利用して `next` query の長さ・colon guard を追加。
- `apps/web/app/login/page.tsx` に server-side session check と authenticated redirect を追加。
- focused Vitest 2 files / 22 tests PASS。
- Phase 12 strict 7、root/output artifacts parity、quick-reference / resource-map / task-workflow-active / artifact inventory を同一 wave で反映。

User-gated: browser/staging runtime confirmation、commit、push、PR。
