# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets→D1 sync endpoint 実装と audit logging (UT-21) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 作成日 | 2026-04-29 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | spec_created |
| タスク状態 | blocked（GitHub Issue #30 は CLOSED でも仕様書 blocked） |
| タスク分類 | specification-design（runbook） |

## 目的

Phase 4 で確定した検証スイートに対する実装側のファイル一覧（新規・修正）と段階的 runbook を確定し、03-serial セッションで先行実装された `apps/api/src/sync/{types,sheets-client,mapper,worker}.ts` + `apps/api/src/index.ts` の `/admin/sync` / `/admin/sync/responses` / `/admin/sync/audit` ルート 3 本に対して、SYNC_ADMIN_TOKEN Bearer middleware の追加・Vitest テストの実装・`wrangler.toml` の `[triggers] crons` 追記までを Red→Green→Refactor サイクルで漏れなく組み立てる。Cloudflare Secret 登録から dev デプロイまでを 1 本の runbook で追えるようにする。

## 実行タスク

1. 既存ファイル + 追加ファイル一覧を確定する（完了条件: パス・役割・依存関係を含む表が完成、03-serial セッション既存実装を尊重）。
2. 修正ファイル一覧を確定する（完了条件: 既存 export を破壊しない差分が示される、特に `apps/api/src/index.ts` ルート 3 本）。
3. 順序付き runbook（Step 0〜5）を完成する（完了条件: Secret 登録 → middleware 追加 → Vitest 実装 → `[triggers] crons` 追記 → ローカル検証 → dev デプロイの順序で漏れ無し）。
4. `runSync` 擬似コードと scheduled handler 擬似コードを記述する（完了条件: pure function 化 / pagination / retry / lock / log / audit best-effort + outbox の 6 要素が読み取れる）。
5. sanity check コマンド集を整備する（完了条件: `bash scripts/cf.sh` 経由で `wrangler` を呼ぶこと、実装前後の比較で副作用が観測できる）。
6. 1Password vault 名（**Employee** / item: **ubm-hyogo-env**）と SA 名（`ubm-hyogo-sheets-reader@ubm-hyogo.iam.gserviceaccount.com`）を runbook 全体で統一する（完了条件: `op://Employee/ubm-hyogo-env/<FIELD>` 形式と SA 名が他箇所と矛盾なし）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/phase-02.md | モジュール設計 |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/phase-04.md | 検証ファイルパスと wire-in |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/sync-flow.md | `runSync` 内の関数境界の正本 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/data-contract.md | upsert / audit / outbox 列定義の正本 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-05/sync-deployment-runbook.md | deploy 手順の上位 runbook |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | Auth.js admin role 判定 |
| 必須 | CLAUDE.md | `bash scripts/cf.sh` 経由ルール / 1Password vault ルール |
| 参考 | https://developers.cloudflare.com/workers/configuration/cron-triggers/ | scheduled handler 仕様 |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | `crypto.subtle` RS256 |

## 既存（03-serial セッションで作成済み）+ 追加ファイル一覧

