# Implementation Guide

## Part 1: 中学生レベルの概念説明

### なぜ必要か

このタスクは、テストを自動で確認してくれる道具を古いものから新しいものへ入れ替える作業です。道具の名前は同じ Vitest ですが、新しい版では細かい採点ルールが少し厳しくなっています。

たとえば、学校の小テストで「答えがだいたい合っていれば丸」だった先生が、「答えだけでなく理由の書き方も見る」先生に変わるイメージです。問題そのものは同じでも、丸をもらうために書き方をそろえる必要があります。

この仕様書では、道具を入れ替えたあとも全テストが通るように、どの順番で確認し、どの種類の失敗をどう直すかを固定しています。画面やユーザー操作は変えないため、スクリーンショットは不要です。

### 何をしたか

今回作ったものは、Vitest 3.2.6 へ更新した依存関係、同じ版にそろえた coverage 道具、更新済み lockfile、そしてその確認結果を残す証跡です。アプリの画面や API の仕事は変えず、テストを走らせる土台だけを新しくしました。

### 今回作ったもの

| 作ったもの | 内容 |
| --- | --- |
| 依存更新 | root / api / og の Vitest を `^3.2.6` に更新 |
| coverage 更新 | root の `@vitest/coverage-v8` を `^3.2.6` に更新 |
| lockfile | `pnpm-lock.yaml` で Vitest と coverage が同じ 3.2.6 に解決される状態 |
| NON_VISUAL 証跡 | typecheck / lint / shard test / deprecation grep / version parity の結果 |

## Part 2: 開発者向け実装詳細

### 変更対象

| File | Required change |
| --- | --- |
| `package.json` | `devDependencies.vitest` and `@vitest/coverage-v8` to `^3.2.6` |
| `apps/api/package.json` | `devDependencies.vitest` to `^3.2.6` |
| `apps/og/package.json` | `devDependencies.vitest` to `^3.2.6` |
| `pnpm-lock.yaml` | Regenerate with `mise exec -- pnpm install` |

`vitest` and `@vitest/coverage-v8` must resolve to the same 3.2.6 version. The implementation cycle must verify this with `pnpm why vitest` and `pnpm why @vitest/coverage-v8`.

### CLIシグネチャ

```bash
pnpm install
pnpm why vitest
pnpm why @vitest/coverage-v8
pnpm typecheck
pnpm lint
pnpm coverage:guard
bash scripts/verify-pr-ready.sh
```

### 使用例

```bash
mise exec -- pnpm why vitest
mise exec -- pnpm why @vitest/coverage-v8
node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js \
  --workflow docs/30-workflows/completed-tasks/vitest-2-to-3-major-upgrade \
  --json
```

### Execution steps

1. Apply the package version bump and regenerate the lockfile.
2. Run `mise exec -- pnpm why vitest` and `mise exec -- pnpm why @vitest/coverage-v8`.
3. Run shard-level Vitest commands to capture RED failures.
4. Classify failures into C1-C8 from `phase-02-design.md`.
5. Fix only tests, mocks, config, or coverage threshold deltas required by the upgrade.
6. Finish with typecheck, lint, coverage shards, deprecation grep, and `bash scripts/verify-pr-ready.sh`.

### Compatibility notes

The existing `vitest.config.ts` and `vitest.d1.config.ts` should keep the React alias, `optimizeDeps`, `pool: forks`, and `singleFork: true` settings. Product code behavior in `apps/*/src` and `packages/*/src` is not part of the expected change unless a blocker is escalated to the user.

### Type-level contract

```ts
type VitestUpgradeTarget = {
  packageName: "vitest" | "@vitest/coverage-v8";
  version: "3.2.6";
  range: "^3.2.6";
};
```

This is a documentation contract, not a new runtime API. It records the required version parity for the implementation cycle.

### エラーハンドリング

| Failure | Handling |
| --- | --- |
| `vitest` and `@vitest/coverage-v8` resolve to different versions | Align both specifiers and regenerate `pnpm-lock.yaml`; do not accept peer mismatch warnings. |
| Vitest config deprecation appears | Change only the proven deprecated config key and rerun the same shard. |
| C1-C8 test failure appears | Fix the test/config surface identified in `phase-02-design.md`; do not change product runtime behavior unless the failing test proves a real product bug. |
| scripts shard RPC timeout appears under high load | Re-run with `--no-file-parallelism` and record the boundary; do not hide failed tests. |

### エッジケース

| Category | Handling |
| --- | --- |
| C1 error comparison strictness | Update test expectations to the actual error prototype and message. |
| C2 `vi.spyOn` / `mockReset` behavior | Fix test mock lifecycle setup; do not change product behavior. |
| C3 fake timers | Use explicit timer settings in tests when needed. |
| C4/C5 config deprecations | Confirm current config has no `deps.inline` or `workspace`; fix only if runtime logs prove drift. |
| C6 coverage threshold movement | Adjust only measured unavoidable deltas; no broad threshold lowering. |
| C7 version mismatch | Keep `vitest` and `@vitest/coverage-v8` aligned. |
| C8 third-argument test options | Grep and remove warning-producing forms if present. |

### 設定項目と定数一覧

| Category | Handling |
| --- | --- |
| `vitest` | `^3.2.6` in root, `apps/api`, and `apps/og` |
| `@vitest/coverage-v8` | `^3.2.6` in root; peer must match `vitest@3.2.6` |
| `vitest.d1.config.ts` | Keep `pool: "forks"` and `singleFork: true` |
| `visualEvidence` | `NON_VISUAL`; screenshots are not required |
| `workflow_state` | `implemented_local_evidence_captured` after local package/lockfile update and command evidence |

### テスト構成

| Layer | Evidence |
| --- | --- |
| Typecheck | `outputs/phase-11/typecheck-local.txt` |
| Lint | `outputs/phase-11/lint-local.txt` |
| Vitest shards | `outputs/phase-11/vitest-shard-results.txt` |
| Deprecation grep | `outputs/phase-11/deprecation-grep.txt` |
| Version parity | `outputs/phase-11/version-parity.txt` |
| Phase 12 guide validator | `validate-phase12-implementation-guide.js --workflow ... --json` |

### Verification commands

```bash
mise exec -- pnpm install
mise exec -- pnpm why vitest
mise exec -- pnpm why @vitest/coverage-v8
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm coverage:guard
bash scripts/verify-pr-ready.sh
```

### Visual evidence

UI/UX 変更なしのため Phase 11 スクリーンショット不要。Phase 11 evidence is command output: shard results, deprecation grep, and version parity logs.
