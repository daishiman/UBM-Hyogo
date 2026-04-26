# 手動実行 runbook — Sheets → D1 sync 構築（自己完結版）

> **目的**: このドキュメント 1 本だけ読めば、UBM 兵庫支部会の Google Sheets → Cloudflare D1 sync インフラを 0 から構築できる。他ドキュメントを開かずに上から順にコピペで完了させるための完全自己完結手順書。
> **更新日**: 2026-04-26（Cloudflare D1 / Google Workspace / 1Password CLI / GitHub CLI 公式仕様反映）。
> **本書の位置付け**: 単独で完結する手動実行手順。本書の参考リンク（Cloudflare/Google/1Password/GitHub CLI 公式）は補足であり、参照しなくても作業は完了できる構造になっている。

---

## ⚡ 事前完了状況サマリ（2026-04-26 調査結果）

**既に完了している部分は再実行不要。下表の「実行要否」が❌のセクションのみ実行する。**

調査コマンド: `gcloud iam service-accounts list` / `wrangler d1 list` / `wrangler secret list` / `gh secret list` / `gh variable list` / `op vault list` / `cat apps/api/wrangler.toml`

**1Password vault**: `Employee` / item: `ubm-hyogo-env` に以下が格納済み:
`GOOGLE_SERVICE_ACCOUNT_JSON` / `GOOGLE_SHEET_ID` / `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

| § | セクション | 状態 | 実行要否 | 備考 |
| --- | --- | --- | --- | --- |
| 2.2 | Sheets API / Drive API 有効化 | ❓ 要画面確認 | 画面確認のみ | リンクを開いて緑バッジ確認のみ（1 分） |
| 2.4 | JSON key 発行 | ✅ 完了 | スキップ | `GOOGLE_SERVICE_ACCOUNT_JSON` が 1Password に存在 |
| 2.5 | 1Password 投入 | ✅ 完了 | スキップ | `op://Employee/ubm-hyogo-env/` に全フィールド格納済み |
| 3 | Sheets 共有設定 | ❓ 要画面確認 | 画面確認後判定 | SA email が Sheet に Viewer 共有済みか確認 |
| 4.3 | wrangler.toml 追記 | ⚠️ 部分完了 | 差分のみ | `[triggers] crons` と `[vars]` SHEET_ID/FORM_ID 追記のみ |
| 4.4 | D1 migrations 適用 | ❌ 未完了 | **要実行** | 両 DB とも `num_tables=0` |
| 5 | Cloudflare Secrets 投入 | ❌ 未完了 | **要実行** | `wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON`（staging/prod 両 env） |
| 6 | GitHub Secrets / Variables | ❌ 未完了 | **要実行** | `gh secret list` / `gh variable list` 共に空 |
| 7 | sync worker 実装・デプロイ | ❌ 未完了 | **要実行** | `apps/api/src/index.ts` のみ、sync ロジック未実装 |
| 8〜11 | 検証 / backfill / 異常系 / smoke | ❌ 未完了 | **要実行** | §7 完了後 |

### 実行すべきセクション（最短ルート）

1. **§2.2 / §3 を画面で確認**（2〜5 分）
2. **§4.3 差分追記**（[triggers] と [vars] のみ）
3. **§4.4 → §5 → §6 → §7 → §8 → §9 → §10 → §11** を順に実行

---

## 0. このドキュメントの使い方

### 想定読者
- 既に完了済みの初期セットアップ（CLI / GCP プロジェクト / Service Account / D1 DB 作成）を引き継ぎ、未完了部分のみを実行する担当者。

### 所要時間（目安）
- 未完了部分のみで 30〜45 分。

### 進捗管理
各セクション末尾に `- [ ]` チェックリストを置く。手元コピーで埋めて完了確認する。

### 不変条件リマインド（CLAUDE.md より、本書に必要なもの全 7 項目を再掲）

1. **実フォーム schema をコードに固定しすぎない** — 未知の Form 質問は `extra_fields_json` に格納、`unmapped_question_ids_json` に questionId を残す。
2. **consent キーは `publicConsent` / `rulesConsent` の 2 つに統一** — Sheets layer は camelCase、D1 layer は `public_consent` / `rules_consent`。これ以外の表記は受理せず mapping 段で正規化。
3. **`responseEmail` は Form 項目ではなく system field として扱う** — Form 自動収集メールアドレス。`member_responses.response_email` 列に保存。
4. **Google Form schema 外のデータは admin-managed data として分離** — `member_status.publish_state` / `is_deleted` / `hidden_reason`、`meeting_sessions`、`member_attendance`、`member_tags`、`magic_tokens` 等は sync 対象外。
5. **D1 への直接アクセスは `apps/api` に閉じる**（`apps/web` から直接アクセス禁止） — Worker binding `DB` 経由のみ。
6. **GAS prototype は本番バックエンド仕様に昇格させない** — 参考扱いに留める。
7. **MVP では Google Form 再回答を本人更新の正式な経路とする** — 復旧時は Sheets を真として D1 を再 backfill（AC-4）。

### 固定値（CLAUDE.md より、本書で使用するもの）

| 項目 | 値 |
| --- | --- |
| formId | `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` |
| responderUrl | `https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform` |
| sectionCount | `6` |
| questionCount | `31` |
| consent キー | `publicConsent`, `rulesConsent` |

---

## 2. Google Cloud: Service Account 作成

### 2.2 Sheets API / Drive API を有効化

`ubm-hyogo` プロジェクトを選択した状態で、以下を順に開く:
- Sheets API: https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=ubm-hyogo
- Drive API: https://console.cloud.google.com/apis/library/drive.googleapis.com?project=ubm-hyogo

各画面で「有効にする」を押す。

期待される表示: 「API は有効です」バッジが緑表示。

### 2.4 JSON key 発行

サービスアカウント詳細画面の「キー」タブ → 「鍵を追加」 → 「新しい鍵を作成」 → JSON 形式 → 「作成」。

ダウンロードされた `<project-id>-<hash>.json` をローカルの一時パス（例 `~/Downloads/ubm-sa.json`）に置く。