| パス | 状態 | 役割 | 主な依存 |
| --- | --- | --- | --- |
| `apps/api/src/sync/types.ts` | 既存 | `Env`, `SheetRow`, `SyncResult`, `AuditLog`, `OutboxItem` 型定義（`exactOptionalPropertyTypes=true` 整合のため `string | undefined` で宣言） | なし |
| `apps/api/src/sync/sheets-client.ts` | 既存 | Workers-compatible JWT (`crypto.subtle` RS256) + Sheets API v4 fetch クライアント。googleapis 不使用 | `crypto.subtle`, env binding |
| `apps/api/src/sync/mapper.ts` | 既存 | COL 定数 / `mapRowToSheetRow` / `generateResponseId`（SHA-256 冪等キー） | shared types |
| `apps/api/src/sync/worker.ts` | 既存 | `runSync` (pure function) / `runBackfill` + `upsertRow` + `writeAuditLog`（best-effort + outbox） | mapper, sheets-client, types |
| `apps/api/src/index.ts` | 既存 + 修正 | Hono app + `scheduled()` export + `/admin/sync` / `/admin/sync/responses` / `/admin/sync/audit` ルート 3 本 | worker, SYNC_ADMIN_TOKEN Bearer middleware（追加要） |
| `apps/api/src/middleware/require-admin.ts` | 新規 | Auth.js セッション検証 + admin role チェック + CSRF token 検証の Hono middleware | Auth.js, env binding |
| `apps/api/test/sync/mapper.test.ts` | 新規 | mapper 境界値 / response_id SHA-256 | vitest |
| `apps/api/test/sync/mapper.response-id.test.ts` | 新規 | `generateResponseId` 冪等性 | vitest |
| `apps/api/test/sync/sheets-client.test.ts` | 新規 | JWT 署名 / `crypto.subtle.importKey` / PEM 除去 | vitest, miniflare |
| `apps/api/test/sync/worker.run-sync.test.ts` | 新規 | `runSync` 冪等性 / batch 100 / upsert SQL snapshot | vitest, in-memory D1 |
| `apps/api/test/sync/worker.audit-outbox.test.ts` | 新規 | audit 失敗時 outbox 蓄積 / 主データ保護 | vitest |
| `apps/api/test/sync/worker.backfill.test.ts` | 新規 | `runBackfill` range 計算 | vitest |
| `apps/api/test/sync/contract.data-contract.test.ts` | 新規 | 03-serial `data-contract.md` 5 点同期 snapshot | vitest |
| `apps/api/test/sync/routes.authorization.test.ts` | 新規 | `/admin/sync*` 全 3 本の SYNC_ADMIN_TOKEN Bearer | vitest |
| `apps/api/test/sync/scheduled.test.ts` | 新規 | `scheduled()` が `runSync` を 1 回呼ぶ assert | vitest |
| `apps/api/migrations/00xx_sync_audit_outbox.sql` | 新規 | `sync_audit_outbox` DDL（UT-22 schema 上に追加） | UT-22 適用済 schema |

## 修正ファイル一覧

| パス | 修正内容 |
| --- | --- |
| `apps/api/src/index.ts` | `app.post('/admin/sync', requireAdmin, ...)` / `app.post('/admin/sync/responses', requireAdmin, ...)` / `app.get('/admin/sync/audit', requireAdmin, ...)` の 3 ルートに `requireAdmin` middleware を挟む。既存の `scheduled()` export と他ルートを破壊しない |
| `apps/api/wrangler.toml` | `[triggers] crons = ["0 * * * *"]` を `[env.dev]` / `[env.production]` に分離（dev=`0 * * * *`、production は U-03 で再チューニング予定）。D1 binding / Auth.js Secret binding 確認 |
| `apps/api/vitest.config.ts` | `coverage.include` の allowlist を `apps/api/src/sync/*.ts` + `apps/api/src/middleware/require-admin.ts` に追加（Phase 4 確定分） |
| `apps/api/package.json` | googleapis を **追加しない**（Workers 互換のため `crypto.subtle` 直接利用）。SYNC_ADMIN_TOKEN は Cloudflare Secret として注入 |

## runbook

### Step 0: 事前準備（Phase 4 引き継ぎ）

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter ./apps/api build  # esbuild darwin mismatch 防止
```

### Step 1: Secret / Variable 登録（`scripts/cf.sh` 経由必須）

```bash
# 認証確認
bash scripts/cf.sh whoami

# dev: Service Account JSON（JSON.stringify 済み文字列）
# 実値は op://Employee/ubm-hyogo-env/GOOGLE_SHEETS_SA_JSON に保管
bash scripts/cf.sh secret put GOOGLE_SHEETS_SA_JSON --config apps/api/wrangler.toml --env dev
bash scripts/cf.sh secret put SYNC_ADMIN_TOKEN      --config apps/api/wrangler.toml --env dev   # 任意（Auth.js 主、Bearer は補助）
bash scripts/cf.sh secret put SYNC_ADMIN_TOKEN           --config apps/api/wrangler.toml --env dev   # Auth.js
# Variable: SHEETS_SPREADSHEET_ID は wrangler.toml の [env.dev.vars] に記述

# production
bash scripts/cf.sh secret put GOOGLE_SHEETS_SA_JSON --config apps/api/wrangler.toml --env production
bash scripts/cf.sh secret put SYNC_ADMIN_TOKEN           --config apps/api/wrangler.toml --env production
```

> **Service Account 名（必ず統一）**: `ubm-hyogo-sheets-reader@ubm-hyogo.iam.gserviceaccount.com`
> 1Password 参照は **必ず** `op://Employee/ubm-hyogo-env/<FIELD>` の形式（vault: **Employee**、item: **ubm-hyogo-env**）。
> `wrangler` を直接呼ばない / `wrangler login` でローカル OAuth トークンを保持しないこと（CLAUDE.md ルール）。

