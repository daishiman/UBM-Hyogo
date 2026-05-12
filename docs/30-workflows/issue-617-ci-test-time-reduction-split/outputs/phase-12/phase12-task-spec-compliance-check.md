# Phase 12 Task Spec Compliance Check

## Overall verdict

`completed (implemented_local_runtime_pending)`: 実コード変更が apps/api / apps/web / scripts / .github/workflows / vitest config / docs に反映済み。typecheck / lint / coverage-merge unit test ローカル PASS。CI matrix wall-clock evidence と full shard coverage evidence は `runtime_pending` (PR push 後)。

## Required files

| Requirement | Verdict |
| --- | --- |
| root `artifacts.json` | `completed (implemented_local_runtime_pending)` |
| outputs `artifacts.json` parity | `completed (full mirror)` |
| Phase 11 NON_VISUAL outputs | `completed (runtime_partial; CI wall-clock runtime_pending)` |
| Phase 12 strict 7 outputs | `completed (implementation reflected)` |
| aiworkflow-requirements discovery sync | `completed (implemented_local_runtime_pending)` |
| source unassigned trace | `completed (implemented_local_runtime_pending)` |

## Four-condition verification

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | `completed (implemented)` | shard は artifact 生成確認のみ、aggregate `coverage-gate --no-run` が 80% 判定を持つ |
| 漏れなし | `completed (local scope)` | strict 7 / full artifacts mirror / Phase 11 local evidence / 実コード変更 / 追加テストを同期。CI wall-clock は user-gated runtime pending として明示 |
| 整合性あり | `completed (implemented_local_runtime_pending)` | root / outputs artifacts、aiworkflow ledgers、Phase 11/12 が同じ状態語彙に統一 |
| 依存関係整合 | `completed (implemented)` | issue #617 (closed) は `Refs` のみで参照、unassigned task 起票元は同一 wave で同期 |

## Runtime boundary

本サイクルで実行済:

- 全実装コード変更 (`vitest.{,d1.}config.ts` / `apps/{api,web}/package.json` / `scripts/coverage-{guard.sh,merge.mjs}` / `.github/workflows/ci.yml`)
- 追加テスト (`scripts/__tests__/coverage-merge.test.mjs` + fixtures) `node --test` PASS
- `pnpm install` / `typecheck` / `lint` ローカル PASS
- `vitest list` ベースで unit/d1 disjoint 検証 PASS (intersection=0, union=138)
- `coverage-guard.sh` CLI 検証 (`--group` artifact-only / `--no-run` aggregate threshold) PASS

本サイクルで未実行 (Phase 13 ユーザー承認後):

- commit / push / PR 作成
- CI run による matrix wall-clock 計測 (`outputs/phase-11/before-after.md` の TBD 行)
- D1 / web / packages full coverage 実行 (PR CI shard で取得)
- branch protection mutation (本設計では不要 — `coverage-gate` 名維持)

## 既知 issue

`apps/api/src/notification-mail-config.spec.ts` の Vite SSR transform fetch timeout は
unit shard の並列実行で表面化したため、同サイクルで `test:coverage:unit` に
`--maxWorkers=1 --minWorkers=1` を追加して CI shard failure を避ける。
