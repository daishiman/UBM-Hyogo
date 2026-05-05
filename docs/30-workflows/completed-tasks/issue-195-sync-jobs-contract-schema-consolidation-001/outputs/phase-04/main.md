# Phase 4 — verify suite 設計

## 検証コマンド
1. `mise exec -- pnpm typecheck`
2. `mise exec -- pnpm lint`
3. `mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-jobs-schema.test`
4. `mise exec -- pnpm indexes:rebuild` → `git status --porcelain .claude/skills/aiworkflow-requirements/indexes`
5. `rg -n "ADR-001 runtime SSOT 配置" docs/30-workflows/_design/sync-jobs-spec.md`
6. `rg -n "sync-jobs-schema\.ts" docs/30-workflows/_design/sync-shared-modules-owner.md`
7. `rg -n "sync-shared-modules-owner" docs/30-workflows/_design/sync-jobs-spec.md`
8. 1-hop 到達 grep: spec.md ↔ owner.md / runtime SSOT 双方向

## 期待結果
全コマンド exit 0 / drift は indexes:rebuild 後の line-shift のみ。
