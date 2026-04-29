# Documentation changelog — UT-GOV-003 CODEOWNERS

> 本タスクで生成 / 同期 / N/A 判定した全ドキュメントの変更履歴。Step 1-A / 1-B / 1-C / Step 2 全項目を個別記録（該当なしも N/A 区分で明記）。

## 変更ファイル一覧

| 日付 | 変更種別 | Step 区分 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- | --- |
| 2026-04-29 | 新規 | （本ワークフロー） | `docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-11.md` | Phase 11 仕様書（NON_VISUAL 代替 evidence プレイブック適用） |
| 2026-04-29 | 新規 | （本ワークフロー） | `docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-12.md` | Phase 12 仕様書（必須 5 outputs） |
| 2026-04-29 | 新規 | （本ワークフロー） | `docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-13.md` | Phase 13 仕様書（PR 作成 / user 明示承認必須） |
| 2026-04-29 | 新規 | （本ワークフロー） | `docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-11/main.md` | Phase 11 walkthrough トップ |
| 2026-04-29 | 新規 | （本ワークフロー） | `docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-11/manual-smoke-log.md` | smoke コマンド系列（NOT EXECUTED） |
| 2026-04-29 | 新規 | （本ワークフロー） | `docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-11/link-checklist.md` | リンク健全性チェック（OK 12 / Broken 0 / N/A 9） |
| 2026-04-29 | 新規 | （本ワークフロー） | `docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/main.md` | Phase 12 統合サマリー |
| 2026-04-29 | 新規 | （本ワークフロー） | `docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/implementation-guide.md` | Part 1（中学生 4 概念）+ Part 2（運用 + 移行手順） |
| 2026-04-29 | 新規 | （本ワークフロー） | `docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/system-spec-update-summary.md` | Step 1-A/B/C + Step 2=N/A |
| 2026-04-29 | 新規 | （本ワークフロー） | `docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/documentation-changelog.md` | 本ファイル |
| 2026-04-29 | 新規 | （本ワークフロー） | `docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/unassigned-task-detection.md` | current / baseline 分離 |
| 2026-04-29 | 新規 | （本ワークフロー） | `docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/skill-feedback-report.md` | 3 観点フィードバック |
| 2026-04-29 | 新規 | （本ワークフロー） | `docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-13/main.md` | PR 作成手順（user 承認必須） |
| 2026-04-29 | 更新 | Step 1-A | `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | `.github/CODEOWNERS` の current applied ownership 文書化を追記 |
| 2026-04-29 | 更新 | Step 1-B | `CLAUDE.md` | `docs/00-getting-started-manual/` 正規化と solo 運用方針を現行構成へ同期 |
| 2026-04-29 | 同期判定 | Step 1-C | `README.md` | リポジトリ root README 存在時のみ「Governance / Code owners」節追加。不在時は UT-GOV-005 へ申し送り |
| 2026-04-29 | 部分適用 | Step 2 | `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | GitHub governance current applied 値のみ反映。API / D1 / UI / 認証ドメイン仕様は非影響 |

## 本 PR で適用した変更

以下は本差分に含めて適用済み:

| 対象 | 適用 PR | 理由 |
| --- | --- | --- |
| `.github/CODEOWNERS` 新規 / 更新 | 本差分 | ownership 文書化を current applied として反映 |
| `doc/` `docs/` 表記揺れ実置換 | 本差分 + 残件は UT-GOV-005 | 実フォルダ移行済み範囲を反映し、広域残置は別タスクで管理 |
| `CLAUDE.md` への追記 / 同期 | 本差分 | CODEOWNERS と説明文を同一差分で揃えるため |
| `README.md` への追記 diff 適用 | N/A | root README.md が存在しないため |

## N/A 区分

| 区分 | 件数 | 内訳 |
| --- | --- | --- |
| Step 2 domain spec N/A | 1 | API / D1 / UI / 認証ドメイン仕様は非影響。GitHub governance current applied 値は反映済み |
| Step 1-C 条件付き N/A | 1 | README.md が存在しないため |
| その他 N/A | 0 | — |
