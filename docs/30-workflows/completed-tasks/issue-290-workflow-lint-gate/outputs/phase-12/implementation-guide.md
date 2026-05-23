# Implementation guide

## Part 1: 中学生レベル

なぜ必要かを先に説明します。GitHub Actions の設定ファイルは、自動でテストやデプロイを動かすための約束表です。この約束表に書き間違いがあると、いざ本番で自動処理を動かした時に止まります。前は一部のファイルだけを手で選んで確認していたので、新しく増えたファイルが確認から漏れる危険がありました。

たとえば、学校で32人分の提出物を確認する時に、先生が名簿の一部だけを手書きでメモして見るようなものです。新しい転校生が増えてもメモを直し忘れると、その人の提出物は見落とされます。今回の変更は、手書きメモをやめて「このクラス全員」という選び方に変える作業です。

何をするかというと、`.github/workflows/` にある 32 個の設定ファイルをまとめて全部確認します。`actionlint` という確認道具を使い、GitHub Actions ならではの書き方まで見ます。似た道具の `yamllint` は今回は使いません。普通の YAML としての見た目より、GitHub Actions として本当に動くかを確認する方が大事だからです。

### 今回作ったもの

| 作ったもの | 説明 |
| --- | --- |
| 全件確認の入口 | `.github/workflows/*.yml` で 32 個の設定ファイルをまとめて選ぶ |
| ローカル再現コマンド | `pnpm observation:lint` で手元でも同じ確認を実行できる |
| 復旧手順書 | `docs/30-workflows/runbooks/workflow-lint-local-recovery.md` |
| 採否記録 | `yamllint` を使わない理由を `outputs/phase-02/yamllint-decision.md` に保存 |

## Part 1 self-check

| 用語 | 説明 |
| --- | --- |
| workflow | GitHub Actions の自動処理設定 |
| actionlint | workflow 専用の文法チェック道具 |
| glob | `*.yml` のように複数ファイルをまとめて選ぶ書き方 |
| runbook | 困った時に同じ手順で復旧するための手順書 |
| runtime_pending | ローカル確認は終わり、GitHub 上の実行確認だけが残っている状態 |

## Part 2: 技術者レベル

### 型定義

```ts
type WorkflowLintGateState = {
  actionlintVersion: "1.7.7";
  workflowGlob: ".github/workflows/*.yml";
  workflowCount: 32;
  localCommand: "pnpm observation:lint";
  workflowState: "implemented_local_evidence_captured";
  verdict: "PASS_BOUNDARY_SYNCED_RUNTIME_PENDING";
};
```

### CLIシグネチャ

```bash
bash <(curl -sS https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash) 1.7.7
./actionlint -color .github/workflows/*.yml
pnpm observation:lint
node .claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js --workflow docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate --check-existence
node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate
```

### 使用例

```bash
# repo root
pnpm observation:lint

# direct actionlint reproduction
tmpdir=$(mktemp -d)
curl -sS https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash -o "$tmpdir/download-actionlint.bash"
(cd "$tmpdir" && bash download-actionlint.bash 1.7.7 >/dev/null)
"$tmpdir/actionlint" -color .github/workflows/*.yml
```

### エラーハンドリング

| 失敗 | 対応 |
| --- | --- |
| `actionlint` が workflow path と行番号を出す | 該当 workflow を最小修正し、`pnpm observation:lint` を再実行する |
| shellcheck が workflow 内 shell snippet を指摘する | 変数未使用、redirect quote、複数 echo redirect などを既存動作を変えずに修正する |
| download script が失敗する | network / GitHub raw 取得を確認し、runbook の復旧手順で再試行する |
| GitHub Actions runtime が未取得 | commit / push / PR が user-gated のため、Phase 13 evidence として扱う |

### エッジケース

| ケース | 判断 |
| --- | --- |
| `.github/workflows/*.yaml` が追加された | 現状 0 件。本タスクの AC は `.yml` 32 件なので別タスクまたは同 wave 仕様変更で扱う |
| yamllint を追加したい | GitHub Actions 固有表現でノイズが出やすいため、本タスクでは不採用。採用するなら別途 decision を更新する |
| branch protection required context を変える | repository governance mutation なので user approval 後に実施する |
| runtime GitHub Actions evidence | PR 作成後に `gh pr checks` などで取得する。ローカル PASS と混同しない |

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| actionlint version | `1.7.7` |
| workflow target | `.github/workflows/*.yml` |
| current workflow count | `32` |
| local reproduction command | `pnpm observation:lint` |
| primary CI owner | `.github/workflows/ci.yml` / `workflow-shell-lint` |
| visual evidence | `NON_VISUAL` |

### テスト構成

| テスト | コマンド | 期待 |
| --- | --- | --- |
| actionlint all workflows | `./actionlint -color .github/workflows/*.yml` | exit 0 |
| local reproduction | `pnpm observation:lint` | exit 0、shell unit 13 PASS |
| Phase 11 manifest | `node .claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js --workflow docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate --check-existence` | exit 0 |
| Phase 12 guide | `node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate` | exit 0 |
| artifacts parity | `cmp -s docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/artifacts.json docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/outputs/artifacts.json` | exit 0 |

## User gate

Commit, push, PR creation, branch protection changes, and GitHub Actions runtime evidence are not executed without explicit user approval.
