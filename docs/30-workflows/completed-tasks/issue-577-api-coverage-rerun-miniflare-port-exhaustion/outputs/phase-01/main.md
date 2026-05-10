# Phase 01 — 要件定義 / GO 判定 / triage 判断フレームワーク

Status: COMPLETED
Date: 2026-05-09
Workflow: issue-577-api-coverage-rerun-miniflare-port-exhaustion

## 1. Issue #532 evidence 抜粋

`@ubm-hyogo/api` full coverage 実行時に Miniflare/undici 由来の `EADDRNOTAVAIL` port exhaustion が発生し、PASS まで到達できなかった。

参照 path:
- `docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/outputs/phase-09/main.md`
  > "Full coverage run was attempted but failed due Miniflare/undici `EADDRNOTAVAIL` port exhaustion during broad concurrent D1 tests, not due assertion failures in the changed code."
- `outputs/phase-12/implementation-guide.md`
  > "Full `test:coverage`: attempted; failed due Miniflare `EADDRNOTAVAIL` port exhaustion in broad concurrent D1 tests. This was not reproduced in focused changed-path test runs."
- `outputs/phase-12/unassigned-task-detection.md`
  > 起票候補として `task-issue-532-api-full-coverage-rerun-miniflare-port-exhaustion-001.md` を確定。

## 2. 現行 baseline スナップショット

| 項目 | 値 |
| --- | --- |
| Node | 24.15.0（mise 固定） |
| pnpm | 10.33.2（mise 固定） |
| OS | Darwin 25.3.0 (macOS) |
| `vitest.config.ts#test.pool` | 未設定（vitest 既定 `threads`） |
| `vitest.config.ts#test.maxWorkers` | 未設定（既定: CPU 数） |
| `vitest.config.ts#test.fileParallelism` | 未設定（既定: true） |
| `apps/api/package.json#scripts.test:coverage` | `vitest run --passWithNoTests --root=../.. --config=vitest.config.ts --coverage --coverage.reportsDirectory=apps/api/coverage --coverage.include="apps/api/src/**/*.{ts,tsx}" apps/api` |
| `testTimeout` / `hookTimeout` | 30000 ms |

## 3. しきい値表（本 Phase で確定）

| 判断 | 条件 | 後続 Phase |
| --- | --- | --- |
| no-code verification close-out | rerun 3 回連続 PASS かつ EADDRNOTAVAIL stack trace が一切出ない | `implementation` のまま `verified_current_no_code_change_pending_pr` として Phase 5/6 を skip し、Phase 9/11/12/13 を実行 |
| triage 採用（暫定回避策あり） | rerun 1 回以上で EADDRNOTAVAIL 再現、かつ Phase 3 matrix のいずれか軸で PASS が得られた | Phase 5/6 を実行し最小差分 patch 化 |
| triage 不確定（ペンディング） | matrix 全軸で再現不安定 / Node・OS 依存疑い | Phase 8 で 30day-contract 化、`unassigned-task` へ schedule feedback |

失敗率 gate: rerun 3 回中 1 回でも `EADDRNOTAVAIL` が出た時点で「triage 採用フロー」に強制遷移。

## 4. 30day-contract 線引き

- 1 サイクル内（本 PR）で再現が不安定（matrix 全軸で再現せず）の場合は **schedule feedback** として `unassigned-task` 配下に持ち越し、30 日以内に 3 回以上の再発が観測されたら Issue を再起票し恒久対応に格上げする。
- 30day-contract artifact: 後続 Phase 8 の runbook に反映。

## 5. GO 判定

| 着手前提（index.md） | 結果 |
| --- | --- |
| `gh auth status` 成功 | GO |
| Node 24 / pnpm 10 が mise 経由で利用可能 | GO |
| Issue #577 が CLOSED（2026-05-08T21:36:04Z） | GO（Issue state 変更は本タスク外。PR は `Refs #577` で追跡） |
| Issue #532 ワークフローディレクトリ存在 | GO |
| `apps/api/package.json` に `test:coverage` script あり | GO |
| root `vitest.config.ts` 存在 | GO |

**GO 判定: 全前提を満たすため Phase 2 へ進行可。**

## 6. 後続フェーズ分岐の事前合意

- **第一目標**: rerun 3 回連続 PASS による no-code verification close-out。
- **再発時**: Phase 3 matrix の軸 B（`--maxWorkers=1 --minWorkers=1`） → 軸 A（`pool=forks`） → 軸 C（`--no-file-parallelism`） → 軸 D（`--shard`）の順で 1 因子ずつ切り分ける。
- patch 採用時の優先度: **B → A → C → D**（侵襲度順）。E（test grouping）は別 Issue 候補。