### Step 2: D1 マイグレーション（`sync_audit_outbox` 追加）

```bash
# 新規 DDL 作成: apps/api/migrations/00xx_sync_audit_outbox.sql
# CREATE TABLE sync_audit_outbox (
#   id TEXT PRIMARY KEY,
#   event_type TEXT NOT NULL,
#   payload_json TEXT NOT NULL,
#   created_at TEXT NOT NULL,
#   retry_count INTEGER NOT NULL DEFAULT 0,
#   last_error TEXT
# );

bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev  --env dev        --local
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev  --env dev        --remote
bash scripts/cf.sh d1 migrations list  ubm-hyogo-db-dev  --env dev
```

### Step 3: 実装（モジュール順 / Red→Green→Refactor）

1. `apps/api/src/middleware/require-admin.ts` を新規実装（Auth.js セッション検証 → admin role 判定 → CSRF token 検証）→ `apps/api/test/sync/routes.authorization.test.ts` Green
2. `apps/api/src/index.ts` の `/admin/sync` / `/admin/sync/responses` / `/admin/sync/audit` 3 ルートに `requireAdmin` middleware を挟む → authorization テスト全 6 ケース Green
3. `apps/api/test/sync/mapper.test.ts` + `mapper.response-id.test.ts` を Red→Green（mapper 既実装に対する verification）
4. `apps/api/test/sync/sheets-client.test.ts` を Red→Green（`crypto.subtle.importKey` mock）
5. `apps/api/test/sync/worker.run-sync.test.ts` を Red→Green（in-memory D1、冪等性確認）
6. `apps/api/test/sync/worker.audit-outbox.test.ts` を Red→Green（audit insert を vi.spyOn で reject、outbox 1 行 / 主データ rollback なし assert）
7. `apps/api/test/sync/worker.backfill.test.ts` を Red→Green
8. `apps/api/test/sync/contract.data-contract.test.ts` を Red→Green（03-serial `data-contract.md` 5 点 snapshot 生成）
9. `apps/api/test/sync/scheduled.test.ts` を Red→Green（`runSync` を vi.mock で差し替え、呼び出し回数 + 引数 assert）
10. `wrangler.toml` の `[env.dev]` / `[env.production]` に `[triggers] crons` を分離追記

### Step 4: ローカル検証

```bash
# Cron をローカルで叩く（scripts/cf.sh で wrangler dev は wrap していないため、build 確認のみ wrap）
mise exec -- pnpm --filter ./apps/api build

# wrangler dev は別途実行（OAuth ではなく env binding 経由で API Token 動作）
mise exec -- pnpm --filter ./apps/api wrangler dev --test-scheduled --env dev

# 別タブで scheduled トリガ
curl -X POST 'http://127.0.0.1:8787/__scheduled?cron=0+*+*+*+*'

# /admin/sync 手動同期（Authorization Bearer token を渡す）
curl -X POST 'http://127.0.0.1:8787/admin/sync' \
  -H "Cookie: <auth.js session cookie>" \
  -H "x-csrf-token: <csrf>"

# D1 確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --local \
  --command "SELECT status, fetched_count, upserted_count, failed_count, started_at FROM sync_job_logs ORDER BY started_at DESC LIMIT 5"

# audit outbox 確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --local \
  --command "SELECT id, event_type, retry_count, last_error FROM sync_audit_outbox ORDER BY created_at DESC LIMIT 10"
```

### Step 5: dev デプロイ

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env dev

# Cron 動作確認（次回起動時刻まで待つか、手動で /admin/sync）
mise exec -- pnpm --filter ./apps/api wrangler tail --env dev
```

## 擬似コード（`runSync` pure function 化 / scheduled handler）

```ts
// apps/api/src/index.ts
import { Hono } from "hono";
import { requireAdmin } from "./middleware/require-admin";
import { runSync, runBackfill, listAuditLogs } from "./sync/worker";

const app = new Hono<{ Bindings: Env }>();

