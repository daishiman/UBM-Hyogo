# Phase 12 Task Spec Compliance Check — coverage-80-enforcement

`phase12-task-spec-compliance-template.md` 準拠チェック。

## 判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| Phase 12 必須 5 タスク | PASS | implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report 全件存在 |
| Part 1 / Part 2 構成 | PASS | implementation-guide.md に `## Part 1（中学生レベル / 例え話）` と `## Part 2（開発者向け技術詳細）` の 2 セクションあり |
| NON_VISUAL evidence | PASS | Phase 11 baseline-summary / manual-smoke-log / link-checklist で screenshots 不要理由を明示（NON_VISUAL = CI gate / script / skill 同期のみ） |
| Phase 13 承認ゲート | PASS | phase-13.md で PR 作成承認 / 3 段階 merge 承認 / 実 branch protection contexts 登録承認を分離 |
| aiworkflow-requirements 反映判定 | PASS（Step 2 = REQUIRED） | 既存 80%/65% → 全 package 80% 一律切替が unilateral に必要 |
| 4 条件 | PASS | 矛盾なし / 漏れなし / 整合性 / 依存関係整合の 4 件すべて再検証対象を明示 |

## 4 条件チェック

| 条件 | 結果 | 確認内容 |
| --- | --- | --- |
| 矛盾なし | PASS | `spec_created` と「実 CI merge / contexts 登録は Phase 13 user 承認後」を分離記述 |
| 漏れなし | PASS | Phase 1〜13 / 必須 7 outputs / U-1〜U-5 / Step 1-A/B/C / Step 2 すべて記録 |
| 整合性あり | PASS | `coverage-guard.sh` 80% / aiworkflow-requirements 80% / coverage-standards 80% の正本一致を確認。Codecov は repo 未導入のため任意タスク扱い |
| 依存関係整合 | PASS | UT-GOV-004 完了 → UT-GOV-001 contexts 登録 → 本タスク PR③ hard gate 化、の上流前提を 5 重明記 |

## 必須包含チェック

| 項目 | 判定 | 場所 |
| --- | --- | --- |
| Part 1 例え話 4 つ以上 | PASS | カバレッジ通信簿 / 80% 現実解 / auto-loop ループ / 鶏卵問題（3 段階 PR） |
| Part 1 専門用語言い換え表 | PASS | implementation-guide.md `専門用語の言い換え表` |
| Part 2 vitest config | PASS | `coverage` セクション全フィールド |
| Part 2 coverage-guard.sh 関数シグネチャ | PASS | `parse_args` / `collect_summary` / `aggregate_pkg_pct` / `format_top10_failure` / `emit_test_template_paths` / `main` |
| Part 2 exit code 表 | PASS | 0 / 1 / 2 |
| Part 2 CI YAML | PASS | coverage-gate job soft / hard 両形 |
| Part 2 lefthook YAML | PASS | pre-push.commands.coverage-guard |
| Part 2 3 段階 PR コマンド例 | PASS | PR① / PR② sub / PR③ の git switch / commit / push / gh pr create |
| U-1〜U-5 必須包含 | PASS | unassigned-task-detection.md current 区分に全件 |
| Step 1-A/B/C / Step 2 個別記録 | PASS | documentation-changelog.md の区分列で個別記録 |
| 外部シークレット注入形式の混入なし | PASS | Part 2 で扱わない事項として明記 |
| 計画系 wording なし | PASS | `仕様策定のみ` / `実行予定` / `保留として記録` を使用していない |
| UT-GOV-004 完了前提 5 重明記 | PASS | Phase 1 / 2 / 3 / 11 / 12 で言及 |

## 残リスク

- aiworkflow-requirements `quality-requirements-advanced.md` の実書き換え、coverage-standards 同期、lefthook 統合、lockfile 同期は本 wave で反映済み。`pnpm indexes:rebuild` 実走 / branch protection contexts 登録は **ユーザー承認後の別オペレーション**。
- soft → hard 切替忘却（U-4）は本タスク範囲では仕組み化せず、formalize 候補として保持。

## verify-all-specs warning 分類（想定）

| 区分 | 予想件数 | 扱い |
| --- | --- | --- |
| Phase 4〜13 を pending 予約成果物として作成しているための依存 Phase 参照 warning | 数件〜数十件 | baseline warning。Phase 13 実走後に解消されるまで維持 |
| root / outputs artifacts drift | 0 | blocker なし |
| missing required output | 0 | blocker なし |

> 警告は `outputs/verification-report.md`（Phase 11 で生成想定）に保存。Phase 13 実 commit 前に再実行し、新規 warning 増加時のみ Phase 12 へ差し戻す。