> **重要**: ダウンロード後、このファイルは再ダウンロード不可。直後に 1Password に投入する（次節）。リポジトリには絶対にコミットしない。

#### Service Account JSON の構造（プレースホルダー）

GCP がダウンロードさせる JSON は以下のキー構造を持つ。実値の代わりにプレースホルダーで示す:

```json
{
  "type": "service_account",
  "project_id": "<YOUR_GCP_PROJECT_ID>",
  "private_key_id": "<YOUR_PRIVATE_KEY_ID>",
  "private_key": "-----BEGIN PRIVATE KEY-----\n<YOUR_PRIVATE_KEY>\n-----END PRIVATE KEY-----\n",
  "client_email": "ubm-hyogo-sheets-reader@ubm-hyogo.iam.gserviceaccount.com",
  "client_id": "<YOUR_CLIENT_ID>",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/ubm-hyogo-sheets-reader%40ubm-hyogo.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

### 2.5 1Password Shared への JSON 投入

```bash
# Vault 確認（Shared Vault を使う）
op vault list

# JSON ファイル全文を 1Password にアップロード
op item create \
  --category="API Credential" \
  --title="UBM Hyogo Google Service Account" \
  --vault="Shared" \
  --tags=ubm-hyogo,sync,gcp \
  "GOOGLE_SERVICE_ACCOUNT_JSON[password]=$(cat ~/Downloads/ubm-sa.json)"
