# 実装ガイド — forms-schema-sync-and-stablekey-alias-queue

PR メッセージ・運用ドキュメント・後続タスクの引き継ぎ材料を兼ねた実装ガイド。

---

## Part 1: 初学者・中学生レベル

### 困りごと（before）

UBM 兵庫支部会の入会フォームは Google Form で運営されている。事務局が
「自己紹介の質問を 1 つ追加したい」と思ったとき、**フォームを編集すると
すぐにアプリ側の表示がズレる**。なぜなら、これまで「この質問は名前」
「この質問は所属」とアプリのコードに **直接書き込んでいた** から。
質問の並び替えひとつで表示が壊れる。

### 解決後（after）

質問ひとつずつに「永続ラベル」（`stableKey`）を貼っておく。アプリは
ラベルだけを見て動く。新しい質問が追加されても、まずは「未処理ボックス」
（`schema_diff_queue`）に入るだけで、アプリは **壊れない**。
管理者が後でラベルを付けると（07b の作業）、次回からはラベル経由で
正しく表示される。

### このタスクで作るもの

1. 毎日 1 回、Google Form の最新版を覗きにいく自動 job（schema sync）
2. 知っている質問（31 項目）は帳簿（`schema_questions`）を更新
3. 知らない新規質問は未処理ボックス（`schema_diff_queue`）に登録
4. 同じ作業が二重に走らないように、作業ノート（`sync_jobs`）に
   「いま実行中」と書いてからスタート（重複防止）
5. 管理者が手動で叩ける入口 `POST /admin/sync/schema`

### 専門用語ミニ辞典

| 用語 | 意味 |
| --- | --- |
| `stableKey` | 質問に貼る永続ラベル（例: `selfIntro`）。質問文が変わっても変えない |
| `revisionId` | Google Form 側のバージョン番号。同じなら再処理不要 |
| `schema_diff_queue` | 未処理の差分（新規 / 変更 / 削除 / ラベル未割当）を貯める箱 |
| `sync_jobs` | 同期作業の実行記録（running / succeeded / failed） |
| cron | 毎日決まった時刻に自動実行する仕組み |

---

## Part 2: 開発者・技術者レベル

### アーキテクチャ

```
Cloudflare Workers Cron (1日1回 03:00 JST)
        │
        ▼
   apps/api/src/sync/schema/forms-schema-sync.ts
        │
        ├── forms.get (Google Forms API、Service Account JWT)
        ├── flatten() — 31 項目 / 6 セクションを行展開
        ├── resolveStableKey() — alias 解決（未解決は queue へ）
        ├── schemaHash → schema_versions upsert（revisionId 一致なら no-op）
        ├── schema_questions upsert
        └── schema_diff_queue 書き込み（added / changed / removed / unresolved）
        │
        ▼
   D1 (sync_jobs ledger: running → succeeded / failed)

POST /admin/sync/schema  ←── 手動 entry（admin-gate middleware で保護）
```

不変条件: D1 への直接アクセスは `apps/api` 配下のみ（#5）。

### 主要 interface / type

```ts
// apps/api/src/sync/schema/types.ts
export interface RawFormsItem {
  itemId: string;
  title: string;
  type: 'TEXT' | 'PARAGRAPH' | 'CHOICE' | 'CHECKBOX' | 'GRID' | 'DATE' | 'TIME' | 'SCALE';
  required: boolean;
  options?: string[];
  sectionId?: string;
}

export interface FlattenedQuestion {
  itemId: string;
  sectionId: string;
  ordinal: number;
  title: string;
  type: RawFormsItem['type'];
  required: boolean;
  options: string[] | null;
}

export interface ResolvedQuestion extends FlattenedQuestion {
  stableKey: string | null; // null → schema_diff_queue へ unresolved として登録
}

export type DiffKind = 'added' | 'changed' | 'removed' | 'unresolved';

export interface SchemaSyncResult {
  jobId: string;
  status: 'succeeded' | 'failed';
  stats: {
    questionsTotal: number;       // 期待 31
    sectionsTotal: number;        // 期待 6
    diffQueueAdded: number;
    schemaVersionCreated: boolean;
  };
}

export interface SchemaSyncDeps {
  formsClient: { get: (formId: string) => Promise<RawFormsItem[]> };
  repo: SchemaRepository;
  syncJobs: SyncJobsRepository;
  clock: () => Date;
  uuid: () => string;
}
```

### API シグネチャ

