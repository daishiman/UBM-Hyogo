# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | skill-ledger-b1-gitattributes |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 7 (AC マトリクス) |
| 下流 | Phase 9 (品質保証) |
| 状態 | pending |
| user_approval_required | false |

## 目的

`.gitattributes` の pattern 重複削除、コメント整理、上流 runbook（`gitattributes-runbook.md`）との文言整合を行う。docs-only タスクのため refactor 範囲は設定 / コメント / 関連 doc に限る。

## 入力

- 実装後の `.gitattributes`
- `outputs/phase-07/ac-matrix.md`
- 上流 `docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-7/gitattributes-runbook.md`

## DRY 化観点

### 1. pattern 重複削除

| 観点 | チェック内容 |
| --- | --- |
| `_legacy.md` 重複 | `.claude/skills/**/_legacy.md` と `.claude/skills/**/LOGS/_legacy.md` は前者で後者を包含する。後者は冗長なら削除を検討 |
| 包含関係の評価 | glob 包含を `git check-attr` で確認し、冗長行を削除 |

ただし、明示性を優先して残す判断もある。判断結果を main.md に記録する。

### 2. コメント整理

| 観点 | チェック内容 |
| --- | --- |
| 解除条件 | コメントに「A-2 完了 = `_legacy.md` が空」が明記されているか |
| 適用禁止 | JSON / YAML / SKILL.md / lockfile / front matter が列挙されているか |
| broad glob 禁止 | `**/*.md` のような broad glob 禁止が明記されているか |
| 重複コメント | 同じ意味のコメントを複数箇所に書いていないか |

### 3. 上流 runbook との整合

| 観点 | チェック内容 |
| --- | --- |
| 文言一致 | `.gitattributes` コメントと `gitattributes-runbook.md` の解除条件文言が同じ表現か |
| pattern 一致 | runbook の pattern サンプルと実 `.gitattributes` が一致しているか |
| 矛盾検出 | runbook 側に「A-2 完了で削除」と書きながら本実装で削除条件が緩くなっていないか |

## 実行タスク

1. pattern 包含関係を check-attr ドライランで確認
2. 冗長行の削除可否を判断（明示性 vs DRY のトレードオフ）
3. コメントの重複削除と表現統一
4. 上流 runbook との文言突合せ
5. 判断結果と差分を main.md に記録

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
| 必須 | `outputs/phase-07/ac-matrix.md` |
| 必須 | `docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-7/gitattributes-runbook.md` |

## 依存Phase明示

- Phase 1 成果物を参照する。
- Phase 2 成果物を参照する。
- Phase 5 成果物を参照する。
- Phase 6 成果物を参照する。
- Phase 7 成果物を参照する。

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-08/main.md` | DRY 化前後 diff / 包含関係判定 / runbook 整合確認 |

## 完了条件 (DoD)

- [ ] pattern 包含関係を check-attr で確認済み
- [ ] 冗長 / 明示性のトレードオフ判断記録済み
- [ ] コメント重複削除済み
- [ ] 上流 runbook と文言整合確認済み
- [ ] 整合後に Phase 7 AC が全て GREEN を維持

## 苦戦箇所・注意

- **過剰 DRY の罠**: 「pattern 1 行で済むはず」と詰めすぎると現役 fragment まで巻き込むリスク。明示性を優先する場合は main.md に「DRY より明示性優先」と理由を記録
- **コメント削減で解除条件喪失**: 短くしようとして「A-2 完了で削除」を消すと技術負債化が確定する。コメント削減の不可触領域として明記
- **runbook 側の更新漏れ**: 本実装で pattern を変えた場合、上流 runbook も追従更新が必要。doc 整合は Phase 12 へ持ち越さない

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の仕様書作成であり、アプリケーション統合テストは追加しない。
- 統合検証は `git check-attr merge`、Phase 11 NON_VISUAL smoke、リンク整合、`artifacts.json` 整合で代替する。
- 派生実装タスクで `.gitattributes` を編集する場合は、本 Phase の検証コマンドをそのまま実行し、結果を outputs に記録する。

## 次 Phase

- 次: Phase 9（品質保証）
- 引き継ぎ: DRY 化後 `.gitattributes` / 整合確認結果
