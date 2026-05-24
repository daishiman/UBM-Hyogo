# Phase 3 — タスク分解実行記録

| T# | タスク | 状態 | 成果物 |
|----|--------|------|--------|
| T-01 | adapter 実装 | ✅ | `apps/web/src/lib/adapters/member-detail.ts` |
| T-02 | adapter unit spec（8 ケース） | ✅ | `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` |
| T-03 | fixture 作成 | ✅ | `apps/web/src/fixtures/public-member-profile.ts` |
| T-04 | MemberDetail composing primitive | ✅ | `apps/web/src/components/public/MemberDetail.tsx` |
| T-05 | page.tsx refactor (adapter + MemberDetail 接続) | ✅ | `apps/web/app/(public)/members/[id]/page.tsx` |
| T-06 | Playwright visual spec | ✅ | `apps/web/playwright/tests/serial-06-member-detail.spec.ts` |
| T-07 | Playwright notFound spec | ⚠️ 既存 `public-detail-register-legal.spec.ts` で網羅済み | (重複回避) |
| T-08 | evidence 収集 | ✅ | `outputs/phase-11/evidence.md` |
