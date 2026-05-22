# Implementation Guide

## Part 1: 中学生レベル

この変更は、学校の提出箱に「先生へ渡す前のチェック係」を置くようなものです。たとえば、作文を出す前に友だちが「紙の形式が壊れていないか」「読めない文字がないか」を見てくれると、先生に届いてから大きな手戻りになりにくくなります。

このタスクでは、GitHub に変更を入れる前の自動チェックを増やしました。`post-release-observation-reminder.yml` は、リリース後 7 日目と 30 日目に確認用 Issue を作る仕組みです。この仕組み自体の動きは変えません。代わりに、通常の CI で次を確認します。

- YAML の書き方が壊れていないかを `actionlint` で確認する。
- reminder 用 shell script と、そのテスト用 shell script が壊れていないかを `bash -n`、shell unit、`shellcheck` で確認する。
- 既存 branch protection の required context `ci` でも同じ検査が走るようにする。

### 専門用語セルフチェック

| 用語 | ここでの意味 |
| --- | --- |
| CI | GitHub 上で自動的に実行される確認作業 |
| workflow | GitHub Actions に「いつ、何を実行するか」を書いたファイル |
| YAML | workflow を書くための設定ファイル形式 |
| actionlint | GitHub Actions workflow の書き方を確認するツール |
| shell script | ターミナルで実行する処理をまとめたファイル |
| shellcheck | shell script の危ない書き方を見つけるツール |
| required context | branch protection が merge 前に成功を要求するチェック名 |

## Part 2: 技術者レベル

### 実装

| Path | Change |
| --- | --- |
| `.github/workflows/ci.yml` | `workflow-shell-lint` job を追加 |
| `.github/workflows/ci.yml` | 既存 required context `ci` 内に `pnpm observation:lint` を追加 |
| `.github/workflows/ci.yml` | 既存 readiness step の `$GITHUB_OUTPUT` redirect を quote |
| `package.json` | `observation:lint` script を追加し、shellcheck と actionlint を local 再現対象に含めた |
| `scripts/observation/test/test-create-reminder-issue.sh` | fake `gh` 生成を heredoc 化し、test script も shellcheck clean にした |
| `docs/30-workflows/completed-tasks/ut-350-fu-01-ci-actionlint-shellcheck-gate.md` | consumed trace と consumed status を追加 |
| `.claude/skills/aiworkflow-requirements/references/*` | current facts を同期 |

### Command Signatures

```bash
pnpm observation:lint
bash -n scripts/observation/create-reminder-issue.sh
bash scripts/observation/test/test-create-reminder-issue.sh
shellcheck scripts/observation/*.sh scripts/observation/test/*.sh
actionlint .github/workflows/post-release-observation-reminder.yml .github/workflows/ci.yml
```

### エラーハンドリング

| Failure | Behavior |
| --- | --- |
| bash syntax failure | `pnpm observation:lint` / CI step が non-zero で停止 |
| shell unit failure | test script が `FAIL>0` で non-zero |
| shellcheck warning | CI / local script が non-zero |
| actionlint failure | CI / local script が non-zero |
| actionlint download failure | fallback PASS なし。network/tooling failure として CI を止める |
| unexpected secret literal | `secrets.GITHUB_TOKEN` 以外の `secrets.*` literal を出力して non-zero |

### Edge Cases

| Case | Handling |
| --- | --- |
| local shellcheck 未導入 | `pnpm observation:lint` の前提として shellcheck が必要。CI は apt install する |
| branch protection required contexts | 追加 job 自体を required にする外部 PUT は user-gated。既存 required `ci` 内に gate を組み込んで今回 PR の強制力を確保 |
| reminder workflow runtime | schedule / workflow_dispatch / Issue 作成副作用は変更しない |
| screenshot evidence | `visualEvidence=NON_VISUAL` のため不要 |
| GitHub Actions runtime evidence | PR 後に取得。local static PASS と runtime PASS は混同しない |

### 設定可能パラメータ / 定数

| Name | Owner | Value / Boundary |
| --- | --- | --- |
| `workflow-shell-lint` | `.github/workflows/ci.yml` | dedicated lint evidence job |
| `ci` | `.github/workflows/ci.yml` | existing required context path |
| `OBSERVATION_REPO` | `create-reminder-issue.sh` | default `daishiman/UBM-Hyogo` |
| `INPUT_RELEASE_DATE` | reminder workflow | optional `YYYY-MM-DD` |
| `INPUT_OFFSET_DAYS` | reminder workflow | allowed `7` or `30` |
| `TODAY_OVERRIDE` | tests | deterministic date override |
| allowlisted secret | CI grep | `secrets.GITHUB_TOKEN` only |

### 検証

```bash
pnpm observation:lint
git diff --check
cmp -s docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate/artifacts.json \
  docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate/outputs/artifacts.json
```
