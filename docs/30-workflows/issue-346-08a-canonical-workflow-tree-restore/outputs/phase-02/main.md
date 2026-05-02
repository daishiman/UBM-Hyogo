# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-346-08a-canonical-workflow-tree-restore |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| Wave | restore |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | completed |

## 目的

Phase 1 で確定した A / B / C の 3 択論点と AC-1〜7 に対し、本タスクは (1) **状態分類決定アルゴリズム**、(2) **aiworkflow-requirements 反映設計**、(3) **09a-c 参照同期方針**、(4) **現行 repo layout discovery の手順** を確定する。コード（markdown 編集本体）はここでは書かず、Phase 5 runbook に渡す **編集指示としての仕様** を固定する。

## 設計方針

1. **状態分類決定は機械的に**: 物理状態調査の結果（canonical 不在 / 派生 dir 実在 / completed-tasks 不在 / unassigned 起票済）を入力に、後述の決定アルゴリズムで A / B / C を一意に導出する。属人判定を残さない。
2. **編集対象は 3 ファイル + 09a-c spec + unassigned UT-08A-01〜06 のみ**: 他の aiworkflow-requirements ファイルおよび indexes (`indexes/*.json`) には直接手を入れず、`pnpm indexes:rebuild` の出力に委ねる。
3. **語彙の正本化**: 「current/partial」「completed」「active」のいずれの状態を選ぶかで参照語彙を統一する。混在を避ける。
4. **broken link は zero tolerance**: AC-4 / AC-5 の grep / link check を PASS にすることが Phase 11 evidence の必達条件。

## 状態分類決定アルゴリズム

詳細は `outputs/phase-02/state-decision-algorithm.md`。要約は以下:

| 入力観測 | 値（本タスク時点） | 判定への寄与 |
| --- | --- | --- |
| canonical path `08a-parallel-api-contract-repository-and-authorization-tests/` の存在 | **存在（履歴から復元）** | A 採用の根拠 |
| `completed-tasks/08a-...` の存在 | **不在** | B の前提を否定 |
| follow-up dir `02-application-implementation/08a-A-public-use-case-coverage-hardening/` の存在 | **存在** | 08a の後継ではなく依存 follow-up として扱う |
| `unassigned-task/UT-08A-01〜06` の存在 | **存在** | 08a 系列のテスト責務が個別タスク化済 → C の補強 |
| `legacy-ordinal-family-register.md` 上の 08a 行 | （Phase 1 物理調査で記録） | 状態欄が `current` のままなら drift 確定 |
| `resource-map.md` 上の 08a path 行 | （同上） | canonical path を指しているなら drift 確定 |

### 決定ロジック（疑似コード）

```
if canonical_exists and reference_consistent:
    return A_no_change_needed
elif completed_tasks_exists:
    return B_completed
else:
    return A_restore_from_git_history
```

本タスクの観測値では **A（canonical tree 復元）** が選択される見込み。Phase 3 で代替案 A / B も比較レビューする。

## aiworkflow-requirements 反映設計

詳細は `outputs/phase-02/aiworkflow-requirements-update-plan.md`。編集差分は以下 3 ファイルに閉じる:

| ファイル | 編集内容 |
| --- | --- |
| `legacy-ordinal-family-register.md` | A 採用時は既存の current/partial 行を維持し、必要に応じて復元根拠を本タスク evidence に記録する。 |
| `resource-map.md` | A 採用時は既存の canonical path `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/` を維持する。 |
| `task-workflow-active.md` | A 採用時は 08a を active/partial として存続し、08a-A は follow-up として扱う。 |

### 想定差分行数

| 採用案 | 編集行数（概算） |
| --- | --- |
| A 復元 | 0 行（aiworkflow-requirements 側）+ canonical tree 復元 (git restore) |
| B completed-tasks 移動正本化 | 約 6 行（3 ファイル × 約 2 行） |
| C current/partial 分類 | 不採用 |

## 09a / 09b / 09c 参照同期方針

| 採用案 | 09a / 09b / 09c spec での 08a 参照表現 |
| --- | --- |
| A 復元 | `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/` をそのまま参照（追加編集不要） |
| B completed-tasks | `docs/30-workflows/completed-tasks/08a-parallel-api-contract-repository-and-authorization-tests/` に置換 |
| C current/partial | 不採用 |

09a / 09b / 09c の spec ファイルが存在しない場合、当該タスクの追加責務にはせず本タスク `outputs/phase-12/unassigned-task-detection.md` に「09a-c spec 不在」を未タスク候補として記録する。

## 現行 repo layout discovery 手順

```bash
# 08a canonical 存在確認
test -e docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/ \
  && echo EXISTS || echo MISSING

# 完了タスク移動確認
ls docs/30-workflows/completed-tasks/ | grep -E "^08a" || echo "no 08a in completed-tasks"

# 派生 dir 確認
test -e docs/30-workflows/02-application-implementation/08a-A-public-use-case-coverage-hardening/ \
  && echo FOLLOW_UP_EXISTS || echo FOLLOW_UP_MISSING

# 全参照 grep
rg "08a-parallel-api-contract" docs/ .claude/

# unassigned 確認
ls docs/30-workflows/unassigned-task/ | grep -E "08[Aa]"
```

これらの結果を `outputs/phase-11/evidence/file-existence.log` と `08a-reference-grep.log` に保存する。

## 依存境界 / 統合テスト連携

| Phase | 連携内容 |
| --- | --- |
| Phase 3 | 設計レビュー（代替案 A / B / C の PASS-MINOR-MAJOR 比較）の入力 |
| Phase 4 | サブタスク T1〜T4 への分解の入力 |
| Phase 5 | runbook（編集順序）の入力 |
| Phase 6 | 検証戦略（`test -e` / `rg` / state 欄一致）の入力 |
| Phase 8 | `verify-indexes-up-to-date` gate / markdown link check |
| Phase 11 | 7 種 log evidence の取得対象 |

## 多角的チェック観点

- **不変条件 #5**: 編集対象に `apps/web` / `apps/api` を含めない。boundary 影響なし。
- **不変条件 #6**: GAS prototype dir を canonical workflow に昇格させない。
- **secret hygiene**: 編集差分に token / secret を含めない。Phase 9 で grep gate。
- **可逆性**: 採用案 A / B / C いずれも git revert で原状回復可能（docs-only のため）。

## 完了条件

- 状態分類決定アルゴリズムが `outputs/phase-02/state-decision-algorithm.md` に確定
- aiworkflow-requirements 反映プランが `outputs/phase-02/aiworkflow-requirements-update-plan.md` に確定
- 09a-c 参照同期方針が表として確定
- `outputs/phase-02/main.md` に設計サマリ記載

## 成果物

- `outputs/phase-02/main.md`
- `outputs/phase-02/state-decision-algorithm.md`
- `outputs/phase-02/aiworkflow-requirements-update-plan.md`
