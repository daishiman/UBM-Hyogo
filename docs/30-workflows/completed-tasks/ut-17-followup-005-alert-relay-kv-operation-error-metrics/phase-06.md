# Phase 6: 実装手順（ステップバイステップ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | alert-relay KV 操作エラーの observability 計測 |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 実装手順 |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | 5 (実装計画) |
| 次 Phase | 7 (テスト計画) |
| 状態 | spec_created |
| GitHub Issue | #701 |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | 本 Phase は Phase 5 の関数シグネチャに従い、`alert-relay.ts` と `alert-relay.spec.ts` の **実コードを順序立てて記述する手順書**を確定する。後続実装者（または LLM coding agent）が本仕様書のコード snippet をコピペすれば着手できる粒度で詳細化する。 |

---

## 目的

Phase 5 で確定した変更対象・関数シグネチャ・実装順序を、
**完成形コード snippet 付き** のステップバイステップ手順に展開する。
本 Phase の成果物 `outputs/phase-06/implementation-steps.md` は、
担当者がそれ単体を見れば手を動かせる粒度で記述する。

---

## 6-1. 実装ステップ概要

| ステップ | 対象 | 主な作業 |
| --- | --- | --- |
| S1 | `apps/api/src/routes/internal/alert-relay.ts` 冒頭 | `isolateId` module top 採番 + log schema 定数/型追加 |
| S2 | 同上（module-local helper 群） | `computeDedupeKeyHash` / `logKvOperationError` 実装 |
| S3 | 同上（`app.post("/")` 内） | `KV.get` を try/catch + fail-open に置換 |
| S4 | 同上（`KV.put` catch ブロック） | 旧 `console.warn` を `logKvOperationError("put", ...)` に置換 |
| S5 | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | 4 ケース追加（`vi.spyOn(console, 'warn')` ベース） |
| S6 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 「KV 操作エラーログ確認」セクション追記 |
| S7 | 品質ゲート | typecheck / lint / test 実行 |

---

## 6-2. S1: `alert-relay.ts` 冒頭への schema / 型 / isolateId 追加

### 挿入位置

`apps/api/src/routes/internal/alert-relay.ts` の既存 import 群（`import type { CloudflareNotificationPayload } ...` まで）の **直後**、`export interface AlertRelayEnv` の **直前**に挿入する。

### 完成形コード snippet

```ts
// ─────────────────────────────────────────────────────────────
// UT-17-FU-005: KV 操作エラーの構造化ログ
// ─────────────────────────────────────────────────────────────

/**
 * 後段 logpush / Workers Logs 検索の正本キー。
 * 不変条件 7（log schema 安定化）により value 変更禁止。
 */
const KV_OP_FAILED_EVENT = "alert_relay_kv_op_failed" as const;

/**
 * KV `get`/`put` 操作失敗を構造化ログとして emit する際の payload schema。
 */
type LogKvOperationError = {
  readonly event: typeof KV_OP_FAILED_EVENT;
  readonly op: "get" | "put";
  readonly errorClass: string;
  readonly dedupeKeyHash: string;
  readonly isolateId: string;
  readonly ts: string;
};

/**
 * module load 時に 1 回採番される isolate 識別子。
 * `createAlertRelayRoute` 関数の外側で評価することで、
 * 同 isolate 内の複数 request / emit が同値を共有する。
 */
const isolateId: string = crypto.randomUUID();
```

---

## 6-3. S2: module-local helper 群

### 挿入位置

S1 の直後（`export interface AlertRelayEnv` の直前）に追加する。

### 完成形コード snippet

```ts
/**
 * dedupeKey の SHA-256 先頭 12 hex chars を返す。
 * `crypto.subtle.digest` 失敗時は throw（呼び出し側で catch）。
 */
async function computeDedupeKeyHash(dedupeKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(dedupeKey));
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (let i = 0; i < 6; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

/**
 * KV `get`/`put` 操作失敗を構造化 JSON 1 行で `console.warn` に emit する。
 *
 * - hash 算出失敗時は `dedupeKeyHash = "hash_error"` で fallback emit
 * - 上位 fail-open / fail-closed 経路には影響を与えない（throw しない）
 */
async function logKvOperationError(
  op: "get" | "put",
  err: unknown,
  dedupeKey: string,
): Promise<void> {
  const errorClass =
    err instanceof Error ? err.constructor.name : typeof err;
  let dedupeKeyHash: string;
  try {
    dedupeKeyHash = await computeDedupeKeyHash(dedupeKey);
  } catch {
    dedupeKeyHash = "";
    const fallback: LogKvOperationError = {
      event: KV_OP_FAILED_EVENT,
      op,
      errorClass,
      dedupeKeyHash,
      isolateId,
      ts: new Date().toISOString(),
    };
    console.warn(JSON.stringify(fallback));
    return;
  }
  const payload: LogKvOperationError = {
    event: KV_OP_FAILED_EVENT,
    op,
    errorClass,
    dedupeKeyHash,
    isolateId,
    ts: new Date().toISOString(),
  };
  console.warn(JSON.stringify(payload));
}
```

