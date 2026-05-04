[実装区分: 実装仕様書]

# Phase 3: 設計 — task-03b-followup-006-per-sync-cap-alert

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| task_id | TASK-03B-FOLLOWUP-006-PER-SYNC-CAP-ALERT |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |

## 目的

この Phase の責務を、per-sync cap alert 仕様の実装承認前に検証可能な粒度へ固定する。

## 実行タスク

- 本 Phase の契約、境界、成果物を確認する。
- 後続 Phase が参照する前提を明文化する。
- user 承認が必要な実装、commit、push、PR、deploy を実行しない。

## 参照資料

- index.md
- artifacts.json
- phase-02.md

## 成果物

- phase-03.md

## 統合テスト連携

| 判定項目 | 結果 |
| --- | --- |
| NON_VISUAL spec-created gate | DOC_PASS |
| Runtime test execution | PENDING_IMPLEMENTATION_APPROVAL |

## 1. データ設計

### 1.1 `sync_jobs.metrics_json` 拡張

```jsonc
// 後方互換: 既存行で writeCapHit が absent の場合は false 解釈
{
  "cursor": "2026-04-28T12:34:56Z|<responseId>",
  "writes": 187,
  "processed": 95,
  "writeCapHit": false,        // 追加フィールド
  "skipped": false              // 既存
}
```

### 1.2 zod schema 差分（`apps/api/src/jobs/_shared/sync-jobs-schema.ts`）

```ts
// 既存 metricsSchema に optional 追加
writeCapHit: z.boolean().optional()
```

PII guard (`PII_FORBIDDEN_PATHS` チェック) は影響を受けない（key 名がアルファベット小文字 camelCase で email / token を含まない）。

## 2. detector 設計（新規 `apps/api/src/jobs/cap-alert.ts`）

### 2.1 シグネチャ

```ts
export interface CapAlertEnv {
  readonly DB: D1Database;
  readonly SYNC_ALERTS?: AnalyticsEngineDataset;
}

export interface ConsecutiveCapHitResult {
  readonly windowSize: number;
  readonly consecutiveHits: number;
  readonly previousWindowReached: boolean;
  readonly thresholdReached: boolean;
  readonly shouldEmit: boolean;
}

export async function evaluateConsecutiveCapHits(
  env: CapAlertEnv,
  options: { window: number; jobKind: "response_sync" }
): Promise<ConsecutiveCapHitResult>;

export async function emitConsecutiveCapHitEvent(
  env: CapAlertEnv,
  args: {
    jobId: string;
    jobKind: "response_sync";
    consecutiveHits: number;
    windowSize: number;
  }
): Promise<void>;
```

### 2.2 detector SQL

```sql
SELECT job_id, started_at, json_extract(metrics_json, '$.writeCapHit') AS writeCapHit
FROM sync_jobs
WHERE job_type = ?1
ORDER BY started_at DESC, job_id DESC
LIMIT ?2 + 1;
```

- 先頭 N 行すべての `writeCapHit === 1` (SQLite の boolean 表現) なら `thresholdReached = true`
- failed / skipped job は `writeCapHit=false` として扱い、連続 hit streak を reset する。
- 2 行目から N+1 行目もすべて true なら `previousWindowReached = true`
- `shouldEmit = thresholdReached && !previousWindowReached` とし、連続 cap hit 継続中の重複 emit を抑制する
- N 行未満（運用初期）は `thresholdReached = false`
- 既存行で `writeCapHit` が absent / NULL の場合は false と解釈する。deploy 後観測の「NULL なし」は新規成功 job のみを対象にし、旧行の後方互換と混同しない

### 2.3 emit ロジック

```ts
if (!env.SYNC_ALERTS) {
  console.warn("[cap-alert] SYNC_ALERTS binding 未設定のため emit を skip");
  return;
}
try {
  env.SYNC_ALERTS.writeDataPoint({
    blobs: ["sync_write_cap_consecutive_hit", args.jobKind],
    doubles: [args.consecutiveHits, args.windowSize],
    indexes: [args.jobId],
  });
} catch (err) {
  console.warn("[cap-alert] emit failed", err instanceof Error ? err.message : String(err));
}
```

## 3. `sync-forms-responses.ts` 統合点

`succeed()` 呼び出しに `writeCapHit` を追加し、その後 detector を呼ぶ。

```ts
const writeCapHit = stopDueToCap === true || writes >= writeCap;

await succeed(dbCtx, jobId, {
  cursor,
  writes,
  processed,
  writeCapHit,
});

if (writeCapHit) {
  const evalResult = await evaluateConsecutiveCapHits(
    { DB: env.DB, SYNC_ALERTS: env.SYNC_ALERTS },
    { window: 3, jobKind: RESPONSE_SYNC },
  );
  if (evalResult.shouldEmit) {
    await emitConsecutiveCapHitEvent(
      { DB: env.DB, SYNC_ALERTS: env.SYNC_ALERTS },
      {
        jobId,
        jobKind: RESPONSE_SYNC,
        consecutiveHits: evalResult.consecutiveHits,
        windowSize: evalResult.windowSize,
      },
    );
  }
}
```

`succeed()` が throw した場合は detector を呼ばない。ledger に成功 job が保存されて初めて、直近 window 判定の対象にする。

## 4. wrangler.toml 設計

```toml
# top-level（dev 用）
[[analytics_engine_datasets]]
binding = "SYNC_ALERTS"
dataset = "sync_alerts"

# env.production / env.staging にも同一ブロックを追加
```

## 5. 閾値・チャネル設計（specs 追記）

| 段階 | 連続 hit 数 | 経過時間目安 | チャネル候補 |
| --- | --- | --- | --- |
| Stage 1 | N=3 | 45 分（15 分 × 3 cron） | GitHub issue 自動起票（非同期） |
| Stage 2 | N=6 | 90 分 | メール通知（同期） |
| Stage 3 | N=12 | 180 分 | Slack（MVP では抽象化のみ） |

本タスクでは `notification.channel` の実データ構造や保存先は作らない。Analytics Engine event を後続通知チャネルが読むための抽象 event 契約だけを固定し、GitHub / mail / Slack の実装は 05a observability guardrails 側へ渡す。

## 6. runbook 設計（runbook-per-sync-cap-alert.md）

セクション構成:
1. 連続 cap hit 検知時の初動 5 分
2. バックログ滞留判定手順（`SELECT count(*) FROM member_responses WHERE submitted_at > ?` 等）
3. Forms 回答急増判定手順
4. cron 間隔の暫定調整判断（操作判断のみ。cron 設定変更は本タスクで実装しない）
5. D1 無料枠影響評価（200 × 96 = 19,200 write/day vs 100k/day = 19.2% 占有 / cap 解除時のリスク試算）
6. escalation 階段（Stage 1 → 2 → 3）

## 完了条件

- データ / detector / emit / wrangler / specs / runbook 各設計が文書化される
- Phase 4 の実装計画に直接 1 対 1 で落とせる粒度であること
