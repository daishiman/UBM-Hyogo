# Unassigned Task Detection

**Result: unassigned = 0**

| Candidate | Decision | Reason |
| --- | --- | --- |
| aiworkflow-requirements の YAML frontmatter / Anchor 埋め込みによる機械可読化 | not created (absorbed in-scope) | 本 lint は Markdown 表組みを正規表現で抽出して吸収する。SSOT 側の構造変更は別タスク化せず、本 lint の `parseSsot()` の責務として閉じる（CONST_007 / 先送りなし） |
| codecov.yml 導入 | not created (independent decision) | Codecov SaaS の課金プラン判断は本タスクとは独立。本 lint は `codecov.yml` 不在時 2-source / 出現時 3-source の動的拡張で吸収するため、Codecov 導入判断に依存しない |
| branch protection に `coverage-threshold-lint` を required check 追加 | not created | 既存 required context に新規 job を即追加する governance mutation は user-gated。CI workflow 追加自体は完了しており、required 化は PR 後の運用判断で扱う |
| `scripts/coverage-guard.sh` 自体の unit test 追加 | not created (out of scope) | issue-255 は drift 検知のみが責務。`coverage-guard.sh` のテストは別 issue で扱う |
| codecov.yml の sample / template ファイル追加 | not created | repo 方針として配置時点で SaaS 反映されてしまうため、出現は意思決定後に行う |
| `task-codecov-threshold-sync-lint-001.md` の completed-tasks 移動 | completed | `docs/30-workflows/completed-tasks/task-codecov-threshold-sync-lint-001.md` へ移動し `consumed_by_issue_255` に更新 |
| lessons-learned ファイル新規追加 | not created | 単一事例のため独立 lessons ではなく artifact inventory / task-workflow-active / skill feedback に集約 |

No new unassigned task is required for `issue-255-coverage-threshold-sync-lint`. All adjacent candidates are either absorbed in-scope, user-gated operations, or independent decisions.
