# Phase 4 — 環境準備 / 前提条件確認

## 4.1 開発環境

```bash
mise install             # Node 24.15.0 / pnpm 10.33.2
mise exec -- pnpm install
```

## 4.2 前提確認コマンド

```bash
# Node version
node -v   # → v24.15.0

# baseline: rename 前の test 件数
find packages -name '*.test.ts' -o -name '*.test.tsx' | wc -l   # 期待: 28
find packages -name '*.spec.ts' -o -name '*.spec.tsx' | wc -l   # 期待: 0

# baseline: pnpm -r test の test 件数
mise exec -- pnpm -r test 2>&1 | tee /tmp/baseline-test-count.log

# baseline: typecheck / lint 既存エラー数
mise exec -- pnpm typecheck 2>&1 | tee /tmp/baseline-typecheck.log
mise exec -- pnpm lint 2>&1 | tee /tmp/baseline-lint.log
```

## 4.3 ブランチ準備

```bash
git fetch origin dev
git checkout -b refactor/issue-622-packages-test-suffix-rename origin/dev
```

## 4.4 着手 Gate

- Gate-1: baseline test count が 28 / spec 0 件で確定している（Phase 11 で再確認）
- Gate-2: `pnpm -r test` が rename 着手前に PASS している
- Gate-3: typecheck / lint baseline のエラー件数が記録されている

## 4.5 関連既存タスクの状態確認

- Issue #325 (`apps/api` rename): CLOSED — 上流規約の正本として参照
- Issue #621 (`apps/web` rename): MERGED — 隣接事例
- followup-003 (vitest spec 単一収斂): #623 / `docs/30-workflows/unassigned-task/task-issue-325-followup-003-vitest-spec-suffix-convergence.md` が存在することを Phase 12 で確認
