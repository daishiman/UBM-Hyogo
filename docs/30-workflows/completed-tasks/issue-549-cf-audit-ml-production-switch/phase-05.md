# Phase 5: 実装計画（変更対象ファイルと関数シグネチャ / I/O 契約）

## 目的

production switch を 1 PR で完了させるための変更対象ファイルを確定し、各ファイルの追加 / 編集箇所・主要関数シグネチャ・I/O 契約・副作用・エラーハンドリングを表形式で確定する。Phase 6（実装手順）と Phase 7（テスト計画）が直接実装に着手できる粒度まで分解する。

## 完了条件

- [ ] 変更対象ファイル一覧（編集 / 新規 / 参照）が確定し、各ファイルの責務が単一責務原則で分離されている
- [ ] `.github/workflows/cf-audit-log-monitor.yml` の env 差分（before / after）と post-step 3 種の挿入位置が確定している
- [ ] `scripts/cf-audit-log/observation/post-switch-monitor.ts` / `fallback-rate-alert.ts` の関数シグネチャ・入出力・副作用・エラーハンドリングが確定している
- [ ] D1 schema 変更を **行わない**（forward-safe 前提）ことが明記されている
- [ ] rollback 用 PR テンプレートと 7 日 observation checklist の出力先（後続 Phase 12）が確定している
- [ ] CONST_005 必須項目（変更対象 / 関数シグネチャ / 入出力 / 副作用 / エラーハンドリング / DoD 接続）を満たす

## 前 Phase 依存

- Phase 4: Gate-A〜C 通過 / production D1 0016 列確認 / `ML_MODEL_PATH` 解決確認 / threshold 期 baseline 取得

## 5-1. 変更対象ファイル一覧

| 種別 | パス | 責務 |
| --- | --- | --- |
| 編集 | `.github/workflows/cf-audit-log-monitor.yml` | production env で `CF_AUDIT_CLASSIFIER=ml` / `ML_MODEL_PATH` を設定。post-step 3 種（leakage grep / post-switch-monitor / fallback-rate-alert）を追加 |
| 新規 | `scripts/cf-audit-log/observation/post-switch-monitor.ts` | hourly JSON snapshot 集計（4 観測軸）。stdout または `--out=<path>` で書き出し |
| 新規 | `scripts/cf-audit-log/observation/fallback-rate-alert.ts` | 直近 N hour の hourly snapshot を集計し、fallback rate > 0.05 を 3 hour 連続で観測した場合 GitHub Issue を起票 |
| 新規 | `scripts/cf-audit-log/observation/__tests__/post-switch-monitor.test.ts` | post-switch-monitor の focused unit test（fixture ベース） |
| 新規 | `scripts/cf-audit-log/observation/__tests__/fallback-rate-alert.test.ts` | fallback-rate-alert の閾値判定 / Issue 起票 mock test |
| 編集 | `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts` | 必要なら `--exit-on-detect` フラグを追加（既存挙動はデフォルト維持） |
| 編集 | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 7 日観測手順 / forward-safe rollback 3 step / artifact 候補列挙を追記 |
| 編集 | `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | production switch 手順・4 観測軸・alert 閾値を SSOT 同期 |
| 編集 | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | `ML_MODEL_PATH` の op 参照 / `CLOUDFLARE_API_TOKEN` 注入経路を SSOT 同期 |
| 参照 | `scripts/cf.sh` | model artifact 配布 / D1 list の wrapper（既存・拡張なし想定） |
| 参照 | `scripts/cf-audit-log/classifier/{ml,index}.ts` | env 切替の解釈経路（変更なし。Issue #515 の正本維持） |
| 参照 | `apps/api/migrations/0016_cf_audit_log_classification.sql` | D1 列の forward-safe 性確認（変更しない） |

## 5-2. workflow yml の env / step 差分仕様

### 5-2-1. env 差分（production env block）

before:

```yaml
env:
  CF_AUDIT_CLASSIFIER: threshold
  # ML_MODEL_PATH: 未設定
