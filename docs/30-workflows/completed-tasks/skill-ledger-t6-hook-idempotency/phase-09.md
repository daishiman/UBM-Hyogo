# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | hook 冪等化と 4 worktree 並列 smoke 実走 (skill-ledger-t6-hook-idempotency) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-29 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | template_created |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |

## 目的

実装差分と仕様差分が AC-1〜AC-11、skill-ledger 正本、Phase 1〜8 の設計に準拠していることを検証する。

## 実行タスク

1. `git add` / `git stage` / `git update-index --add` が hook 経路に残っていないことを確認する。
2. `jq -e .` による部分 JSON 検出が runbook に含まれることを確認する。
3. `wait $PID` 個別集約が smoke 手順に含まれることを確認する。
4. `artifacts.json` と Phase ファイルの状態・成果物パスを照合する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-t6-hook-idempotency/artifacts.json | 機械可読状態 |
| 必須 | .claude/skills/task-specification-creator/references/quality-gates.md | 品質ゲート |
| 必須 | .claude/skills/aiworkflow-requirements/references/skill-ledger-gitignore-policy.md | 派生物境界 |

## 実行手順

```bash
rg -n 'git (add|stage|update-index --add)' lefthook.yml scripts || true
find .claude/skills -name '*.json' -exec sh -c 'jq -e . "$1" >/dev/null' _ {} \;
node .claude/skills/task-specification-creator/scripts/validate-schema.js --schema schemas/artifact-definition.json --data docs/30-workflows/skill-ledger-t6-hook-idempotency/artifacts.json
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 品質保証結果を GO / NO-GO 判定へ渡す |
| Phase 11 | NON_VISUAL 代替 evidence として smoke 実走へ渡す |

## 多角的チェック観点（AIが判断）

- hook が canonical を書く経路を持っていないか。
- A-2 / A-1 / B-1 の依存順序と矛盾していないか。
- 品質確認が手動目視だけに依存していないか。

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | 禁止コマンド検査 | pending | AC-1 |
| 2 | JSON 検査 | pending | AC-3 |
| 3 | smoke 手順検査 | pending | AC-4 / AC-6 / AC-7 |
| 4 | artifacts 検証 | pending | skill 準拠 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| QA 記録 | outputs/phase-09/main.md | 実行コマンド・結果・残リスク |

## 完了条件

- [ ] 禁止コマンド検査が PASS
- [ ] JSON 検査が PASS
- [ ] artifacts schema 検証が PASS
- [ ] Phase 10 に残課題が渡されている

## タスク100%実行確認【必須】

- [ ] 全実行タスク（4 件）が completed
- [ ] 成果物が `outputs/phase-09/main.md` に配置済み

## 次Phase

- 次 Phase: 10 (最終レビュー)
