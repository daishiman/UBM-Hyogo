# Phase 12: ドキュメント更新 — ut-api-cov-precondition-01-test-failure-recovery

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-api-cov-precondition-01-test-failure-recovery |
| phase | 12 / 13 |
| wave | ut-coverage |
| mode | serial |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

ドキュメント更新、未タスク検出、skill feedback、compliance check を作成する（必須 7 ファイル）。

## 実行タスク

1. implementation-guide.md（Part 1 中学生レベル + Part 2 技術者レベル）を作成する。
2. system-spec-update-summary.md を作成する。
3. documentation-changelog.md を更新する。
4. unassigned-task-detection.md を作成する（0 件でも必須）。
5. skill-feedback-report.md を作成する（改善点なしでも必須）。
6. phase12-task-spec-compliance-check.md を作成する。

## strict 7 files rule

Phase 12 の成果物は以下 7 ファイルに限定する。追加ファイルを作成する場合は別 Phase または別タスクとして扱う。

1. outputs/phase-12/main.md
2. outputs/phase-12/implementation-guide.md
3. outputs/phase-12/system-spec-update-summary.md
4. outputs/phase-12/documentation-changelog.md
5. outputs/phase-12/unassigned-task-detection.md
6. outputs/phase-12/skill-feedback-report.md
7. outputs/phase-12/phase12-task-spec-compliance-check.md

## 参照資料

- 起票根拠: 2026-05-01 実測ログ（Test Files 10 failed | 75 passed (85), Tests 13 failed | 510 passed (523)）
- docs/00-getting-started-manual/specs/02-auth.md
- docs/00-getting-started-manual/specs/03-data-fetching.md

## 実行手順

- 対象 directory: docs/30-workflows/ut-api-cov-precondition-01-test-failure-recovery/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: depends_on を参照
- 下流: blocks を参照

## 多角的チェック観点

- #1 responseEmail system field
- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden
- 未実装/未実測を PASS と扱わない。
- placeholder と実測 evidence を分離する。

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] outputs/phase-12/main.md を作成する

## 成果物

- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md

## 依存成果物参照

- Phase 2: `outputs/phase-02/main.md`
- Phase 6: `outputs/phase-06/main.md`
- Phase 7: `outputs/phase-07/main.md`
- Phase 8: `outputs/phase-08/main.md`
- Phase 9: `outputs/phase-09/main.md`
- Phase 10: `outputs/phase-10/main.md`

- [ ] Phase 12 strict 7 files が `outputs/phase-12/` に実体として存在する
- [ ] `outputs/phase-12/phase12-task-spec-compliance-check.md` が 4条件（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）を検証している
- [ ] aiworkflow-requirements への same-wave sync 結果または同期不要理由が `outputs/phase-12/system-spec-update-summary.md` に記録されている
- [ ] 実装、deploy、commit、push、PR を実行していない
タスク100%実行確認

## 完了条件

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 13 へ、AC、blocker、evidence path、approval gate を渡す。
