# Phase 2: 既存資産インベントリ・参照経路解析

## 目的

新規 runbook 2 本が参照する既存資産（workflow YAML / template runbook / 親 index / 1Password 参照名）を実測し、文面が依存する値を確定する。

## 既存資産マッピング

| 項目 | 実在パス | 役割 |
|------|---------|------|
| 親 workflow index | `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/index.md` | In-scope 定義の正本 |
| Template runbook | `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | 7 章立ての canonical template（`staging-runtime-smoke` 用） |
| 参照 workflow | `.github/workflows/web-cd.yml` | `secrets.CLOUDFLARE_API_TOKEN` を参照する job 定義 |
| task-01 | `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/` | workflow 側参照名整合の完了済 task |
| task-02 | `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/task-02-runtime-smoke-staging-secrets-provisioning/` | `staging-runtime-smoke` secret provisioning 完了済 task |
| 元 unassigned spec | `docs/30-workflows/unassigned-task/ci-secret-alignment-followup-002-staging-production-secret-runbook.md` | 単一ファイル仕様（Phase 4 構成）。本 workflow が formalize する |

## 必要 secret 一覧（最終確定）

| secret 名 | 対象 environment | 取得元（参照のみ） | 投入コマンド |
|-----------|-----------------|------------------|-------------|
| `CLOUDFLARE_API_TOKEN` | `staging` | `op://UBM-Hyogo/Cloudflare API Token (staging)/credential` | `gh secret set CLOUDFLARE_API_TOKEN --env staging` |
| `CLOUDFLARE_API_TOKEN` | `production` | `op://UBM-Hyogo/Cloudflare API Token (production)/credential` | `gh secret set CLOUDFLARE_API_TOKEN --env production` |

> **注**: `op://` 参照名 (`UBM-Hyogo/Cloudflare API Token (staging)`) は 1Password 側の実 Item 名と一致させる必要がある。実装サイクルで `op` CLI で Item の存在確認を行ってから記述する。Item 名が異なる場合は Phase 4 Open Questions で確定する。

## 非対象 (out-of-scope) の確認

| 項目 | 理由 |
|------|------|
| `CLOUDFLARE_ACCOUNT_ID` | 非機密値のため GitHub Variables (`vars.CLOUDFLARE_ACCOUNT_ID`) 側で管理。Environment Secret に投入してはいけない。 |
| `staging-runtime-smoke` 用 5 secret | task-02 で完了済。本 runbook の対象は `web-cd` 経路の deploy 用 token のみ。 |

## workflow YAML 引用（参照名の正本）

`.github/workflows/web-cd.yml` の job 定義から `CLOUDFLARE_API_TOKEN` 参照箇所を引用する。実装時に以下コマンドで現行を確認する:

```bash
grep -nE 'CLOUDFLARE_API_TOKEN|environment:' .github/workflows/web-cd.yml
```

期待: `deploy-staging` job が `environment: staging` を持ち、`secrets.CLOUDFLARE_API_TOKEN` を参照。`deploy-production` job が `environment: production` を持ち、同 secret を参照。

## 1Password 正本 Item の存在確認手順

```bash
# 実値は表示しない (read-only 一覧のみ)
op item list --vault UBM-Hyogo 2>&1 | grep -iE 'cloudflare.*(staging|production)' || true
```

ヒット 0 の場合は Phase 4 Open Questions に escalate する。

## 完了条件

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 2 |
| 状態 | completed |

## 実行タスク

- 既存資産と参照 workflow を確認する。

## 参照資料

- `.github/workflows/web-cd.yml`
- `runbooks/secret-provisioning.md`

## 成果物/実行手順

- 既存資産マッピングと secret 一覧。

## 統合テスト連携

- workflow 実行は行わず、Phase 11 grep gate で参照名を確認する。

- 既存資産パスが全件実在することを確認した
- 必要 secret が `CLOUDFLARE_API_TOKEN` 1 件のみであることを workflow YAML から確認した
- 1Password Item 参照名の確定手順が定義されている
