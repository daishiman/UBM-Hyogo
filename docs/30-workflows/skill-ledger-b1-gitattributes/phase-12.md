# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | skill-ledger-b1-gitattributes |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 11 (smoke test) |
| 下流 | Phase 13 (PR 作成) |
| 状態 | pending |
| user_approval_required | false |

## 目的

5 必須タスク（implementation-guide Part1/2、system-spec-update、documentation-changelog、unassigned-task-detection、skill-feedback-report）を作成し、Phase 3 MINOR（A-2 完了レビューチェックリスト追加）を解決する。NON_VISUAL タスクとして Phase 11 代替証跡（main / manual-smoke-log / link-checklist）と直列で記述する。

## 入力

- `outputs/phase-10/go-no-go.md`
- `outputs/phase-11/{main,manual-smoke-log,link-checklist,smoke-evidence}.md`
- Phase 3 MINOR 追跡テーブル

## 必須タスク

### Task 12-1: implementation-guide.md（Part 1 / Part 2）

| Part | 内容 |
| --- | --- |
| Part 1（中学生レベルアナロジー） | 「`merge=union` は両方のメモを片方ずつ並べて貼るホッチキス。設計図（front matter / JSON）には使ってはいけない」 |
| Part 2（実装詳細） | `.gitattributes` B-1 セクション全文 / pattern 一覧 / `git check-attr` 検証コマンド / 解除条件 / 上流 runbook 参照 |

### Task 12-2: system-spec-update-summary.md

- Step 1: 仕様書差分（派生実装タスク用の `.gitattributes` B-1 セクション追記手順）
- Step 2A: 計画記録（A-2 完了時の解除手順を skill-state-redesign workflow へ反映対象として記録）
- Step 2B: 実更新（`gitattributes-runbook.md` の解除条件 wording を本実装と整合させる）
- 完了前 計画系 wording 残存確認:

```bash
rg -n "仕様策定のみ|実行対象|保留として記録" \
  docs/30-workflows/skill-ledger-b1-gitattributes/outputs/phase-12/ \
  | rg -v 'phase12-task-spec-compliance-check.md' || echo "計画系 wording なし"
```

### Task 12-3: documentation-changelog.md

| 変更ファイル | 種別 | 変更内容 |
| --- | --- | --- |
| 派生実装ランブック | 追加 | `.gitattributes` B-1 セクション手順 |
| `outputs/phase-01〜13/*` | 新規 | task workflow 一式 |
| `gitattributes-runbook.md`（上流） | 更新 | 解除条件 wording 整合 |

加えて Phase 10 MINOR（TECH-M-01）の解決ステータスを記録。

### Task 12-4: unassigned-task-detection.md

SF-03 4 パターン照合:

| パターン | 結果 |
| --- | --- |
| 型定義→実装 | 該当なし（設定ファイル変更のみ） |
| 契約→テスト | 該当なし |
| UI 仕様→コンポーネント | 該当なし |
| 仕様書間差異→設計決定 | 上流 runbook と本実装の wording 整合を Task 12-2 で実施 |

検出件数 0 件でも本ファイルに「0 件、SF-03 4 パターン確認済み」と明記。

### Task 12-5: skill-feedback-report.md

- B-1 タスク特有の苦戦箇所（broad glob の誘惑 / 解除条件喪失リスク / skill 自身の `_legacy.md` 棚卸し漏れ）を記録
- task-specification-creator skill への改善観察事項（NON_VISUAL タスクで pattern 設計タスクのテンプレが未定義の場合の補強提案）

## 追加タスク（MINOR 解決）

### Task 12-6: A-2 完了レビューチェックリスト更新（TECH-M-01）

A-2 タスク（`task-skill-ledger-a2-fragment`）の Phase 12 documentation または独立 runbook に「B-1 attribute 残存確認」項目を追加することを `documentation-changelog.md` で記録。実体は A-2 側の completed-tasks workflow に追記する PR を未タスク化して追跡。

## 実行タスク

1. Task 12-1〜12-5 を順次作成
2. Task 12-6 で MINOR 解決
3. 計画系 wording 残存確認スクリプト実行
4. 5 必須ファイルの命名一致確認（`unassigned-task-detection.md` 等）
5. Phase 11 NON_VISUAL 代替証跡へのリンクを implementation-guide / changelog から張る

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Skill Ledger Overview | `.claude/skills/aiworkflow-requirements/references/skill-ledger-overview.md` | A-2 → A-1 → A-3 → B-1 の実装順序と責務境界 |
| Skill Ledger Gitattributes Policy | `.claude/skills/aiworkflow-requirements/references/skill-ledger-gitattributes-policy.md` | B-1 `merge=union` の許可・禁止・解除条件 |
| Skill Ledger Lessons Learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-skill-ledger-redesign-2026-04.md` | skill ledger 4施策の苦戦箇所と再発防止 |


| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-11/` 配下 3 点 |
| 必須 | `outputs/phase-10/go-no-go.md` |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` |

## 依存Phase明示

- Phase 1 成果物を参照する。
- Phase 2 成果物を参照する。
- Phase 5 成果物を参照する。
- Phase 6 成果物を参照する。
- Phase 7 成果物を参照する。
- Phase 8 成果物を参照する。
- Phase 9 成果物を参照する。
- Phase 10 成果物を参照する。
- Phase 11 成果物を参照する。

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-12/implementation-guide.md` | Part 1 / Part 2 |
| `outputs/phase-12/system-spec-update-summary.md` | Step 1 / Step 2A / 2B |
| `outputs/phase-12/documentation-changelog.md` | 変更ファイル / validator / MINOR 追跡結果 |
| `outputs/phase-12/unassigned-task-detection.md` | SF-03 4 パターン照合（0 件でも明記） |
| `outputs/phase-12/skill-feedback-report.md` | 苦戦箇所 / 改善観察 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 12-1〜12-6 全項目 |

## 完了条件 (DoD)

- [ ] 5 必須ファイル + compliance check が作成済
- [ ] 計画系 wording 残存 0 件
- [ ] Phase 10 MINOR（TECH-M-01）の解決ステータス記録済
- [ ] SF-03 4 パターン照合明記
- [ ] 命名一致（`unassigned-task-detection.md` 等）

## 苦戦箇所・注意

- **計画系 wording 残存**: 「実行対象」「保留」を Task 12-2 に書いて忘れがち。完了前 grep を必ず実行
- **5 ファイル名のタイポ**: `unassigned-task-detection.md` のような類似名を作らない。正本は `unassigned-task-detection.md`
- **MINOR の流し**: TECH-M-01 を「Phase 12 で記録した」だけで終わらせず、A-2 workflow への追記計画まで documentation-changelog に書く
- **Part 1 アナロジーの過度な抽象化**: 「merge driver」と書いただけでは中学生に届かない。「両側のメモを順に貼るホッチキス」のような具体物に喩える
- **NON_VISUAL の証跡分散**: Phase 11 代替証跡と Phase 12 outputs の両方を直列で参照可能にすること（300 行超過例外条項該当）

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の仕様書作成であり、アプリケーション統合テストは追加しない。
- 統合検証は `git check-attr merge`、Phase 11 NON_VISUAL smoke、リンク整合、`artifacts.json` 整合で代替する。
- 派生実装タスクで `.gitattributes` を編集する場合は、本 Phase の検証コマンドをそのまま実行し、結果を outputs に記録する。

## 次 Phase

- 次: Phase 13（PR 作成）
- 引き継ぎ: 5 必須 + compliance check / MINOR 解決
