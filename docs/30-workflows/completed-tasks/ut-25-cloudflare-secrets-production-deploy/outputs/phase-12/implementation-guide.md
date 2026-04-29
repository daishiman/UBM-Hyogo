# implementation-guide — UT-26 担当者向け実装ガイド

> **読者**: UT-26（Sheets API E2E 疎通）担当 / 本タスク完了後にローテーションで合流する将来の自分
> **前提知識**: ゼロでよい。Part 1 で 4 用語を中学生レベルから説明する。

---

## Part 1: 中学生レベル概念説明

### なぜ必要か

Google Sheets を読むための鍵を安全な場所に入れないと、アプリは必要な情報を取りに行けない。一方で、その鍵を文書や履歴に残すと、知らない人にも使われる危険がある。だから「鍵を安全に預ける方法」と「鍵が入ったことだけを確認する方法」を分けて決める必要がある。何をするかは、Cloudflare の秘密の入れ物へ鍵を入れる手順と、入ったことだけを名前で確認する手順を用意すること。

### 今回作ったもの

- `GOOGLE_SERVICE_ACCOUNT_JSON` を Cloudflare Workers Secret に入れるための runbook
- staging → production の順で進める evidence template
- UT-26 が Sheets API E2E に進むための引き渡しチェックリスト

### 1. Cloudflare Workers Secret とは

Cloudflare Workers Secret は、**Cloudflare のサーバー上に「人間が後から見られない引き出し」をつくって、その中に秘密のメモを入れておく仕組み**です。

- コード（`apps/api`）からは「名前を呼ぶ」ことで使える: `env.GOOGLE_SERVICE_ACCOUNT_JSON`
- でも一度入れた中身は **誰も後から取り出して読むことができない**（管理者でも見られない）
- だから、もし「中身を確認したい」と思っても無理。`wrangler secret list` で確認できるのは「引き出しの名前があるかないか」だけ

これは「鍵をしまう金庫」のイメージで、金庫を開けるのではなく「金庫に鍵が入っているかどうか」だけを名札で確認する、と覚えるとよい。

### 2. Service Account JSON key とは

Google が発行する **「この鍵を持っている人は Sheets を読み書きしてよいよ」という許可証ファイル** です。

- 中身は JSON で、`private_key` というフィールドに長い文字列が入っている
- その長い文字列の中には **改行（`\n`）が混ざっている**
- もしコピペや echo で貼り付けると改行が壊れて、許可証として使えなくなる
- だから「ファイルからそのまま流し込む（stdin）」方法を使って、改行を 1 文字も壊さずに Cloudflare の引き出しに入れる必要がある

### 3. `wrangler secret put` とは

Cloudflare に「秘密のメモを引き出しに入れて」と頼むコマンドです。

- `staging`（練習用の部屋）と `production`（本番の部屋）の **2 つの部屋に別々の引き出し** がある
- どちらに入れるかは `--env staging` / `--env production` で切り替える
- このコマンドは本来「ターミナルに値を貼り付けて」と聞いてくる（インタラクティブ）
- でも貼り付けると **シェル履歴に値が残ってしまう** ので使わない
- 代わりに「stdin（パイプ）から値を流し込む」方式を使う: `op read ... | wrangler secret put ...`

### 4. 1Password 経由 stdin 注入とは

秘密のメモをファイルやシェル履歴に **1 ミリも残さずに** Cloudflare に渡す方法です。

```bash
op read "op://Vault/Item/Field" | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --env staging
```

- `op read` は 1Password から値をメモリ上に取り出す（ファイルに書かない）
- `|`（パイプ）はその値を **目に見えないトンネル** で次のコマンドに流す
- `bash scripts/cf.sh secret put` は wrangler を呼び出して、流れてきた値をそのまま引き出しに入れる
- どこにも値が残らない: シェル履歴に残るのは「`op read` と `bash scripts/cf.sh secret put` というコマンドだけ」で、値そのものは残らない

---

## Part 2: 確定済みコマンド系列（staging smoke で確定形）

> 出典: `outputs/phase-11/manual-smoke-log.md` の staging smoke 記録テンプレート
> production は Phase 13 deploy-runbook に展開済み（同じ手順の `--env production` 版）

### TypeScript 型定義

```ts
export interface GoogleSheetsEnv {
  GOOGLE_SERVICE_ACCOUNT_JSON: string;
  GOOGLE_SHEETS_SA_JSON?: string; // legacy alias during migration only
}

export interface ServiceAccountJsonShape {
  client_email: string;
  private_key: string;
  token_uri?: string;
}
```

`apps/api/src/jobs/sheets-fetcher.ts` は `env.GOOGLE_SERVICE_ACCOUNT_JSON` を JSON 文字列として受け取り、Service Account 認証に使う。`apps/api/src/jobs/sync-sheets-to-d1.ts` は移行期間だけ `GOOGLE_SHEETS_SA_JSON` も legacy alias として受け付けるが、新規 secret 投入名は `GOOGLE_SERVICE_ACCOUNT_JSON` に統一する。文書には実 JSON 値を残さない。

### APIシグネチャ

```bash
bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
  --config apps/api/wrangler.toml --env <staging|production>

bash scripts/cf.sh secret list \
  --config apps/api/wrangler.toml --env <staging|production>

bash scripts/cf.sh secret delete GOOGLE_SERVICE_ACCOUNT_JSON \
  --config apps/api/wrangler.toml --env <staging|production>
```

