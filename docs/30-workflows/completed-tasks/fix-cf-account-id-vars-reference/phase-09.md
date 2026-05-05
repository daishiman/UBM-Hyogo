# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | FIX-CF-ACCT-ID-VARS-001 |
| Phase | 9 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |


## 実行タスク

1. 本 Phase の入力と制約を確認する。
2. 本 Phase の成果物に必要な判断、手順、証跡を記録する。
3. 完了条件と artifacts ledger の整合を確認する。

## 目的

line budget / link / mirror parity / artifact 整合を一括判定する。


## 参照資料

- `index.md`
- `artifacts.json`
- `.github/workflows/backend-ci.yml`
- `.github/workflows/web-cd.yml`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/environment-variables.md`

## 入力

- 全 Phase 成果物
- artifacts.json / outputs/artifacts.json

## 品質チェック項目

| 項目 | 確認方法 | 期待結果 |
| --- | --- | --- |
| Phase spec line budget | `wc -l docs/30-workflows/fix-cf-account-id-vars-reference/phase-*.md` | 各 phase 500 行以内 |
| index.md link 死活 | `grep -oE '\[.*\]\(.*\)' index.md` の各リンク先存在確認 | 全 link が解決 |
| outputs/phase-*/main.md 存在 | `ls outputs/phase-*/main.md` | 全 13 phase + 補助ファイルが揃う |
| artifacts.json と outputs/artifacts.json 整合 | `diff <(jq '.phases' artifacts.json) <(jq '.phases' outputs/artifacts.json)` | phase キーが一致 |
| 不変条件 #5 侵害なし | yaml 修正は workflow 内のみ、D1 アクセス境界に無関係 | 侵害なし |
| 修正対象ファイルの diff 行数 | `git diff --stat .github/workflows/` | 変更は 6 行（追加 6・削除 6） |
| `.github/workflows/` 以外への侵襲なし | `git diff --stat | grep -v '\.github/workflows'` | 0 件（ドキュメント追加除く） |

## mirror parity（該当なし）

本タスクは `.claude/skills/...` 配下を変更しないため、`.agents/` mirror parity 確認は不要。

## NON_VISUAL 宣言

| 観点 | 内容 |
| --- | --- |
| タスク種別 | NON_VISUAL（CI workflow yaml の参照修正） |
| 非視覚的理由 | UI / UX 変更を含まない infra-fix |
| 代替証跡 | `outputs/phase-11/manual-smoke-log.md`（grep / gh api / gh run 結果。actionlint / yamllint はローカル未導入のため deferred） |
| `screenshots/.gitkeep` | 未作成（NON_VISUAL のため） |


## 統合テスト連携

- 本タスクは GitHub Actions workflow の設定修正であり、アプリケーション統合テストの追加は行わない。
- 代替検証は Phase 4 / Phase 5 / Phase 11 の grep、actionlint、yamllint、GitHub API、GitHub Actions run 確認で担保する。

## 完了条件

- [ ] 全品質チェック項目が PASS
- [ ] NON_VISUAL 宣言が記録されている
- [ ] artifacts 整合が確認されている

## 成果物

- `outputs/phase-09/main.md`
