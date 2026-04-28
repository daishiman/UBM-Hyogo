# Phase 2: 本番デプロイ設計

## 1. デプロイ全体フロー

```mermaid
flowchart TD
  A[Phase 4 verify suite PASS] --> B[Phase 4 GO 判定取得]
  B --> C[Step 1: D1 バックアップ取得 (AC-7)]
  C --> D[Step 2: D1 migrations apply (AC-3)]
  D --> E[Step 3: apps/api wrangler deploy (AC-2)]
  E --> F[Step 4: apps/web wrangler deploy (AC-1)]
  F --> G[Step 5: 直後 smoke (AC-1/AC-2/AC-4)]
  G --> H[Phase 11 smoke test 全件 (AC-5)]
  H --> I[Phase 5 deploy-execution-log.md 完成 (AC-6)]
  G -- FAIL --> R[Phase 6 ロールバック発動 (AC-8)]
  D -- FAIL --> R
  E -- FAIL --> R
  F -- FAIL --> R
```

## 2. ステップ別詳細設計

### Step 1: D1 バックアップ (AC-7 必須前置き)

```bash
TS=$(date +%Y%m%d-%H%M%S)
bash scripts/cf.sh d1 export ubm-hyogo-db-prod \
  --env production \
  --output "outputs/phase-05/backup-${TS}.sql"
shasum -a 256 "outputs/phase-05/backup-${TS}.sql"
```

- 初回は空 export を許容 (テーブル未作成のため)
- 取得証跡: `outputs/phase-05/d1-backup-evidence.md` に記録

### Step 2: D1 migrations apply (AC-3)

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production   # 適用前
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production   # 適用後
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT name FROM sqlite_master WHERE type='table';"
```

対象: `apps/api/migrations/0001_init.sql` (1 件)

### Step 3: apps/api Workers デプロイ (AC-2)

```bash
mise exec -- pnpm --filter @ubm-hyogo/api build
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env production
```

- name: `ubm-hyogo-api`
- D1 binding: `DB` → `ubm-hyogo-db-prod`
- compatibility_flags: `nodejs_compat`

### Step 4: apps/web デプロイ (AC-1)

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare   # OpenNext Workers ビルド (期待)
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
```

**整合性課題:**
- 現状 `apps/web/wrangler.toml` は `pages_build_output_dir = ".next"` の **Pages 形式**
- CLAUDE.md / deployment-cloudflare.md は **OpenNext Workers (`.open-next/`) 形式** を要請
- 本タスクでは現状 wrangler.toml を尊重し、形式移行は別タスク (UT-XX) に切り出す方針
- Phase 3 設計レビューで GO/NO-GO の判断材料として明示する

### Step 5: 直後 smoke (Phase 5 内 簡易確認)

```bash
curl -sI https://<web-prod-url>                         # AC-1 (200)
curl -sS https://<api-prod-host>/health                 # AC-2 (healthy)
curl -sS https://<api-prod-host>/health/db              # AC-4 (D1 SELECT OK)
```

詳細網羅 smoke は Phase 11 で実施 (S-01〜S-10)。

## 3. binding 設計

### apps/api 本番

| binding | 種別 | 値 |
| --- | --- | --- |
| `DB` | D1 | database_name = `ubm-hyogo-db-prod`, database_id は wrangler.toml に直書き (Phase 8 DRY 化検討) |
| `ENVIRONMENT` | var | `production` |
| `SHEET_ID` | var | (実 ID) |
| `FORM_ID` | var | (実 ID) |

### apps/web 本番

| binding | 種別 | 値 |
| --- | --- | --- |
| `ENVIRONMENT` | var | `production` |

→ `apps/web` から D1 直接アクセス禁止 (CLAUDE.md 不変条件 5)。

## 4. 環境固定

- `mise exec --` 経由で必ず Node 24.15.0 / pnpm 10.33.2 を保証する
- `wrangler --version` を実行ログ冒頭に記録 (4.84.1 期待)
- 認証: `wrangler whoami` で対象アカウント (UBM 兵庫) を確認後に実行

## 5. 中断ポイントと再開戦略

| 中断点 | 状態 | 再開方針 |
| --- | --- | --- |
| Step 1 失敗 | バックアップ未取得 | wrangler 認証・binding 再確認 → 再取得。AC-7 未充足の状態で Step 2 へ進まない |
| Step 2 失敗 | 部分適用の可能性 | `migrations list` で範囲確認 → リストア要否判定 (rollback-runbook.md A-3) |
| Step 3 失敗 | API 未デプロイ | 直前 deployment_id へ rollback (rollback-runbook.md W-1) |
| Step 4 失敗 | API のみ更新済 | apps/web 再ビルド・再デプロイ。問題継続時 API も rollback 検討 |
| Step 5 smoke FAIL | 全リソース更新済 | 即座に rollback-runbook.md 該当節へ |

## 6. 設計上の主要決定

1. **D1 バックアップは必須**: AC-7。初回でも空 export を取得し記録する
2. **API → Web の順でデプロイ**: API 不在で Web を出すと AC-2/AC-4 が即 FAIL するため
3. **マイグレーションは API デプロイ前に実施**: API 起動時の binding 整合性確保
4. **直後 smoke は最小 3 件のみ**: 本格網羅は Phase 11 に分離
5. **形式整合課題は本タスク範囲外**: OpenNext Workers 移行は別タスク
