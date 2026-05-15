# Implementation Guide — Issue #668 RB-3b-03 / RB-3b-04

## Part 1: 中学生レベル

### なぜ必要か

学校で、体育の授業だけの日に全員が理科室の準備までさせられると、時間がもったいないです。必要な授業の準備だけをすれば、待ち時間を減らせます。

このタスクも同じです。文書だけを直した PR では、重い画面テストを動かさず、かわりに「この PR では重いテストは必要ありません」という軽い合図を出します。そうすると、必須チェックの名前は残したまま、無駄な待ち時間を減らせます。

もう一つの作業は、いろいろな shell script に毎回書いていた共通の下準備を、1 つの下準備ファイルに集めることです。さらに、書き間違いを自動で見つけるチェックも追加します。

### 専門用語セルフチェック

| 用語 | 日常語での説明 |
| --- | --- |
| workflow | 自動で順番に動く作業表 |
| paths filter | 変更された場所を見て、作業を動かすか決めるルール |
| required check | これが OK にならないと PR を進められない確認 |
| shell script | コンピューターに順番に命令する小さな手順書 |
| shellcheck | shell script の書き間違いを見つける道具 |
| context name | GitHub 上で表示されるチェックの名前 |

## Part 2: 技術者レベル

### Scope

| Path | Action | Contract |
| --- | --- | --- |
| `.github/workflows/e2e-tests.yml` | edit | Add `precheck` job, e2e matrix gating, and no-op required context success for irrelevant PRs |
| `.github/workflows/lint-shell.yml` | new | Run `shellcheck --severity=warning --external-sources` for `scripts/**/*.sh` |
| `scripts/lib/ci-shell-prelude.sh` | new | Source-only bash prelude with `gh_notice`, `gh_warning`, `gh_error`, `assert_jq`, `awk_compare_ge` |
| `scripts/coverage-gate-e2e.sh` | edit | Source prelude while preserving `THRESHOLD_FIXTURE`, `SUMMARY`, output wording, and exit-code behavior |
| `scripts/coverage-guard.sh` | edit | Source prelude with existing argument and threshold behavior unchanged |
| `scripts/cf-waf-apply/lib.sh` | edit | Minimal shellcheck cleanup |
| `scripts/observability-target-diff.sh` | edit | Minimal shellcheck cleanup |
| `scripts/verify-09c-no-visual-values.sh` | edit | Minimal shellcheck cleanup |

### API / Signature Contract

```bash
gh_notice "message"
gh_warning "message"
gh_error "message"
assert_jq "file.json" ".jq.expression"
awk_compare_ge "actual" "minimum"
```

### Edge Cases

| Case | Expected handling |
| --- | --- |
| docs-only PR | `e2e-tests.yml` runs precheck; e2e matrix skips; `e2e-tests-coverage-gate` emits no-op success |
| code PR under allowlist | `e2e-tests.yml` runs precheck + e2e matrix + coverage gate |
| mixed PR | same as code PR; no duplicate required context |
| precheck drift | Phase 7 / 11 precheck inventory gate fails |
| missing coverage summary | `coverage-gate-e2e.sh` emits the existing error wording and exits 1 |
| `THRESHOLD_FIXTURE` set | `coverage-gate-e2e.sh` reads fixture summary for 79 / 80 / 81 regression checks |

### Constants

| Constant | Value |
| --- | --- |
| e2e required context | `e2e-tests-coverage-gate` |
| coverage threshold | `80` |
| shellcheck severity | `warning` |
| precheck allowlist entries | 8 |
