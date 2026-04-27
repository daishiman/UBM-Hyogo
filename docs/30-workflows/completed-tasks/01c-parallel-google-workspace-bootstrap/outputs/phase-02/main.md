# Phase 2 主成果物: 設計

## Google Workspace 連携基盤 - 設計書

### Google Cloud Project 設計
| 項目 | 設計値 | 備考 |
|------|--------|------|
| Project 名称 | ubm-hyogo | ユーザーが任意に決定可 |
| Project ID | ubm-hyogo（or ubm-hyogo-XXXX） | 一意の ID |
| Organization | なし | 個人プロジェクト |
| Billing | 無料枠のみ使用 | クレジットカード登録は必要 |

### 有効化する API
| API | 用途 | 無料枠 |
|-----|------|--------|
| Google Sheets API | スプレッドシート読み込み | 100 requests/100 seconds/user |
| Google Drive API | ファイル権限補助 | 1000 requests/100 seconds/user |

### OAuth 2.0 クライアント設計
| 項目 | 設計値 |
|------|--------|
| Application type | Web application |
| 名前 | ubm-hyogo-web |
| Authorized redirect URIs (local) | http://localhost:3000/api/auth/callback/google |
| Authorized redirect URIs (prod) | https://[production-domain]/api/auth/callback/google |
| Scopes | https://www.googleapis.com/auth/spreadsheets.readonly |
| 用途 | 将来の管理者ログイン（初回スコープは設定のみ） |
| GOOGLE_CLIENT_ID 配置 | Cloudflare Secrets |
| GOOGLE_CLIENT_SECRET 配置 | Cloudflare Secrets |

### Service Account 設計
| 項目 | 設計値 |
|------|--------|
| SA 名称 | ubm-hyogo-sheets-reader |
| SA Email | ubm-hyogo-sheets-reader@[project-id].iam.gserviceaccount.com |
| プロジェクトIAM role | 不要（Sheetsへのアクセスはシート共有で制御） |
| Key type | JSON |
| 用途 | サーバーサイドからのSheets読み込み専用 |
| GOOGLE_SERVICE_ACCOUNT_JSON 配置 | Cloudflare Secrets |

### Sheet Access Contract 設計
| 項目 | 設計値 |
|------|--------|
| アクセス方法 | SAメールアドレスをスプレッドシートに「閲覧者」として共有 |
| GOOGLE_SHEET_ID | GitHub Variables（non-secret identifier） |
| スコープ | https://www.googleapis.com/auth/spreadsheets.readonly |
| アクセス種別 | read-only（書き込み禁止） |
| canonical DB | Cloudflare D1（Sheetsから取り込み後） |

### Secret 命名規則
| 変数名 | 命名規則 | 配置先 |
|--------|----------|--------|
| GOOGLE_CLIENT_ID | `GOOGLE_` + サービス + 役割 | Cloudflare Secrets |
| GOOGLE_CLIENT_SECRET | `GOOGLE_` + サービス + 役割 | Cloudflare Secrets |
| GOOGLE_SERVICE_ACCOUNT_JSON | `GOOGLE_` + 役割 + 形式 | Cloudflare Secrets |
| GOOGLE_SHEET_ID | `GOOGLE_` + リソース + 識別子 | GitHub Variables |

### 依存マトリクス
| 種別 | 対象 | 参照する成果物 |
|------|------|----------------|
| 上流 | 00-serial-architecture-and-scope-baseline | Sheets input / D1 canonical の基準線 |
| 下流 | 03-serial-data-source-and-storage-contract | secret名一覧, Sheet access contract |
| 下流 | 04-serial-cicd-secrets-and-environment-sync | secret名一覧（全4変数） |
| 下流 | 05b-parallel-smoke-readiness-and-handoff | sheets-access-contract.md |
| 並列 | 01a-parallel-github-and-branch-governance | 同Wave、独立 |
| 並列 | 01b-parallel-cloudflare-base-bootstrap | 同Wave、独立 |
