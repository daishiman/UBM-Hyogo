# issue-1063 shell collapse cookie Secure attribute

`issue-1063-shell-collapse-cookie-secure-attribute` を `implemented_local_evidence_captured / implementation / NON_VISUAL` として同期。

- `apps/web/src/components/shell/shell-collapse-cookie.ts` に HTTPS runtime 判定 (`browserDocument()?.location.protocol === "https:"`) と `Secure` append を追加。`isSecureRuntimeContext` / `serializeShellCollapsedCookie` に phase-5 spec 規定の JSDoc を付与。
- `apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts` に focused serializer assertions を追加し、10 tests PASS を取得。
- Phase 12 strict 7、quick-reference / resource-map / task-workflow-active / artifact inventory / lessons-learned (L-I1063-001..004) / changelog / LOGS を同一 wave で反映。
- skill-sync close-out で workflow root を `completed-tasks/` へ移動し、source unassigned task を co-locate（ユーザー承認）。
- API / D1 / Google Form schema / auth / CSS token は不変。
- commit / push / PR / staging DevTools smoke / Issue mutation は user-gated。Issue #1063 は CLOSED 維持、PR 文脈は `Refs #1063` のみ。