```

after:

```yaml
env:
  CF_AUDIT_CLASSIFIER: ml
  ML_MODEL_PATH: ${{ vars.ML_MODEL_PATH }}    # op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD の参照文字列のみ。解決値は保存しない
```

> staging / local では `CF_AUDIT_CLASSIFIER` を従来通り未設定または `threshold` とし、production env block にのみ `ml` を設定する。env scope の混在を避けるため、production 専用の env をジョブ条件 (`if: github.ref == 'refs/heads/main'`) で分岐するか、`environment: production` を明示する。

### 5-2-2. post-step 3 種（hourly run 末尾に挿入）

| 順序 | step 名 | 実行内容 | 失敗時挙動 |
| --- | --- | --- | --- |
| 1 | `secret-leakage-grep` | `pnpm tsx scripts/cf-audit-log/evaluation/secret-leakage-grep.ts <hourly-issue-bodies> --exit-on-detect` | exit 1 で hourly run を fail |
| 2 | `post-switch-monitor` | `pnpm tsx scripts/cf-audit-log/observation/post-switch-monitor.ts --hour=$(date -u +%Y-%m-%dT%H:00:00Z) --out=outputs/observation/$(date -u +%Y-%m-%dT%H).json` | exit 1（観測欠落として fail） |
| 3 | `fallback-rate-alert` | `pnpm tsx scripts/cf-audit-log/observation/fallback-rate-alert.ts --window=3 --threshold=0.05` | exit 0 が原則（Issue 起票は副作用）。例外時のみ exit 1 |

artifacts のアップロードは `actions/upload-artifact@v4` で `outputs/observation/*.json` を hourly に保存。

## 5-3. `post-switch-monitor.ts` 仕様

```ts
// scripts/cf-audit-log/observation/post-switch-monitor.ts
export interface HourlySnapshot {
  hour: string;                    // ISO8601 (UTC, top of hour)
  classifierUsed: 'threshold' | 'ml';
  classifierVersion: string;
  totalEvents: number;
  issuesOpenedThisHour: number;
  fallbackRate: number;            // 0..1
  p95LatencyMs: number;
  leakageGrepResult: 'clean' | 'dirty';
  previousThresholdBaseline: {
    issuesPerHourMean: number;
    issuesPerHourStdev: number;
  };
}

export interface MonitorOptions {
  readonly hour: string;
  readonly out?: string;           // 未指定時は stdout
  readonly d1Database: string;     // 'ubm-hyogo-db-prod'
  readonly env: 'staging' | 'production';
}

export async function collectHourlySnapshot(opts: MonitorOptions): Promise<HourlySnapshot>;
export async function writeSnapshot(snapshot: HourlySnapshot, out: string | undefined): Promise<void>;
```

- 入力: D1 hourly query の結果（`bash scripts/cf.sh d1 execute --json` 経由）+ leakage grep の前段結果（環境変数 `LEAKAGE_GREP_RESULT`）
- 出力: `HourlySnapshot` JSON
- 副作用: `--out=<path>` 指定時のみ `fs.writeFile`。なければ `process.stdout.write`
- エラー: D1 タイムアウトは 3 回 retry 後 throw（hourly run を fail）。snapshot 一部欠落時は `null` を埋めず throw

## 5-4. `fallback-rate-alert.ts` 仕様

```ts
export interface AlertOptions {
  readonly window: number;          // hours, default 3
  readonly threshold: number;       // default 0.05
  readonly snapshotsDir: string;    // 既定 'outputs/observation'
  readonly githubToken: string;     // env GITHUB_TOKEN
  readonly repo: string;            // 'daishiman/UBM-Hyogo'
}

export async function evaluateAndAlert(opts: AlertOptions): Promise<{
  triggered: boolean;
  issueUrl?: string;
}>;
```

- 入力: 直近 N hour の `HourlySnapshot` JSON 群
- 判定: 連続 N hour すべてで `fallbackRate > threshold` の場合のみ trigger
- 副作用: trigger 時に `gh api` または `@octokit/rest` で `type:incident` / `priority:high` ラベル付き Issue を起票。Issue body には直近 N snapshot を貼り、`secret-leakage-grep` で pre-redact
- エラー: GitHub API 5xx は 3 回 retry。最終 fail 時は exit 1（hourly run を fail させ、欠落を後続で検知できるように）

## 5-5. `secret-leakage-grep.ts` 拡張

| 追加フラグ | 意味 |
| --- | --- |
| `--exit-on-detect` | hit 1 件以上で exit 1（既定挙動も exit 1。明示 contract 用フラグ） |
| `--stdin` | stdin から入力を読み取り、一時ファイルとして scan |
| `--count-only` | JSON ではなく hit 件数のみ stdout に出力 |

既存検出パターン（生 IP / 完全 UA / メール / Token 形式）はそのまま。互換維持のため hit 時 exit 1 は維持し、入力形態だけを拡張する。

## 5-6. D1 schema 変更ポリシー

本タスクでは **D1 migration を新規作成しない**。理由:

- forward-safe rollback の前提として、Issue #515 で追加済みの `classifier_used` / `classifier_version` / `confidence` を残置することが運用ポリシー
- 列削除や追加 index の変更は別 migration（別タスク）として切り出す
- staging で `bash scripts/cf.sh d1 migrations list` を再走し、production と staging の schema 同一性のみ確認する

## 5-7. rollback 用 PR テンプレート（新規 doc）

`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` 末尾に Markdown sub-section として追記。本サイクル外で別ファイル化はしない。

```markdown
### Rollback PR テンプレ（CF Audit ML production switch）

- title: `revert(cf-audit): rollback CF_AUDIT_CLASSIFIER to threshold (Refs #549)`
- env diff: `CF_AUDIT_CLASSIFIER: ml` → `threshold` のみ
- D1: 列削除しない（forward-safe）
- 承認: rollback approval/governance evidence（緊急時 self-merge 可、事後 audit）
- 確認: 1 hourly run 後に Issue 起票数 / fallback rate が baseline へ回帰
```

## 5-8. 7 日 observation checklist（Phase 12 で生成する後続資産）

`outputs/phase-12/implementation-guide.md` 内の「post-switch observation checklist」セクションとして扱う。strict 7 files 以外の Phase 12 別名 output は作らない:

- 7 日間の hourly JSON snapshot 168 件すべての存在確認
- 日次サマリ 7 件（`day-{1..7}.md`）の作成
- 終端サマリ（`summary-7day.md`）に Issue 起票数 / fallback rate / p95 latency / leakage grep 4 軸の判定を記載
- いずれかが over の場合 rollback PR を作成

## Handoff（Phase 6 へ渡す入力）

- 変更対象ファイル一覧（編集 / 新規 / 参照）
- workflow yml の env 差分と post-step 3 種の擬似 YAML
- `post-switch-monitor.ts` / `fallback-rate-alert.ts` の関数シグネチャ
- `secret-leakage-grep.ts` への `--exit-on-detect` 拡張点
- D1 migration を新規作成しない方針
- rollback PR テンプレ草案

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 参照資料

- `index.md` ・ `phase-03.md` ・ `phase-04.md`
- `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/phase-04.md`（I/O 契約の親仕様）
- `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/outputs/phase-12/implementation-guide.md`

## 実行タスク

| Task | 内容 |
| --- | --- |
| 05-1 | D1 classifier columns と artifact path schema の forward-safe 性を確認する |
| 05-2 | observation checklist を strict 7 files 内へ吸収する |

## 成果物/実行手順

本 Phase の成果物は `phase-05.md`。post-switch checklist は `outputs/phase-12/implementation-guide.md` 内セクションとして扱う。

## 統合テスト連携

artifact load / D1 column verification は実装サイクルの Phase 11 evidence に接続する。
