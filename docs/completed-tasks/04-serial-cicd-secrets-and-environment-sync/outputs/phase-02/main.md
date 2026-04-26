# Phase 2 成果物: 設計書

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cicd-secrets-and-environment-sync |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-04-26 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | completed |

---

## 1. Workflow トポロジー設計

### 1.1 workflow の役割分離

本タスクでは GitHub Actions workflow を以下3ファイルに分離する。

| ファイル | 役割 | trigger |
| --- | --- | --- |
| `.github/workflows/ci.yml` | lint / typecheck / build の品質ゲート | `push: branches: ['**']` + `pull_request` |
| `.github/workflows/web-cd.yml` | `apps/web` のデプロイ（staging / production） | `push: branches: [dev, main]` + `paths: apps/web/**` |
| `.github/workflows/backend-deploy.yml` | `apps/api` のデプロイ（staging / production） | `push: branches: [dev, main]` + `paths: apps/api/**` |

### 1.2 ci.yml の詳細設計

**目的:** すべてのブランチ・PRで品質を保証する。デプロイは行わない。

```
trigger:
  push: branches: ['**']
  pull_request: branches: [dev, main]

jobs:
  lint:
    - pnpm install
    - pnpm lint

  typecheck:
    - pnpm install
    - pnpm typecheck

  build:
    - pnpm install
    - pnpm build
    needs: [lint, typecheck]
```

**設計方針:**
- すべてのブランチへの push で実行し、品質劣化を早期発見する
- PR の merge 条件として ci.yml の成功を必須とする（branch protection rule）
- ci.yml が失敗した場合、web-cd / backend-deploy は実行しない（依存関係で制御）

### 1.3 web-cd.yml の詳細設計

**目的:** `apps/web` の変更を staging (dev) または production (main) にデプロイする。

```
trigger:
  push:
    branches: [dev, main]
    paths:
      - 'apps/web/**'
      - 'packages/**'        # 共通パッケージの変更も対象
      - 'pnpm-lock.yaml'     # 依存関係変更時も再デプロイ

jobs:
  deploy-web:
    environment: ${{ github.ref_name }}   # "dev" or "main"
    steps:
      - pnpm install
      - pnpm --filter @ubm-hyogo/web build
      - wrangler deploy --env ${{ env.DEPLOY_ENV }}
    secrets:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**環境マッピング:**

| ブランチ | GitHub Environment | Cloudflare Environment | Workers プロジェクト |
| --- | --- | --- | --- |
| `dev` | `dev` | `staging` | `ubm-hyogo-web-staging` |
| `main` | `main` | `production` | `ubm-hyogo-web` |

### 1.4 backend-deploy.yml の詳細設計

**目的:** `apps/api` の変更を staging (dev) または production (main) にデプロイする。

```
trigger:
  push:
    branches: [dev, main]
    paths:
      - 'apps/api/**'
      - 'packages/**'
      - 'pnpm-lock.yaml'

jobs:
  deploy-api:
    environment: ${{ github.ref_name }}
    steps:
      - pnpm install
      - pnpm --filter @ubm-hyogo/api build
      - wrangler deploy --env ${{ env.DEPLOY_ENV }}
    secrets:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**環境マッピング:**

| ブランチ | GitHub Environment | Cloudflare Environment | Workers プロジェクト |
| --- | --- | --- | --- |
| `dev` | `dev` | `staging` | `ubm-hyogo-api-staging` |
| `main` | `main` | `production` | `ubm-hyogo-api` |

---

## 2. Secret Placement 設計

詳細は `outputs/phase-02/secrets-placement-matrix.md` を参照。

### 2.1 設計原則

1. **runtime secret は Cloudflare Secrets のみに存在する**: Workers の実行コンテキストから参照される値は GitHub Actions から切り離す
2. **deploy secret は GitHub Secrets のみに存在する**: CI/CD コンテキストからのみ参照され、Workers runtime には渡さない
3. **公開変数は GitHub Variables または wrangler.toml に存在する**: 暗号化不要な設定値は Secret に格上げしない
4. **ローカル正本は 1Password Environments**: 平文 `.env` は生成物であり正本ではない

