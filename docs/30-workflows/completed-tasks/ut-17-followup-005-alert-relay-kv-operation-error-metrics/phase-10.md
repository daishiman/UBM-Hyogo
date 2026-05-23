# Phase 10: リファクタ

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | alert-relay KV 操作エラーの observability 計測 |
| Phase 番号 | 10 / 13 |
| Phase 名称 | リファクタ |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | 9 (受入確認) |
| 次 Phase | 11 (NON_VISUAL evidence) |
| 状態 | spec_created |
| GitHub Issue | #701 |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | `apps/api/src/routes/internal/alert-relay.ts` の helper を module-local に保ったまま型整理（`type LogKvOp = 'get' \| 'put'`）と DRY 化を行う。export 禁止確認・命名一貫性・LOC 増加上限・静的解析 0 warning を達成基準とする。 |

---

## 目的

Phase 6 で実装した `logKvOperationError` ヘルパとその呼び出し箇所を、
behaviour 不変のまま **module-local / 型安全 / DRY / 命名一貫性** の観点で整える。
公開 surface を増やさず、ファイル LOC 増加を想定 +50 行以内に抑え、
後段 logpush / dashboard 化（UT-17-FU-006）の契約面で安定した状態に固定する。

---

## 10-1. リファクタ範囲

| 範囲 | 内容 | 対象 |
| --- | --- | --- |
| 型整理 | `type LogKvOp = "get" \| "put"` を module-local に追加し、helper 引数とログ payload の `op` field を同一型に統一 | `alert-relay.ts` |
| export 制限 | `logKvOperationError` / `isolateId` / `LogKvOp` / `computeDedupeKeyHash` のいずれも `export` しない（module-local 維持） | `alert-relay.ts` |
| DRY | `dedupeKeyHash` の算出を helper 1 箇所に集約（get/put 両 catch で重複算出しない） | `alert-relay.ts` |
| 命名一貫性 | `event: "alert_relay_kv_op_failed"` の snake_case 統一 / field 名は lowerCamel（`errorClass` / `dedupeKeyHash` / `isolateId`）統一 | `alert-relay.ts` / runbook section 5-2 |
| docstring | helper 上に schema 安定化 / PII 配慮 / `isolateId` 限界の根拠を JSDoc コメント化 | `alert-relay.ts` |

> behaviour change はしない。`get` の fail-open / `put` 後の `dedupPersisted=false` レスポンスは Phase 6 実装をそのまま維持。

---

## 10-2. module-local 維持 / export 禁止確認

```bash
# helper / 型 / 定数が export されていないことを grep で確認
grep -nE "^export (function logKvOperationError|const isolateId|type LogKvOp|function computeDedupeKeyHash)" \
  apps/api/src/routes/internal/alert-relay.ts
# 期待: 0 件

# index.ts / routes/index 経由で間接 re-export していないこと
grep -rnE "logKvOperationError|isolateId" apps/api/src \
  | grep -v "apps/api/src/routes/internal/alert-relay.ts" \
  | grep -v "apps/api/src/routes/internal/__tests__/alert-relay.spec.ts"
# 期待: 0 件
```

---

## 10-3. TypeScript 型整理

`alert-relay.ts` の module top（既存 import 群の直後）に以下を配置:

```ts
// UT-17-FU-005: KV 操作エラー構造化ログ schema は後段 logpush / dashboard 契約の正本。
// field 追加は additive のみ可、削除・rename 禁止（CONST_007）。
type LogKvOp = "get" | "put";

interface AlertRelayKvOpFailedLog {
  readonly event: "alert_relay_kv_op_failed";
  readonly op: LogKvOp;
  readonly errorClass: string;
  readonly dedupeKeyHash: string;
  readonly isolateId: string;
  readonly ts: string;
}

// isolate ライフサイクル代理識別子。Workers に isolate.id 公式 API が無いため、
// module top で 1 回採番し当該 isolate 中は再利用する。再生成で別 UUID。
const isolateId = crypto.randomUUID();
```

