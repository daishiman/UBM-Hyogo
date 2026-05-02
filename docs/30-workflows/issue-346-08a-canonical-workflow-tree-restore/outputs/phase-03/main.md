# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-346-08a-canonical-workflow-tree-restore |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| Wave | restore |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (タスク分解) |
| 状態 | completed |

## 目的

Phase 2 で確定した状態分類決定アルゴリズム・反映設計・参照同期方針に対し、3 つの代替案（**A. canonical 復元** / **B. completed-tasks 移動正本化** / **C. current 再分類**）を PASS-MINOR-MAJOR で比較レビューし、本タスクの推奨案を確定する。base case（08a 物理状態）別の差分マトリクスも作成し、将来の状態変化（例: 08a 復元 PR が別途出た場合）に備える。

## 代替案レビュー（PASS-MINOR-MAJOR）

| 観点 | A. canonical 復元 | B. completed-tasks 移動正本化 | C. current 再分類 |
| --- | --- | --- | --- |
| 価値（broken link 解消） | PASS | PASS | PASS |
| 実現性（必要工数） | MAJOR（git 履歴から canonical tree 一式を復元する必要、復元後の整合確認も発生） | MINOR（completed-tasks に移動する正本宣言のみ、ただし完了 evidence の有無確認が必要） | PASS（実体不在を「current/partial として正本化」+ 08a-A を canonical restoration 宣言、最も小さい編集差分） |
| 整合性（物理事実） | PASS（canonical root が実在し、08a-A は follow-up として整合） | MINOR（completed-tasks に 08a 系列が無い） | FAIL（08a-A は復元 old task ではない） |
| 運用性（後続改修コスト） | PASS | MINOR | MINOR（canonical restoration 表現を 09a-c で扱う必要、ただし 1 度きり） |
| 可逆性 | PASS（docs-only） | PASS | PASS |
| 不変条件 #5/#6/#7 | PASS | PASS | PASS |
| 推奨度 | **高** | 低 | 低 |

### 推奨案

**A. canonical tree 復元**。

理由:
- 物理状態（canonical root 復元済み + 08a-A follow-up 実在 + UT-08A-01〜06 起票）と最も整合する。
- 既存参照を大きく書き換えず、物理 root 復元で broken link を解消できる。
- 08a-A は follow-up であり、後継として扱わないため意味論が保たれる。
- 09a-c の上流 contract gate 表現を「08a canonical treeが PASS してから 09c に進む」に置換でき、production release gate の意味論が回復する。

## base case 別差分マトリクス

| base case（08a の物理状態） | 推奨案 | aiworkflow 編集差分 | 09a-c 編集差分 |
| --- | --- | --- | --- |
| canonical 存在 + 全参照整合 | A 維持 | 0 行 | 0 行 |
| canonical 不在 + completed-tasks 存在 | B 採用 | 約 6 行 | path 置換のみ |
| canonical root 復元済 + 08a-A follow-up 存在 | **A 採用** | 復元 tree 一式 | 追加置換不要 |
| canonical 不在 + completed-tasks 不在 + 派生 dir 不在 | A 復元 | git restore + 行 | path 置換不要 |

## レビュー判定

| 軸 | 判定 | 根拠 |
| --- | --- | --- |
| 設計の正しさ | PASS | 物理事実と決定アルゴリズムが整合 |
| AC との整合 | PASS | AC-2 / AC-3 / AC-4 / AC-5 の充足経路が明確 |
| 不変条件 #5/#6/#7 | PASS | docs-only / GAS 不昇格 / Form 経路無関係 |
| secret hygiene | PASS | 編集差分に secret 値を含む経路なし |
| 可逆性 | PASS | git revert で原状回復可能 |

## open question（Phase 4 への引き渡し）

- Q1: 09a / 09b / 09c spec が現時点で物理存在するか。存在しない場合は、本タスクの参照同期対象から除外し `outputs/phase-12/unassigned-task-detection.md` に記録する。
- Q2: `unassigned-task/UT-08A-01〜06` の 08a 参照表現を `08a-parallel-api-contract-repository-and-authorization-tests` に置換するか、current/partial 表現として残すか。Phase 4 サブタスク T4 で確定する。
- Q3: aiworkflow-requirements indexes 再生成後、`verify-indexes-up-to-date` gate が PASS するか。Phase 8 / 11 で gate 化。

## 完了条件

- 代替案 A / B / C が PASS-MINOR-MAJOR で比較レビューされ、推奨案が A と確定
- base case 別差分マトリクスが記録
- open question 3 件が Phase 4 に引き渡し可能な形で整理
- `outputs/phase-03/main.md` にレビュー結果サマリ記載

## 成果物

- `outputs/phase-03/main.md`
