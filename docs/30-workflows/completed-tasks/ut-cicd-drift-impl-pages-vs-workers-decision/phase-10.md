# Phase 10: 最終レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Pages vs Workers deploy target decision (UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビューゲート |
| 作成日 | 2026-05-01 |
| 前 Phase | 9（品質保証） |
| 次 Phase | 11（手動検証 - NON_VISUAL 縮約） |
| 状態 | spec_created |
| タスク分類 | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

Phase 7 AC マトリクスと Phase 9 品質保証結果を統合的に評価し、AC-1〜AC-7 + 不変条件 #5 監査の最終 PASS / MINOR / MAJOR 判定を確定する。MAJOR は該当 Phase へ差し戻し、MINOR は Phase 12 `unassigned-task-detection.md` へ格下げ未タスク化、PASS は Phase 11 進行可と判定する。Phase 10 出力は Go/No-Go 判定 + 残課題（unassigned-task 候補）+ ブロッカー一覧を含む。

## ゲート判定基準

| 判定 | 条件 | アクション |
| --- | --- | --- |
| **GO (PASS)** | AC マトリクス 8 行すべて PASS + Phase 9 12 項目 PASS + 不変条件 #5 抵触ゼロ | Phase 11 へ進行 |
| **GO (MINOR 許容)** | MAJOR ゼロ かつ MINOR が 3 件以下 + 各 MINOR が Phase 12 で吸収可能 | Phase 11 へ進行 + MINOR を Phase 12 unassigned-task-detection.md へ格下げ |
| **NO-GO (MAJOR)** | MAJOR 1 件以上、または不変条件 #5 抵触、または Phase 12 canonical 7 ファイル欠落 | 該当 Phase へ差し戻し（Phase 2-9 の該当箇所） |

> **重要**: Phase 10 MINOR 指摘は **必ず未タスク化対象**。「機能に影響なし」は不要判定の理由にならない（task-specification-creator skill 漏れパターン対策）。

## レビュー手順

### Step 1: AC マトリクス転記（Phase 7 → Phase 10）

`outputs/phase-07/ac-matrix.md` の 8 行（AC-1〜AC-7 + 不変条件 #5）を `outputs/phase-10/go-no-go.md` に転記し、各行に Phase 9 結果を加味した最終判定（PASS/MINOR/MAJOR）を付与する。

### Step 2: Phase 9 品質チェック 12 項目転記

`outputs/phase-09/quality-gate-checklist.md` の結果を取り込み、AC マトリクスとの矛盾を確認する。

### Step 3: 不変条件監査独立確認

不変条件 #5 抵触ゼロを **二重確認**：
- AC-4 行（Phase 7 マトリクス内）
- AC マトリクス独立行（不変条件 #5 監査）
- Phase 9 項目 7（独立ガード）

3 箇所いずれかが FAIL なら NO-GO。

### Step 4: 関連タスク責務分離の最終確認

- `task-impl-opennext-workers-migration-001` / `UT-GOV-006-web-deploy-target-canonical-sync` との重複起票が再発していないか（Phase 9 検証コマンド #5 結果）。
- ADR Related セクションの責務分離表が起票時の意図と一致しているか。

### Step 5: Go/No-Go 確定

Step 1-4 を統合し、以下のいずれかを `outputs/phase-10/go-no-go.md` 末尾に明記：

```
判定: GO (PASS) | GO (MINOR n件許容) | NO-GO (差戻先: Phase X)
判定者: （仕様書上は記載のみ。実 Phase 10 実行時に記入）
日付: （実行日）
MINOR 件数: n（うち Phase 12 unassigned-task-detection 格下げ: m）
MAJOR 件数: 0（ブロッカー詳細: なし | あり: ...）
```

### Step 6: ブロッカー / unassigned-task 候補の振り分け

`outputs/phase-10/review-findings.md` に以下を分離記録：

| 区分 | 内容 | 行先 |
| --- | --- | --- |
| MAJOR ブロッカー | 不変条件違反、Phase 12 canonical 7 ファイル欠落等 | 該当 Phase 戻し |
| MINOR 指摘 | 整形不良、軽微な記述漏れ | Phase 12 unassigned-task-detection.md（格下げ） |
| 残課題（既知制限） | base case が cutover の場合: 実 cutover 別タスク 3 件 | Phase 12 unassigned-task-detection.md（current 候補） |
| baseline 候補 | base case が保留の場合: 将来再検討タスク | Phase 12 unassigned-task-detection.md（baseline 候補） |