app.post("/admin/sync",   requireAdmin, async (c) => c.json(await runSync(c.env, { trigger: "manual" })));
app.post("/admin/sync/responses", requireAdmin, async (c) => c.json(await runBackfill(c.env, await c.req.json())));
app.get ("/admin/sync/audit",    requireAdmin, async (c) => c.json(await listAuditLogs(c.env, c.req.query())));

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runSync(env, { trigger: "cron" }));
  },
};
```

```ts
// apps/api/src/sync/worker.ts (要点抜粋)
export async function runSync(env: Env, opts: { trigger: "manual" | "cron" }): Promise<SyncResult> {
  const lock = await acquireLock(env.DB, { ttlMs: 10 * 60 * 1000 });
  if (!lock) return { status: "skipped", reason: "locked" };

  const log = await startLog(env.DB, opts.trigger);
  let outboxQueued = 0;
  try {
    let processed = 0;
    for (const range of buildA1Ranges(env)) {
      const valueRange = await fetchSheetsRange(env, { range });           // 5xx → backoff
      const rows = (valueRange.values ?? []).map(mapRowToSheetRow);        // pure
      for (const batch of chunk(rows, 100)) {
        await retryOnBusy(() => upsertBatch(env.DB, batch));               // SQLITE_BUSY backoff
        // audit best-effort + outbox（03-serial data-contract.md 準拠）
        try {
          await writeAuditLog(env.DB, { batchSize: batch.length, jobId: log.id });
        } catch (e) {
          await enqueueOutbox(env.DB, { event_type: "audit_failure", payload_json: JSON.stringify({ jobId: log.id, error: String(e) }) });
          outboxQueued++;
          // 主データはロールバックしない
        }
        processed += batch.length;
      }
    }
    await finishLog(env.DB, log.id, { status: "success", processed });
    return { status: "success", processed, outboxQueued };
  } catch (e) {
    await finishLog(env.DB, log.id, { status: "failed", error: String(e) });
    throw e;
  } finally {
    await releaseLock(env.DB, lock.id);
  }
}
```

```ts
// apps/api/src/middleware/require-admin.ts (要点)
export const requireAdmin: MiddlewareHandler = async (c, next) => {
  const session = await getAuthSession(c);                       // Auth.js
  if (!session) return c.json({ error: "unauthorized" }, 401);
  if (!session.user?.roles?.includes("admin")) return c.json({ error: "forbidden" }, 403);
  if (c.req.method !== "GET") {                                  // CSRF: state-changing only
    const headerToken = c.req.header("x-csrf-token");
    const sessionToken = session.csrfToken;
    if (!headerToken || headerToken !== sessionToken) return c.json({ error: "csrf_invalid" }, 403);
  }
  await next();
};
```

## sanity check

```bash
# 実装前のスナップショット
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --local \
  --command "SELECT COUNT(*) AS n FROM member_responses"

# 同期 1 回実行 → 件数増減を観測
curl -X POST 'http://127.0.0.1:8787/admin/sync' \
  -H "Cookie: <auth.js session>" -H "x-csrf-token: <csrf>"

# 冪等性検証（同コマンドを 2 回連続実行し、件数が変動しないことを確認）

# audit best-effort 検証（audit insert を一時的に DDL 破壊して fail させ、outbox にだけ蓄積されること）
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --local \
  --command "SELECT COUNT(*) AS outbox_n FROM sync_audit_outbox WHERE event_type='audit_failure'"
```

## 禁止事項チェックリスト（Claude Code 必読）

- [ ] `wrangler` を直接呼んでいない（必ず `bash scripts/cf.sh` 経由）
- [ ] `op://Environments/...` を使っていない（vault は **Employee**）
- [ ] SA 名を `ubm-sheets-reader@...` と書いていない（正しくは `ubm-hyogo-sheets-reader@ubm-hyogo.iam.gserviceaccount.com`）
- [ ] googleapis を `package.json` に追加していない（Workers 非互換）
- [ ] `audit` を同一 transaction 化していない（03-serial `data-contract.md` 違反）
- [ ] Sheets schema を `mapper.ts` の COL 定数を超えて他層にハードコードしていない（不変条件 #1）
- [ ] D1 access を `apps/web` から行っていない（不変条件 #5）
- [ ] `/admin/sync*` 全 3 ルート（manual / backfill / audit）に `requireAdmin` middleware が漏れなく適用されている
- [ ] `.env` の中身を Read / cat / grep で読んでいない（実値は op 参照のみだが慣性事故防止）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 検証ファイルパス 9 件を runbook Step 3 内のサブステップにマップ |
| Phase 6 | runbook で組み立てた処理に対する failure case（audit fail / 5xx / lock 競合 / token 期限切れ）を検証 |
| Phase 9 | coverage 実測 + 無料枠見積もり |
| Phase 11 | wrangler dev --test-scheduled / dev デプロイ後の手動 smoke を再利用 |
| Phase 12 | outbox 再送ジョブ未実装を unassigned-task として登録 |

