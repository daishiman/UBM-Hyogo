# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-utgov001-references-reflect-001 |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-05-01 |
| 前 Phase | 2 |
| 次 Phase | 4 |
| 状態 | spec_created |

## 目的

Phase 2 の設計が、推測反映を防ぎ、aiworkflow-requirements 正本と GitHub GET evidence の整合を保てるかをレビューする。

## 実行タスク

1. 代替案を比較する。
2. 4条件（矛盾なし・漏れなし・整合性・依存関係整合）で判定する。
3. GO / NO-GO 条件を確定する。
4. MINOR / MAJOR 指摘の戻り先を明示する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 1 | phase-01.md | 要件 |
| Phase 2 | phase-02.md | 設計 |
| 上流 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-12/system-spec-update-summary.md | handoff理由 |

## 実行手順

### ステップ 1: 代替案比較

| 案 | 内容 | 判定 |
| --- | --- | --- |
| A | fresh applied GET evidence のみを入力に反映 | 採用 |
| B | expected-contexts から推測して反映 | MAJOR: final applied stateではない |
| C | placeholder applied JSON を反映 | MAJOR: false green |
| D | Issue #303 を再オープンしてから反映 | MINOR/不採用: ユーザー要求に反する |

### ステップ 2: 4条件判定

| 条件 | 判定基準 |
| --- | --- |
| 矛盾なし | applied GET と references/indexes が同じ final state を指す |
| 漏れなし | references / indexes / workflow台帳 / mirror / changelog を対象化 |
| 整合性 | CLAUDE.md と aiworkflow-requirements の正本優先順位を崩さない |
| 依存関係整合 | fresh GET が無ければ Phase 5 は BLOCKED |

### ステップ 3: GO / NO-GO

| 判定 | 条件 |
| --- | --- |
| GO | `required_status_checks.contexts` と6軸状態が dev/main で取得済み |
| NO-GO | applied JSON が `blocked_until_user_approval` / null / missing |

## 統合テスト連携

Phase 4 は NO-GO 条件を自動検出する `jq -e` コマンドを validation matrix に入れる。

## 多角的チェック観点

- 批判的思考: evidence と期待値を分離できているか。
- システム思考: 正本・索引・mirror の更新順序が循環していないか。
- リスク分析: closed issue を誤って close/reopen しないか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 代替案比較 | pending |
| 2 | 4条件判定 | pending |
| 3 | GO/NO-GO確定 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/gate-decision.md | 設計レビューとGO/NO-GO |

## 完了条件

- [ ] 採用案と不採用案が明記されている
- [ ] NO-GO条件が Phase 1/2/3 で重複明記されている
- [ ] Phase 4開始条件が明確
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] `outputs/phase-03/gate-decision.md` を作成
- [ ] `artifacts.json` の Phase 3 状態を更新

## 次Phase

Phase 4: 検証戦略