```ts
// apps/api/src/sync/schema/forms-schema-sync.ts
export async function runSchemaSync(
  env: Env,
  deps?: Partial<SchemaSyncDeps>
): Promise<SchemaSyncResult>;
```

### endpoint

```
POST /admin/sync/schema
Authorization: Bearer <admin token>

200 OK    { jobId, status: "succeeded", stats: { ... } }
401       missing admin token
403       invalid admin token
409       schema_sync already running
500       internal error（status=failed が sync_jobs に記録される）
```

### 使用例

```bash
# 手動同期（admin token 必須）
curl -X POST https:/-hyogo-hyogo/api.ubm-hyogo.example/admin/sync/schema \
  -H 'Authorization: Bearer $ADMIN_TOKEN'

# cron は 1 日 1 回 03:00 JST に同 entry を起動
```

### エラーハンドリング・エッジケース

| ケース | 挙動 |
| --- | --- |
| `revisionId` が前回と同一 | schema_versions に重複 row を作らず no-op（AC-4） |
| Google Forms API 5xx | sync_jobs status=`failed`、再実行は次 cron（retry なし、無料枠保護） |
| Service Account JWT 期限切れ | `failed` 記録 + 監査用 reason 保存 |
| 同種 job 並走 | 後発 request は 409 Conflict（AC-6） |
| stableKey 未解決の question | `schema_diff_queue` に `unresolved` 1 row（AC-2） |
| 既知 31 項目に欠落 | assertion failure → status=`failed`（AC-8） |

### 設定可能パラメータ

| 設定 | 場所 | 値 |
| --- | --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Cloudflare Secrets | サービスアカウント email |
| `GOOGLE_PRIVATE_KEY` | Cloudflare Secrets | サービスアカウント private key |
| `GOOGLE_FORM_ID` | Cloudflare Secrets | `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` |
| cron schedule | `apps/api/wrangler.toml` | `0 18 * * *` (UTC) = 03:00 JST |

### 検証コマンド

```bash
# 型・lint・test（既存 PASS 194 / 194）
mise exec -- pnpm --filter @ubm-hyogo-hyogo-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo-hyogo-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo-hyogo-hyogo/api test

# D1 row 確認（local）
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --local \
  --command "SELECT count(*) FROM schema_questions"  # → 31
```

### 禁止事項（AI / 開発者共通）

1. **stableKey 文字列リテラルをアプリコードに直書きしない**（不変条件 #1 / AC-7）
   - alias テーブル経由 or `resolveStableKey()` 経由のみ
2. **GAS prototype のロジックを apps/api に移植しない**（#6）
3. **`apps/web` から D1 を直接読まない**（#5）
4. cron 頻度を 1 日 1 回より増やさない（#10 無料枠）
5. `wrangler` を直接呼ばない。`scripts/cf.sh` 経由で 1Password injection を保つ

### 運用

- 平常時: cron が 03:00 JST に自動実行。`sync_jobs` を `kind=schema_sync` で監視
- 手動: 上記 curl
- 失敗時: `sync_jobs.status=failed` の row から `reason` を確認 → 必要なら手動再実行
- alias 未解決が増えた場合: 07b の admin workflow で割当 → 次回 sync で `unresolved` が減る

### 下流タスクへの連携

| タスク | 連携内容 |
| --- | --- |
| 04c admin-backoffice-api-endpoints | 本タスクが提供する `POST /admin/sync/schema` を expose |
| 06c admin schema page | `schema_questions` / `schema_diff_queue` を読み取り表示 |
| 07b schema-diff-alias-assignment-workflow | `schema_diff_queue` の resolve / `schema_aliases` 書き込み |
| wave 9b infrastructure activation | Cloudflare secret provisioning / staging 実 Forms smoke |

### AC 遵守トレース

| AC | 担保箇所 |
| --- | --- |
| AC-1 31項目・6セクション保存 | `flatten.test.ts`、`forms-schema-sync.test.ts` |
| AC-2 unresolved 1件=1row | `diff-queue-writer.test.ts` |
| AC-3 alias resolve 後 unresolved 減 | `resolve-stable-key.test.ts` |
| AC-4 同一 revisionId no-op | `schema-hash.test.ts` |
| AC-5 sync_jobs 遷移 | `forms-schema-sync.test.ts` |
| AC-6 同種 job 409 | `sync-schema.test.ts` |
| AC-7 stableKey 直書き禁止 | resolveStableKey 経路 + 残課題: ESLint custom rule (wave 8b) |
| AC-8 31項目欠落 assertion | `forms-schema-sync.test.ts` |
