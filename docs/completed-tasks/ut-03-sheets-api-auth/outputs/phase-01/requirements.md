# Phase 1: 要件定義

## タスク概要

| 項目 | 値 |
| --- | --- |
| タスク ID | UT-03 |
| タスク名 | Sheets API 認証方式設定 |
| 作成日 | 2026-04-26 |

## 真の論点

### 1. Edge Runtime 制約
Cloudflare Workers は Node.js 互換 API を持たない。`jsonwebtoken` や `google-auth-library` 等の Node.js ライブラリは Edge Runtime 非対応。`crypto.subtle`（Web Crypto API）のみで RS256 JWT 署名を実現する必要がある。

PEM 形式の秘密鍵を `crypto.subtle.importKey` に渡す前に：
- PEM ヘッダー/フッター（`-----BEGIN PRIVATE KEY-----` 等）を除去
- Base64 デコードして DER バイナリに変換
- `PKCS#8` 形式として `RSASSA-PKCS1-v1_5 / SHA-256` でインポート

### 2. シークレット管理の二重化
Service Account JSON key はローカル（`.dev.vars`）と Cloudflare Secrets（staging/production）の2系統で管理する。環境差異を明確にしないと本番デプロイ時に認証エラーが発生する。`.dev.vars` は `.gitignore` に必須記載。

### 3. アクセストークンのライフサイクル
Google OAuth 2.0 アクセストークンの有効期間は 3600秒（1時間）。Workers リクエストごとに毎回取得すると Sheets API レート制限（500 req/100s）に影響。module-scoped in-memory 変数または Workers KV でキャッシュし、残り 60秒以下で再取得する戦略が必要。

## スコープ確定

### 含む
- Service Account JSON key vs OAuth 2.0 の比較評価と選定根拠文書化
- `packages/integrations/src/sheets-auth.ts` の実装
  - Web Crypto API による RS256 JWT 署名
  - Google OAuth 2.0 Token Endpoint からのアクセストークン取得
  - TTL 1時間のアクセストークンキャッシュ（in-memory + KV fallback）
- Cloudflare Secrets への `GOOGLE_SERVICE_ACCOUNT_JSON` 配置 runbook
- `.dev.vars` を用いたローカル開発フローの文書化
- `.gitignore` への `.dev.vars` 除外確認
- Sheets スプレッドシートへのサービスアカウント共有手順の runbook 記載

### 含まない
- Google Sheets API v4 の読み書き実装（→ UT-09）
- D1 スキーマ設計（→ UT-04）
- Google Cloud Project の作成・Service Account 発行（→ 01c-parallel-google-workspace-bootstrap 済み前提）

## 受入条件（AC）

| AC | 内容 |
| --- | --- |
| AC-1 | Service Account JSON key と OAuth 2.0 の比較評価表が `outputs/phase-02/auth-comparison-table.md` に存在する |
| AC-2 | `GOOGLE_SERVICE_ACCOUNT_JSON` が Cloudflare Secrets（staging / production）に配置済みの手順が documented である |
| AC-3 | `packages/integrations/src/sheets-auth.ts` が実装済みで、JWT 署名・アクセストークン取得・TTL キャッシュが動作する |
| AC-4 | ローカル・staging・production 環境での動作確認手順が documented である |
| AC-5 | `.dev.vars` が `.gitignore` に記載されており、機密情報がリポジトリにコミットされない状態が確認できる |
| AC-6 | Sheets スプレッドシートへのサービスアカウント共有手順が runbook に記載されている |
| AC-7 | ローカル開発フロー（`.dev.vars` を使ったシークレット注入）が文書化されている |

## 4条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | Edge Runtime 対応の Sheets API 認証基盤が UT-09・03-serial の開発を unblock するか | PASS | UT-09 が直接依存している認証基盤であり、提供なしには開発を進められない |
| 実現性 | Web Crypto API のみで RS256 JWT 署名が実現でき、Cloudflare Workers 無料枠内で完結するか | PASS | Web Crypto API は Workers 標準組み込み。実装例も公式ドキュメントに記載あり |
| 整合性 | ローカル（`.dev.vars`）・staging・production のシークレット管理方式が一貫しているか | PASS | `.dev.vars`（ローカル）と Cloudflare Secrets（cloud）は wrangler が公式サポートするパターン |
| 運用性 | Service Account JSON key のローテーション・失効時のロールバック手順が明確か | CONDITIONAL | ローテーション手順を runbook に記載する必要あり（Phase 5 で実施） |

## 既存資産インベントリ

| 資産 | パス | 状態 |
| --- | --- | --- |
| packages/integrations ディレクトリ | `packages/integrations/` | 存在する（`src/index.ts` あり） |
| packages/integrations/package.json | `packages/integrations/package.json` | 存在する（`@ubm-hyogo/integrations`） |
| packages/integrations/src/ | `packages/integrations/src/` | 存在する（`index.ts` のみ） |
| sheets-auth.ts | `packages/integrations/src/sheets-auth.ts` | 未作成（競合なし） |
| .gitignore の .dev.vars 記載 | `.gitignore` | 未確認（Phase 4 で verify） |
| pnpm workspace 設定 | `pnpm-workspace.yaml` | `packages/*` でカバー済み |

## downstream handoff（Phase 2 への引き継ぎ事項）

- AC-1〜AC-7 を設計ドキュメントに反映すること
- 認証方式は **Service Account JSON key** に決定（Edge Runtime 制約により OAuth 2.0 認可フロー不採用）
- Sheets API スコープは `spreadsheets.readonly`（UT-01 確認済み前提）
- `sheets-auth.ts` の公開インターフェースは `getAccessToken(env)` を起点とする
- キャッシュ戦略: module-scoped in-memory を基本とし、`SHEETS_TOKEN_CACHE` KV binding があれば KV を優先
