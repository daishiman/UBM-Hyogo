# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets→D1 同期ジョブ実装 (UT-09) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 作成日 | 2026-04-27 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | spec_created |
| タスク分類 | specification-design（runbook） |

## 目的

Phase 4 で確定した検証スイートに対する実装側のファイル一覧（新規・修正）と段階的 runbook を確定し、Cron Trigger 起動 → Sheets pull → D1 batch upsert → log 記録の処理を、Red→Green→Refactor サイクルで漏れなく組み立てるための手順書を整備する。Cloudflare Secret 登録から dev デプロイまでを 1 本の runbook で追えるようにする。

## 実行タスク

1. 新規作成ファイル一覧を確定する（完了条件: パス・役割・依存関係を含む表が完成）。
2. 修正ファイル一覧を確定する（完了条件: 既存 export を破壊しない差分が示される）。
3. 順序付き runbook（Step 1〜5）を完成する（完了条件: Secret 登録 → migration → 実装 → ローカル検証 → dev デプロイの順序で漏れ無し）。
4. Cron Trigger entry の擬似コードを記述する（完了条件: pagination・retry・log・lock の 4 要素が読み取れる）。
5. sanity check コマンド集を整備する（完了条件: 実装前後の比較で副作用が観測できる）。
6. canUseTool 適用範囲（該当しなければ N/A）を明記する（完了条件: 本タスク内での該当ステップ判定がある）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-02.md | 8 モジュール設計 |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-04.md | 検証ファイルパスと wire-in |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | wrangler.toml triggers / env 設定 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare Secret 登録手順 |
| 参考 | https://developers.cloudflare.com/workers/configuration/cron-triggers/ | scheduled handler 仕様 |

## 新規作成ファイル一覧

| パス | 役割 | 主な依存 |
| --- | --- | --- |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | メイン処理（fetch → map → upsert → log） | util/* 全部 |
| `apps/api/src/jobs/util/retry-backoff.ts` | exponential backoff + `SQLITE_BUSY` 判定 | なし |
| `apps/api/src/jobs/util/write-queue.ts` | D1 書き込み直列化 FIFO | retry-backoff |
| `apps/api/src/jobs/util/sheets-fetcher.ts` | Sheets API v4 + pagination | env binding |
| `apps/api/src/jobs/util/mapper.ts` | Sheets row → D1 column 変換 | shared types |
| `apps/api/src/jobs/util/lock-manager.ts` | `sync_locks` の acquire/release | D1 binding |
| `apps/api/src/routes/admin/sync.ts` | `POST /admin/sync` Hono handler | sync-sheets-to-d1 |
| `apps/api/test/jobs/**/*.test.ts` | unit / integration / authorization | vitest, miniflare |
| `apps/api/migrations/00xx_sync_logs_locks.sql` | `sync_job_logs` / `sync_locks` テーブル DDL | UT-04 既存 schema |

## 修正ファイル一覧

| パス | 修正内容 |
| --- | --- |
| `apps/api/src/index.ts` | `scheduled()` handler の export、`/admin/sync` ルート登録（既存ルートを破壊しない） |
| `apps/api/wrangler.toml` | `[triggers] crons`、`[env.dev]` / `[env.production]` 別の cron 設定（dev=`0 * * * *`、main=`0 */6 * * *`）、D1 binding 確認 |
| `apps/api/package.json` | googleapis 依存追加。bundle size が Cloudflare Workers 制限に近づく場合は軽量 fetch 実装へ切り替え、依存追加なしとする |
| `apps/api/vitest.config.ts` | coverage.include の allowlist 追加（Phase 4 確定分） |

## runbook

### Step 0: 事前準備（Phase 4 引き継ぎ）

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter ./apps/api build  # esbuild darwin mismatch 防止
```

### Step 1: Secret / Variable 登録

```bash
# dev
wrangler secret put GOOGLE_SHEETS_SA_JSON --env dev    # JSON.stringify 済み文字列
wrangler secret put SYNC_ADMIN_TOKEN --env dev
# Variable は wrangler.toml の [env.dev.vars] に SHEETS_SPREADSHEET_ID を記述

# main 環境も同様
wrangler secret put GOOGLE_SHEETS_SA_JSON --env production
wrangler secret put SYNC_ADMIN_TOKEN --env production
```

### Step 2: D1 マイグレーション

```bash
# 新規 DDL を作成
# apps/api/migrations/00xx_sync_logs_locks.sql に sync_job_logs / sync_locks を追加

mise exec -- pnpm --filter ./apps/api wrangler d1 migrations apply ubm_hyogo_db --env dev --local
mise exec -- pnpm --filter ./apps/api wrangler d1 migrations apply ubm_hyogo_db --env dev --remote
```

### Step 3: 実装（モジュール順）

1. `util/retry-backoff.ts` → 単体テスト Green
2. `util/write-queue.ts` → 単体テスト Green
3. `util/lock-manager.ts` → miniflare integration Green
4. `util/sheets-fetcher.ts` → mock fetch で contract Green
5. `util/mapper.ts` → 単体テスト Green
6. `jobs/sync-sheets-to-d1.ts` → integration Green（pagination / retry / lock / log を結線）
7. `routes/admin/sync.ts` → authorization テスト Green
8. `index.ts` で `scheduled()` を export し handler を呼び出す
9. `wrangler.toml` の `[triggers]` に cron 追記

### Step 4: ローカル検証

