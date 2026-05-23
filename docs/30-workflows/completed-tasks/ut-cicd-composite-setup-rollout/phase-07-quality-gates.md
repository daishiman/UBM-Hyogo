---
phase: 7
title: 品質ゲート — verify-composite-rollout 設計
workflow_id: ut-cicd-composite-setup-rollout
status: completed
---

# Phase 7: 品質ゲート

[実装区分: 実装仕様書]

## 1. 既存 quality gate への影響

| gate | 影響 |
|------|------|
| `pnpm typecheck` | なし（yaml 変更のみ） |
| `pnpm lint` | なし |
| `pnpm build` | なし |
| `verify-pr-ready.sh` | なし |
| `verify-gate-metadata` | 自身が rollout 対象。CI 上で composite action 経由で再実行される |
| `verify-indexes` | 同上 |
| `verify-phase12-compliance` | 同上 |

## 2. 新規 gate 候補: `verify-composite-rollout`

raw `actions/setup-node` / `pnpm/action-setup` 直書きが復活しないように grep gate を追加する案。

### 設計

```yaml
# .github/workflows/verify-composite-rollout.yml (案・本タスクでは作成しない)
name: verify-composite-rollout
on: [pull_request, push]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Ensure no raw setup-node in workflows
        run: |
          set -e
          count_setup_node=$(grep -l 'uses: actions/setup-node' .github/workflows/*.yml | wc -l | tr -d ' ')
          count_pnpm_action=$(grep -l 'uses: pnpm/action-setup' .github/workflows/*.yml | wc -l | tr -d ' ')
          echo "raw setup-node count: $count_setup_node"
          echo "raw pnpm/action-setup count: $count_pnpm_action"
          if [ "$count_setup_node" -ne 0 ] || [ "$count_pnpm_action" -ne 0 ]; then
            echo "::error::raw setup-node / pnpm/action-setup detected in .github/workflows/*.yml. Use ./.github/actions/setup-project instead."
            exit 1
          fi
```

### 採否判断

| 案 | メリット | デメリット |
|----|----------|------------|
| 採用（本タスクで gate も追加） | DRY 復活を恒久的に防止 | 本タスクスコープ拡大 |
| **不採用（後続別タスクへ委譲）** | 本タスクは yaml rollout に純化、PR diff が小さい | 復活を grep gate でブロックできない期間が一時的に発生 |

→ **本タスクでは新規 gate は追加しない**。Issue #284 close 後、別 follow-up issue で `verify-composite-rollout` gate 追加を検討する。

## 3. ローカル pre-push hook 案（任意）

lefthook に以下を追加する案（本タスクスコープ外）:

```yaml
# lefthook.yml（参考案）
pre-push:
  commands:
    verify-composite-rollout:
      run: |
        set -e
        n1=$(grep -l 'uses: actions/setup-node' .github/workflows/*.yml | wc -l | tr -d ' ')
        n2=$(grep -l 'uses: pnpm/action-setup' .github/workflows/*.yml | wc -l | tr -d ' ')
        [ "$n1" = "0" ] && [ "$n2" = "0" ] || { echo "raw setup-node leaked"; exit 1; }
```

## 4. 統合テスト連携

| Phase | アクション |
|-------|------------|
| 7 | 既存 gate 影響なしを確認 |
| 8 | DoD として grep 0 件を恒久条件化 |

## 完了条件

- [ ] 既存 gate への影響が §1 に明記されている
- [ ] `verify-composite-rollout` gate 案が §2 に提示されている
- [ ] 本タスクでは新規 gate を追加しない判断が記録されている
