# system-spec-update-summary — aiworkflow-requirements 正本反映結果

> **更新**: Phase 12 review で「差分案のみ」は正本同期漏れと判定したため、本ワークフロー内で最小反映を実施した。
> 反映先正本: `.claude/skills/aiworkflow-requirements/references/`
> 反映時のレビュー観点: 「secret 値の転記が無いこと」「op:// テンプレ表記であること」「scripts/cf.sh ラッパー経由経路が明記されていること」

---

## 反映先 1: `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

### 反映観点

`GOOGLE_SERVICE_ACCOUNT_JSON` の所在（Cloudflare Workers Secret / staging+production 両環境）と参照経路（`apps/api/src/jobs/sheets-fetcher.ts` / `sync-sheets-to-d1.ts` から `env.GOOGLE_SERVICE_ACCOUNT_JSON`）を追記した。投入経路が `bash scripts/cf.sh` 経由のみであることを明記した。

### 既存正本との関係

現行正本は `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `DATABASE_URL` / `SLACK_BOT_TOKEN` / `DISCORD_WEBHOOK_URL` を Cloudflare Workers Secret として列挙していた。`GOOGLE_SERVICE_ACCOUNT_JSON` は Sheets API v4 同期の JSON 一括方式の正本名として追加した。`GOOGLE_SHEETS_SA_JSON` は移行期間の legacy alias として実装側だけ許容し、新規 Cloudflare Workers Secret の投入名には使わない。

### 差分案（before / after）

#### before（現行正本から抜粋）

```markdown
## Cloudflare Secrets（ランタイム）

| シークレット名 | 説明 | 環境 |
| -------------- | ---- | ---- |
| `OPENAI_API_KEY` | OpenAI API キー（AI機能） | production / staging |
| `ANTHROPIC_API_KEY` | Anthropic API キー（Claude） | production / staging |
| `DATABASE_URL` | Cloudflare D1 接続 URL | production / staging |
| `SLACK_BOT_TOKEN` | Slack Bot Token（通知機能） | production / staging |
| `DISCORD_WEBHOOK_URL` | Discord Webhook（内部通知） | production / staging |
```

#### after（反映済み）

```markdown
## Cloudflare Secrets（ランタイム）

| シークレット名 | 説明 | 環境 |
| -------------- | ---- | ---- |
| `OPENAI_API_KEY` | OpenAI API キー（AI機能） | production / staging |
| `ANTHROPIC_API_KEY` | Anthropic API キー（Claude） | production / staging |
| `DATABASE_URL` | Cloudflare D1 接続 URL | production / staging |
| `SLACK_BOT_TOKEN` | Slack Bot Token（通知機能） | production / staging |
| `DISCORD_WEBHOOK_URL` | Discord Webhook（内部通知） | production / staging |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Google Sheets API 用 Service Account JSON key。`apps/api/src/jobs/sheets-fetcher.ts` / `sync-sheets-to-d1.ts` が `env.GOOGLE_SERVICE_ACCOUNT_JSON` として参照する正本名。投入は `bash scripts/cf.sh` 経由のみ。値は `wrangler secret list` でも参照不可（name のみ）。1Password 正本は `op://<Vault>/<Item>/<Field>` テンプレ表記で管理 | production / staging |

### 投入ルール（UT-25 で確定）

- `wrangler` は **直接呼ばない**。必ず `bash scripts/cf.sh secret put/list/delete --config apps/api/wrangler.toml --env <env>` 経由
- 値は **stdin 経由**で投入する（`op read "op://..." | bash scripts/cf.sh secret put ...`）
- `private_key` 内の `\n` 改行は stdin バイト透過で保全される
- staging-first 順序固定。production への投入は staging で name 確認後のみ
- rollback 経路: `secret delete` → 旧 key を `op read | secret put` で再投入の 2 段階（fail-fast）
- 実投入はユーザー承認後（UT-25 Phase 13 の deploy-runbook 経由）
```

### 反映時の追加確認

- [ ] 既存 secret 一覧表のフォーマットを乱さない
- [ ] secret 値 / JSON 内容 / `private_key` 片鱗を一切転記していない
- [ ] 1Password 参照は `op://<Vault>/<Item>/<Field>` テンプレ表記のみ

