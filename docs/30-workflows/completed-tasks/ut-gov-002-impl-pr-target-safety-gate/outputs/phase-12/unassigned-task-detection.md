# 未割当タスク検出

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 12 |
| 検出件数 | **0 件**（候補 4 件は別タスクへ委譲済または将来トリガ条件として記録） |

## サマリ

本タスクから派生する未割当タスクは **0 件**。検出プロセスにおいて検討した 4 候補はいずれも以下のいずれかに該当する：
- 既存の別タスクで担当が固定済（UT-GOV-002-EVAL / SEC / OBS）
- 将来トリガ条件が満たされた時点で初めて起票すべきもの（reactive task）

検討痕跡として 4 候補を以下に記録する。

## 候補 1: UT-GOV-002-EVAL（OIDC / `id-token: write` 化評価）

| 項目 | 内容 |
| --- | --- |
| 起票要否 | **不要（既存別タスクとして委譲済）** |
| 委譲先 | UT-GOV-002-EVAL（既存）|
| 関連 AC | 本タスク AC-8（OIDC 化は本タスク非対象） |
| 想定スコープ | `id-token: write` を job に追加し、Cloudflare / AWS との OIDC federation を評価 |
| 起票タイミング | 本タスク完了後、UT-GOV-002-EVAL の Phase 1 要件定義から開始 |

## 候補 2: UT-GOV-002-SEC（security review 最終署名）

| 項目 | 内容 |
| --- | --- |
| 起票要否 | **不要（既存別タスクとして委譲済）** |
| 委譲先 | UT-GOV-002-SEC（既存）|
| 関連 AC | 本タスク AC-8（security review 最終署名は本タスク非対象） |
| 想定スコープ | "pwn request" 非該当 5 箇条のセキュリティ最終署名・監査ログ整備 |
| 起票タイミング | 本タスク Phase 13 完了後 |

## 候補 3: UT-GOV-002-OBS（secrets inventory automation）

| 項目 | 内容 |
| --- | --- |
| 起票要否 | **不要（既存別タスクとして委譲済）** |
| 委譲先 | UT-GOV-002-OBS（既存）|
| 関連 AC | 本タスク AC-8（secrets inventory automation は本タスク非対象） |
| 想定スコープ | secrets / token の自動インベントリ収集・ローテーション通知 |
| 起票タイミング | UT-GOV-002-EVAL / SEC 完了後 |

## 候補 4: `workflow_run` 利用ケース将来追加時のレビュー枠

| 項目 | 内容 |
| --- | --- |
| 起票要否 | **不要（reactive task。将来トリガ条件が満たされた時点で起票）** |
| トリガ条件 | 本タスクの Decision Log で「`workflow_run` を採用しない」と固定したが、将来別ユースケース（例: 別 repo からの release 起点デプロイ）で `workflow_run` 採用検討が発生した場合 |
| 関連 AC | 本タスク Decision Log（`workflow_run` 非採用） |
| 想定スコープ | trust boundary の再評価 / secrets 橋渡し経路の再レビュー / aiworkflow-requirements 正本再判定 |
| 起票タイミング | 該当ユースケース発生時点で UT-GOV-002-WFRUN 等の名前で新規起票 |

## 検出プロセス

1. 本タスク AC-1〜AC-9 / Decision Log / スコープ「含まない」項目を網羅レビュー。
2. 各項目について、本タスクで完結するか / 別タスクへ委譲済か / reactive 起票かを判定。
3. 既存別タスク（UT-GOV-002-EVAL / SEC / OBS）の存在を確認し、重複起票を回避。
4. reactive 起票候補についてはトリガ条件を明文化。

## 完了条件

- [x] 0 件でも本ドキュメントが出力されている
- [x] 候補 4 件の検討痕跡が記録されている
- [x] 既存別タスクへの委譲が明示されている
- [x] reactive 起票候補のトリガ条件が記述されている
