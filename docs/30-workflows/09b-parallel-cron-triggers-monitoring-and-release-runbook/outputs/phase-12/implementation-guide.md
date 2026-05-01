# implementation-guide

## Part 1: 初学者・中学生レベル

### なぜこの runbook が必要か（日常生活の例え話）

学校の文化祭で「毎時 0 分に放送室で校内アナウンスを流す」と決めたとします。アナウンス係が休んだら誰かが代わりに、不具合が起きたら誰がいつ何をするか、事前に紙の手順書（runbook）を作っておけば、当日に慌てず誰でも対応できます。

UBM 兵庫支部会のサイトでも同じです。

- 「15 分ごとに Google Form の新しい回答をサイトに反映する」 = 自動アナウンス
- 「サイトを新しいバージョンにする / 不具合が起きたら戻す」 = 文化祭前後の機材入れ替え

これを **誰でも同じ手順で実行できる** ようにしたのが本 runbook です。

### 困りごと（before）と解決後の状態（after）

| | before | after |
| --- | --- | --- |
| 自動反映 | 反映タイミングがバラバラ、止まったときに気づかない | 15 分ごとに動き、止まったら検知できる |
| 障害対応 | 誰が何をするか毎回相談 | runbook を見れば手順がわかる |
| 元に戻す | 元のバージョンに戻す方法がわからない | コマンド 2〜3 行で戻せる |

### 専門用語の短い説明

- **cron（クーロン）**: 「毎時 0 分」「15 分ごと」のように時刻を指定して自動でプログラムを動かす仕組み
- **rollback（ロールバック）**: 新しくしたバージョンを「ひとつ前の状態」に戻すこと
- **D1**: Cloudflare の小さなデータベース。会員情報や出席情報を保存する
- **Workers**: サイトの裏側で動くプログラム置き場。`0 * * * *` のような時刻指定で動く

## Part 2: 開発者・技術者レベル

### TypeScript / wrangler.toml interface

```typescript
// 本 runbook では cron handler の型のみを参照仕様として記載（実装は 03a/03b）
interface ScheduledEnv {
  DB: D1Database; // Workers binding
  // ...他 secret / config
}

export default {
  async scheduled(event: ScheduledEvent, env: ScheduledEnv, ctx: ExecutionContext) {
    // event.cron === '0 * * * *' | '*/15 * * * *' | '0 18 * * *' を判別
    // sync_jobs running guard を実行（spec/03-data-fetching.md 準拠）
    // type を決めて sync を起動
  },
};
```

```toml
# apps/api/wrangler.toml（current facts、09b では変更しない）
name = "ubm-hyogo-api-staging"
main = "src/index.ts"
compatibility_date = "2026-04-26"

[[d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db-staging"
database_id = "<staging_database_id>"

[triggers]
crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]

[env.production]
name = "ubm-hyogo-api"

[[env.production.d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db-prod"
database_id = "<production_database_id>"

[env.production.triggers]
crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]
```

### API シグネチャ（admin endpoint, 04c 仕様と同期）

```http
POST /admin/sync/schema
Authorization: Bearer <admin_token>
→ 200 OK { "sync_job_id": <number>, "status": "running" | "skipped_due_to_running" }

POST /admin/sync/responses
Authorization: Bearer <admin_token>
→ 200 OK 同上
```

### エラーハンドリング & エッジケース

| ケース | 振る舞い |
| --- | --- |
| `sync_jobs.running` 既存 | skip（status 200 + `skipped_due_to_running`） |
| Forms API 429 | sync_jobs.failed + error="rate limit"。次 cron で自然 retry |
| D1 timeout | sync_jobs.failed + error="timeout"。02a/b で query 最適化 |
| 部分失敗（一部 response の解釈失敗） | 直近成功 view model 維持、`partial_failures` 記録 |

### 設定可能なパラメータ / 定数

