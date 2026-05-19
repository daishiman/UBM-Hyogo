# Phase 12 — Implementation Guide

## Part 1: 中学生レベルの概念説明

### なぜ必要か

このプロジェクトには「skill 仕様書のしおり」を機械が作り直す仕組みがある。しおりだけ古いままだと、作業する人や AI が古い場所を見て、間違った手順で進めてしまう。

たとえば、学校の図書室で本棚の場所を変えたのに、入口の案内図だけ古いままだと、みんなが前の棚を探して迷う。ここでいう「しおり」は入口の案内図と同じで、古くなったら機械で作り直し、手でこっそり直さないことが大事。

### 何をするか

本タスクでは、案内図が古くなったときにどこを見て、どの順番で直すかを `lefthook-operations.md` にまとめる。push 前の自動チェックで止まった場合と、GitHub 上のチェックで止まった場合の両方を、同じ場所から復旧できるようにする。

### 専門用語セルフチェック

| 専門用語 | 日常語での言い換え |
| --- | --- |
| index | 案内図、しおり |
| generator | 案内図を作り直す係 |
| drift | 案内図と実際の本棚のズレ |
| pre-push hook | 提出前に先生が確認する仕組み |
| CI gate | GitHub 上でもう一度確認する仕組み |
| status context | チェック結果につく名前 |
| SOP | 困ったときの手順書 |

## Part 2: 技術者向け実装ガイド

### Current Contract

| 項目 | 現状 |
| --- | --- |
| CI workflow | `.github/workflows/verify-indexes.yml` |
| CI trigger | `push` to `main`, `pull_request` to `main` / `dev` |
| CI check / job name | `verify-indexes-up-to-date` |
| pre-push hook | `lefthook.yml` `pre-push.indexes-drift-guard` |
| hook script | `scripts/hooks/indexes-drift-guard.sh` |
| rebuild command | `mise exec -- pnpm indexes:rebuild` |
| monitored path | `.claude/skills/aiworkflow-requirements/indexes` |

Screenshot evidence: N/A. This is an implementation / NON_VISUAL workflow with no UI/UX change, no browser-rendered target, and no `outputs/phase-11/screenshots/` directory required.

### Implementation Delta

1. `docs/00-getting-started-manual/lefthook-operations.md` に `## skill indexes drift gate — trigger 条件と復旧 SOP` を追加する。
2. `lefthook.yml` の `indexes-drift-guard.fail_text` に runbook 詳細リンクを 1 行追加する。
3. `.github/workflows/verify-indexes.yml` は変更しない。`scripts/hooks/indexes-drift-guard.sh` は実行ロジックを維持し、ユーザー向け復旧コマンド表記だけを SOP と同じ `mise exec -- pnpm indexes:rebuild` に統一する。

### Interface / Type Definition

```ts
type VerifyIndexesTrigger = {
  workflow: ".github/workflows/verify-indexes.yml";
  statusContext: "verify-indexes-up-to-date";
  pushBranches: ["main"];
  pullRequestBranches: ["main", "dev"];
  monitoredPath: ".claude/skills/aiworkflow-requirements/indexes";
};

type RecoverySop = {
  prePushRejected: ["mise exec -- pnpm indexes:rebuild", "git status", "git add", "git commit", "git push"];
  ciFailed: ["git pull --rebase", "mise exec -- pnpm indexes:rebuild", "git status", "git add", "git commit", "git push"];
};
```

### CLI Signature / Usage

```bash
mise exec -- pnpm indexes:rebuild
git status .claude/skills/aiworkflow-requirements/indexes
git add .claude/skills/aiworkflow-requirements/indexes
git commit -m "chore(indexes): rebuild aiworkflow-requirements indexes"
git push
```

### Error Handling / Edge Cases

| ケース | 対処 |
| --- | --- |
| pre-push hook が drift を検出 | SOP A に従い rebuild 結果を別 commit にする |
| hook を bypass して CI が fail | SOP B に従い `git pull --rebase` 後に rebuild する |
| `pnpm indexes:rebuild` が失敗 | index を手編集せず、generator / 依存関係の失敗として扱う |
| `--no-verify` を使いたくなる | hook 未配置・依存不備を直す。復旧目的の bypass は禁止 |
| branch protection context の混同 | workflow / job name の `verify-indexes-up-to-date` を required context として扱う |

### Configuration Constants

| 定数 | 値 |
| --- | --- |
| `INDEXES_PATH` | `.claude/skills/aiworkflow-requirements/indexes` |
| `WORKFLOW_PATH` | `.github/workflows/verify-indexes.yml` |
| `CHECK_NAME` | `verify-indexes-up-to-date` |
| `RUNBOOK_PATH` | `docs/00-getting-started-manual/lefthook-operations.md` |
| `HOOK_SCRIPT` | `scripts/hooks/indexes-drift-guard.sh` |

## 完了条件

- `lefthook-operations.md` に trigger 条件、SOP A/B、手編集禁止、`--no-verify` 禁止がある。
- `lefthook.yml` の fail_text から runbook へ辿れる。
- Phase 10 AC 検証コマンドが全件成功する。
- Phase 12 strict 7 files と root/output `artifacts.json` が存在する。
- commit / push / PR はユーザー承認まで実行しない。
