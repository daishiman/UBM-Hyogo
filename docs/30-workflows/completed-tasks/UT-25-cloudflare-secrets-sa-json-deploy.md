# UT-25: Cloudflare Secrets 本番配置（GOOGLE_SERVICE_ACCOUNT_JSON）

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-25 |
| タスク名 | Cloudflare Secrets 本番配置（GOOGLE_SERVICE_ACCOUNT_JSON） |
| 優先度 | HIGH |
| 推奨Wave | Wave 1 |
| 状態 | unassigned |
| 作成日 | 2026-04-27 |
| 既存タスク組み込み | なし（UT-03 はモジュール実装と runbook 化、本タスクは実際の配置作業） |
| 組み込み先 | - |
| 検出元 | UT-03 実装後に本番配置が別タスクとして分離 |

## 目的

UT-03 で実装した Sheets API 認証モジュール（`apps/api/src/jobs/sheets-fetcher.ts`）が staging・production の Cloudflare Workers 上で実際に動作するよう、`GOOGLE_SERVICE_ACCOUNT_JSON` シークレットを手動で配置する。UT-03 のタスクスコープでは SA JSON key の配置手順を runbook 化したが、実際の鍵は機密情報のため 1Password から取得してユーザーが手動実施する必要があり、本タスクとして分離された。

## スコープ

### 含む

- 1Password から本番用 Service Account JSON key を取得する手順の確認
- `op read ... | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env staging` による staging 環境への配置
- `op read ... | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env production` による production 環境への配置
- 配置後の `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env <env>` による存在確認
- `.dev.vars` を使う場合は `op://<Vault>/<Item>/<Field>` 参照のみを置く（実値禁止）ことと gitignore 除外確認
- 配置完了の記録（runbook への反映）

### 含まない

- Service Account の新規作成（01c-parallel-google-workspace-bootstrap で実施済み）
- sheets-auth.ts モジュールの実装（UT-03 のスコープ）
- Sheets API v4 への実際の疎通確認（UT-26 のスコープ）
- CI/CD パイプライン経由でのシークレット自動配置（UT-05 のスコープ）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-03（Sheets API 認証方式設定） | sheets-auth.ts が実装済みで、シークレット名 `GOOGLE_SERVICE_ACCOUNT_JSON` が確定している必要がある |
| 上流 | 01c-parallel-google-workspace-bootstrap | Service Account が作成済みで JSON key が 1Password に保存されている必要がある |
| 上流 | 01b-parallel-cloudflare-base-bootstrap | Cloudflare Workers（apps/api）の staging / production が作成済みであること |
| 下流 | UT-26（Sheets API エンドツーエンド疎通確認） | シークレット配置後に実 API 疎通テストを実施する |
| 下流 | UT-09（Sheets→D1 同期ジョブ実装） | 本番 Sheets API へのアクセスにシークレットが必要 |

## 着手タイミング

> **着手前提**: UT-03 が完了し、1Password に SA JSON key が保存済みであること。Cloudflare Workers の staging / production インスタンスが存在すること。

| 条件 | 理由 |
| --- | --- |
| UT-03 完了 | シークレット名と用途が確定しており、配置先の Workers が判明している |
| 1Password に SA JSON key が保存済み | 実際の鍵を取得する手段が必要 |
| Cloudflare Workers 作成済み | シークレットの配置先が存在しないと `wrangler secret put` が失敗する |

## 苦戦箇所・知見

**1. secret put は stdin 経由に固定する**
`bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env <env>` は stdin から値を受け取る。値は `op read "op://<Vault>/<Item>/<Field>" | bash scripts/cf.sh ...` で渡し、`echo '<json>'`、手貼り、実値ファイルの作成は使わない。シェル履歴に credentials を残さないため、`set +o history` と `HISTFILE=/dev/null` を併用する。

**2. staging と production で wrangler.toml の env を切り替える**
`--env staging` / `--env production` を必ず明示する。production をフラグなし既定として扱わない。実行はリポジトリルートから `bash scripts/cf.sh ... --config apps/api/wrangler.toml --env <env>` 経由に固定する。

**3. JSON key の改行と特殊文字のエスケープ**
Service Account JSON key には改行文字が含まれる private_key フィールドがある。手貼りや `echo` を経由すると改行コードが壊れて認証エラーになることがある。1Password からの stdin バイト列をそのまま `bash scripts/cf.sh secret put` に流し、staging 環境で先に name 確認してから production に適用すること。

**4. 配置後の確認は `wrangler secret list` のみ**
Cloudflare Secrets は配置後に値の読み取りができない（セキュリティ仕様）。`bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env <env>` で名前の存在確認のみ可能。実際に正しく機能するかは UT-26 の疎通確認で検証する。

**5. .dev.vars の gitignore 確認**
ローカル開発で `.dev.vars` を使う場合も SA JSON key の実値は記述せず、`op://<Vault>/<Item>/<Field>` 参照のみを置く。`.gitignore` に `apps/api/.dev.vars` が含まれていることを必ず確認する。

## 実行概要

1. 1Password から `GOOGLE_SERVICE_ACCOUNT_JSON` の値（Service Account JSON key）を取得する
2. `op read "op://<Vault>/<Item>/<Field>" | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env staging` を実行し staging に配置する
3. `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging` で配置確認する
4. staging が PASS した後、同じ stdin 経路で `--env production` を明示して production に配置する
5. `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production` で配置確認する
6. ローカル開発用に `apps/api/.dev.vars` を使う場合は `GOOGLE_SERVICE_ACCOUNT_JSON=op://<Vault>/<Item>/<Field>` 参照のみを記述し、`.gitignore` 除外を確認する
7. UT-03 の runbook（SA JSON key 配置手順）に完了日時を記録する

## 完了条件

- [ ] staging 環境の `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging` に `GOOGLE_SERVICE_ACCOUNT_JSON` が表示される
- [ ] production 環境の `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production` に `GOOGLE_SERVICE_ACCOUNT_JSON` が表示される
- [ ] `apps/api/.dev.vars` を使う場合、実値ではなく `op://` 参照のみが設定されている（gitignore 除外確認済み）
- [ ] UT-03 の runbook に配置完了の記録が追記されている
- [ ] UT-26（疎通確認タスク）に着手可能な状態になっている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/unassigned-task/UT-03-sheets-api-auth-setup.md | sheets-auth.ts 実装詳細・シークレット名の確認 |
| 必須 | docs/unassigned-task/UT-26-sheets-api-e2e-smoke-test.md | 本タスク完了後の次ステップ（疎通確認） |
| 参考 | https://developers.cloudflare.com/workers/configuration/secrets/ | wrangler secret put コマンドリファレンス |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare Secrets 配置方針 |
| 参考 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | .dev.vars 管理方針 |