---

## 6-4. S3: `KV.get` を try/catch + fail-open に置換

### 挿入位置

`app.post("/", verifyCfWebhookAuth, async (c) => { ... })` 内、`const dedupeKey = [...].join(":");` の直後にある **1 行** を置換する。

### before

```ts
const seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
if (seen !== null) {
  return c.json({ ok: true, deduped: true });
}
```

### after

```ts
let seen: string | null = null;
try {
  seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
} catch (error) {
  // ut-17-followup-005: fail-open（observable）。元実装は throw で request が
  // 5xx 落下していたが、観測可能性を優先して Slack 配信路に進める。
  await logKvOperationError("get", error, dedupeKey);
}
if (seen !== null) {
  return c.json({ ok: true, deduped: true });
}
```

---

## 6-5. S4: `KV.put` catch ブロック置換

### 挿入位置

既存 `try { await c.env.ALERT_DEDUP_KV.put(dedupeKey, "1", {...}); } catch (error) { ... }` の **catch ブロック内**を置換する。

### before

```ts
} catch (error) {
  console.warn("alert relay dedup KV put failed after Slack delivery", {
    error: error instanceof Error ? error.message : "unknown",
  });
  return c.json({ ok: true, attempts: result.attempts, dedupPersisted: false });
}
```

### after

```ts
} catch (error) {
  await logKvOperationError("put", error, dedupeKey);
  return c.json({ ok: true, attempts: result.attempts, dedupPersisted: false });
}
```

---

## 6-6. S5: `alert-relay.spec.ts` への 4 ケース追加

### 挿入位置

既存テストファイル `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` の末尾 `describe(...)` ブロック内、または新規 `describe("UT-17-FU-005 KV operation error metrics", () => { ... })` ブロックを追加する。

### 共通セットアップ snippet

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("UT-17-FU-005 KV operation error metrics", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 共通 helper: emit された JSON ログを parse して返す
  const parseEmittedLogs = (): Array<Record<string, unknown>> => {
    return warnSpy.mock.calls
      .map((call) => {
        try {
          return JSON.parse(String(call[0])) as Record<string, unknown>;
        } catch {
          return null;
        }
      })
      .filter((v): v is Record<string, unknown> => v !== null);
  };

  // 共通 helper: ALERT_DEDUP_KV mock を返す
  const buildKvMock = (overrides: Partial<KVNamespace> = {}): KVNamespace => {
    const base: Partial<KVNamespace> = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    };
    return { ...base, ...overrides } as KVNamespace;
  };
```

### Case (a): `KV.get` throw → 配信継続 + emit 1（op=get）

```ts
  it("KV.get throw 時に fail-open で配信継続し、op=get の構造化ログを 1 回 emit する", async () => {
    const kv = buildKvMock({
      get: vi.fn().mockRejectedValueOnce(new Error("kv get boom")),
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("ok", { status: 200 }),
    );
    const env = makeAlertRelayEnv({ ALERT_DEDUP_KV: kv });
    const app = createAlertRelayRoute({ fetch: fetchMock });

    const res = await app.request("/", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-webhook-auth": env.CF_WEBHOOK_AUTH_TOKEN,
      },
      body: JSON.stringify(makeCfNotificationPayload()),
    }, env);

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1); // Slack 配信は実行される

    const logs = parseEmittedLogs();
    const getLog = logs.find((l) => l.event === "alert_relay_kv_op_failed" && l.op === "get");
    expect(getLog).toBeDefined();
    expect(getLog?.errorClass).toBe("Error");
    expect(typeof getLog?.dedupeKeyHash).toBe("string");
    expect((getLog?.dedupeKeyHash as string).length).toBe(12);
    expect(typeof getLog?.isolateId).toBe("string");
    expect(typeof getLog?.ts).toBe("string");
  });
