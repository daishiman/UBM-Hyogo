# Phase 11: 手動 smoke テスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets API 認証方式設定 (UT-03) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke テスト |
| 作成日 | 2026-04-26 |
| 前 Phase | 10 (最終レビュー / GO 判定必須) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

実際の Google Sheets API v4 からデータ取得できることを、ローカル環境および staging 環境で手動確認する。
自動テストでは代替できない「本物のシークレット + 本物の API エンドポイント」を使った疎通確認が目的である。

> **前提**: Phase 10 で GO 判定が得られていること。NO-GO の場合は本 Phase を開始しない。

## 実行タスク

- ローカル環境（`.dev.vars` 使用）での認証フローを確認する
- staging 環境での Sheets API v4 疎通を確認する
- エビデンス（curl 結果・スクリーンショット等）を所定フォーマットで記録する
- AC-5 / AC-6 の PASS を証跡付きで確定させる

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/01-infrastructure-setup/ut-03-sheets-api-auth/index.md | AC-5 / AC-6 の定義確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | .dev.vars の設定手順 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | staging 環境へのデプロイ・シークレット設定手順 |
| 参考 | outputs/phase-05/implementation-log.md | sheets-auth.ts の使用方法 |

## 実行手順

### ステップ 1: ローカル環境での事前準備

#### 1-1. `.dev.vars` の確認

`.dev.vars` ファイルが `apps/api/` 直下に存在し、以下の形式で `GOOGLE_SERVICE_ACCOUNT_JSON` が設定されていることを確認する。

```
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n","client_email":"...@....iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token"}
```

**確認チェックリスト**
- [ ] `.dev.vars` が `apps/api/` 直下に存在する
- [ ] `GOOGLE_SERVICE_ACCOUNT_JSON` キーが存在する
- [ ] JSON の `type` が `"service_account"` である
- [ ] `private_key` が改行エスケープ（`\n`）で正しくエンコードされている
- [ ] `.dev.vars` が `.gitignore` に含まれており、git 管理外である

#### 1-2. 対象スプレッドシートの共有設定確認

テスト対象のスプレッドシートが Service Account の `client_email` と共有されていることを確認する。

```
対象スプレッドシートID: 119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg
共有対象: <client_email> に「閲覧者」権限を付与
```

### ステップ 2: ローカル環境での認証フロー確認

#### 2-1. wrangler dev の起動

```bash
cd apps/api
mise exec -- pnpm exec wrangler dev --local
```

#### 2-2. 認証エンドポイントへのリクエスト

`sheets-auth.ts` を呼び出すエンドポイントに対して curl でリクエストを送信する。

```bash
# ローカル認証確認（エンドポイントは実装に合わせて変更する）
curl -s http://localhost:8787/api/sheets/test \
  -H "Content-Type: application/json" | jq .
```

**期待するレスポンス**
```json
{
  "status": "ok",
  "spreadsheetId": "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg",
  "sheetTitle": "<シート名>",
  "rowCount": <行数>
}
```

#### 2-3. エラーケースの確認

`GOOGLE_SERVICE_ACCOUNT_JSON` を無効な値に差し替えてエラーレスポンスを確認する。
シークレット値がエラーレスポンスに含まれていないことを確認する。

### ステップ 3: staging 環境での疎通確認

#### 3-1. staging へのシークレット設定確認

```bash
# staging 環境のシークレット一覧を確認（値は表示されない）
mise exec -- pnpm exec wrangler secret list --env staging
```

`GOOGLE_SERVICE_ACCOUNT_JSON` が一覧に表示されることを確認する。

#### 3-2. staging へのデプロイ

```bash
cd apps/api
mise exec -- pnpm exec wrangler deploy --env staging
```

#### 3-3. staging エンドポイントへのリクエスト

```bash
# staging 認証確認（URL は実際の staging ドメインに合わせて変更する）
curl -s https://api-staging.<your-subdomain>.workers.dev/api/sheets/test \
  -H "Content-Type: application/json" | jq .
```

### ステップ 4: エビデンスの記録

smoke テストの結果を `outputs/phase-11/smoke-test-evidence.md` に記録する。

## エビデンス記録フォーマット

`outputs/phase-11/smoke-test-evidence.md` は以下のテンプレートを使用して作成する。

