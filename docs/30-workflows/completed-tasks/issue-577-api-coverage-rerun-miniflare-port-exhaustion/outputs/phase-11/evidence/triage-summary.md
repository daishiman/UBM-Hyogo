# triage-summary

| 軸 | 値 | exit_code | exit_reason | EADDRNOTAVAIL count | duration_sec | 採用 |
| --- | --- | --- | --- | --- | --- | --- |
| baseline (1) | (none) | 1 | eaddrnotavail | 23 | 200 | - |
| baseline (2) | (none) | 1 | eaddrnotavail | 38 | 140 | - |
| baseline (3) | (none) | 1 | eaddrnotavail | 51 | 111 | - |
| B | maxWorkers=1, minWorkers=1 | 0 | pass | 0 | 567 | **採用** |
| A | pool=forks | -  | skipped (B PASS で停止条件達成) | -  | -  | -  |
| C | no-file-parallelism | -  | skipped | -  | -  | -  |
| D | shard=1/2 + 2/2 | -  | skipped | -  | -  | -  |

## post-patch verification

| 種別 | exit_code | EADDRNOTAVAIL count | duration_sec | 結果 |
| --- | --- | --- | --- | --- |
| `apps/api/package.json` patch（軸 B） 適用後の `pnpm --filter @ubm-hyogo/api test:coverage` | 0 | 0 | 506 | PASS |

## 採用判断

- **採用軸: B（`--maxWorkers=1 --minWorkers=1`）**
- 理由: 最小侵襲（`apps/api/package.json` 内 1 script のみ変更）で 133/133 PASS / 0 EADDRNOTAVAIL を達成。global `vitest.config.ts` への波及なし。
- baseline 3 回連続で EADDRNOTAVAIL を確実に再現（23 → 38 → 51 件で TIME_WAIT 蓄積による悪化傾向）。Phase 1 失敗率 gate により triage 採用フローへ強制遷移済み。
- 軸 A/C/D は B PASS の停止条件により skip。Phase 3 の停止条件「いずれかの軸で PASS 得られた時点で以降の軸を停止」に整合。

## 30day-contract

- 30day-contract 適用: **no**（軸 B 採用で確定対応済み）
- schedule feedback target: なし。`docs/30-workflows/unassigned-task/task-issue-532-api-full-coverage-rerun-miniflare-port-exhaustion-001.md` には `consumed_by` trace のみ追記し close 扱い。

## root cause hypothesis

- Miniflare 4.20260424.0 + undici が test file 並列実行時に socket pool を共有せず、ephemeral port range（49152-65535）を高速に消費。
- 各 baseline rerun で TIME_WAIT 蓄積により再現件数が単調増加（23 → 38 → 51）した観測と整合。
- `--maxWorkers=1 --minWorkers=1` は test file を直列実行することで Miniflare instance の同時数を 1 に制限し、port pressure を解消した。

## 後続採用 / 影響範囲

| パス | 変更 |
| --- | --- |
| `apps/api/package.json` | `test:coverage` script に `--maxWorkers=1 --minWorkers=1` を追加（最小差分） |
| `vitest.config.ts` | 変更なし（global 波及を回避） |
| `apps/web` / `packages/*` の test:coverage | 影響なし |
| CI gate (`.github/workflows/`) | 影響なし（既存 `test:coverage` script 経由でそのまま動作） |

## trade-off

- duration: baseline 200s → patch後 506s（直列化により ~2.5 倍）。CI 全体時間の増分は許容範囲（API 単体）。short-term 緩和優先で採用。
- 将来恒久対応は Miniflare / undici の上流改善 or test grouping（Phase 3 軸 E）を検討。本タスクではスコープ外。
