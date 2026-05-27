# Phase 8 — refactor

実装中に副次的に行った clean-up:

- `MembersTable` の空 `<th>` (selection / edit icon) に sr-only label を補い jest-axe `empty-table-header` violation を解消。
- `MembersClientShell` から `onTogglePublish` を pass-through し、行レベル switch のクリックは drawer を開く動作に集約（行レベル即時 publish 切替は drawer 側 mutation で行う設計）。
- `MembersPageHead` 導入に伴い `apps/web/app/(admin)/admin/members/page.tsx` の AdminPageHeader 利用を解除。Breadcrumb は page.tsx に直接配置して primitive-adoption gate を満たす。
- `useEffect` の dep を明示し `// eslint-disable-next-line react-hooks/exhaustive-deps` を撤去。
