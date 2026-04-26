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

UT-03 で実装した Sheets API 認証モジュール（`packages/integrations/sheets-auth.ts`）が staging・production の Cloudflare Workers 上で実際に動作するよう、`GOOGLE_SERVICE_ACCOUNT_JSON` シークレットを手動で配置する。UT-03 のタスクスコープでは SA JSON key の配置手順を runbook 化したが、実際の鍵は機密情報のため 1Password から取得してユーザーが手動実施する必要があり、本タスクとして分離された。

## スコープ

### 含む

- 1Password から本番用 Service Account JSON key を取得する手順の確認
- `wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON` による staging 環境への配置
- `wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON` による production 環境への配置
- 配置後の `wrangler secret list` による存在確認
- `.dev.vars` を使ったローカル開発環境への設定確認（gitignore 除外確認）
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

**1. wrangler secret put はインタラクティブ入力または stdin を要する**
`wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON` はデフォルトで対話入力を求める。JSON key ファイルをコマンドに直接渡す場合は `echo '<json>' | wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON` または `cat sa.json | wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON` の形式を使う。シェル履歴に credentials が残らないよう `history -d` や `HISTFILE=/dev/null` の活用を検討すること。

**2. staging と production で wrangler.toml の env を切り替える**
`wrangler secret put` は `--env staging` フラグで staging 環境を対象にする。production はデフォルト（フラグなし）または `--env production` で対象にする。`apps/api/` ディレクトリから実行すること（wrangler.toml が存在する場所）。

**3. JSON key の改行と特殊文字のエスケープ**
Service Account JSON key には改行文字が含まれる private_key フィールドがある。シェルを経由して渡すと改行コードが壊れて認証エラーになることがある。`wrangler secret put` への渡し方をテストする際は staging 環境で先に動作確認してから production に適用すること。

**4. 配置後の確認は `wrangler secret list` のみ**
Cloudflare Secrets は配置後に値の読み取りができない（セキュリティ仕様）。`wrangler secret list` で名前の存在確認のみ可能。実際に正しく機能するかは UT-26 の疎通確認で検証する。

**5. .dev.vars の gitignore 確認**
ローカル開発で `.dev.vars` に SA JSON key を記述する場合、`.gitignore` に `apps/api/.dev.vars` が含まれていることを必ず確認する。UT-03 の runbook に記載があるはずだが、worktree 環境では `.gitignore` の効果範囲を再確認すること。

## 実行概要

1. 1Password から `GOOGLE_SERVICE_ACCOUNT_JSON` の値（Service Account JSON key）を取得する
2. `apps/api/` ディレクトリで `wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --env staging` を実行し staging に配置する
3. `wrangler secret list --env staging` で配置確認する
4. `apps/api/` ディレクトリで `wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON` を実行し production に配置する
5. `wrangler secret list` で配置確認する
6. ローカル開発用に `apps/api/.dev.vars` に `GOOGLE_SERVICE_ACCOUNT_JSON=<json>` を記述し、`.gitignore` 除外を確認する
7. UT-03 の runbook（SA JSON key 配置手順）に完了日時を記録する

## 完了条件

- [ ] staging 環境の `wrangler secret list` に `GOOGLE_SERVICE_ACCOUNT_JSON` が表示される
- [ ] production 環境の `wrangler secret list` に `GOOGLE_SERVICE_ACCOUNT_JSON` が表示される
- [ ] `apps/api/.dev.vars` にローカル用の値が設定されている（gitignore 除外確認済み）
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
