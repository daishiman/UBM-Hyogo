# Phase 12: ドキュメント更新

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-590-PHASE11-EVIDENCE-PATHS-001 |
| Phase | 12 |
| 状態 | completed |
| visualEvidence | NON_VISUAL |

## 目的

実装結果を仕様書 / skill references / changelog に同期し、aiworkflow-requirements / task-specification-creator の current facts と整合させる。さらに supersede 関係と派生タスクを明記する。

## 必須 7 ファイル

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 サマリー |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル概念説明） + Part 2（技術者向け） |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | 仕様書同期サマリー（差分） |
| 4 | `outputs/phase-12/documentation-changelog.md` | 更新履歴 + supersede 関係 |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 派生タスク列挙 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator skill 4 条件評価 + feedback |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 compliance evidence |

## 変更対象ファイル（references / docs 同期）

| パス | 変更種別 | 内容 |
| --- | --- | --- |
| `.claude/skills/task-specification-creator/SKILL.md` または references 配下 | 編集 | 新 schema / validator の存在と用途を 1 段落追記 |
| `.claude/skills/aiworkflow-requirements/references/`（該当 reference があれば） | 編集 | Phase 11 evidence 取得規約に schema 参照を追加 |
| `docs/30-workflows/completed-tasks/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-05.md` | 編集 | header に `superseded by docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths/` を追記、または `completed-tasks/` 相当への移動を検討 |
| `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-11.md` | 編集 | 既に Phase 5 で schema 参照行追記済み（再確認） |

## Part 1（中学生レベル概念説明）骨子

`implementation-guide.md` の冒頭に必須:

- 「テストが終わったあと、どこにメモを残すかを統一する『マス目（schema）』を作った」
- 「マス目どおりに書けてるか自動でチェックする道具（validator）も作った」
- 「これがあると『あのファイルどこだっけ？』『古いの見てた』みたいな勘違いがゼロになる」

## Part 2（技術者向け）骨子

- JSON Schema 2020-12 で `taskId` / `workflowDir` / `evidence[]` を定義
- 軽量 ESM CLI validator が schema 違反 / id 重複 / path 不存在を検出
- exit code 0/1/2/3 で CI 連携可能
- 親 issue-549 の Phase 11 表が JSON 化され機械可読化
- 後続 workflow は同 schema を参照することで Phase 11 evidence path drift を排除

## supersede 関係

| supersede 対象 | 関係 |
| --- | --- |
| `docs/30-workflows/completed-tasks/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-05.md` | 本タスクで完全実装し supersede（Issue #590 close-out） |

## 派生タスク（unassigned-task-detection.md）

- `lib/schema-runner.js` 共通化（既存 validator 群と本 validator の DRY 化）
- 他 workflow（ui-prototype-alignment-mvp-recovery / e2e-quality-uplift 等）の Phase 11 への schema 適用展開
- CI gate `verify-phase11-canonical-paths` の追加（任意 / 必要性は 30 日運用後再評価）
- aiworkflow-requirements `topic-map.md` への新 schema entry 追加（必要時）

## same-wave sync ルール

aiworkflow-requirements の `indexes/` 配下（resource-map / topic-map / keywords）への影響は限定的。新 schema 名（`phase11-evidence-canonical-paths`）が keywords に追加すべきかを Phase 13 前にチェックし、必要なら `pnpm indexes:rebuild` を実行する。

## 完了条件

- [x] 7 ファイルが揃っている
- [x] task-specification-creator SKILL.md or references の更新内容が記載されている
- [x] 派生元 unassigned-task の supersede 記述が完了
- [x] supersede 関係が明記されている
- [x] 派生タスクが列挙されている
- [x] same-wave sync チェックが完了している

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 参照資料

- `phase-05.md`（実装）/ `phase-11.md`（evidence）
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
