# Phase 10: ガバナンス確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 / 13 |
| 種別 | ガバナンス |
| 入力 | Phase 4-8 出力 |
| 出力 | branch protection / CI gate 影響なしの確認ログ |

## 目的

本タスクが branch protection / CODEOWNERS / required status check / Cloudflare 設定に**変更を与えない**ことを確認し、read-only で現行状態を記録する。

## 確認対象

| 対象 | 期待 | 検証 |
| --- | --- | --- |
| `.github/workflows/*.yml` | 変更なし | `git status .github/` が空 |
| `.github/CODEOWNERS` | 変更なし | `git status .github/CODEOWNERS` が空 |
| Cloudflare Workers env | 変更なし | `wrangler.toml` 群に diff なし |
| D1 migration | 変更なし | `apps/api/migrations/` に新規ファイルなし |
| Required status check | 影響なし | typecheck / lint / web spec の既存 gate を通過 |
| Secret / Variable 投入 | なし | `bash scripts/cf.sh secret` 実行不要 |

## 実行手順

```bash
# 1. 影響範囲外の変更がないこと
git status -- .github/ apps/api/migrations/ infra/ scripts/cf.sh

# 2. wrangler.toml に diff なし
git diff -- 'apps/**/wrangler.toml'

# 3. 既存 required check（typecheck / lint）が引き続き通ること
# → Phase 6 で確認済
```

## 不可逆 mutation の有無

**なし**。本タスクは `gh api -X PUT` / `wrangler deploy` / `d1 migrations apply` / `gh secret set` のいずれも実行しない。governance mutation user gate（`references/non-visual-irreversible-task-rules.md` §0）対象外。

## 完了条件


- [x] Phase 10 の完了条件を満たす証跡が保存されている。
- 上記 6 対象すべてで「変更なし」を確認
- governance mutation user gate 適用外であることを宣言

## 参照資料

- CLAUDE.md §ブランチ戦略 / §Governance
- `references/non-visual-irreversible-task-rules.md`

## 実行タスク

- Phase 10 の本文に記載済みの手順を実行し、完了証跡を該当 outputs に保存する。

## 統合テスト連携

- NON_VISUAL のため画面証跡ではなく、focused Vitest / typecheck / lint / grep gate のログで連携確認する。
