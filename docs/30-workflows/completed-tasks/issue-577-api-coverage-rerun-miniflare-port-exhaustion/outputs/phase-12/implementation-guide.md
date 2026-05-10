# Implementation Guide

Status: IMPLEMENTED_LOCAL_PENDING_PR
Date: 2026-05-09

## Part 1: 中学生レベル概念説明

Issue #532 では `@ubm-hyogo/api` の全部まとめたテスト（カバレッジ計測つき）を走らせると、ローカル PC の「通信口」（ephemeral port）を一気に使い尽くしてしまい、`EADDRNOTAVAIL` という「もう空いている通信口がありません」というエラーで落ちていた。

理由は、テストごとに偽の Cloudflare 環境（Miniflare）を立ち上げてデータベース通信をしていて、それを並列で何個も同時に走らせていたから。

このタスクではまず「もう一度走らせれば直るかも？」を 3 回試したが、3 回とも落ちた。しかも回を重ねるごとに悪化した（23件 → 38件 → 51件）。これは「使った通信口がしばらく解放されない（TIME_WAIT）」状態が積み上がって、状況が悪くなっていく証拠。

そこで、テストを **1 個ずつ順番に** 走らせる設定（`--maxWorkers=1 --minWorkers=1`）に変えたら、133 個全部の test file が無事通った。並列で走らせる「賢さ」は犠牲になるが（200秒 → 506秒）、確実に通る方を取った。修正は `apps/api/package.json` の 1 行だけ。

## Part 2: Developer Guide

### 採用結果

- **採用軸: B**（`--maxWorkers=1 --minWorkers=1`）
- **patch 場所**: `apps/api/package.json#scripts.test:coverage` に `--maxWorkers=1 --minWorkers=1` を追加
- **diff**:

```diff
-    "test:coverage": "vitest run --passWithNoTests --root=../.. --config=vitest.config.ts --coverage --coverage.reportsDirectory=apps/api/coverage --coverage.include=\"apps/api/src/**/*.{ts,tsx}\" apps/api"
+    "test:coverage": "vitest run --passWithNoTests --root=../.. --config=vitest.config.ts --coverage --coverage.reportsDirectory=apps/api/coverage --coverage.include=\"apps/api/src/**/*.{ts,tsx}\" --maxWorkers=1 --minWorkers=1 apps/api"
```

### 検証

| コマンド | 結果 |
| --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/api lint` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage`（post-patch） | PASS / 133/133 / 0 EADDRNOTAVAIL / 506s |

### baseline + matrix 結果（evidence/triage-summary.md より）

| 軸 | 値 | exit | EADDR | dur(s) | 採用 |
| --- | --- | --- | --- | --- | --- |
| baseline 1 | (none) | 1 | 23 | 200 | - |
| baseline 2 | (none) | 1 | 38 | 140 | - |
| baseline 3 | (none) | 1 | 51 | 111 | - |
| B | maxWorkers=1, minWorkers=1 | 0 | 0 | 567 | **採用** |
| A/C/D | - | - | skipped (B PASS で停止) | - | - |

### evidence path

- `outputs/phase-11/evidence/env-snapshot.txt`
- `outputs/phase-11/evidence/baseline-rerun-{1,2,3}.log`
- `outputs/phase-11/evidence/triage-matrix-maxWorkers-1.log`
- `outputs/phase-11/evidence/full-coverage-rerun.log`（post-patch）
- `outputs/phase-11/evidence/triage-summary.md`
- `outputs/phase-11/evidence/typecheck.log`
- `outputs/phase-11/evidence/lint.log`

### 再発時 runbook（簡易）

1. `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage` で再発確認（patch 後でも稀に再現する場合）。
2. 各 rerun 間に 10-30 秒 sleep（TIME_WAIT 緩和）。
3. それでも再現する場合は、軸 A（`--pool=forks`） / 軸 C（`--no-file-parallelism`）を追加検討。
4. CI 全体時間が許容できない場合のみ軸 D（`--shard`）採用を別 Issue で検討。
5. Miniflare / undici の上流改善が出た場合、worker cap を緩めることを別 Issue で再評価。

### scope 外 / 別 Issue 候補

- 軸 E（test grouping by D1 usage）: 大きな refactor のため別 Issue。
- coverage 閾値変更: 本タスクで触れない。
- helper script `scripts/api-coverage-rerun.sh` 実体追加: 手動 baseline + matrix で目的達成済みのため不採用（CONST_007: 必要最小限差分原則）。再発頻度が上がった場合に別 Issue で導入判断。

### 30day-contract

- 適用なし（現行 `test:coverage` script では軸 B 採用で回避済み）。
- 30 日以内に EADDRNOTAVAIL 再発が観測された場合は Issue 再起票し、軸 A/C/D / 上流改善を再評価する。