```

### Case (b): `KV.put` throw → emit 1（op=put）+ `dedupPersisted:false`

```ts
  it("KV.put throw 時に op=put の構造化ログを 1 回 emit し dedupPersisted:false を返す", async () => {
    const kv = buildKvMock({
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockRejectedValueOnce(new TypeError("kv put boom")),
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("ok", { status: 200 }),
    );
    const env = makeAlertRelayEnv({ ALERT_DEDUP_KV: kv });
    const app = createAlertRelayRoute({ fetch: fetchMock });

    const res = await app.request("/", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-webhook-auth": env.CF_WEBHOOK_AUTH_TOKEN,
      },
      body: JSON.stringify(makeCfNotificationPayload()),
    }, env);

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ ok: true, dedupPersisted: false });

    const logs = parseEmittedLogs();
    const putLog = logs.find((l) => l.event === "alert_relay_kv_op_failed" && l.op === "put");
    expect(putLog).toBeDefined();
    expect(putLog?.errorClass).toBe("TypeError");
  });
```

### Case (c): 成功パスで emit 0

```ts
  it("正常系（get null → Slack ok → put 成功）では console.warn が 0 回呼ばれる", async () => {
    const kv = buildKvMock();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("ok", { status: 200 }),
    );
    const env = makeAlertRelayEnv({ ALERT_DEDUP_KV: kv });
    const app = createAlertRelayRoute({ fetch: fetchMock });

    const res = await app.request("/", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-webhook-auth": env.CF_WEBHOOK_AUTH_TOKEN,
      },
      body: JSON.stringify(makeCfNotificationPayload()),
    }, env);

    expect(res.status).toBe(200);
    const emitted = parseEmittedLogs().filter(
      (l) => l.event === "alert_relay_kv_op_failed",
    );
    expect(emitted).toHaveLength(0);
  });
```

### Case (d): 同一 isolate 内 2 emit の `isolateId` 一致

```ts
  it("同一 isolate 内の連続 emit は同じ isolateId を持つ", async () => {
    const kv = buildKvMock({
      get: vi.fn().mockRejectedValue(new Error("kv get boom")),
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("ok", { status: 200 }),
    );
    const env = makeAlertRelayEnv({ ALERT_DEDUP_KV: kv });
    const app = createAlertRelayRoute({ fetch: fetchMock });

    for (let i = 0; i < 2; i++) {
      await app.request("/", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "cf-webhook-auth": env.CF_WEBHOOK_AUTH_TOKEN,
        },
        body: JSON.stringify(makeCfNotificationPayload({ ts: Date.now() + i })),
      }, env);
    }

    const logs = parseEmittedLogs().filter(
      (l) => l.event === "alert_relay_kv_op_failed",
    );
    expect(logs.length).toBeGreaterThanOrEqual(2);
    const ids = new Set(logs.map((l) => l.isolateId));
    expect(ids.size).toBe(1);
  });
});
```

> `makeAlertRelayEnv` / `makeCfNotificationPayload` は既存テストの helper を再利用する。命名が異なる場合は既存ファイルの定義に合わせる（本 snippet は inline 構築でも代替可能）。

---

## 6-7. S6: runbook 追記

### 挿入位置

`docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` の末尾、または手順セクションの後ろに新セクションとして追加する。

### 追記内容（Markdown snippet）

```md
## KV 操作エラーログ確認

UT-17-FU-005（Issue #701）により、`apps/api/src/routes/internal/alert-relay.ts` の
`ALERT_DEDUP_KV.get` / `ALERT_DEDUP_KV.put` 失敗時に構造化 JSON ログを `console.warn` 経由で emit する。
Workers Logs で以下の grep により当該事象を抽出できる。

```bash
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format pretty \
  | grep alert_relay_kv_op_failed
```

抽出例（1 行 JSON）:

```json
{"event":"alert_relay_kv_op_failed","op":"put","errorClass":"TypeError","dedupeKeyHash":"a1b2c3d4e5f6","isolateId":"f47ac10b-58cc-4372-a567-0e02b2c3d479","ts":"2026-05-16T03:14:15.926Z"}
```

### field 定義

| field | 型 | 説明 |
| --- | --- | --- |
| `event` | string (固定) | 常に `"alert_relay_kv_op_failed"`。後段 logpush / dashboard の正本キー |
| `op` | `"get"` \| `"put"` | KV 操作種別 |
| `errorClass` | string | `Error` インスタンスなら `err.constructor.name`、それ以外は `typeof err` |
| `dedupeKeyHash` | string (12 hex) | dedupeKey の `SHA-256` 先頭 12 hex chars。raw key は emit しない（PII non-leak） |
| `isolateId` | string (UUIDv4) | Workers isolate ごとに module top で 1 回採番。同 isolate 内 emit は同値 |
| `ts` | string (ISO8601) | emit 時刻 |

