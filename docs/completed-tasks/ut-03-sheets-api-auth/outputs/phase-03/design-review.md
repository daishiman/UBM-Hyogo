# Phase 3: 設計レビュー結果

## レビュー概要

| 項目 | 値 |
| --- | --- |
| レビュー日 | 2026-04-26 |
| 対象 | Phase 2 設計ドキュメント群 |
| 総合判定 | PASS（MAJOR なし） |

## 代替案棄却確認

| 代替案 | 棄却理由 | 確認 |
| --- | --- | --- |
| OAuth 2.0 認可コードフロー | Workers は UI なし・ブラウザリダイレクト不可 | ✅ |
| Workload Identity Federation | GCP と Cloudflare の OIDC 連携が複雑でコスト高 | ✅ |
| API Key 認証 | Sheets API は API Key のみでは書き込み不可、Service Account が優位 | ✅ |
| `google-auth-library` npm パッケージ | Node.js 依存があり Edge Runtime 非対応 | ✅ |

## セキュリティレビュー

| レビュー項目 | 判定 | コメント |
| --- | --- | --- |
| `.dev.vars` の `.gitignore` 記載 | PASS | Phase 4 で確認・追加する |
| Cloudflare Secrets への配置 | PASS | runbook に手順を記載済み |
| Service Account の権限最小化 | PASS | `spreadsheets.readonly` スコープに限定 |
| JSON key のローテーション手順 | MINOR | Phase 5 runbook に記載する（ブロックしない） |
| JWT 有効期限の設定 | PASS | `iat + 3600`（最大値で適切） |
| トークンキャッシュのキー衝突 | PASS | 単一 Service Account のため衝突しない |
| エラーメッセージへの秘密鍵漏洩 | PASS | `SheetsAuthError` に秘密鍵を含めない設計 |

## Edge Runtime 制約レビュー

| レビュー項目 | 判定 | コメント |
| --- | --- | --- |
| `crypto.subtle` の使用 | PASS | Web Crypto API を明示的に使用 |
| PEM → DER 変換 | PASS | 設計書に変換手順を明示 |
| `fetch` の使用 | PASS | Workers 組み込み `fetch` を使用 |
| `Buffer` の不使用 | PASS | `Uint8Array` / `TextEncoder` / `btoa` を使用する設計 |
| `process.env` の不使用 | PASS | `env.GOOGLE_SERVICE_ACCOUNT_JSON` を使用 |
| 非同期処理の完結 | PASS | `async/await` で完結する設計 |

## モジュール設計レビュー

| レビュー項目 | 判定 | コメント |
| --- | --- | --- |
| 単一責務 | PASS | 認証トークン取得・キャッシュのみ担当 |
| 公開インターフェースの安定性 | PASS | `getAccessToken(env)` のシグネチャが安定 |
| エラー型の明確化 | PASS | `SheetsAuthError` で型安全にエラー伝播 |
| キャッシュ戦略の適切性 | PASS | KV なし時の in-memory fallback あり |

## MINOR 修正内容

1. **JSON key ローテーション手順**: Phase 5 の `setup-runbook.md` に追記する
   - 既存キーの失効: Google Cloud Console → Service Account → キー → 削除
   - 新キーの発行: 新規 JSON key をダウンロード
   - Cloudflare Secrets の更新: `wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --env staging/production`

## Phase 4 への引き継ぎ事項

- 設計は全項目 PASS（MAJOR なし）のため実装フェーズに進む
- AUTH-01〜AUTH-06 のテストを作成してから実装を開始する
- `.gitignore` への `.dev.vars` 記載を Phase 4 で必ず確認・修正する
