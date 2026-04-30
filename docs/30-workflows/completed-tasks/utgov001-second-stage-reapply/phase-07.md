# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-GOV-001 second-stage contexts reapply（task-utgov001-second-stage-reapply-001） |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス（AC-1〜AC-14 × Phase 1〜13 のトレース） |
| 作成日 | 2026-04-30 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | spec_created |
| タスク状態 | spec_created（GitHub Issue #202 は CLOSED でも仕様書 GO 済み） |
| タスク分類 | implementation / governance / NON_VISUAL（traceability matrix） |

## 目的

index.md で定義した受入条件 AC-1〜AC-14 を、Phase 1〜13 の各 Phase でどこを起点・経由・終点としてトレースするかを 1 枚のマトリクスにまとめる。各 AC に対して「検証方法 / 成果物 / 判定基準 / Phase 起点 / Phase 経由 / Phase 終点」の 6 軸を埋め、抜け漏れがないことを **AC × Phase の二次元行列で目視確認可能な形式** で記述する。Phase 10 最終レビューおよび Phase 13 実 PUT 後の AC 全件チェックリストとして使用する。

## 本 Phase でトレースする AC

- 全 AC（AC-1〜AC-14）が対象。本 Phase は traceability そのものを成果物とする。

## 実行タスク

1. AC-1〜AC-14 の各 AC に対して「検証方法 / 成果物 / 判定基準」を記述する（完了条件: 14 × 3 セル空欄なし）。
2. AC × Phase 二次元マトリクスを作成し、各セルに `起点(O) / 経由(M) / 終点(C) / 該当なし(-)` のいずれかを記入する（完了条件: 14 × 13 = 182 セル空欄なし）。
3. 各 AC の Phase 起点と終点が一意に定まっていることを確認する（完了条件: 各 AC で `O` が 1 つ以上、`C` が 1 つ以上）。
4. 4 条件（価値性 / 実現性 / 整合性 / 運用性）と AC の対応表を作成する（完了条件: 4 条件 × AC の対応が記述）。
5. リスクレジスタ R-1〜R-8 と AC の対応表を作成する（完了条件: 各 R が 1 つ以上の AC に紐付く）。
6. 異常系 F-1〜F-12 と AC の対応表を作成する（完了条件: 各 F が 1 つ以上の AC に紐付く）。
7. 成果物 1 ファイル（`outputs/phase-07/ac-matrix.md`）を作成する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/index.md | AC-1〜AC-14 の正本 |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-01.md〜phase-06.md | 各 Phase の AC トレース |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-03.md | リスクレジスタ R-1〜R-8 |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-06.md | 異常系 F-1〜F-12 |

## AC 別 検証方法 / 成果物 / 判定基準

