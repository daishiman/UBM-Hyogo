# Phase 1 成果物 — 要件定義

## 1. 背景

`.claude/skills/<skill>/indexes/keywords.json` / `index-meta.json` 等は hook / index 生成スクリプトによって自動再生成される派生物だが、現状はリポジトリに tracked file として登録されている。複数 worktree が並列に同 skill を更新すると、同一 JSON の同位置が異なる値で書き換わり、merge conflict を必ず引き起こす。`task-conflict-prevention-skill-state-redesign` Phase 5 で「派生物 / 正本」境界が定義され、A-1 施策として `.gitignore` 化と untrack を行う方針が runbook 化された。本ワークフローはその runbook を実コードに適用する PR の **タスク仕様書整備**のみに閉じる（実適用は Phase 5 以降の別 PR）。

## 2. 課題（why this task）

| # | 課題 | 影響 |
| --- | --- | --- |
| C-1 | `indexes/keywords.json` / `index-meta.json` が tracked のため 4 worktree 並列で必ず conflict | レビュー / マージ作業の継続的阻害 |
| C-2 | 派生物の手動 merge による index 不整合事故 | run 時に skill が壊れた状態でコミットされる |
| C-3 | `LOGS.rendered.md` が tracked でローカル一時生成物がコミットに紛れる | 履歴汚染 |
| C-4 | post-commit / post-merge hook が tracked canonical を上書き | worktree 間で hook 順次第で状態が振動 |

## 3. target globs（Phase 1 で固定）

```gitignore
# === skill auto-generated ledger (A-1) ===
# 派生物は post-commit / post-merge hook / pnpm indexes:rebuild で再生成されるため git 非管理
.claude/skills/*/indexes/keywords.json
.claude/skills/*/indexes/index-meta.json
.claude/skills/*/indexes/*.cache.json
.claude/skills/*/LOGS.rendered.md
# A-2 完了後の別タスクで有効化（本タスクでは追加しない）:
# .claude/skills/aiworkflow-requirements/LOGS.md
```

> 実態棚卸しは Phase 2 lane 2 の前提として `git ls-files .claude/skills` で行う。runbook 例示パスとのギャップを必ず識別する。

## 4. スコープ

### 含む（spec scope）

- Phase 1〜13 のタスク仕様書整備
- Phase 1〜3 成果物本体の作成
- target globs 4 系列の Phase 1 固定
- A-2 完了必須前提の 3 重明記設計
- 4 worktree smoke 検証コマンド系列の仕様レベル定義

### 含まない

- 実 `.gitignore` への追記（Phase 5 で実行）
- tracked 派生物の `git rm --cached`（Phase 5 以降）
- hook 本体実装（T-6 task-skill-ledger-hooks）
- A-2 / A-3 / B-1 の作業
- skill 改修ガイドへの Anchor 追記（A-3）

## 5. 受入条件（AC）

AC-1 〜 AC-11 は `index.md` §受入条件と同期。本 Phase で blocker は検出されず、Phase 2（設計）へ進行可能。

## 6. 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 4 worktree 並列で派生物 conflict 0 件化 |
| 実現性 | PASS | `.gitignore` / `git rm --cached` / hook ガードはすべて既存技術範囲 |
| 整合性 | PASS | 不変条件 #5 を侵害しない。skill ledger 派生物 / 正本境界を強化 |
| 運用性 | PASS | lefthook 経由で hook 配置、1〜2 コミット粒度のロールバック |

## 7. タスク種別の固定

| 項目 | 値 |
| --- | --- |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| scope | infrastructure_governance |

`artifacts.json.metadata` と完全一致。

## 8. 苦戦箇所サマリ（原典 §9 写経）

1. **A-1 を A-2 より先に着手すると `LOGS.md` 履歴が事故的に失われる**（最重要）。Phase 1 / 2 / 3 の 3 箇所で重複明記する。
2. runbook 例示 glob と実態のズレ → 全 skill 横断棚卸しを Phase 2 で必須化。
3. hook が tracked canonical を書き続けて untrack を無効化 → Phase 2 state ownership で「hook = 派生物のみ」境界を明示。
4. `.git/info/exclude` 誤配置 → Phase 2 ファイル変更計画で正本 `.gitignore` のみを明記。
5. 4 worktree smoke の再現コスト → Phase 2 で系列のみ固定し、実走は Phase 11。

## 9. 命名規則チェックリスト

- `.gitignore` セクションヘッダ: `# === skill auto-generated ledger (A-1) ===`
- untrack コミットメッセージ: `chore(skill): untrack auto-generated ledger files (A-1)`
- ロールバックコミットメッセージ: `revert(skill): re-track A-1 ledger files`
- hook 配置: `lefthook.yml` 経由のみ（`.git/hooks/*` 直接編集禁止）
- rebuild コマンド: `pnpm indexes:rebuild`

## 10. 引き渡し

Phase 2（設計）へ：
- 真の論点 = A-2 完了前提の 3 重明記
- target globs 4 系列
- 4 条件 PASS の根拠
- スコープ境界（仕様書整備に閉じる）
