# Google Workspace 実装ガイド

## Part 1: 中学生レベルでの概念説明

### なぜ Google Workspace 連携が必要なの？

学校の名簿を先生が持っていて、その名簿を見ながら出席簿を作る場面を想像してください。
名簿は「入力元」で、出席簿は「正本」です。名簿を直接書き換えるのではなく、見て必要な情報だけを写します。

このタスクでは、
- Google Sheets は入力元
- Cloudflare D1 は正本
- Service Account は自動で読むための鍵

という役割分担にします。これにより、誰が何を編集してよいかが曖昧になりません。

### なぜ OAuth と Service Account を分けるの？

OAuth は「人が自分でログインして使う鍵」、Service Account は「サーバーが自動で使う鍵」です。
人間用と自動処理用を分けると、権限の範囲が小さくなり、事故も減ります。

---

## Part 2: 技術者向け実装ガイド

### アーキテクチャ概要

```text
Google Sheets (input source)
    ↓ [Service Account JSON / https://www.googleapis.com/auth/spreadsheets.readonly]
packages/integrations/google/
    ├── sheets-client.ts   # 読み取りクライアント
    ├── sync-plan.ts       # 同期対象の整形
    └── types.ts           # 型定義
    ↓ [変換 / バリデーション]
apps/api/ (Cloudflare Workers)
    ↓ [D1 書き込み]
Cloudflare D1 (canonical DB)
```

### TypeScript 型定義

```ts
export interface GoogleSheetRow {
  responseEmail: string;
  publicConsent: boolean;
  rulesConsent: boolean;
  currentResponseId: string | null;
}

export interface GoogleWorkspaceSyncConfig {
  spreadsheetId: string;
  range: string;
  sheetName: string;
  serviceAccountJson: string;
}

export interface GoogleSheetsClient {
  readonly authType: "service_account";
}

export interface GoogleWorkspaceSyncResult {
  importedCount: number;
  skippedCount: number;
  failedCount: number;
}
```

### API signature

```ts
export async function createGoogleSheetsClient(
  serviceAccountJson: string,
): Promise<GoogleSheetsClient>;

export async function readGoogleSheetRows(
  client: GoogleSheetsClient,
  config: Pick<GoogleWorkspaceSyncConfig, "spreadsheetId" | "range" | "sheetName">,
): Promise<GoogleSheetRow[]>;

export async function syncGoogleSheetRowsToD1(
  rows: GoogleSheetRow[],
): Promise<GoogleWorkspaceSyncResult>;
```

### 使用例

```ts
const config: GoogleWorkspaceSyncConfig = {
  spreadsheetId: process.env.GOOGLE_SHEET_ID!,
  range: "Sheet1!A:Z",
  sheetName: "Sheet1",
  serviceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON!,
};

const client = await createGoogleSheetsClient(config.serviceAccountJson);
const rows = await readGoogleSheetRows(client, config);
const result = await syncGoogleSheetRowsToD1(rows);
```

### エラーハンドリングと edge cases

| ケース | 原因 | 対処 |
| --- | --- | --- |
| `403 PERMISSION_DENIED` | SA がシート共有に入っていない | シートに SA メールを「閲覧者」として追加 |
| `401 invalid_grant` | JSON key が壊れている、または失効 | 新しい key を発行して secret を更新 |
| `404 NOT_FOUND` | `GOOGLE_SHEET_ID` が誤り | Spreadsheet URL の `/d/[ID]/` を再確認 |
| `429 TOO_MANY_REQUESTS` | API quota 超過 | exponential backoff と再試行上限を設定 |
| `EMPTY_ROWS` | range が空、またはシート名誤り | range / sheetName を見直す |
| `MALFORMED_JSON` | `GOOGLE_SERVICE_ACCOUNT_JSON` が不正 | 1Password / Cloudflare Secrets の値を再投入 |

### 設定可能なパラメータと constants

| 名称 | 役割 | 推奨値 |
| --- | --- | --- |
| `READONLY_SCOPE` | Sheets 読み取り専用 scope | `https://www.googleapis.com/auth/spreadsheets.readonly` |
| `DEFAULT_RANGE` | 既定の読み取り範囲 | `Sheet1!A:Z` |
| `RETRY_LIMIT` | 再試行回数 | `3` |
| `RETRY_BACKOFF_MS` | バックオフ基準 | `500` |
| `BATCH_SIZE` | 一度に処理する件数 | `100` |

### 環境変数の置き場

| 変数名 | 種別 | 本番配置先 | ローカル正本 |
| --- | --- | --- | --- |
| GOOGLE_CLIENT_ID | OAuth client id | Cloudflare Secrets | 1Password Environments |
| GOOGLE_CLIENT_SECRET | OAuth client secret | Cloudflare Secrets | 1Password Environments |
| GOOGLE_SERVICE_ACCOUNT_JSON | SA JSON key | Cloudflare Secrets | 1Password Environments |
| GOOGLE_SHEET_ID | non-secret identifier | GitHub Variables | docs |

### 運用境界

- Google Sheets は入力元のみで、書き込み先にしない
- D1 が canonical DB で、Sheets は初期値の供給源に留める
- OAuth client は人のログイン用、Service Account は自動読み取り用
- ローカル開発は `1Password Environments` を正本にし、平文 `.env` を正本にしない