| 種別 | 値 | 配置 |
| --- | --- | --- |
| cron schedule | `0 * * * *`, `*/15 * * * *`, `0 18 * * *` | `apps/api/wrangler.toml` |
| sync_jobs `type` enum | `'sheets' \| 'responses' \| 'schema'` | apps/api 内 |
| running guard 30 分タイムアウト | 30 分 | spec/03-data-fetching.md（実装は 03b） |
| 無料枠 | Workers 100k req/day | spec/08-free-database.md |

### 実行コマンド一覧

```bash
# deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml [--env production]

# rollback
bash scripts/cf.sh rollback <deploy_id> --config apps/api/wrangler.toml [--env production]

# d1 migrations
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production

# d1 query
wrangler d1 execute ubm-hyogo-db-staging --command "SELECT ..." --config apps/api/wrangler.toml

# manual sync
curl -X POST https://ubm-hyogo-api.<account>.workers.dev/admin/sync/{schema,responses} \
  -H "Authorization: Bearer <admin_token>"
```

### 検証コマンド

```bash
# cron 表記検査（U-1 + U-3）
rg '^\s*crons\s*=' apps/api/wrangler.toml
rg -i 'apps_script|google\.script' apps/api/

# 二重起動 guard 確認
wrangler d1 execute ubm-hyogo-db-staging \
  --command "SELECT COUNT(*) FROM sync_jobs WHERE status='running';" \
  --config apps/api/wrangler.toml

# attendance 整合性（不変条件 #15）
wrangler d1 execute ubm-hyogo-db-prod \
  --command "SELECT meeting_id, member_id, COUNT(*) c FROM member_attendance WHERE deleted_at IS NULL GROUP BY meeting_id, member_id HAVING c > 1;" \
  --config apps/api/wrangler.toml --env production
```

### sync_jobs running guard ヒント（実装は 03b）

```typescript
// pseudo
async function runSync(env: ScheduledEnv, type: 'responses' | 'schema' | 'sheets') {
  const running = await env.DB
    .prepare("SELECT id FROM sync_jobs WHERE type = ? AND status = 'running'")
    .bind(type).first();
  if (running) {
    console.log(`skip: existing running job ${running.id}`);
    return { skipped: true };
  }
  const inserted = await env.DB
    .prepare("INSERT INTO sync_jobs (type, status, started_at) VALUES (?, 'running', datetime('now')) RETURNING id")
    .bind(type).first<{ id: number }>();
  try {
    await doSync(env, type);
    await env.DB
      .prepare("UPDATE sync_jobs SET status='success', finished_at=datetime('now') WHERE id=?")
      .bind(inserted!.id).run();
  } catch (e) {
    await env.DB
      .prepare("UPDATE sync_jobs SET status='failed', error=?, finished_at=datetime('now') WHERE id=?")
      .bind(String(e), inserted!.id).run();
    throw e;
  }
}
```

### 不変条件への対応（実装者向け）

- #5: `apps/web` 配下に `D1Database` import を一切書かない。Web は `fetch()` 経由で `apps/api` を叩く
- #6: cron は wrangler.toml `[triggers]` のみ。GAS apps script trigger を作らない
- #10: cron 頻度を増やすときは無料枠 100k req/day を必ず試算
- #15: 任意のデータ更新後 attendance 整合性 SQL を runbook で実行

### cron 実装の入口

- 03b（`forms-response-sync-and-current-response-resolver`）で response sync を実装
- 03a（`forms-schema-sync-and-stablekey-alias-queue`）で schema sync を実装
- legacy `0 * * * *`（Sheets sync）の撤回は UT21-U05 に委譲

### sync_jobs running guard 強化のヒント

- unique index `(type, status) WHERE status='running'` を追加すると DB 層で二重起動を弾ける
- ただし SQLite/D1 の partial unique index 対応を要確認
- 30 分以上 running の cleanup を別 cron `0 */1 * * *` で担保する案もあり（要試算）