### 使用例

```bash
op read "op://<Vault>/<Item>/<Field>" \
  | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
      --config apps/api/wrangler.toml --env staging
```

### 設定項目と定数一覧

| 項目 | 値 | 備考 |
| --- | --- | --- |
| Secret name | `GOOGLE_SERVICE_ACCOUNT_JSON` | UT-03 `sheets-auth.ts` が参照 |
| Config | `apps/api/wrangler.toml` | `--config` 必須 |
| Environments | `staging`, `production` | staging-first |
| Source | `op://<Vault>/<Item>/<Field>` | 実 path は文書化しない |
| Wrapper | `bash scripts/cf.sh` | `wrangler` 直接実行禁止 |

### 環境準備

```bash
# Node 24 / pnpm 10 を mise で確実に使う
mise install
mise exec -- pnpm install

# 履歴汚染防止
set +o history
HISTFILE=/dev/null
export HISTFILE
```

### staging への投入（Phase 11 で確定 / Phase 13 deploy-runbook の STEP 1 と同じ）

```bash
op read "op://<Vault>/<Item>/<Field>" \
  | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
      --config apps/api/wrangler.toml --env staging

bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
# → name 行に GOOGLE_SERVICE_ACCOUNT_JSON があれば OK
```

### production への投入（Phase 13 ユーザー承認後にユーザー本人が実走）

```bash
op read "op://<Vault>/<Item>/<Field>" \
  | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
      --config apps/api/wrangler.toml --env production

bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production
```

### rollback（緊急時）

```bash
bash scripts/cf.sh secret delete GOOGLE_SERVICE_ACCOUNT_JSON \
  --config apps/api/wrangler.toml --env <staging|production>

op read "op://<Vault>/<Item>/<Field-OLD>" \
  | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
      --config apps/api/wrangler.toml --env <staging|production>
```

### エラーハンドリング

| エラー | 対応 |
| --- | --- |
| `op read` が失敗 | 1Password login / item path / 権限を確認し、値を表示せず中断 |
| `secret put` が失敗 | 対象 env と `apps/api/wrangler.toml` を確認し、production へ進まない |
| `secret list` に name が出ない | 再 put 前に env 誤りを確認。staging が PASS するまで production 禁止 |
| rollback 中に旧 key が読めない | 旧 key の 1Password revision / item を確認。削除だけで終了しない |

### エッジケース

- `--env` を省略すると top-level worker に投入される可能性があるため、全コマンドで明示する。
- `private_key` の改行を壊さないため、`echo` や手貼りではなく stdin パイプを使う。
- `wrangler secret list` は値を返さないため、機能疎通は UT-26 に委譲する。
- staging smoke と production deploy の evidence は混ぜず、環境別ファイルに分離する。

### テスト構成

| レベル | 内容 | 成果物 |
| --- | --- | --- |
| L1 | `secret list` name 確認 | `secret-list-evidence-*.txt` |
| L2 | `.dev.vars` gitignore 確認 | `manual-smoke-log.md` |
| L3 | rollback 手順確認 | `rollback-runbook.md` |
| L4 | Sheets API 実疎通 | UT-26 に委譲 |

### 禁止事項（再掲）

- `wrangler ...` を直接呼ばない（必ず `bash scripts/cf.sh` 経由）
- `.env` に実値を書かない（`op://` 参照のみ）
- secret 値・JSON 内容・`private_key` の片鱗をログ・PR 本文・コミットメッセージに転記しない
- `wrangler login` でローカル OAuth トークンを保持しない（`.env` の op 参照に一本化）

---

## Part 3: UT-26 引き渡しチェックリスト

UT-26（Sheets API E2E 疎通）担当が確認する項目。

- [ ] `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging` に `GOOGLE_SERVICE_ACCOUNT_JSON` の name がある
- [ ] `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production` に `GOOGLE_SERVICE_ACCOUNT_JSON` の name がある
- [ ] `apps/api/src/jobs/sheets-fetcher.ts` が `env.GOOGLE_SERVICE_ACCOUNT_JSON` を参照している
- [ ] `apps/api/wrangler.toml` の `[env.staging]` / `[env.production]` 宣言が存在
- [ ] `apps/api/.dev.vars` がローカル開発用に `op://` 参照で配置済み（実値ではない）
- [ ] `.gitignore` に `apps/api/.dev.vars` が含まれている（誤コミット防止）
- [ ] runbook 変更のレビュー方針が決まっている（PR 作成はユーザーの明示指示後）
- [ ] `outputs/phase-13/secret-list-evidence-{staging,production}.txt` が name 行で埋まっている
- [ ] `outputs/phase-12/unassigned-task-detection.md` の派生タスクを別 issue で確認

UT-26 はここから Sheets API 実呼び出しでの SA 認証成功を確認する。本タスク（UT-25）は **name 確認まで** で、実機能疎通は UT-26 のスコープ。

---

## 参照

- 親仕様: `docs/30-workflows/unassigned-task/UT-25-cloudflare-secrets-sa-json-deploy.md`
- staging smoke 実走: `outputs/phase-11/manual-smoke-log.md`
- deploy / rollback 手順書: `outputs/phase-13/deploy-runbook.md` / `outputs/phase-13/rollback-runbook.md`
- CLAUDE.md（Cloudflare 系 CLI 実行ルール / シークレット管理）
- scripts/cf.sh
