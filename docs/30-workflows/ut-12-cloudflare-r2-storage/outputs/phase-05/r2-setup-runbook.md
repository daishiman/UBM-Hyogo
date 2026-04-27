# Phase 5 成果物: R2 セットアップ runbook (r2-setup-runbook.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 |
| Phase | 5 / 13 |
| 作成日 | 2026-04-27 |
| 種別 | spec_created / docs-only |
| 実行主体 | future-file-upload-implementation 担当者 |
| 前提 | Phase 4 precheck-checklist 全 PASS |

## 1. 全体フロー

```
1. R2 バケット作成 (staging → prod)
   ↓
2. wrangler.toml 追記 (apps/api のみ)
   ↓
3. 専用 R2 Token 作成 (採用案D)
   ↓
4. CORS 設定適用
   ↓
5. smoke test (PUT/GET) on staging
   ↓
6. binding-name-registry.md 作成（下流公開）
```

## 2. ステップ 1: R2 バケット作成

### wrangler CLI 経路（推奨）

```bash
# staging から
wrangler r2 bucket create ubm-hyogo-r2-staging

# production
wrangler r2 bucket create ubm-hyogo-r2-prod

# 確認
wrangler r2 bucket list
```

### Dashboard 経路（代替）

1. Cloudflare Dashboard > R2 > Overview
2. `Create bucket` をクリック
3. Name: `ubm-hyogo-r2-staging` → Location: 自動 → Public access: **無効**
4. 同手順で `ubm-hyogo-r2-prod` を作成

### 記録項目

| 項目 | 値 |
| --- | --- |
| 作成日時 | TBD（Phase 5 実行時） |
| 作成経路 | wrangler / Dashboard |
| 実行者 | TBD |
| バケット名 | ubm-hyogo-r2-staging / ubm-hyogo-r2-prod |
| Public access | 無効（採用案F） |

## 3. ステップ 2: wrangler.toml 追記

`apps/api/wrangler.toml` に以下を追記する（実適用は将来タスク）:

```toml
[env.staging]
# R2 binding: file uploads/downloads via apps/api only (不変条件 5)
[[env.staging.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ubm-hyogo-r2-staging"

[env.production]
# R2 binding: file uploads/downloads via apps/api only (不変条件 5)
[[env.production.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ubm-hyogo-r2-prod"
```

> `apps/web/wrangler.toml` には**追加しない**（不変条件 5）。

### 構文検証

```bash
wrangler deploy --dry-run --env staging
wrangler deploy --dry-run --env production
```

期待: バインディング `R2_BUCKET` が出力に表示される。エラーなし。

## 4. ステップ 3: 専用 R2 Token 作成（採用案D）

1. Cloudflare Dashboard > My Profile > API Tokens > Create Token
2. Custom Token を選択
3. 設定:
   - Token name: `ubm-hyogo-r2-token`
   - Permissions: Account > **Workers R2 Storage: Edit**（最小権限）
   - Account Resources: 当該アカウントのみ
   - TTL: 90 日
4. `Create Token` → 表示された Token 値を即座に GitHub Secrets に登録

```bash
# GitHub Secrets 登録（gh CLI）
gh secret set CLOUDFLARE_R2_TOKEN
# プロンプトで Token 値を入力（CLI ヒストリに残さない）
```

> Token 値は本書・コミット・チャットに**絶対に貼り付けない**。

### 記録項目

| 項目 | 値 |
| --- | --- |
| Token 名 | `ubm-hyogo-r2-token` |
| Token ID（Cloudflare 表示） | TBD（記録のみ / 実値ではなく ID） |
| GitHub Secrets キー | `CLOUDFLARE_R2_TOKEN` |
| TTL | 90 日 |
| Rotation 次回予定 | 作成日 + 90 日 |

## 5. ステップ 4: CORS 設定適用

```bash
# staging
wrangler r2 bucket cors put ubm-hyogo-r2-staging --rules ./cors-staging.json

# production
wrangler r2 bucket cors put ubm-hyogo-r2-prod --rules ./cors-prod.json

# 確認
wrangler r2 bucket cors get ubm-hyogo-r2-staging
wrangler r2 bucket cors get ubm-hyogo-r2-prod
```

`cors-staging.json` / `cors-prod.json` は `outputs/phase-02/cors-policy-design.md` のサンプルを使用。AllowedOrigins は UT-16 完了前は `<env-specific-origin>` を実 origin に置換（Phase 5 実行時）。

> UT-16 完了後の差し替え手順は Phase 12 implementation-guide 参照。

## 6. ステップ 5: smoke test (staging)

```bash
# テストファイル準備
echo "smoke-test-$(date -u +%Y%m%dT%H%M%SZ)" > /tmp/smoke-test.txt

# PUT
wrangler r2 object put ubm-hyogo-r2-staging/smoke-test.txt --file /tmp/smoke-test.txt

# GET
wrangler r2 object get ubm-hyogo-r2-staging/smoke-test.txt --file /tmp/smoke-test-out.txt

# 一致確認
diff /tmp/smoke-test.txt /tmp/smoke-test-out.txt && echo "OK" || echo "FAIL"

# 後片付け
wrangler r2 object delete ubm-hyogo-r2-staging/smoke-test.txt
rm /tmp/smoke-test.txt /tmp/smoke-test-out.txt
```

> production への smoke test は Phase 3 review-decision.md に従い**実施しない**（staging で AC-4 充足）。

実行ログは `smoke-test-result.md` に記録。

## 7. ステップ 6: binding-name-registry.md 作成

下流タスク向けに `binding-name-registry.md` を作成（同 phase 別ファイル）。

## 8. UT-16 連携 TODO（Phase 12 申し送り）

- AllowedOrigins を実本番ドメインに差し替え
- Public Bucket Domain の検討（`public/` prefix 限定）
- Cache Rules 設定（Class B ops 削減）

## 9. AC との対応

| AC | 充足箇所 |
| --- | --- |
| AC-1 | ステップ 1（バケット命名・作成）|
| AC-2 | ステップ 2（wrangler.toml 追記） |
| AC-3 | ステップ 3（専用 Token） |
| AC-4 | ステップ 5（smoke test） |
| AC-5 | ステップ 4（CORS） |
| AC-6 | r2-architecture-design.md（モニタリング章） |
| AC-7 | binding-name-registry.md |
| AC-8 | ステップ 1（Public access 無効） + 本書「UT-16 連携 TODO」 |

## 10. 完了条件チェック

- [x] 6 ステップが順序立てて記載
- [x] wrangler / Dashboard 両経路を併記
- [x] AllowedOrigins プレースホルダ表記
- [x] smoke test の後片付けが含まれる
- [x] 機密情報の直書きなし
- [x] AC 対応表が完備