```

ローカル JSON を削除:
```bash
rm ~/Downloads/ubm-sa.json
```

参照テスト:
```bash
op read "op://Employee/ubm-hyogo-env/GOOGLE_SERVICE_ACCOUNT_JSON" | jq -r '.client_email'
# 期待: ubm-hyogo-sheets-reader@ubm-hyogo.iam.gserviceaccount.com
```

失敗時:
- `op: not signed in` → `eval $(op signin)`
- secret reference に `@` や `(` が含まれてエラー → item を ID 参照に切替（`op item get <ID> --format json`）

### 2.6 スコープと最小権限

- 利用スコープ: `https://www.googleapis.com/auth/spreadsheets.readonly`
- IAM 役割: 付与なし（Sheet 単位の Viewer 共有で十分）
- Drive API: メタデータ参照のため有効化のみ（読取権限はシート共有で制限）

#### チェックリスト
- [ ] Sheets API / Drive API 有効化（画面確認）
- [ ] JSON key 発行 → 1Password 投入
- [ ] ローカル JSON 削除済み
- [ ] `op read` で `client_email` 取得確認

---

## 3. Google Sheets: Form 連携と共有設定

### 3.1 Form 連携 Sheet を確認

- Form responder URL（CLAUDE.md 固定値）: https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform
- Form 編集画面（formId=`119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg`）: https://docs.google.com/forms/d/119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg/edit

「回答」タブ → 緑のスプレッドシートアイコンで連携 Sheet を作成 / 開く。

#### 連携 Sheet の列構造（合計 33 列 = system 2 + Form 31）

| カテゴリ | 列名 | 備考 |
| --- | --- | --- |
| Form auto | タイムスタンプ | submittedAt 相当 |
| Form auto | メールアドレス | responseEmail（system field、不変条件 3） |
| section1 basic_profile (6) | fullName / nickname / location / birthDate / occupation / hometown | |
| section2 ubm_profile (7) | ubmZone / ubmMembershipType / ubmJoinDate / businessOverview / skills / challenges / canProvide | |
| section3 personal_profile (4) | hobbies / recentInterest / motto / otherActivities | |
| section4 social_links (11) | urlWebsite / Facebook / Instagram / Threads / Youtube / Tiktok / X / Blog / Note / Linkedin / Others | |
| section5 message (1) | selfIntroduction | |
| section6 consent (2) | publicConsent / rulesConsent | 不変条件 2 |

### 3.2 SHEET_ID の取得

`GOOGLE_SHEET_ID` は 1Password `ubm-hyogo-env` に格納済み。以下で直接取得できる:

```bash
export SHEET_ID="$(op read "op://Employee/ubm-hyogo-env/GOOGLE_SHEET_ID")"
echo "$SHEET_ID"   # 期待: 1xxxxx... 形式の文字列
```

URL から手動確認したい場合:
```
https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit#gid=0
```

### 3.3 Service Account への共有

SA email を確認:
```bash
op read "op://Employee/ubm-hyogo-env/GOOGLE_SERVICE_ACCOUNT_JSON" | jq -r '.client_email'
# 期待: ubm-hyogo-sheets-reader@ubm-hyogo.iam.gserviceaccount.com
```

共有手順:
1. Sheet 右上「共有」ボタン
2. 上記 `client_email` を貼付
3. 権限: **閲覧者**（Viewer）
4. 「通知を送信しない」にチェック → 共有

### 3.4 疎通確認（curl）

```bash
# 1Password から直接読み込み
export SHEET_ID="$(op read "op://Employee/ubm-hyogo-env/GOOGLE_SHEET_ID")"
gcloud auth activate-service-account --key-file=<(op read "op://Employee/ubm-hyogo-env/GOOGLE_SERVICE_ACCOUNT_JSON")
export TOKEN="$(gcloud auth print-access-token --scopes=https://www.googleapis.com/auth/spreadsheets.readonly)"

curl -sS -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" \
  "https://sheets.googleapis.com/v4/spreadsheets/$SHEET_ID?fields=spreadsheetId"
# 期待: 200
```

| 応答 | 原因 | 対応 |
| --- | --- | --- |
| 200 | 正常 | 続行 |
| 401 | service account token 失効 | `gcloud auth print-access-token` 再取得 |
| 403 | Sheet 未共有 | §3.3 を再実行（Viewer 権限） |
| 404 | SHEET_ID 誤り | URL から再取得 |
| 429 | rate limit | exponential backoff 後再試行 |

#### チェックリスト
- [ ] Form 連携 Sheet 作成
- [ ] SHEET_ID 取得（環境変数化）
- [ ] Service Account を Viewer で共有
- [ ] curl で 200 応答確認

---

## 4. Cloudflare: D1 設定追記と migration 適用

### 4.3 wrangler.toml への追記差分

現状 `apps/api/wrangler.toml` には `name` / `main` / `compatibility_date` / `[vars] ENVIRONMENT` / `[[d1_databases]]`（prod / staging の database_id 含む）が既に書かれている。**ここでは追記分だけを示す**。

#### 4.3.1 default（staging 兼用）への追記

既存の `[vars]` ブロックに以下のキーを追記:

```toml
[vars]
# 既存: ENVIRONMENT = "..."
SHEET_ID = "<§3.2 の SHEET_ID>"
FORM_ID = "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg"
SYNC_BATCH_SIZE = "100"
SYNC_RETRY_MAX = "3"
SYNC_RETRY_BASE_MS = "1000"
SYNC_TIMEOUT_MS = "30000"
SYNC_SCHEDULE_CRON = "0 * * * *"
```

ファイル末尾に `[triggers]` を新規追加:

```toml
[triggers]
crons = ["0 * * * *"]   # 毎時 0 分（UTC）
```

#### 4.3.2 staging env への追記（既存 [env.staging] 配下に追加）

```toml
[env.staging.vars]
SHEET_ID = "<§3.2 の SHEET_ID>"
FORM_ID = "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg"

[env.staging.triggers]
crons = ["0 * * * *"]
```

#### 4.3.3 production env への追記（既存 [env.production] 配下に追加）

```toml
[env.production.vars]
SHEET_ID = "<§3.2 の SHEET_ID>"
FORM_ID = "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg"

[env.production.triggers]
crons = ["0 * * * *"]
```

> 注: Cloudflare Workers Cron Triggers は Wrangler 管理時、`crons = []` で完全削除される（`undefined` の場合は既存トリガーが残る）。本番はそれぞれの env 配下に明示する。
> 既存 DB binding（`database_id` prod=24963f0a-7fbb-4508-a93a-f8e502aa4585 / staging=990e5d6c-51eb-4826-9c13-c0ae007d5f46）は変更不要。完成形全文は Appendix E を参照。

### 4.4 migration ファイル作成

```bash
mkdir -p apps/api/migrations
cat <<'EOF' > apps/api/migrations/0001_init.sql
-- member_responses（Sheets/Form 生回答の正規化保存）
CREATE TABLE IF NOT EXISTS member_responses (
  response_id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  revision_id TEXT NOT NULL,
  schema_hash TEXT NOT NULL,
  response_email TEXT,
  submitted_at TEXT NOT NULL,
  edit_response_url TEXT,
  answers_json TEXT NOT NULL,
  raw_answers_json TEXT NOT NULL DEFAULT '{}',
  extra_fields_json TEXT NOT NULL DEFAULT '{}',
  unmapped_question_ids_json TEXT NOT NULL DEFAULT '[]',
  search_text TEXT NOT NULL DEFAULT ''
);

-- member_identities（stable member entity）
CREATE TABLE IF NOT EXISTS member_identities (
  member_id TEXT PRIMARY KEY,
  response_email TEXT NOT NULL UNIQUE,
  current_response_id TEXT NOT NULL,
  first_response_id TEXT NOT NULL,
  last_submitted_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- member_status（consent snapshot + admin-managed 公開/削除状態）
CREATE TABLE IF NOT EXISTS member_status (
  member_id TEXT PRIMARY KEY,
  public_consent TEXT NOT NULL DEFAULT 'unknown',
  rules_consent TEXT NOT NULL DEFAULT 'unknown',
  publish_state TEXT NOT NULL DEFAULT 'hidden',
  is_deleted INTEGER NOT NULL DEFAULT 0,
  hidden_reason TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- sync_audit（manual / scheduled / backfill 一覧）
CREATE TABLE IF NOT EXISTS sync_audit (
  audit_id TEXT PRIMARY KEY,
  trigger TEXT NOT NULL,                  -- 'manual' | 'scheduled' | 'backfill'
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL,                   -- 'running' | 'success' | 'failed' | 'partial'
  inserted_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  failed_reason TEXT,                     -- audit reason enum 参照（§10）
  diff_summary_json TEXT NOT NULL DEFAULT '{}'
);

-- admin_overrides（admin-managed data の汎用上書き、不変条件 4）
CREATE TABLE IF NOT EXISTS admin_overrides (
  override_id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  field TEXT NOT NULL,
  value TEXT,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_member_responses_email ON member_responses(response_email);
CREATE INDEX IF NOT EXISTS idx_member_responses_submitted ON member_responses(submitted_at);
CREATE INDEX IF NOT EXISTS idx_sync_audit_started ON sync_audit(started_at);
EOF
```

### 4.5 migration 適用（staging）

```bash
cd apps/api

wrangler d1 migrations apply ubm-hyogo-db-staging --env staging --remote

wrangler d1 execute ubm-hyogo-db-staging --env staging --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

期待される出力:
```
┌────────────────────┐
│ name               │
├────────────────────┤
│ admin_overrides    │
│ d1_migrations      │
│ member_identities  │
│ member_responses   │
│ member_status      │
│ sync_audit         │
└────────────────────┘
```

### 4.6 production への適用（§11 smoke 後）

```bash
wrangler d1 migrations apply ubm-hyogo-db-prod --env production --remote
```

> **重要**: prod 適用は §11 の smoke が PASS してから。

失敗時のリカバリ:
- migration エラー → 該当 migration が rollback され直前の状態に戻る（D1 仕様）。SQL を修正し新 migration として `wrangler d1 migrations create` で追加。
- `Database not found` → `wrangler d1 list` で名前を再確認。

#### チェックリスト
- [ ] `wrangler.toml` に [triggers] crons / [vars] SHEET_ID/FORM_ID 等を追記（default / staging / production）
- [ ] `migrations/0001_init.sql` 配置
- [ ] staging に migration 適用、6 テーブル確認
- [ ] prod 適用は §11 smoke 後に保留

---

## 5. Cloudflare: Secrets 投入

### 5.1 GOOGLE_SERVICE_ACCOUNT_JSON を 1Password から流し込む

```bash
# staging
op read "op://Employee/ubm-hyogo-env/GOOGLE_SERVICE_ACCOUNT_JSON" \
  | wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --env staging

# production
op read "op://Employee/ubm-hyogo-env/GOOGLE_SERVICE_ACCOUNT_JSON" \
  | wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --env production
```

期待される出力:
```
🌀 Creating the secret for the Worker "ubm-hyogo-api-staging"
✨ Success! Uploaded secret GOOGLE_SERVICE_ACCOUNT_JSON
```

確認:
```bash
wrangler secret list --env staging
wrangler secret list --env production
```

期待: `GOOGLE_SERVICE_ACCOUNT_JSON` が両環境で表示。

失敗時:
- `Worker not found` → 一度 `wrangler deploy --env staging --dry-run` するか、§7 の deploy を先に実行。
- `Invalid JSON` → `op read` の secret reference を ID 参照に切替。

#### チェックリスト
- [ ] staging に secret 投入
- [ ] production に secret 投入
- [ ] `wrangler secret list` で両方確認

---

## 6. GitHub: Secrets / Variables 投入

### 6.1 Cloudflare API Token 確認

`CLOUDFLARE_API_TOKEN` は 1Password `ubm-hyogo-env` に格納済み。新規発行不要。

```bash
# 格納済み確認
op read "op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN" | head -c 10
# 先頭 10 文字が表示されれば OK
```

発行が必要な場合（トークンが存在しない場合のみ）:
URL: https://dash.cloudflare.com/profile/api-tokens → 「Edit Cloudflare Workers」テンプレート → Create → 発行後に 1Password `ubm-hyogo-env` の `CLOUDFLARE_API_TOKEN` フィールドを更新。

### 6.2 GitHub Secrets 投入

```bash
# Cloudflare API Token（1Password から直接流し込み）
op read "op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN" \
  | gh secret set CLOUDFLARE_API_TOKEN --repo daishiman/UBM-Hyogo

# Google Service Account JSON（1Password から直接流し込み）
op read "op://Employee/ubm-hyogo-env/GOOGLE_SERVICE_ACCOUNT_JSON" \
  | gh secret set GOOGLE_SERVICE_ACCOUNT_JSON --repo daishiman/UBM-Hyogo
```

### 6.3 GitHub Variables 投入

```bash
# SHEET_ID も 1Password から取得
gh variable set SHEET_ID \
  --body "$(op read "op://Employee/ubm-hyogo-env/GOOGLE_SHEET_ID")" \
  --repo daishiman/UBM-Hyogo

gh variable set FORM_ID \
  --body "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg" \
  --repo daishiman/UBM-Hyogo
```

確認:
```bash
gh secret list --repo daishiman/UBM-Hyogo
gh variable list --repo daishiman/UBM-Hyogo
```

期待される出力:
```
NAME                            UPDATED
CLOUDFLARE_API_TOKEN            less than a minute ago
GOOGLE_SERVICE_ACCOUNT_JSON     less than a minute ago

NAME       VALUE                                         UPDATED
FORM_ID    119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg  less than a minute ago
SHEET_ID   <SHEET_ID>                                    less than a minute ago
```

失敗時:
- `HTTP 403: Resource not accessible by integration` → `gh auth refresh -s admin:org,repo`

#### チェックリスト
- [ ] Cloudflare API Token 発行 → 1Password 保存
- [ ] GitHub Secrets 2 件登録
- [ ] GitHub Variables 2 件登録
- [ ] `gh secret list` / `gh variable list` で確認

---

## 7. apps/api: sync worker デプロイ

### 7.1 sync worker のファイル配置（不変条件 5）

`apps/api/src/sync/` 配下に以下を配置する想定（後続実装タスクで作成）:

| ファイル | 役割 |
| --- | --- |
| `client.ts` | Sheets API fetch クライアント。401/403/429/5xx 切り分け |
| `mapping.ts` | Sheets row → D1 row 変換、consent 正規化（不変条件 2/3） |
| `runner.ts` | manual / scheduled / backfill エントリ |
| `audit.ts` | sync_audit へ run 追記 |

`apps/api/src/index.ts` の方針:
```ts
app.post('/admin/sync/manual', adminAuth, manualSync);
app.post('/admin/sync/backfill', adminAuth, backfill);

export default {
  fetch: app.fetch,
  scheduled: scheduledSync,  // wrangler triggers.crons
};
```

### 7.2 ローカル動作確認

```bash
cd ~/dev/UBM-Hyogo
pnpm typecheck
pnpm --filter api dev
```

別ターミナル:
```bash
curl -sS http://localhost:8787/health
# 期待: {"ok":true}
```

`Ctrl+C` で停止。

### 7.3 staging デプロイ

```bash
cd ~/dev/UBM-Hyogo
wrangler deploy --env staging
```

期待される出力:
```
Total Upload: ...
Uploaded ubm-hyogo-api-staging (...sec)
Published ubm-hyogo-api-staging (...sec)
  https://ubm-hyogo-api-staging.<account>.workers.dev
Current Deployment ID: ...
```

### 7.4 production デプロイ（§11 smoke 後）

```bash
wrangler deploy --env production
```

### 7.5 Cron Trigger 確認

```bash
wrangler triggers list --env staging
wrangler triggers list --env production
```

期待: `cron: 0 * * * *` が表示。

### 7.6 ログ tail

```bash
wrangler tail --env staging
```

失敗時:
- `Cron triggers not found` → `wrangler.toml` の `[env.<name>.triggers]` を確認し再 deploy
- 環境変数未注入 → §6 の Variables/Secrets を再確認

#### チェックリスト
- [ ] `pnpm typecheck` PASS
- [ ] staging deploy 完了 / URL 表示
- [ ] `wrangler triggers list` で cron 表示
- [ ] `wrangler tail` でログ流れることを確認

---

## 8. 事前検証コマンド実行

### 8.1 環境変数

```bash
export SHEET_ID="<§3.2 の SHEET_ID>"
export DB_NAME="ubm-hyogo-db-staging"
export TOKEN="$(gcloud auth print-access-token --scopes=https://www.googleapis.com/auth/spreadsheets.readonly)"
```

### 8.2 V1: D1 一覧

```bash
wrangler d1 list
# 期待: ubm-hyogo-db-staging / ubm-hyogo-db-prod が表示
```

### 8.3 V2: D1 binding 疎通

```bash
wrangler d1 execute "$DB_NAME" --env staging --remote --command "select 1 as ok"
# 期待: [{"ok":1}]
```

### 8.4 V3 / V4: Sheets API

```bash
# V3: メタ取得
curl -sS -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" \
  "https://sheets.googleapis.com/v4/spreadsheets/$SHEET_ID?fields=spreadsheetId"
# 期待: 200

# V4: 1 row 読取
curl -sS -H "Authorization: Bearer $TOKEN" \
  "https://sheets.googleapis.com/v4/spreadsheets/$SHEET_ID/values/A1:AE2" | jq '.values | length'
# 期待: >=1
```

### 8.5 V5: mapping 単体（fixture insert）

```bash
wrangler d1 execute "$DB_NAME" --env staging --remote --command "
INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, answers_json)
VALUES ('RID-FIXTURE', 'FORM-FIXTURE', 'REV-FIXTURE', 'HASH-FIXTURE', 'system@example.org', datetime('now'), '{\"publicConsent\":\"consented\",\"rulesConsent\":\"consented\"}');
"

