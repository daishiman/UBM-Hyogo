# 2026-06-10 admin-members-mobile-responsive-layout

`admin-members-mobile-responsive-layout` を `implemented_local_evidence_captured / implementation / VISUAL` として同期。

- `/admin/members` の `MembersTable` を単一 table DOM のまま 640px 以下で CSS card 表示へ切替。
- `MembersTable.tsx` に mobile label / cell 属性を追加し、`globals.css` に scoped media query を追加。
- focused Vitest `MembersTable.spec.tsx` 25 tests PASS。
- Playwright `admin-members-mobile.spec.ts` を追加し、375px / 640px / 1280px overflow と publish control を CSS contract として desktop-chromium 5 tests PASS で検証。
- 09g / 09-ui-ux / quick-reference / resource-map / task-workflow-active / artifact inventory を同一 wave 同期。
- Runtime screenshots、staging deploy、commit、push、PR は user-gated。