### 運用上の閾値（暫定）

- 1 時間あたり `op=get` ≥ 10 件 → KV 一時障害疑い。`scripts/cf.sh d1` ではなく Cloudflare Status を確認
- 1 時間あたり `op=put` ≥ 10 件 → Slack 配信成功 / dedup 不全状態の継続を疑う。重複通知が増えていないか Slack を確認
- 同一 `dedupeKeyHash` で `op=put` 連続失敗 → 該当 alert の dedup が効かず連投される懸念
```

> 上記コードブロック内のネスト ``` は実ファイルでは正しくエスケープすること。

---

## 6-8. S7: 品質ゲート逐次実行

```bash
# 1. 型チェック
mise exec -- pnpm typecheck

# 2. リント
mise exec -- pnpm lint

# 3. テスト（alert-relay のみ高速確認）
mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay

# 4. 旧文字列が残っていないことの最終確認
grep -RIn "alert relay dedup KV put failed after Slack delivery" apps/api/src \
  && echo "FAIL: 旧 console.warn 文字列が残存" \
  || echo "OK: 旧文字列なし"

# 5. 新 event キーが期待箇所のみで使用されていることを確認
grep -RIn "alert_relay_kv_op_failed" apps/api/src
```

---

## 6-9. 不変条件チェック（実装中に守るべき）

- [ ] `apps/web/` 配下のファイルを変更していない
- [ ] D1 直接アクセスを追加していない
- [ ] `dedupeKey` raw / stack trace / Slack Webhook URL をログ・docs・コード comment に書いていない
- [ ] env / secret / KV binding / cron を変更していない
- [ ] `pnpm-lock.yaml` に新規依存が増えていない
- [ ] 新規 `*.test.ts` を作成していない（既存 `alert-relay.spec.ts` 拡張のみ）
- [ ] 旧 `console.warn("alert relay dedup KV put failed after Slack delivery", ...)` が完全に削除されている

---

## 6-10. 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/phase-05.md | 関数シグネチャ・型 |
| 必須 | apps/api/src/routes/internal/alert-relay.ts | 挿入位置 |
| 必須 | apps/api/src/routes/internal/__tests__/alert-relay.spec.ts | テスト追加先 |
| 必須 | docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md | runbook 追記先 |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | `crypto.subtle.digest` / `crypto.randomUUID` |
| 参考 | https://vitest.dev/api/vi.html#vi-spyon | `vi.spyOn(console, "warn")` 使用法 |

---

## 6-11. 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/implementation-steps.md | S1〜S7 のステップバイステップ実装手順 |
| メタ | artifacts.json | phase-06 を completed に更新 |

---

## 6-12. 完了条件

- [ ] S1〜S7 のステップが、ファイル単位で再現可能な粒度に展開されている
- [ ] 各ステップに「対象ファイル」「挿入位置」「完成形コード snippet」が含まれている
- [ ] 不変条件 7 項目が手順内チェックリストとして埋め込まれている
- [ ] ローカル実行コマンド（typecheck / lint / test / grep）が記載されている
- [ ] 4 テストケース全てが完成形 vitest snippet として提示されている

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-06 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 7（テスト計画）
- 引き継ぎ事項:
  - S5 の 4 ケース snippet を Phase 7 のテスト計画で境界条件 / 異常系観点として展開
  - S7 の品質ゲートコマンドを Phase 7 / Phase 9（受入確認）で再利用
  - field 定義表（S6）を Phase 8（docs 更新）で system spec 側に転記
- ブロック条件: S2〜S5 の実装が Phase 5 の関数シグネチャから乖離する設計を含む場合

## 実行タスク

本 Phase の対象実装・検証・ドキュメント同期を実行する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `apps/api/src/routes/internal/alert-relay.ts` | 実装正本 |
| 必須 | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | テスト正本 |

## 成果物/実行手順

`@ubm-hyogo/api` を package filter として typecheck / lint / build / test を実行し、Phase 11 evidence に記録する。

## 完了条件

local evidence が PASS し、runtime / git operation は Phase 13 user gate に分離されていること。

## 統合テスト連携

`alert-relay.spec.ts` の focused tests と Phase 11 grep gate に接続する。
