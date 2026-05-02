# Phase 4: タスク分解

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-346-08a-canonical-workflow-tree-restore |
| Phase 番号 | 4 / 13 |
| Phase 名称 | タスク分解 |
| Wave | restore |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装計画) |
| 状態 | completed |

## 目的

Phase 2 / Phase 3 の決定（推奨案 A）を、独立粒度のサブタスク T1〜T4 に分解する。各サブタスクは doc-only grep を伴う検証可能な単位であり、Phase 5 runbook が単純な順序実行で完遂できる粒度に揃える。

## サブタスク一覧

### T1: 08a 物理状態調査

**目的**: 推奨案 A（または将来の状態変化時の A / B）採否を物理事実に固定する。

**作業内容**:

- canonical path 存在確認: `test -e docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/`
- completed-tasks 配下の 08a 系列確認: `ls docs/30-workflows/completed-tasks/ | grep 08a`
- 派生 dir 確認: `ls docs/30-workflows/02-application-implementation/ | grep 08a`
- aiworkflow-requirements 3 ファイルから 08a 関連行を抽出して snapshot 化

**成果物**: `outputs/phase-11/evidence/file-existence.log`、`outputs/phase-01/main.md` への記録

**完了条件**: 物理事実が一意に確定し、推奨案 A が選択される根拠が揃っている

### T2: aiworkflow-requirements 3 ファイル更新

**目的**: 08a の状態正本を C に整合させる。

**作業内容**:

- `legacy-ordinal-family-register.md`: 08a 行を `current` → `current/partial`、`canonical path restored` を追記
- `resource-map.md`: 08a の physical path 欄が復元済み canonical root を指すことを確認
- `task-workflow-active.md`: 08a を current/partial として維持し、08a-A は follow-up として扱う
- `pnpm indexes:rebuild` を実行し indexes の差分を生成

**成果物**: 編集後の 3 ファイル + `indexes/*.json` 差分 + `outputs/phase-11/evidence/aiworkflow-requirements-state-diff.log`

**完了条件**: 3 ファイルの drift が 0、`verify-indexes-up-to-date` gate 想定 PASS

### T3: 09a / 09b / 09c 参照同期

**目的**: 上流 contract gate (08a) の broken link を解消する。

**作業内容**:

- 09a / 09b / 09c spec ファイルの実在確認（不在なら本タスクから除外し T4 → 未タスク化）
- 実在する場合、08a 参照を `08a-parallel-api-contract-repository-and-authorization-tests`（または canonical restoration 注記付き）に置換
- markdown link check 相当の grep で broken link 残存ゼロを確認

**成果物**: 編集後の 09a / 09b / 09c spec + `outputs/phase-11/evidence/9a-9b-9c-link-check.log`

**完了条件**: 09a / 09b / 09c から 08a canonical path への参照が 0 件、または canonical restoration 注記付き表現に統一されている

### T4: unassigned-task 内 08a 参照同期

**目的**: UT-08A-01〜06 と起票元タスク仕様が新状態と整合するように参照を更新する。

**作業内容**:

- `docs/30-workflows/unassigned-task/UT-08A-01〜06.md` を grep
- 08a canonical path 直接参照を `08a-parallel-api-contract-repository-and-authorization-tests`（または canonical restoration 表現）に置換
- 起票元 `task-08a-canonical-workflow-tree-restore-001.md` には本タスク仕様書への back-reference を追加

**成果物**: 編集後の unassigned 各 md + `outputs/phase-11/evidence/unassigned-task-grep.log`

**完了条件**: 08a canonical path 直接参照が 0、canonical restoration 表現が統一

## サブタスク間の依存

```
T1 (調査) ── decides ──> T2 (aiworkflow 更新)
                          │
                          ├──> T3 (09a-c 同期)
                          └──> T4 (unassigned 同期)
```

T2 完了後 T3 / T4 は並列実行可能だが、Phase 5 runbook では sequential 実行を採用（小規模 docs 編集のため並列化メリット薄い）。

## 単一責務原則チェック

| サブタスク | 単一責務 | 検証可能性 |
| --- | --- | --- |
| T1 | 物理状態の観測のみ | `test -e` / `ls` / `rg` |
| T2 | aiworkflow-requirements 状態正本化のみ | 3 ファイル diff + indexes drift 0 |
| T3 | 09a-c 参照の broken link 解消のみ | grep / link check |
| T4 | unassigned 参照同期のみ | grep |

## 完了条件

- T1〜T4 が独立粒度で定義されている
- 各サブタスクの成果物と完了条件が明示されている
- サブタスク間の依存が DAG として確定
- `outputs/phase-04/main.md` にサブタスク表が記録

## 成果物

- `outputs/phase-04/main.md`
