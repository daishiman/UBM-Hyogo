# Phase 12: ドキュメント同期

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| 対象 | system spec / workflow docs / lessons |

## 目的

実装結果または仕様作成結果を aiworkflow-requirements 正本、workflow inventory、未タスク検出に同期する。

## 実行タスク

1. implementation guide を作成する。
2. system spec update summary を作成する。
3. documentation changelog を作成する。
4. unassigned task detection を作成する。
5. skill feedback report を作成する。
6. phase12 compliance check を作成する。

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase-template-phase12.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`

## 実行手順

1. `database-admin-repository-boundary.md` に反映済みか確認する。
2. `docs/00-getting-started-manual/specs/08-free-database.md` に DDL が反映済みか確認する。
3. `task-workflow-active.md` または completed inventory に必要な参照があるか確認する。
4. Issue #106 は closed のまま扱い、GitHub issue の状態変更はしない。
5. 追加未タスクがあれば `docs/30-workflows/unassigned-task/` へ formalize する。0 件でも report を出す。
6. current canonical set、artifact inventory、LOGS、topic-map、quick-reference、resource-map の same-wave 更新要否を `system-spec-update-summary.md` に N/A 根拠付きで記録する。
7. Phase 10 MINOR が残る場合は解決済み / 未タスク formalize / reject のどれかに分類する。

## 統合テスト連携

ドキュメント同期後に index generation が必要な場合のみ `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` 相当を実行する。

## 多角的チェック観点（AIが判断）

- docs-only close-out と implementation close-out を混同しない。
- Phase 1-12 完了と Phase 13 承認待ちを混同しない。
- closed Issue を reopen / close しない。

## サブタスク管理

| ID | 内容 | 完了条件 |
| --- | --- | --- |
| P12-1 | implementation guide | 中学生向け説明 + 技術者向け説明 |
| P12-2 | system spec summary | 反映/反映不要が明記 |
| P12-3 | changelog | 更新履歴が明記 |
| P12-4 | unassigned detection | 0 件でも出力 |
| P12-5 | skill feedback | 改善なしでも出力 |
| P12-6 | compliance | 7 成果物の存在確認 |

## 成果物

- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md

## same-wave sync 判定

| 対象 | 判定方法 | 記録先 |
| --- | --- | --- |
| current canonical set | `database-admin-repository-boundary.md` / `08-free-database.md` / `11-admin-management.md` の反映済み・反映不要を確認 | `system-spec-update-summary.md` |
| workflow inventory / artifact inventory | `resource-map.md` / completed inventory / workflow-local artifact inventory の登録要否を確認 | `system-spec-update-summary.md` |
| LOGS / topic-map / quick-reference / resource-map | 更新した場合は generator 実行、更新不要なら N/A 根拠を記録 | `phase12-task-spec-compliance-check.md` |
| skill feedback promotion | Promote / Defer / Reject を 1 件ずつ分類 | `skill-feedback-report.md` |

## 完了条件

- [ ] Phase 12 必須成果物が定義済み。
- [ ] aiworkflow-requirements との整合確認先が明記済み。
- [ ] Issue #106 の closed 状態を変更しない。
- [ ] `main.md` を含む 7 成果物、validator 実測値、same-wave sync 証跡が揃うまで PASS と書かない。

## タスク100%実行確認【必須】

- [ ] system spec update の要否が明記されている。

## 次Phase

Phase 13: 承認ゲート。