### 2.2 各変数の配置決定

| 変数名 | 配置先 | 種別 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | GitHub Secrets | deploy |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Secrets | deploy |
| `GOOGLE_CLIENT_SECRET` | Cloudflare Secrets + 1Password | runtime |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Cloudflare Secrets + 1Password | runtime |

---

## 3. dev / main 環境差分

### 3.1 環境定義

| 項目 | dev (staging) | main (production) |
| --- | --- | --- |
| Workers プロジェクト (web) | `ubm-hyogo-web-staging` | `ubm-hyogo-web` |
| Workers プロジェクト (api) | `ubm-hyogo-api-staging` | `ubm-hyogo-api` |
| D1 データベース | staging 用 D1 | production 用 D1 |
| Cloudflare Secrets | dev 用セット | main 用セット |
| GitHub Environment | `dev` | `main` |
| デプロイ承認 | 不要（CI必須） | 不要（CI必須） |

### 3.2 GitHub Environment による保護

- **dev environment**: 保護ルールなし（自動デプロイ）
- **main environment**: `required_reviewers: 1` を設定し、本番デプロイに承認を必須とする

### 3.3 Cloudflare API Token の分離

dev と main で別の API Token を使用することを推奨する。

**理由:**
- dev Token が漏洩しても production を操作できない
- dev Token の rotate が production デプロイに影響しない
- rotate 頻度を dev/main で独立して設定できる

**実装:**
- GitHub Secrets に `CLOUDFLARE_API_TOKEN_DEV` と `CLOUDFLARE_API_TOKEN_MAIN` を分けて登録する
- web-cd / backend-deploy では `github.ref_name` で分岐して使用する

---

## 4. Rotation / Revoke / Rollback 方針

### 4.1 Rotation 方針

| 対象 | 頻度 | 手順概要 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` (deploy) | 90日ごと / 担当者交代時 | Cloudflare ダッシュボードで新 Token 発行 → GitHub Secrets を更新 → 旧 Token を revoke |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console の推奨に従う / 漏洩時即時 | Google Cloud Console でクライアントシークレットを再生成 → Cloudflare Secret を更新 → 1Password を更新 |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | 90日ごと / 担当者交代時 | Google Cloud Console でサービスアカウントキーを再発行 → Cloudflare Secret を更新 → 1Password を更新 |

### 4.2 Revoke 手順（漏洩時）

**deploy secret 漏洩（GitHub Secrets）の場合:**
1. Cloudflare ダッシュボードで該当 API Token を即時 revoke する
2. GitHub Secrets から該当変数を削除する
3. 新しい Token を発行し、GitHub Secrets に再登録する
4. 漏洩期間中のデプロイログを確認し、不正デプロイがないかを検証する
5. インシデントレポートを作成し、原因・影響範囲・対応を記録する

**runtime secret 漏洩（Cloudflare Secrets）の場合:**
1. Google Cloud Console / Cloudflare ダッシュボードで該当クレデンシャルを即時 revoke する
2. 新しいクレデンシャルを発行し、Cloudflare Secret を更新する
3. 1Password Environments の値を更新する
4. Workers を再デプロイしてシークレットを反映させる
5. アクセスログを確認し、不正アクセスがないかを検証する

### 4.3 Rollback 手順

**デプロイ失敗時の rollback:**

```
# Cloudflare Workers のロールバック
# wrangler rollback コマンドで直前のデプロイに戻す
wrangler rollback --env staging   # dev 環境
wrangler rollback --env production  # main 環境

