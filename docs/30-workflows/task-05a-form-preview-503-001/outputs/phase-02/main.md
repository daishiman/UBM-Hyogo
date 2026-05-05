# Phase 2 本文 — 設計

## 0. ゴール

503 の root cause 仮説を 3 系統に分解し、それぞれの検証手順・修正案・選定基準を明文化する。さらに修正対象ファイル一覧、関数シグネチャ（既存維持）、テスト方針、DoD を確定する。

## 1. 503 発生メカニズム（再掲）

`get-form-preview.ts` の `getLatestVersion(ctx, formId)` が `null` を返すと `UBM-5500` (HTTP 503) が throw される。`null` 返却条件は `schemaVersions` repository の SQL 結果が空であることに帰着する。よって null となる原因が 503 の root cause となる。

```
HTTP 503 (UBM-5500)
  └─ getLatestVersion() returns null
       ├─ [A] staging D1 の schema_versions に該当 form_id レコード未投入
       ├─ [B] env (GOOGLE_FORM_ID / FORM_ID) が staging D1 内の form_id と不整合
       └─ [C] D1 binding (DB) が staging Worker で別 D1 にバインドされている / 名前ズレ
```

## 2. Root Cause 仮説 3 系統

### 仮説 A: staging D1 `schema_versions` 未投入 / 失効

- **想定**: staging D1 はマイグレーション直後で `schema_versions` テーブルは存在するが、レコード 0 件。あるいは `state` が `published` 以外で `getLatestVersion` のフィルタに掛からない。
- **検証手順**:
  1. `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT form_id, revision_id, state, synced_at FROM schema_versions ORDER BY synced_at DESC LIMIT 10"`
  2. 期待: `form_id = 119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` のレコードが少なくとも 1 件、`state = 'active'` で存在。
  3. 0 件なら仮説 A 確定。
- **修正案**:
  - production の `schema_versions` / `schema_questions` を `bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output prod-schema.sql` で export。
  - 該当 2 テーブルの INSERT 文を抽出し、staging へ `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --file <抽出 SQL>` で投入。
  - もしくは staging に対し schema sync ジョブ（既存 admin API 経路）を 1 回手動実行。
- **再発防止**: staging 用 seed migration を `apps/api/migrations/` 配下に追加し、初期化時に最低 1 件の `schema_versions` を保証する選択肢を検討（仕様変更でないため許容）。

### 仮説 B: env `GOOGLE_FORM_ID` / `FORM_ID` 不整合

- **想定**: staging Worker の env で `GOOGLE_FORM_ID` または `FORM_ID` が production と異なる値、もしくは未設定で fallback 値（`FALLBACK_FORM_ID = 119ec539...`）が使われ、D1 内 `schema_versions.form_id` と一致せず空ヒット。
- **検証手順**:
  1. `bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env staging` で deploy 確認。
  2. `apps/api/wrangler.toml` の `[env.staging.vars]` セクションを Read し `GOOGLE_FORM_ID` / `FORM_ID` の有無確認。
  3. staging D1 の `schema_versions.form_id` と env の form id を照合。
- **修正案**:
  - `apps/api/wrangler.toml` の staging env に `GOOGLE_FORM_ID = "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg"` を明示設定。
  - もしくは D1 側 `form_id` を env と一致させる（基本は env を正本とする）。
  - 修正後 `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`。

### 仮説 C: D1 binding 不整合

- **想定**: staging Worker の `[[d1_databases]]` binding が実際には production / 別環境の D1 を指している、または database_id が古い。
- **検証手順**:
  1. `apps/api/wrangler.toml` の `[[env.staging.d1_databases]]` の `database_name` / `database_id` を Read。
  2. `bash scripts/cf.sh d1 list` の出力と照合（`ubm-hyogo-db-staging` の id が一致するか）。
  3. 一致しない場合は仮説 C 確定。
- **修正案**:
  - `wrangler.toml` の `database_id` を正しい staging の ID に修正し、再 deploy。
  - 仮に本番 D1 を staging に誤バインドしていた場合は即時切替（本番データ汚染を避けるため、まず読み取り経路のみで挙動確認）。

## 3. 仮説の検証順序と選定基準

検証は **A → C → B** の順で行う（コスト低・確定容易順）:

1. A の SQL 1 本で 0 件確認できれば確定（最頻パターン）。
2. A 否定なら C（wrangler.toml diff のみ、コードレス）。
3. B は env の比較が必要だが、A/C 否定後の残余として扱う。

複数仮説が同時成立し得る場合は、**A を最初に解消**してから残余を確認する（schema 投入は他要因の前提条件のため）。

## 4. 修正対象ファイル一覧

