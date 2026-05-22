# Phase 5: 実装計画（変更対象ファイルと関数シグネチャ / I/O 契約）

## 目的

本サイクルの実装を 1 PR で完了させるための変更対象ファイルを確定し、各ファイルの追加 / 編集箇所・主要 step の引数・I/O 契約・副作用・エラーハンドリングを表形式で確定する。Phase 6（実装手順）と Phase 7（テスト計画）が直接実装に着手できる粒度まで分解する。

## 完了条件

- [ ] 変更対象ファイル一覧（編集 / 新規 / 参照）が確定し、各ファイルの責務が単一責務原則で分離されている
- [ ] `.github/workflows/cf-audit-log-monitor.yml` の env / steps 差分（before / after）と post-step 3 種の挿入位置が確定している
- [ ] `.github/workflows/cf-audit-log-7day-summary.yml` の jobs / steps と引数が確定している
- [ ] aggregation 出力 JSON の必須 field が TypeScript 型として確定している（`expectedSnapshots: 168`、`actualSnapshots`、`fallbackRateMean`、`leakageHits`、`issuesOpenedTotal` 等）
- [ ] D1 schema 変更を **行わない**（forward-safe 前提）ことが明記されている
- [ ] CONST_005 必須項目（変更対象 / 関数シグネチャ / 入出力 / 副作用 / エラーハンドリング / DoD 接続 / ローカル実行コマンド）を満たす

## 前 Phase 依存

- Phase 4: Gate 通過 / 環境準備 / production D1 列確認 / artifact runner 前提

## 5-1. 変更対象ファイル一覧

| 種別 | パス | 責務 |
| --- | --- | --- |
| 編集 | `.github/workflows/cf-audit-log-monitor.yml` | production env block で `vars.CF_AUDIT_CLASSIFIER` 参照、hourly job 末尾に 3 つの post-step を追加（leakage grep / fallback alert / artifact upload） |
| 新規 | `.github/workflows/cf-audit-log-7day-summary.yml` | 7 日 1 回 + workflow_dispatch で 168 hourly snapshots を集約し PR 起票 |
| 参照のみ | `scripts/cf-audit-log/observation/post-switch-monitor.ts` | `--aggregate --input <dir> --out <json>` 呼び出し（既存。改修不要） |
| 参照のみ | `scripts/cf-audit-log/observation/fallback-rate-alert.ts` | `--threshold 0.05 --consecutive-hours 3` 呼び出し（既存） |
| 参照のみ | `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts` | `--exit-on-detect` 呼び出し（既存） |
| 編集 | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 7 日観測手順 + `pass_runtime_synced` 昇格条件を追記 |
| 編集 | `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | `pass_runtime_synced` 状態定義 + canonical evidence path |
| 編集 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 親 #549 entry を `pass_runtime_synced`（D+7 で実反映）|
| 編集 | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-13.md` | legacy stub 注記の昇格文言 |
| 新規（D+7） | `outputs/phase-11/evidence/hourly-run-7day.md` | run URL 一覧 + 集計サマリ |
| 新規（D+7） | `outputs/phase-11/evidence/hourly-run-7day-summary.json` | aggregation 出力 |
| 新規（D+7） | `outputs/phase-11/evidence/leakage-grep-7day.log` | 168 hour leakage grep 集約 |
| 新規（D+7） | `outputs/phase-11/evidence/issue-rate-comparison.md` | baseline 比較 |

> review fix: Phase 2 調査で `expectedSnapshots` / `actualSnapshots` と skeleton metrics gate が未実装と判明したため、`post-switch-monitor.ts` / focused test / `analyze.ts` summary 出力に最小差分を追加した。

## 5-2. workflow YAML 差分（contract）

### 5-2-1. `cf-audit-log-monitor.yml`

```yaml
# Before（抜粋）
jobs:
  monitor:
    runs-on: ubuntu-latest
    env:
      CF_AUDIT_CLASSIFIER: threshold
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: pnpm install --frozen-lockfile
      - run: mise exec -- pnpm tsx scripts/cf-audit-log/analyze.ts

# After（抜粋）
jobs:
  monitor:
    runs-on: ubuntu-latest
    environment: production         # ← env scope 明示（vars.CF_AUDIT_CLASSIFIER 解決のため）
    permissions:
      contents: read
      issues: write                  # ← fallback-rate-alert の Issue 起票用
    env:
      CF_AUDIT_CLASSIFIER: ${{ vars.CF_AUDIT_CLASSIFIER }}
      ML_MODEL_PATH: ${{ secrets.CF_AUDIT_ML_MODEL_PATH_PROD }}
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: pnpm install --frozen-lockfile
      - run: mise exec -- pnpm tsx scripts/cf-audit-log/analyze.ts
      - name: secret leakage grep (post-step / hourly fail on positive)
        run: mise exec -- pnpm tsx scripts/cf-audit-log/evaluation/secret-leakage-grep.ts outputs/cf-audit-log/hourly --exit-on-detect
      - name: fallback rate alert (post-step / Issue open only, do not fail hourly)
        if: always()
        run: mise exec -- pnpm tsx scripts/cf-audit-log/observation/fallback-rate-alert.ts --threshold 0.05 --consecutive-hours 3
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: upload hourly snapshot artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: hourly-snapshot-${{ github.run_id }}
          path: outputs/cf-audit-log/hourly/*.json
          retention-days: 8
```