# または Cloudflare ダッシュボードの Deployments タブから
# 任意のバージョンへロールバック可能
```

**Secret 更新失敗時の rollback:**
1. 1Password Environments に保存された旧値を確認する
2. Cloudflare Secret を旧値で上書きする
3. Workers を再デプロイして旧値を反映させる
4. 旧 Google クレデンシャルが revoke 済みの場合は、Google Cloud Console で再発行が必要

---

## 5. ローカル環境の 1Password 正本設計

### 5.1 1Password Environments エントリ構造

1Password の `UBM-Hyogo` Vault に以下のエントリを作成する。

```
Vault: UBM-Hyogo
├── [Dev] Runtime Secrets
│   ├── GOOGLE_CLIENT_SECRET = <dev用値>
│   └── GOOGLE_SERVICE_ACCOUNT_JSON = <dev用JSON>
└── [Main] Runtime Secrets
    ├── GOOGLE_CLIENT_SECRET = <main用値>
    └── GOOGLE_SERVICE_ACCOUNT_JSON = <main用JSON>
```

### 5.2 ローカル .env 生成手順

```bash
# 1Password CLI を使用して dev 用 .env を生成する（実値はここには記録しない）
op read "op://UBM-Hyogo/[Dev] Runtime Secrets/GOOGLE_CLIENT_SECRET" > /dev/null
# または op run を使用してコマンド実行時に環境変数を注入する
op run --env-file=.env.template -- pnpm dev
```

**.env.template（コミット対象）:**
```
GOOGLE_CLIENT_SECRET=op://UBM-Hyogo/[Dev] Runtime Secrets/GOOGLE_CLIENT_SECRET
GOOGLE_SERVICE_ACCOUNT_JSON=op://UBM-Hyogo/[Dev] Runtime Secrets/GOOGLE_SERVICE_ACCOUNT_JSON
```

**.gitignore への追加（必須）:**
```
.env
.env.local
.env.*.local
# .env.template はコミット対象のため除外しない
```

---

## 6. 4条件評価

| 条件 | 評価観点 | 判定 | 根拠 |
| --- | --- | --- | --- |
| **価値性** | 設計が要件の価値を実現できるか | **PASS** | secret の分離・workflow の分離・runbook の定義により、AC-1〜5 すべてを直接解決する設計になっている。複雑性を最小限に抑えつつ、インシデント対応コストを明確に削減できる。 |
| **実現性** | 設計を無料・既存スタックで実現できるか | **PASS** | GitHub Actions / Cloudflare Workers / 1Password はすべて既存サービス。追加費用なし。wrangler の `--env` フラグと GitHub Environments は無料プランで利用可能。 |
| **整合性** | 設計各部が矛盾なく整合しているか | **PASS** | `dev` branch → `dev` GitHub Environment → staging Cloudflare Workers のマッピングが一貫している。secret の分類（runtime/deploy/public）が置き場の設計に直結している。 |
| **運用性** | 運用・rotate・rollback が実行可能か | **PASS** | rotation / revoke / rollback の手順を明記した。wrangler rollback により Cloudflare Workers は素早く前バージョンへ戻せる。1Password を正本とすることで旧値の参照が常に可能。 |

---

## 7. 次 Phase（設計レビュー）への引き継ぎ事項

### 設計レビューで確認が必要な事項

| 項目 | 優先度 | 説明 |
| --- | --- | --- |
| `packages/**` の path filter | 高 | 共通パッケージ変更時に web / api 両方をデプロイする設計が適切か。CI のみで十分かを検討する |
| dev API Token の分離 | 高 | `CLOUDFLARE_API_TOKEN_DEV` / `CLOUDFLARE_API_TOKEN_MAIN` に分けることの運用コストを評価する |
| `GOOGLE_SERVICE_ACCOUNT_JSON` のサイズ | 中 | Cloudflare Secret の 1エントリあたりサイズ制限（1KB）を超える場合の代替案を検討する |
| main environment の承認不要設定 | 中 | 正本仕様どおり Required reviewers 0名、CI必須で成立するかを確認する |

### blockers（なし）

現時点でブロッカーはない。

### 関連成果物

- `outputs/phase-02/secrets-placement-matrix.md`: 変数ごとの配置と理由の詳細表
- `outputs/phase-02/workflow-topology.md`: Mermaid フロー図を含む workflow 設計の可視化
