# Phase 1 主成果物: 要件定義

## Google Workspace 連携基盤 - 要件確定

### 目的
Google Sheets をメンバー情報の入力源として利用するための基盤を整備する。
Sheets は read-only の入力源であり、D1 が canonical DB であることを固定する。

### スコープ（含む）
- Google Cloud Project の作成
- Sheets API / Drive API の有効化
- OAuth 2.0 client の作成（Web application type）
- Service Account の作成（Sheets読み込み専用）
- Sheet access contract の文書化
- Secret 命名規則の確定

### スコープ（含まない）
- Sheets データを D1 に sync する実装
- Sheets を canonical DB として扱う設計
- 通知基盤の導入
- 本番デプロイ

### 受入条件トレース
| AC | 内容 | 本Phase確認 |
|----|------|-------------|
| AC-1 | OAuth client と service account の用途が分離されている | ✅ 分離定義済み |
| AC-2 | Google Sheet access contract が docs に残る | ✅ Phase 5 で作成 |
| AC-3 | Google secret 名が task 間で一意に統一される | ✅ 4変数を確定 |
| AC-4 | Sheets input / D1 canonical の責務が崩れない | ✅ 原則を文書化 |
| AC-5 | downstream task が参照する identifiers と secrets が明示される | ✅ 変数一覧を確定 |

### 確定したSecret/Variables
| 変数名 | 種別 | 配置先 |
|--------|------|--------|
| GOOGLE_CLIENT_ID | OAuth client id | Cloudflare Secrets |
| GOOGLE_CLIENT_SECRET | OAuth client secret | Cloudflare Secrets |
| GOOGLE_SERVICE_ACCOUNT_JSON | SA key JSON | Cloudflare Secrets |
| GOOGLE_SHEET_ID | non-secret identifier | GitHub Variables |

### 4条件評価
| 条件 | 評価 | 根拠 |
|------|------|------|
| 価値性 | PASS | Sheets入力源の責務確定で実装フェーズの迷いをゼロにする |
| 実現性 | PASS | Google Cloud無料枠内、全API無料枠内で成立 |
| 整合性 | PASS | D1=canonical DB / Sheets=input source の役割が一意 |
| 運用性 | PASS | SAキー廃棄で即時アクセス停止、rollback明確 |

### Downstream Handoff
| downstream task | 参照する成果物 | 理由 |
|-----------------|----------------|------|
| 03-serial-data-source-and-storage-contract | secret名一覧, Sheet access contract | DB/input設計の前提 |
| 04-serial-cicd-secrets-and-environment-sync | secret名一覧（全4変数） | secrets投入対象 |
| 05b-parallel-smoke-readiness-and-handoff | sheets-access-contract.md | handoff確認 |
