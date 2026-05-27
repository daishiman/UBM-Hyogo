# phase-10 outputs

See sibling root `../../phase-10-*.md` for canonical 9-heading spec.

## final review (followup-001)

AC 達成状況:

| AC | status | evidence |
|----|--------|----------|
| AC-1 | code-level fix 完了 / staging deploy で実 verify が user-gated | T-5.1 fallback 撤去 + `apps/web/app/api/admin/[...path]/route.spec.ts` 3件 green |
| AC-2 | done | `MembersPageHead` + `MembersPageHead.spec.tsx` |
| AC-3 | done | `MembersFilters` + spec (pill 4種 + count + debounce) |
| AC-4 | done | `MembersTable` + spec (列 / avatar / +N / deleted) |
| AC-5 | done | `MemberDrawer` + spec (head / VISIBILITY / KVList / DELETED / foot 3 button) |
| AC-6 | done | 既存 endpoint surface のみ使用。adapter は web 側 additive のみ |
| AC-7 | done | `packages/shared` 不変。additive props は `?:` のみ |
| AC-8 | done | `rg HEX 直書き` 検出 0 件 |
| AC-9 | pending | staging deploy が user-gated のため Phase 11 で実施 |

不変条件遵守:

- D1 直接アクセスなし（fetch only）
- admin form input は `FormField` (admin-memo) 経由
- admin mutation は `useAdminMutation` 経由（publish / delete / patch の 3 mutation）
- 新規 test は `*.spec.{ts,tsx}` のみ
- OKLch tokens のみ、HEX 直書きなし
