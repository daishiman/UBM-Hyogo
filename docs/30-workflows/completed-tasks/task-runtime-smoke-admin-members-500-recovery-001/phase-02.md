# Phase 2: 設計

[実装区分: 実装仕様書]

## 1. 根本原因切り分け手順（read-only 先行）

### Step A: staging API の 500 body を直接取得
```bash
# 1Password から STAGING_ADMIN_BEARER / STAGING_API_BASE を注入して実行
bash scripts/with-env.sh -- bash -c '
  curl -sS -H "authorization: Bearer $STAGING_ADMIN_BEARER" \
       -w "\nhttp=%{http_code}\n" \
       "$STAGING_API_BASE/admin/members" | tee outputs/phase-02/admin-members-500.txt
'
```
- `error` フィールドの内容で zod / SQL / middleware を切り分け

### Step B: staging D1 schema を確認
```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "PRAGMA table_info(member_status);"
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "PRAGMA table_info(member_responses);"
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "PRAGMA table_info(identity_aliases);"
```

### Step C: Workers 側 tail で realtime trace
```bash
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging --format pretty
# 別 shell で再度 curl して 500 path を確認
```

## 2. 修正方針マトリクス

| 仮説 | 確認シグナル | 修正先 | 修正種別 |
|------|-------------|--------|---------|
| zod safeParse 失敗 | 500 body `error` が zod 文字列 | `apps/api/src/routes/admin/members.ts` view 構築の defensive normalize、または `AdminMemberListViewZ` 緩和 | code |
| SQL: テーブル不在 | tail に `no such table: <X>` | staging migration apply | infra (`scripts/cf.sh d1 migrations apply ...`) |
| SQL: 列不在 | tail に `no such column` | migration 追加 + apply | infra + schema |
| middleware throw | tail に provider 初期化 stack | `middleware/repository-providers.ts` の防御 | code |
| binding 不在 | tail に `c.env.DB is undefined` | `apps/api/wrangler.toml` `[env.staging]` 修正 | config |

## 3. smoke runner の error visibility 強化（副次タスク）
`scripts/smoke/runtime-attendance-provider.sh:150-157` の non-200 path で body を `$OUT_LOG` に必ず転記する（現在は header だけ書き、body は捨てている）。

```diff
-  if [[ "$status" != "200" ]]; then
-    {
-      printf '===== %s GET =====\n' "$label"
-      printf 'status=%s\n' "$status"
-      printf 'contract=%s\n\n' "$jq_filter"
-    } >> "$OUT_LOG"
+  if [[ "$status" != "200" ]]; then
+    {
+      printf '===== %s GET =====\n' "$label"
+      printf 'status=%s\n' "$status"
+      printf 'contract=%s\n' "$jq_filter"
+      printf 'body=%s\n\n' "$(head -c 2000 "$body_file" | tr -d '\0')"
+    } >> "$OUT_LOG"
```

## 4. Phase 2 DoD
- root cause 切り分け 3 step が出力先付きで定義
- 仮説 → 修正先のマトリクスが確定
- smoke runner 強化 diff が確定
