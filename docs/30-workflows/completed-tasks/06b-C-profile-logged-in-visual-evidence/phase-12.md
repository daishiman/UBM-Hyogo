# Phase 12: ドキュメント更新 — 06b-C-profile-logged-in-visual-evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-C-profile-logged-in-visual-evidence |
| phase | 12 / 13 |
| wave | 6b-fu |
| 作成日 | 2026-05-03 |
| taskType | implementation-spec |

## 目的

実装 / 実測の結果を、後続タスクとレビュアーが追跡可能な形でドキュメント化する。`outputs/phase-12/` 配下に main + 6 種、計 7 ファイルの成果物を揃える。

## 出力成果物（strict 7 files）

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-12/implementation-guide.md` | 実装サマリ・触ったファイル・evidence path・PR 本文に転記する素材 |
| `outputs/phase-12/system-spec-update-summary.md` | `docs/00-getting-started-manual/specs/06-member-auth.md` / `07-edit-delete.md` への影響（無ければ「変更なし」と明記） |
| `outputs/phase-12/unassigned-task-detection.md` | invariant 違反検出時の follow-up タスク提案、または「検出なし」 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 13 Phase 仕様書フォーマット遵守チェック結果 |
| `outputs/phase-12/skill-feedback-report.md` | task-specification-creator skill / automation-30 skill への feedback |
| `outputs/phase-12/documentation-changelog.md` | docs 配下の変更点 + 09a への引継ぎ点 |
| `outputs/phase-12/main.md` | Phase 12 index と strict 7 files 実体確認 |

## 各成果物の最低記載項目

### implementation-guide.md

- 実装区分判定根拠
- 触ったファイル一覧（5 ファイル: .gitignore / .gitkeep / playwright.config.ts / profile-readonly.spec.ts / capture-profile-evidence.sh）
- 実行コマンド（dry-run + 実測）
- evidence path 一覧
- 中学生レベルの概念説明: 「ログイン状態を冷凍保存（storageState）して、毎回ログインせずに `/profile` ページのスクショと中身チェックを自動で撮る仕組み」

### system-spec-update-summary.md

- 06-member-auth.md / 07-edit-delete.md への変更: 通常は「変更なし」（実測仕様の追記のみあれば記載）
- M-08〜M-10 / M-14〜M-16 の AC を仕様書側にも反映するか判断

### unassigned-task-detection.md

- 検出された未タスク（例: visual regression baseline 化、CI 自動実行統合）
- E-05〜E-07 invariant 違反検出時はそれを最優先 follow-up に積む

### phase12-task-spec-compliance-check.md

- 13 Phase 全件の必須セクション充足チェック
- CONST_004（実装区分）/ CONST_005（CONST_005 必須項目）/ evidence-sync-rules / artifact-naming-conventions の遵守状況

### skill-feedback-report.md

- task-specification-creator: 「visual evidence 系タスクの phase-05 ランブック例」が薄い場合の改善提案
- automation-30: 本タスクで活用した観点 / 不要だった観点

### documentation-changelog.md

- index.md の実装区分追記
- artifacts.json の `code_changes` / `evidence_outputs` 追加
- 09a staging visual smoke への継承メモ

## 実行手順

1. Phase 11 完了前でも strict 7 files のスケルトンを `outputs/phase-12/` に作成し、実測待ち項目は `PENDING_RUNTIME_EVIDENCE` と明記
2. Phase 11 の実測結果（exit code、evidence file 数、redaction 結果）を implementation-guide に転記
3. invariant 違反の有無を unassigned-task-detection に記録
4. compliance-check で全 Phase の DoD を再確認
5. skill-feedback を整理
6. documentation-changelog で全体差分を要約

## サブタスク管理

- [ ] implementation-guide.md
- [ ] system-spec-update-summary.md
- [ ] unassigned-task-detection.md
- [ ] phase12-task-spec-compliance-check.md
- [ ] skill-feedback-report.md
- [ ] documentation-changelog.md
- [x] outputs/phase-12/main.md に index 追加

## 成果物

| 成果物 | パス |
| --- | --- |
| Phase 12 index | `outputs/phase-12/main.md` |
| 上記 6 ファイル | `outputs/phase-12/{implementation-guide,system-spec-update-summary,unassigned-task-detection,phase12-task-spec-compliance-check,skill-feedback-report,documentation-changelog}.md` |

## 完了条件

- [ ] strict 7 files すべて存在
- [ ] implementation-guide に「触ったファイル」「実行コマンド」「evidence path」が含まれる
- [ ] compliance-check で全 Phase が PASS、または FAIL 項目に修正計画
- [ ] 中学生レベル概念説明が implementation-guide に存在

## タスク100%実行確認

- [ ] 6 ファイル全件作成済
- [ ] secret 値（API token / session token）を docs に転記していない

## 次 Phase への引き渡し

Phase 13 へ、implementation-guide.md を PR 本文素材として引き渡す。
