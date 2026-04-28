# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | skill-ledger-b1-gitattributes |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 1 (要件定義) |
| 下流 | Phase 3 (設計レビュー) |
| 状態 | completed |
| user_approval_required | false |

## 目的

Phase 1 で確定した対象 / 除外 path リストを元に、`.gitattributes` に書き込む glob pattern を最小限に絞り込み、state ownership（`.gitattributes` 単独正本）、4 worktree smoke コマンド系列、ロールバック設計、A-2 完了時の解除手順を確定する。

## 入力

| 種別 | パス |
| --- | --- |
| 上流成果物 | `outputs/phase-01/main.md`（対象 / 除外 / AC） |
| 参照 spec | `docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-2/gitattributes-pattern.md` |

## 設計事項

### 1. pattern 設計

| 種別 | pattern 例 | 適用範囲 | 備考 |
| --- | --- | --- | --- |
| 対象 | `.claude/skills/**/_legacy.md merge=union` | 移行猶予中 ledger | A-2 完了で削除 |
| 対象 | `.claude/skills/**/LOGS/_legacy.md merge=union` | LOGS legacy | 同上 |
| 対象 | `.claude/skills/**/changelog/_legacy.md merge=union` | changelog legacy | skill 自身も含む |
| 対象 | `.claude/skills/**/lessons-learned/_legacy*.md merge=union` | lessons legacy | 同上 |
| 除外 | `**/*.json` / `**/*.yaml` / `**/*.yml` / `SKILL.md` | 構造体保護 | glob を明示的に絞ることで自然除外 |

- `**/*.md` のような broad glob は禁止
- 個別 path 指定にして範囲を絞ることを優先
- コメントで「A-2 fragment 化完了時に削除」「JSON / YAML 適用禁止」「broad glob 禁止」を明記

### 2. state ownership

| state | 正本 | mirror |
| --- | --- | --- |
| `merge=union` 適用境界 | リポジトリルート `.gitattributes` の B-1 セクション | なし（Git driver は単一正本） |

### 3. 4 worktree smoke コマンド系列

```bash
git checkout main
bash scripts/new-worktree.sh verify/b1-1
bash scripts/new-worktree.sh verify/b1-2

( cd .worktrees/verify-b1-1 && \
  printf -- '- entry from wt1\n' >> <target>/_legacy.md && \
  git commit -am "log: wt1" )
( cd .worktrees/verify-b1-2 && \
  printf -- '- entry from wt2\n' >> <target>/_legacy.md && \
  git commit -am "log: wt2" )

git merge --no-ff verify/b1-1
git merge --no-ff verify/b1-2
echo $?                       # => 0
git ls-files --unmerged       # => 0 行
```

### 4. ロールバック設計

- `.gitattributes` の B-1 セクションを `git revert` するのみで完了
- attribute は merge 時のみ作用するため、既存ファイルへの副作用なし
- revert 後は通常の merge 衝突に戻るだけで、データ損失なし

### 5. A-2 完了時の解除手順

1. A-2 fragment 化完了レビュー時に「B-1 attribute 残存確認」をチェック
2. `git ls-files '.claude/skills/**/_legacy.md'` が空であることを確認
3. `.gitattributes` の B-1 セクションを削除
4. `chore(skill-ledger): retire merge=union after A-2 fragment migration` でコミット

## 実行タスク

1. Phase 1 対象一覧から共通 path 構造を抽出
2. 許可マトリクスと突き合わせて pattern 案確定
3. state ownership / smoke / rollback / 解除手順を main.md に記述
4. 検証コマンド（check-attr 対象 / 除外）を pattern 単位で記述

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
| 必須 | `outputs/phase-01/main.md` |
| 必須 | `docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-2/gitattributes-pattern.md` |
| 必須 | `docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-7/gitattributes-runbook.md` |

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-02/main.md` | pattern 案 diff / 適用 除外マッピング表 / smoke 系列 / rollback / 解除手順 |

## 完了条件 (DoD)

- [x] pattern が許可マトリクスを逸脱していない
- [x] 除外対象を巻き込まないことを `git check-attr` ドライランで確認できる構造
- [x] state ownership が `.gitattributes` 単独正本であることが明記
- [x] 4 worktree smoke 系列が記述
- [x] rollback / 解除手順が明記

## 苦戦箇所・注意

- **glob 過大化の誘惑**: `**/_legacy.md` 単一で済ませたくなるが、現役 fragment（`LOGS/<timestamp>-*.md`）の隣接を巻き込まないか check-attr で必ず検証する
- **コメントの揮発**: `.gitattributes` のコメントは PR レビュー時に削られやすい。「A-2 完了で削除」「broad glob 禁止」は冗長でも残す
- **解除条件の曖昧化**: A-2 完了 = 「`_legacy.md` が空」と機械判定可能な基準にしておく。「fragment 化が進んだら」のような主観表現は禁止

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の仕様書作成であり、アプリケーション統合テストは追加しない。
- 統合検証は `git check-attr merge`、Phase 11 NON_VISUAL smoke、リンク整合、`artifacts.json` 整合で代替する。
- 派生実装タスクで `.gitattributes` を編集する場合は、本 Phase の検証コマンドをそのまま実行し、結果を outputs に記録する。

## 次 Phase

- 次: Phase 3（設計レビュー）
- 引き継ぎ: pattern 案 / 適用除外マッピング / smoke 系列 / rollback 設計
