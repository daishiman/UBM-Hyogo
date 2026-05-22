# Lessons Learned: Issue #532 Write/Tag/Note Provider ctx Injection（2026-05）

Issue #371 の Hono ctx repository provider pattern を write/tag/note 系へ実装展開した close-out の苦戦箇所。provider 適用範囲、route write consolidation、scheduled workflow boundary、command drift、coverage debt の扱いを固定する。

## L-I532-001: provider 展開は ADR threshold を満たす面だけに限定する

`adminNotesProvider`, `auditLogProvider`, `notificationOutboxProvider`, `tagDefinitionsProvider`, `tagQueueProvider`, `memberTagsProvider` を追加したが、全 repository を機械的に provider 化しない。差し替え需要、複数 consumer、write side-effect、テスト isolation のいずれも薄い read helper は対象外にする。広げすぎると provider set が route-local service locator になり、Issue #371 の「Hono ctx で必要な依存だけを束ねる」目的から外れる。

## L-I532-002: route-local raw write は provider primitive に寄せる

`/admin/requests` の request resolution は note/status/audit をまたぐ guarded multi-table write であり、route が raw batch を所有すると provider 注入後も write boundary が分散する。解決策は `adminNotesProvider.resolveRequestAtomic()` へ primitive 化し、route は request body validation と HTTP response mapping に集中させること。race lost 後の downstream side effect 禁止も primitive 側で守る。

## L-I532-003: scheduled workflow は Hono `c.var` を使わず明示 provider bundle を受け取る

Hono route handler は `WriteTagNoteProviderCtx` から `c.var` を読む。一方、`tagQueueRetryTick` や `notificationDispatchTick` は scheduled path であり Hono context がない。ここに fake Hono context を作ると runtime と test の境界が曖昧になる。scheduled path は explicit provider bundle を引数にし、route-only ctx と workflow provider bundle を分離する。

## L-I532-004: Phase 2 validation matrix は actual package scripts を読む

作成済み spec が `@repo/api` / `test:run` / `test:typecheck` を参照していたが、current package は `@ubm-hyogo/api` で scripts は `test` / `typecheck` だった。Phase 11 で補正できても、Phase 2 の validation matrix で stale command を書くと実装者が誤コマンドを追う。次回は validation matrix 作成前に対象 workspace の `package.json` と test runner config を確認する。

5-minute resolution:

1. `jq '.name,.scripts' apps/api/package.json` を確認する。
2. Phase 1 / 4 / 9 / 11 / 12 の command strings を同じ実コマンドへそろえる。
3. stale command を見つけたら `task-specification-creator/references/phase12-skill-feedback-promotion.md` の Command Contract Drift Rule に従う。

## L-I532-005: coverage guard NO-OP と full coverage NOT PASS を実装完了と混同しない

`coverage-guard.sh --package @ubm-hyogo/api` は changed-mode target mismatch により PASS/NO-OP だった。別途 full coverage は broad concurrent Miniflare D1 tests の `EADDRNOTAVAIL` port exhaustion で NOT PASS。focused changed-path tests、typecheck、lint、grep は PASS しているため実装 scope は完了だが、PR 前の full coverage rerun は verification debt として明示する。Phase 12/13 の checkbox は coverage threshold completed と書かず、verification debt を分離する。

## Related Resources

- `docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/`
- `docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/outputs/phase-11/evidence/coverage-guard.log`
- `docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/outputs/phase-12/implementation-guide.md`
- `apps/api/src/repository/_shared/provider-context.ts`
- `apps/api/src/middleware/repository-providers.ts`
- `apps/api/src/repository/adminNotes.ts`
- `apps/api/src/workflows/tagQueueRetryTick.ts`
- `apps/api/src/workflows/notificationDispatchTick.ts`

## Search Keywords

issue-532, write-tag-note-provider, WriteTagNoteProviderCtx, adminNotesProvider,
resolveRequestAtomic, scheduled provider bundle, Hono c.var route-only,
command contract drift, @ubm-hyogo/api, coverage guard NO-OP, Miniflare port exhaustion.