### 5-2-2. `cf-audit-log-7day-summary.yml`（新規）

```yaml
name: cf-audit-log 7-day summary
on:
  schedule:
    - cron: '0 1 */7 * *'
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write
  actions: read

jobs:
  summarize:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: dev
      - uses: jdx/mise-action@v2
      - run: pnpm install --frozen-lockfile
      - name: download last 7 days hourly snapshots
        run: |
          gh api --paginate "repos/${GITHUB_REPOSITORY}/actions/workflows/cf-audit-log-monitor.yml/runs?per_page=100" \
            --jq '.workflow_runs[] | [.id, .html_url] | @tsv' > run-ids.tsv
          # For each run, download hourly-snapshot-* artifact zip via gh api.
      - name: aggregate 7-day summary
        run: |
          mkdir -p outputs/phase-11/evidence
          mise exec -- pnpm tsx scripts/cf-audit-log/observation/post-switch-monitor.ts \
            --aggregate \
            --input tmp/hourly \
            --expected-snapshots=168 \
            --require-non-skeleton \
            --out outputs/phase-11/evidence/hourly-run-7day-summary.json
      - name: render hourly-run-7day.md
        run: |
          mise exec -- pnpm tsx scripts/cf-audit-log/observation/post-switch-monitor.ts \
            --render-md \
            --input tmp/hourly \
            --summary outputs/phase-11/evidence/hourly-run-7day-summary.json \
            --out outputs/phase-11/evidence/hourly-run-7day.md
      - name: open evidence PR
        uses: peter-evans/create-pull-request@v6
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          base: dev
          branch: chore/issue-586-7day-evidence-${{ github.run_id }}
          title: "chore(cf-audit-log): 7-day evidence (Refs #549, Refs #586)"
          commit-message: "chore: add 7-day post-switch evidence (Refs #549, Refs #586)"
          body: |
            7-day post-switch evidence for ml classifier.
            Refs #549, Refs #586
          add-paths: outputs/phase-11/evidence/**
```

> `--render-md` 引数が `post-switch-monitor.ts` に未実装の場合、Phase 6 でその追加（最小差分 + focused test）を行うか、`hourly-run-7day.md` の生成を簡易な bash の `cat <<EOF` で代替する。Phase 2 調査結果で確定する。

## 5-3. aggregation 出力 JSON contract

```typescript
type SevenDaySummary = {
  windowHours: 168;
  expectedSnapshots: 168;
  actualSnapshots: number;
  fallbackRateMean: number;
  fallbackRateMax: number;
  issuesOpenedTotal: number;
  p95LatencyMedianMs: number;
  leakageHits: number;
  thresholdSnapshots: number;
  mlSnapshots: number;
  generatedAt: string;
  windowStart: string;
  windowEnd: string;
  parentIssueRef: 549;
  selfIssueRef: 586;
};
```

合格条件（D+7 昇格判定）:

- `actualSnapshots === expectedSnapshots`（168）
- `fallbackRateMean <= 0.05`
- `leakageHits === 0`
- `issuesOpenedTotal` が threshold 期 baseline の 1.5 倍以下

## 5-4. ローカル実行コマンド

| 目的 | コマンド |
| --- | --- |
| dependencies | `mise exec -- pnpm install --frozen-lockfile` |
| typecheck | `mise exec -- pnpm typecheck \| tee outputs/phase-11/evidence/typecheck.log` |
| lint | `mise exec -- pnpm lint \| tee outputs/phase-11/evidence/lint.log` |
| focused test | `mise exec -- pnpm vitest run scripts/cf-audit-log/observation/__tests__ scripts/cf-audit-log/__tests__/evaluation.test.ts --reporter=verbose \| tee outputs/phase-11/evidence/test.log` |
| build | `mise exec -- pnpm build \| tee outputs/phase-11/evidence/build.log` |
| leakage grep self-test | `mise exec -- pnpm tsx scripts/cf-audit-log/evaluation/secret-leakage-grep.ts outputs/phase-11/evidence/ --exit-on-detect; echo $?` |
| 7day summary local dry-run | `mise exec -- pnpm tsx scripts/cf-audit-log/observation/post-switch-monitor.ts --aggregate --input <fixture-dir> --window 168 --out /tmp/summary.json` |

## 5-5. エラーハンドリング

| 障害 | 検知 | 挙動 |
| --- | --- | --- |
| `vars.CF_AUDIT_CLASSIFIER` 未設定 | hourly run の env が undefined | `analyze.ts` 側で threshold fallback（既存。本タスクで触らない） |
| artifact upload 失敗 | `actions/upload-artifact@v4` が non-zero | hourly run は fail。1 hour 後に retry。GitHub Actions infra 障害は known boundary |
| 7day summary job の artifact pattern miss | cross-run `gh api` download が 0 件 | aggregation script が `actualSnapshots: 0` を出力。PR 起票はせず exit 1 |
| `peter-evans/create-pull-request@v6` 競合 | 既存 branch あり | branch 名に `${{ github.run_id }}` を付与しているため一意。重複時は workflow run を再起動 |

## 出力

- `outputs/phase-05/main.md`

## 参照資料

- `phase-02.md`（行番号特定結果）/ `phase-03.md`（設計）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |
