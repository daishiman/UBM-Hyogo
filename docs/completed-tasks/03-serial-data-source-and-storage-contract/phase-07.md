# Phase 7: 検証項目網羅性

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | data-source-and-storage-contract |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 検証項目網羅性 |
| 作成日 | 2026-04-23 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (設定 DRY 化) |
| 状態 | completed |
| implementation_mode | new |
| task_kind | NON_VISUAL（インフラ・data contract） |

## 目的

AC-1〜AC-5 が Phase 1〜6 のどこで定義・検証され、どの成果物に証跡があるかを trace matrix で完全可視化する。カバレッジ対象は本タスクで変更/作成した成果物に限定（[Feedback BEFORE-QUIT-002]）し、mapping rule / sync direction / backup runbook の 3 軸を網羅する。

## 実行タスク

- AC-1〜AC-5 × Phase × 成果物 の trace matrix 作成
- 3 軸カバレッジ（mapping rule / sync direction / backup runbook）の網羅確認
- 未カバー項目の Phase 12 / unassigned への追跡登録
- カバレッジ対象を変更箇所限定に保つ確認
- coverage-matrix.md の出力

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC-1〜AC-5 の要件根拠 |
| 必須 | outputs/phase-02/data-contract.md | mapping rule / sync direction の証跡 |
| 必須 | outputs/phase-02/sync-flow.md | sync direction / recovery |
| 必須 | outputs/phase-03/main.md | gate 判定 / AC トレース |
| 必須 | outputs/phase-04/test-plan.md | 検証観点 |
| 必須 | outputs/phase-05/d1-bootstrap-runbook.md | backup runbook 軸 |
| 必須 | outputs/phase-06/failure-cases.md | 異常系カバレッジ |

## 実行手順

### ステップ 1: AC trace matrix 作成
- AC-1〜AC-5 ごとに「定義 Phase」「検証 Phase」「証跡パス」「検証方法（CLI/SQL/レビュー）」を 1 行化
- 検証方法は NON_VISUAL なので CLI/curl/SQL/レビュー に限定（UI smoke は対象外）

### ステップ 2: 3 軸カバレッジ確認
- mapping rule: data-contract.md / Phase 4 mapping fixture / Phase 6 mapping 不整合
- sync direction: sync-flow.md / Phase 5 wrangler.toml / Phase 6 backfill
- backup runbook: Phase 5 d1-bootstrap-runbook.md / Phase 6 復旧手順 / Phase 11 smoke

### ステップ 3: 変更箇所限定の確認
- 本タスクで作成/修正したファイルのみ coverage 対象
- 既存 specs/ や他タスクの outputs/ は参照対象であって coverage 対象ではない

### ステップ 4: 未カバーの追跡登録
- 実環境観測前提のもの（例: prod の writes/day 実測）は Phase 11 / unassigned に
- spec wording 揺れは Phase 8 / 12 へ

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | wording / DRY 化対象 MINOR の入力 |
| Phase 10 | 最終 gate 判定の主要根拠 |
| Phase 11 | smoke で実観測すべき AC 残項目 |
| Phase 12 | unassigned 残課題の close-out |

## 多角的チェック観点（AIが判断）

- 価値性: AC が「誰がどこで PASS と判定したか」即特定できるか
- 実現性: NON_VISUAL なので CLI/SQL ベースで全 AC が検証可能か
- 整合性: 不変条件 7 項目を AC trace と独立に再確認しないか（重複定義の排除）
- 運用性: matrix が 1 表で読み切れるサイズに保たれているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC × Phase trace 作成 | 7 | completed | 5 行 |
| 2 | 3 軸カバレッジ確認 | 7 | completed | mapping/direction/backup |
| 3 | 変更箇所限定の確認 | 7 | completed | 対象ファイル列挙 |
| 4 | 未カバー追跡登録 | 7 | completed | Phase 11/12/unassigned |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/coverage-matrix.md | AC trace / 3 軸カバレッジ |
| ドキュメント | outputs/phase-07/main.md | サマリ・残課題 handoff |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] AC-1〜AC-5 すべてに証跡パスが付与されている
- [ ] 3 軸（mapping / direction / backup）すべて 2 つ以上の Phase で検証
- [ ] 未カバー項目に追跡先 Phase（11/12/unassigned）が割り当て済み
- [ ] coverage 対象が本タスクの変更/作成ファイルに限定されている

## タスク100%実行確認【必須】

- [x] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] 異常系カバレッジ（Phase 6 failure-cases）が matrix に取り込まれている
- [ ] 次 Phase への引き継ぎ事項を記述
- [x] artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 8 (設定 DRY 化)
- 引き継ぎ事項: MINOR / wording 揺れリストを Phase 8 入力に
- ブロック条件: 未カバー AC が PASS なしで残るなら Phase 10 へ進めない

## AC × 検証項目マトリクス

| AC | 内容 | 定義 Phase | 検証 Phase | 証跡パス | 検証方法 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | Sheets/D1 source-of-truth 一意 | 1 | 2, 3, 6 | data-contract.md / sync-flow.md / failure-cases.md | レビュー + SQL（書込経路一意） |
| AC-2 | manual/scheduled/backfill 分離 | 1 | 2, 5, 6 | sync-flow.md / sync-deployment-runbook.md / failure-cases.md A6 | wrangler triggers 確認 + curl |
| AC-3 | backup/restore/staging runbook 化 | 1 | 5, 6, 11 | d1-bootstrap-runbook.md / failure-cases.md A4 | runbook 実行リハーサル |
| AC-4 | 復旧基準=Sheets 真 / D1 再構築 | 1 | 2, 6 | sync-flow.md recovery 章 / failure-cases.md A4-A6 | レビュー + 再 backfill SQL |
| AC-5 | 純 Sheets 案非採用根拠 | 1 | 3 | phase-01/main.md / phase-03/main.md 代替案 | レビュー（無料枠 reads 試算） |

## 3 軸カバレッジ表

| 軸 | Phase 2 | Phase 4 | Phase 5 | Phase 6 | Phase 11 |
| --- | --- | --- | --- | --- | --- |
| mapping rule | data-contract.md | test-plan.md fixture | mapping.ts 配置 | A5 mapping 不整合 | smoke 抜粋 |
| sync direction | sync-flow.md | verification-commands | wrangler.toml | A6 backfill | smoke |
| backup runbook | sync-flow recovery | （対象外） | d1-bootstrap-runbook | A4 復旧 | prod 適用 |

## 未カバー AC とフォロー方針

- prod 実環境での writes/day 実測 → Phase 11 smoke / 05a observability に委譲
- 長期 drift（schema 列追加）→ Phase 12 spec sync で継続観測（A7）
- Phase 7 でカバーできない実観測項目は unassigned 化し、本タスクのスコープ外と明記

## カバレッジ対象範囲（変更箇所限定）

- 対象: doc/03-serial-data-source-and-storage-contract/ 配下、apps/api/src/sync/、apps/api/migrations/、apps/api/wrangler.toml
- 対象外: doc/00-getting-started-manual/specs/（参照のみ）、他タスク outputs/
