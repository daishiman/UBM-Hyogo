# outputs/phase-12/

> Source issue: [#762](https://github.com/daishiman/UBM-Hyogo/issues/762)
> Phase: 12（ドキュメント更新 / strict 7 outputs）
> implementation_mode: `conditional_implementation_with_peripheral_hardening`

---

## 用途

task-specification-creator 規約の **strict 7 outputs** を実体化する。`docs/30-workflows/issue-717-oidc-cf-full-migration/outputs/phase-12/` と同じ規約に従い、後続実装エージェントが Phase 1 で参照すべき正本群を集約する。

## strict 7 outputs（必須・順序厳守）

| # | ファイル | 概要 |
|---|---|---|
| 1 | `main.md` | Phase 12 全体サマリ + 4 条件 verdict |
| 2 | `implementation-guide.md` | 後続実装エージェント向けの実装手順 + Part 1 中学生レベル概念説明（OIDC / subject claim pin / observation window） |
| 3 | `system-spec-update-summary.md` | `deployment-secrets-management.md` / source unassigned trace の正本同期サマリ |
| 4 | `documentation-changelog.md` | 本 cycle のドキュメント変更履歴 |
| 5 | `unassigned-task-detection.md` | 後続 unassigned task（実 OIDC 切替 / staging proof / production cutover / legacy 物理失効 / apps/api D1 cutover / 1Password 再編）の検出と実行順制約 |
| 6 | `skill-feedback-report.md` | skill feedback / template・workflow・docs 改善点 |
| 7 | `phase12-task-spec-compliance-check.md` | task-specification-creator compliance verdict |

## DoD（Phase 12 のもの — 詳細は `../../phase-12-documentation.md` §Phase 12 DoD）

- [x] 7 ファイルすべて実体化
- [x] Part 1 中学生レベル概念説明（OIDC / subject claim pin / observation window）が `implementation-guide.md` に含まれる
- [x] `claim-pin-verifier-spec.md` の `EXPECTED_*` 値が `scripts/oidc/verify-claim-pin.sh` 実装と 1:1 一致
- [x] `redaction-pattern-update.md` の regex が `scripts/redaction-check.sh` 実装と完全一致
- [x] `unassigned-task-detection.md` に最低 3 件（本サイクルは 6 件）と実施先候補が記載
- [x] 7 ファイル間の cross-reference 整合性（claim 4 軸値 / G1-G4 順序 / unassigned 6 件）が一致
- [x] OIDC token 値・JWT 実値・Account ID が含まれない

## 不変条件

- 7 ファイルの **ファイル名は厳守**（task-specification-creator の compliance check で grep される）。
- 順序を入れ替えない（番号は task ID であり並び順は固定）。
- 後続サイクルで実切替時に追加 evidence が必要になっても、本 7 ファイルを削除・統合しない。