wrangler d1 execute "$DB_NAME" --env staging --remote --command \
  "select response_id, response_email from member_responses where response_id='RID-FIXTURE'"
# 期待: 1 行返却
```

### 8.6 V6: 冪等性確認

```bash
wrangler d1 execute "$DB_NAME" --env staging --remote --command \
  "select count(*) as n from member_responses where response_id='RID-FIXTURE'"
# 期待: n=1
```

### 8.7 件数ベースライン

```bash
wrangler d1 execute "$DB_NAME" --env staging --remote --command "select count(*) as n from member_responses"
wrangler d1 execute "$DB_NAME" --env staging --remote --command "select count(*) as n from sync_audit"
```

### 8.8 PASS 表

| ID | コマンド | PASS 条件 |
| --- | --- | --- |
| V1 | `wrangler d1 list` | 対象 DB 表示 |
| V2 | `wrangler d1 execute ... select 1` | `1` 返却 |
| V3 | curl Sheets meta | 200 |
| V4 | curl Sheets values A1:AE2 | values length >=1 |
| V5 | mapping fixture insert | 1 row affected |
| V6 | 冪等 count | n=1 |

### 8.9 manual sync 起動（§7 deploy 後）

```bash
ADMIN_TOKEN="$(op read 'op://Shared/UBM Hyogo Admin Token/value' 2>/dev/null || echo '<未発行>')"
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://ubm-hyogo-api-staging.<account>.workers.dev/admin/sync/manual"

