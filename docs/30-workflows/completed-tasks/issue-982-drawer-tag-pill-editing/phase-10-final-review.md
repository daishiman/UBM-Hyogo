# Phase 10: 最終レビュー

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`


## 目的

AC 充足と blocker を判定し、scope 外候補を Phase 12 の未タスク検出で分類する。今回の #982 実装サイクル内で完了すべき項目は未タスクへ逃がさない。

## AC 充足判定

| AC | 判定根拠（test ID） |
| --- | --- |
| AC-1 POST 冪等 persist | A-T1 / A-T2 / A-T3 / R-T1 / R-T2 |
| AC-2 DELETE 冪等 | A-T7 / A-T8 / R-T3 / R-T4 |
| AC-3 楽観更新 rollback + toast | B-T2〜B-T5 |
| AC-4 audit 記録（no-op 非記録） | A-T1 / A-T2 / A-T7 / A-T8 |
| AC-5 409 deleted member | A-T6 / A-T9 / R-T7 |
| AC-6 regression なし | A-T11 / F-T8 |
| AC-7 active tag master 不在 404 | A-T4 / A-T4b |
| AC-8 invariant #13 再定義反映 | task-C（grep `tag_assignments`=0 / `01-api-schema.md` 記載） |

## blocker 判定

| 項目 | 状態 |
| --- | --- |
| 機能 blocker | なし（全 AC をテストで担保） |
| runtime 依存 | staging visual baseline（Phase 11）は user-gated。機能 blocker ではない |

## scope 外候補（Phase 12 未タスク検出へ渡す）

- tag master の pagination / 検索（master が大量化した場合）— 現状全件で MVP 充足。
- bulk tag assign（複数 member 一括）— scope 外。
- followup-001（#981 list enrichment）との data source 共有最適化 — 別 issue。

> 上記は #982 の AC 充足には不要な scope 外候補として分類する。Phase 12 では「今回サイクル内で完了すべき未タスク 0 件」と「将来検討候補」を分離し、未タスク化が必要な場合だけ理由・実施場所・時期を明記する。

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物

- 最終レビュー結果（AC 充足 / blocker なし / MINOR 候補）

## 統合テスト連携

- 実装時は Phase 4-7 の focused tests と Phase 11 evidence ledger に接続する。

## 参照資料

- docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/index.md
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 完了条件

- 全 AC が test ID で裏付けられている
- blocker なし判定
- scope 外候補を Phase 12 へ引き継ぎ、今回サイクル内の先送り 0 件を検証する
