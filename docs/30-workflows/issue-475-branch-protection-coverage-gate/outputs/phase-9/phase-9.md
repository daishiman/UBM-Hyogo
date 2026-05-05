# Phase 9: 品質検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 / 13 |
| 作成日 | 2026-05-05 |
| 状態 | spec_created |

## 目的

実装変更（SSOT docs 編集 + skill indexes 再生成）に対し typecheck / lint / yml lint / index drift / coverage 維持を実行し回帰がないことを保証する。

## 品質検証マトリクス

| 検証 | コマンド | 期待 |
| --- | --- | --- |
| 依存解決 | `mise exec -- pnpm install --frozen-lockfile` | exit 0 |
| typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| lint | `mise exec -- pnpm lint` | exit 0 |
| coverage | `bash scripts/coverage-guard.sh` | exit 0 |
| yamllint | `yamllint .github/workflows/ci.yml` | exit 0 |
| skill index drift | `mise exec -- pnpm indexes:rebuild && git diff --quiet .claude/skills/aiworkflow-requirements/indexes/` | drift なし |
| markdown 構文 | `npx markdownlint docs/30-workflows/issue-475-branch-protection-coverage-gate/**/*.md \|\| true` | エラー 0（warn 許容）|

## 自動修復ループ

| 失敗 | 修復方針 |
| --- | --- |
| typecheck / lint | 本タスク差分は docs のみ。失敗は別 task 取り込み起因。main rebase で解消を試みる |
| yamllint | 本タスクは workflow yml を変更しないため、失敗発生時は別 task 起因 |
| index drift | `pnpm indexes:rebuild` 結果をコミット |

最大 3 回まで自動修復。それ以上は Phase 2 へ戻り設計再検討。

## 成果物

- `outputs/phase-9/quality-verification.md`
