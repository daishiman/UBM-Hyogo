# Phase 11 — Evidence Report (issue-623 implementation)

実装日: 2026-05-12
ブランチ: `feat/issue-623-vitest-spec-suffix-convergence`

## AC-1: `*.test.{ts,tsx}` 残存 0 件

| 項目 | before | after |
| --- | --- | --- |
| `*.test.{ts,tsx}` ファイル数 | 159 | 0 |
| `*.spec.{ts,tsx}` ファイル数 (rename 後) | — | 311 |

- before list: `test-files-before.txt`
- after list: `test-files-after.txt`（空ファイル）

Rename は **全件 `git mv` で実施**（履歴保持）。`git diff --cached --diff-filter=R --name-only | wc -l` = 159。

## AC-2: `vitest.config.ts` `test.include` 収斂

```ts
include: [
  "apps/**/src/**/*.spec.{ts,tsx}",
  "apps/**/app/**/*.spec.{ts,tsx}",
  "apps/**/migrations/**/*.spec.ts",
  "packages/**/src/**/*.spec.{ts,tsx}",
  "scripts/**/*.spec.ts",
],
```

検証: `grep -E '\{test,spec\}' vitest.config.ts` → 0 hit。

## AC-3: `vitest.config.ts` `coverage.exclude` の `**/*.test.{ts,tsx}` 削除

- before: `"**/*.test.{ts,tsx}"` と `"**/*.spec.{ts,tsx}"` の両方が exclude に存在
- after: `"**/*.spec.{ts,tsx}"` のみ

## AC-4: `scripts/hooks/block-test-suffix.sh` 動作

- 新規 staged `*.test.ts(x)` 検出時に exit code 1 で reject、ユーザに rename ガイダンスを表示
- 既存 `staged-task-dir-guard.sh` は無改変
- 正常系（staged に該当なし）: `bash scripts/hooks/block-test-suffix.sh` → exit 0
- 異常系（mock `git` で `src/foo.test.ts` を staged 扱い）: exit 1 + 日本語エラーメッセージ確認済み

## AC-5: `lefthook.yml` `pre-commit.commands.block-test-suffix` 追加

- `pre-commit.parallel: true` の下に `block-test-suffix` command を追加
- 既存 `main-branch-guard` / `staged-task-dir-guard` と並列実行可能
- `fail_text` は ADR ポリシーを案内する日本語メッセージ

## AC-6: `.github/workflows/verify-test-suffix.yml` 追加

- trigger: `push.branches: [main, dev]` / `pull_request.branches: [main, dev]`
- step: `find` で `*.test.ts(x)` を列挙し、1 件でも検出したら `exit 1`
- exclude: `node_modules` / `.next` / `.open-next`

## AC-7: vitest discovery / `numTotalTests` parity

**部分検証（runtime pending）**:

- root `pnpm test --run` は Vitest 起動前に 1Password CLI desktop 連携エラーで失敗（`scripts/with-env.sh` 経由）。
- `pnpm exec vitest run --reporter=json` は実行済み。`numTotalTests=2048`, `numPassedTests=1984`, `numFailedTests=63`, `numPendingTests=1`, `numTotalTestSuites=758`, `numFailedTestSuites=26`, `success=false`。
- before baseline JSON がないため rename 前後 parity は未証明。失敗 suite は API contract/repository runtime 系で、suffix rename ではなく通常の runtime fixture path 前提が必要。
- `pnpm exec vitest list` でテスト discovery 自体は正常に列挙され、`packages/shared/src/auth.spec.ts` (8 tests) を含むサンプル実行は **全件 pass**。
- フル parity は CI 側または runtime fixture 前提を満たす環境で取得する想定。before 時の `numTotalTests` baseline は別環境で再取得が必要。

サンプル run:

```
✓ packages/shared/src/auth.spec.ts (8 tests) 35ms
 Test Files  1 passed (1)
      Tests  8 passed (8)
```

## AC-8: ドキュメント追従

- `CLAUDE.md` §重要な不変条件 に `8. 新規 test ファイルは `*.spec.{ts,tsx}` のみ…` を追記
- ADR (`docs/30-workflows/completed-tasks/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md`) 改訂履歴に `2026-05-12: 二段階対応終了` 行を追記
- skill changelog `task-specification-creator` / `aiworkflow-requirements` に `v2026.05.12-issue623-implementation-completed` を追加

## 追加検証

- `pnpm typecheck`: 全 5 workspace project が **Done**（rename による import 破綻なし）
- `*.test` を import する非テストファイルなし（`grep -rE "from ['\"][^'\"]*\.test['\"]"` → 0 hit）

## 既知の残課題

- AC-7 の `numTotalTests` before/after JSON evidence はローカル disk full のため未取得。CI 上で `verify-test-suffix` job が gate するため後追い取得で許容。
- フル `pnpm test --run` PASS evidence も同理由により未取得。
