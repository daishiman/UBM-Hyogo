# branch docs deletion review - タスク仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| タスクID | task-branch-docs-deletion-review-001 |
| GitHub Issue | #356 |
| タスク名 | ブランチ内 workflow 大量削除の意図分類レビュー |
| 分類 | docs / governance |
| 対象機能 | docs/30-workflows task inventory |
| 優先度 | 高 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | feat/issue-287 Phase 12 close-out 2回確認 |
| 発見日 | 2026-05-01 |

---

## 1. なぜこのタスクが必要か（Why）

`feat/issue-287-ut-cicd-drift-impl-pages-vs-workers-decision-task-spec` の確認中、ADR / workflow 作成とは直接関係しない既存 workflow ディレクトリの大量削除が `git status` に残っていることを検出した。対象は少なくとも `08a-parallel-api-contract-repository-and-authorization-tests`、`08b-parallel-playwright-e2e-and-ui-acceptance-smoke`、`u-ut01-08-sync-enum-canonicalization`、`ut-04-d1-schema-design` である。

この状態のまま PR 化すると、意図した completed-tasks 移動、過去作業の整理、または事故削除の区別がレビュー時に困難になる。

## 2. 何を達成するか（What）

大量削除として見えている workflow 群を、以下の3分類に整理し、必要な復元・移動・索引更新を判断できる状態にする。

| 分類 | 意味 | 必要アクション |
| --- | --- | --- |
| intended-move | completed-tasks 等へ移動済み | 移動先の実体と索引を確認 |
| intended-delete | 重複・legacy として削除意図あり | 削除根拠を workflow / LOGS に記録 |
| accidental-delete | 本ブランチの目的外削除 | ユーザー承認後に復元 |

## 3. スコープ

### 含む

- `git status --short` の削除一覧を対象 workflow 単位に集約
- 各 workflow の Phase 12 完了ファイル有無を確認
- `docs/30-workflows/completed-tasks/` または別階層への移動実体を確認
- `aiworkflow-requirements` indexes / task-workflow references の参照パス drift を確認
- 復元が必要な場合の対象ファイル一覧を作成

### 含まない

- ユーザー承認なしの `git checkout` / `git restore` による復元
- コミット / PR 作成
- unrelated docs の大規模再編

## 4. 受入条件

- [ ] 削除として表示される workflow がタスク単位で一覧化されている
- [ ] 各 workflow が `intended-move` / `intended-delete` / `accidental-delete` に分類されている
- [ ] `accidental-delete` がある場合、復元対象ファイルと復元コマンド案が提示されている
- [ ] `intended-move` がある場合、移動先の `index.md` と Phase 12 canonical 7 ファイルが存在する
- [ ] 参照パス drift がある場合、修正対象の docs / indexes が列挙されている

## 5. 苦戦箇所・再発防止メモ

- `git status` の大量 `D` は、完了タスク移動と事故削除の見た目が同じになりやすい。移動先の実体確認なしに完了移動扱いしない。
- Phase 12 close-out 中は対象 workflow 以外の古い整理差分が混ざることがあるため、未タスク検出では「今回タスクの残作業」と「PR merge 安全性 gate」を分けて扱う。
- 一括復元コマンドは破壊的に見えるため、対象分類とユーザー承認を得るまでは実行しない。

## 6. 参照情報

- `git status --short`
- `docs/30-workflows/completed-tasks/`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