| AC | 検証方法 | 成果物 | 判定基準 |
| --- | --- | --- | --- |
| AC-1 | UT-GOV-004 成果物からの抽出証跡を `contexts-source.json` で確認 | outputs/phase-02/contexts-source.json | 抽出元 path / 取得日時 / 抽出 entry 数が記載 |
| AC-2 | dev / main 別 JSON が個別ファイルとして存在し、集合差分が明文化 | outputs/phase-02/expected-contexts-{dev,main}.json | 配列が `.yml` 拡張子を含まず、dev / main 差分が文書化 |
| AC-3 | 適用前 GET の保全 | outputs/phase-13/branch-protection-current-{dev,main}.json | HTTP 200 取得・dev / main 別ファイル |
| AC-4 | payload の contexts 再生成（暫定 `[]` 残留なし） | outputs/phase-13/branch-protection-payload-{dev,main}.json | `contexts | length >= 1` かつ `.yml` 混入なし |
| AC-5 | dev / main 独立 PUT 各 HTTP 200 / applied JSON 保全 | outputs/phase-13/branch-protection-applied-{dev,main}.json | response body が dev / main 別ファイルで保存 |
| AC-6 | 適用後 GET contexts と expected の集合一致 | outputs/phase-09/main.md | `jq -S 'sort'` 同士の `diff` が 0 行 |
| AC-7 | drift 検査 6 値 | outputs/phase-09/drift-check.md | 6 値（reviews=null / enforce_admins=true / force_pushes=false / deletions=false / linear_history=true / conversation_resolution=true）が一致 |
| AC-8 | rollback 経路 3 パターンの記述 / payload 再利用原則 | outputs/phase-05/apply-runbook-second-stage.md | 3 パターン記述・UT-GOV-001 由来再利用明記 |
| AC-9 | workflow 名禁止 / 実 job 名・check-run 名のみ採用原則と検証手段 | outputs/phase-02/payload-design.md / outputs/phase-04/test-strategy.md | 静的検証コマンドが記述 |
| AC-10 | admin block 回避 PUT 直前チェックリスト | outputs/phase-05/apply-runbook-second-stage.md | 5 項目以上のチェックリスト |
| AC-11 | 30 種思考法 PASS / MAJOR ゼロ | outputs/phase-03/main.md | レビュー結果テーブルで 30 種すべて PASS |
| AC-12 | 4 条件最終判定 PASS と根拠 | outputs/phase-01/main.md / outputs/phase-03/main.md / outputs/phase-10/go-no-go.md | 4 条件すべて PASS 記録 |
| AC-13 | Phase 13 はユーザー承認なしに実 PUT・push・PR 作成を行わない | outputs/phase-03/main.md / outputs/phase-05/apply-runbook-second-stage.md / outputs/phase-13/local-check-result.md | 各文書に明文 |
| AC-14 | aiworkflow-requirements references 反映方針 | outputs/phase-12/main.md | 実反映タスクの起票形式と path が指定 |

## AC × Phase 二次元マトリクス

> セル記号: `O` = 起点（AC が初出 / 設計の入力）、`M` = 経由（AC が検証・参照される）、`C` = 終点（AC が確定 / 検証完了）、`-` = 該当なし

| AC \ Phase | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | O | C | M | M | M | - | M | - | M | M | - | M | M |
| AC-2 | O | C | M | M | M | - | M | - | M | M | - | M | M |
| AC-3 | O | M | M | M | M | - | M | - | M | M | M | M | C |
| AC-4 | O | C | M | M | M | M | M | M | M | M | - | M | M |
| AC-5 | O | M | M | M | M | M | M | - | M | M | M | M | C |
| AC-6 | O | M | M | M | M | M | M | - | C | M | M | M | M |
| AC-7 | O | M | M | M | M | M | M | - | C | M | M | M | M |
| AC-8 | O | M | M | M | C | M | M | M | M | M | - | M | M |
| AC-9 | O | C | M | M | M | M | M | M | M | M | - | M | M |
| AC-10 | O | M | M | M | C | M | M | - | M | M | M | M | M |
| AC-11 | M | M | C | M | - | - | M | - | - | M | - | - | - |
| AC-12 | O | M | M | - | - | - | M | - | - | C | - | - | - |
| AC-13 | O | - | M | - | M | - | M | - | - | M | M | M | C |
| AC-14 | M | - | - | - | - | - | M | - | - | M | - | C | - |

> 各行は `O` を 1 つ以上、`C` を 1 つ以上含む。空欄なし。

## 4 条件 × AC 対応表

| 4 条件 | 紐付く AC | 主担当 Phase |
| --- | --- | --- |
| 価値性 | AC-1 / AC-4 / AC-6 / AC-12 | Phase 1 / 9 / 10 |
| 実現性 | AC-3 / AC-5 / AC-9 / AC-12 | Phase 1 / 5 / 13 |
| 整合性 | AC-2 / AC-4 / AC-7 / AC-9 / AC-12 / AC-14 | Phase 2 / 9 / 12 |
| 運用性 | AC-8 / AC-10 / AC-11 / AC-12 / AC-13 | Phase 3 / 5 / 6 / 13 |

