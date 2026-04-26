# Workflow トポロジー設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cicd-secrets-and-environment-sync |
| Phase 番号 | 2 / 13 |
| 作成日 | 2026-04-26 |
| 状態 | completed |

---

## 1. Workflow ファイル一覧

| ファイル | 略称 | 主な役割 |
| --- | --- | --- |
| `.github/workflows/ci.yml` | CI | lint / typecheck / build（品質ゲート） |
| `.github/workflows/web-cd.yml` | web-cd | apps/web のデプロイ（staging / production） |
| `.github/workflows/backend-deploy.yml` | backend-deploy | apps/api のデプロイ（staging / production） |

---

## 2. ci.yml の役割

### 目的
すべてのブランチ・PR で品質を保証する。デプロイは行わない。

### Trigger 設計

| イベント | 条件 | 実行内容 |
| --- | --- | --- |
| `push` | すべてのブランチ | lint + typecheck + build |
| `pull_request` | target: `dev`, `main` | lint + typecheck + build |

### Jobs 構成

```
ci.yml
├── job: lint
│   └── pnpm lint (全 workspace)
├── job: typecheck
│   └── pnpm typecheck (全 workspace)
└── job: build
    ├── needs: [lint, typecheck]
    ├── pnpm --filter @ubm-hyogo/web build
    └── pnpm --filter @ubm-hyogo/api build
```

### 品質ゲートとしての位置づけ

- PR を `dev` / `main` へ merge するには ci.yml の全 job が成功することを branch protection rule で必須とする
- web-cd / backend-deploy は push 直起動であり、CI 成功は merge 前の branch protection で担保する

---

## 3. web-cd の役割

### 目的
`apps/web` (Next.js + @opennextjs/cloudflare) を Cloudflare Workers にデプロイする。
`dev` ブランチへの push で staging、`main` ブランチへの push で production にデプロイする。

### Trigger 設計

| イベント | ブランチ | Path Filter | 実行環境 |
| --- | --- | --- | --- |
| `push` | `dev` | `apps/web/**`, `packages/**`, `pnpm-lock.yaml` | staging |
| `push` | `main` | `apps/web/**`, `packages/**`, `pnpm-lock.yaml` | production |

### Jobs 構成

```
web-cd.yml
└── job: deploy-web
    ├── environment: dev (staging) / main (production)
    ├── pnpm install
    ├── pnpm --filter @ubm-hyogo/web build:cloudflare
    └── pnpm --filter @ubm-hyogo/web deploy:staging / deploy:production
        └── uses: CLOUDFLARE_API_TOKEN (GitHub Environment Secret), CLOUDFLARE_ACCOUNT_ID (GitHub Variable)
```

### 環境マッピング

| ブランチ | GitHub Environment | Cloudflare Workers | D1 Database |
| --- | --- | --- | --- |
| `dev` | `dev` | `ubm-hyogo-web-staging` | staging D1 |
| `main` | `main` | `ubm-hyogo-web` | production D1 |

### Deploy承認設定

| 環境 | 承認要件 |
| --- | --- |
| `dev` GitHub Environment | 自動（承認不要） |
| `main` GitHub Environment | 自動（承認不要・CIチェック必須） |

---

## 4. backend-deploy の役割

### 目的
`apps/api` (Hono on Cloudflare Workers) を Cloudflare Workers にデプロイする。
`dev` ブランチへの push で staging、`main` ブランチへの push で production にデプロイする。

### Trigger 設計

| イベント | ブランチ | Path Filter | 実行環境 |
| --- | --- | --- | --- |
| `push` | `dev` | `apps/api/**`, `packages/**`, `pnpm-lock.yaml` | staging |
| `push` | `main` | `apps/api/**`, `packages/**`, `pnpm-lock.yaml` | production |

### Jobs 構成

```
backend-deploy.yml
└── job: deploy-api
    ├── environment: dev (staging) / main (production)
    ├── pnpm install
    ├── pnpm --filter @ubm-hyogo/api build
    └── pnpm --filter @ubm-hyogo/api deploy:staging / deploy:production
        └── uses: CLOUDFLARE_API_TOKEN (GitHub Environment Secret), CLOUDFLARE_ACCOUNT_ID (GitHub Variable)
```

### 環境マッピング

| ブランチ | GitHub Environment | Cloudflare Workers | D1 Database |
| --- | --- | --- | --- |
| `dev` | `dev` | `ubm-hyogo-api-staging` | staging D1 |
| `main` | `main` | `ubm-hyogo-api` | production D1 |

---

## 5. dev / main の Trigger 設計

### ブランチ戦略との対応

```
feature/* ──push──→ CI のみ実行（デプロイなし）
    │
    └──PR──→ dev ──push──→ CI + web-cd(staging) + backend-deploy(staging)
                 │
                 └──PR + CI──→ main ──push──→ CI + web-cd(production) + backend-deploy(production)
```

### Trigger 決定理由

| ブランチ | デプロイ trigger | 理由 |
| --- | --- | --- |
| `feature/*` | なし | staging / production を汚染しない。CI のみで品質を確認 |
| `dev` | staging へ自動デプロイ | staging で動作確認できる状態を常に保つ |
| `main` | production へ CI 成功後デプロイ | PR 経由と CI 必須チェックで意図しない本番デプロイを防ぐ |

---

## 6. Mermaid フロー図

### 6.1 全体フロー