wrangler d1 execute "$DB_NAME" --env staging --remote \
  --command "select audit_id, trigger, status, failed_reason, inserted_count from sync_audit order by started_at desc limit 5;"
```

#### チェックリスト
- [ ] V1〜V6 全 PASS
- [ ] sync_audit に run row 追加（manual sync 起動後）

---

## 9. backfill 実行

### 9.1 truncate-and-reload

```bash
# 1. staging の member_responses / member_identities を全削除
wrangler d1 execute "$DB_NAME" --env staging --remote --command "DELETE FROM member_responses;"
wrangler d1 execute "$DB_NAME" --env staging --remote --command "DELETE FROM member_identities;"

# 2. backfill エンドポイント発火
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://ubm-hyogo-api-staging.<account>.workers.dev/admin/sync/backfill"

# 3. 件数確認
wrangler d1 execute "$DB_NAME" --env staging --remote --command "SELECT COUNT(*) AS n FROM member_responses;"
```

> 不変条件 4 のため `member_status.publish_state` / `is_deleted` / `hidden_reason` 等の admin 列、および `meeting_sessions` / `member_attendance` / `member_tags` / `magic_tokens` 等の admin-managed テーブルは backfill では触らない。

### 9.2 responseId 冪等性確認（不変条件 7）

```bash
# 同じ backfill を 2 回連打しても件数が変わらないこと
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://ubm-hyogo-api-staging.<account>.workers.dev/admin/sync/backfill"

wrangler d1 execute "$DB_NAME" --env staging --remote --command \
  "SELECT response_id, COUNT(*) AS n FROM member_responses GROUP BY response_id HAVING n>1;"
# 期待: 0 行
```

#### チェックリスト
- [ ] staging backfill 件数 = Sheets 件数
- [ ] 重複 responseId なし

---

## 10. 異常系 smoke test

`audit reason enum`（不変）:
```
SHEETS_RATE_LIMIT
SHEETS_5XX
SHEETS_AUTH
D1_TX_FAIL
MAPPING_INVALID
PARTIAL_ABORT
SCHEMA_DRIFT_IGNORED
```

### A1. Sheets API 429（rate limit）

| 項目 | 内容 |
| --- | --- |
| 期待挙動 | exponential backoff 1s/2s/4s、最大 3 回。最終失敗時 `failed_reason='SHEETS_RATE_LIMIT'`, `status='failed'` |
| 復旧 | scheduled cron の次回実行で自動再試行（Sheets 真原則=AC-4） |

再現手順:
```bash
for i in 1 2 3 4 5; do
  curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" \
    "https://sheets.googleapis.com/v4/spreadsheets/INVALID/values/A1"
done
wrangler d1 execute "$DB_NAME" --env staging --remote --command \
  "select audit_id, failed_reason from sync_audit where failed_reason='SHEETS_RATE_LIMIT' order by started_at desc limit 1"
```

### A2. Sheets API 5xx

| 項目 | 内容 |
| --- | --- |
| 期待挙動 | A1 同様の retry。最終失敗で `failed_reason='SHEETS_5XX'` |
| 復旧 | 次回 cron / 観測 alert |

### A3. Service Account 401（認証失効）

| 項目 | 内容 |
| --- | --- |
| 期待挙動 | retry せず即停止、`failed_reason='SHEETS_AUTH'`, `status='failed'` |
| 復旧 | 1Password から SA 再取得 → `wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --env staging` で rotate。Sheets 共有確認後に再 sync |

### A4. D1 transaction 部分失敗

| 項目 | 内容 |
| --- | --- |
| 期待挙動 | transaction 全体 rollback。`failed_reason='D1_TX_FAIL'`, `status='failed'`, `inserted_count=0` |
| 復旧 | mapping/型修正後再実行で全件冪等反映。必要なら Sheets を真として truncate-and-reload |

再現手順:
```bash
wrangler d1 execute "$DB_NAME" --env staging --remote --command \
  "INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, submitted_at, answers_json) VALUES ('RID-BAD', 'FORM', 'REV', 'HASH', datetime('now'), NULL)"