## リスクレジスタ × AC 対応表

| Risk | 紐付く AC |
| --- | --- |
| R-1（typo context） | AC-6 / AC-9 / AC-12 |
| R-2（dev / main 片側失敗） | AC-5 / AC-8 |
| R-3（admin block） | AC-10 / AC-13 |
| R-4（contexts=[] 残留） | AC-4 / AC-6 |
| R-5（drift 放置） | AC-7 / AC-14 |
| R-6（admin token 漏洩） | AC-13（Secret hygiene 含意） |
| R-7（UT-GOV-004 不整合） | AC-1 / AC-2 / AC-9 |
| R-8（PR 自動実行） | AC-13 |

## 異常系 × AC 対応表

| Failure | 紐付く AC |
| --- | --- |
| F-1（401） | AC-13（Secret hygiene） |
| F-2（403 admin scope 不足） | AC-13 |
| F-3（429 rate limit） | AC-5 |
| F-4（422 スキーマ違反） | AC-4 |
| F-5（typo / workflow 名混入） | AC-6 / AC-9 |
| F-6（dev OK / main NG） | AC-5 / AC-8 |
| F-7（dev NG / main OK） | AC-5 / AC-8 |
| F-8（contexts 以外不正書換） | AC-4 / AC-6 |
| F-9（UT-GOV-004 不整合） | AC-1 / AC-2 / AC-9 |
| F-10（admin block） | AC-10 / AC-13 |
| F-11（drift 検出） | AC-7 / AC-14 |
| F-12（集合不一致） | AC-6 / AC-12 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | AC evidence path の重複とpath driftを確認する |
| Phase 9 | AC別 evidence をQA検証へ渡す |
| Phase 10 | GO/NO-GO の入力としてAC達成状態を渡す |
| Phase 13 | 承認ゲートのACチェックリストとして再利用する |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| AC マトリクス | outputs/phase-07/ac-matrix.md | AC 別検証方法 / AC × Phase 二次元マトリクス / 4 条件 × AC / R × AC / F × AC 対応表 |
| メタ | artifacts.json | Phase 7 状態の更新 |

## 完了条件

Acceptance Criteria for this Phase:

- [ ] AC-1〜AC-14 の 14 件すべてに「検証方法 / 成果物 / 判定基準」が埋まっている
- [ ] AC × Phase 二次元マトリクス（14 × 13 = 182 セル）に空欄がない
- [ ] 各 AC で `O`（起点）と `C`（終点）が 1 つ以上記入されている
- [ ] 4 条件 × AC 対応表が記述されている
- [ ] リスクレジスタ R-1〜R-8 × AC 対応表で各 R が 1 つ以上の AC に紐付いている
- [ ] 異常系 F-1〜F-12 × AC 対応表で各 F が 1 つ以上の AC に紐付いている
- [ ] 成果物 `outputs/phase-07/ac-matrix.md` が配置設計済み

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 全成果物が `outputs/phase-07/` 配下に配置設計済み
- AC × Phase 行列で全行に `O` と `C` が 1 つ以上ある
- 4 条件 / R / F の AC 対応表で空欄なし
- artifacts.json の `phases[6].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 8 (DRY 化)
- 引き継ぎ事項:
  - AC-1〜AC-14 の検証方法 / 成果物 / 判定基準が確定
  - AC × Phase 二次元マトリクスで起点・経由・終点が一意に決定
  - 4 条件 / R / F の AC 紐付けが完了
  - Phase 10 最終レビューと Phase 13 実 PUT 後の全件チェックリストとして転用
- ブロック条件:
  - AC × Phase で `O` または `C` が記入されていない AC がある
  - F-1〜F-12 のいずれかが AC に紐付いていない
  - R-1〜R-8 のいずれかが AC に紐付いていない
