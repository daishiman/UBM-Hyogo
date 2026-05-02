# Phase 7: 受入条件マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-346-08a-canonical-workflow-tree-restore |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 受入条件マトリクス |
| Wave | restore |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | 6 (テスト戦略) |
| 次 Phase | 8 (CI / 品質ゲート) |
| 状態 | completed |

## 目的

AC-1〜AC-7 と Phase 6 で定義した検証ケース、Phase 11 で取得する evidence、CLAUDE.md 不変条件 #5 / #6 / #7 の整合を 1 枚のマトリクスに集約し、各 AC が **どの evidence によって検証されるか** を一意に決定する。

## AC × evidence × 不変条件 マトリクス

| AC | 内容（要約） | 検証 Phase | 検証ケース | evidence | 不変条件影響 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 08a canonical path 現状が evidence に記録 | Phase 11 | Case 1 / Case 2 | `file-existence.log` | #5 / #6 / #7 影響なし |
| AC-2 | 状態決定 A / B / C が判定根拠付きで確定 | Phase 2 / Phase 3 | （ドキュメント記載） | `outputs/phase-02/main.md` / `outputs/phase-03/main.md` | #5 / #6 / #7 影響なし |
| AC-3 | aiworkflow-requirements 3 ファイルが決定と整合（drift 0） | Phase 11 | Case 4 / Case 6 | `aiworkflow-requirements-state-diff.log` / `verify-indexes.log` | #5 / #6 / #7 影響なし |
| AC-4 | 09a / 09b / 09c の 08a 参照が broken link でない | Phase 11 | Case 3 | `9a-9b-9c-link-check.log` / `markdown-link-check.log` | #5 / #6 / #7 影響なし |
| AC-5 | unassigned-task 配下の 08a 参照が新状態と整合 | Phase 11 | Case 5 | `unassigned-task-grep.log` | #5 / #6 / #7 影響なし |
| AC-6 | `pnpm indexes:rebuild` 後の indexes drift が 0 | Phase 8 / Phase 11 | Case 6 | `verify-indexes.log` | #5 / #6 / #7 影響なし |
| AC-7 | secret 値が canonical path 名 / file 名 / evidence に含まれない | Phase 9 / Phase 11 | Case 7 | secret hygiene grep（Phase 9 ログ） | secret hygiene |

## 不変条件カバレッジ確認

| 不変条件 | 影響有無 | 根拠 |
| --- | --- | --- |
| #1 実フォーム schema を固定しすぎない | 影響なし | 本タスクは Forms schema に触れない |
| #2 consent キーは publicConsent / rulesConsent | 影響なし | 本タスクは consent に触れない |
| #3 responseEmail は system field | 影響なし | 本タスクは system field に触れない |
| #4 admin-managed data 分離 | 影響なし | 本タスクは admin data に触れない |
| **#5 D1 直接アクセス禁止** | 影響なし（明示確認） | 本タスクは markdown / json のみ編集、apps/web / apps/api に触れない |
| **#6 GAS prototype 昇格禁止** | 影響なし（明示確認） | 本タスクは GAS prototype を canonical workflow に昇格させない |
| **#7 Form 再回答が本人更新の正式経路** | 影響なし（明示確認） | 本タスクは Form 経路に触れない |

## evidence 取得 7 種一覧

| # | ファイル | 取得 Phase | 紐づく AC |
| --- | --- | --- | --- |
| 1 | `file-existence.log` | Phase 11 Case 1/2 | AC-1 |
| 2 | `08a-reference-grep.log` | Phase 11 | AC-1 / AC-3 |
| 3 | `aiworkflow-requirements-state-diff.log` | Phase 11 Case 4 | AC-3 |
| 4 | `9a-9b-9c-link-check.log` | Phase 11 Case 3 | AC-4 |
| 5 | `unassigned-task-grep.log` | Phase 11 Case 5 | AC-5 |
| 6 | `verify-indexes.log` | Phase 11 Case 6 | AC-3 / AC-6 |
| 7 | `markdown-link-check.log` | Phase 11 | AC-4 |

## 完了条件

- 7 件の AC が 1:1 で evidence にマッピング
- 7 不変条件すべてに「影響有無 + 根拠」が記録
- evidence 7 種が AC と紐付け確認済
- `outputs/phase-07/main.md` に記録

## 成果物

- `outputs/phase-07/main.md`
