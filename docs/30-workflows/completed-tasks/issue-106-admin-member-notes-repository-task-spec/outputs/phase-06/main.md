# Phase 6: Failure Cases

| ID | Case | Evidence Plan |
| --- | --- | --- |
| F-1 | Unknown memberId | `listByMemberId(...m_unknown)` returns `[]` |
| F-2 | Other member note exists | `m_001` result does not include `m_002` fixture body |
| F-3 | Request row exists | Existing request helper tests cover typed rows |
| F-4 | Public profile JSON | Type-level and public view tests reject `adminNotes` |
| F-5 | Repository updates response tables | Static grep confirms no `member_responses` / `response_fields` writes in `adminNotes.ts` |

## Static Check Plan

```bash
rg -n "member_responses|response_fields|PublicMemberProfile|MemberProfile" apps/api/src/repository/adminNotes.ts
```

Expected: only comments for view-model invariants, no table writes or imports.