## 多角的チェック観点

- 価値性: runbook 通りに進めれば原典 spec の完了条件（SYNC_ADMIN_TOKEN Bearer / Vitest 冪等性 / audit / Cron 分離）すべてが満たせるか。
- 実現性: `bash scripts/cf.sh` 経由で Secret 登録 → dev デプロイ までブロックが無いか。
- 整合性（03-serial 契約）: `runSync` 内の関数境界が `sync-flow.md` の状態遷移と 1:1、audit 失敗時挙動が `data-contract.md` の best-effort + outbox と完全一致か。
- 整合性（既存実装）: 03-serial で先行実装された `apps/api/src/sync/{types,sheets-client,mapper,worker}.ts` を破壊しない差分か。
- 整合性（不変条件 #1 / #4 / #5）: Sheets schema が `mapper.ts` に閉じる / admin-managed data 専用テーブル / D1 access が `apps/api/src/sync/*` に閉じる、を満たすか。
- 運用性: 二重実行防止（`sync_locks`）と log 記録が、scheduled / manual 両経路で同じ `runSync` を通るか。
- セキュリティ: SA JSON / SYNC_ADMIN_TOKEN が `op://Employee/ubm-hyogo-env/...` 経由のみで投入されるか。`wrangler login` 経由のローカル OAuth トークンを残さないか。
- Workers 互換: `crypto.subtle` RS256 のみで JWT 署名し、googleapis 等 Workers 非互換ライブラリへの依存が無いか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 既存 + 新規ファイル一覧確定 | spec_created |
| 2 | 修正ファイル一覧確定 | spec_created |
| 3 | runbook Step 0〜5 確定 | spec_created |
| 4 | `runSync` + scheduled 擬似コード記述 | spec_created |
| 5 | sanity check 整備 | spec_created |
| 6 | 1Password vault / SA 名統一確認 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/implementation-runbook.md | 新規/修正ファイル一覧・runbook・擬似コード・sanity check・禁止事項チェックリスト |
| メタ | artifacts.json | Phase 5 状態更新 |

## 完了条件

- [ ] 既存 + 新規ファイル一覧が確定（既存 4 ファイル + 新規 11 ファイル + migration 1 ファイル）
- [ ] 修正ファイル一覧（`index.ts` / `wrangler.toml` / `vitest.config.ts` / `package.json`）が確定
- [ ] runbook が Step 0〜5 で順序付き、各 Step に `bash scripts/cf.sh` 経由のコマンドが含まれる
- [ ] 擬似コードに pure function 化 / pagination / retry / lock / log / audit best-effort + outbox の 6 要素を含む
- [ ] sanity check コマンドが実装前後で副作用を観測可能
- [ ] 1Password vault 名 **Employee** / item **ubm-hyogo-env** / SA 名 `ubm-hyogo-sheets-reader@ubm-hyogo.iam.gserviceaccount.com` で統一
- [ ] 禁止事項チェックリスト 9 項目が漏れなく記載

## タスク100%実行確認【必須】

- 実行タスク 6 件が `spec_created`
- 成果物が `outputs/phase-05/implementation-runbook.md` に配置済み
- Phase 4 のテストファイルパス 9 件が runbook 内の Step 3 に紐付けされている
- Step 1（Secret）・Step 2（migration）・Step 5（dev deploy）の省略が無い
- 03-serial `sync-deployment-runbook.md` との手順整合が確認されている

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系検証)
- 引き継ぎ事項:
  - 擬似コード上の例外パス（audit insert fail / Sheets 5xx / lock 競合 / Bearer token 不一致）が Phase 6 failure case の入力となる
  - Step 4 ローカル検証手順を Phase 11 が再利用
  - outbox 再送 consumer 未実装を Phase 12 unassigned-task-detection.md に登録
- ブロック条件:
  - Secret 未登録のまま Phase 6 に進む
  - migration（`sync_audit_outbox`）未適用で integration テストが Red のまま
  - `wrangler` 直呼びコマンドが runbook に残る
  - `op://Environments/...` 表記が runbook に残る
