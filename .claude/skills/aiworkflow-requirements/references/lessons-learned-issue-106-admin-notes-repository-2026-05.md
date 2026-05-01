# Lessons Learned: issue-106 admin_member_notes repository regression (2026-05)

## L-I106-001: Closed issue は reopen せず current owner を再検証する

**苦戦箇所**: Issue #106 は closed だが、元指示の `adminMemberNotes.ts` / `listAdminNotesByMemberId()` と現行実装の `adminNotes.ts` / `listByMemberId()` が異なっていた。

**解決方針**: Issue 状態は変えず、workflow は `implemented_pending_user_approval` として current owner を固定する。closed issue 由来タスクは「元指示をそのまま再実装」ではなく、現行正本と衝突しない regression verification として閉じる。

## L-I106-002: admin notes repository は重複 owner を作らない

**苦戦箇所**: `admin_member_notes` 専用の別 repository を作ると、04b self-service queue と 04c admin backoffice の owner が分裂する。

**解決方針**: `apps/api/src/repository/adminNotes.ts` を canonical owner とし、member filter / empty array / `created_at DESC` を regression test で固定する。新規 adapter が必要な場合は consumer 側へ置き、D1 owner を増やさない。

## L-I106-003: `audit_log` と `admin_member_notes` を同一 DTO として扱わない

**苦戦箇所**: admin detail の `audit` は audit-shaped DTO で、admin note rows ではない。両者を混同すると member detail response の意味が崩れる。

**解決方針**: admin note POST/PATCH は `audit_log` append を確認し、admin detail `audit` は `audit_log` 由来であることを route tests で固定する。`admin_member_notes` は public/member view model に混入させない。

## L-I106-004: 候補コマンドは実 repo scripts から再解決する

**苦戦箇所**: task spec に `pnpm --filter @repo/api test:run -- adminNotes` という stale candidate command が残り、現行 scripts とずれていた。

**解決方針**: Phase 1/4/9/11/12 の command contract は `package.json` と実 test runner から再解決する。今回の current command は `pnpm --filter ./apps/api test -- adminNotes` と focused Vitest command。
