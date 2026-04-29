# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| 名称 | ドキュメント更新 |
| タスクID | TASK-SKILL-CODEX-VALIDATION-001 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

実装内容、仕様更新、未タスク、skill feedback を同一 wave で同期し、aiworkflow-requirements と task-specification-creator の正本に反映する。

## 必須 6 成果物

| Task | 成果物 | 必須 |
| --- | --- | --- |
| 12-1 | `implementation-guide.md`（Part 1: 中学生レベル / Part 2: 開発者向け） | ✅ |
| 12-2 | `system-spec-update-summary.md` | ✅ |
| 12-3 | `documentation-changelog.md` | ✅ |
| 12-4 | `unassigned-task-detection.md`（0 件でも出力） | ✅ |
| 12-5 | `skill-feedback-report.md`（改善点なしでも出力） | ✅ |
| 12-6 | `phase12-task-spec-compliance-check.md` | ✅ |

## Task 12-1: implementation-guide.md

### Part 1（中学生レベル / 概念説明）

例え話の方針:
- 「SKILL.md は新入部員の自己紹介カード」
- 「description は自己紹介の 1 段落（長すぎると読まれない＝ Codex がスキップ）」
- 「テストフィクスチャはわざと壊した練習用カード（本物の名簿と分けるため拡張子を変える）」

### Part 2（技術者向け）

- インターフェース: `validateSkillMdContent(content): { ok: boolean, errors: string[], description: string|null, name: string|null }`
- API シグネチャ: `generate_skill_md.js` の `buildDescription` / `extractOverflow` の入出力
- エラーハンドリング: throw メッセージ一覧と退避先パス
- 設定可能パラメータ: `MAX_DESC_LENGTH = 1024`, `MAX_ANCHORS = 5`, `MAX_TRIGGER_KEYWORDS = 15`
- エッジケース: マルチバイト境界 / 改行正規化 / `: ` escape

### 視覚証跡セクション

```
UI/UX 変更なしのため Phase 11 スクリーンショット不要。
代替証跡:
- outputs/phase-10/final-review-result.md
- outputs/phase-11/main.md
- outputs/phase-11/manual-smoke-log.md（Codex 起動ログ / skill-creator test log を含む）
- outputs/phase-11/link-checklist.md
```

## Task 12-2: system-spec-update-summary.md

| Step | 内容 | 必須 |
| --- | --- | --- |
| Step 1-A | 完了タスク記録 | ✅ |
| Step 1-B | 実装状況テーブル更新（`completed`） | ✅ |
| Step 1-C | 関連タスクテーブル更新 | ✅ |
| Step 2 | システム仕様更新（新規インターフェース追加） | ✅（`validateSkillMdContent` 公開） |

