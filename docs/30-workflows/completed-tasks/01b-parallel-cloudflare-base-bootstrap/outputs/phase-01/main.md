# Phase 1 成果物: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 名称 | 要件定義 |
| 状態 | completed |
| 作成日 | 2026-04-23 |

## 1. スコープ確定

### 含む

| リソース | production | staging |
| --- | --- | --- |
| Cloudflare Pages | `ubm-hyogo-web` | `ubm-hyogo-web-staging` |
| Cloudflare Workers | `ubm-hyogo-api` | `ubm-hyogo-api-staging` |
| Cloudflare D1 | `ubm-hyogo-db-prod` | `ubm-hyogo-db-staging` |
| API Token スコープ | Pages:Edit + Workers:Edit + D1:Edit | 同左 |

### 含まない

- 本番デプロイの実行
- 通知基盤の導入（Discord/Slack）
- 有料オプション（KV・R2）の導入
- CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID の実投入 → 04-cicd-secrets で実施

## 2. 正本仕様との整合確認

| 仕様 | パス | 整合状態 |
| --- | --- | --- |
| Cloudflare セットアップ | deployment-cloudflare.md | OK（`develop`→`dev` 統一は Phase 12 で対応） |
| Pages/Workers/D1 役割 | deployment-core.md | OK |
| token 配置 | deployment-secrets-management.md | OK |
| web/api 分離 | architecture-overview-core.md | OK |
| ブランチ戦略 | deployment-branch-strategy.md | OK（`dev`→staging, `main`→production） |

### legacy drift

- `deployment-cloudflare.md` に `develop` ブランチ表記が残存 → MINOR M-01 として Phase 12 で修正

## 3. デプロイ経路分離の確定

- OpenNext 統合（Pages + Workers 一体構成）は **採用しない**
- `apps/web`（Next.js）→ Cloudflare Pages 経由
- `apps/api`（Hono）→ Cloudflare Workers 経由

## 4. ブランチ/環境対応

| ブランチ | 環境 | Pages プロジェクト | Workers サービス |
| --- | --- | --- | --- |
| `dev` | staging | `ubm-hyogo-web-staging` | `ubm-hyogo-api-staging` |
| `main` | production | `ubm-hyogo-web` | `ubm-hyogo-api` |

## 5. Secret 配置方針

| 変数名 | 種別 | 配置先 | 確定 Phase |
| --- | --- | --- | --- |
| CLOUDFLARE_API_TOKEN | deploy auth | GitHub Secrets | 04 Phase 5 |
| CLOUDFLARE_ACCOUNT_ID | account id | GitHub Secrets | 04 Phase 5 |
| OPENAI_API_KEY | runtime secret | Cloudflare Workers Secrets | 04 Phase 5 |
| ANTHROPIC_API_KEY | runtime secret | Cloudflare Workers Secrets | 04 Phase 5 |

## 6. 4条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | インフラ担当者の手動セットアップミスを防ぎ、dev/main 環境の混乱を解消する |
| 実現性 | PASS | Pages 500ビルド/月、Workers 100k req/day、D1 5GB の無料枠で初回スコープ成立 |
| 整合性 | PASS | dev→staging, main→production のブランチ対応が deployment-branch-strategy.md で一意に確定 |
| 運用性 | PASS | Pages Dashboard 1クリックロールバック + Workers `wrangler rollback` で経路が分離されている |

## 7. downstream handoff

| 下流タスク | 参照する成果物 | 用途 |
| --- | --- | --- |
| 02-serial-monorepo-runtime-foundation | wrangler.toml サービス名 | `ubm-hyogo-web` / `ubm-hyogo-api` |
| 03-serial-data-source-and-storage-contract | D1 database 名 | `ubm-hyogo-db-prod` / `ubm-hyogo-db-staging` |
| 04-serial-cicd-secrets-and-environment-sync | GitHub Secrets 名 | `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` |

## 完了条件チェック

- [x] 主成果物が作成済み
- [x] 正本仕様参照が残っている
- [x] downstream handoff が明記されている
- [x] 4条件評価完了
- [x] legacy drift（develop→dev）を Phase 12 行きとして記録済み

## 次 Phase への引き継ぎ

Phase 2 では、本 Phase で確定した設計方針（サービス名・ブランチ対応・シークレット配置方針）を具体的な設計ドキュメントに落とし込む。