helper 本体:

```ts
async function computeDedupeKeyHash(dedupeKey: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(dedupeKey));
  return [...new Uint8Array(buf)]
    .slice(0, 6) // 6 bytes = 12 hex chars
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function logKvOperationError(
  op: LogKvOp,
  err: unknown,
  dedupeKey: string,
): Promise<void> {
  const payload: AlertRelayKvOpFailedLog = {
    event: "alert_relay_kv_op_failed",
    op,
    errorClass: err instanceof Error ? err.constructor.name : typeof err,
    dedupeKeyHash: await computeDedupeKeyHash(dedupeKey),
    isolateId,
    ts: new Date().toISOString(),
  };
  console.warn(JSON.stringify(payload));
}
```

> `dedupeKeyHash` 算出は **catch ブロック内のみ実行**（成功 hot path には乗らない）。
> `get` と `put` の両 catch で `computeDedupeKeyHash` を直接呼ばず、必ず `logKvOperationError` 経由とすることで重複算出を排除する。

---

## 10-4. 呼び出し側（callsite）DRY 化

| catch 位置 | 修正前（Phase 6 想定） | 修正後（Phase 10） |
| --- | --- | --- |
| `KV.get` catch | `await logKvOperationError("get", err, dedupeKey);` | 変更なし（既に DRY） |
| `KV.put` catch | `console.warn("alert relay dedup KV put failed ...", { error: ... })` + `await logKvOperationError("put", err, dedupeKey);` の二重 emit になっていないこと | `await logKvOperationError("put", err, dedupeKey);` のみ（既存非構造化 `console.warn` 行は Phase 6 で削除済み） |

```bash
# 二重 emit になっていないこと確認
grep -nE "console\.warn" apps/api/src/routes/internal/alert-relay.ts
# 期待: 0 件（全て logKvOperationError 経由で 1 行 JSON.stringify した出力に統一）
```

---

## 10-5. 命名一貫性チェック

```bash
# event 名は snake_case
grep -nE '"event":\s*"[^"]+"' apps/api/src/routes/internal/alert-relay.ts
# 期待: "alert_relay_kv_op_failed" のみ

# field 名は lowerCamel（snake_case 混入を検出）
grep -nE '"(error_class|dedupe_key_hash|isolate_id)"' apps/api/src/routes/internal/alert-relay.ts
# 期待: 0 件

# runbook 側の field 表記も同一
grep -nE "\`(error_class|dedupe_key_hash|isolate_id)\`" docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md
# 期待: 0 件
```

> ログ schema の **event は snake_case / field は lowerCamel** という混在ルールは
> Cloudflare Workers Logs の慣例（event は grep しやすさ最優先で snake_case、payload field は JS/TS 慣例で lowerCamel）
> に合わせた意図的選択。Phase 2 log-schema.md で意思決定済み。

---

## 10-6. JSDoc 追記

`logKvOperationError` 上に以下のコメントを配置:

```ts
/**
 * UT-17-FU-005: ALERT_DEDUP_KV.get / .put 失敗を構造化 JSON 1 行で console.warn 経由 emit する。
 *
 * 設計意図:
 * - schema 安定化: field 追加は additive のみ可、削除/rename 禁止（後段 logpush 契約）
 * - PII 配慮: dedupeKey raw は出さず SHA-256 先頭 12 hex に短縮
 * - stack 非出力: Workers Logs 1 行容量と PII 観点で errorClass のみ
 * - isolateId: module top で crypto.randomUUID() 1 回採番（isolate 再生成で別値）
 *
 * 副作用: console.warn 1 回。例外を throw しない（fail-open / fail-closed 経路を維持）。
 *
 * @see docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md section 5
 */
```

---

## 10-7. cyclomatic complexity / LOC ガード

