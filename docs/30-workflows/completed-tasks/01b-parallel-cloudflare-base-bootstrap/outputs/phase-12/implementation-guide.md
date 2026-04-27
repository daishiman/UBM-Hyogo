# Implementation Guide: cloudflare-base-bootstrap

> タスクID: 01b-parallel-cloudflare-base-bootstrap
> 作成日: 2026-04-23
> status: spec_created（docs-only タスク）

---

## Part 1: 中学生レベル概念説明

### このタスクで何をしたか？

**身近な例え話で説明します:**

| 技術用語 | 例え話 |
| --- | --- |
| Google Sheets | 受付ノート（ユーザーがデータを入力する場所） |
| Cloudflare D1 | 図書館の正本台帳（システムの本物のデータが入っている場所） |
| Cloudflare Pages | 本の展示棚（ウェブサイトを見せる場所） |
| Cloudflare Workers | 司書さん（API リクエストを処理する人） |
| GitHub | 変更履歴ノート（誰がいつ何を変えたか記録する場所） |
| 1Password | 鍵の保管庫（パスワードや秘密情報を安全に保管する場所） |

**このタスクでやったこと:**
「受付ノート（Sheets）・展示棚（Pages）・司書さん（Workers）・台帳（D1）の役割を明確に分け、それぞれがどのように連携するかを設計書に書いた」

**なぜ必要だったか:**
「同じ名前のものを2つ作ってしまったり、本番環境と開発環境を混同してしまうミスを事前に防ぐため」

---

## Part 2: 技術者レベル詳細

### タスク概要

| 項目 | 内容 |
| --- | --- |
| task root | `doc/01b-parallel-cloudflare-base-bootstrap` |
| 実行種別 | parallel（Wave 1） |
| タスク種別 | spec_created / docs_only |
| upstream | `00-serial-architecture-and-scope-baseline` |
| downstream | `02-serial-monorepo-runtime-foundation` / `03-serial-data-source-and-storage-contract` / `04-serial-cicd-secrets-and-environment-sync` |

### 主要成果物

| 成果物 | パス | 下流タスクへの影響 |
| --- | --- | --- |
| Cloudflare トポロジー | `outputs/phase-02/cloudflare-topology.md` | 02/03/04 が参照するサービス名・DB名・Secret 名の source-of-truth |
| Bootstrap Runbook | `outputs/phase-05/cloudflare-bootstrap-runbook.md` | インフラ担当者がゼロから Cloudflare リソースを作成する際の手順書 |
| Token スコープ表 | `outputs/phase-05/token-scope-matrix.md` | 04-cicd-secrets での API Token 作成の仕様 |
| Smoke Test Checklist | `outputs/phase-11/manual-cloudflare-checklist.md` | 実環境での最終確認チェックリスト |

### 確定済み設計

| リソース | production | staging |
| --- | --- | --- |
| Cloudflare Pages | `ubm-hyogo-web` | `ubm-hyogo-web-staging` |
| Cloudflare Workers | `ubm-hyogo-api` | `ubm-hyogo-api-staging` |
| Cloudflare D1 | `ubm-hyogo-db-prod` | `ubm-hyogo-db-staging` |
| Git ブランチ | `main` | `dev` |

### 受入条件（AC）最終判定

| AC | 内容 | 判定 |
| --- | --- | --- |
| AC-1 | Pages/Workers が分離されている（wrangler.toml `name` フィールドで確認） | PASS |
| AC-2 | staging = `dev`、production = `main` | PASS |
| AC-3 | API Token が3スコープのみ（Pages:Edit + Workers:Edit + D1:Edit） | PASS |
| AC-4 | Pages build count / Workers req/day が Dashboard で追跡可能 | PASS |
| AC-5 | Pages と Workers のロールバックが独立して機能する | PASS |

### MINOR M-01 対応

- `deployment-cloudflare.md` の `develop` → `dev` 統一: **完了**

### Secrets 設計

| 変数名 | 種別 | 配置先 | 実投入タイミング |
| --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | deploy auth | GitHub Secrets | 04-cicd-secrets |
| `CLOUDFLARE_ACCOUNT_ID` | account id | GitHub Secrets | 04-cicd-secrets |
| `OPENAI_API_KEY` | runtime secret | Cloudflare Workers Secrets | 04-cicd-secrets |
| `ANTHROPIC_API_KEY` | runtime secret | Cloudflare Workers Secrets | 04-cicd-secrets |

### 未タスク（初回スコープ外）

| ID | 内容 |
| --- | --- |
| UN-01 | Cloudflare R2 ストレージの設定 |
| UN-02 | Cloudflare KV セッションキャッシュの設定 |
| UN-03 | Cloudflare Zero Trust の認証設定 |
| UN-04 | WAF / Rate Limiting ルールの設定 |
| UN-05 | カスタムドメイン設定 |

### 4条件最終評価

| 条件 | 判定 |
| --- | --- |
| 価値性 | PASS |
| 実現性 | PASS |
| 整合性 | PASS |
| 運用性 | PASS |