# 期待: 失敗 / 全件 rollback
```

### A5. mapping 不整合（必須欠損 / 型違反）

| 項目 | 内容 |
| --- | --- |
| 期待挙動 | 当該 row のみ skip。他 row は反映。`failed_reason='MAPPING_INVALID'`, `status='partial'` |
| 復旧 | Sheets 側 row を修正 → 次回 sync で吸収（不変条件 7） |

### A6. backfill 中断 → 重複検知

| 項目 | 内容 |
| --- | --- |
| 期待挙動 | `responseId` を冪等キーとし、再開時に既存行は UPSERT で 1 件維持 |
| 検出 SQL | `select response_id, count(*) c from member_responses group by response_id having c>1` → 0 行であること |
| 復旧 | `diff_summary_json` で resume_from を判定し再 backfill。Sheets 件数と D1 件数の一致を確認 |

再現手順:
1. backfill 中に `wrangler tail --env staging` で実行確認
2. 任意のタイミングで `wrangler rollback --env staging --message "test"` でロールバック
3. 再度 backfill エンドポイントを叩く
4. `sync_audit` で `audit_id` の連結状態を確認

### A7. Schema drift（Sheets 列追加）

| 項目 | 内容 |
| --- | --- |
| 期待挙動 | 既知列のみ反映、未知列は `extra_fields_json` に保持。`failed_reason='SCHEMA_DRIFT_IGNORED'`, `status='success'`（不変条件 1） |
| 復旧 | 正本仕様（form schema レジストリ / data contract）を更新し、新 stableKey と questionId 対応を追記。`extra_fields_json` 内の questionId を `unmapped_question_ids_json` から正規 mapping へ昇格させる |

### クリーンアップ

```bash
wrangler d1 execute "$DB_NAME" --env staging --remote --command \
  "DELETE FROM member_responses WHERE response_id LIKE 'RID-%';"
```

#### チェックリスト
- [ ] A1〜A7 のうち再現可能なものは sync_audit に reason 記録
- [ ] D1 型違反 insert が rollback
- [ ] partial sync resume が冪等
- [ ] fixture row のクリーンアップ完了

---

## 11. 手動 smoke test 記録（テンプレ本文埋め込み）

実行者は以下のテンプレを `doc/03-serial-data-source-and-storage-contract/outputs/phase-11/manual-test-result.md` に上書きする想定でコピーして埋める。

```markdown
# Phase 11 / manual-test-result.md — 手動 smoke 結果サマリ

## NON_VISUAL 宣言
- 種別: infra / data-contract（CLI / SQL / sync log ベース）
- screenshots は不要（UI 変更なし）。代替証跡は `evidence-collection.md` に集約。

## 1. 自動 smoke

| 項目 | コマンド | 結果 | ログ |
| --- | --- | --- | --- |
| docs lint | `pnpm lint`（docs） | <PASS/FAIL> | `docs-validate.log` |
| link check | docs link checker | <PASS/FAIL> | `docs-validate.log` |
| artifacts.json validate | JSON parse | <PASS/FAIL> | `docs-validate.log` |

## 2. 手動 wrangler 検証

| 項目 | コマンド | 期待 | 結果 |
| --- | --- | --- | --- |
| D1 一覧 | `wrangler d1 list` | staging/production 表示 | <PASS/FAIL> |
| 疎通 | `wrangler d1 execute ubm-hyogo-db-staging --env staging --remote --command "select 1"` | `[{"1":1}]` | <PASS/FAIL> |
| 件数 | `wrangler d1 execute ... --command "select count(*) from member_responses"` | <数値> | <記入> |
| audit | `... --command "select count(*) from sync_audit"` | <数値> | <記入> |

## 3. Sheets→D1 サンプル sync ログ

| 項目 | 内容 | 結果 |
| --- | --- | --- |
| dry-run trigger | admin endpoint 経由 manual sync | <PASS/FAIL> |
| sync_audit 確認 | `select * from sync_audit order by started_at desc limit 1` | <記入> |

## 4. 4 条件再確認

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | <OK/NG> | source-of-truth 一意化を smoke 経路で確認 |
| 実現性 | <OK/NG> | staging で 1h cron / 100 row batch が無料枠内 |
| 整合性 | <OK/NG> | branch / env / runtime / data / secret 一致 |
| 運用性 | <OK/NG> | rollback / handoff / same-wave sync が runbook 化 |

## 5. blocker / open question

- blocker: <なし or 内容>
- open question: <なし or 内容>

## 6. 完了条件チェック