```bash
# Cron をローカルで叩く
mise exec -- pnpm --filter ./apps/api wrangler dev --test-scheduled --env dev

# 別タブで scheduled トリガ
curl -X POST 'http://127.0.0.1:8787/__scheduled?cron=0+*+*+*+*'

# /admin/sync 手動同期
curl -X POST 'http://127.0.0.1:8787/admin/sync' \
  -H "Authorization: Bearer ${SYNC_ADMIN_TOKEN}"

# D1 確認
mise exec -- pnpm --filter ./apps/api wrangler d1 execute ubm_hyogo_db --env dev --local \
  --command "SELECT status, fetched_count, upserted_count, failed_count, started_at FROM sync_job_logs ORDER BY started_at DESC LIMIT 5"
```

### Step 5: dev デプロイ

```bash
mise exec -- pnpm --filter ./apps/api wrangler deploy --env dev

# Cron 動作確認（次回起動時刻まで待つか、手動で /admin/sync）
mise exec -- pnpm --filter ./apps/api wrangler tail --env dev
```

## 擬似コード（Cron Trigger entry）

```ts
export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runSync(env, { trigger: "cron" }));
  },
  fetch: app.fetch, // Hono app（/admin/sync を含む）
};

async function runSync(env, opts) {
  const lock = await acquireLock(env.DB, { ttlMs: 10 * 60 * 1000 });
  if (!lock) return logSkipped(env.DB);

  const log = await startLog(env.DB, opts.trigger);
  try {
    let processed = 0;
    for (const range of buildA1Ranges(env)) {
      const valueRange = await fetchSheetsRange(env, { range });        // 5xx → backoff
      const rows = mapRows(valueRange.values ?? []);                    // pure
      for (const batch of chunk(rows, 100)) {
        await writeQueue.enqueue(() =>
          retryOnBusy(() => upsertMembers(env.DB, batch))               // SQLITE_BUSY backoff
        );
        processed += batch.length;
      }
    }
    await finishLog(env.DB, log.id, { status: "success", processed });
  } catch (e) {
    await finishLog(env.DB, log.id, { status: "failed", error: String(e) });
    throw e;
  } finally {
    await releaseLock(env.DB, lock.id);
  }
}
```

## sanity check

```bash
# 実装前のスナップショット
mise exec -- pnpm --filter ./apps/api wrangler d1 execute ubm_hyogo_db --env dev --local \
  --command "SELECT COUNT(*) AS n FROM members"

# 同期 1 回実行 → 件数増減を観測
curl -X POST 'http://127.0.0.1:8787/admin/sync' -H "Authorization: Bearer ${SYNC_ADMIN_TOKEN}"

# 実装後（冪等性検証）
# 同コマンドを 2 回連続実行し、members 件数が変動しないことを確認
```

## canUseTool 適用範囲

- 本 Phase 内で claude-code CLI からの自動編集が必要な場面: テスト Red ファイルの初期生成、wrangler.toml 編集。
- canUseTool による事前承認: Cloudflare Secret 登録は人手承認が必要なため、`canUseTool` で `wrangler secret put` のみ拒否し、テキスト編集系（Edit / Write）のみ許可するのが望ましい。
- 該当しないケース: D1 へのリモート migration 反映は手元 CLI から人手で実行するため canUseTool 対象外（N/A）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 検証ファイルパス 7 件を runbook Step 3 内のサブステップにマップ |
| Phase 6 | runbook で組み立てた処理に対する failure case を検証 |
| Phase 9 | coverage 実測 + 無料枠見積もり |
| Phase 11 | wrangler dev --test-scheduled / --remote の手動 smoke を再利用 |

## 多角的チェック観点

- 価値性: runbook 通りに進めれば AC-1/AC-2/AC-5/AC-10 が満たせるか。
- 実現性: Cloudflare Secret 登録 → dev デプロイ までブロックが無いか。
- 整合性: 既存 `apps/api/src/index.ts` を破壊しない差分か。
- 運用性: 二重実行防止と log 記録が、scheduled / 手動 両経路で同じコードを通るか。
- セキュリティ: SA JSON が wrangler secret 経由のみで投入されるか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 新規ファイル 9 件確定 | spec_created |
| 2 | 修正ファイル 4 件確定 | spec_created |
| 3 | runbook Step 0〜5 確定 | spec_created |
| 4 | 擬似コード記述 | spec_created |
| 5 | sanity check 整備 | spec_created |
| 6 | canUseTool 範囲判定 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/implementation-runbook.md | 新規/修正ファイル一覧・runbook・擬似コード・sanity check |
| メタ | artifacts.json | Phase 5 状態更新 |

## 完了条件

- [ ] 新規作成ファイル 9 件が一覧化
- [ ] 修正ファイル 4 件が一覧化
- [ ] runbook が Step 1〜5 で順序付き
- [ ] 擬似コードに pagination / retry / lock / log の 4 要素を含む
- [ ] sanity check コマンドが実装前後で副作用を観測可能
- [ ] canUseTool 適用範囲が明記（N/A 含む）

## タスク100%実行確認【必須】

- 実行タスク 6 件が `spec_created`
- 成果物が `outputs/phase-05/implementation-runbook.md` に配置済み
- Phase 4 のテストファイルパスが runbook 内の Step 3 に紐付けされている
- Step 1（Secret）・Step 2（migration）・Step 5（dev deploy）の省略が無い

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系検証)
- 引き継ぎ事項:
  - 擬似コード上の例外パスが Phase 6 failure case の入力となる
  - Step 4 ローカル検証手順を Phase 11 が再利用
- ブロック条件:
  - Secret 未登録のまま Phase 6 に進む
  - migration 未適用で integration テストが Red のまま
