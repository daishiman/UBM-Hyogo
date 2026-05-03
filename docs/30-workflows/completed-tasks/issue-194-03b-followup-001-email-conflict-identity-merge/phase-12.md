# Phase 12: ドキュメント更新 — issue-194-03b-followup-001-email-conflict-identity-merge

## 実装区分

[実装区分: 実装仕様書]

実装に整合する正本仕様書群と aiworkflow-requirements skill indexes / references を同期し、
strict 7 files outputs を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-194-03b-followup-001-email-conflict-identity-merge |
| phase | 12 / 13 |
| wave | 04c-fu |
| mode | parallel |
| 作成日 | 2026-05-02 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |
| 上流 | 03b / 04c / 02a |
| 下流 | 公開ディレクトリ重複解消運用 / 04c admin E2E |

## 目的

正本仕様、runbook、aiworkflow-requirements skill indexes を実装に同期し、
中学生レベル概念説明 + 技術メモ + edge case を strict 7 files で確定する。

## 実行タスク

1. `docs/00-getting-started-manual/specs/11-admin-management.md` に identity merge 節を追記
2. `docs/00-getting-started-manual/specs/01-api-schema.md` に admin endpoint 3 本を追記
3. `docs/00-getting-started-manual/specs/08-free-database.md` に
   `identity_merge_audit` / `identity_aliases` / `identity_conflict_dismissals` の DDL 概要を追記
4. `.claude/skills/aiworkflow-requirements/indexes/{quick-reference,resource-map}.md` に本タスクへのアンカーを追加
5. runbook（merge / unmerge / アラート閾値）を記載
6. strict 7 files を `outputs/phase-12/` 配下に作成

## 参照資料

- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `docs/00-getting-started-manual/specs/11-admin-management.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-001-email-conflict-identity-merge.md`

## 中学生レベル概念説明（implementation-guide.md 抜粋）

- **identity merge ってなに？**: 同じ生徒（人）がメールアドレスを変えてもう一回フォームを出した時、システムは「別の生徒」として登録してしまう。これを「実は同じ人だよ」と先生（admin）が手で 1 つにまとめる作業
- **第一段階の判定基準の例え**: 「名前」と「所属」が完全に同じだったら「同じ人かも」と疑うルール
- **二段階確認の例え**: 大事な書類を 2 人の先生がハンコを押すように、「候補を見る → 本当にいいか確認する」と 2 回チェックしないと merge できない
- **監査ログの例え**: 誰がいつ「これとこれを 1 つにした」と決めたかをノートに書いておくこと
- **transaction の例え**: 学校で名簿の書き換えを 7 か所同時にやる時、途中で停電したら全部元に戻すルール

## strict 7 files

- `outputs/phase-12/main.md` — Phase 12 実行結果の正本
- `outputs/phase-12/implementation-guide.md` — Part 1（中学生）/ Part 2（技術）/ Part 3（edge case） 構造
- `outputs/phase-12/system-spec-update-summary.md` — specs/ 配下への追記反映
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## runbook 追記内容（要点）

- merge 実行は admin 二段階確認後に単一 D1 transaction で実行
- merge 失敗時は D1 自動 rollback、再実行可能
- 誤 merge 取消は `identity_merge_audit` から逆操作 SQL を組み立て手動実行
- `EMAIL_CONFLICT` 月次件数閾値（既定 5 件）超過時は判定基準拡張を再評価（03b-followup-006 と連携）

## aiworkflow-requirements skill 更新点

- `indexes/quick-reference.md`: `identity-merge` キーワード追加（responseEmail マスク / merge transaction の指針）
- `indexes/resource-map.md`: 本ワークフロー path への参照を追加
- `references/`: 必要時のみ skill-feedback-report.md で報告

## サブタスク管理

- [ ] specs/11-admin-management.md / 01-api-schema.md / 08-free-database.md 追記反映
- [ ] aiworkflow-requirements indexes 更新
- [ ] strict 7 files 作成
- [ ] documentation-changelog.md に変更点記録

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 完了条件

- strict 7 files が全て揃っている
- 11-admin-management.md / 01-api-schema.md / 08-free-database.md への追記が反映されている
- runbook に merge 失敗時のリカバリ手順が記載されている
- aiworkflow-requirements indexes に本タスクへのアンカーがある

## タスク100%実行確認

- [ ] strict 7 files が全て揃っている
- [ ] spec 更新は正本（specs/）に限定し、prototype は触らない
- [ ] commit / push / PR を実行していない

## 次 Phase への引き渡し

Phase 13 へ、strict 7 files / spec 更新 / approval gate を渡す。
