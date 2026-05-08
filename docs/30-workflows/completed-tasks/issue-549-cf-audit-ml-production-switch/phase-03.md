# Phase 3: 設計（env 切替 / artifact 配布 / 7 日観測 / rollback）

## 目的

production env 切替フロー、model artifact 配布経路、post-switch 7 日観測のテレメトリ、forward-safe rollback の手順を確定する。Phase 4-13 の入力となる設計図を提供する。

## 設計

### 1. env 切替フロー

```
.github/workflows/cf-audit-log-monitor.yml
└─ jobs.monitor
    ├─ env: { CF_AUDIT_CLASSIFIER, ML_MODEL_PATH }   ← production で ml / op://... を設定
    ├─ steps:
    │   1. checkout
    │   2. mise + pnpm install
    │   3. analyze.ts (hourly run)                    ← Classifier は env で切替
    │   4. post-step: secret-leakage-grep.ts          ← 新規挿入: hourly Issue / log を grep
    │   5. post-step: post-switch-monitor.ts          ← 新規挿入: hourly JSON snapshot
    │   6. post-step: fallback-rate-alert.ts          ← 新規挿入: 閾値超で Issue 起票
```

production env 切替は Gate-A〜C 通過後の実装サイクルで、workflow YAML の `env:` ブロックを `threshold` → `ml` に変更する PR で行う。**本 spec_created サイクルでは YAML を編集しない**。

### 2. model artifact 配布経路

| 配布先候補 | `ML_MODEL_PATH` 参照 | 配布手順 (rollback 元) |
| --- | --- | --- |
| Cloudflare R2 | `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` | `bash scripts/cf.sh r2 object put` 経由（必要なら scripts/cf.sh に拡張） |
| Workers AI binding | `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_WORKERS_AI_BINDING_PROD` | wrangler.toml の `[ai]` binding（apps 側）を経由しない、scripts 専用 binding を別途検討 |

> **本サイクルでは選択肢を runbook に列挙するに留め、確定は FU-03-C #548 の成果に従う**。`ML_MODEL_PATH` は op 参照で抽象化し、実値は `.env` にも書かない。

### 3. post-switch 7 日観測のテレメトリ

```
scripts/cf-audit-log/observation/
  ├ post-switch-monitor.ts        // hourly JSON snapshot 集計
  ├ fallback-rate-alert.ts        // fallback rate 閾値超で Issue 起票
  └ __tests__/
      ├ post-switch-monitor.test.ts
      └ fallback-rate-alert.test.ts
```

`post-switch-monitor.ts` 出力（hourly）:

```json
{
  "hour": "2026-05-15T03:00:00Z",
  "classifierUsed": "ml",
  "classifierVersion": "ml@v1.0.0",
  "totalEvents": 1234,
  "issuesOpenedThisHour": 2,
  "fallbackRate": 0.012,
  "p95LatencyMs": 145,
  "leakageGrepResult": "clean",
  "previousThresholdBaseline": {
    "issuesPerHourMean": 1.8,
    "issuesPerHourStdev": 0.6
  }
}
```

7 日終端サマリ (`outputs/phase-11/observation/summary-7day.md`):

| 指標 | 7 日合計 | threshold 期 baseline | 判定 |
| --- | --- | --- | --- |
| Issue 起票数 | N | M | within / over |
| fallback rate (mean) | x% | – | within (<5%) / over |
| p95 latency | ms | ms | within / over |
| leakage 検出 | 0 | 0 | clean / dirty |

### 4. forward-safe rollback

```
rollback runbook (3 step):
  1. PR を作成し、cf-audit-log-monitor.yml の CF_AUDIT_CLASSIFIER を threshold に戻す
     - merge は rollback approval/governance evidence後、緊急時は self-merge 可（事後報告で audit）
  2. D1 列 (classifier_used / classifier_version / confidence) は削除しない
     - forward-safe を担保。次回 ML 切替時にそのまま再利用
  3. fallback rate / leakage 検出が継続する場合、artifact を再選定する Issue を起票
     - FU-03-C #548 へ差し戻し
```

破壊的 DOWN SQL は **本タスクでは作成しない**。親 #515 の migration は forward-safe であり、追加列を残すことが rollback の前提。

### 5. fallback-rate-alert の発火条件

```
fallbackRate > 0.05 を 3 hour 連続で観測 → GitHub Issue 起票（label: type:incident, priority:high）
  - body に直近 3 hour の hourly JSON snapshot を含める
  - secret leakage grep を pre-issue で実行し、検出時は body を redact
```