```mermaid
flowchart TD
    A[feature/* branch] -->|push| B[ci.yml]
    A -->|PR open| C[ci.yml PR check]

    B --> B1{CI PASS?}
    B1 -->|No| FAIL1[❌ merge blocked]
    B1 -->|Yes| D[PR → dev]

    C --> C1{CI PASS?}
    C1 -->|No| FAIL2[❌ PR blocked]
    C1 -->|Yes| D

    D -->|merge| E[dev branch push]

    E --> F[ci.yml]
    E --> G{path filter}

    F --> F1{CI PASS?}
    F1 -->|Yes + apps/web| H[web-cd staging]
    F1 -->|Yes + apps/api| I[backend-deploy staging]

    G -->|apps/web/**| H
    G -->|apps/api/**| I
    G -->|packages/**| H
    G -->|packages/**| I

    H --> H1[Cloudflare Workers: ubm-hyogo-web-staging]
    I --> I1[Cloudflare Workers: ubm-hyogo-api-staging]

    H1 --> J[Staging 動作確認]
    I1 --> J

    J -->|PR + CI| K[main branch push]

    K --> L[ci.yml]
    K --> M{path filter}

    L --> L1{CI PASS?}
    M -->|apps/web/**| N[web-cd production]
    M -->|apps/api/**| O[backend-deploy production]
    M -->|packages/**| N
    M -->|packages/**| O

    N --> P{CI 成功?}
    O --> Q{CI 成功?}

    P -->|Approved| N1[Cloudflare Workers: ubm-hyogo-web]
    Q -->|Approved| O1[Cloudflare Workers: ubm-hyogo-api]
```

### 6.2 Secret フロー

```mermaid
flowchart LR
    subgraph 1Password
        OP1[GOOGLE_CLIENT_SECRET]
        OP2[GOOGLE_SERVICE_ACCOUNT_JSON]
        OP3[AUTH_SECRET]
    end

    subgraph "GitHub Secrets"
        GH1[CLOUDFLARE_API_TOKEN_DEV]
        GH2[CLOUDFLARE_API_TOKEN_MAIN]
        GH3[CLOUDFLARE_ACCOUNT_ID]
    end

    subgraph "Cloudflare Secrets (staging)"
        CS1[GOOGLE_CLIENT_SECRET]
        CS2[GOOGLE_SERVICE_ACCOUNT_JSON]
        CS3[AUTH_SECRET]
    end

    subgraph "Cloudflare Secrets (production)"
        CP1[GOOGLE_CLIENT_SECRET]
        CP2[GOOGLE_SERVICE_ACCOUNT_JSON]
        CP3[AUTH_SECRET]
    end

    subgraph "GitHub Actions (CI/CD)"
        GA1[web-cd / backend-deploy]
    end

    subgraph "Workers Runtime"
        WR1[apps/web staging]
        WR2[apps/api staging]
        WR3[apps/web production]
        WR4[apps/api production]
    end

    OP1 -->|手動投入| CS1
    OP2 -->|手動投入| CS2
    OP3 -->|手動投入| CS3
    OP1 -->|手動投入| CP1
    OP2 -->|手動投入| CP2
    OP3 -->|手動投入| CP3

    GH1 -->|wrangler deploy| GA1
    GH2 -->|wrangler deploy| GA1
    GH3 -->|wrangler deploy| GA1

    CS1 -->|binding| WR1
    CS1 -->|binding| WR2
    CP1 -->|binding| WR3
    CP2 -->|binding| WR4
```

### 6.3 Rotation / Revoke フロー

```mermaid
flowchart TD
    subgraph "定期 Rotation"
        R1[新しいクレデンシャルを発行]
        R2[Cloudflare Secret を更新\nwrangler secret put]
        R3[GitHub Secret を更新\ngh secret set]
        R4[1Password を更新]
        R5[旧クレデンシャルを revoke]
        R1 --> R2 --> R4 --> R5
        R1 --> R3 --> R4
    end

    subgraph "漏洩時 Revoke"
        E1[漏洩を検知]
        E2{種別?}
        E3[Cloudflare API Token を revoke\n新 Token を発行・GitHub Secrets 更新]
        E4[Google クレデンシャルを revoke\n新クレデンシャルを発行・Cloudflare Secrets 更新]
        E5[アクセスログ確認]
        E6[インシデントレポート作成]
        E1 --> E2
        E2 -->|deploy secret| E3 --> E5 --> E6
        E2 -->|runtime secret| E4 --> E5 --> E6
    end
```

---

## 7. path filter 設計の詳細

### 共通パッケージの扱い

`packages/**` の変更は web と api の両方に影響する可能性があるため、両 workflow を trigger する設計とする。

| 変更ファイル | web-cd | backend-deploy | 理由 |
| --- | --- | --- | --- |
| `apps/web/**` のみ | ✓ | ✗ | web のみの変更 |
| `apps/api/**` のみ | ✗ | ✓ | api のみの変更 |
| `packages/**` | ✓ | ✓ | 共通パッケージは両方に影響する可能性 |
| `pnpm-lock.yaml` | ✓ | ✓ | 依存関係変更は両方を再ビルドして検証 |
| `.github/workflows/**` | ✗ | ✗ | workflow ファイル自体の変更はデプロイしない |
| `docs/**` | ✗ | ✗ | ドキュメントのみの変更はデプロイしない |

### path filter の注意点

- `packages/**` の変更が staging を汚染しないよう、変更が意図的であることを PR でレビューする
- 将来的に `packages/**` の影響範囲が明確になれば、より細かい path filter に移行する
