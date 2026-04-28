# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | skill-ledger-b1-gitattributes |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-28 |
| 上流 | A-1 (gitignore), A-2 (fragment), A-3 (progressive disclosure) |
| 下流 | Phase 2 (設計) |
| 状態 | completed |
| タスク種別 | docs-only / `NON_VISUAL` |
| user_approval_required | false |

## 目的

A-1〜A-3 完了後に残る「fragment 化できない / 移行猶予中の append-only ledger」を path レベルで確定し、`merge=union` driver の適用 / 除外境界を行独立性レビューで決める。本 Phase は scope / AC / inventory を不可逆化し、Phase 2 設計の入力を凍結する。

## 入力

| 種別 | パス / 内容 |
| --- | --- |
| 原典スペック | `docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-b1-gitattributes.md` |
| 上流成果物 | A-1 / A-2 / A-3 各 PR の merge commit と `_legacy.md` 構造 |
| 参照 spec | `docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-2/gitattributes-pattern.md` |
| 参照 spec | `docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-7/gitattributes-runbook.md` |

## 受入基準（AC）

- AC-1: B-1 セクションが `.gitattributes` に追記され、対象は行独立な append-only Markdown のみ
- AC-2: JSON / YAML / `SKILL.md` / lockfile / コードファイルへ `merge=union` が一切適用されていない
- AC-3: 2 worktree から同一 `_legacy.md` 末尾追記で衝突 0 件、両エントリ保存
- AC-4: `merge=union` 適用が「行レベル独立」のみに限定されることが check-attr で機械検証可能
- AC-5: A-2 fragment 化完了後の解除手順が `.gitattributes` コメントまたは runbook に明記
- AC-6: skill 自身（`task-specification-creator` / `aiworkflow-requirements`）の `_legacy.md` も棚卸しに含まれている
- AC-7: 解除条件とロールバック手順が Phase 2 / 3 / 12 で追跡可能
- AC-8: A-1 / A-2 / A-3 完了が Phase 1 / 2 / 3 の NO-GO 条件として重複明記されている
- AC-9: `docs-only` / `NON_VISUAL` / `spec_created` が `artifacts.json` と一致している
- AC-10: 代替案 4 案以上を PASS / MINOR / MAJOR で評価し、base case を確定している
- AC-11: Phase 1〜13、outputs、`artifacts.json` の依存関係が一致している

## 実行タスク

1. A-1〜A-3 の main マージ済みを確認（先行依存ゲート）
2. `git ls-files '.claude/skills/**/_legacy.md' '.claude/skills/**/LOGS/_legacy.md' '.claude/skills/**/changelog/_legacy.md' '.claude/skills/**/lessons-learned/_legacy*.md'` で対象候補列挙
3. 各候補ファイルの冒頭を確認し、front matter（`^---$`）/ コードフェンス / 構造体を判定
4. 「対象 / 除外」の 2 リストへ分類
5. `docs-only` / `NON_VISUAL` のタスク種別を index.md / artifacts.json に確定
6. AC-1〜AC-11 を main.md に確定記述

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
| 必須 | `docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-b1-gitattributes.md` |
| 必須 | `docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-7/gitattributes-runbook.md` |
| 必須 | `docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-2/gitattributes-pattern.md` |
| 参考 | `gitattributes(5)` `merge` attribute / `union` driver |

## 検証コマンド

```bash
# 候補列挙
git ls-files '.claude/skills/**/_legacy.md' \
  '.claude/skills/**/LOGS/_legacy.md' \
  '.claude/skills/**/changelog/_legacy.md' \
  '.claude/skills/**/lessons-learned/_legacy*.md'

# 上流マージ確認
git log --oneline main | grep -E "skill-ledger-(a1|a2|a3)"
```

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-01/main.md` | 対象 path 一覧 / 除外 path 一覧 / AC-1〜AC-11 / タスク種別確定 |

## 完了条件 (DoD)

- [x] A-1〜A-3 の main マージ確認済み
- [x] 適用候補リスト（path + 行独立性判定根拠）が main.md に記載
- [x] 除外リスト（除外理由つき）が main.md に記載
- [x] 除外側に JSON / YAML / `SKILL.md` / lockfile が必ず含まれている
- [x] AC-1〜AC-11 が確定
- [x] タスク種別 `docs-only` / `NON_VISUAL` を index.md / artifacts.json に固定

## 苦戦箇所・注意

- **広域 glob 禁止**: `**/*.md` のように広く書きたくなるが、front matter 付き fragment（A-2 成果）まで巻き込むと A-2 設計と矛盾する
- **skill 自身の `_legacy.md`**: A-2 を skill 自身（`task-specification-creator/SKILL-changelog.md` / `aiworkflow-requirements/LOGS.md`）にも適用した結果、棚卸し範囲が当初想定より広がる。ドッグフーディング由来の追加対象を見落とさないこと
- **front matter 重複の見落とし**: append-only でも front matter があると `merge=union` で `---` が二重化する。Phase 1 で機械的に除外
- **JSON / YAML の glob 巻き込み**: `indexes/keywords.json` 等の構造体は静かに壊れる。除外リスト側で必ず明記

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の仕様書作成であり、アプリケーション統合テストは追加しない。
- 統合検証は `git check-attr merge`、Phase 11 NON_VISUAL smoke、リンク整合、`artifacts.json` 整合で代替する。
- 派生実装タスクで `.gitattributes` を編集する場合は、本 Phase の検証コマンドをそのまま実行し、結果を outputs に記録する。

## 次 Phase

- 次: Phase 2（設計：pattern 設計 / state ownership / smoke コマンド系列 / ロールバック / 解除手順）
- 引き継ぎ: 対象 path リスト / 除外 path リスト / AC-1〜AC-11
