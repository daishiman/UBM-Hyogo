# Phase 4: テスト計画

> 実装区分: **実装仕様書**
> Source issue: [#266](https://github.com/daishiman/UBM-Hyogo/issues/266)
> Phase 3: [`phase-3-design-review.md`](./phase-3-design-review.md)
> visual classification: NON_VISUAL

---

## 1. テスト戦略

本タスクは **TS 契約面の drift 解消** が SRP。テスト戦略も次の 3 層で構成する。

| 層 | 目的 | 対象 | 実行コマンド |
|----|------|------|-------------|
| L1 単体テスト（shared） | Zod schema の意味論固定 | `packages/shared/src/zod/sync-log.spec.ts` (新規) | `mise exec -- pnpm --filter @ubm-hyogo/shared test` |
| L2 既存統合テスト（apps/api） | shared 由来型置換による regression なし | `apps/api/src/sync/*.contract.spec.ts` 既存 4 本 | `mise exec -- pnpm --filter @ubm-hyogo/api test` |
| L3 grep / typecheck / lint gate | 文字列リテラル drift の構造的防止 | 全 monorepo | `mise exec -- pnpm typecheck && mise exec -- pnpm lint && grep gate` |

### 1.1 戦略上の重要原則

1. **物理 DDL を canonical とする** ので、test 期待値も `cron|admin|backfill` + `running|success|failed|skipped` に統一する。`manual` / `scheduled` を期待値として hardcode していた既存 spec は Phase 5 で更新する。
2. **新規 schema は境界正常 + 境界異常の両方** をカバー。中間値（valid だが境界） / 旧値（reject 期待） / null 許容パターンを最低 1 ケースずつ含める。
3. **`z.infer` 型整合** は compile-time check で固定（test とは別経路）。型 drift は typecheck で fail させる。
4. **`apps/api` 既存 test の改修は最小限**。`"manual"` → `"admin"` / `"scheduled"` → `"cron"` の文字列置換のみで pass する設計とし、新規 test ファイルは追加しない（既存 4 contract spec で粒度十分）。

---

## 2. 単体テスト一覧（`packages/shared/src/zod/sync-log.spec.ts`）

最低 8 ケース。test ファイル拡張子は CLAUDE.md 不変条件 #8 に従い `*.spec.ts` のみ。

### 2.1 ケース一覧

| # | describe | it | 入力 | 期待 |
|---|----------|----|------|------|
| 1 | `SyncLogStatusZ` | accepts canonical `"running"` | `"running"` | `success === true` |
| 2 | `SyncLogStatusZ` | rejects typo `"succeeded"` | `"succeeded"` | `success === false` |
| 3 | `SyncLogStatusZ` | rejects empty string | `""` | `success === false` |
| 4 | `SyncTriggerTypeZ` | accepts canonical `"cron"` / `"admin"` / `"backfill"` | 3 値全件 | 全て `success === true` |
| 5 | `SyncTriggerTypeZ` | rejects legacy `"manual"` / `"scheduled"` | 2 値 | 全て `success === false` |
| 6 | `SyncLogRecordZ` | parses full 12-column row | 全カラム正常 row | `success === true` |
| 7 | `SyncLogRecordZ` | parses null-permitted row（`finished_at` / `duration_ms` / `error_reason`） | 3 件 null | `success === true` |
| 8 | `SyncLogRecordZ` | rejects `retry_count: -1`（`nonnegative` 違反） | `retry_count: -1` | `success === false` |
| 9 | `SyncLogRecordZ` | rejects unknown `status: "unknown"` | `status: "unknown"` | `success === false` |
| 10 | `SyncLogRecordZ` | rejects unknown `trigger_type: "manual"` | `trigger_type: "manual"` | `success === false` |
| 11 | `SyncLogRecordZ` | rejects `id: 0`（`positive` 違反） | `id: 0` | `success === false` |
| 12 | type-level | `z.infer<typeof SyncLogRecordZ>` ≡ `SyncLogRecord` | compile-time | typecheck 通過 |

> 12 件中 1-11 が runtime test、12 が compile-time check（`const _check: SyncLogRecord = parseResult.data` 相当の代入で固定）。

### 2.2 fixture（test 内 inline）

```ts
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
```

null 許容 row は `finished_at / duration_ms / error_reason` を `null` に差し替えた variant を別 fixture として定義。

---

## 3. 統合テスト（既存 4 本の regression 確認）

### 3.1 対象 spec ファイル

| spec | 確認観点 | Phase 5 で必要な改修 |
|------|---------|--------------------|
| `apps/api/src/sync/audit.contract.spec.ts` | `startRun` / `finishRun` / `withSyncMutex` の bind 値 | `"manual"` / `"scheduled"` 期待値を `"admin"` / `"cron"` へ置換 |
| `apps/api/src/sync/manual.contract.spec.ts` | `runManualSync` の trigger 値 | 期待 `trigger_type === "admin"` に更新（旧: `"manual"`） |
| `apps/api/src/sync/scheduled.contract.spec.ts` | cursor SELECT + `runScheduledSync` の trigger 値 | 期待 `trigger_type === "cron"` + cursor SQL の IN 句確認 |
| `apps/api/src/sync/backfill.contract.spec.ts` | `runBackfill` の trigger 値 | 変更なし（既に `"backfill"`） |

### 3.2 end-to-end parse 確認（軽量）

`audit.contract.spec.ts` 内の `listRecent` を使った 1 ケースで、得られた `AuditRow.trigger` を `SyncTriggerTypeZ.safeParse` で再検証する確認 it を 1 件追加する（既存 listRecent test に append、新規ファイル不要）:

```ts
import { SyncTriggerTypeZ, SyncLogStatusZ } from "@ubm-hyogo/shared";

it("listRecent rows are shared-canonical parseable", async () => {
  // ...既存セットアップで row 投入...
  const rows = await listRecent(db, 10);
  for (const r of rows) {
    expect(SyncTriggerTypeZ.safeParse(r.trigger).success).toBe(true);
    expect(SyncLogStatusZ.safeParse(r.status).success).toBe(true);
  }
});
```

これにより「shared schema ↔ application 層 `AuditRow` ↔ D1 物理 row」の 3 者整合を 1 ケースで担保。

---

## 4. カバレッジ目標

| パッケージ | 目標 | 計測 |
|----------|------|------|
| `packages/shared` `sync-log.ts` | line / branch / function 100% | `pnpm --filter @ubm-hyogo/shared test -- --coverage` |
| `apps/api` 既存 sync 系 | regression なし（既存比 ±0pt） | `pnpm --filter @ubm-hyogo/api test -- --coverage`（既存比） |

`sync-log.ts` は純粋な schema 定義のため 100% カバレッジは達成容易。未到達 branch があれば test 不足のシグナルとして Phase 6 で追加する。

---

## 5. 回帰防止（Phase 9 で実施）

### 5.1 typecheck gate

`mise exec -- pnpm typecheck` を全パッケージで実行。以下の drift があれば fail する。

- `apps/api/src/sync/types.ts` で旧 `SyncTrigger = "manual" | ...` 宣言が残存
- `apps/api/src/sync/manual.ts` で `withSyncMutex(deps, "manual", ...)` が残存（型エラー）
- `apps/api/src/sync/scheduled.ts` で `withSyncMutex(deps, "scheduled", ...)` が残存（型エラー）

### 5.2 grep gate

```bash
# 旧 trigger 値の runtime 経路残存検出（コメント / spec 期待値を除く）
grep -rn '"manual"\|"scheduled"' apps/api/src/sync/ \
  --include='*.ts' \
  --exclude='*.spec.ts' \
  | grep -v '^\s*//' \
  | grep -v '^\s*\*'
# 期待: 0 件

# 独立 literal union 宣言の再発検出
grep -rn 'type Sync\(Trigger\|LogStatus\) = "' apps/api/src/
# 期待: 0 件
```

### 5.3 staging D1 evidence（Phase 11）

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging \
  --command "SELECT DISTINCT trigger_type FROM sync_job_logs;"
# 期待: cron / admin / backfill の 3 値以内
```

`manual` / `scheduled` 値が混入していた場合、Phase 2 §5.3 のとおり `scheduled.ts` cursor SELECT を hybrid IN 句で temporary 維持し、別 task に retirement を分離する。

---

## 6. テスト実行順序（Phase 9 で実施する DoD コマンド）

```bash
# 1. shared 新規 spec
mise exec -- pnpm --filter @ubm-hyogo/shared test

# 2. apps/api 既存 spec の regression 確認
mise exec -- pnpm --filter @ubm-hyogo/api test

# 3. 型 + lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 4. grep gate
bash docs/30-workflows/issue-266-shared-sync-zod-contract/outputs/phase-11/grep-gate.sh
# (Phase 11 で簡易 wrapper を保存)
```

全 4 工程 green が DoD。

---

## 7. テスト除外項目（YAGNI）

| 項目 | 除外理由 |
|------|---------|
| E2E（Playwright）テスト | NON_VISUAL タスクのため UI 経路なし |
| 物理 D1 migration test | DDL 変更なし |
| `sync_jobs` 契約 test | 別契約（#195） |
| `apps/web` 連携 test | 別 task（後続 UI 連携） |
| performance test | `safeParse` overhead は 1 row µs オーダーで影響無視可 |
| fuzzing | `z.enum` / `z.object` は zod 自体が網羅。手書き fuzz は ROI 低 |