```markdown
# Smoke テスト エビデンス

## 実施情報

| 項目 | 値 |
| --- | --- |
| 実施日 | YYYY-MM-DD |
| 実施者 | <担当者名> |
| 対象スプレッドシートID | 119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg |
| sheets-auth.ts バージョン | <git commit hash> |

---

## ローカル環境テスト（AC-5）

### 事前準備確認

- [ ] `.dev.vars` 存在確認: PASS / FAIL
- [ ] `GOOGLE_SERVICE_ACCOUNT_JSON` キー存在確認: PASS / FAIL
- [ ] スプレッドシート共有設定確認: PASS / FAIL
- [ ] `.dev.vars` の .gitignore 除外確認: PASS / FAIL

### テスト実行結果

**実行コマンド**
```
curl -s http://localhost:8787/api/sheets/test -H "Content-Type: application/json"
```

**レスポンス（実際の出力をここに貼り付け）**
```json
<ここに実際のレスポンスを貼り付ける>
```

**判定**: PASS / FAIL

**FAIL の場合の原因と対処**
（FAILの場合のみ記載）

---

## staging 環境テスト（AC-6）

### 事前準備確認

- [ ] `wrangler secret list --env staging` に GOOGLE_SERVICE_ACCOUNT_JSON が表示される: PASS / FAIL
- [ ] staging デプロイ成功: PASS / FAIL

### テスト実行結果

**実行コマンド**
```
curl -s https://api-staging.<your-subdomain>.workers.dev/api/sheets/test -H "Content-Type: application/json"
```

**レスポンス（実際の出力をここに貼り付け）**
```json
<ここに実際のレスポンスを貼り付ける>
```

**判定**: PASS / FAIL

**FAIL の場合の原因と対処**
（FAILの場合のみ記載）

---

## エラーケース確認

**確認内容**: 無効なシークレットを設定した場合、シークレット値がエラーレスポンスに含まれないこと

**エラーレスポンス（実際の出力をここに貼り付け）**
```json
<ここに実際のエラーレスポンスを貼り付ける>
```

- [ ] シークレット値（private_key 等）がレスポンスに含まれない: PASS / FAIL

---

## 総合判定

| AC | 内容 | 判定 |
| --- | --- | --- |
| AC-5 | ローカル環境での認証成功 | PASS / FAIL |
| AC-6 | staging 環境での認証成功 | PASS / FAIL |
| AC-7 | エラー時のシークレット非漏洩 | PASS / FAIL |

**全体判定**: PASS / FAIL

---

## スクリーンショット

（任意。ブラウザ経由での確認がある場合はここに添付）

---

## 備考・知見

（テスト実施中に得られた知見・トラブルシューティング内容があれば記載）
```

## 多角的チェック観点（AIが判断）

- 価値性: 本物の Google Sheets API v4 からデータが取得でき、下流タスク（UT-09）の実装開始に支障がないか
- 実現性: `.dev.vars` と wrangler dev の組み合わせでローカル認証が再現できるか
- 整合性: staging テスト結果が Phase 5 の実装意図と一致しているか
- 運用性: 将来のシークレットローテーション後も同じ手順で疎通確認できるか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | ローカル環境事前準備確認 | 11 | pending | .dev.vars 設定・共有設定 |
| 2 | ローカル認証フロー確認 | 11 | pending | curl 実行・レスポンス確認 |
| 3 | staging 疎通確認 | 11 | pending | wrangler deploy 後に実行 |
| 4 | エラーケース確認 | 11 | pending | シークレット非漏洩の確認 |
| 5 | エビデンス記録 | 11 | pending | outputs/phase-11/smoke-test-evidence.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/smoke-test-evidence.md | smoke テストの実施記録・エビデンス |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- `outputs/phase-11/smoke-test-evidence.md` が作成されている
- AC-5（ローカル認証）の判定が PASS で記録されている
- AC-6（staging 認証）の判定が PASS で記録されている
- AC-7（エラー時のシークレット非漏洩）の判定が PASS で記録されている
- エビデンス（curl 結果）が実際の出力で記録されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（シークレット未設定・API 権限不足・ネットワークエラー）も確認済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: smoke テストエビデンス（`outputs/phase-11/smoke-test-evidence.md`）を Phase 12 の implementation-guide.md 作成時の参考資料として引き継ぐ
- ブロック条件: AC-5 / AC-6 が FAIL の場合は Phase 12 に進まず、実装を修正して Phase 11 を再実施する
