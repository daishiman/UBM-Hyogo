# Phase 12: ドキュメント更新（必須 6 ドキュメント）

## サマリ

implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check の **必須 6 ドキュメント**を生成し、Phase 13（PR 作成）への引き渡しを完了する。primary spec rewrite は実ファイルへ反映済みのため workflow_state は `implemented-local` とする。

## 生成ファイル一覧

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `implementation-guide.md` | 後続 task-07/08/09/10/11..17 への引き渡しガイド + grep 起点 |
| 2 | `system-spec-update-summary.md` | primary M:1 件（09-ui-ux.md）+ same-wave skill/index sync |
| 3 | `documentation-changelog.md` | 旧 §3〜§7 削除 / 新 §1〜§10 構築 / 09a / 09b link 追加 |
| 4 | `unassigned-task-detection.md` | 未割当検出 0 件 |
| 5 | `skill-feedback-report.md` | task-specification-creator / aiworkflow-requirements への feedback |
| 6 | `phase12-task-spec-compliance-check.md` | 13 phase 全準拠表 |

加えて本 `main.md` を集約として配置（合計 7 ファイル）。

## 必須 6 ドキュメントの相互参照

```
implementation-guide.md
  ├── system-spec-update-summary.md（変更スコープの確認）
  ├── documentation-changelog.md（章立て差分）
  └── grep 起点（後続 task の参照点）

unassigned-task-detection.md
  └── 09a..09h の path 確定 / 中身は task-07/08/19/20/21/22

skill-feedback-report.md
  ├── task-specification-creator skill: NON_VISUAL evidence テンプレ提案
  └── aiworkflow-requirements skill: 09-ui-ux contract grep trigger 提案

phase12-task-spec-compliance-check.md
  └── 13 phase × phase-template 準拠表
```

## 完了条件

| 条件 | 状態 |
| --- | :---: |
| 必須 6 ドキュメントすべて生成 | OK |
| implementation-guide.md が後続 task-07/08/09/10/11..17 ごとの参照点を明記 | OK |
| system-spec-update-summary が primary M=1 と same-wave skill/index sync を記録 | OK |
| aiworkflow-requirements skill との整合監査結果が記録 | OK |
| compliance check で 13 phase が phase-template 準拠 | OK |
| workflow_state = `implemented-local` | OK |

## サブタスク完了状態

| # | サブタスク | 状態 |
| --- | --- | :---: |
| 1 | implementation-guide.md | completed |
| 2 | system-spec-update-summary.md | completed |
| 3 | documentation-changelog.md | completed |
| 4 | unassigned-task-detection.md | completed |
| 5 | skill-feedback-report.md | completed |
| 6 | phase12-task-spec-compliance-check.md | completed |
| 7 | outputs/phase-12/main.md 集約 | completed |

## 次 Phase

Phase 13（PR 作成 / approval gate）へ。changelog → PR description / implementation-guide → 後続 task GO 条件を引き継ぐ。