---

## 反映先 2: `.claude/skills/aiworkflow-requirements/references/environment-variables.md`

### 反映観点

env var 一覧表に `GOOGLE_SERVICE_ACCOUNT_JSON` の行を追加した。`apps/api` ローカル開発時の `.dev.vars` 取扱と `.gitignore` 除外も注記した。

### 差分案（before / after）

#### before（現行正本から抜粋）

```markdown
### Cloudflare Workers / Google Forms 同期

| 変数名 | 種別 | 用途 | 配置 |
| --- | --- | --- | --- |
| `GOOGLE_FORM_ID` | Variable | response sync 対象の Google Form ID | `apps/api/wrangler.toml` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Secret | Forms API service account email | Cloudflare Secrets |
| `GOOGLE_PRIVATE_KEY` | Secret | JWT assertion 署名用 private key | Cloudflare Secrets |
| `SYNC_ADMIN_TOKEN` | Secret | `/admin/sync` / `/admin/sync/responses` Bearer 認証 | Cloudflare Secrets |
```

#### after（反映済み）

```markdown
### Cloudflare Workers / Google Forms 同期

| 変数名 | 種別 | 用途 | 配置 |
| --- | --- | --- | --- |
| `GOOGLE_FORM_ID` | Variable | response sync 対象の Google Form ID | `apps/api/wrangler.toml` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Secret | Google Sheets API 用 Service Account JSON key。UT-25 で配置 runbook と staging-first 手順を確定した正本名。`apps/api/src/jobs/sheets-fetcher.ts` / `sync-sheets-to-d1.ts` が参照する | Cloudflare Workers Secrets（staging + production） |
| `GOOGLE_SHEETS_SA_JSON` | Secret | 旧 Sheets sync 実装名。移行期間の alias として実装側のみ許容し、Cloudflare Workers Secret の新規投入名には使わない | Cloudflare Secrets（legacy alias） |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Secret | 旧 Forms API service account email。JSON 一括方式へ移行済みなら削除候補 | Cloudflare Secrets |
| `GOOGLE_PRIVATE_KEY` | Secret | 旧 JWT assertion 署名用 private key。JSON 一括方式へ移行済みなら削除候補 | Cloudflare Secrets |
| `SYNC_ADMIN_TOKEN` | Secret | `/admin/sync` / `/admin/sync/responses` Bearer 認証 | Cloudflare Secrets |

### ローカル開発時の取扱

- `apps/api/.dev.vars` に `GOOGLE_SERVICE_ACCOUNT_JSON` を設定する（ローカル wrangler dev 用）
- `.dev.vars` には実値を書かず、`op://Vault/Item/Field` 参照を `op run --env-file=apps/api/.dev.vars` 経由で動的注入する
- `.dev.vars` は `.gitignore` 除外必須（誤コミット防止）
- 詳細手順: `docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-12/implementation-guide.md`
```

### 反映時の追加確認

- [ ] 既存 env var 一覧のフォーマットを乱さない
- [ ] secret 値の転記が無い
- [ ] `.dev.vars` の取扱と `.gitignore` 除外注記がセットで反映

---

## 反映実行結果

| step | 状態 | 内容 |
| --- | --- | --- |
| 1 | done | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` へ `GOOGLE_SERVICE_ACCOUNT_JSON` と投入ルールを追加 |
| 2 | done | `.claude/skills/aiworkflow-requirements/references/environment-variables.md` へ canonical secret / legacy alias / `scripts/cf.sh` コマンドを追加 |
| 3 | done | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` へ Sheets API v4 secret 境界を追加 |
| 4 | pending verification | index 再生成と CI gate は本レビュー修正後の検証で確認 |

> secret 値・JSON 内容・`private_key` の片鱗は反映していない。すべて `op://<Vault>/<Item>/<Field>` テンプレ表記に留めた。
