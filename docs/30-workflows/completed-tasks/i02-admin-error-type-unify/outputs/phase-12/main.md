# Phase 12: ドキュメント・知識化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | i02-admin-error-type-unify |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented_local_evidence_captured |
| evidence_state | LOCAL_COMMAND_EVIDENCE_CAPTURED |

## 中学生レベル概念説明

管理画面で保存に失敗した時、プログラムは失敗に「名札」を付ける。ログインが必要な失敗は
`AuthRequiredError`、ログイン済みでも権限やサーバー都合で失敗した時は `FetchAuthedError`
という名札にそろえる。

以前は管理画面の保存処理だけ別の名札を使う前提が残っていた。これだと「ログインしていないなら
ログイン画面へ送る」共通処理が、管理画面の失敗を見落とす。今回の改善では、401 は
`AuthRequiredError`、それ以外の非 2xx は `FetchAuthedError` に統一した。ログイン画面へ送る URL は
既存の `toLoginRedirect` を使い、`/login?redirect=...` へそろえた。

`instanceof` は「この失敗はどの名札か」を確認する質問で、`redirect` は別の画面へ自動で連れていく動き。
`?redirect=...` はログイン後に戻る場所のメモである。

## Strict 7 Outputs

| ファイル | 状態 |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## 完了判定

- 実コードは `apps/web/src/features/admin/hooks/useAdminMutation.ts` と focused test に反映済み。
- aiworkflow-requirements の inventory / changelog / indexes / task-workflow-active / LOGS に同期済み。
- source unassigned task は consumed trace と `canonical_workflow` pointer を持つ。
- commit / push / PR は未実行で、Phase 13 user gate に残す。
