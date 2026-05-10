# Phase 03 — vitest 並列度制御 / pool / shard / triage matrix 設計

Status: COMPLETED
Date: 2026-05-09

## 1. matrix 軸表

| 軸 | 値候補 | ねらい |
| --- | --- | --- |
| A. `pool` | `threads`（baseline） / `forks` / `vmThreads` | プロセス分離による socket pool / undici dispatcher の独立化 |
| B. CLI worker cap | `--maxWorkers=1 --minWorkers=1` / `--maxWorkers=2 --minWorkers=1` / default | Miniflare instance 同時数の上限制御。CLI を優先し config patch は最後 |
| C. `--no-file-parallelism` | on / off | ファイル単位の直列化（hook 起動時 EADDR を回避） |
| D. `--shard` | `1/2` + `2/2`（合計 2 回実行） | port pressure を分割で半減 |
| E. test grouping | D1 を使う test を別 project 化 | Miniflare reuse 戦略の影響切り分け（最終手段・別 Issue 候補） |

## 2. matrix 実行順序（単純→複雑）

1. **baseline rerun**（無変更で 3 回連続）
2. 軸 B: `--maxWorkers=1 --minWorkers=1`
3. 軸 A: `--pool=forks`（必要なら `poolOptions.forks.singleFork=false`）
4. 軸 C: `--no-file-parallelism`
5. 軸 D: `--shard=1/2` と `--shard=2/2`
6. 軸 E: 採用は最後。原則別 Issue として切り出す。

## 3. 停止条件

- いずれかの軸で **exit_code=0 かつ EADDRNOTAVAIL=0** が得られたら、それ以降の軸を停止する。
- baseline 3 回連続 PASS が得られた時点で matrix 全軸を skip し no-code verification close-out へ進む。

## 4. 採用優先度（侵襲度順）

| 順位 | 軸 | 採用時の patch 場所 |
| --- | --- | --- |
| 1 | B | `apps/api/package.json#scripts.test:coverage` に `--maxWorkers=1 --minWorkers=1` を追加（最小侵襲） |
| 2 | A | `vitest.config.ts#test.pool='forks'` を追加 |
| 3 | C | `vitest.config.ts#test.fileParallelism=false` を追加 |
| 4 | D | `apps/api/package.json#scripts.test:coverage` を 2 回 shard 実行する形に変更（CI への影響考慮） |
| - | E | 採用しない（別 Issue 候補。Phase 12 unassigned-task-detection に記録） |

## 5. 1 因子切り分け原則

複数軸の合成（例: B + A）は禁止。原因切り分け不能になるため、1 軸 1 値ずつ独立に実行する。
