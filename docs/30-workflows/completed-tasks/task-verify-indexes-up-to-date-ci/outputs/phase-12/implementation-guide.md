# Implementation Guide

## Part 1: 中学生レベル

検索用の目次ファイルが古いままだと、全員が古い答え合わせ表を見て作業することになる。
このタスクでは、GitHub の自動係が「目次ファイルは最新か」を毎回確認し、ズレていたら赤信号で止める。

| 専門用語 | 言い換え |
| --- | --- |
| GitHub Actions | GitHub の中で動く自動係 |
| workflow | 自動係へのお仕事リスト |
| CI gate | 合格しないと進めない関門 |
| drift | そろっているべきものがズレた状態 |
| indexes | 検索を速くする目次ファイル |

## Part 2: 技術詳細

### Workflow Contract

```ts
interface VerifyIndexesWorkflow {
  workflowFile: ".github/workflows/verify-indexes.yml";
  workflowName: "verify-indexes-up-to-date";
  jobId: "verify-indexes-up-to-date";
  monitoredPath: ".claude/skills/aiworkflow-requirements/indexes";
  commands: ["pnpm indexes:rebuild", "git add -N <indexes>", "git diff --exit-code -- <indexes>"];
}
```

### API Signature

```bash
pnpm indexes:rebuild
git add -N .claude/skills/aiworkflow-requirements/indexes
git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes
```

### Parameters

| パラメータ | 値 |
| --- | --- |
| Node | 24 |
| pnpm | 10.33.2 |
| monitoredPath | `.claude/skills/aiworkflow-requirements/indexes` |
| secrets | なし |

### Error Handling

diff が出た場合は `::error::index drift detected`、`git diff --name-only`、`git status --short` を出力して exit 1。
post-merge hook 復活や monorepo 全体 diff は行わない。
