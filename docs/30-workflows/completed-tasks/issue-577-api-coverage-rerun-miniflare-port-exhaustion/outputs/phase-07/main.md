# Phase 07 — workflow 連携設計（rerun → triage → grouping）

Status: COMPLETED
Date: 2026-05-09

## 1. 採用方針

- **第一候補: helper 単独運用**。`scripts/api-coverage-rerun.sh` を採用する場合、`baseline --count=3` → `matrix --axis=<>` を CLI で直接呼ぶだけ。CI への組み込みは行わない（local triage 専用）。
- `scripts/coverage-guard.sh` は **threshold guard 責務**のため編集しない（責務混在を回避）。

## 2. `coverage-guard.sh` 編集 no-op の理由

- 既存の merge-commit skip 仕様（CLAUDE.md 「sync-merge 時の hook 挙動」）を破壊する恐れがある。
- 本タスクの責務は EADDRNOTAVAIL triage であり、threshold gate との結合は scope creep となる。
- triage 結果を CI に持ち込む必要が出たら、別 Issue としてユーザーへエスカレーションする。

## 3. 連携フロー（local 想定）

```
[user]                                         [helper]
 1. bash scripts/api-coverage-rerun.sh baseline --count=3
                                                  ↓
                                     baseline-rerun-{1,2,3}.log
                                     (PASS なら no-code verification close-out へ)
 2. (再現時) bash scripts/api-coverage-rerun.sh matrix --axis=B --value=maxWorkers=1
                                                  ↓
                                     triage-matrix-maxWorkers-1.log
                                     ...
 3. 採用軸が決まったら Phase 5 patch 適用
 4. 採用後 rerun を 1 回実施し full-coverage-rerun.log として保存
```

## 4. CI 影響評価

- `coverage-guard.sh`: 編集なし → CI 影響ゼロ。
- `apps/api/package.json` を patch する場合: `test:coverage` script の引数が増えるのみ。
- `vitest.config.ts` を patch する場合: 全 workspace（`apps/web` / `packages/*`）に副作用 → 採用回避優先（軸 B/A は `apps/api` 側 script 改変で対応）。

## 5. 採用判断記録

| 項目 | 値 |
| --- | --- |
| helper script 採用 | Phase 11 baseline 結果に依存 |
| `coverage-guard.sh` 編集 | **no-op**（編集しない） |
| エスカレーション必要時 | matrix 全軸 fail で恒久対応が必要となった場合のみ user 承認を仰ぐ |
