# Phase 1 — 要件定義 / GO 判定 / triage 判断フレームワーク

## 目的

Issue #577 の rerun タスクを「rerun PASS で no-code verification close-out」「triage 採用で実装 patch」「再現せずペンディング」のいずれに収束させるかを Phase 1 時点で確定するための判断フレームワークを敷く。

## 入力 / 前提

- Issue #577 本文（`task_id` / scope / out-of-scope）
- Issue #532 Phase 11 evidence（EADDRNOTAVAIL 発生時の log）
- 現行 `apps/api/package.json` `test:coverage` script
- 現行 root `vitest.config.ts`
- Node 24.15.0 / pnpm 10.33.2 / macOS Darwin 25.3.0

## 手順

1. Issue #532 の Phase 11 evidence を `find docs/30-workflows -name "*532*"` で探索し、EADDRNOTAVAIL の stack trace / 発生 test file / 発生時刻を抽出する。
2. 現行 `vitest.config.ts` の `pool` / `poolOptions` / `coverage` 設定を読み取り、Phase 3 で動かす matrix の baseline を確定する。
3. しきい値表（下記）を本 Phase 出力に記録する。
4. 30day-contract 観点で「再現性が 1 サイクル内で確定しない場合は schedule feedback として next sync に持ち越す」線引きを決める。
5. GO 判定: 着手前提（index.md）が全て満たされていることを確認し、GO/NO-GO を `outputs/phase-01/main.md` に記録する。

## しきい値表（本 Phase で確定）

| 判断 | 条件 | 後続 Phase |
| --- | --- | --- |
| no-code verification close-out | rerun 3 回連続 PASS かつ EADDRNOTAVAIL stack trace が一切出ない | `implementation` のまま `verified_current_no_code_change_pending_pr` として Phase 5/6 を skip し、Phase 9/11/12/13 を実行 |
| triage 採用（暫定回避策あり） | rerun 1 回以上で EADDRNOTAVAIL 再現、かつ Phase 3 matrix のいずれか軸で PASS が得られた | Phase 5/6 を実行し最小差分 patch 化 |
| triage 不確定（ペンディング） | matrix 全軸で再現不安定 / Node・OS 依存疑い | Phase 8 で 30day-contract 化、`unassigned-task` へ schedule feedback |

## 成果物

- `outputs/phase-01/main.md`（要件定義 + GO 判定 + しきい値表 + Issue #532 evidence 抜粋）

## 検証コマンド

```bash
mise exec -- node -v
mise exec -- pnpm -v
gh issue view 577 --json state,labels,title -q .
gh issue view 532 --json state,title -q .
test -d docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers
test -f docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/outputs/phase-11/main.md
diff -u docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/artifacts.json docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/outputs/artifacts.json
```

## 完了条件（DoD）

- [ ] しきい値表が Phase 1 output に固定されている。
- [ ] Issue #532 Phase 11 evidence の参照 path が記録されている。
- [ ] GO 判定が記録され、Phase 2 へ進める状態になっている。
