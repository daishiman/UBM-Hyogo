# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 12 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

worktree / tmux / shell state を分離し、他プロジェクト・他セッションとの混線を防ぐ。

> **300行上限の例外条項適用**: 設計タスク（spec_created / docs-only）かつ NON_VISUAL タスクのため、Phase 11 代替証跡（main / manual-smoke-log / link-checklist）と Phase 12 の 6 必須成果物の compliance マトリクスを横断参照可能な単一文書として保持する。`phase-template-phase12.md` の例外条項に基づき分割しない。

## 事前チェック【必須】

Phase 12 実行前に、以下の既知の落とし穴を確認し、漏れを防止する。

1. `.claude/rules/06-known-pitfalls.md` の Phase 12 関連項目を読む
   - **P1**: LOGS.md 2ファイル更新漏れ（aiworkflow-requirements + task-specification-creator 両方）
   - **P2**: topic-map.md 再生成忘れ（仕様書セクション変更時）
   - **P3**: 未タスク管理の3ステップ不完全（指示書 → task-workflow.md 登録 → 関連仕様書リンク）
   - **P4**: documentation-changelog への早期「完了」記載（実更新前の planned wording 禁止）
   - **P25**: LOGS.md 2ファイル更新漏れ（再発防止）
   - **P26**: システム仕様書更新遅延（Step 2A/2B の planned wording 残）
   - **P27**: topic-map.md 再生成トリガーの判断ミス（追加だけでなく削除・更新も対象）
   - **P28**: スキルフィードバックレポート未作成（改善点なしでも省略不可）
2. `.claude/skills/task-specification-creator/references/phase-template-phase12-detail.md` を参照する
3. NON_VISUAL タスクの場合、Phase 11 代替証跡の連動を確認する

## 実行タスク

| Task ID | 内容 | 成果物 | 完了基準 |
| --- | --- | --- | --- |
| Task 12-1 | 実装ガイド作成（Part 1: 中学生レベル概念 + Part 2: 型/コマンド/エラー/定数） | `outputs/phase-12/implementation-guide.md` | Part1 に「たとえば」が最低1回含まれ、「なぜ必要か→何をするか」順序を満たす |
| Task 12-2 | システムドキュメント更新サマリ（Step 1-A〜1-C / Step 2A/2B） | `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements index 更新と references 更新要否が明記され、planned wording が残っていない |
| Task 12-3 | ドキュメント更新履歴 & artifacts.json 更新 | `outputs/phase-12/documentation-changelog.md` + `artifacts.json` 更新 | 変更ファイル一覧、validator 結果、current / baseline が記録されている |
| Task 12-4 | 未タスク検出（4ソース確認） | `outputs/phase-12/unassigned-task-detection.md` | SF-03 の4パターン確認が記録され、0件でも理由が残されている |
| Task 12-5 | スキルフィードバックレポート（4セクション構成） | `outputs/phase-12/skill-feedback-report.md` | ワークフロー改善点 / 技術的教訓 / スキル改善提案 / 新規Pitfall候補 の4セクションが揃う |
| Task 12-6 | Phase 12 準拠チェック | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 1〜5、NON_VISUAL、spec_created、計画系表現の残存なしを検証 |

- Task 12-1: `implementation-guide.md` を Part 1（中学生レベル、日常例、なぜ必要か先行）と Part 2（型定義、API/コマンド例、エラー、定数）で作成する。**validator 安定化ルール**として、Part 1 の「日常の例え」段落には `たとえば` を最低1回含め、「なぜ必要か」→「何をするか」の順序を維持する（詳細は `.claude/skills/task-specification-creator/references/phase-template-phase12-detail.md` の「Task 1: 実装ガイド作成」を参照）。
- Task 12-2: `system-spec-update-summary.md` に Step 1-A〜1-C と Step 2A/2B の結果を記録し、必要な aiworkflow-requirements index 更新と references 更新要否を明記する。
- Task 12-3: `documentation-changelog.md` に変更ファイル、validator 結果、current / baseline を記録し、artifacts.json を更新する。
- Task 12-4: `unassigned-task-detection.md` に SF-03 の4パターン確認を記録し、0件でも理由を残す。
- Task 12-5: `skill-feedback-report.md` に skill定義への改善提案または「改善点なし」を 4 セクションで記録する。
- Task 12-6: `phase12-task-spec-compliance-check.md` に Task 1〜5、NON_VISUAL、spec_created、計画系表現の残存なしを検証する。

> **必須**: 実行タスクは「表」と「`- Task 12-X:` 箇条書き」を**両方**残すこと。

### Task 12-1: 実装ガイド作成【必須】

**2パート構成**で作成する。

| パート | 対象読者 | 内容 |
| --- | --- | --- |
| Part 1 | 初学者・非技術者 | 概念（中学生でもわかる版）。「日常の例え」段落に `たとえば` を最低1回含め、「なぜ必要か」→「何をするか」の順序を維持する |
| Part 2 | 開発者・技術者 | 型定義 / コマンド例 / エラー / 定数（worktree / tmux / shell state 分離の実コマンドと環境変数） |

詳細ルール参照: `.claude/skills/task-specification-creator/references/phase-template-phase12-detail.md`（validator 安定化ルール節）。

### Task 12-3: ドキュメント更新履歴 & artifacts.json 更新【必須】

```bash
# Step 1: ドキュメント更新履歴生成
node scripts/generate-documentation-changelog.js \
  --workflow docs/30-workflows/task-worktree-environment-isolation

