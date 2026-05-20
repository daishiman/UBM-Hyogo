# Phase 6: テスト拡充

> 実装区分: **実装仕様書**
> Source issue: [#266](https://github.com/daishiman/UBM-Hyogo/issues/266)
> Phase 4: [`phase-4-test-plan.md`](./phase-4-test-plan.md)
> Phase 5: [`phase-5-implementation.md`](./phase-5-implementation.md)

---

## 1. 目的

Phase 4 で計画した 12 ケースのうち、L1 単体テスト（`packages/shared/src/zod/sync-log.spec.ts`）の完全コードを確定する。Phase 5 で既存 contract spec へ minimal な期待値置換を行ったため、本 Phase では **shared 側の新規 spec** を full code として固定する。

---

## 2. `packages/shared/src/zod/sync-log.spec.ts`（新規・完全コード）

```ts
import { describe, expect, it } from "vitest";

import {
  SyncLogRecordZ,
  SyncLogStatusZ,
  SyncTriggerTypeZ,
  type SyncLogRecord,
} from "./sync-log";

// ------------------------------------------------------------
// fixture
// ------------------------------------------------------------

const validRow = {
  id: 1,
  run_id: "00000000-0000-4000-8000-000000000001",
  trigger_type: "cron",
  status: "success",
  started_at: "2026-05-17T00:00:00.000+09:00",
  finished_at: "2026-05-17T00:01:00.000+09:00",
  fetched_count: 10,
  upserted_count: 10,
  failed_count: 0,
  retry_count: 0,
  duration_ms: 60000,
  error_reason: null,
} as const;

const nullableRow = {
  ...validRow,
  finished_at: null,
  duration_ms: null,
  error_reason: null,
};

// ------------------------------------------------------------
// SyncLogStatusZ
// ------------------------------------------------------------

describe("SyncLogStatusZ — canonical enum (issue #266 §1.3)", () => {
  it.each(["running", "success", "failed", "skipped"] as const)(
    "accepts canonical value '%s'",
    (v) => {
      expect(SyncLogStatusZ.safeParse(v).success).toBe(true);
    },
  );

  it("rejects typo 'succeeded' (sync_jobs 由来の旧値)", () => {
    expect(SyncLogStatusZ.safeParse("succeeded").success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(SyncLogStatusZ.safeParse("").success).toBe(false);
  });
});

// ------------------------------------------------------------
// SyncTriggerTypeZ
// ------------------------------------------------------------

describe("SyncTriggerTypeZ — canonical enum (物理 DDL 一致)", () => {
  it.each(["cron", "admin", "backfill"] as const)(
    "accepts canonical value '%s'",
    (v) => {
      expect(SyncTriggerTypeZ.safeParse(v).success).toBe(true);
    },
  );

  it.each(["manual", "scheduled"] as const)(
    "rejects legacy TS value '%s' (issue #266 で正規化)",
    (v) => {
      expect(SyncTriggerTypeZ.safeParse(v).success).toBe(false);
    },
  );
});

// ------------------------------------------------------------
// SyncLogRecordZ
// ------------------------------------------------------------

describe("SyncLogRecordZ — 12-column physical row schema", () => {
  it("parses full 12-column valid row", () => {
    const r = SyncLogRecordZ.safeParse(validRow);
    expect(r.success).toBe(true);
  });

  it("parses null-permitted row (finished_at / duration_ms / error_reason)", () => {
    expect(SyncLogRecordZ.safeParse(nullableRow).success).toBe(true);
  });

  it("rejects retry_count: -1 (nonnegative 違反)", () => {
    expect(
      SyncLogRecordZ.safeParse({ ...validRow, retry_count: -1 }).success,
    ).toBe(false);
  });

  it("rejects status: 'unknown'", () => {
    expect(
      SyncLogRecordZ.safeParse({ ...validRow, status: "unknown" }).success,
    ).toBe(false);
  });

  it("rejects trigger_type: 'manual' (legacy TS value)", () => {
    expect(
      SyncLogRecordZ.safeParse({ ...validRow, trigger_type: "manual" }).success,
    ).toBe(false);
  });

  it("rejects id: 0 (positive 違反)", () => {
    expect(
      SyncLogRecordZ.safeParse({ ...validRow, id: 0 }).success,
    ).toBe(false);
  });

  it("rejects run_id: '' (NonEmptyStringZ 違反)", () => {
    expect(
      SyncLogRecordZ.safeParse({ ...validRow, run_id: "" }).success,
    ).toBe(false);
  });

  it("rejects started_at: '2026-05-17 00:00:00' (Iso8601 違反)", () => {
    expect(
      SyncLogRecordZ.safeParse({
        ...validRow,
        started_at: "2026-05-17 00:00:00",
      }).success,
    ).toBe(false);
  });
});

// ------------------------------------------------------------
// 型整合（compile-time）
// ------------------------------------------------------------

describe("type-level: z.infer<typeof SyncLogRecordZ> ≡ SyncLogRecord", () => {
  it("infers identical type to exported SyncLogRecord", () => {
    const parsed = SyncLogRecordZ.parse(validRow);
    // 代入が成立すれば z.infer 由来型と export 型が構造的に一致
    const _check: SyncLogRecord = parsed;
    expect(_check.id).toBe(validRow.id);
  });
});
```

### 2.1 ケース粒度の根拠

| describe | it 件数 | 根拠 |
|----------|--------|------|
| `SyncLogStatusZ` | 6 件（it.each 4 + reject 2） | 4 enum 値 × accept + 2 typo / empty |
| `SyncTriggerTypeZ` | 5 件（it.each 3 + it.each 2） | 3 canonical + 2 legacy reject |
| `SyncLogRecordZ` | 8 件 | full / nullable / 6 種 reject 境界 |
| 型整合 | 1 件 | `z.infer` ≡ export 型の compile-time check |

合計 **20 件**（Phase 4 §2.1 の 12 件を上回る粒度。`it.each` 展開分込み）。

---

## 3. apps/api 側の追加テスト（既存 spec への append）

新規 spec ファイルは作らない。既存 `apps/api/src/sync/audit.contract.spec.ts` 末尾に **shared 経路の end-to-end 整合 1 件** を append:

```ts
import { SyncLogStatusZ, SyncTriggerTypeZ } from "@ubm-hyogo/shared";

describe("listRecent — shared canonical 整合 (issue #266)", () => {
  it("returns rows that pass shared SyncTriggerTypeZ / SyncLogStatusZ", async () => {
    // 既存 setup と同じ db / startRun セットアップを利用
    await startRun(deps, "admin");
    await startRun(deps, "cron");
    await startRun(deps, "backfill");
    const rows = await listRecent(db, 10);
    expect(rows.length).toBeGreaterThanOrEqual(3);
    for (const r of rows) {
      expect(SyncTriggerTypeZ.safeParse(r.trigger).success).toBe(true);
      expect(SyncLogStatusZ.safeParse(r.status).success).toBe(true);
    }
  });
});
```

### 3.1 append 配置の根拠

- 新規ファイルを作らず既存 contract spec の末尾に置くことで「listRecent の振る舞いを規定する spec」という SRP を保持
- shared schema の `safeParse` を境界 1 回だけ実行することで、application 層 ↔ shared canonical の契約を runtime で固定

---

## 4. 実行確認

```bash
# shared spec のみ
mise exec -- pnpm --filter @ubm-hyogo/shared test -- sync-log
# 期待: 20 件 green

# apps/api 全 sync spec
mise exec -- pnpm --filter @ubm-hyogo/api test -- sync/
# 期待: 既存件数 + 1 件 が green
```

---

## 5. Phase 6 DoD

- [ ] `packages/shared/src/zod/sync-log.spec.ts` が §2 のコードに一致し 20 件 green
- [ ] `apps/api/src/sync/audit.contract.spec.ts` 末尾に §3 の it 1 件が append され green
- [ ] regression（既存 contract spec の fail）なし
- [ ] coverage（Phase 7 で測定）で `sync-log.ts` が line / branch 100%
