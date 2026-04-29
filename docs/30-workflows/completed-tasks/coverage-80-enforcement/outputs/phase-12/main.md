# Phase 12 索引

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| 名称 | ドキュメント更新 |
| 状態 | pending |
| user_approval_required | false |
| 作成日 | 2026-04-29 |

## 目的

coverage-80-enforcement タスクの Phase 1〜11 成果物を運用ドキュメントとして固定し、Phase 13 の 3 段階 PR（PR① soft / PR② テスト追加 / PR③ hard）と aiworkflow-requirements 正本同期へ引き渡す。実装ガイドは中学生レベル（Part 1）と開発者技術詳細（Part 2）の 2 部構成で、auto-loop の動作と vitest / coverage-guard / CI / lefthook 構成を一気通貫で説明する。

## 成果物一覧

| 成果物 | パス | 役割 |
| --- | --- | --- |
| 索引 | outputs/phase-12/main.md | 本ファイル |
| 実装ガイド | outputs/phase-12/implementation-guide.md | Part 1 / Part 2 |
| 仕様更新サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/B/C / Step 2 REQUIRED |
| 更新履歴 | outputs/phase-12/documentation-changelog.md | 同期対象ファイル個別記録 |
| 未タスク検出 | outputs/phase-12/unassigned-task-detection.md | U-1〜U-5（current）/ baseline 分離 |
| skill feedback | outputs/phase-12/skill-feedback-report.md | 3 観点テーブル |
| compliance check | outputs/phase-12/phase12-task-spec-compliance-check.md | テンプレ準拠チェック |

## 完了判定

- [ ] 必須 7 ファイルが揃っている
- [ ] implementation-guide が Part 1（例え話 / 専門用語言い換え表）+ Part 2（vitest config / coverage-guard.sh 関数シグネチャ / exit code / CI YAML / lefthook YAML / 3 段階 PR コマンド例）
- [ ] system-spec-update-summary が Step 1-A/B/C + Step 2 REQUIRED（既存 80%/65% → 全 package 80% diff 含む）
- [ ] documentation-changelog が Step 1-A/B/C/Step 2 を個別記録
- [ ] unassigned-task-detection に U-1〜U-5 が含まれる
- [ ] skill-feedback-report 3 観点テーブル
- [ ] 外部シークレット注入形式の混入なし
- [ ] 計画系 wording 残存なし
- [ ] UT-GOV-004 完了前提の 5 重明記が維持

## Phase 13 への引き渡し

- 実装ガイド Part 2 の YAML / コマンド例 → `outputs/phase-13/pr1-runbook.md` / `pr2-runbook.md` / `pr3-runbook.md` の正本
- documentation-changelog → PR description 草案
- unassigned-task-detection U-1〜U-5 → PR body「related work」
- compliance check PASS → Phase 13 承認ゲートの前提