| パス | 変更種別 | 備考 |
| --- | --- | --- |
| `apps/api/src/use-cases/public/get-form-preview.ts` | **不変（編集なし）** | 503 throw は適切な防御的挙動。仕様変更しない |
| `apps/api/src/repository/schemaVersions.ts` | **不変（編集なし）想定** | `getLatestVersion` の SQL を Read で確認のみ |
| `apps/api/wrangler.toml` | 仮説 B/C 確定時のみ編集 | env / d1 binding の修正 |
| `apps/api/migrations/` 配下に新規 SQL（仮説 A 確定時） | 新規追加（任意） | staging seed として `schema_versions` / `schema_questions` の minimum 1 件 |
| `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts` | テスト追加 | env fallback / 空 schema_versions の境界ケースを追加し回帰防止 |
| `docs/30-workflows/task-05a-form-preview-503-001/outputs/phase-12/implementation-guide.md` | 更新 | 確定 root cause と再発防止策 |

## 5. 関数シグネチャ（既存維持）

```ts
// apps/api/src/use-cases/public/get-form-preview.ts
export interface GetFormPreviewEnv {
  GOOGLE_FORM_ID?: string | undefined;
  FORM_ID?: string | undefined;
  GOOGLE_FORM_RESPONDER_URL?: string | undefined;
}

export interface GetFormPreviewDeps {
  ctx: DbCtx;
  env: GetFormPreviewEnv;
}

export const getFormPreviewUseCase = (
  deps: GetFormPreviewDeps,
) => Promise<FormPreviewResponse>;
```

- 入力: D1 ctx と env（form id / responder url の上書き候補）。
- 出力: `FormPreviewResponse`（`view-models/public/form-preview-view.ts` で定義）。
- 副作用: D1 への 2 回の SELECT（`schema_versions` 1 行、`schema_questions` N 行）。書き込みなし。
- エラー: `UBM-5500`（schema 未投入）。本タスクでは throw 仕様は変更しない。

## 6. テスト方針（vitest）

ファイル: `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts`

追加するケース:

1. **既存維持**: `schema_versions` 0 件で `UBM-5500` を throw（既存）。
2. **追加 1**: env `GOOGLE_FORM_ID` 指定時、その値で `getLatestVersion` が呼ばれること（モック spy で formId 引数を検証）。
3. **追加 2**: env 未指定時に `FALLBACK_FORM_ID` が使われること。
4. **追加 3**: env `GOOGLE_FORM_RESPONDER_URL` 指定時に response の responderUrl が反映されること。
5. **追加 4**: `schema_versions` あり + `schema_questions` 0 件時に response.fields が空配列で 200 相当（throw しない）こと。

ローカル実行コマンド:

```bash
pnpm exec vitest run apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts apps/api/src/routes/public/index.test.ts
```

## 7. staging / production 検証コマンド

```bash
# 503 再現確認
curl -s -o /dev/null -w "%{http_code}\n" https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview

# tail で stack trace 取得（5 分以内）
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging

# staging D1 の schema_versions 確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT form_id, revision_id, state, synced_at FROM schema_versions ORDER BY synced_at DESC LIMIT 10"

# production との差分確認
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output /tmp/prod-schema.sql
bash scripts/cf.sh d1 export ubm-hyogo-db-staging --env staging --output /tmp/staging-schema.sql
diff <(grep schema_versions /tmp/prod-schema.sql) <(grep schema_versions /tmp/staging-schema.sql)

# /register ページ確認
curl -s -o /dev/null -w "%{http_code}\n" https://<web-staging-host>/register
```

## 8. DoD（Definition of Done）

- [ ] AC-1 〜 AC-6 すべて満たされ evidence が揃う。
- [ ] root cause 仮説 A/B/C のいずれが真因か `outputs/phase-12/implementation-guide.md` に確定記述。
- [ ] vitest 追加ケース（4 件）が green。
- [ ] staging / production 双方で `/public/form-preview` が 200。
- [ ] `apps/api` 以外から D1 を直アクセスする変更がないことを `git diff main...HEAD` で確認。
- [ ] API response schema が変更されていない（`view-models/public/form-preview-view.ts` 不変）。
- [ ] CLAUDE.md 不変条件 1〜7 を破っていない。

## 9. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| production schema を staging に同期する際、本番固有データ（個人情報）の混入 | プライバシー違反 | `schema_versions` / `schema_questions` のみを抽出し、`form_responses` 等は触らない |
| seed migration が production に流れる | 本番データ汚染 | migration ファイルを staging 専用 directory または条件付きで運用、適用先を `--env staging` に限定 |
| 仮説 C（binding 不整合）が真因の場合、本番 D1 を誤って staging から書き換えるリスク | 致命的 | 確定前は SELECT のみ。binding 修正は wrangler.toml の差分レビュー後に deploy |
| `wrangler tail` で機密が log される | 情報漏洩 | tail 出力をリポジトリにコミットしない、evidence は機密マスク後に保存 |
