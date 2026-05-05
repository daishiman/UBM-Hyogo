# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-followup-003-audit-log-browsing-ui |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-05-01 |
| 前 Phase | 11 (手動 smoke / visual evidence) |
| 次 Phase | 13 (PR 作成準備) |
| 状態 | spec_created |

## 目的

実装結果を aiworkflow-requirements と workflow artifacts に同期し、未タスクと lessons を残す。

## 実装ガイド Part 1 / Part 2 要件

Part 1 は、監査ログ閲覧を「変更履歴ノートを見る画面」として中学生にも分かる言葉で説明する。Part 2 は API schema、query、response、masking、timezone、test command、edge case を技術者向けに記録する。

## 実行タスク

1. `outputs/phase-12/main.md`
2. `outputs/phase-12/implementation-guide.md`
3. `outputs/phase-12/system-spec-update-summary.md`
4. `outputs/phase-12/documentation-changelog.md`
5. `outputs/phase-12/unassigned-task-detection.md`
6. `outputs/phase-12/skill-feedback-report.md`
7. `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 11 | outputs/phase-11/ | visual evidence |
| 正本 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | API 更新候補 |
| 正本 | .claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md | admin UI 更新候補 |
| 正本 | docs/00-getting-started-manual/specs/11-admin-management.md | manual spec 更新候補 |
| 索引 | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | workflow inventory / current canonical set 登録判定 |
| 索引 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | `/admin/audit` 即時導線登録判定 |
| 正本 | .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | active workflow 状態同期判定 |
| 正本 | .claude/skills/aiworkflow-requirements/references/lessons-learned.md | lessons hub 登録判定 |

## 実行手順

### ステップ 1: system spec update 判定

`GET /admin/audit`、`/admin/audit` UI、PII mask、JST/UTC 変換、read-only invariant を反映する必要がある。実装結果が正本と異なる場合は Step 2 として該当 references / manual specs を更新する。あわせて `resource-map.md`、`quick-reference.md`、`task-workflow-active.md`、lessons hub、workflow artifact inventory の更新要否を判定し、N/A の場合も理由を `system-spec-update-summary.md` に残す。

### ステップ 2: 未タスク検出

CSV export、SIEM 連携、advanced search、audit_log index 追加、long retention policy は必要なら未タスク化する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | change-summary / PR body |

## 多角的チェック観点（AIが判断）

- Phase 12 の 7 ファイルは固定名で作る
- `spec_created` root は実装完了時だけ completed に変える
- closed Issue には `Refs #314` を使う

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | implementation-guide | pending | Part 1/2 |
| 2 | system spec update | pending | Step 1/2 |
| 3 | unassigned detection | pending | 0 件でも出力 |
| 4 | skill feedback | pending | 改善なしでも出力 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | サマリ |
| ドキュメント | outputs/phase-12/implementation-guide.md | 実装ガイド |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | 仕様更新 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 変更履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未タスク |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | skill feedback |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | compliance |

## 完了条件

- [ ] Phase 12 固定 7 成果物がある
- [ ] system spec update の Step 1/2 判定がある
- [ ] 未タスク 0 件でもレポートがある

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 固定 7 成果物が配置済み
- [ ] artifacts.json の Phase 12 を completed に更新

## 次Phase

次: 13 (PR 作成準備)。
