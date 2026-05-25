# Phase 12 Main — issue-879 safeServerFetch 横展開

## Summary

本 workflow は `spec_created` から `implemented_local_evidence_captured` へ昇格した。admin 専用だった `safeServerFetch` を共通 thunk helper へ抽出し、member/public server component の fetch failure を section-level degrade へ統一した。

## Changed Code

| Area | Files |
|---|---|
| Common helper | `apps/web/src/lib/server-fetch/safe-fetch.ts`, `apps/web/src/lib/admin/safe-server-fetch.ts` |
| UI fallback | `apps/web/src/components/public/SectionError.tsx`, `apps/web/src/components/member/SectionError.tsx`, `apps/web/src/styles/globals.css` |
| Pages | `apps/web/app/profile/page.tsx`, `apps/web/app/(public)/members/page.tsx`, `apps/web/app/(public)/members/[id]/page.tsx` |
| Tests | `safe-fetch.spec.ts`, `SectionError.spec.tsx`, three page specs |

## User Gate

commit / push / PR / Issue mutation は未実行。Phase 13 でユーザー承認後にのみ実施する。