# Step 2: Phase 12 完了登録（artifacts.json 更新）
node scripts/complete-phase.js \
  --workflow docs/30-workflows/task-worktree-environment-isolation \
  --phase 12 \
  --artifacts "outputs/phase-12/implementation-guide.md:実装ガイド,outputs/phase-12/documentation-changelog.md:ドキュメント更新履歴,outputs/phase-12/unassigned-task-detection.md:未タスク検出レポート,outputs/phase-12/skill-feedback-report.md:スキルフィードバックレポート,outputs/phase-12/system-spec-update-summary.md:仕様書更新サマリー,outputs/phase-12/phase12-task-spec-compliance-check.md:Phase12準拠チェック"
```

**スクリプト未存在時の代替**: 手動で `outputs/phase-12/documentation-changelog.md` と `artifacts.json` を作成し、 `current` / `baseline` を分離記録する。

### Task 12-4: 未タスク検出【必須・4ソース確認】

| # | ソース | 確認項目 |
| --- | --- | --- |
| 1 | Phase 3 レビュー結果 | MINOR 判定の指摘事項 |
| 2 | Phase 10 レビュー結果 | MINOR 判定の指摘事項 |
| 3 | Phase 11 手動テスト結果 | スコープ外の発見事項（NON_VISUAL 代替証跡含む） |
| 4 | 各 Phase 成果物 | 「将来対応」「TODO」「FIXME」 |

加えて SF-03（設計タスク特有）の 4 パターンを照合する: 型定義→実装 / 契約→テスト / UI仕様→コンポーネント / 仕様書間差異→設計決定。**0件でも `unassigned-task-detection.md` に「設計タスクパターン確認済み、0件」と明記する**。

### Task 12-5: スキルフィードバックレポート【必須・4セクション構成】

改善点がなくても **4 セクション** すべてを記載する（省略不可）。

| セクション | 記載内容 |
| --- | --- |
| ワークフロー改善点 | Phase 実行中に発見したワークフロー上の改善提案 |
| 技術的教訓 | 実装中に得られた技術的な知見・注意点 |
| スキル改善提案 | task-specification-creator / aiworkflow-requirements への改善提案 |
| 新規 Pitfall 候補 | `06-known-pitfalls.md` に追加すべき新規 Pitfall |

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/task-specification-creator/references/phase-template-phase12-detail.md`
- `.claude/skills/task-specification-creator/references/phase-template-phase12.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `scripts/new-worktree.sh`

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テスト実行ではなく `verify-all-specs`、phase output validation、link check、計画系表現チェック、aiworkflow index validation を記録する。

## 苦戦箇所の記録【推奨】

```markdown
## 苦戦箇所

