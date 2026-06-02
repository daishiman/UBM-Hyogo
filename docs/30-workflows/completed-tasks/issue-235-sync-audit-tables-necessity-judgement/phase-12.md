# Phase 12: ドキュメント更新（close-out）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| 種別 | docs-only / NON_VISUAL（設計判定） |
| 前 Phase | 11（再現コマンド手動検証） |
| 次 Phase | 13（PR作成） |
| 主成果物 | outputs/phase-12/main.md + 必須 6 成果物 |

## 目的

判定タスクの close-out ドキュメントを完成させる。必須 6 成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）を `outputs/phase-12/` に揃え、same-wave sync ルールに従う。

## 必須成果物（Phase 12 固定）

| canonical 名 | Task | 用途 |
| --- | --- | --- |
| main.md | — | Phase 12 本体サマリー |
| implementation-guide.md | 12-1 | Part 1（中学生向け）+ Part 2（技術者向け） |
| system-spec-update-summary.md | 12-2 | Step 1-A/1-B/1-C + Step 2 判定 |
| documentation-changelog.md | 12-3 | 変更 file と validator 結果 |
| unassigned-task-detection.md | 12-4 | 未タスク検出（0 件でも出力） |
| skill-feedback-report.md | 12-5 | skill 改善提案（改善点なしでも出力） |
| phase12-task-spec-compliance-check.md | 12-6 | canonical 9 見出し準拠の最終確認 |

## 実行タスク

1. **implementation-guide.md**: Part 1（中学生向けアナロジー：3 種類のノートを持つか）+ Part 2（技術詳細：sync_jobs/metrics_json/判定基準）。NON_VISUAL のため「UI/UX変更なしのため Phase 11 スクリーンショット不要」を明記。
2. **system-spec-update-summary.md**: Step 1-A（完了記録・LOGS/SKILL/topic-map 同期対象列挙）、Step 1-B（実装状況テーブル = `spec_created`）、Step 1-C（関連タスクテーブル更新）。Step 2（新規インターフェース追加なし → N/A）。`spec_created` 採用根拠を 1 行明記。
3. **documentation-changelog.md**: workflow-local 同期と global skill sync を別ブロックで記録。
4. **unassigned-task-detection.md**: 0 件 + baseline 説明（将来トリガ T-1〜T-3 は未タスク化対象でない理由）。
5. **skill-feedback-report.md**: task-specification-creator / aiworkflow-requirements の両 skill へのフィードバック行（改善点なしでも出力）。
6. **phase12-task-spec-compliance-check.md**: canonical 9 見出し（逐語）+ Phase 11 evidence file inventory テーブル（Path/Status 列）。
7. **same-wave sync**: docs-only / `spec_created` 据え置きでも、LOGS / aiworkflow current facts / indexes / artifact inventory / source consumed trace は本サイクル内で実更新する。両 SKILL.md 本体はテンプレ・schema 変更不要の no-op routing として記録する。

## 参照資料

- `docs/30-workflows/completed-tasks/issue-235-sync-audit-tables-necessity-judgement/index.md`
- `docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 統合テスト連携

- 本 Phase は docs-only / NON_VISUAL 判定タスクのため、新規統合テストは追加しない。
- 判定の一次証跡は Phase 11 の read-only 再現コマンドで取得する。

## 完了条件

- [ ] 必須 6 成果物 + main.md が `outputs/phase-12/` に揃っている
- [ ] implementation-guide が Part 1 / Part 2 構成
- [ ] compliance-check が canonical 9 見出しを逐語で満たす
- [ ] Phase 11 evidence inventory の present 行の物理ファイルが存在する
- [ ] 未タスク 0 件でも出力されている
- [ ] `spec_created` 据え置きの根拠が記録されている

## 成果物/実行手順

- `outputs/phase-12/main.md` + 必須 6 成果物
