# Phase 8: unassigned-task ステータス更新 + 03a/03b spec への 1-hop 参照確認

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-195-sync-jobs-contract-schema-consolidation-001 |
| Phase 番号 | 8 / 13 |
| Phase 名称 | unassigned-task ステータス更新 + 03a/03b spec への 1-hop 参照確認 |
| Wave | 5 |
| Mode | parallel（実装仕様書） |
| 作成日 | 2026-05-04 |
| 前 Phase | 7 (contract test 補強 + database-schema.md 参照再確認) |
| 次 Phase | 9 (indexes 再生成 + drift 検証 + typecheck/lint/test 実行) |
| 状態 | created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | REQUIRED |

## 第 0 セクション: 実装区分の宣言

本 Phase は `unassigned-task` の status 更新（markdown 編集）と関連 spec への 1-hop 参照確認（grep のみ・必要時のみ追記）を行う。

## 目的

AC-6「`unassigned-task/task-issue195-...` の status が `unassigned` から `resolved` へ更新される」を満たし、03a / 03b の active spec から本タスク完了タスクへの 1-hop 参照可達性を確認する。

## 実行タスク

### A. unassigned-task ステータス更新（コミット C4）

1. `docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md` を編集
2. `## Status` セクションの `- status: unassigned` を `- status: resolved` に変更
3. 同セクション末尾に解消先リンクを追記:
   - `- resolved-by: docs/30-workflows/issue-195-sync-jobs-contract-schema-consolidation-001/`
   - `- resolved-pr: <Phase 13 で取得した PR URL>`（PR 作成後に Phase 13 内で再追記しても良い）
   - `- resolved-date: 2026-05-04`
4. 1 コミット（C4）にまとめる

### B. 03a / 03b active spec への 1-hop 参照確認（grep のみ）

1. 03a / 03b の active / completed task spec から `_design/sync-jobs-spec.md` への参照が 1-hop で到達できるか grep で確認:

```bash
rg -n "_design/sync-jobs-spec" docs/30-workflows/ | tee outputs/phase-08/grep-active-spec-refs.log
```

2. 参照が無い active spec が見つかった場合は、本 PR では追記しない（スコープ外 / CONST_007 違反回避）。代わりに `outputs/phase-08/main.md` に「未参照 spec 一覧」として記録し、Phase 12 の `unassigned-task-detection.md` に分割タスク候補として記述する。
3. 既に 1-hop で到達している場合は no-op、grep 結果のみ evidence として保存

## 変更対象ファイル

| 種別 | パス | 編集内容 |
| --- | --- | --- |
| 編集 | docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md | `status: unassigned` → `status: resolved` + 解消先リンク追記 |

## ステータス更新テンプレート

Before:
```md
## Status

- status: unassigned
- source: issue-195-03b-followup-002-sync-shared-modules-owner Phase 12
- type: implementation / docs
```

After:
```md
## Status

- status: resolved
- source: issue-195-03b-followup-002-sync-shared-modules-owner Phase 12
- type: implementation / docs
- resolved-by: docs/30-workflows/issue-195-sync-jobs-contract-schema-consolidation-001/
- resolved-date: 2026-05-04
- resolved-pr: <Phase 13 で記入>
```

## ローカル実行コマンド

```bash
# A. ステータス更新後の確認
rg -n "^- status:" docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md
rg -n "resolved-by" docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md

# B. 03a / 03b spec からの 1-hop 参照
rg -n "_design/sync-jobs-spec" docs/30-workflows/
```

## DoD

- [ ] `task-issue195-sync-jobs-contract-schema-consolidation-001.md` の `status` が `resolved` に変更されている
- [ ] `resolved-by` / `resolved-date` / `resolved-pr`（Phase 13 で確定）が追記されている
- [ ] `outputs/phase-08/grep-active-spec-refs.log` が保存されている
- [ ] 未参照 spec があれば `outputs/phase-08/main.md` に列挙されている

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 編集 | docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md | status 更新 |
| evidence | outputs/phase-08/grep-active-spec-refs.log | 03a/03b spec の 1-hop 参照状況 |
| ドキュメント | outputs/phase-08/main.md | 解消サマリ / 未参照 spec 一覧（あれば） |
| メタ | artifacts.json | Phase 8 を completed に更新（実行時） |

## 統合テスト連携

- markdown のみ。Phase 9 で indexes drift 解消、Phase 11 で grep evidence 化

## 完了条件

- [ ] AC-6 verify suite D-1 / D-2 の期待結果を満たす
- [ ] 1-hop 参照確認 evidence が保存されている

## 次 Phase

- 次: 9（indexes 再生成 + drift 検証 + typecheck/lint/test 実行）
- 引き継ぎ事項: ステータス更新完了 / 1-hop 参照状況
- ブロック条件: status の表記が verify suite と不一致

## 参照資料

- `docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md`
- `docs/30-workflows/_design/sync-jobs-spec.md`
- `docs/30-workflows/_design/sync-shared-modules-owner.md`

## 依存 Phase 参照

- Phase 1: `outputs/phase-01/main.md`
- Phase 2: `outputs/phase-02/main.md`
- Phase 5: `outputs/phase-05/main.md`
- Phase 6: `outputs/phase-06/main.md`
- Phase 7: `outputs/phase-07/main.md`