- [ ] 自動 smoke 手順を実行
- [ ] wrangler 手動検証手順を実行
- [ ] 4 条件・blocker・open question を記録
```

#### チェックリスト
- [ ] manual-test-result.md に V1〜V6 PASS 記入
- [ ] evidence-collection.md にスクリーンショット / 出力 hash 追記
- [ ] すべて PASS の場合のみ §4.6 / §7.4 の prod 適用へ進む

---

## 12. 完了チェックリスト

| # | 項目 | 状態 |
| --- | --- | --- |
| 1 | JSON key 発行 + 1Password (Shared) 投入 | [ ] |
| 2 | Sheets 共有 + SHEET_ID 取得 | [ ] |
| 3 | wrangler.toml 追記 + D1 migration 適用 | [ ] |
| 4 | Cloudflare Secrets 投入 | [ ] |
| 5 | GitHub Secrets/Variables 投入 | [ ] |
| 6 | sync worker staging deploy | [ ] |
| 7 | 事前検証 V1〜V6 PASS | [ ] |
| 8 | backfill 完了 + 冪等確認 | [ ] |
| 9 | 異常系 smoke 完了 | [ ] |
| 10 | manual-test-result.md 記入完了 | [ ] |
| 11 | prod deploy + cron 起動確認 | [ ] |

### 次タスクへの引き継ぎ

- `04-serial-cicd-secrets-and-environment-sync`: 本 runbook で投入した Secrets/Variables の CI 自動化
- `05a-parallel-observability-and-cost-guardrails`: D1 free tier 超過監視と sync_audit ベースの SLI 化
- `05b-parallel-smoke-readiness-and-handoff`: 本 runbook の手動手順を staging → production CI に転写

---

## Appendix A: トラブルシューティング

| 症状 | 想定原因 | 対応 |
| --- | --- | --- |
| Sheets API 401 | service account token 失効 | `gcloud auth print-access-token` 再取得。1Password 内 JSON の `private_key_id` を確認、ローテートが必要なら GCP コンソールで新 key 発行 → 1Password 上書き → `wrangler secret put` で再投入 |
| Sheets API 403 | Sheet 未共有 / 共有解除 | §3.3 を再実行（`client_email` を Viewer で再共有）。`failed_reason='SHEETS_AUTH'` が記録される |
| Sheets API 429 | rate limit | sync worker の exponential backoff（`SYNC_RETRY_*`、最大 3 回 = 1s/2s/4s）を待つ。最終失敗時 `failed_reason='SHEETS_RATE_LIMIT'` |
| Sheets API 5xx | Google 側障害 | 自動 retry。最終失敗で `failed_reason='SHEETS_5XX'`。次回 cron で回収 |
| D1 quota 超過（reads） | 月 150M reads = 約 5M reads/day 接近 | `wrangler d1 info <name>` で確認。`/admin/sync/*` の頻度を見直し、scheduled を 2h/3h に後退 |
| D1 quota 超過（writes） | 月 3M writes = 約 100K writes/day 接近 | 差分判定強化、scheduled 周期延長、または Workers Paid 検討 |
| D1 storage 超過 | 5 GB / アカウント（1 DB 当たり最大 10 GB）接近 | 不要 row を `DELETE`、`wrangler d1 export` でアーカイブ後 truncate |
| `wrangler secret put` 失敗 | Worker 未デプロイ | `wrangler deploy --env staging --dry-run` 後に再投入、または §7.3 deploy 先行 |
| cron が走らない | `crons` が未反映 | `[env.<name>.triggers] crons` を明示し再 deploy。`crons = []` は完全削除を意味するので注意 |
| GitHub Secret 未反映 | scope 不足 | `gh auth refresh -s admin:org,repo` |
| 1Password CLI `@` エラー | item title 特殊文字 | item を ID 参照（`op item get <ID>`）に切替 |
| D1 transaction 失敗 | 型違反・制約違反 | `failed_reason='D1_TX_FAIL'` で全件 rollback。SQL 修正後再実行で冪等反映 |
| Schema drift | Sheets 列追加 | `extra_fields_json` に保持（不変条件 1）。`failed_reason='SCHEMA_DRIFT_IGNORED'` |

---

## Appendix B: 用語集

| 用語 | 説明 |
| --- | --- |
| source-of-truth（正本） | データの真実が存在する唯一の場所。本プロジェクトでは Sheets が正本。 |
| canonical | 正規化された形式。例: `responseEmail` は小文字正規化、consent 値は `consented` / `declined` / `unknown` の 3 値に正規化。 |
| backfill | Sheets を真として D1 を再構築する truncate-and-reload 処理。障害復旧時に実行（AC-4）。 |
| idempotent（冪等） | 同じ操作を何回実行しても結果が変わらない性質。本 sync は responseId を冪等キーとし、UPSERT により重複なく反映。 |
| responseId | Form/Sheets の各回答に振られる安定識別子。`member_responses.response_id` PK。冪等キー（不変条件 7）。 |
| stableKey | Form 質問の安定識別子。Sheets 列名変更や questionId 差替に強い（不変条件 1）。 |
| consent key 正規化 | `publicConsent` / `rulesConsent` の 2 種のみ受理。Sheets layer は camelCase、D1 layer は snake_case（`public_consent` / `rules_consent`）。値は `consented` / `declined` / `unknown` の 3 値。 |
| responseEmail | Form 自動収集メールアドレス。Form 質問ではなく system field（不変条件 3）。 |
| sync_audit | manual / scheduled / backfill の各 run lineage を保存するテーブル。reason enum と diff_summary_json を持つ。 |
| binding | `wrangler.toml` で D1 を Worker から参照する変数名（本プロジェクトは `DB`）。 |
| admin-managed data | Form 由来でなく管理者が編集するデータ。`member_status` の publish 系列、`meeting_sessions`、`member_tags` 等。sync 対象外（不変条件 4）。 |

---

## Appendix C: 環境変数・固定値リファレンス

### C.1 環境変数一覧表

| 変数 | 配置先 | 用途 | 値の例 / プレースホルダー |
| --- | --- | --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Cloudflare Secrets（`wrangler secret put` で staging/production 各々）<br>＋ GitHub Secrets（CI 用）<br>＋ 1Password Shared（正本） | Sheets API 認証 | JSON 全文（§2.4 の構造） |
| `CLOUDFLARE_API_TOKEN` | GitHub Secrets ＋ 1Password Shared | CI から `wrangler deploy` 用 | `<70 文字程度のトークン>` |
| `SHEET_ID` | `wrangler.toml [vars]` ＋ GitHub Variables | 連携 Sheet 識別 | `<Sheet URL から抽出>` |
| `FORM_ID` | `wrangler.toml [vars]` ＋ GitHub Variables | Form 識別（CLAUDE.md 固定値） | `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` |
| `SYNC_BATCH_SIZE` | `wrangler.toml [vars]` | Sheets 取得 / D1 batch 件数 | `100` |
| `SYNC_RETRY_MAX` | `wrangler.toml [vars]` | retry 上限 | `3` |
| `SYNC_RETRY_BASE_MS` | `wrangler.toml [vars]` | exp backoff 基準 | `1000` |
| `SYNC_TIMEOUT_MS` | `wrangler.toml [vars]` | sync 全体タイムアウト | `30000` |
| `SYNC_SCHEDULE_CRON` | `wrangler.toml [vars]` ＋ `[triggers] crons` | scheduled 周期 | `0 * * * *`（毎時 0 分 UTC） |

### C.2 D1 無料枠と妥当性計算

Cloudflare D1 無料枠（2026-04 時点）:

| 項目 | 上限 |
| --- | --- |
| ストレージ | 5 GB / アカウント（1 DB 当たり最大 10 GB） |
| 行読取 | 月 150M reads（= 約 5M reads/day） |
| 行書込 | 月 3M writes（= 約 100K writes/day） |

scheduled 1h cron の妥当性:
- 1h 周期 = 24 回 / day
- 50 名 MVP では 1 回当たり差分 writes は数件〜数十件
- 24 × 数十 ≒ 数百〜数千 writes/day → 上限 100K の **1〜3% 程度**（十分余裕あり）
- reads も差分検出 + 1 回当たり < 1K reads → 上限の 1% 未満

### C.3 固定値（CLAUDE.md より）

```
formId         = 119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg
responderUrl   = https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform
sectionCount   = 6
questionCount  = 31
consent keys   = publicConsent, rulesConsent
```

---

## Appendix D: D1 schema DDL 全文

§4.4 と同一内容を再掲（migration 適用後の参照用）。

```sql
-- member_responses（Sheets/Form 生回答の正規化保存）
CREATE TABLE IF NOT EXISTS member_responses (
  response_id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  revision_id TEXT NOT NULL,
  schema_hash TEXT NOT NULL,
  response_email TEXT,
  submitted_at TEXT NOT NULL,
  edit_response_url TEXT,
  answers_json TEXT NOT NULL,
  raw_answers_json TEXT NOT NULL DEFAULT '{}',
  extra_fields_json TEXT NOT NULL DEFAULT '{}',
  unmapped_question_ids_json TEXT NOT NULL DEFAULT '[]',
  search_text TEXT NOT NULL DEFAULT ''
);

-- member_identities（stable member entity）
CREATE TABLE IF NOT EXISTS member_identities (
  member_id TEXT PRIMARY KEY,
  response_email TEXT NOT NULL UNIQUE,
  current_response_id TEXT NOT NULL,
  first_response_id TEXT NOT NULL,
  last_submitted_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- member_status（consent snapshot + admin-managed 公開/削除状態）
CREATE TABLE IF NOT EXISTS member_status (
  member_id TEXT PRIMARY KEY,
  public_consent TEXT NOT NULL DEFAULT 'unknown',
  rules_consent TEXT NOT NULL DEFAULT 'unknown',
  publish_state TEXT NOT NULL DEFAULT 'hidden',
  is_deleted INTEGER NOT NULL DEFAULT 0,
  hidden_reason TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- sync_audit（manual / scheduled / backfill 一覧）
CREATE TABLE IF NOT EXISTS sync_audit (
  audit_id TEXT PRIMARY KEY,
  trigger TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL,
  inserted_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  failed_reason TEXT,
  diff_summary_json TEXT NOT NULL DEFAULT '{}'
);

-- admin_overrides（admin-managed data の汎用上書き、不変条件 4）
CREATE TABLE IF NOT EXISTS admin_overrides (
  override_id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  field TEXT NOT NULL,
  value TEXT,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_member_responses_email ON member_responses(response_email);
CREATE INDEX IF NOT EXISTS idx_member_responses_submitted ON member_responses(submitted_at);
CREATE INDEX IF NOT EXISTS idx_sync_audit_started ON sync_audit(started_at);
```

---

## Appendix E: wrangler.toml 完成形

§4.3 と同一内容を再掲（コピペ用）。

```toml
name = "ubm-hyogo-api"
main = "src/index.ts"
compatibility_date = "2026-04-23"

[[d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db-staging"
database_id = "<§4.2 で取得した staging の database_id>"

[vars]
SHEET_ID = "<§3.2 の SHEET_ID>"
FORM_ID = "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg"
SYNC_BATCH_SIZE = "100"
SYNC_RETRY_MAX = "3"
SYNC_RETRY_BASE_MS = "1000"
SYNC_TIMEOUT_MS = "30000"
SYNC_SCHEDULE_CRON = "0 * * * *"

[triggers]
crons = ["0 * * * *"]

[env.staging]
name = "ubm-hyogo-api-staging"

[[env.staging.d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db-staging"
database_id = "<§4.2 で取得した staging の database_id>"

[env.staging.vars]
SHEET_ID = "<§3.2 の SHEET_ID>"
FORM_ID = "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg"

[env.staging.triggers]
crons = ["0 * * * *"]

[env.production]
name = "ubm-hyogo-api"

[[env.production.d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db-prod"
database_id = "<§4.2 で取得した prod の database_id>"

[env.production.vars]
SHEET_ID = "<§3.2 の SHEET_ID>"
FORM_ID = "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg"

[env.production.triggers]
crons = ["0 * * * *"]
```

---

## Appendix F: 参考リンク（補足。リンク先を見ずとも本書で完結する）

- Cloudflare D1 Wrangler commands: https://developers.cloudflare.com/d1/wrangler-commands/
- Cloudflare D1 Migrations reference: https://developers.cloudflare.com/d1/reference/migrations/
- Cloudflare D1 Limits: https://developers.cloudflare.com/d1/platform/limits/
- Cloudflare D1 Pricing: https://developers.cloudflare.com/d1/platform/pricing/
- Cloudflare Workers Cron Triggers: https://developers.cloudflare.com/workers/configuration/cron-triggers/
- Wrangler Configuration: https://developers.cloudflare.com/workers/wrangler/configuration/
- Google OAuth 2.0 Scopes for Sheets API: https://developers.google.com/identity/protocols/oauth2/scopes
- Google Workspace: Create access credentials: https://developers.google.com/workspace/guides/create-credentials
- 1Password CLI: op read: https://developer.1password.com/docs/cli/reference/commands/read/
- 1Password CLI: Secret reference syntax: https://developer.1password.com/docs/cli/secret-reference-syntax/
- GitHub CLI: gh secret set: https://cli.github.com/manual/gh_secret_set
- GitHub CLI: gh variable set: https://cli.github.com/manual/gh_variable_set
