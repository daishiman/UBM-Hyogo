# Phase 12: 実装ガイド

[実装区分: 実装仕様書]

## 中学生レベル概念説明

このタスクは「**GitHub Actions の設定ファイル（workflow yaml）に、文法ミスがないかを自動チェックする仕組みを全部のファイルに行き渡らせる**」作業です。

- いまは 32 個ある設定ファイルのうち、11 個しか自動チェックされていません
- 残り 21 個に文法ミスがあっても、本番に取り込まれるまで気づけません
- そこで「全部のファイルをチェックする」ように 1 行だけ書き換えます
- 似たツールに `yamllint` がありますが、今回は不要と判断したので使いません。代わりに「使わなかった理由」を文書に残します
- ローカル PC でも同じチェックができるように、手順を別の文書（runbook）にまとめます

## ユビキタス言語

| 用語 | 意味 |
| --- | --- |
| actionlint | GitHub Actions の workflow yaml を検査するツール |
| yamllint | 一般 YAML を検査するツール（本タスクでは不採用） |
| glob | `*.yml` のようなパターンマッチ表記 |
| self-lint | workflow が自身を lint する独立 step |
| runbook | 障害復旧 / 再現手順を集めた文書 |
| topology drift | workflow 構成が無意識に乖離する事象 |

## 実装ステップ詳細

### Step 1: ローカル先行検査

```bash
# actionlint をバージョン固定でインストール
bash <(curl -sS https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash) 1.7.7

# 全件検査
./actionlint -color .github/workflows/*.yml
```

error が出た場合は該当 workflow を**最小差分で**修正し、commit を分離する。

### Step 2: ci.yml の glob 化

`Edit` ツールで `.github/workflows/ci.yml` の line 46-50 を Phase 5 の After 形に置換。

### Step 3: runbook 作成

`docs/30-workflows/runbooks/workflow-lint-local-recovery.md` を新規作成。Phase 5 のセクション構成に従う。

### Step 4: yamllint 不採用記録

`docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/outputs/phase-02/yamllint-decision.md` を新規作成。Phase 2 の評価表を貼付して「不採用」を明示。

### Step 5: smoke 実行

Phase 11 の SM1〜SM3 をローカルで実行。

### Step 6: push / PR (Phase 13 で実施)

## Phase 12 strict 7

| File | 目的 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 サマリ |
| `outputs/phase-12/implementation-guide.md` | 実装ガイド |
| `outputs/phase-12/system-spec-update-summary.md` | aiworkflow 正本同期 |
| `outputs/phase-12/documentation-changelog.md` | ドキュメント変更履歴 |
| `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出 |
| `outputs/phase-12/skill-feedback-report.md` | skill feedback |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 9 heading compliance |

## implementation-guide.md (PR 本文素材)

PR 本文には次を必ず含めること:

```markdown
## Summary
- `.github/workflows/ci.yml` の actionlint を 9 件列挙から `*.yml` glob に拡張し、全 32 workflow を CI で検査
- yamllint は不採用とし、理由を `docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/outputs/phase-02/yamllint-decision.md` に固定
- ローカル復旧手順を `docs/30-workflows/runbooks/workflow-lint-local-recovery.md` に新設

## Test plan
- [x] `./actionlint -color .github/workflows/*.yml` ローカル exit 0
- [ ] CI 上で `workflow-shell-lint` job success（PR push 後の runtime evidence）
- [x] `verify-gate-metadata.yml` / `audit-correlation-verify.yml` 自己 lint 残置確認

Refs #290, Refs UT-CICD-DRIFT
```

## 完了条件

- [ ] Phase 12 strict 7 がすべて存在する
- [ ] root/output `artifacts.json` が一致する
- [ ] aiworkflow-requirements の quick-reference / resource-map / task-workflow-active / deployment-gha / artifact inventory / lessons / changelog が同一 wave で同期されている
- [ ] `workflow_state` は `implemented_local_evidence_captured`、verdict は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` として一貫している

## タスク100%実行確認【必須】

- [ ] compliance check の Required Sections 1-9 が揃っている
- [ ] `PASS` 単独表記ではなく状態語彙つきで判定している
