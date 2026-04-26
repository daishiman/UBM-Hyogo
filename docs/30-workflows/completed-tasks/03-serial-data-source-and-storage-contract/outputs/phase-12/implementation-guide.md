# Phase 12 / implementation-guide.md — 実装ガイド

> **手動実行は [`doc/03-serial-data-source-and-storage-contract/outputs/phase-05/manual-execution-runbook.md`](../phase-05/manual-execution-runbook.md) を参照。** 上から順にコピペすれば Sheets→D1 sync の全インフラを構築できる**単独で完結する手動実行手順**（他ドキュメントを開かずに完了できる自己完結 runbook）。

## Part 1: 中学生レベル概念説明（例え話）

なぜ必要かを先に説明する。会員データは、入力する場所、見る場所、直す場所がばらばらだと、どれが本当の情報か分からなくなる。だから「受付で集めた情報」と「サイトが見る名簿」の役割を分け、壊れた時にどこから作り直すかを決めておく必要がある。

何をするかというと、Google Sheets に集まった回答を、Cloudflare D1 という検索しやすい台帳へ写す約束を作る。通常のサイト表示は D1 を見て、災害復旧では Sheets を元に D1 を作り直す。

UBM 兵庫支部会の会員データの流れは、学校の「受付ノート」と「図書館の正本台帳」に例えると分かりやすい。

- **Google Sheets = 受付ノート**: 入会希望者が Google Form に答えると、Sheets という大きな受付ノートに 1 行ずつ書き足される。会員自身が間違いに気付いたら、もう一度 Form に答え直すことで正しい行が増える（不変条件 7）。
- **Cloudflare D1 = 図書館の正本台帳**: 受付ノートの内容を 1 時間に 1 回コピーして、検索しやすい形で台帳にまとめる場所。サイト（マイページ・公開ディレクトリ）はこの台帳しか見ない。
- **Cloudflare Workers = 受付の窓口係**: 「ノートを見て台帳に転記する係」。1 時間に 1 度自動で動き、必要なら手で押すボタン（manual sync）もある。
- **GitHub = 変更履歴ノート**: 仕様書とコードの変更を全部記録しておく場所。
- **1Password = 鍵の保管庫**: Sheets を読むための鍵（service account JSON）を 1Password にしまっておき、Cloudflare の金庫（Secrets）にだけ預ける。リポジトリには絶対に置かない。

正本（しょうほん、本物の真実）はあくまで **Sheets** にある。台帳（D1）が壊れても、ノート（Sheets）から作り直せば良い、というのが復旧ルール（AC-4）。

### 今回作ったもの

| 作ったもの | 内容 |
| --- | --- |
| データ契約 | Sheets の回答を D1 のどの入れ物へ写すか |
| 同期手順 | 手動、1時間ごとの自動実行、作り直しの3つ |
| 復旧手順 | D1 が壊れた時に Sheets から戻す方法 |
| 証跡 | 画面変更なしのため、スクリーンショットではなく CLI / SQL ログで確認する方法 |

## Part 2: 技術者レベル詳細

| 項目 | 詳細 |
| --- | --- |
| task root | `doc/03-serial-data-source-and-storage-contract` |
| D1 schema | `member_responses` / `member_identities` / `member_status` / `sync_audit`。詳細は `outputs/phase-02/data-contract.md` と `outputs/phase-05/d1-bootstrap-runbook.md` |
| sync 方向 | Sheets → D1 一方向 |
| sync 経路 | manual / scheduled (`0 * * * *` UTC, 1h) / backfill (truncate-and-reload, responseId 冪等) |
| 配置 | `apps/api/src/sync/{client,mapping,runner,audit}.ts`（不変条件 5） |
| consent キー | Sheets layer `publicConsent`/`rulesConsent`、D1 layer `public_consent`/`rules_consent`（不変条件 2） |
| responseEmail | Sheets canonical の system field。D1 では `response_email` 列（不変条件 3） |
| admin-managed | `member_status.publish_state` / `is_deleted` / `hidden_reason` などを sync 対象外として分離（不変条件 4） |
| 復旧基準 | Sheets を真として D1 を再 backfill（AC-4） |
| key outputs | `outputs/phase-02/data-contract.md`, `outputs/phase-02/sync-flow.md`, `outputs/phase-05/d1-bootstrap-runbook.md`, `outputs/phase-10/data-decision-review.md` |
| upstream | 01b-cloudflare-base / 01c-google-workspace / 02-monorepo-runtime |
| downstream | 04-cicd-secrets / 05a-observability / 05b-smoke-readiness |
| validation focus | 4 条件 + same-wave sync |
| gate (Phase 10) | PASS |

