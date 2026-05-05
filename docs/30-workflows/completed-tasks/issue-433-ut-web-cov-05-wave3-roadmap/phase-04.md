# Phase 4: wave-2 inventory 抽出

## 目的

wave-2 5 タスクの `skill-feedback-report.md` および `outputs/phase-12/implementation-guide.md` から、本 roadmap で集約すべき backlog（NON_VISUAL coverage backlog / integration 委譲箇所 / dead code 候補 / 残 gap 言及）を抽出し、`wave2-backlog-inventory.md` に集約する。

## 抽出対象

| wave-2 タスク | パス |
| --- | --- |
| ut-web-cov-01 | docs/30-workflows/completed-tasks/ut-web-cov-01-admin-components-coverage/ |
| ut-web-cov-02 | docs/30-workflows/completed-tasks/ut-web-cov-02-public-components-coverage/ |
| ut-web-cov-03 | docs/30-workflows/completed-tasks/ut-web-cov-03-auth-fetch-lib-coverage/ |
| ut-web-cov-04 | docs/30-workflows/completed-tasks/ut-web-cov-04-admin-lib-ui-primitives-coverage/ |
| ut-08a-01 | docs/30-workflows/completed-tasks/ut-08a-01-public-use-case-coverage-hardening/ |

各タスクから:

- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/unassigned-task-detection.md`

を読み、以下のラベルでエントリを抽出する:

- `BACKLOG_INTEGRATION`: integration / e2e に委譲済み（要 wave-3 着手）
- `BACKLOG_GAP`: 残 gap として明記（layer / file 名）
- `BACKLOG_DEAD_CODE`: dead code / obsolete 候補
- `BACKLOG_TOOLING`: テスト基盤・mock 改善要望

## inventory スキーマ

```
| source-task | source-file | label | layer | file/area | description | proposed-target |
```

## 変更対象ファイル一覧（CONST_005）

なし（読取のみ。outputs に保存）

## 入力 / 出力 / 副作用

- 入力: 上記 wave-2 5 タスクの phase-12 配下 markdown
- 出力: `outputs/phase-04/main.md`、`wave2-backlog-inventory.md`
- 副作用: なし

## テスト方針

- 5 タスク × 3 ファイルの計 15 ファイルを全件参照したことを `outputs/phase-04/main.md` の参照済みリストで担保
- 抽出件数 0 のタスクは「0 件」と明示（Phase 12 の慣習に揃える）

## ローカル実行・検証コマンド

```bash
for d in \
  docs/30-workflows/completed-tasks/ut-web-cov-01-admin-components-coverage \
  docs/30-workflows/completed-tasks/ut-web-cov-02-public-components-coverage \
  docs/30-workflows/completed-tasks/ut-web-cov-03-auth-fetch-lib-coverage \
  docs/30-workflows/completed-tasks/ut-web-cov-04-admin-lib-ui-primitives-coverage \
  docs/30-workflows/completed-tasks/ut-08a-01-public-use-case-coverage-hardening; do
  for f in skill-feedback-report.md implementation-guide.md unassigned-task-detection.md; do
    test -f "$d/outputs/phase-12/$f" && echo "OK: $d/outputs/phase-12/$f" || echo "MISSING: $d/outputs/phase-12/$f"
  done
done
```

## 完了条件 / DoD

- [ ] 5 タスク × 3 ファイル参照済みチェック PASS（MISSING は別途記録）
- [ ] inventory に各エントリの source-task / source-file / label / layer / file/area / description / proposed-target が埋まる
- [ ] label 4 種の enum 値が phase-02 glossary と一致

## 出力

- outputs/phase-04/main.md
- outputs/phase-04/wave2-backlog-inventory.md

## 参照資料

- docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-02/glossary.md
- 各 wave-2 タスクディレクトリ

## メタ情報

- Phase: 4
- taskType: implementation
- visualEvidence: NON_VISUAL

## 実行タスク

- wave-2 current canonical roots から backlog input を抽出する。

## 成果物/実行手順

- `outputs/phase-04/main.md` と `wave2-backlog-inventory.md` を作成する。

## 統合テスト連携

- NON_VISUAL。参照対象 15 ファイルの存在確認を行う。
