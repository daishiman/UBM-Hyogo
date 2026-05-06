# Severity 判定ルール正本 (Phase 2 抜粋)

親: `docs/30-workflows/issue-408-cf-audit-logs-monitoring/outputs/phase-2/phase-2.md`
実装先: `scripts/cf-audit-log/lib/severity-classifier.ts` (Phase 5)

## ルール表

| Severity | 条件 | Issue label | 抑止条件 |
| --- | --- | --- | --- |
| HIGH   | `outcome=success` AND `actor_ip` ∉ (`allowed_ip_set` ∪ `gha_meta_ip_ranges`) | `priority:high` / `type:security` | `event_timestamp` が rotation window 内 |
| MEDIUM | 1h window 内 `outcome=failure` 件数 > `hourly_failure_count_p99 × 1.5` | `priority:medium` / `type:security` | baseline 未学習 (`is_active=1` 行不在) |
| LOW    | 業務時間 (JST 09:00-19:00) 外の Token 利用 | `priority:low` / `type:security` | rotation window 内 |
| null   | 上記いずれにも該当しない / 学習期間中 | (Issue 起票なし) | record のみ保管 |

## 評価順序

```
1. baseline=null  → return null  (学習期間中は alerting 抑止)
2. inRotation 判定 (event_timestamp が rotation_window_json のいずれかの区間内か)
3. HIGH 判定 (success + 想定外 IP, ただし inRotation なら skip)
4. MEDIUM 判定 (1h failure 集計 > p99×1.5)
5. LOW 判定 (JST business hours 外, ただし inRotation なら skip)
6. それ以外 → null
```

評価は短絡: 上位 (HIGH) で確定したら以降は評価しない。

## 依存データ

| 名称 | 取得元 | リフレッシュ頻度 | キャッシュ |
| --- | --- | --- | --- |
| `allowed_ip_set` | `cf_audit_baseline.allowed_ip_set_json` (7 日学習で更新) | 7 日毎 | D1 row |
| `gha_meta_ip_ranges` | `https://api.github.com/meta` の `actions[]` | 24h | analyze.ts in-memory + `outputs/phase-9/gha-meta-cache.json` |
| `business_hours` | `cf_audit_baseline.business_hours_jst_*` (定数 9-19) | 静的 | baseline 行 |
| `rotation_window` | DERIV-03 runbook が更新する `cf_audit_baseline.rotation_window_json` | rotation 計画毎 | baseline 行 |
| `hourly_failure_count_p99` | 学習期間 168 バケットの `nearest-rank` p99 | 7 日毎 | baseline 行 |

## p99 算出 (nearest-rank 法)

```
sortedAsc = sort(samples)
rank = ceil(0.99 * len(sortedAsc))
p99 = sortedAsc[rank - 1]   // 1-indexed
```

サンプルサイズ < 100 の場合は `max(samples)` で代替する (誤検知を避けるため広めに取る)。

## 判定ロジック (TypeScript 擬似コード)

```ts
import type { CfAuditEvent, CfAuditBaseline } from "./types";

export type Severity = "HIGH" | "MEDIUM" | "LOW" | null;

export interface ClassifyContext {
  baseline: CfAuditBaseline | null;
  hourBucketStartUnix: number;
  hourBucketFailureCount: number;
  rotationWindows: Array<{ start: number; end: number }>;
  ghaMetaIpRanges: string[];
}

export function classify(event: CfAuditEvent, ctx: ClassifyContext): Severity {
  if (ctx.baseline === null) return null;

  const inRotation = ctx.rotationWindows.some(
    (w) => event.eventTimestamp >= w.start && event.eventTimestamp <= w.end,
  );

  if (event.outcome === "success" && !inRotation) {
    const allowedIps = JSON.parse(ctx.baseline.allowed_ip_set_json) as string[];
    const ok =
      isIpInAnyCidr(event.actorIp, allowedIps) ||
      isIpInAnyCidr(event.actorIp, ctx.ghaMetaIpRanges);
    if (!ok) return "HIGH";
  }

  if (event.outcome === "failure") {
    const threshold = Math.ceil(ctx.baseline.hourly_failure_count_p99 * 1.5);
    if (ctx.hourBucketFailureCount > threshold) return "MEDIUM";
  }

  if (!inRotation) {
    const jstHour = toJstHour(event.eventTimestamp);
    const { business_hours_jst_start: s, business_hours_jst_end: e } = ctx.baseline;
    if (jstHour < s || jstHour >= e) return "LOW";
  }

  return null;
}
```

## 反例 (誤検知の典型)

| ケース | 期待 severity | 抑止理由 |
| --- | --- | --- |
| rotation 中の新 Token 初回利用 (新 IP) | null | rotation_window 内 |
| 学習期間中の wrangler deploy | null | baseline=null |
| 業務時間内の単発 403 (typo 等) | null | failure 1 件は p99×1.5 未満 |
| 学習期間中に観測済みの IP | null | allowed_ip_set 内 |