### TypeScript interfaces

```ts
export type SyncTrigger = "manual" | "scheduled" | "backfill";
export type SyncStatus = "running" | "success" | "failed" | "partial";
export type SyncFailedReason =
  | "SHEETS_RATE_LIMIT"
  | "SHEETS_5XX"
  | "SHEETS_AUTH"
  | "D1_TX_FAIL"
  | "MAPPING_INVALID"
  | "PARTIAL_ABORT"
  | "SCHEMA_DRIFT_IGNORED";

export interface MemberResponseRecord {
  responseId: string;
  formId: string;
  revisionId: string;
  schemaHash: string;
  responseEmail?: string;
  submittedAt: string;
  editResponseUrl?: string;
  answersJson: Record<string, unknown>;
  rawAnswersJson: Record<string, unknown>;
  extraFieldsJson: Record<string, unknown>;
  unmappedQuestionIdsJson: string[];
  searchText: string;
}

export interface SyncAuditRecord {
  auditId: string;
  trigger: SyncTrigger;
  startedAt: string;
  finishedAt?: string;
  status: SyncStatus;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedReason?: SyncFailedReason;
  diffSummaryJson: Record<string, unknown>;
}
```

### APIシグネチャ

```ts
// apps/api/src/sync/runner.ts（後続実装タスクで作成）
export async function runSheetsToD1Sync(input: {
  trigger: SyncTrigger;
  backfill?: boolean;
  dryRun?: boolean;
}): Promise<SyncAuditRecord>;
```

### CLIシグネチャ

```bash
wrangler d1 execute <database-name> --env staging --command "<sql>"
wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --env staging
wrangler deploy --env staging
```

### 使用例

```bash
# staging D1 smoke
wrangler d1 execute ubm-hyogo-db-staging --env staging --command "select count(*) as n from member_responses"

# manual sync endpoint（後続実装タスク）
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://ubm-hyogo-api-staging.workers.dev/admin/sync/manual"
```

### エラーハンドリング

| error | response |
| --- | --- |
| Sheets 429 / 5xx | exponential backoff 1s/2s/4s、最終失敗時 `sync_audit.failed_reason` に記録 |
| Sheets auth error | retry せず停止し `SHEETS_AUTH` |
| D1 transaction failure | batch 全体を rollback、`inserted_count=0` |
| mapping invalid | 当該 row を skip、`skipped_count` と `MAPPING_INVALID` |

### エッジケース

| case | handling |
| --- | --- |
| responseEmail missing/change | `member_responses` へ履歴保存し、`member_identities` 更新は policy 判定へ委譲 |
| Form schema drift | 未知 field は `extra_fields_json` / `unmapped_question_ids_json` に保持 |
| concurrent sync | `sync_audit.status='running'` を mutex として後続実行を拒否 |

### 設定項目と定数一覧

| key | value |
| --- | --- |
| SYNC_BATCH_SIZE | 100 |
| SYNC_RETRY_MAX | 3 |
| SYNC_RETRY_BASE_MS | 1000 |
| SYNC_TIMEOUT_MS | 30000 |
| SYNC_SCHEDULE_CRON | `0 * * * *` |
| SYNC_DIRECTION | `Sheets→D1` |

### テスト構成

| layer | file / command | purpose |
| --- | --- | --- |
| docs output | `validate-phase-output.js doc/03-serial-data-source-and-storage-contract` | Phase成果物、artifact parity、NON_VISUAL構成を検証 |
| implementation guide | `validate-phase12-implementation-guide.js --workflow doc/03-serial-data-source-and-storage-contract --json` | Part 1 / Part 2 必須構成を検証 |
| D1 smoke | `wrangler d1 execute ubm-hyogo-db-staging --env staging --command "select 1"` | D1 binding 疎通を検証 |
| sync dry-run | `/admin/sync/manual`（後続実装） | Sheets -> D1 経路と audit 記録を検証 |

### audit reason enum

`SHEETS_RATE_LIMIT / SHEETS_5XX / SHEETS_AUTH / D1_TX_FAIL / MAPPING_INVALID / PARTIAL_ABORT / SCHEMA_DRIFT_IGNORED`

### 実装ファイル一覧

`outputs/phase-05/main.md` を参照。

### 異常系 / 復旧

`outputs/phase-06/failure-cases.md` の A1〜A7 を参照。
