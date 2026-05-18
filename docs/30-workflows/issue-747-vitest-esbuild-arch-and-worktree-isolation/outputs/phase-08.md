# Phase 8: 受入条件 (AC)

| AC | 検証コマンド | 期待結果 |
| --- | --- | --- |
| AC-1 | `pnpm test:parallel09-primitives` | exit 0、全 case PASS |
| AC-2 | `pnpm test:parallel09-use-admin-mutation` | exit 0、全 case PASS |
| AC-3 | `pnpm verify:esbuild` | host / binary / lock 3 者一致、exit 0 |
| AC-4 | `pnpm verify:worktree-isolation` | `@esbuild/<arch>` resolve 先が CWD 配下、exit 0 |
| AC-5 | `pnpm verify:node-arch` | Apple Silicon host で `arm64`、CI Linux で skip exit 0。現在のローカル端末は `process.arch=x64` のため runtime blocker として扱う |
| AC-6 | `lefthook run pre-push` | `verify-esbuild` group が pass |
| AC-7 | GitHub Actions `verify-esbuild` workflow | ubuntu-latest / macos-14 両方で全 step pass |
| AC-8 | runbook 実在 | `docs/30-workflows/issue-747-.../runbook.md` が存在し escalation 1〜5 を網羅 |
| AC-9 | 旧仕様書 status 更新 | `docs/30-workflows/unassigned-task/parallel-09-followup-002-...md` frontmatter に `status: consumed` + `canonical_workflow:` pointer |
| AC-10 | `mise exec -- pnpm typecheck` | exit 0 |
| AC-11 | `mise exec -- pnpm lint` | exit 0 |

## DoD（Definition of Done）

- AC-1〜4, AC-8〜11 が **本ワークツリーのローカル** で exit 0。AC-5〜7 は arm64 Node 再 install と push 後 CI が必要なため `IMPLEMENTED_LOCAL_RUNTIME_BLOCKED_NODE_ARCH` の解放条件として残す
- focused Vitest 2 spec が `it.skip` / `test.skip` を含まないこと（`rg -n "it\\.skip|test\\.skip|describe\\.skip" apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx apps/web/src/lib/__tests__/useAdminMutation.spec.tsx` が 0 件）
- 既存の `pnpm typecheck` / `pnpm lint` / 既存 CI gate が緑のまま
- 旧仕様書が物理削除されず `consumed` trace として残置
- runbook が `docs/30-workflows/` 配下に存在し、CLAUDE.md から 1 行で参照可能
