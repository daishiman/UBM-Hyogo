# Phase 11: 手動 smoke test (4 worktree 検証)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | skill-ledger-b1-gitattributes |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test (4 worktree 検証) |
| 作成日 | 2026-04-28 |
| 上流 | Phase 10 (最終レビュー) |
| 下流 | Phase 12 (ドキュメント更新) |
| 状態 | pending |
| user_approval_required | false |
| タスク種別 | NON_VISUAL（screenshot 不要） |

## 目的

`scripts/new-worktree.sh` で 2〜4 worktree を作成し、同一 `_legacy.md` への並列追記 → main で順次 merge → 衝突 0 件 / 両エントリ保存を実証する。`NON_VISUAL` のため screenshot は作らず、代替 evidence プレイブック（main / manual-smoke-log / link-checklist の 3 点必須）に従う。AC-3 を最終確定する。

## 入力

- `outputs/phase-10/go-no-go.md`（Go 判定）
- `outputs/phase-02/main.md`（smoke 系列）
- `outputs/phase-07/ac-matrix.md`

## テスト方式

| 項目 | 値 |
| --- | --- |
| 種別 | NON_VISUAL（docs walkthrough + 4 worktree smoke） |
| screenshot | 不要 |
| 代替 evidence | `main.md` / `manual-smoke-log.md` / `link-checklist.md`（必須3点） |

## smoke シナリオ

### S-1 2 worktree 並列追記（基本）

```bash
git checkout main
bash scripts/new-worktree.sh verify/b1-1
bash scripts/new-worktree.sh verify/b1-2

( cd .worktrees/verify-b1-1 && \
  printf -- '- entry from wt1\n' >> .claude/skills/aiworkflow-requirements/LOGS/_legacy.md && \
  git commit -am "log: wt1" )
( cd .worktrees/verify-b1-2 && \
  printf -- '- entry from wt2\n' >> .claude/skills/aiworkflow-requirements/LOGS/_legacy.md && \
  git commit -am "log: wt2" )

git merge --no-ff verify/b1-1
git merge --no-ff verify/b1-2
echo $?                                # => 0
git ls-files --unmerged                # => 0 行
grep 'entry from wt1' .claude/skills/aiworkflow-requirements/LOGS/_legacy.md
grep 'entry from wt2' .claude/skills/aiworkflow-requirements/LOGS/_legacy.md
```

### S-2 4 worktree stress（並列度上げ）

`verify/b1-3` `verify/b1-4` を追加し、4 行とも保存されることを確認。

### S-3 除外側の現役 fragment が並列で衝突する場合（防御線確認）

`LOGS/<timestamp>-*.md` を意図的に同一 path で並列追加 → 通常の衝突として検出される（`union` driver が当たらないため）ことを確認。

## 必須 evidence（3 点）

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/main.md` | NON_VISUAL 宣言 / 必須 outputs リンク / テスト方式 / 結果サマリ |
| `outputs/phase-11/manual-smoke-log.md` | S-1〜S-3 の実行コマンド / 期待 / 実測 / PASS-FAIL テーブル |
| `outputs/phase-11/link-checklist.md` | 仕様書 → outputs / `.gitattributes` / runbook / family file の参照リンク checklist |

加えて、未必須だが推奨:

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/manual-smoke-log.md` | S-1〜S-3 の生コマンドログと grep 出力（証跡） |

### `manual-smoke-log.md` 必須メタ

- 証跡の主ソース: 4 worktree smoke（S-1〜S-3）
- screenshot 非作成理由: `NON_VISUAL`（`.gitattributes` 設定変更のみ、UI 変更なし）
- 実行日時 / 実行者（branch 名: `feat/issue-132-skill-ledger-b1-gitattributes-task-spec` 由来の B-1 適用 branch）

### `link-checklist.md` 最小項目

- `.gitattributes` B-1 セクション ↔ `outputs/phase-02/main.md` pattern
- 解除条件コメント ↔ `outputs/phase-12/implementation-guide.md`
- 上流 runbook（`completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-7/gitattributes-runbook.md`）↔ 本 PR の整合確認
- task workflow 内リンク（index.md / phase-01〜13 / outputs）

## 実行タスク

1. S-1〜S-3 を実行し、生ログを `manual-smoke-log.md` に保存
2. PASS / FAIL テーブルを `manual-smoke-log.md` に記録
3. `link-checklist.md` の参照リンク全件 OK 化
4. AC-3 確定マーク
5. 終了後に `git worktree remove .worktrees/verify-b1-*` と branch 削除

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
| 必須 | `outputs/phase-02/main.md` |
| 必須 | `outputs/phase-10/go-no-go.md` |
| 必須 | `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` |

## 依存Phase明示

- Phase 1 成果物を参照する。
- Phase 2 成果物を参照する。
- Phase 5 成果物を参照する。
- Phase 6 成果物を参照する。
- Phase 7 成果物を参照する。
- Phase 8 成果物を参照する。
- Phase 9 成果物を参照する。
- Phase 10 成果物を参照する。

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-11/main.md` | Phase 11 トップ index / NON_VISUAL 宣言 |
| `outputs/phase-11/manual-smoke-log.md` | smoke 実行記録（必須） |
| `outputs/phase-11/link-checklist.md` | 参照リンク checklist（必須） |
| `outputs/phase-11/manual-smoke-log.md` | 生ログ（推奨） |

## 完了条件 (DoD)

- [ ] S-1 PASS（merge 0、unmerged 0、両 entry 保存）
- [ ] S-2 PASS（4 entry 保存）
- [ ] S-3 PASS（現役 fragment は通常衝突として検出）
- [ ] AC-3 確定 GREEN
- [ ] 必須 3 点（main / manual-smoke-log / link-checklist）作成済
- [ ] worktree teardown 完了

## 苦戦箇所・注意

- **worktree 残骸**: `verify/b1-1` が前回の残りとして存在すると `new-worktree.sh` が失敗。事前 `git worktree list` 確認
- **screenshot 強要の誤解**: NON_VISUAL タスクで screenshot を作ると false green になる。代替 evidence の 3 点を厳守
- **branch protection 抵触**: smoke 実施で main に直接 commit しないこと。merge は smoke 用の sandbox branch（main から派生）で行うか、smoke 専用作業 branch で実施
- **A-2 完了後の path 変動**: smoke 対象 `_legacy.md` が A-2 完了で消滅していないか事前確認
- **link-checklist の途中切れ**: 仕様書 → outputs リンクの片道だけ書きがち。双方向リンク（outputs → 仕様書）も含む

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の仕様書作成であり、アプリケーション統合テストは追加しない。
- 統合検証は `git check-attr merge`、Phase 11 NON_VISUAL smoke、リンク整合、`artifacts.json` 整合で代替する。
- 派生実装タスクで `.gitattributes` を編集する場合は、本 Phase の検証コマンドをそのまま実行し、結果を outputs に記録する。

## 次 Phase

- 次: Phase 12（ドキュメント更新）
- 引き継ぎ: AC-3 確定 / smoke evidence 3 点