### 6. leakage grep の hooked step

```
secret-leakage-grep.ts <input-glob> [--exit-on-detect]
  - input: hourly Issue body (gh api でローカル取得) / analyze.ts log artifact
  - 検出時 exit 1 → hourly run を fail させる
  - 既存実装（親 #515）に --exit-on-detect オプションがなければ追加する
```

## 出力

`outputs/phase-03/main.md` に以下を記述:

- 上記設計図の実体（YAML 差分 / observation JSON schema / runbook 3 step）
- `MLClassifier` への `ML_MODEL_PATH` 渡し方（env / op-run / 実体ロード経路の繋ぎ）
- 7 日観測の集計ロジック（hourly snapshot → 日次サマリ → 7 日終端サマリ）
- rollback の forward-safe 性の根拠（D1 列残置 / env 1 行戻し）

## 完了条件

- [ ] workflow YAML の差分（env block + post-step 3 種）を確定
- [ ] `post-switch-monitor.ts` の hourly JSON output schema を確定
- [ ] `fallback-rate-alert.ts` の閾値（5% × 3 hour 連続）を確定
- [ ] forward-safe rollback の 3 step を確定（D1 列残置 / env 1 行戻し / artifact 再選定 Issue）
- [ ] model artifact 配布候補（R2 / Workers AI binding）を runbook に列挙

## 参照資料

- `index.md`
- `phase-01.md` ・ `phase-02.md`
- `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/outputs/phase-12/implementation-guide.md`

## 統合テスト連携

- Phase 9 で本設計の各 module（post-switch-monitor / fallback-rate-alert / leakage grep hook）を test 対象として登録

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 03 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 実行タスク

- Phase 契約を確定する。
- skill 定義と正本仕様への整合を確認する。

| Task | 内容 |
| --- | --- |
| 03-1 | この Phase の契約を確定する |
| 03-2 | skill 定義と正本仕様への整合を確認する |

## サブタスク分解（後続 Phase 4-13 への入力）

Phase 4-13 の作成エージェントが扱うサブタスクを以下に分解する。各サブタスクの変更対象ファイルと受入条件を Phase 6-10 で詳細化する。

| ID | サブタスク | 変更対象ファイル | 受入条件 |
| --- | --- | --- | --- |
| T-01 | production env 切替準備（model artifact verify / D1 schema verify） | `scripts/cf-audit-log/observation/preflight.ts`（新規・任意）/ `apps/api/migrations/0016_*.sql`（読取） | model artifact が `ML_MODEL_PATH` で load 可能 / D1 列が staging で存在 |
| T-02 | GitHub Actions workflow env 切替（実装サイクル PR + rollback approval/governance evidence） | `.github/workflows/cf-audit-log-monitor.yml` | production env block で `CF_AUDIT_CLASSIFIER=ml` / `ML_MODEL_PATH=op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` / merge は Gate 後 |
| T-03 | 7 日 observation セットアップ（hourly run 監視 / fallback rate alert） | `scripts/cf-audit-log/observation/post-switch-monitor.ts` / `fallback-rate-alert.ts` / 各 `__tests__/` | hourly JSON snapshot 出力 / fallback rate > 5% × 3h で Issue 起票 / focused test pass |
| T-04 | rollback runbook 整備（`CF_AUDIT_CLASSIFIER=threshold` 戻し手順） | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 3 step 以内 / D1 列残置の forward-safe 性を明記 |
| T-05 | Issue body redaction 検証（secret leakage gate） | `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts`（既存・必要なら `--exit-on-detect` 追加）/ workflow post-step | hourly post-step として組み込み / 検出時 exit 1 で hourly run を fail |
| T-06 | Phase 12 evidence + SSOT sync | `outputs/phase-12/*` / `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` / `deployment-secrets-management.md` / `15-infrastructure-runbook.md` | Phase 12 の 7 必須ファイル / SSOT 3 ファイル更新 |

## 成果物/実行手順

- Phase 本文の出力パスへ成果物を配置する。
- 実装時は Phase 11 evidence と Phase 12 strict outputs に同期する。
- production env 切替の PR 作成と実 merge は Gate-A〜C 通過 + rollback approval/governance evidence 後の実装サイクルに限定する。

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 / Phase 11 / Phase 12 の成果物を上流契約として参照する。
