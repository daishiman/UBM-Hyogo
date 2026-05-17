# Phase 12: 正本同期（7 必須成果物）

## 目的

Phase 1-11 の成果を正本ドキュメント体系（specs / skill references / changelog）に同期し、Phase 12 strict compliance に従って 7 種の必須成果物をすべて生成する。本タスクは docs-only のため、`main.md` 冒頭でその旨を明示する。

## 入力

- Phase 1-11 の全成果物
- `.claude/skills/task-specification-creator/references/phase-12-canonical-headings.md`（存在すれば）
- 既存タスクの Phase 12 成果物群（`docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/outputs/phase-12/`）

## 作業手順

1. `outputs/phase-12/` 配下に以下 7 ファイルを作成する（テンプレートは Phase 1-11 の結果を集約）:
   - `main.md` — 冒頭に「実装区分: ドキュメントのみ」を明示
   - `implementation-guide.md` — Phase 13 の PR 作成手順 / diff-to-pr 連携情報
   - `system-spec-update-summary.md` — `08-free-database.md` への追記内容サマリ
   - `documentation-changelog.md` — ADR 0002 / spec / skill の更新 changelog fragment
   - `unassigned-task-detection.md` — 本タスクで新たに検出された unassigned task（無ければ「None」と明記）
   - `skill-feedback-report.md` — aiworkflow-requirements skill への feedback（schema drift を早期に ADR 化する運用の提案等）
   - `phase12-task-spec-compliance-check.md` — Phase 12 strict 4 条件 / 30 種 compact evidence check
2. 各ファイルは canonical heading（`## Phase 12 ...` 等）を踏襲する。詳細は Phase 12 実行時に skill `task-specification-creator` の references を参照する。
3. `phase12-task-spec-compliance-check.md` で 4 条件（all-files-present / non-empty / canonical-heading-match / cross-references-valid）と 30 種 compact evidence をチェックリスト化する。
4. docs-only タスクのため、`implementation-guide.md` には「コード変更なし、grep verification のみ」を明記し、関数シグネチャ / 実行コマンド欄は grep コマンドで置き換える。
5. 既存 ADR / spec / skill への back-link が双方向に貼られていることを確認する。

## 出力成果物（必須 7 種）

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 検証コマンド

```bash
# 7 ファイルが存在
for f in main implementation-guide system-spec-update-summary documentation-changelog \
         unassigned-task-detection skill-feedback-report phase12-task-spec-compliance-check; do
  ls docs/30-workflows/issue-296-ut-07a-04-assigned-via-queue-id-decision/outputs/phase-12/${f}.md
done

# main.md に docs-only 明示
rg -n "実装区分: ドキュメントのみ|docs-only" \
  docs/30-workflows/issue-296-ut-07a-04-assigned-via-queue-id-decision/outputs/phase-12/main.md

# canonical heading
rg -n "^## " docs/30-workflows/issue-296-ut-07a-04-assigned-via-queue-id-decision/outputs/phase-12/main.md
```

## DoD

- [ ] 7 必須ファイルすべてが存在する
- [ ] main.md 冒頭で docs-only であることを明示した
- [ ] implementation-guide.md の関数シグネチャ / 実行コマンド欄を grep コマンドで置き換えた
- [ ] system-spec-update-summary.md に spec 追記内容をまとめた
- [ ] documentation-changelog.md に ADR 0002 / spec / skill 更新を記録した
- [ ] unassigned-task-detection.md を作成した（None なら None と明記）
- [ ] skill-feedback-report.md を作成した
- [ ] phase12-task-spec-compliance-check.md で 4 条件チェックを通過した
