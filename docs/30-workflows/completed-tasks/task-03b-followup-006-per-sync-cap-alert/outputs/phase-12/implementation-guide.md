# Implementation Guide — task-03b-followup-006-per-sync-cap-alert

> Issue: https://github.com/daishiman/UBM-Hyogo/issues/199
> Phase 12 (5 必須タスク + runbook close-out) 成果物。

## Part 1: 中学生レベルの説明

学校の売店で毎時間「今日は 200 個まで売る」と決めているとします。1 回だけ 200 個ぴったり売れたなら、たまたま人気だったのかもしれません。でも 3 回続けて 200 個ぴったり売れたら、本当はもっと多くの人が買いたかった可能性があります。

このタスクも同じです。回答の取り込みは 1 回に最大 200 件までに制限されています。200 件に何度も連続で届くと、取り込みきれない回答がたまるかもしれません。そこで「3 回続けて上限に届いた」ことを見つけ、運用担当者が気づける記録を送ります。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| per-sync write cap | 1 回の作業で書き込んでよい上限 |
| `metrics_json` | 作業結果を書いておくメモ欄 |
| Analytics Engine | 小さな出来事を数えておく箱 |
| binding | プログラムが外部の箱を使うための接続口 |
| escalation | 早めに人へ知らせる段階 |

## Part 2: 技術者向け

### 変更概要

| カテゴリ | 内容 |
| --- | --- |
| データ契約 | `sync_jobs.metrics_json.writeCapHit?: boolean` を追加（後方互換: absent = false） |
| 検知ロジック | `apps/api/src/jobs/cap-alert.ts` を新規追加（`evaluateConsecutiveCapHits` / `emitConsecutiveCapHitEvent`） |
| 統合点 | `runResponseSync()` 末尾の `succeed()` payload に `writeCapHit` を追加し、cap hit 時のみ detector → emit |
| Workers binding | `apps/api/wrangler.toml` に `[[analytics_engine_datasets]] binding="SYNC_ALERTS" dataset="sync_alerts"` を top / production / staging に追加 |
| Env 型 | `apps/api/src/env.ts` と `ResponseSyncEnv` に `SYNC_ALERTS?: AnalyticsEngineDataset` を追加 |
| Test fake | `__fixtures__/d1-fake.ts` の `runAll` で cap-alert SELECT を再現 |
| Test | `cap-alert.test.ts` 11 ケース新規 / `sync-forms-responses.test.ts` 4 ケース追加 |
| SSOT | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` に per-sync write cap 連続到達アラート節を追加 |
| Runbook | `outputs/phase-12/runbook-per-sync-cap-alert.md` を全面改稿 |

### Contract

```ts
type SyncJobMetrics = {
  writeCapHit?: boolean; // absent / null = false
};

interface ConsecutiveCapHitResult {
  windowSize: number;
  consecutiveHits: number;
  previousWindowReached: boolean;
  thresholdReached: boolean;
  shouldEmit: boolean;
}

type AnalyticsEngineDataset = {
  writeDataPoint(point: {
    blobs: string[];
    doubles: number[];
    indexes: string[];
  }): void;
};
```

### API シグネチャ

```ts
import { evaluateConsecutiveCapHits, emitConsecutiveCapHitEvent } from "./cap-alert";

const result = await evaluateConsecutiveCapHits(
  { DB: env.DB, SYNC_ALERTS: env.SYNC_ALERTS },
  { window: 3, jobKind: "response_sync" },
);

if (result.shouldEmit) {
  await emitConsecutiveCapHitEvent(
    { DB: env.DB, SYNC_ALERTS: env.SYNC_ALERTS },
    { jobId, jobKind: "response_sync", consecutiveHits: 3, windowSize: 3 },
  );
}
```

### Detector SQL

```sql
SELECT job_id, started_at,
       COALESCE(json_extract(metrics_json, '$.writeCapHit'), 0) AS writeCapHit
FROM sync_jobs
WHERE job_type = ?1
ORDER BY started_at DESC, job_id DESC
LIMIT ?2  -- window + 1
```

### イベント payload

| field | 値 |
| --- | --- |
| `blobs[0]` | `"sync_write_cap_consecutive_hit"` |
| `blobs[1]` | `jobKind`（`"response_sync"`） |
| `doubles[0]` | `consecutiveHits`（既定 3） |
| `doubles[1]` | `windowSize`（既定 3） |
| `indexes[0]` | `jobId` |

### Error Handling

- `metrics_json.writeCapHit` の absent / NULL は `false` 解釈（`COALESCE(..., 0)`）。
- `SYNC_ALERTS` binding 未設定 → `console.warn` のみで早期 return（例外伝播なし）。
- `writeDataPoint` が throw しても `console.warn` で握り潰し、response sync を fail させない。
- detector / emit ブロック全体を try/catch で包み、Analytics Engine 障害が response sync を破壊しないよう保証。
- failed path（`fail()`）では detector を呼ばない（cap hit 由来でない可能性が高い + ledger に成功 job が無いため）。
- 連続中の重複 emit は `previousWindowReached` 判定で抑制（直前 window が未達 → 達成へ遷移したときだけ emit）。

### 定数

| 名称 | 値 |
| --- | --- |
| Per-sync write cap | 200 (`RESPONSE_SYNC_WRITE_CAP` で override 可) |
| 連続検知 window | 3 (`CAP_ALERT_DEFAULT_WINDOW`) |
| Stage 2 候補閾値 | 6 |
| Stage 3 候補閾値 | 12 |
| Cron 周期 | 15 分 = 96 回/day |
| D1 free tier write/day | 100,000 |
| 上限到達時占有率 | 19,200 / 100,000 = 19.2% |
| Analytics Engine free | 25M write/month |

### AC マッピング

| AC | 達成根拠 |
| --- | --- |
| AC-1 | `runResponseSync()` の `succeed()` 呼び出し全 3 経路で `writeCapHit` が記録される（成功 / lock skip / fail は detector 不発火）。test S-1 / S-3 / S-4 / S-5 |
| AC-2 | `evaluateConsecutiveCapHits` の `shouldEmit = thresholdReached && !previousWindowReached`。failed / skipped row は `writeCapHit=false` として streak を reset。test T-3 / T-4 / T-5 / T-5b / T-8 / S-3 |
| AC-3 | SSOT (`deployment-cloudflare.md`) に Stage 1〜3 escalation 表を追加 |
| AC-4 | runbook §5 に 19.2% 試算 + cap 解除時シナリオ |
| AC-5 | runbook §1〜§7 にオペレータ手順 |
| AC-6 | `cap-alert.test.ts` 11 ケース + `sync-forms-responses.test.ts` 4 ケース追加 |
| AC-7 | 既存 `sync-forms-responses.test.ts` の 8 ケース regression なし PASS（合計 15 / 15） |

### スクリーンショット

NON_VISUAL タスクのため UI スクリーンショットなし（`visualEvidence: NON_VISUAL`）。Phase 11 evidence は `outputs/phase-11/main.md` に記録。

### 動作確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck     # PASS
mise exec -- pnpm --filter @ubm-hyogo/api lint           # PASS（typecheck と兼用）
cd /path/to/repo && mise exec -- npx vitest run \
  apps/api/src/jobs/cap-alert.test.ts \
  apps/api/src/jobs/sync-forms-responses.test.ts          # 26 / 26 PASS
```
