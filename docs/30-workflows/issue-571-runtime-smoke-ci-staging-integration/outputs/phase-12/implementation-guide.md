# Implementation Guide

## Part 1: 中学生レベル

学校の避難訓練を考える。校舎が本当に火事になってから逃げ道を初めて確認すると危ないので、ふだんから「ベルが鳴ったら、決まった道を通って、集合場所に行けるか」を練習する。今回の runtime smoke CI も同じで、本番に近い練習場所へ新しい版を出したあと、機械が自動で「入口がちゃんと開くか」を確かめる。

なぜ必要か。手で確認するだけだと、忙しい日に忘れたり、人によって確認する場所が変わったりする。自動確認にすると、毎回同じ順番で、同じ場所を、同じ基準で見られる。失敗したときだけ知らせれば、成功している日の通知で作業者を疲れさせずにすむ。

何をするか。GitHub Actions という自動係が、練習用の環境に新しい版が出たあとで `/admin/members` と `/me` 系の入口をたたく。結果は合格・不合格、件数、確認した約束だけを短く残す。パスワードのような秘密、Cookie、Bearer は残さない。失敗したときだけ Slack に短い知らせを送る。

### 専門用語セルフチェック

| 用語 | 日常語での言い換え |
| --- | --- |
| CI / GitHub Actions | 自動で確認してくれる係 |
| smoke test | 入口だけを短く確かめる点検 |
| staging | 本番前の練習場所 |
| secret | 人に見せてはいけない合言葉 |
| artifact | 確認結果を入れておく記録箱 |
| workflow_call | 別の自動係を同じ流れの中で呼ぶ仕組み |
| redaction | 見せてはいけない文字を黒塗りすること |

## Part 2: 技術者レベル

Current cycle classification: `implemented-local`（実装ファイル + local PASS 5 点取得済み、staging 実行は G1-G4 承認待ち）。

### 本サイクル変更ファイル

| 種別 | パス |
| --- | --- |
| 新規 | `.github/workflows/runtime-smoke-staging.yml` |
| 編集 | `.github/workflows/backend-ci.yml`（`runtime-smoke-staging` reusable workflow call 追記） |
| 編集 | `scripts/smoke/runtime-attendance-provider.sh`（`--out-dir` / `--ci-summary` 追加・後方互換維持） |
| 新規 | `scripts/smoke/ci-summary-post.sh` |
| 新規 | `scripts/smoke/__tests__/redact.test.sh` |
| 新規 | `scripts/smoke/__tests__/runtime-attendance-provider.test.sh` |
| 新規 | `scripts/smoke/__tests__/ci-summary-post.test.sh` |
| 新規 | `docs/40-architecture/adr/ADR-runtime-smoke-secret-injection.md` |
| 新規 | `docs/40-architecture/adr/ADR-runtime-smoke-required-status-check.md` |
| 新規 | `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/operations/setup-github-environment.md` |

### Local PASS 5 点

| Gate | 結果 | Evidence |
| --- | --- | --- |
| typecheck | PASS | `outputs/phase-11/evidence/typecheck.log` |
| lint | PASS | `outputs/phase-11/evidence/lint.log` |
| test (T-1/T-4/T-5/T-6) | PASS | `outputs/phase-11/evidence/test.log` |
| grep-gate (`set -x` 禁止) | 0 hit | `outputs/phase-11/evidence/grep-gate.log` |
| redaction grep gate (local fixture) | 0 hit | `outputs/phase-11/evidence/artifact-redaction-grep.log` |

build は本タスクが apps/* の TypeScript 出力に影響を与えないため typecheck で代替（`build.log` 参照）。

### Runtime command contract

```bash
bash scripts/smoke/runtime-attendance-provider.sh staging --out-dir ci-evidence --ci-summary
```

Inputs:

| Env | Scope |
| --- | --- |
| `STAGING_API_BASE` | GitHub Environment `staging-runtime-smoke` |
| `STAGING_ADMIN_BEARER` | GitHub Environment `staging-runtime-smoke` |
| `STAGING_MEMBER_ID` | GitHub Environment `staging-runtime-smoke` |
| `STAGING_ME_BEARER` | GitHub Environment `staging-runtime-smoke` |
| `SLACK_WEBHOOK_INCIDENT` | GitHub Environment `staging-runtime-smoke`, failure step only |

Outputs:

| File | Content |
| --- | --- |
| `ci-evidence/runtime-smoke.log` | redacted status / route contract / count summary |
| `ci-evidence/summary.json` | status, route summaries, counts, failure reason class |

### Error handling

- Missing required env exits `2` and records env names only.
- Runtime route failure exits `1`, uploads artifact via `if: always()`, and allows failure-only Slack post.
- `ci-summary-post.sh` does not post when `summary.json` is absent; it exits `1` so the failed CI remains visible.
- `set -x`, `bash -x`, and `set -o xtrace` are forbidden by grep gate.

### Runtime path x evidence

| Runtime path | Evidence | Status in current cycle |
| --- | --- | --- |
| local docs validation | Phase 12 strict 7 files, grep gates | ✅ present |
| implementation local tests | `outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log` | ✅ obtained this cycle |
| staging GitHub Actions run | `workflow-run-summary.md`, artifact URL, redaction grep | ⏳ pending G1-G4 approval |
| Slack failure injection | `slack-failure-injection.md` | ⏳ pending G1-G4 approval |
