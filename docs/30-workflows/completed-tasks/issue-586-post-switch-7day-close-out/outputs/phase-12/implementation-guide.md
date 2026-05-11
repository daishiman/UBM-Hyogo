# Implementation Guide — Issue #586 post-switch 7-day close-out（Refs #549, Refs #586）

## Part 1（中学生レベル）

「7 日 close-out」って何をするの? — 新しい給食メニュー（ML 判定）に切り替えた直後、いきなり「これでいこう」とは決めずに、1 週間毎時間アンケート（hourly snapshot）を集めて、最後に係（7day summary workflow）が全部集計して「これなら本番採用」のハンコ（`pass_runtime_synced`）を押す儀式です。

| 専門用語 | 中学生むけ言いかえ |
| --- | --- |
| workflow | 自動でやる手順表 |
| artifact | 実行結果として残るファイル |
| retention-days | ファイルを何日保管するか |
| aggregation | ばらばらの情報をまとめる作業 |
| leakage grep | 秘密がうっかり漏れていないかの抜き打ちチェック |
| baseline | 比較するための基準値 |
| forward-safe rollback | 机の位置（D1 列）はそのまま、当番表（GitHub Variables）だけ前のに戻せばすぐ元通り |

なぜ必要か → merge した瞬間ではなく 7 日運用してから本物の OK にしたい（一時的にうまく動いただけかもしれないから）。
何をするか → 毎時間のスナップショットを 168 個集めて集計して、threshold 期と比較して、漏れがないか・反応しすぎていないかをチェックする。

## Part 2（技術者レベル）

### 親 #549 から再掲する不変項目

- `Classifier` interface（`scripts/cf-audit-log/classifier/`）: 本タスクは触らない
- D1 列（`classifier_used` / `classifier_version` / `confidence`）: 本タスクは触らない（forward-safe）
- `secret-leakage-grep.ts` / `fallback-rate-alert.ts` / `post-switch-monitor.ts`: 既存。CLI フラグの呼び出し step 追加に閉じる

### TypeScript 型 — `SevenDaySummary`

```ts
interface SevenDaySummary {
  expectedSnapshots: 168;
  actualSnapshots: number;
  fallbackRateMean: number;
  leakageHits: number;
  issuesOpenedTotal: number;
  p95LatencyMedianMs: number;
  thresholdSnapshots: number;
  mlSnapshots: number;
}
```

### workflow contract

- `cf-audit-log-monitor.yml`（編集）:
  - `environment: production`
  - `permissions: { contents: read, issues: write, actions: write }`
  - job-level `env: { CF_AUDIT_CLASSIFIER: ${{ vars.CF_AUDIT_CLASSIFIER || 'threshold' }}, ML_MODEL_PATH: ${{ vars.ML_MODEL_PATH }}, ... }`
  - 末尾 3 post-step: `secret-leakage-grep.ts --exit-on-detect` / `fallback-rate-alert.ts --threshold=0.05 --window=3` / `actions/upload-artifact@v4 retention-days: 8 name: hourly-snapshot-${{ github.run_id }}`
- `cf-audit-log-7day-summary.yml`（新規）:
  - `schedule: '0 1 */7 * *'` + `workflow_dispatch`
  - cross-run `gh api workflows/cf-audit-log-monitor.yml/runs` で 8 日 window の hourly run を列挙し、各 run の `hourly-snapshot-*` artifact を `gh api .../artifacts/<id>/zip` で取得
  - run id / run URL を `hourly-run-7day.md` に追記
  - `post-switch-monitor.ts --aggregate --input=hourly-merged --expected-snapshots=168 --require-non-skeleton --out=<json>` + `--format=markdown --out=<md>`
  - `EXPECTED_SNAPSHOTS_7DAY=168` と `actualSnapshots` を比較し、不足 / fallbackRateMean > 5% / leakageHits > 0 / mlSnapshots 不足 / skeleton zero metrics のいずれかで exit 1
  - `peter-evans/create-pull-request@v6` で `chore/issue-586-7day-evidence-${{ github.run_id }}` ブランチに base=`dev` の PR 起票

### 設定可能パラメータ

| パラメータ | 値 |
| --- | --- |
| `vars.CF_AUDIT_CLASSIFIER` | `{ threshold, ml }` — production env で `ml` |
| `secrets.CF_AUDIT_ML_MODEL_PATH_PROD` | 1Password 由来 |
| `CF_AUDIT_FALLBACK_RATE_THRESHOLD` | 0.05 |
| `CF_AUDIT_FALLBACK_RATE_CONSECUTIVE_HOURS` | 3（実装は `--window=3` で同義） |
| `EXPECTED_SNAPSHOTS_7DAY` | 168（`workflow_dispatch.inputs.window_hours` で上書き可） |

### エラーハンドリング

| 事象 | 挙動 |
| --- | --- |
| artifact upload 失敗 | hourly run fail。1 hour 後に retry |
| leakage grep positive | hourly run fail（`--exit-on-detect`）+ Issue 削除 + token revoke runbook |
| fallback rate 連続超 | Issue 起票（hourly run は fail させない、`|| true` で継続） |
| 7day summary `actualSnapshots < 168` / fallbackRateMean > 5% / leakageHits > 0 / skeleton zero metrics | aggregate step が exit 1 → PR 起票せず → 再観測または rollback |

### runtime path × evidence

| runtime path | evidence | 取得サイクル |
| --- | --- | --- |
| hourly classifier path | `evidence/test.log` + 168 hourly artifact | 本サイクル + 7 日 |
| hourly leakage grep post-step | `evidence/grep-gate.log`（local）+ hourly run の log | 本サイクル + 7 日 |
| hourly fallback alert post-step | `evidence/test.log`（local）+ Issue 起票履歴 | 本サイクル + 7 日 |
| 7day summary workflow | dry-run の workflow run URL + D+7 evidence PR | merge 後 D+0 + D+7 |

### forward-safe rollback の 1 step

```
gh variable set CF_AUDIT_CLASSIFIER --env production --body "threshold"
```

または gh 2.20 系では:

```
gh api -X PATCH repos/daishiman/UBM-Hyogo/environments/production/variables/CF_AUDIT_CLASSIFIER \
  -f name=CF_AUDIT_CLASSIFIER -f value=threshold
```

D1 列は削除しない。workflow YAML の post-step 単独 disable が必要なら revert PR を出す。
