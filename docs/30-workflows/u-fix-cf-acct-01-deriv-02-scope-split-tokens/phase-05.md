# Phase 5: 実装

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-5/phase-5.md` |

## 目的
workflow YAML 分割、`scripts/cf.sh` Token 引数化、docs runbook 雛形を実装する。

## 変更対象ファイル
- `.github/workflows/backend-ci.yml`（編集: job 分割）
- `.github/workflows/backend-ci.yml`（編集: job 分割）
- `scripts/cf.sh`（編集: `CLOUDFLARE_API_TOKEN` 引数化）
- `docs/30-workflows/u-fix-cf-acct-01-deriv-02-scope-split-tokens/outputs/phase-12/runbook-token-rotation.md`（新規）
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`（編集: secrets 表更新）

## 参照資料
- `outputs/phase-5/phase-5.md`
- `outputs/phase-2/workflow-job-split-design.md`

## 成果物
- 上記変更対象ファイル
- `outputs/phase-5/diff-summary.md`

## 完了条件
- すべての対象ファイルが変更され、`actionlint`・`pnpm lint` が PASS。

## 実行タスク
- [ ] `backend-ci.yml` / `web-cd.yml` / `scripts/cf.sh` / docs evidence を実変更する。

## 統合テスト連携
- `bash scripts/__tests__/cf-token-arg.test.sh` を実行し、workflow YAML は actionlint または YAML parser で検証する。