> **current vs baseline 分離**: Phase 12 で出力する `unassigned-task-detection.md` は current（即時起票推奨）と baseline（将来再評価）を別セクションで管理する。

## 完了条件チェックリスト

- [ ] AC マトリクス 8 行の最終判定が記述
- [ ] Phase 9 12 項目結果との突合済
- [ ] 不変条件 #5 が 3 箇所で重複確認
- [ ] 関連タスク責務分離が再確認済
- [ ] Go/No-Go 判定が明示（GO PASS / GO MINOR 許容 / NO-GO のいずれか）
- [ ] MINOR 件数 / MAJOR 件数が数値で明示
- [ ] MAJOR ブロッカー / MINOR 格下げ / 残課題 / baseline 候補が分離記録
- [ ] cutover 採択時: 実 cutover 別タスク 3 件が unassigned current 候補として識別
- [ ] 保留採択時: 将来再検討タスクが baseline 候補として識別

## 実行タスク

1. `outputs/phase-10/go-no-go.md` に Step 1-5 結果を記述。
2. `outputs/phase-10/review-findings.md` に Step 6 区分別記録を記述。
3. MINOR 指摘を必ず Phase 12 へ格下げする旨を冒頭で宣言（task-specification-creator 漏れパターン対策）。
4. base case 別の残課題リスト（cutover / 保留 / 段階移行）を末尾に補足。

## 多角的チェック観点

- **MINOR 軽視禁止**: 「機能に影響なし」では unassigned 化を省略しない。Phase 12 へ全件格下げする。
- **不変条件 #5 の三重確認**: AC マトリクス内 AC-4 / 独立行 / Phase 9 ガードの 3 箇所すべて PASS を確認。1 箇所でも FAIL なら NO-GO。
- **GO MINOR の上限**: MINOR が 4 件以上の場合は Phase 8（DRY 化）戻しを検討（記述品質低下シグナル）。
- **base case 不確定での判定禁止**: Phase 3 で base case が確定していない場合は Phase 10 を実施せず Phase 3 戻し。
- **Phase 12 canonical 7 ファイルの予約確認**: Phase 12 着手前に `main.md` + 6 補助成果物のファイル名 / 配置先 / 責務が確定しているか確認（Phase 12 で false-complete を避ける）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | AC マトリクス転記と最終判定付与 | 10 | pending |
| 2 | Phase 9 品質チェック転記 | 10 | pending |
| 3 | 不変条件 #5 三重確認 | 10 | pending |
| 4 | 関連タスク責務分離再確認 | 10 | pending |
| 5 | Go/No-Go 確定記述 | 10 | pending |
| 6 | ブロッカー / unassigned 候補 / baseline 候補 振り分け | 10 | pending |
| 7 | base case 別残課題リスト | 10 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/go-no-go.md | Go/No-Go 判定 + AC マトリクス最終判定 + 数値要約 |
| ドキュメント | outputs/phase-10/review-findings.md | MAJOR / MINOR / 残課題 / baseline 区分別記録 |
| メタ | artifacts.json | Phase 10 状態の更新 |

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created` へ遷移
- AC マトリクス 8 行最終判定済
- 不変条件 #5 三重確認済
- Go/No-Go 判定明示
- MINOR 件数 / MAJOR 件数明示
- artifacts.json の `phases[9].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 11（手動検証 - NON_VISUAL 縮約）
- 引き継ぎ事項:
  - Go/No-Go 判定結果
  - MINOR 格下げリスト（Phase 12 unassigned-task-detection.md 入力）
  - 残課題 / baseline 候補（Phase 12 unassigned-task-detection.md 入力）
- ブロック条件:
  - MAJOR 1 件以上検出
  - 不変条件 #5 抵触
  - base case 不確定
  - Phase 12 canonical 7 ファイルの予約未完了

## 参照資料

- `outputs/phase-10/go-no-go.md`
- `outputs/phase-10/review-findings.md`
- `outputs/phase-12/unassigned-task-detection.md`

## 統合テスト連携

レビュー指摘は文書修正または未タスク吸収で処理する。実 deploy 統合テストは実装タスクで扱う。
