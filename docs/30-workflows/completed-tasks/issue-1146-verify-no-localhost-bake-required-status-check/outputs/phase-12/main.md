# Phase 12: ドキュメント同期

| 項目 | 値 |
| --- | --- |
| ステータス | `implemented_local_runtime_pending` |
| タスク | issue-1146 `verify-no-localhost-bake` を dev/main の required status check に登録 |
| 生成パターン | Closed Issue Canonical Workflow Root Recovery + Governance Mutation |
| 実装区分 | 実装仕様書 / NON_VISUAL / implementation_mode=`new` |
| Issue | [#1146](https://github.com/daishiman/UBM-Hyogo/issues/1146)（CLOSED 維持・`Refs #1146` のみ） |

本 Phase は Phase 12 strict 7 成果物の所在と同期内容を集約するハブである。
本タスクは新規 interface / 型 / API surface を追加しないため API/interface 正本 Step 2 は **N/A**。
ただし Closed Issue recovery workflow として、aiworkflow-requirements の workflow inventory / active indexes は同 cycle で同期済み。

---

## strict 7 成果物の所在（`outputs/phase-12/`）

| # | 成果物 | パス | 状態 |
| --- | --- | --- | --- |
| 1 | Phase 12 ハブ（本ファイル） | `outputs/phase-12/main.md` | present |
| 2 | 実装ガイド（Part1/Part2） | `outputs/phase-12/implementation-guide.md` | present |
| 3 | システム仕様更新サマリ | `outputs/phase-12/system-spec-update-summary.md` | present |
| 4 | ドキュメント更新履歴 | `outputs/phase-12/documentation-changelog.md` | present |
| 5 | 未タスク検出レポート | `outputs/phase-12/unassigned-task-detection.md` | present |
| 6 | スキルフィードバックレポート | `outputs/phase-12/skill-feedback-report.md` | present |
| 7 | compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

---

## Task チェックリスト

| Task | 内容 | 結果 |
| --- | --- | --- |
| 12-1 | 実装ガイド（中学生レベル + 技術者レベル）の作成 | 完了（`implementation-guide.md`） |
| 12-2 | システム仕様更新サマリ（Step 1-A/1-B/1-C/Step 2）の記録 | 完了（API Step 2 = N/A / workflow sync applied） |
| 12-3 | ドキュメント更新履歴（workflow-local / global skill sync）の記録 | 完了（skill sync applied） |
| 12-4 | 未タスク検出（current / baseline 分離） | 完了（current 0 件 / baseline B-1〜B-3 記録のみ） |
| 12-5 | スキルフィードバックレポート | 完了（feedback 同 cycle 反映済み） |
| 12-6 | compliance check の整合確認 | 完了（implemented_local_runtime_pending 実態へ更新） |

---

## NON_VISUAL の扱い

本タスクは UI/UX 変更を伴わないため Phase 11 の screenshot は **不要**。
代替証跡として read-only 調査再現と local verification を記録した `../phase-11/manual-test-result.md`（NON_VISUAL 証跡メタ）を参照する。
mutation 後の after evidence は `outputs/phase-13/branch-protection-after-{dev,main}.json` として user-gated 実行後に取得する。
