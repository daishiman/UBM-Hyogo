# Unassigned Task Detection

Status: IMPLEMENTED_LOCAL_PENDING_PR
Date: 2026-05-09

## 副次検出

| Item | Result |
| --- | --- |
| 新規未タスク起票候補（本サイクル発見） | 0 件 |
| 理由 | runtime rerun + triage matrix 軸 B で 133/133 PASS / 0 EADDR を達成。副次的な test fail は観測されず |
| 既存 source task | `docs/30-workflows/unassigned-task/task-issue-532-api-full-coverage-rerun-miniflare-port-exhaustion-001.md` を本ワークフローで consumed（closure_state=triage_adopted） |
| Escalation | なし |

## 30day-contract 候補

| 項目 | 状態 |
| --- | --- |
| EADDRNOTAVAIL 30 日内再発監視 | **適用なし**（現行 `test:coverage` script では軸 B 採用で回避済み）。再発時は本ワークフロー Phase 8 runbook に従う |
| Miniflare / undici 上流改善追跡 | 別 Issue 候補。worker cap を将来緩めるトリガーになるため、上流に socket pool 改善 PR が出たら別タスク化を検討 |
| 軸 E（test grouping by D1 usage） | 別 Issue 候補。本タスクでは採用せず、最終手段として保留 |

## 後続検証想定

- patch 採用後の CI 実時間（API test:coverage 単体）が許容外になった場合は、軸 D（`--shard`）採用 or 軸 E（test grouping）を別 Issue で評価。
- `apps/web` / `packages/*` で同様の port exhaustion が観測されたら別 Issue 起票。
