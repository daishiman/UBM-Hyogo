# Phase 6: 異常系設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| 機能名 | task-issue-191-schema-aliases-implementation-001 |
| 作成日 | 2026-05-01 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | failure cases |

## 目的

alias apply と lookup の失敗時挙動を固定する。

## 実行タスク

| ID | 異常 | 期待 |
| --- | --- | --- |
| F-01 | duplicate alias | 409/422、既存 row 不変 |
| F-02 | queue already resolved | 409、別 stableKey 上書きなし |
| F-03 | invalid stableKey | 400/422 |
| F-04 | alias insert 成功後 queue update 失敗 | transaction rollback |
| F-05 | D1 transient error during lookup | sync failure + retry |
| F-06 | alias miss + fallback miss | unmapped handling、silent stableKey 付与なし |
| F-07 | deleted member/field | back-fill 対象外 |

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| 07b failure cases | `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/phase-06.md` | 既存異常系 |
| Phase 4 | `phase-04.md` | test matrix |

## 実行手順

1. F-01 から F-07 を route/repository/sync のどこで検証するか割り当てる。
2. HTTP error mapping は既存 04c/07b の pattern に合わせる。
3. D1 failure injection が難しい場合は repository mock で補完し、Phase 11 に限界を明記する。

## 統合テスト連携

| 異常 | test layer |
| --- | --- |
| F-01/F-02/F-03 | route contract |
| F-04 | repository/workflow |
| F-05/F-06 | sync lookup |
| F-07 | back-fill/sync |

## 多角的チェック観点（AIが判断）

- silent fallback が起きないか。
- idempotent retry と別 stableKey 上書き禁止が両立しているか。
- deleted row を復活させていないか。

## サブタスク管理

| サブタスク | 完了条件 |
| --- | --- |
| error mapping | response status/body documented |
| failure tests | each F ID covered |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 異常系設計 | `phase-06.md` | failure cases |

## 完了条件

- [ ] F-01 から F-07 が検証可能
- [ ] retry/fallback 境界が明確
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] Phase 7 AC matrix に転記できる

## 次Phase

Phase 7: ACマトリクス
