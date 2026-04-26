# UT-25: Cloudflare Secrets 本番配置（GOOGLE_SERVICE_ACCOUNT_JSON）

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-25 |
| タスク名 | Cloudflare Secrets 本番配置（GOOGLE_SERVICE_ACCOUNT_JSON） |
| 優先度 | HIGH |
| 推奨Wave | Wave 1 |
| 状態 | unassigned |
| 作成日 | 2026-04-26 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| 発見元 | UT-03 Phase 12 未タスク検出 |
| GitHub Issue | #40 |

## 目的

staging・production 環境の Cloudflare Workers に `GOOGLE_SERVICE_ACCOUNT_JSON` シークレットを `wrangler secret put` で実際に配置し、UT-03 で実装した `sheets-auth.ts` モジュールが本番環境で Sheets API v4 に認証できる状態を確立する。本番 Service Account JSON key はユーザーが 1Password から取得して手動実施する必要があるため、UT-03 タスクスコープから分離された未タスクである。

## スコープ

### 含む

- staging 環境への `GOOGLE_SERVICE_ACCOUNT_JSON` の `wrangler secret put` 実行（apps/api, apps/web 両方）
- production 環境への `GOOGLE_SERVICE_ACCOUNT_JSON` の `wrangler secret put` 実行
- `wrangler secret list` による配置確認
- `.dev.vars` のローカル開発用 SA JSON 配置確認（`.gitignore` 除外済みであること）
- 配置後の動作確認（`wrangler dev` / staging デプロイ後の認証疎通）

### 含まない

- Service Account の新規作成（→ 01c-parallel-google-workspace-bootstrap で実施済み前提）
- sheets-auth.ts モジュールの実装（→ UT-03 で実施済み）
- Sheets API の読み書き実装（→ UT-09 で実施）
- CI/CD への secrets 配置（→ UT-05 で実施）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-03 (Sheets API 認証方式設定) | sheets-auth.ts の実装が前提。シークレット名 `GOOGLE_SERVICE_ACCOUNT_JSON` が確定 |
| 上流 | docs/01-infrastructure-setup/01c-parallel-google-workspace-bootstrap | Service Account JSON key の発行元 |
| 下流 | UT-26 (Sheets API E2E 疎通確認) | シークレット配置後に疎通確認を実施 |
| 下流 | UT-09 (Sheets→D1 同期ジョブ実装) | 本タスクの配置完了後に同期ジョブが本番動作可能になる |
| 連携 | UT-05 (CI/CD パイプライン実装) | CI/CD 環境の GitHub Secrets への配置は UT-05 で実施 |

## 着手タイミング

| 条件 | 理由 |
| --- | --- |
| UT-03 完了後 | sheets-auth.ts と wrangler.toml バインディング設定が完了している必要がある |
| 1Password から SA JSON key 取得済み | 本番用 SA JSON key をユーザーが手動取得する必要がある |

## 苦戦箇所・知見

**1. wrangler secret put は対話的入力が必要**
`wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON` は標準入力から値を読み取る。JSON が複数行にわたるため `cat service-account.json | wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON` または `wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --text "$(cat service-account.json)"` のようにパイプ経由で渡す必要がある。CI 環境では `echo "$SECRET" | wrangler secret put` 形式が使われる。

**2. apps/api と apps/web 両方に設定が必要な場合がある**
`sheets-auth.ts` が `apps/api` 側に配置されている場合は api の Workers にのみ設定すれば良いが、`apps/web` が直接 Sheets API を呼ぶ設計になっている場合は両方に設定が必要。wrangler.toml の `[secrets]` 定義と実際の Workers を確認してから実施する。

**3. staging と production で別々の Service Account を使うべきかの判断**
セキュリティポリシーとして staging/production で別 SA を使う場合と共通 SA を使う場合がある。本プロジェクトでは Sheets スプレッドシートが環境別に分かれていないため、同一 SA を使うケースが多い。ただし production Sheets への staging からの誤書き込みリスクを考慮して、読み取り専用スコープ（`https://www.googleapis.com/auth/spreadsheets.readonly`）のみで設定することを推奨。

**4. .dev.vars の扱いと git 混入防止**
ローカル開発では `.dev.vars` に `GOOGLE_SERVICE_ACCOUNT_JSON='{...}'` を記述する。このファイルが `.gitignore` に含まれているか必ず確認すること。UT-03 で設定済みのはずだが、worktree や新環境では再確認が必要。

## 実行概要

1. 1Password から本番用 Service Account JSON key を取得
2. `.dev.vars` にローカル開発用の SA JSON を記述（`.gitignore` 除外確認）
3. `wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON` を staging 環境に実行
4. `wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON` を production 環境に実行
5. `wrangler secret list` で各環境に配置されたことを確認
6. UT-26 に引き渡し（E2E 疎通確認）

## 完了条件

- [ ] staging 環境の `GOOGLE_SERVICE_ACCOUNT_JSON` が `wrangler secret list` で確認できる
- [ ] production 環境の `GOOGLE_SERVICE_ACCOUNT_JSON` が `wrangler secret list` で確認できる
- [ ] `.dev.vars` が `.gitignore` に含まれていることを確認済み
- [ ] 配置後にローカルまたは staging で sheets-auth.ts モジュールが認証エラーなしに動作することを確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/ut-03-sheets-api-auth/outputs/phase-01/requirements.md | setup-runbook.md の手順 2 参照 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare Secrets 配置方針 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | .dev.vars 管理方針 |
| 参考 | docs/01-infrastructure-setup/01c-parallel-google-workspace-bootstrap | SA JSON key 発行元情報 |
