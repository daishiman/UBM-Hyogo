# Phase 1: 正本仕様抽出マップ

## 1. 参照正本

| 正本仕様 | パス | 用途 |
| --- | --- | --- |
| deployment-cloudflare.md | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Cloudflare Workers / D1 デプロイ手順・wrangler 操作の正本 |
| deployment-core.md | `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | go-live / rollback 方針の正本 |
| 03-serial runbook | `docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/index.md` | D1 runbook (マイグレーション適用手順) |
| 04-serial runbook | `docs/30-workflows/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md` | 本番 Secrets 配置確認手順 |
| 05b-parallel handoff | `docs/30-workflows/01-infrastructure-setup/05b-parallel-smoke-readiness-and-handoff/index.md` | readiness checklist の AC 整合 |
| CLAUDE.md | `CLAUDE.md` | ブランチ戦略・シークレット管理方針・不変条件 |

## 2. Phase × 正本対応表

| Phase | 主要参照 | 抽出ポイント |
| --- | --- | --- |
| 1 (要件定義) | deployment-core.md / index.md (本タスク) | taskType / AC / 4 条件評価観点 |
| 2 (設計) | deployment-cloudflare.md / 03-serial / 04-serial | wrangler コマンド・binding 設計・D1 runbook |
| 3 (設計レビュー) | 自タスク phase-02.md | 設計レビュー観点・GO/NO-GO 判定基準 |
| 4 (事前検証) | deployment-cloudflare.md / 04-serial / 05b-parallel | verify suite (whoami / pages list / d1 list / secret list) |
| 5 (本番実行) | deployment-cloudflare.md (wrangler コマンド仕様) | D1 export → migrations apply → wrangler deploy |
| 6 (異常系) | deployment-cloudflare.md (rollback コマンド) | wrangler rollback / d1 execute --file リストア |
| 7 (検証網羅性) | 自タスク AC / 上流タスク dependency edge | AC matrix / dependency edge coverage |
| 8 (DRY 化・runbook) | 02-serial / 04-serial runbook | 章立て・参照関係・runbook 統合 |
| 9 (品質保証) | CLAUDE.md (シークレット管理) / 04-serial | secret hygiene / 無料枠制約 |
| 10 (GO/NO-GO) | deployment-core.md (go-live 方針) | 4 条件最終評価 / エスカレーション |
| 11 (smoke test) | deployment-cloudflare.md (curl / wrangler tail) | smoke シナリオ S-01〜S-10 |
| 12 (ドキュメント) | spec-update-workflow.md / aiworkflow-requirements references | runbook 統合・spec 反映・implementation-guide |
| 13 (PR) | task-specification-creator (Phase 13 テンプレ) | PR 作成・Issue 連携 |

## 3. 採用するコマンドテンプレ

### D1 関連
```bash
# バックアップ取得 (AC-7 必須前置き)
wrangler d1 export <DB_NAME> --env production --output backup-<TS>.sql

# マイグレーション適用 (AC-3)
wrangler d1 migrations apply <DB_NAME> --env production
wrangler d1 migrations list <DB_NAME> --env production

# クエリ実行 (smoke / リストア)
wrangler d1 execute <DB_NAME> --env production --command "SELECT name FROM sqlite_master WHERE type='table';"
wrangler d1 execute <DB_NAME> --env production --file backup-<TS>.sql
```

### Workers 関連
```bash
# デプロイ (AC-1 / AC-2)
wrangler deploy --env production                                   # apps/api
wrangler deploy --config apps/web/wrangler.toml --env production   # apps/web

# デプロイ履歴・ロールバック
wrangler deployments list --env production
wrangler rollback <version_id> --env production
```

### Secrets 関連
```bash
wrangler secret list --env production
wrangler secret put <NAME> --env production
```

### smoke 関連
```bash
curl -sI https://<web-url>                       # AC-1
curl -sS https://<api-host>/health               # AC-2
curl -sS https://<api-host>/health/db            # AC-4
wrangler tail --env production --format pretty   # ログ監視
```

## 4. 採用する命名規則

| 項目 | ルール | 例 |
| --- | --- | --- |
| Cloudflare resource name | kebab-case | `ubm-hyogo-api`, `ubm-hyogo-web` |
| D1 database name | `ubm-hyogo-db-{env}` | `ubm-hyogo-db-prod` / `ubm-hyogo-db-staging` |
| Workers service name (staging) | `<service>-staging` | `ubm-hyogo-api-staging` |
| binding name | 全環境共通 | `DB` (D1) |
| backup file name | `backup-<TS>.sql` | `backup-20260427-150000.sql` |
| wrangler env | `production` / `staging` | (`local` 開発は `wrangler dev` で emulation) |

## 5. 不変条件 (CLAUDE.md より抽出)

1. 実フォームの schema をコードに固定しすぎない
2. consent キーは `publicConsent` と `rulesConsent` に統一
3. `responseEmail` はフォーム項目ではなく system field
4. Google Form schema 外のデータは admin-managed data として分離
5. **D1 への直接アクセスは `apps/api` に閉じる (`apps/web` から直接アクセス禁止)** ← 本タスク重要
6. GAS prototype は本番バックエンド仕様に昇格させない
7. MVP では Google Form 再回答を本人更新の正式な経路とする

## 6. シークレット管理方針 (CLAUDE.md より)

| 種別 | 管理場所 |
| --- | --- |
| ランタイムシークレット | Cloudflare Secrets |
| CI/CD シークレット | GitHub Secrets |
| 非機密設定値 | GitHub Variables |
| ローカル秘密情報の正本 | 1Password Environments |

→ 平文 `.env` のコミット禁止。Phase 9 secret hygiene で再確認。

## 7. ブランチ戦略 (CLAUDE.md より)

```
feature/* --PR--> dev --PR--> main
  (local)       (staging)   (production)
```

- 本タスク Phase 13 PR 作成時は `feature/*` → `dev` (またはユーザー指示に従い `main` 直接) を選択。
- 本タスクは `feat/wt-12` ブランチで進行中 (Phase 1 時点)。
