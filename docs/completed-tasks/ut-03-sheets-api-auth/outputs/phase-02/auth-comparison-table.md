# 認証方式比較評価表（AC-1）

## Service Account JSON key vs OAuth 2.0

| 評価軸 | Service Account JSON key | OAuth 2.0（ユーザー委任） |
| --- | --- | --- |
| Edge Runtime 対応 | Web Crypto API で RS256 署名可能 ✅ | リダイレクトフロー不可（Workers で UI なし）❌ |
| 実装複雑度 | JWT 自前実装が必要（中） | 認可フロー管理が複雑（高） |
| シークレット管理 | JSON key 1つを Cloudflare Secrets に配置 | refresh_token + client_secret の複数管理 |
| 権限スコープ | サービスアカウントに付与した権限のみ | ユーザー権限に依存 |
| 有効期限 | JSON key は明示的に無効化しない限り有効 | refresh_token が失効リスクあり |
| 監査ログ | GCP の IAM 監査ログで追跡可能 | ユーザーアカウントに紐付くため追跡しにくい |
| 非インタラクティブ対応 | server-to-server に最適 ✅ | 初回認可にユーザー操作が必要 ❌ |
| **選定判定** | **採用 ✅** | **不採用 ❌** |

## 選定理由

Cloudflare Workers は HTTP リクエスト処理のみを行う Edge Runtime であり、OAuth 2.0 の認可コードフロー（ブラウザリダイレクト）は実行できない。また、サービスアカウントは非インタラクティブな server-to-server 認証に最適であり、シークレット管理もシンプルである。

## 棄却された代替案

| 代替案 | 棄却理由 |
| --- | --- |
| OAuth 2.0 認可コードフロー | Workers は UI なし・ブラウザリダイレクト不可 |
| Workload Identity Federation | GCP と Cloudflare の OIDC 連携が複雑でコスト高 |
| API Key 認証 | Sheets API は API Key のみでは書き込み不可、Service Account が優位 |
| `google-auth-library` npm パッケージ | Node.js 依存があり Edge Runtime 非対応 |