### 1. {{問題の概要}}

- **症状**: {{発生した問題の具体的な症状}}
- **原因**: {{問題の根本原因}}
- **解決策**: {{採用した解決策}}
- **学び**: {{将来のタスクへの教訓}}
- **関連 Pitfall**: {{該当する場合は Pitfall ID}}
```

苦戦箇所を未タスク化する3ステップ（P3 準拠）:

1. `docs/30-workflows/unassigned-task/` に未タスク指示書を作成する
2. `task-workflow.md` の残課題テーブルへ登録する
3. 関連仕様書に未タスク参照リンクを追加する

## フォールバック手順

| スクリプト | 代替手順 |
| --- | --- |
| `generate-documentation-changelog.js` | 手動で `documentation-changelog.md` を作成（current/baseline 分離） |
| `complete-phase.js` | 手動で `artifacts.json` を作成・更新 |
| `detect-unassigned-tasks.js` | 手動で 4 ソース（Phase 3/10/11 レビュー、各 Phase 成果物）を確認し記録 |
| `verify-unassigned-links.js` | 手動で `unassigned-task-detection.md` 内のリンクと配置先を目視確認 |

## スキル検証コマンド

```bash
node .claude/skills/skill-creator/scripts/quick_validate.js .claude/skills/task-specification-creator
node .claude/skills/skill-creator/scripts/quick_validate.js .claude/skills/aiworkflow-requirements

# planned wording 残存確認（完了前必須）
rg -n "仕様策定のみ|実行予定|保留として記録" \
  docs/30-workflows/task-worktree-environment-isolation/outputs/phase-12/ \
  | rg -v 'phase12-task-spec-compliance-check.md' || echo "planned wording なし"
```

## 完了条件

- [ ] 実行タスクを「表」と「`- Task 12-X:` 箇条書き」の両方で記載している
- [ ] 実装ガイド（Part 1: 概念的説明）が作成され、`たとえば` が最低 1 回含まれ「なぜ必要か→何をするか」順序を満たす
- [ ] 実装ガイド（Part 2: 技術的詳細）が型定義 / コマンド / エラー / 定数を含む
- [ ] 【Task 2 Step 1】システム仕様書に「完了タスク」セクションを追加した（該当する場合）
- [ ] 【Task 2 Step 1】aiworkflow-requirements/LOGS.md にタスク完了エントリを追加した
- [ ] 【Task 2 Step 1】task-specification-creator/LOGS.md にタスク完了記録を追加した（**2 ファイル両方必須** -- P1, P25）
- [ ] 【Task 2 Step 1】aiworkflow-requirements/SKILL.md 変更履歴テーブルを更新した
- [ ] 【Task 2 Step 1】task-specification-creator/SKILL.md 変更履歴テーブルを更新した
- [ ] 【Task 2 Step 1-D】topic-map.md を再生成した（P2, P27）
- [ ] 【Task 2 Step 1-C】関連タスクテーブルのステータスを「完了」に更新した（該当する場合）
- [ ] 【Task 2 Step 2】システム仕様更新の要否を判断し、`documentation-changelog.md` に記録した（Step 2A の planned wording を Step 2B 実更新で置換済み）
- [ ] 未タスク検出レポートが出力され、SF-03 4 パターン確認結果（0 件でも理由）が明記されている
- [ ] スキルフィードバックレポートが 4 セクション構成で出力されている（改善点なしでも作成）
- [ ] artifacts.json が更新されている
- [ ] 苦戦箇所セクションを記録した
- [ ] 計画系表現（`仕様策定のみ` / `実行予定` / `保留として記録` 等）が Phase 12 outputs に残っていない
- [ ] docs-only / spec_created / NON_VISUAL の分類が崩れておらず、ユーザー承認なしの commit / push / PR 作成を行わない

## 次のPhase

Phase 13: 完了確認 / PR 作成準備（`phase-13.md` 参照）