| 指標 | ベースライン | 上限 | 計測方法 |
| --- | --- | --- | --- |
| `alert-relay.ts` LOC 増加 | Phase 6 直前 108 行 | +50 行（≦ 158 行） | `wc -l apps/api/src/routes/internal/alert-relay.ts` |
| `createAlertRelayRoute` cyclomatic complexity 増加 | 既存値 | +2 まで | `pnpm exec eslint apps/api/src/routes/internal/alert-relay.ts --rule '{"complexity":["error",10]}'` |
| helper 関数数増加 | 0 | +3 まで（`logKvOperationError` / `computeDedupeKeyHash` / 型のみ） | grep `^(async )?function ` |

```bash
wc -l apps/api/src/routes/internal/alert-relay.ts
# 期待: ≤ 158 行

grep -cE "^(async )?function " apps/api/src/routes/internal/alert-relay.ts
# 期待: ≤ 3（既存 createAlertRelayRoute + 新規 2）
```

---

## 10-8. 静的解析 0 warning

```bash
mise exec -- pnpm typecheck
# 期待: exit 0 / 0 errors

mise exec -- pnpm lint
# 期待: exit 0 / 0 warnings / 0 errors
# - any 型混入 0
# - unused import / unused variable 0
# - no-console は alert-relay.ts では allowlist 済み（既存方針）
```

---

## 10-9. 再 regression（refactor 後）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay
# 期待: TC-LOG-01〜TC-LOG-05 + 既存 ROUTE-* / TC-* 全 PASS / failed=0

mise exec -- pnpm --filter @ubm-hyogo/api test
# 期待: PASS / failed=0
```

Phase 9 で記録した coverage 値が低下していないこと:

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage -- alert-relay
# 期待: line / branch とも Phase 9 値 ≥
```

---

## 10-10. Definition of Done

- [ ] `LogKvOp` / `AlertRelayKvOpFailedLog` / `isolateId` / `computeDedupeKeyHash` / `logKvOperationError` がいずれも export されていない
- [ ] `dedupeKeyHash` 算出が helper 1 箇所に集約（get/put catch では `logKvOperationError` を呼ぶだけ）
- [ ] `console.warn` の呼び出しが `logKvOperationError` 内 1 箇所のみ（既存非構造化 warn 行が残っていない）
- [ ] event 名 `"alert_relay_kv_op_failed"` の snake_case 統一・field 名 lowerCamel 統一が grep gate を PASS
- [ ] helper 上に schema 安定化 / PII 配慮 / isolateId 限界を説明する JSDoc がある
- [ ] `alert-relay.ts` LOC ≤ 158 行
- [ ] cyclomatic complexity 増加 ≤ 2
- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm lint` exit 0 / 0 warnings
- [ ] `pnpm --filter @ubm-hyogo/api test -- alert-relay` PASS / failed=0
- [ ] coverage が Phase 9 値以上

---

## 10-11. behaviour 不変条件（再確認）

- `KV.get` throw 時: response 200 / Slack 配信継続 / `console.warn` 1 行
- `KV.put` throw 時: response 200 / body `{ok:true, attempts, dedupPersisted:false}` / `console.warn` 1 行
- dedup hit 時: response 200 / `{ok:true, deduped:true}` / `console.warn` 0 回
- Slack 配信失敗時: response 502 / `{ok:false, attempts, status, error}` / `console.warn` 0 回（KV.put 経路に到達しない）
- 成功時（dedup miss / Slack 200 / put 成功）: response 200 / `{ok:true, attempts}` / `console.warn` 0 回

---

## 次 Phase 引き継ぎ事項

- 次: Phase 11（NON_VISUAL evidence）
- 引き継ぎ事項:
  - 10-3 / 10-6 の JSDoc 内容は Phase 12 `implementation-guide.md` の「設計意図」セクションに転記
  - 10-7 LOC / complexity 計測値は Phase 12 `system-spec-update-summary.md` の品質メトリクスに記録
  - 10-9 coverage 値は Phase 12 `documentation-changelog.md` の最終値として記録
- ブロック条件: 10-10 DoD のいずれか未充足、または 10-9 regression で 1 件でも FAIL する場合は Phase 6 へ差し戻す

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
