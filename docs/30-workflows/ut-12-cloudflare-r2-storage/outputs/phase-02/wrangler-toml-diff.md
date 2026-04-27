# Phase 2 成果物: wrangler.toml 追記差分 (wrangler-toml-diff.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 |
| Phase | 2 |
| 作成日 | 2026-04-27 |
| 対象ファイル | `apps/api/wrangler.toml`（**設計サンプルのみ・実ファイルは編集しない**） |
| 設置禁止ファイル | `apps/web/wrangler.toml`（不変条件 5） |

## 1. 設計差分（apps/api/wrangler.toml への追記）

```diff
  # apps/api/wrangler.toml
  name = "ubm-hyogo-api"
  main = "src/index.ts"
  compatibility_date = "2025-01-01"

  [env.staging]
  # 既存: D1 / KV 等のバインディング
+
+ # R2 binding: file uploads/downloads via apps/api only (不変条件 5)
+ [[env.staging.r2_buckets]]
+ binding = "R2_BUCKET"
+ bucket_name = "ubm-hyogo-r2-staging"

  [env.production]
  # 既存: D1 / KV 等のバインディング
+
+ # R2 binding: file uploads/downloads via apps/api only (不変条件 5)
+ [[env.production.r2_buckets]]
+ binding = "R2_BUCKET"
+ bucket_name = "ubm-hyogo-r2-prod"
```

## 2. 設計判断

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| バインディング名 | `R2_BUCKET` | 全環境共通 / アプリコードからは単一識別子で参照可能 |
| 設置先 | `apps/api/wrangler.toml` のみ | 不変条件 5（apps/web からの R2 直接アクセス禁止） |
| 環境スコープ | `[env.staging]` / `[env.production]` | 環境別バケット名分離（採用案A: 環境別 2 バケット） |
| Section type | `[[env.<env>.r2_buckets]]` | TOML の table-of-arrays 構文 |

## 3. 設置禁止の確認 (`apps/web/wrangler.toml`)

```toml
# apps/web/wrangler.toml には以下のセクションを絶対に追加しない:
#
# [[r2_buckets]]              # NG（不変条件 5 違反）
# [[env.staging.r2_buckets]]  # NG
# [[env.production.r2_buckets]] # NG
```

Phase 4 precheck-checklist で `grep` 検証する。Phase 6 FC-05 で混入検出を再確認。

## 4. デプロイ前検証コマンド（Phase 5 で実行）

```bash
# 構文検証（実デプロイなし）
wrangler deploy --dry-run --env staging
wrangler deploy --dry-run --env production
```

期待: エラーなく完了し、バインディング `R2_BUCKET` が出力される。

## 5. ランタイム参照例（実装は将来タスク / 設計サンプル）

```ts
// apps/api/src/routes/uploads.ts (将来実装予定)
import { Hono } from 'hono';

type Env = {
  R2_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Env }>();

app.put('/objects/:key', async (c) => {
  const key = c.req.param('key');
  const body = await c.req.arrayBuffer();
  await c.env.R2_BUCKET.put(key, body);
  return c.json({ ok: true, key });
});
```

## 6. 注意事項

- TOML の `[[env.production.r2_buckets]]` はテーブル配列 (`array of tables`) のため、複数バケット定義時は同じヘッダを繰り返す
- `binding` / `bucket_name` 以外の任意キー（`preview_bucket_name` 等）は MVP では使用しない
- `wrangler.toml` の上部 `[[r2_buckets]]`（環境スコープなし）は使わない（環境分離が崩れるため）

## 7. AC-2 充足見込み

- `[env.production]` / `[env.staging]` の双方に `[[r2_buckets]]` が記載: PASS
- バインディング名 `R2_BUCKET` が全環境統一: PASS
- バケット名が 01b 命名トポロジーに整合: PASS
- apps/web 非対象が明示: PASS

## 8. 完了条件チェック

- [x] 追記差分が production / staging 両環境で記載
- [x] バインディング名が `R2_BUCKET` で統一
- [x] apps/web 非設置の方針が明記
- [x] dry-run コマンドが記載
- [x] ランタイム参照例（将来実装）が記載