更新対象:
- `.claude/skills/aiworkflow-requirements/LOGS.md`（タスク完了記録）
- `.claude/skills/task-specification-creator/LOGS.md`（同上）
- `.claude/skills/skill-creator/LOGS.md`（生成ガードの運用知見）
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（新規セクションあれば追加）
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（関連仕様追加時）
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（参照導線追加時）
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json`（`generate-index.js` で再生成）
- `.claude/skills/aiworkflow-requirements/SKILL.md`（変更履歴追記）
- `.claude/skills/task-specification-creator/SKILL.md`（変更履歴追記）

## Task 12-3: documentation-changelog.md

各 Step の結果を個別に明記（該当なしも記録）。workflow-local 同期と global skill sync を別ブロックで記録。

## Task 12-4: unassigned-task-detection.md

候補ソース:
- 元タスク仕様書のスコープ外項目
- Phase 3 / 10 レビューの MINOR 指摘
- Phase 11 の発見事項
- コードコメント TODO/FIXME/HACK/XXX
- `describe.skip` ブロック

0 件でも出力必須。

候補（暫定、Phase 12 で再判定）:

| 候補 | 内容 |
| --- | --- |
| `validate-skill-md.js` の i18n 化 | エラーメッセージ多言語化（優先度低、Phase 8 で却下） |
| skill-discovery 経路への `.skillignore` 仕様要望 | 外部ツール側の機能要望（本タスクでは対応不可） |

## Task 12-5: skill-feedback-report.md

| 観点 | 記録内容 |
| --- | --- |
| テンプレート改善 | Phase 11 NON_VISUAL の証跡項目に「外部ツール起動ログ」のテンプレートが欲しい |
| ワークフロー改善 | `.fixture` 拡張子戦略はテストフィクスチャ標準パターンとして横展開価値あり |
| ドキュメント改善 | description 1024 字制約の参照を `references/` に集約推奨 |

改善点なしでも出力必須。

## Task 12-6: phase12-task-spec-compliance-check.md

phase12 の root evidence。各 Phase の outputs/ 実体と artifacts.json の parity を ID 単位で記録。

```
Task 12-1 → implementation-guide.md: PASS
Task 12-2 → system-spec-update-summary.md: PASS
Task 12-3 → documentation-changelog.md: PASS
Task 12-4 → unassigned-task-detection.md: PASS
Task 12-5 → skill-feedback-report.md: PASS
Task 12-6 → phase12-task-spec-compliance-check.md: PASS（自身）
```

## 同一 wave 同期チェックリスト（5 点）

Phase 12 close-out では以下を**同一ターン**で更新:

- [ ] `docs/30-workflows/skill-md-codex-validation-fix/index.md`（status: completed）
- [ ] `docs/30-workflows/skill-md-codex-validation-fix/artifacts.json`（phase12_completed）
- [ ] `docs/30-workflows/skill-md-codex-validation-fix/outputs/artifacts.json`（同上）
- [ ] `.claude/skills/aiworkflow-requirements/LOGS.md`
- [ ] `.claude/skills/task-specification-creator/LOGS.md`
- [ ] `.claude/skills/skill-creator/LOGS.md`

## 検証コマンド

```bash
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js
node .claude/skills/task-specification-creator/scripts/generate-index.js \
  --workflow docs/30-workflows/skill-md-codex-validation-fix --regenerate
```

## 受入条件（Phase 12 完了条件）

- [ ] 6 成果物すべて出力（0 件 / 該当なしも明記）
- [ ] LOGS.md 3 ファイル更新
- [ ] SKILL.md 2 ファイル変更履歴追記
- [ ] artifacts.json parity 0 diff
- [ ] mirror parity 0 diff

## 成果物

- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 実行タスク

- 必須6成果物を作成する。
- aiworkflow-requirements の indexes / LOGS / SKILL 変更履歴を同期する。
- task-specification-creator と skill-creator の LOGS / feedback を同期する。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| Phase 2 design | `outputs/phase-2/design.md` | 設計同期 |
| Phase 5 diff | `outputs/phase-5/diff-summary.md` | 実装同期 |
| Phase 6 tests | `outputs/phase-6/extended-tests.md` | テスト同期 |
| Phase 7 coverage | `outputs/phase-7/coverage-report.md` | coverage 同期 |
| Phase 9 QA | `outputs/phase-9/qa-result.md` | QA 同期 |
| Phase 10 review | `outputs/phase-10/final-review-result.md` | close-out 判定 |
| Phase 12 unassigned | `outputs/phase-12/unassigned-task-detection.md` | 未タスク |
| Phase 12 compliance | `outputs/phase-12/phase12-task-spec-compliance-check.md` | compliance |
| Phase 11 | `phase-11.md` | 手動 evidence |
| spec update workflow | `.claude/skills/task-specification-creator/references/spec-update-workflow.md` | Phase 12 同期 |
| aiworkflow indexes | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 正本導線 |

## 完了条件

- [ ] 必須6成果物が揃っている
- [ ] indexes/topic-map.md と keywords.json の同期方針が記録されている
- [ ] LOGS 3点と mirror parity が確認されている

## タスク100%実行確認【必須】

- [ ] Phase 12 の成果物と artifacts.json の登録が一致している
