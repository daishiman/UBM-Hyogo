# Phase 5 outputs: 実装 (GREEN) — task-05a-form-preview-503-001

## 1. 変更対象ファイル一覧

| 区分 | 絶対パス | 変更種別 |
| --- | --- | --- |
| staging D1 schema_versions レコード | （staging D1 `ubm-hyogo-db-staging` の `schema_versions` テーブル） | INSERT |
| staging D1 schema_questions レコード | （staging D1 `ubm-hyogo-db-staging` の `schema_questions` テーブル） | INSERT (空でも可、ただし fieldCount 整合のため manifest と揃える) |
| API env vars 確認 | `apps/api/wrangler.toml` (`[env.staging.vars]`) | 確認のみ（差分があれば追加） |
| structured logging（補助） | `apps/api/src/use-cases/public/get-form-preview.ts` | 最小差分（`console.warn` / `ctx.logger`） |
| RED テスト（Phase 4 で追加済み） | `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts` | GREEN 確認 |
| RED テスト（route） | `apps/api/src/routes/public/index.test.ts` | GREEN 確認 |

## 2. 主作業 1: staging D1 schema_versions 投入

### 2.1 現状確認

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT COUNT(*) AS cnt FROM schema_versions WHERE form_id='119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg' AND state='active';"
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT revision_id, form_id, state, synced_at FROM schema_versions WHERE form_id='119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg' ORDER BY synced_at DESC LIMIT 5;"
```

期待: active `schema_versions.cnt` が 0 → これが 503 の根本原因。`schema_questions` は `revision_id` で紐づくため、`form_id` 列を前提にした確認 SQL は使わない。

### 2.2 投入方針（2 案、案 A を第一選択）

**案 A: 一時的 placeholder manifest を直接 INSERT（即時復旧）**

- 目的: schema sync workflow が走るまでの繋ぎとして、空 fields の manifest を投入し 200 を返せる状態にする。
- TC-RED-01（fieldCount=0 でも 200）が本案の根拠。
- リスクは低い: form_id / revision_id / synced_at 等は schema sync 上書き対象。

```sql
-- 投入 SQL（staging のみ。production は別途承認）
INSERT INTO schema_versions (
  form_id, revision_id, schema_hash, synced_at, source_url,
  field_count, unknown_field_count, state
) VALUES (
  '119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg',
  'placeholder-rev-001',
  'placeholder-hash-001',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  'https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform',
  0, 0, 'active'
);
```

実行:

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "$(cat <<'SQL'
INSERT INTO schema_versions (
  form_id, revision_id, schema_hash, synced_at, source_url,
  field_count, unknown_field_count, state
) VALUES (
  '119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg',
  'placeholder-rev-001',
  'placeholder-hash-001',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  'https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform',
  0, 0, 'active'
);
SQL
)"
```

**案 B: 既存 schema sync workflow を staging で trigger（恒久解決）**

- 目的: 実フォーム schema を staging に同期し、production と同等の fields 件数で manifest を投入する。
- 前提: `apps/api` 側に schema sync エンドポイントまたは GitHub Actions workflow が存在すること。存在しない場合は別タスクで設計（本タスクでは案 A で先行復旧、追跡 issue を起こす）。

### 2.3 検証

```bash
# staging API curl 検証
curl -i https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview

# 期待: HTTP/2 200 / body に { manifest: { formId: "119ec539...", fieldCount: 0, ... }, fields: [], ... }
```

### 2.4 rollback 手順

```sql
DELETE FROM schema_versions
WHERE form_id='119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg'
  AND revision_id='placeholder-rev-001';
```

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "DELETE FROM schema_versions WHERE form_id='119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg' AND revision_id='placeholder-rev-001';"
```

## 3. 主作業 2: コード変更（最小差分）

### 3.1 第一選択 — コード変更ゼロ

schema sync の責務分離が成立しているため、コード差分は不要。Phase 4 の TC-RED-02（env fallback）は既存実装で GREEN になる想定。

### 3.2 補助 — structured logging 追加（推奨）

**目的**: 503 が再発した際に root cause（`manifest=null` / `formId` mismatch / D1 query failure）を 1 分以内に特定できるようにする。

**差分案** (`apps/api/src/use-cases/public/get-form-preview.ts`):

```ts
const manifest = await getLatestVersion(ctx, formId);
if (!manifest) {
  // structured log: staging tail で grep 容易に
  console.warn(JSON.stringify({
    level: "warn",
    code: "UBM-5500",
    where: "getFormPreviewUseCase",
    formId,
    msg: "schema_versions row missing — returning 503",
  }));
  throw new ApiError({
    code: "UBM-5500",
    detail: "公開可能な schema_versions が未投入です。schema sync 完了後に再実行してください。",
  });
}
```

- API shape は不変。
- TC-RED-03 は status code のみ assert するため影響なし。

## 4. 主作業 3: env vars 整合確認

`apps/api/wrangler.toml` の現状（既存設定）:

```toml
[env.staging.vars]
FORM_ID = "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg"
GOOGLE_FORM_ID = "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg"
```

`GOOGLE_FORM_RESPONDER_URL` の有無を確認する:

```bash
grep -n "GOOGLE_FORM_RESPONDER_URL" apps/api/wrangler.toml
```

未設定の場合、`[env.staging.vars]` に追加:

```toml
GOOGLE_FORM_RESPONDER_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform"
```

未設定でも `FALLBACK_RESPONDER_URL` が効くため即時復旧には影響しないが、回帰防止のため明示推奨。

## 5. 実行コマンド

```bash
# 1. ローカル GREEN 確認
pnpm exec vitest run apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts apps/api/src/routes/public/index.test.ts

# 2. typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 3. staging D1 確認 → 投入 → 検証
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT COUNT(*) FROM schema_versions WHERE form_id='119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg' AND state='active';"
# 上記が 0 件なら 2.2 案 A の INSERT を実行
curl -i https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview

# 4. wrangler tail で 503 が消えたことを確認
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging
```

## 6. 差分確認

```bash
# code 差分（structured logging 追加時のみ）
git diff apps/api/src/use-cases/public/get-form-preview.ts

# wrangler.toml 差分（必要時のみ）
git diff apps/api/wrangler.toml
```

## 7. DoD（Phase 5）

- [ ] staging `curl /public/form-preview` が **HTTP 200** を返す（evidence: `outputs/phase-11/staging-curl.txt`）。
- [ ] Phase 4 で追加した TC-RED-01 / 02 / 03 が GREEN。
- [ ] structured logging を追加した場合、staging `wrangler tail` で `code: "UBM-5500"` が出ないことを確認。
- [ ] rollback SQL が記録され、staging で実行可能な状態。
- [ ] `pnpm typecheck` / `pnpm lint` が GREEN。
